// AI Exam Proctoring — useYoloDetection hook
// Manages dual YOLO Workers in PARALLEL pipeline (Detect ‖ Pose simultaneously)
// Each worker owns its own WebGPU device — no conflicts, true parallel GPU execution

import { useState, useEffect, useRef, useCallback } from 'react'
import type { DetectionBox, WorkerResponse } from '../utils/aiTypes'
import { AI_CONFIG, __AI_DEV__ } from '../utils/aiTypes'
import { captureImageData } from '../utils/preprocess'

const WORKER_KEEP_ALIVE_MS = 15000

type SharedModelState = 'idle' | 'initializing' | 'ready'

let sharedDetectWorker: Worker | null = null
let sharedPoseWorker: Worker | null = null
let sharedRefCount = 0
let sharedDestroyTimer: ReturnType<typeof setTimeout> | null = null
let sharedModelState: SharedModelState = 'idle'
let sharedDetectEP = 'unknown'
let sharedPoseEP = 'unknown'

function getSharedWorkers() {
  if (sharedDestroyTimer) {
    clearTimeout(sharedDestroyTimer)
    sharedDestroyTimer = null
  }

  if (!sharedDetectWorker || !sharedPoseWorker) {
    sharedDetectWorker = new Worker(new URL('../workers/detect.worker.ts', import.meta.url), { type: 'module' })
    sharedPoseWorker = new Worker(new URL('../workers/pose.worker.ts', import.meta.url), { type: 'module' })
  }

  sharedRefCount++
  return { detectWorker: sharedDetectWorker, poseWorker: sharedPoseWorker }
}

