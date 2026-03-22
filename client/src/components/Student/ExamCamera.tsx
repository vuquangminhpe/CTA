/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// AI Exam Proctoring — ExamCamera component
// Webcam feed with AI detection status + optional bbox overlay

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Camera, Cpu, Shield, WifiOff, Loader2 } from 'lucide-react'
// Client-side AI (commented out — kept as fallback)
// import { useYoloDetection } from '../../hooks/useYoloDetection'
import { useServerAI } from '../../hooks/useServerAI'
import { usePoseAnalysis } from '../../hooks/usePoseAnalysis'
import { useFaceLandmarker } from '../../hooks/useFaceLandmarker'
import type { AIViolation, AIViolationType } from '../../utils/aiTypes'
import { AI_CONFIG, classToViolationType, __AI_DEV__ } from '../../utils/aiTypes'
import { toast } from 'sonner'

interface ExamCameraProps {
  enabled: boolean
  onViolation: (violation: AIViolation) => void
  onReady?: (ready: boolean) => void
  showDebugOverlay?: boolean
  socket: any // Socket.IO socket from useSocketExam
  sessionId: string
}

const ExamCamera: React.FC<ExamCameraProps> = ({ enabled, onViolation, onReady, showDebugOverlay = false, socket, sessionId }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [statusText, setStatusText] = useState('Đang khởi tạo...')

  // Track consecutive frame counts for temporal smoothing
  const phoneFrameCountRef = useRef(0)
  const earphoneFrameCountRef = useRef(0)
  const violationCooldownRef = useRef<Record<string, number>>({})
  const shouldShowDebugOverlay = showDebugOverlay

  // Server-side AI detection hook (replaces useYoloDetection)
  const {
    isLoading,
    isReady,
    error: detectionError,
    executionProvider,
    detections,
    keypoints,
    fps,
    isFaceVisible,
    frameW,
    frameH
  } = useServerAI({ enabled: enabled && cameraActive, videoRef, socket, sessionId })

  // Enhanced pose analysis hook (replaces useHeadPose)
  const { headPose, cheatingScore, phoneCheck, isLookingAway, lookAwayDurationMs } = usePoseAnalysis({
    keypoints,
    detections,
    enabled: enabled && cameraActive
  })

  // MediaPipe FaceLandmarker — iris + gaze tracking (strong devices only)
  // Runs independently, sends data to server for logic checking
  const { isReady: faceLandmarkerReady, isSupported: faceLandmarkerSupported, fps: faceLandmarkerFps } = useFaceLandmarker({
    enabled: enabled && cameraActive,
    videoRef,
    socket,
    sessionId,
  })

  // Notify parent when AI model is ready
  useEffect(() => {
    onReady?.(isReady)
  }, [isReady, onReady])

  // Update status text based on state
  useEffect(() => {
    if (cameraError) {
      setStatusText(`❌ Camera: ${cameraError}`)
    } else if (!cameraActive) {
      setStatusText('📷 Đang mở camera...')
    } else if (isLoading) {
      setStatusText('🧠 Đang tải AI model...')
    } else if (detectionError) {
      setStatusText(`❌ AI lỗi: ${detectionError}`)
    } else if (isReady) {
      const faceInfo = faceLandmarkerReady ? ` | iris ${faceLandmarkerFps}fps` : faceLandmarkerSupported ? ' | iris loading...' : ''
      setStatusText(`✅ AI đang chạy (${executionProvider} | ${fps}fps${faceInfo})`)
    } else {
      setStatusText('⏳ Đang khởi tạo AI...')
    }
  }, [cameraError, cameraActive, isLoading, detectionError, isReady, executionProvider, fps, faceLandmarkerReady, faceLandmarkerSupported, faceLandmarkerFps])

  // Initialize webcam
  useEffect(() => {
    if (!enabled) {
      if (__AI_DEV__) console.log('[ExamCamera] Not enabled, skipping camera init')
      return
    }

    let stream: MediaStream | null = null
    let cancelled = false

    const initCamera = async () => {
      if (__AI_DEV__) console.log('[ExamCamera] Starting camera initialization...')
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user', // front camera for mobile
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 15, max: 30 }
          }
        })

        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setCameraActive(true)
          setCameraError(null)
          if (__AI_DEV__) console.log('[ExamCamera] ✅ Camera active and playing')
          // 🔔 DIAGNOSTIC TOAST: Camera OK
          toast.success('📷 Camera đã sẵn sàng', { duration: 5000, id: 'camera-ok' })
        } else {
          console.error('[ExamCamera] videoRef.current is null!')
          setCameraError('Video element not ready')
          toast.error('❌ Camera: Video element not ready', { duration: 15000, id: 'camera-err' })
        }
      } catch (err: any) {
        if (cancelled) return
        console.error('[ExamCamera] ❌ Camera init failed:', err)
        setCameraError(
          err.name === 'NotAllowedError'
            ? 'Vui lòng cho phép truy cập camera'
            : err.name === 'NotFoundError'
              ? 'Không tìm thấy camera'
              : err.message || 'Camera access denied'
        )
        // 🔔 DIAGNOSTIC TOAST: Camera error
        toast.error(`❌ Camera lỗi: ${err.name} — ${err.message || 'unknown'}`, { duration: 15000, id: 'camera-err' })
        setCameraActive(false)
      }
    }

    initCamera()

    return () => {
      cancelled = true
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
        if (__AI_DEV__) console.log('[ExamCamera] Camera stream stopped (cleanup)')
      }
      setCameraActive(false)
    }
  }, [enabled])

  // Emit violation with cooldown (prevent spam)
  const emitViolation = useCallback(
    (type: AIViolationType, confidence: number, frameCount: number) => {
      const now = Date.now()
      const lastEmit = violationCooldownRef.current[type] || 0
      // 5s for head/posture warnings, 3s for critical violations
      const cooldown = type.includes('HEAD') || type === 'LOOKING_DOWN' || type === 'SUSPICIOUS_POSTURE' ? 5000 : 3000

      if (now - lastEmit < cooldown) return

      violationCooldownRef.current[type] = now
      if (__AI_DEV__) console.log('[ExamCamera] 🚨 Violation emitted:', type, 'conf:', confidence)
      onViolation({
        type,
        timestamp: now,
        confidence,
        frameCount
      })
    },
    [onViolation]
  )

  // Process detection results → violations
  useEffect(() => {
    if (!enabled || !isReady) return

    // Count detected objects by type
    let phoneCount = 0
    let earphoneCount = 0
    let personCount = 0
    let maxPhoneConf = 0
    let maxEarphoneConf = 0

    for (const det of detections) {
      const vType = classToViolationType(det.label, det.classId)
      if (vType === 'PHONE_DETECTED') {
        phoneCount++
        maxPhoneConf = Math.max(maxPhoneConf, det.conf)
      } else if (vType === 'EARPHONE_DETECTED') {
        earphoneCount++
        maxEarphoneConf = Math.max(maxEarphoneConf, det.conf)
      }
      // Count all person-type detections
      if (det.label.toLowerCase().includes('person')) {
        personCount++
      }
    }

    // Log detections periodically
    if (__AI_DEV__ && detections.length > 0) {
      console.log(
        '[ExamCamera] Detections:',
        detections.map((d) => `${d.label}(${(d.conf * 100).toFixed(0)}%)`).join(', ')
      )
    }

    // Temporal smoothing: update consecutive frame counters
    // PHONE
    if (phoneCount > 0 && maxPhoneConf > AI_CONFIG.DETECT_CONFIDENCE_THRESHOLD) {
      phoneFrameCountRef.current++
      if (phoneFrameCountRef.current >= AI_CONFIG.CRITICAL_FRAME_COUNT) {
        emitViolation('PHONE_DETECTED', maxPhoneConf, phoneFrameCountRef.current)
      }
    } else {
      phoneFrameCountRef.current = Math.max(0, phoneFrameCountRef.current - 1)
    }

    // EARPHONE
    if (earphoneCount > 0 && maxEarphoneConf > AI_CONFIG.DETECT_CONFIDENCE_THRESHOLD) {
      earphoneFrameCountRef.current++
      if (earphoneFrameCountRef.current >= AI_CONFIG.CRITICAL_FRAME_COUNT) {
        emitViolation('EARPHONE_DETECTED', maxEarphoneConf, earphoneFrameCountRef.current)
      }
    } else {
      earphoneFrameCountRef.current = Math.max(0, earphoneFrameCountRef.current - 1)
    }
  }, [detections, enabled, isReady, emitViolation])

  // Composite pose violations (head pose + body posture + phone check)
  useEffect(() => {
    if (!enabled || !isReady) return

    // ─── Composite score-based violations ───
    if (cheatingScore && cheatingScore.level === 'critical' && lookAwayDurationMs >= AI_CONFIG.CHEATING_SUSTAIN_MS) {
      const dominant = cheatingScore.dominantSignal
      if (dominant === 'phoneCheck' && phoneCheck) {
        emitViolation('PHONE_CHECKING_POSE', cheatingScore.overall, 1)
      } else if (dominant === 'headPose' && headPose) {
        if (headPose.pitch > AI_CONFIG.PITCH_THRESHOLD) {
          emitViolation('LOOKING_DOWN', headPose.pitch / 90, 1)
        } else if (Math.abs(headPose.yaw) > AI_CONFIG.YAW_THRESHOLD) {
          emitViolation('HEAD_TURNED', Math.abs(headPose.yaw) / 90, 1)
        }
      } else if (dominant === 'bodyPosture') {
        emitViolation('SUSPICIOUS_POSTURE', cheatingScore.breakdown.bodyPostureScore, 1)
      }
    }

    // ─── Fallback: individual angle-based violations (backward compatible) ───
    if (headPose && isLookingAway && lookAwayDurationMs >= AI_CONFIG.HEAD_SUSTAIN_MS) {
      const absYaw = Math.abs(headPose.yaw)
      const absPitch = Math.abs(headPose.pitch)

      if (absYaw > AI_CONFIG.YAW_THRESHOLD) {
        emitViolation('HEAD_TURNED', absYaw / 90, 1)
      }
      if (absPitch > AI_CONFIG.PITCH_THRESHOLD) {
        emitViolation('HEAD_TILTED', absPitch / 90, 1)
      }
    }
  }, [cheatingScore, phoneCheck, isLookingAway, lookAwayDurationMs, headPose, enabled, isReady, emitViolation])

  // Draw debug overlay on canvas — detections + pose keypoints + skeleton + angles
  useEffect(() => {
    if (!shouldShowDebugOverlay || !canvasRef.current || !videoRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const video = videoRef.current
    canvas.width = video.clientWidth
    canvas.height = video.clientHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Scale factor from original frame coords to display size
    // Keypoints are now un-letterboxed by server → in original frame space (frameW × frameH)
    const scaleX = canvas.width / frameW
    const scaleY = canvas.height / frameH

    // ——— Detection bounding boxes ———
    for (const det of detections) {
      const x = det.x1 * scaleX
      const y = det.y1 * scaleY
      const w = (det.x2 - det.x1) * scaleX
      const h = (det.y2 - det.y1) * scaleY

      const vType = classToViolationType(det.label, det.classId)
      ctx.strokeStyle = vType ? '#ef4444' : '#22c55e'
      ctx.lineWidth = 2
      ctx.strokeRect(x, y, w, h)

      ctx.fillStyle = vType ? '#ef4444' : '#22c55e'
      ctx.font = '10px sans-serif'
      ctx.fillText(`${det.label} ${(det.conf * 100).toFixed(0)}%`, x, y - 3)
    }

    // ——— Pose keypoints + skeleton ———
    const COCO_SKELETON: [number, number][] = [
      [0, 1],
      [0, 2],
      [1, 3],
      [2, 4], // head
      [5, 6],
      [5, 7],
      [7, 9],
      [6, 8],
      [8, 10], // arms
      [5, 11],
      [6, 12],
      [11, 12], // torso
      [11, 13],
      [13, 15],
      [12, 14],
      [14, 16] // legs
    ]
    const KPT_NAMES = [
      'nose',
      'Leye',
      'Reye',
      'Lear',
      'Rear',
      'Lsho',
      'Rsho',
      'Lelb',
      'Relb',
      'Lwri',
      'Rwri',
      'Lhip',
      'Rhip',
      'Lkne',
      'Rkne',
      'Lank',
      'Rank'
    ]
    const KPT_COLORS = [
      '#FF0000',
      '#FF6600',
      '#FFAA00',
      '#FFD700',
      '#FFFF00',
      '#00FF00',
      '#32CD32',
      '#00FA9A',
      '#7CFC00',
      '#ADFF2F',
      '#00CED1',
      '#1E90FF',
      '#0000FF',
      '#8A2BE2',
      '#FF00FF',
      '#FF1493',
      '#FF69B4'
    ]

    for (let pIdx = 0; pIdx < keypoints.length; pIdx++) {
      const kpts = keypoints[pIdx]
      if (!kpts || kpts.length < 51) continue

      // Draw skeleton lines (behind dots)
      ctx.lineWidth = 1.5
      for (const [a, b] of COCO_SKELETON) {
        const ax = kpts[a * 3] * scaleX,
          ay = kpts[a * 3 + 1] * scaleY,
          avis = kpts[a * 3 + 2]
        const bx = kpts[b * 3] * scaleX,
          by = kpts[b * 3 + 1] * scaleY,
          bvis = kpts[b * 3 + 2]
        if (avis < 0.3 || bvis < 0.3) continue
        ctx.strokeStyle = '#00FFFF'
        ctx.beginPath()
        ctx.moveTo(ax, ay)
        ctx.lineTo(bx, by)
        ctx.stroke()
      }

      // Draw keypoint dots
      for (let i = 0; i < 17; i++) {
        const x = kpts[i * 3] * scaleX
        const y = kpts[i * 3 + 1] * scaleY
        const vis = kpts[i * 3 + 2]
        if (vis < 0.1) continue
        const r = vis > 0.5 ? 3 : 2
        ctx.fillStyle = KPT_COLORS[i]
        ctx.beginPath()
        ctx.arc(x, y, r, 0, Math.PI * 2)
        ctx.fill()
        // Label head keypoints with visibility
        if (i <= 4) {
          ctx.fillStyle = '#FFFFFF'
          ctx.font = '7px monospace'
          ctx.fillText(`${KPT_NAMES[i]}:${vis.toFixed(2)}`, x + 4, y - 1)
        }
      }

      // ——— Head pose analysis lines ———
      const nX = kpts[0],
        nY = kpts[1],
        nV = kpts[2]
      const leX = kpts[3 * 3],
        leY = kpts[3 * 3 + 1],
        leV = kpts[3 * 3 + 2] // left ear
      const reX = kpts[4 * 3],
        reY = kpts[4 * 3 + 1],
        reV = kpts[4 * 3 + 2] // right ear

      if (nV > 0.3 && leV > 0.3 && reV > 0.3) {
        // Ear-to-ear line (magenta) — shows roll
        ctx.strokeStyle = '#FF00FF'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(leX * scaleX, leY * scaleY)
        ctx.lineTo(reX * scaleX, reY * scaleY)
        ctx.stroke()

        // Mid-ear point
        const mX = ((leX + reX) / 2) * scaleX
        const mY = ((leY + reY) / 2) * scaleY

        // Mid-ear → Nose line (yellow dashed) — shows yaw direction
        ctx.strokeStyle = '#FFFF00'
        ctx.lineWidth = 2
        ctx.setLineDash([3, 3])
        ctx.beginPath()
        ctx.moveTo(mX, mY)
        ctx.lineTo(nX * scaleX, nY * scaleY)
        ctx.stroke()
        ctx.setLineDash([])

        // Vertical reference from mid-ear (gray dashed) — "ideal" straight
        ctx.strokeStyle = '#888888'
        ctx.lineWidth = 1
        ctx.setLineDash([2, 2])
        ctx.beginPath()
        ctx.moveTo(mX, mY - 20)
        ctx.lineTo(mX, mY + 20)
        ctx.stroke()
        ctx.setLineDash([])

        // Mid-ear marker
        ctx.fillStyle = '#FF00FF'
        ctx.beginPath()
        ctx.arc(mX, mY, 2, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // ——— Head pose angle readout ———
    if (headPose) {
      const tx = 3,
        ty = canvas.height - 38
      ctx.fillStyle = 'rgba(0,0,0,0.75)'
      ctx.fillRect(tx - 1, ty - 9, 82, 38)
      ctx.font = '8px monospace'
      ctx.fillStyle = Math.abs(headPose.yaw) > AI_CONFIG.YAW_THRESHOLD ? '#FF4444' : '#44FF44'
      ctx.fillText(`Yaw:  ${headPose.yaw >= 0 ? '+' : ''}${headPose.yaw.toFixed(1)}°`, tx, ty)
      ctx.fillStyle = Math.abs(headPose.pitch) > AI_CONFIG.PITCH_THRESHOLD ? '#FF4444' : '#44FF44'
      ctx.fillText(`Pitch:${headPose.pitch >= 0 ? '+' : ''}${headPose.pitch.toFixed(1)}°`, tx, ty + 11)
      ctx.fillStyle = Math.abs(headPose.roll) > AI_CONFIG.ROLL_THRESHOLD ? '#FF4444' : '#44FF44'
      ctx.fillText(`Roll: ${headPose.roll >= 0 ? '+' : ''}${headPose.roll.toFixed(1)}°`, tx, ty + 22)
    } else {
      const tx = 3,
        ty = canvas.height - 14
      ctx.fillStyle = 'rgba(0,0,0,0.75)'
      ctx.fillRect(tx - 1, ty - 9, 78, 14)
      ctx.font = '8px monospace'
      ctx.fillStyle = '#AAAAAA'
      ctx.fillText('No pose data', tx, ty)
    }

    // ——— Cheating score readout ———
    if (cheatingScore) {
      const sx = 3,
        sy = canvas.height - 80
      ctx.fillStyle = 'rgba(0,0,0,0.75)'
      ctx.fillRect(sx - 1, sy - 9, 100, 38)
      ctx.font = '8px monospace'
      const levelColors: Record<string, string> = {
        normal: '#44FF44',
        suspicious: '#FFAA00',
        warning: '#FF8800',
        critical: '#FF4444'
      }
      ctx.fillStyle = levelColors[cheatingScore.level] || '#AAAAAA'
      ctx.fillText(`Score: ${(cheatingScore.overall * 100).toFixed(0)}% [${cheatingScore.level}]`, sx, sy)
      ctx.fillStyle = '#AAAAAA'
      ctx.fillText(`Phone: ${(cheatingScore.breakdown.phoneCheckScore * 100).toFixed(0)}%`, sx, sy + 11)
      ctx.fillText(`Dom: ${cheatingScore.dominantSignal}`, sx, sy + 22)
    }

    // ——— "LOOKING AWAY" warning bar ———
    if (isLookingAway) {
      ctx.fillStyle = 'rgba(255,0,0,0.6)'
      ctx.fillRect(0, 0, canvas.width, 14)
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 9px sans-serif'
      ctx.fillText('⚠ LOOKING AWAY', 4, 10)
    }

    // ——— Bottom-right count debug ———
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(canvas.width - 58, canvas.height - 14, 58, 14)
    ctx.fillStyle = '#AAAAAA'
    ctx.font = '7px monospace'
    ctx.fillText(`KPT:${keypoints.length} DET:${detections.length}`, canvas.width - 56, canvas.height - 4)
  }, [detections, keypoints, headPose, isLookingAway, cheatingScore, shouldShowDebugOverlay, frameW, frameH])

  return (
    <div className='fixed top-20 left-2 z-30 pointer-events-none sm:pointer-events-auto sm:top-auto sm:left-4 sm:bottom-4'>
      {/* Camera preview — larger for better visibility */}
      <div
        className={`relative bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700 ${shouldShowDebugOverlay ? 'w-44 h-32 sm:w-80 sm:h-60' : 'w-32 h-24 sm:w-44 sm:h-36'}`}
      >
        {/* Video element ALWAYS rendered — never conditionally remove from DOM */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className='w-full h-full object-cover'
          style={{
            transform: 'scaleX(-1)',
            display: cameraActive ? 'block' : 'none'
          }}
        />

        {/* Debug canvas overlay */}
        {shouldShowDebugOverlay && cameraActive && (
          <canvas
            ref={canvasRef}
            className='absolute inset-0 w-full h-full pointer-events-none'
            style={{ transform: 'scaleX(-1)' }}
          />
        )}

        {/* Placeholder when camera not active */}
        {!cameraActive && (
          <div className='absolute inset-0 flex flex-col items-center justify-center bg-gray-900 text-white gap-2 p-2'>
            {cameraError ? (
              <>
                <WifiOff className='w-6 h-6 text-red-400' />
                <span className='text-[9px] text-red-300 text-center leading-tight'>{cameraError}</span>
              </>
            ) : (
              <>
                <Camera className='w-6 h-6 text-gray-400 animate-pulse' />
                <span className='text-[9px] text-gray-400'>Đang mở camera...</span>
              </>
            )}
          </div>
        )}

        {/* Status indicators */}
        <div className='absolute top-1 left-1 flex items-center gap-1'>
          {isLoading && (
            <span className='bg-yellow-500/90 text-white text-[8px] px-1.5 py-0.5 rounded-full flex items-center'>
              <Loader2 className='w-2.5 h-2.5 mr-0.5 animate-spin' />
              AI Loading
            </span>
          )}
          {isReady && (
            <span className='bg-green-500/90 text-white text-[8px] px-1.5 py-0.5 rounded-full flex items-center'>
              <Shield className='w-2.5 h-2.5 mr-0.5' />
              AI Active
            </span>
          )}
          {detectionError && (
            <span className='bg-red-500/90 text-white text-[8px] px-1.5 py-0.5 rounded-full'>AI Error</span>
          )}
        </div>

        {/* FPS & EP indicator — always show when ready */}
        {isReady && (
          <div className='absolute top-1 right-1 text-[8px] text-green-400 bg-black/60 px-1.5 py-0.5 rounded'>
            <Cpu className='w-2 h-2 inline mr-0.5' />
            {executionProvider} | {fps}fps
          </div>
        )}

        {/* Face not visible warning */}
        {isReady && !isFaceVisible && (
          <div className='absolute top-1/2 left-0 right-0 -translate-y-1/2 bg-orange-500/90 text-white text-center py-1.5 px-2'>
            <span className='text-[8px] sm:text-[10px] font-semibold leading-tight'>
              ⚠ Không phát hiện khuôn mặt — Vui lòng ngồi trước camera
            </span>
          </div>
        )}

        {/* Status bar at bottom */}
        <div className='absolute bottom-0 inset-x-0 bg-black/80 text-center py-0.5'>
          <span className='text-[8px] text-gray-300'>{statusText}</span>
        </div>
      </div>
    </div>
  )
}

export default ExamCamera
