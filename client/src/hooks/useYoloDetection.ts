// AI Exam Proctoring — useYoloDetection hook
// Manages dual YOLO Workers in SERIAL pipeline (Detect → Pose) to avoid WebGPU device conflicts

import { useState, useEffect, useRef, useCallback } from 'react'
import type { DetectionBox, WorkerResponse } from '../utils/aiTypes'
import { AI_CONFIG, __AI_DEV__ } from '../utils/aiTypes'
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
  isFaceVisible: boolean
}

// Check if face keypoints (nose, eyes, ears) have enough visible points
function checkFaceVisible(allKeypoints: number[][]): boolean {
  if (allKeypoints.length === 0) return false
  for (const kpts of allKeypoints) {
    if (!kpts || kpts.length < 15) continue // need at least 5 keypoints * 3
    // Face keypoints: nose(0), left_eye(1), right_eye(2), left_ear(3), right_ear(4)
    let visibleCount = 0
    for (let i = 0; i < 5; i++) {
      if (kpts[i * 3 + 2] > 0.3) visibleCount++
    }
    // At least 2 face keypoints visible = face present
    if (visibleCount >= 2) return true
  }
  return false
}

export function useYoloDetection({ enabled = true, videoRef }: UseYoloDetectionOptions): UseYoloDetectionResult {
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [executionProvider, setExecutionProvider] = useState<string | null>(null)

  const [detections, setDetections] = useState<DetectionBox[]>([])
  const [keypoints, setKeypoints] = useState<number[][]>([])
  const [isFaceVisible, setIsFaceVisible] = useState(true) // optimistic default

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

  // Results accumulator for serial pipeline
  const latestResultsRef = useRef({
    detections: [] as DetectionBox[],
    keypoints: [] as number[][],
    detectTime: 0,
    poseTime: 0
  })

  // Adaptive frame interval
  const frameIntervalRef = useRef(1000 / 8) // ms between frames

  // Store pixel copy for pose worker (sent AFTER detect completes)
  const pendingPoseFrameRef = useRef<{
    pixels: Uint8ClampedArray
    buffer: ArrayBuffer
    timestamp: number
    width: number
    height: number
  } | null>(null)

  // Track readiness & EP of each worker separately
  const workerReadyCountRef = useRef(0)
  const workerEPsRef = useRef<{ detect: string; pose: string }>({ detect: 'unknown', pose: 'unknown' })

  // Initialize workers
  useEffect(() => {
    if (!enabled) {
      if (__AI_DEV__) console.log('[useYoloDetection] Not enabled, skipping worker init')
      return
    }

    if (__AI_DEV__) console.log('[useYoloDetection] Starting dual workers (serial pipeline)...')
    setIsLoading(true)
    setError(null)
    workerReadyCountRef.current = 0

    const detectWorker = new Worker(new URL('../workers/detect.worker.ts', import.meta.url), { type: 'module' })
    const poseWorker = new Worker(new URL('../workers/pose.worker.ts', import.meta.url), { type: 'module' })

    detectWorkerRef.current = detectWorker
    poseWorkerRef.current = poseWorker

    const handleWorkerReady = (workerName: 'detect' | 'pose', ep: string) => {
      workerReadyCountRef.current++
      workerEPsRef.current[workerName] = ep

      // === EP Logging (always show — important for diagnostics) ===
      const isGPU = ep.toLowerCase() === 'webgpu'
      console.log(
        `%c[AI Proctoring] ${workerName.toUpperCase()} Worker → ${ep.toUpperCase()} ${isGPU ? '✅ GPU' : '⚠️ CPU fallback'}`,
        isGPU ? 'color: #22c55e; font-weight: bold' : 'color: #f59e0b; font-weight: bold'
      )

      if (workerReadyCountRef.current === 2) {
        const dEP = workerEPsRef.current.detect
        const pEP = workerEPsRef.current.pose
        const bothGPU = dEP === 'webgpu' && pEP === 'webgpu'

        console.log(
          `%c[AI Proctoring] Detect: ${dEP.toUpperCase()} | Pose: ${pEP.toUpperCase()} | Pipeline: SERIAL | ${bothGPU ? '🚀 All GPU' : '⚠️ Mixed'}`,
          bothGPU ? 'color: #22c55e; font-weight: bold' : 'color: #f59e0b; font-weight: bold'
        )

        setIsLoading(false)
        setIsReady(true)
        setExecutionProvider(bothGPU ? 'webgpu' : `detect:${dEP}/pose:${pEP}`)
      }
    }

    const finishFrame = () => {
      setDetections(latestResultsRef.current.detections)
      setKeypoints(latestResultsRef.current.keypoints)

      // Face visibility check
      setIsFaceVisible(checkFaceVisible(latestResultsRef.current.keypoints))

      const totalTime = latestResultsRef.current.detectTime + latestResultsRef.current.poseTime
      setInferenceTimeMs(totalTime)

      frameCountRef.current++
      isProcessingRef.current = false

      // Adaptive FPS based on total serial time
      const targetMs = AI_CONFIG.TARGET_INFERENCE_MS
      if (totalTime > targetMs * 1.5) {
        frameIntervalRef.current = Math.min(1000 / AI_CONFIG.MIN_FPS, frameIntervalRef.current * 1.2)
      } else if (totalTime < targetMs * 0.5) {
        frameIntervalRef.current = Math.max(1000 / AI_CONFIG.MAX_FPS, frameIntervalRef.current * 0.9)
      }
    }

    // SERIAL: Detect completes → send stored frame to Pose
    detectWorker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data
      if (msg.type === 'ready') {
        handleWorkerReady('detect', msg.executionProvider || 'unknown')
      } else if (msg.type === 'result') {
        latestResultsRef.current.detections = msg.detections || []
        latestResultsRef.current.detectTime = msg.inferenceTimeMs || 0

        // Now send the stored frame copy to Pose Worker
        const pending = pendingPoseFrameRef.current
        if (pending && poseWorkerRef.current) {
          poseWorkerRef.current.postMessage(
            {
              type: 'detect',
              imageData: pending.pixels,
              width: pending.width,
              height: pending.height,
              timestamp: pending.timestamp
            },
            [pending.buffer]
          )
          pendingPoseFrameRef.current = null
        } else {
          // No pending frame — finish with detect-only results
          finishFrame()
        }
      } else if (msg.type === 'error') {
        console.error('[AI Proctoring] Detect error:', msg.error)
        setError(`Detect Error: ${msg.error}`)
        isProcessingRef.current = false
      }
    }

    // Pose completes → publish all results
    poseWorker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data
      if (msg.type === 'ready') {
        handleWorkerReady('pose', msg.executionProvider || 'unknown')
      } else if (msg.type === 'result') {
        latestResultsRef.current.keypoints = msg.keypoints || []
        latestResultsRef.current.poseTime = msg.inferenceTimeMs || 0
        finishFrame()
      } else if (msg.type === 'error') {
        console.error('[AI Proctoring] Pose error:', msg.error)
        setError(`Pose Error: ${msg.error}`)
        // Still publish detect results
        setDetections(latestResultsRef.current.detections)
        isProcessingRef.current = false
      }
    }

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
    }
  }, [enabled])

  // Frame capture loop — only sends to detect worker (serial: detect → pose)
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

    try {
      const video = videoRef.current
      if (video.readyState < 2 || video.videoWidth === 0) {
        isProcessingRef.current = false
        animationFrameRef.current = requestAnimationFrame(captureFrame)
        return
      }

      const pixels = captureImageData(video)

      // Clone buffer for pose worker (will be sent AFTER detect completes)
      const bufferCopy = pixels.buffer.slice(0) as ArrayBuffer
      const pixelsCopy = new Uint8ClampedArray(bufferCopy)
      pendingPoseFrameRef.current = {
        pixels: pixelsCopy,
        buffer: bufferCopy,
        timestamp: now,
        width: video.videoWidth,
        height: video.videoHeight
      }

      // Send ONLY to Detect Worker first (serial pipeline)
      detectWorkerRef.current.postMessage(
        {
          type: 'detect',
          imageData: pixels,
          width: video.videoWidth,
          height: video.videoHeight,
          timestamp: now
        },
        [pixels.buffer]
      )
    } catch (err) {
      if (__AI_DEV__) console.error('[AI Proctoring] Frame capture error:', err)
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
    inferenceTimeMs,
    isFaceVisible
  }
}

export default useYoloDetection
