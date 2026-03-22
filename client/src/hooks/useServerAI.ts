/* eslint-disable @typescript-eslint/no-explicit-any */
// AI Exam Proctoring — Server-side AI Hook
// Captures WebP frames from camera → sends via Socket.IO → receives detection results
// Replaces client-side useYoloDetection for full server-side inference

import { useEffect, useRef, useState, useCallback } from 'react'
import type { DetectionBox } from '../utils/aiTypes'

interface UseServerAIOptions {
  enabled: boolean
  videoRef: React.RefObject<HTMLVideoElement | null>
  socket: any // Socket.IO socket from useSocketExam
  sessionId: string
  captureWidth?: number  // default 320
  captureHeight?: number // default 240
  intervalMs?: number    // default 300ms (~3 FPS)
}

interface ServerAIResult {
  isReady: boolean
  isLoading: boolean
  error: string | null
  detections: DetectionBox[]
  keypoints: number[][]
  fps: number
  isFaceVisible: boolean
  executionProvider: string
  inferenceMs: number
  frameW: number  // original frame width (keypoints are in this coordinate space)
  frameH: number  // original frame height
  // Pose analysis from server
  headPose: { yaw: number; pitch: number; roll: number } | null
  cheatingScore: { overall: number; level: string; dominantSignal: string; breakdown: Record<string, number> } | null
  isLookingAway: boolean
  lookAwayDurationMs: number
}

export function useServerAI({
  enabled,
  videoRef,
  socket,
  sessionId,
  captureWidth = 320,
  captureHeight = 240,
  intervalMs = 300
}: UseServerAIOptions): ServerAIResult {
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [detections, setDetections] = useState<DetectionBox[]>([])
  const [keypoints, setKeypoints] = useState<number[][]>([])
  const [fps, setFps] = useState(0)
  const [inferenceMs, setInferenceMs] = useState(0)
  const [headPose, setHeadPose] = useState<ServerAIResult['headPose']>(null)
  const [cheatingScore, setCheatingScore] = useState<ServerAIResult['cheatingScore']>(null)
  const [isLookingAway, setIsLookingAway] = useState(false)
  const [lookAwayDurationMs, setLookAwayDurationMs] = useState(0)
  const [frameW, setFrameW] = useState(320)
  const [frameH, setFrameH] = useState(240)

  const waitingForResultRef = useRef(false)
  const fpsCounterRef = useRef({ count: 0, lastTime: Date.now() })
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null)

  // Ensure we have a reusable offscreen canvas
  const getCanvas = useCallback(() => {
    if (!captureCanvasRef.current) {
      captureCanvasRef.current = document.createElement('canvas')
      captureCanvasRef.current.width = captureWidth
      captureCanvasRef.current.height = captureHeight
    }
    return captureCanvasRef.current
  }, [captureWidth, captureHeight])

  // Listen for ai_result from server
  useEffect(() => {
    if (!socket || !enabled) return

    const handleResult = (data: any) => {
      if (data.session_id !== sessionId) return

      waitingForResultRef.current = false
      setDetections(data.detections || [])
      setKeypoints(data.keypoints || [])
      setInferenceMs(data.inferenceMs || 0)

      // Frame dimensions for coordinate mapping
      if (data.frameW) setFrameW(data.frameW)
      if (data.frameH) setFrameH(data.frameH)

      // Pose analysis from server
      setHeadPose(data.headPose || null)
      setCheatingScore(data.cheatingScore || null)
      setIsLookingAway(data.isLookingAway || false)
      setLookAwayDurationMs(data.lookAwayDurationMs || 0)

      // Update FPS counter
      const counter = fpsCounterRef.current
      counter.count++
      const now = Date.now()
      if (now - counter.lastTime >= 1000) {
        setFps(counter.count)
        counter.count = 0
        counter.lastTime = now
      }

      if (!isReady) {
        setIsReady(true)
        setIsLoading(false)
      }
    }

    socket.on('ai_result', handleResult)
    return () => {
      socket.off('ai_result', handleResult)
    }
  }, [socket, sessionId, enabled, isReady])

  // Frame capture + send loop
  useEffect(() => {
    if (!enabled || !socket || !sessionId) return

    setIsLoading(true)

    const interval = setInterval(() => {
      // Backpressure: don't send if previous frame hasn't returned
      if (waitingForResultRef.current) return

      const video = videoRef.current
      if (!video || video.readyState < 2) return // not ready

      try {
        const canvas = getCanvas()
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Draw current video frame to offscreen canvas
        ctx.drawImage(video, 0, 0, captureWidth, captureHeight)

        // Encode as WebP (faster + smaller than JPEG)
        canvas.toBlob(
          (blob) => {
            if (!blob || !socket.connected) return

            blob.arrayBuffer().then((buf) => {
              const ts = Date.now()
              socket.emit('ai_frame', {
                session_id: sessionId,
                frame: buf,
                ts
              })
              waitingForResultRef.current = true
            })
          },
          'image/webp',
          0.6 // quality
        )
      } catch (err: any) {
        console.error('[useServerAI] Frame capture error:', err)
        setError(err.message || 'Frame capture failed')
      }
    }, intervalMs)

    return () => {
      clearInterval(interval)
      waitingForResultRef.current = false
    }
  }, [enabled, socket, sessionId, videoRef, captureWidth, captureHeight, intervalMs, getCanvas])

  // Compute isFaceVisible from keypoints
  const isFaceVisible = keypoints.length > 0

  return {
    isReady,
    isLoading,
    error,
    detections,
    keypoints,
    fps,
    isFaceVisible,
    executionProvider: 'server',
    inferenceMs,
    frameW,
    frameH,
    headPose,
    cheatingScore,
    isLookingAway,
    lookAwayDurationMs
  }
}