function releaseSharedWorkers() {
  sharedRefCount = Math.max(0, sharedRefCount - 1)

  if (sharedRefCount === 0) {
    sharedDestroyTimer = setTimeout(() => {
      if (sharedRefCount > 0) return

      if (sharedDetectWorker) {
        sharedDetectWorker.postMessage({ type: 'destroy' })
        sharedDetectWorker.terminate()
      }
      if (sharedPoseWorker) {
        sharedPoseWorker.postMessage({ type: 'destroy' })
        sharedPoseWorker.terminate()
      }

      sharedDetectWorker = null
      sharedPoseWorker = null
      sharedModelState = 'idle'
      sharedDetectEP = 'unknown'
      sharedPoseEP = 'unknown'

      if (__AI_DEV__) {
        console.log('[useYoloDetection] Shared workers destroyed after keep-alive timeout')
      }
    }, WORKER_KEEP_ALIVE_MS)
  }
}

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

  // Parallel results accumulator — both workers write here, finishFrame fires when both arrive
  const pendingParallelRef = useRef<{
    detections: DetectionBox[] | null
    keypoints: number[][] | null
    detectTime: number
    poseTime: number
  }>({ detections: null, keypoints: null, detectTime: 0, poseTime: 0 })

  // Adaptive frame interval
  const frameIntervalRef = useRef(1000 / 8) // ms between frames

  // Track readiness & EP of each worker separately
  const workerReadyCountRef = useRef(0)
  const workerEPsRef = useRef<{ detect: string; pose: string }>({ detect: 'unknown', pose: 'unknown' })

  // Initialize workers
  useEffect(() => {
    if (!enabled) {
      if (__AI_DEV__) console.log('[useYoloDetection] Not enabled, skipping worker init')
      return
    }

    if (__AI_DEV__) console.log('[useYoloDetection] Starting dual workers (parallel pipeline)...')
    setIsLoading(true)
    setError(null)
    workerReadyCountRef.current = 0

    const { detectWorker, poseWorker } = getSharedWorkers()

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

      if (workerName === 'detect') sharedDetectEP = ep
      if (workerName === 'pose') sharedPoseEP = ep

      if (workerReadyCountRef.current === 2) {
        const dEP = workerEPsRef.current.detect
        const pEP = workerEPsRef.current.pose
        const bothGPU = dEP === 'webgpu' && pEP === 'webgpu'

        console.log(
          `%c[AI Proctoring] Detect: ${dEP.toUpperCase()} | Pose: ${pEP.toUpperCase()} | Pipeline: PARALLEL | ${bothGPU ? '🚀 All GPU' : '⚠️ Mixed'}`,
          bothGPU ? 'color: #22c55e; font-weight: bold' : 'color: #f59e0b; font-weight: bold'
        )

        setIsLoading(false)
        setIsReady(true)
        setExecutionProvider(bothGPU ? 'webgpu' : `detect:${dEP}/pose:${pEP}`)
        sharedModelState = 'ready'
      }
    }

    const finishFrame = () => {
      const { detections: dets, keypoints: kpts, detectTime, poseTime } = pendingParallelRef.current

      setDetections(dets ?? [])
      setKeypoints(kpts ?? [])
      setIsFaceVisible(checkFaceVisible(kpts ?? []))

      // Parallel time = the slower of the two (they ran simultaneously)
      const parallelTime = Math.max(detectTime, poseTime)
      setInferenceTimeMs(parallelTime)

      frameCountRef.current++
      isProcessingRef.current = false

      // Reset accumulator for next frame
      pendingParallelRef.current = { detections: null, keypoints: null, detectTime: 0, poseTime: 0 }

      // Adaptive FPS based on parallel time (not serial sum)
      const targetMs = AI_CONFIG.TARGET_INFERENCE_MS
      if (parallelTime > targetMs * 1.5) {
        frameIntervalRef.current = Math.min(1000 / AI_CONFIG.MIN_FPS, frameIntervalRef.current * 1.2)
      } else if (parallelTime < targetMs * 0.5) {
        frameIntervalRef.current = Math.max(1000 / AI_CONFIG.MAX_FPS, frameIntervalRef.current * 0.9)
      }
    }

    // PARALLEL: Detect result arrives — store and check if pose is already done
    detectWorker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data
      if (msg.type === 'ready') {
        handleWorkerReady('detect', msg.executionProvider || 'unknown')
        // Pose init was already sent simultaneously — no need to trigger it here
      } else if (msg.type === 'result') {
        pendingParallelRef.current.detections = msg.detections || []
        pendingParallelRef.current.detectTime = msg.inferenceTimeMs || 0

        // If pose already finished this frame, publish combined result
        if (pendingParallelRef.current.keypoints !== null) {
          finishFrame()
        }
      } else if (msg.type === 'error') {
        console.error('[AI Proctoring] Detect error:', msg.error)
        setError(`Detect Error: ${msg.error}`)
        isProcessingRef.current = false
        pendingParallelRef.current = { detections: null, keypoints: null, detectTime: 0, poseTime: 0 }
      }
    }

    // PARALLEL: Pose result arrives — store and check if detect is already done
    poseWorker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const msg = event.data
      if (msg.type === 'ready') {
        handleWorkerReady('pose', msg.executionProvider || 'unknown')
      } else if (msg.type === 'result') {
        pendingParallelRef.current.keypoints = msg.keypoints || []
        pendingParallelRef.current.poseTime = msg.inferenceTimeMs || 0

        // If detect already finished this frame, publish combined result
        if (pendingParallelRef.current.detections !== null) {
          finishFrame()
        }
      } else if (msg.type === 'error') {
        console.error('[AI Proctoring] Pose error:', msg.error)
        setError(`Pose Error: ${msg.error}`)
        // Publish detect-only results if available
        if (pendingParallelRef.current.detections !== null) {
          pendingParallelRef.current.keypoints = []
          finishFrame()
        } else {
          isProcessingRef.current = false
          pendingParallelRef.current = { detections: null, keypoints: null, detectTime: 0, poseTime: 0 }
        }
      }
    }

    if (sharedModelState === 'ready') {
      workerReadyCountRef.current = 2
      workerEPsRef.current = { detect: sharedDetectEP, pose: sharedPoseEP }
      const bothGPU = sharedDetectEP === 'webgpu' && sharedPoseEP === 'webgpu'
      setIsLoading(false)
      setIsReady(true)
      setExecutionProvider(bothGPU ? 'webgpu' : `detect:${sharedDetectEP}/pose:${sharedPoseEP}`)
      if (__AI_DEV__) {
        console.log('[useYoloDetection] Reusing already initialized workers/models')
      }
    } else if (sharedModelState === 'idle') {
      sharedModelState = 'initializing'
      // Send BOTH init messages simultaneously — parallel init halves startup time
      // (detect ~40s + pose ~57s sequential = 97s → parallel = 57s, saving 40s)
      detectWorker.postMessage({ type: 'init', detectModelUrl: '/models/p_uint8.onnx' })
      poseWorker.postMessage({ type: 'init', poseModelUrl: '/models/pose_uint8.onnx' })
    }
    // If sharedModelState === 'initializing': workers are already initing, just wait for ready msgs

    // FPS counter
    fpsIntervalRef.current = setInterval(() => {
      setFps(frameCountRef.current)
      frameCountRef.current = 0
    }, 1000)

    return () => {
      detectWorker.onmessage = null
      poseWorker.onmessage = null

      detectWorkerRef.current = null
      poseWorkerRef.current = null
      pendingParallelRef.current = { detections: null, keypoints: null, detectTime: 0, poseTime: 0 }
      isProcessingRef.current = false

      if (fpsIntervalRef.current) clearInterval(fpsIntervalRef.current)
      releaseSharedWorkers()
    }
  }, [enabled])

  // Frame capture loop — sends to BOTH workers in parallel
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

      // Two zero-copy buffer transfers: one to detect, one to pose (parallel)
      const bufferForPose = pixels.buffer.slice(0) as ArrayBuffer
      const pixelsForPose = new Uint8ClampedArray(bufferForPose)

      // Reset accumulator before dispatching
      pendingParallelRef.current = { detections: null, keypoints: null, detectTime: 0, poseTime: 0 }

      // Dispatch to BOTH workers simultaneously
      detectWorkerRef.current.postMessage(
        { type: 'detect', imageData: pixels, width: video.videoWidth, height: video.videoHeight, timestamp: now },
        [pixels.buffer]
      )
      poseWorkerRef.current.postMessage(
        { type: 'detect', imageData: pixelsForPose, width: video.videoWidth, height: video.videoHeight, timestamp: now },
        [bufferForPose]
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
