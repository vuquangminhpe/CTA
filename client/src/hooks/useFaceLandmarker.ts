/* eslint-disable @typescript-eslint/no-explicit-any */
// MediaPipe FaceLandmarker Hook — Iris tracking + BlendShapes for gaze detection
// Runs on strong devices (WebGL2 support). Sends raw data to server for logic checking.
// SEPARATE from existing YOLO-based detection pipeline.

import { useEffect, useRef, useState } from 'react'
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision'
import { __AI_DEV__ } from '../utils/aiTypes'

// ─── Types ───
export interface FaceLandmarkData {
  // Iris positions (normalized 0-1)
  irisLeft: { x: number; y: number; z: number } | null
  irisRight: { x: number; y: number; z: number } | null
  // Eye gaze from blendShapes (-1 to +1)
  gazeHorizontal: number // negative = looking right, positive = looking left
  gazeVertical: number // negative = looking down, positive = looking up
  // Individual eye gaze signals (0-1 raw blendShape scores)
  eyeLookInLeft: number
  eyeLookOutLeft: number
  eyeLookInRight: number
  eyeLookOutRight: number
  eyeLookUpLeft: number
  eyeLookDownLeft: number
  eyeLookUpRight: number
  eyeLookDownRight: number
  // Eye blink (for liveness)
  eyeBlinkLeft: number
  eyeBlinkRight: number
  // Head pose from face transformation matrix
  faceDetected: boolean
  timestamp: number
}

interface UseFaceLandmarkerOptions {
  enabled: boolean
  videoRef: React.RefObject<HTMLVideoElement | null>
  socket: any
  sessionId: string
  intervalMs?: number // default 200ms (~5 FPS, FaceLandmarker is fast)
}

export interface GazeServerResult {
  isGazingAway: boolean
  gazeDurationMs: number
  horizontal: number
  vertical: number
  irisAsymmetry: number
  violationCount: number
}

interface UseFaceLandmarkerResult {
  isReady: boolean
  isSupported: boolean // WebGL2 available
  error: string | null
  lastData: FaceLandmarkData | null
  gazeResult: GazeServerResult | null // server analysis result
  fps: number
}

// ─── WebGL2 Support Detection ───
let _webgl2Supported: boolean | null = null

function isWebGL2Supported(): boolean {
  if (_webgl2Supported !== null) return _webgl2Supported
  try {
    const canvas = document.createElement('canvas')
    _webgl2Supported = !!canvas.getContext('webgl2')
  } catch {
    _webgl2Supported = false
  }
  return _webgl2Supported
}

// ─── Extract gaze data from FaceLandmarker result ───
function extractFaceData(result: any, timestamp: number): FaceLandmarkData | null {
  if (!result.faceLandmarks?.length) return null

  const landmarks = result.faceLandmarks[0]

  // Iris landmarks (468-472 left, 473-477 right)
  const irisLeft = landmarks[468] ? { x: landmarks[468].x, y: landmarks[468].y, z: landmarks[468].z } : null
  const irisRight = landmarks[473] ? { x: landmarks[473].x, y: landmarks[473].y, z: landmarks[473].z } : null

  // BlendShapes for gaze direction
  const bs: Record<string, number> = {}
  if (result.faceBlendshapes?.length) {
    for (const cat of result.faceBlendshapes[0].categories) {
      bs[cat.categoryName] = cat.score
    }
  }

  const eyeLookInLeft = bs.eyeLookInLeft || 0
  const eyeLookOutLeft = bs.eyeLookOutLeft || 0
  const eyeLookInRight = bs.eyeLookInRight || 0
  const eyeLookOutRight = bs.eyeLookOutRight || 0
  const eyeLookUpLeft = bs.eyeLookUpLeft || 0
  const eyeLookDownLeft = bs.eyeLookDownLeft || 0
  const eyeLookUpRight = bs.eyeLookUpRight || 0
  const eyeLookDownRight = bs.eyeLookDownRight || 0

  // Composite gaze: average of both eyes
  // Left eye: "Out" = looking left, "In" = looking right (toward nose)
  // Right eye: "In" = looking left (toward nose), "Out" = looking right
  const leftEyeH = eyeLookOutLeft - eyeLookInLeft // positive = looking left
  const rightEyeH = eyeLookInRight - eyeLookOutRight // positive = looking left
  const gazeHorizontal = (leftEyeH + rightEyeH) / 2

  const leftEyeV = eyeLookUpLeft - eyeLookDownLeft
  const rightEyeV = eyeLookUpRight - eyeLookDownRight
  const gazeVertical = (leftEyeV + rightEyeV) / 2

  return {
    irisLeft,
    irisRight,
    gazeHorizontal,
    gazeVertical,
    eyeLookInLeft,
    eyeLookOutLeft,
    eyeLookInRight,
    eyeLookOutRight,
    eyeLookUpLeft,
    eyeLookDownLeft,
    eyeLookUpRight,
    eyeLookDownRight,
    eyeBlinkLeft: bs.eyeBlinkLeft || 0,
    eyeBlinkRight: bs.eyeBlinkRight || 0,
    faceDetected: true,
    timestamp
  }
}

