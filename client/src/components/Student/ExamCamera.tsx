/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
// AI Exam Proctoring — ExamCamera component
// Webcam feed with AI detection status + optional bbox overlay

import React, { useRef, useEffect, useState, useCallback } from 'react'
import { Camera, Cpu, Shield, WifiOff, Loader2 } from 'lucide-react'
import { useYoloDetection } from '../../hooks/useYoloDetection'
import { useHeadPose } from '../../hooks/useHeadPose'
import type { AIViolation, AIViolationType } from '../../utils/aiTypes'
import { AI_CONFIG, classToViolationType } from '../../utils/aiTypes'

interface ExamCameraProps {
  enabled: boolean
  onViolation: (violation: AIViolation) => void
  showDebugOverlay?: boolean
}

const ExamCamera: React.FC<ExamCameraProps> = ({ enabled, onViolation, showDebugOverlay = false }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [cameraActive, setCameraActive] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [statusText, setStatusText] = useState('Đang khởi tạo...')

  // Track consecutive frame counts for temporal smoothing
  const phoneFrameCountRef = useRef(0)
  const earphoneFrameCountRef = useRef(0)
  const violationCooldownRef = useRef<Record<string, number>>({})

  // Detection hook
  const {
    isLoading,
    isReady,
    error: detectionError,
    executionProvider,
    detections,
    keypoints,
    fps,
    inferenceTimeMs
  } = useYoloDetection({ enabled: enabled && cameraActive, videoRef })

  // Head pose hook
  const { headPose, isLookingAway, lookAwayDurationMs } = useHeadPose({ keypoints, enabled: enabled && cameraActive })

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
      setStatusText(`✅ AI đang chạy (${executionProvider} | ${fps}fps)`)
    } else {
      setStatusText('⏳ Đang khởi tạo AI...')
    }
  }, [cameraError, cameraActive, isLoading, detectionError, isReady, executionProvider, fps])

  // Initialize webcam
  useEffect(() => {
    if (!enabled) {
      console.log('[ExamCamera] Not enabled, skipping camera init')
      return
    }

    let stream: MediaStream | null = null
    let cancelled = false

    const initCamera = async () => {
      console.log('[ExamCamera] Starting camera initialization...')
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
          console.log('[ExamCamera] ✅ Camera active and playing')
        } else {
          console.error('[ExamCamera] videoRef.current is null!')
          setCameraError('Video element not ready')
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
        setCameraActive(false)
      }
    }

    initCamera()

    return () => {
      cancelled = true
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
        console.log('[ExamCamera] Camera stream stopped (cleanup)')
      }
      setCameraActive(false)
    }
  }, [enabled])

  // Emit violation with cooldown (prevent spam)
  const emitViolation = useCallback(
    (type: AIViolationType, confidence: number, frameCount: number) => {
      const now = Date.now()
      const lastEmit = violationCooldownRef.current[type] || 0
      const cooldown = type.includes('HEAD') ? 5000 : 3000 // 5s for head, 3s for critical

      if (now - lastEmit < cooldown) return

      violationCooldownRef.current[type] = now
      console.log('[ExamCamera] 🚨 Violation emitted:', type, 'conf:', confidence)
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
    if (detections.length > 0) {
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

  // Head pose violations
  useEffect(() => {
    if (!enabled || !isReady || !headPose) return

    if (isLookingAway && lookAwayDurationMs >= AI_CONFIG.HEAD_SUSTAIN_MS) {
      const absYaw = Math.abs(headPose.yaw)
      const absPitch = Math.abs(headPose.pitch)

      if (absYaw > AI_CONFIG.YAW_THRESHOLD) {
        emitViolation('HEAD_TURNED', absYaw / 90, 1)
      }
      if (absPitch > AI_CONFIG.PITCH_THRESHOLD) {
        emitViolation('HEAD_TILTED', absPitch / 90, 1)
      }
    }
  }, [isLookingAway, lookAwayDurationMs, headPose, enabled, isReady, emitViolation])

  // Draw debug overlay on canvas — detections + pose keypoints + skeleton + angles
  useEffect(() => {
    if (!showDebugOverlay || !canvasRef.current || !videoRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const video = videoRef.current
    canvas.width = video.clientWidth
    canvas.height = video.clientHeight

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Scale factor from model 640x640 to display size
    const scaleX = canvas.width / 640
    const scaleY = canvas.height / 640

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
  }, [detections, keypoints, headPose, isLookingAway, showDebugOverlay])

  return (
    <div className='fixed bottom-4 left-4 z-40'>
      {/* Camera preview — larger for better visibility */}
      <div
        className={`relative bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-gray-700 ${showDebugOverlay ? 'w-80 h-60' : 'w-44 h-36'}`}
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
        {showDebugOverlay && cameraActive && (
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

        {/* Status bar at bottom */}
        <div className='absolute bottom-0 inset-x-0 bg-black/80 text-center py-0.5'>
          <span className='text-[8px] text-gray-300'>{statusText}</span>
        </div>
      </div>
    </div>
  )
}

export default ExamCamera
