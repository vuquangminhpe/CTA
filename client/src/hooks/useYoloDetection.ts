// AI Exam Proctoring — useYoloDetection hook
// Manages dual YOLO Workers (Detect & Pose), captures frames, and returns results

import { useState, useEffect, useRef, useCallback } from 'react'
import type {
  DetectionBox,
  WorkerResponse
  // WorkerInitMessage,
  // WorkerDetectMessage,
  // WorkerDestroyMessage
} from '../utils/aiTypes'
import { AI_CONFIG } from '../utils/aiTypes'
import { captureImageData } from '../utils/preprocess'

interface UseYoloDetectionOptions {
  enabled?: boolean
  videoRef: React.RefObject<HTMLVideoElement | null>
}

interface UseYoloDetectionResult {
  isLoading: boolean
  isReady: boolean
  error: string | null
  executionProvider: string | null
  detections: DetectionBox[]
  keypoints: number[][]
  fps: number
  inferenceTimeMs: number
}

export function useYoloDetection({ enabled = true, videoRef }: UseYoloDetectionOptions): UseYoloDetectionResult {
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [executionProvider, setExecutionProvider] = useState<string | null>(null)

  const [detections, setDetections] = useState<DetectionBox[]>([])
  const [keypoints, setKeypoints] = useState<number[][]>([])

  const [fps, setFps] = useState(0)
  const [inferenceTimeMs, setInferenceTimeMs] = useState(0)

  // Dual workers
  const detectWorkerRef = useRef<Worker | null>(null)
  const poseWorkerRef = useRef<Worker | null>(null)

  const animationFrameRef = useRef<number | null>(null)
  const isProcessingRef = useRef(false)
  const lastFrameTimeRef = useRef(0)

  const frameCountRef = useRef(0)
  const fpsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Synchronization for parallel workers
  const pendingResultsRef = useRef({ detect: false, pose: false })
  const latestResultsRef = useRef({
    detections: [] as DetectionBox[],
    keypoints: [] as number[][],
    detectTime: 0,
    poseTime: 0
  })

  // Adaptive frame interval
  const frameIntervalRef = useRef(1000 / 8) // ms between frames

  // Safety timeout to prevent deadlocks
  const processingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Track readiness of both workers
  const workerReadyCountRef = useRef(0)

  // Initialize workers
  useEffect(() => {
    if (!enabled) {
      console.log('[useYoloDetection] Not enabled, skipping worker init')
      return
    }

    console.log('[useYoloDetection] Starting dual workers initialization...')
    setIsLoading(true)
    setError(null)
    workerReadyCountRef.current = 0

    // Create Detect Worker
    const detectWorker = new Worker(new URL('../workers/detect.worker.ts', import.meta.url), { type: 'module' })

    // Create Pose Worker
    const poseWorker = new Worker(new URL('../workers/pose.worker.ts', import.meta.url), { type: 'module' })

    detectWorkerRef.current = detectWorker
    poseWorkerRef.current = poseWorker

    const handleWorkerReady = (workerName: string, ep: string) => {
      workerReadyCountRef.current++
      console.log(`[AI Proctoring] ${workerName} ready with EP: ${ep}`)

      if (workerReadyCountRef.current === 2) {
        setIsLoading(false)
        setIsReady(true)
        setExecutionProvider(ep) // Assuming both use same EP (WebGPU)
        console.log('[AI Proctoring] Both models ready for parallel inference!')
      }
    }

    const finishFrame = () => {
      // Clear safety timeout
      if (processingTimeoutRef.current) {
        clearTimeout(processingTimeoutRef.current)
        processingTimeoutRef.current = null
      }

      setDetections(latestResultsRef.current.detections)
      setKeypoints(latestResultsRef.current.keypoints)

      const maxTime = Math.max(latestResultsRef.current.detectTime, latestResultsRef.current.poseTime)
      setInferenceTimeMs(maxTime)

      frameCountRef.current++
      isProcessingRef.current = false

      // Adaptive FPS based on the slower worker
      const targetMs = AI_CONFIG.TARGET_INFERENCE_MS
      if (maxTime > targetMs * 1.5) {
        frameIntervalRef.current = Math.min(1000 / AI_CONFIG.MIN_FPS, frameIntervalRef.current * 1.2)
      } else if (maxTime < targetMs * 0.5) {
        frameIntervalRef.current = Math.max(1000 / AI_CONFIG.MAX_FPS, frameIntervalRef.current * 0.9)
      }

      pendingResultsRef.current = { detect: false, pose: false }
    }

    const checkFrameComplete = () => {
      if (pendingResultsRef.current.detect && pendingResultsRef.current.pose) {
        finishFrame()
      }
    }

    detectWorker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data
      if (msg.type === 'ready') handleWorkerReady('Detect Worker', msg.executionProvider || 'unknown')
      else if (msg.type === 'result') {
        latestResultsRef.current.detections = msg.detections || []
        latestResultsRef.current.detectTime = msg.inferenceTimeMs || 0
        pendingResultsRef.current.detect = true
        checkFrameComplete()
      } else if (msg.type === 'error') setError(`Detect Error: ${msg.error}`)
    }

    poseWorker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data
      if (msg.type === 'ready') handleWorkerReady('Pose Worker', msg.executionProvider || 'unknown')
      else if (msg.type === 'result') {
        latestResultsRef.current.keypoints = msg.keypoints || []
        latestResultsRef.current.poseTime = msg.inferenceTimeMs || 0
        pendingResultsRef.current.pose = true
        checkFrameComplete()
      } else if (msg.type === 'error') setError(`Pose Error: ${msg.error}`)
    }

    // Initialize both models (original trained model for detect, uint8 is fine for pose)
    detectWorker.postMessage({ type: 'init', detectModelUrl: '/models/p_uint8.onnx' })
    poseWorker.postMessage({ type: 'init', poseModelUrl: '/models/pose_uint8.onnx' })

    // FPS counter
    fpsIntervalRef.current = setInterval(() => {
      setFps(frameCountRef.current)
      frameCountRef.current = 0
    }, 1000)

    return () => {
      detectWorker.postMessage({ type: 'destroy' })
      poseWorker.postMessage({ type: 'destroy' })
      setTimeout(() => {
        detectWorker.terminate()
        poseWorker.terminate()
      }, 100)

      detectWorkerRef.current = null
      poseWorkerRef.current = null

      if (fpsIntervalRef.current) clearInterval(fpsIntervalRef.current)
      if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current)
    }
  }, [enabled])

  // Frame capture loop
  const captureFrame = useCallback(() => {
    if (!isReady || !detectWorkerRef.current || !poseWorkerRef.current || !videoRef.current) {
      animationFrameRef.current = requestAnimationFrame(captureFrame)
      return
    }

    const now = performance.now()
    const elapsed = now - lastFrameTimeRef.current

    if (elapsed < frameIntervalRef.current || isProcessingRef.current) {
      animationFrameRef.current = requestAnimationFrame(captureFrame)
      return
    }

    lastFrameTimeRef.current = now
    isProcessingRef.current = true
    pendingResultsRef.current = { detect: false, pose: false }

    // Safety timeout: if workers don't respond within 2s, force-unlock pipeline
    if (processingTimeoutRef.current) clearTimeout(processingTimeoutRef.current)
    processingTimeoutRef.current = setTimeout(() => {
      if (isProcessingRef.current) {
        console.warn('[AI Proctoring] Frame processing timeout — force unlocking pipeline', {
          detect: pendingResultsRef.current.detect,
          pose: pendingResultsRef.current.pose
        })
        // Use whatever partial results we have
        if (pendingResultsRef.current.detect) setDetections(latestResultsRef.current.detections)
        if (pendingResultsRef.current.pose) setKeypoints(latestResultsRef.current.keypoints)
        isProcessingRef.current = false
        pendingResultsRef.current = { detect: false, pose: false }
      }
    }, 2000)

    try {
      const video = videoRef.current
      if (video.readyState < 2 || video.videoWidth === 0) {
        isProcessingRef.current = false
        animationFrameRef.current = requestAnimationFrame(captureFrame)
        return
      }

      // Use fast capture on main thread
      const pixels = captureImageData(video)

      // Clone buffer because transferring a buffer detaches it from the current thread.
      // We need to send it to TWO different workers, so we need two independent ArrayBuffer copies.
      const bufferCopy = pixels.buffer.slice(0)
      const pixelsCopy = new Uint8ClampedArray(bufferCopy)

      // Send to Detect Worker
      detectWorkerRef.current.postMessage(
        {
          type: 'detect',
          imageData: pixels,
          width: video.videoWidth,
          height: video.videoHeight,
          timestamp: now
        },
        [pixels.buffer]
      ) // transfer original buffer

      // Send to Pose Worker
      poseWorkerRef.current.postMessage(
        {
          type: 'detect',
          imageData: pixelsCopy,
          width: video.videoWidth,
          height: video.videoHeight,
          timestamp: now
        },
        [bufferCopy]
      ) // transfer copied buffer
    } catch (err) {
      console.error('[AI Proctoring] Frame capture error:', err)
      isProcessingRef.current = false
    }

    animationFrameRef.current = requestAnimationFrame(captureFrame)
  }, [isReady, videoRef])

  // Start/stop capture loop
  useEffect(() => {
    if (isReady && enabled) {
      animationFrameRef.current = requestAnimationFrame(captureFrame)
    }
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isReady, enabled, captureFrame])

  return {
    isLoading,
    isReady,
    error,
    executionProvider,
    detections,
    keypoints,
    fps,
    inferenceTimeMs
  }
}

export default useYoloDetection