// ─── Hook ───
export function useFaceLandmarker({
  enabled,
  videoRef,
  socket,
  sessionId,
  intervalMs = 200
}: UseFaceLandmarkerOptions): UseFaceLandmarkerResult {
  const [isReady, setIsReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Use ref for high-frequency data to avoid re-renders every 200ms
  const lastDataRef = useRef<FaceLandmarkData | null>(null)
  const [gazeResult, setGazeResult] = useState<GazeServerResult | null>(null)
  const [fps, setFps] = useState(0)

  const landmarkerRef = useRef<FaceLandmarker | null>(null)
  const fpsCounterRef = useRef<{ count: number; lastTime: number } | null>(null)
  const lastVideoTimeRef = useRef(-1)

  const isSupported = isWebGL2Supported()

  // Production log: always log device capability check (runs once)
  useEffect(() => {
    const cores = navigator.hardwareConcurrency || 0
    const memory = (navigator as any).deviceMemory || 0
    const gl2 = isWebGL2Supported()
    console.log(
      `[FaceLandmarker] Device check: WebGL2=${gl2}, cores=${cores}, memory=${memory}GB, enabled=${enabled}, supported=${gl2}`
    )
    if (!gl2) {
      console.log('[FaceLandmarker] ❌ WebGL2 not supported → skipping FaceLandmarker, using server-only YOLO pipeline')
    }
  }, [enabled])

  // Listen for server gaze analysis results
  useEffect(() => {
    if (!socket || !sessionId) return

    const handleGazeResult = (data: any) => {
      if (data.session_id !== sessionId) return
      setGazeResult(data)
      if (__AI_DEV__ && data.isGazingAway) {
        console.log(
          `[FaceLandmarker] ⚠️ GAZE AWAY: H=${data.horizontal?.toFixed(3)} V=${data.vertical?.toFixed(3)} dur=${data.gazeDurationMs}ms violations=${data.violationCount}`
        )
      }
    }

    socket.on('gaze_result', handleGazeResult)
    return () => {
      socket.off('gaze_result', handleGazeResult)
    }
  }, [socket, sessionId])

  // Initialize FaceLandmarker
  useEffect(() => {
    if (!enabled || !isSupported) return

    let cancelled = false

    const init = async () => {
      try {
        const filesetResolver = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm'
        )

        if (cancelled) return

        const faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU' // WebGL2
          },
          runningMode: 'VIDEO',
          numFaces: 1,
          minFaceDetectionConfidence: 0.5,
          minFacePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: false // not needed for gaze
        })

        if (cancelled) {
          faceLandmarker.close()
          return
        }

        landmarkerRef.current = faceLandmarker
        setIsReady(true)
        setError(null)
        console.log('[FaceLandmarker] ✅ Initialized (WebGL2 GPU delegate)')
      } catch (err: any) {
        if (cancelled) return
        console.error('[FaceLandmarker] ❌ Init failed:', err?.message || err)
        setError(err.message || 'FaceLandmarker init failed')
        // Log specific failure reason for production debugging
        if (err?.message?.includes('WebGL')) {
          console.warn('[FaceLandmarker] GPU delegate failed — device may not support WebGL2 properly')
        }
      }
    }

    init()

    return () => {
      cancelled = true
      if (landmarkerRef.current) {
        landmarkerRef.current.close()
        landmarkerRef.current = null
      }
      setIsReady(false)
    }
  }, [enabled, isSupported])

  // Detection loop — runs at intervalMs, sends results to server
  useEffect(() => {
    if (!isReady || !enabled || !socket || !sessionId) return

    const interval = setInterval(() => {
      const video = videoRef.current
      const landmarker = landmarkerRef.current
      if (!video || !landmarker || video.readyState < 2) return

      // Skip if same video frame
      if (video.currentTime === lastVideoTimeRef.current) return
      lastVideoTimeRef.current = video.currentTime

      try {
        const now = performance.now()
        const result = landmarker.detectForVideo(video, now)
        const data = extractFaceData(result, Date.now())

        if (data) {
          lastDataRef.current = data

          if (__AI_DEV__ && fpsCounterRef.current && fpsCounterRef.current.count % 10 === 0) {
            console.log(
              `[FaceLandmarker] gazeH=${data.gazeHorizontal.toFixed(3)} gazeV=${data.gazeVertical.toFixed(3)} iris=${data.irisLeft ? 'ok' : 'null'}`
            )
          }

          // Send to server for logic checking (NOT processed on client)
          socket.emit('face_landmarks', {
            session_id: sessionId,
            ...data
          })
        } else if (__AI_DEV__) {
          console.warn('[FaceLandmarker] extractFaceData returned null — no face detected')
        }

        // FPS counter
        if (!fpsCounterRef.current) {
          fpsCounterRef.current = { count: 0, lastTime: Date.now() }
        }
        const counter = fpsCounterRef.current
        counter.count++
        const nowMs = Date.now()
        if (nowMs - counter.lastTime >= 1000) {
          setFps(counter.count)
          counter.count = 0
          counter.lastTime = nowMs
        }
      } catch (err: any) {
        // Silently skip frame errors (e.g., video not ready)
        if (__AI_DEV__) {
          console.warn('[FaceLandmarker] Frame error:', err.message)
        }
      }
    }, intervalMs)

    return () => clearInterval(interval)
  }, [isReady, enabled, socket, sessionId, videoRef, intervalMs])

  return { isReady, isSupported, error, lastData: null, gazeResult, fps }
}
