/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef } from 'react'
import { Camera, AlertTriangle } from 'lucide-react'
import FingerprintJS from '@fingerprintjs/fingerprintjs'
import { toast } from 'sonner'

interface ExamSecurityProps {
  sessionId: string
  studentId: string
  studentName: string
  onViolation: (type: string, details: any) => void
  socket: any
  requireWebcam?: boolean
}

const ExamSecurity: React.FC<ExamSecurityProps> = ({
  sessionId,
  studentId,
  studentName,
  onViolation,
  socket,
  requireWebcam = false
}) => {
  const [deviceInfo, setDeviceInfo] = useState<any>(null)
  const [webcamActive, setWebcamActive] = useState(false)
  const [checksPassed, setChecksPassed] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const watermarkIntervalRef = useRef<number | null>(null)
  const activityTimeoutRef = useRef<number | null>(null)
  const lastActivityRef = useRef<number>(Date.now())

  // Record mouse and keyboard activity
  useEffect(() => {
    const recordActivity = () => {
      lastActivityRef.current = Date.now()
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current)
      }

      // Check for inactivity after 30 seconds
      activityTimeoutRef.current = window.setTimeout(() => {
        const inactiveTime = (Date.now() - lastActivityRef.current) / 1000
        if (inactiveTime > 30) {
          onViolation('inactivity', { seconds: inactiveTime })
          socket?.emit('exam_violation', {
            session_id: sessionId,
            type: 'inactivity',
            details: { seconds: inactiveTime }
          })
        }
      }, 30000)
    }

    window.addEventListener('mousemove', recordActivity)
    window.addEventListener('keydown', recordActivity)
    window.addEventListener('click', recordActivity)

    return () => {
      window.removeEventListener('mousemove', recordActivity)
      window.removeEventListener('keydown', recordActivity)
      window.removeEventListener('click', recordActivity)
      if (activityTimeoutRef.current) {
        clearTimeout(activityTimeoutRef.current)
      }
    }
  }, [sessionId, onViolation, socket])

  // Handle screenshot and screen recording detection
  useEffect(() => {
    // This isn't foolproof but can detect some attempts
    const detectScreenCapture = () => {
      if (document.visibilityState === 'hidden') {
        // Only count as violation if not tab switching (which is handled separately)
        const now = new Date().getTime()
        if (now - lastActivityRef.current < 100) {
          // If activity happened right before
          onViolation('screen_capture_attempt', { timestamp: now })
          socket?.emit('exam_violation', {
            session_id: sessionId,
            type: 'screen_capture_attempt',
            details: { timestamp: now }
          })
        }
      }
    }

    document.addEventListener('visibilitychange', detectScreenCapture)

    // Disable various key combinations used for screenshots and developer tools
    const preventKeyboardShortcuts = (e: KeyboardEvent) => {
      // Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (DevTools)
      // PrintScreen, Ctrl+P (Print/Screenshot)
      // F12 (DevTools)
      if (
        (e.ctrlKey &&
          e.shiftKey &&
          (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) ||
        e.key === 'PrintScreen' ||
        (e.ctrlKey && (e.key === 'p' || e.key === 'P')) ||
        e.key === 'F12'
      ) {
        e.preventDefault()
        onViolation('keyboard_shortcut', { key: e.key, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey })
        socket?.emit('exam_violation', {
          session_id: sessionId,
          type: 'keyboard_shortcut',
          details: { key: e.key, ctrlKey: e.ctrlKey, shiftKey: e.shiftKey }
        })
        return false
      }
    }

    window.addEventListener('keydown', preventKeyboardShortcuts)

    // Prevent right-click context menu
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    document.addEventListener('contextmenu', preventContextMenu)

    return () => {
      document.removeEventListener('visibilitychange', detectScreenCapture)
      window.removeEventListener('keydown', preventKeyboardShortcuts)
      document.removeEventListener('contextmenu', preventContextMenu)
    }
  }, [sessionId, onViolation, socket])

  // Create visual watermarks with student info
  useEffect(() => {
    if (!checksPassed) return

    // Create watermarks
    const createWatermarks = () => {
      // Remove any existing watermarks
      const existingWatermarks = document.querySelectorAll('.exam-watermark')
      existingWatermarks.forEach((el) => el.remove())

      // Create a new watermark
      const watermark = document.createElement('div')
      watermark.className = 'exam-watermark'
      watermark.innerHTML = `ID: ${studentId}<br>${studentName}<br>${new Date().toLocaleTimeString()}`

      // Position randomly but ensure readability
      const left = Math.random() * 70 // 0-70% from left
      const top = Math.random() * 70 // 0-70% from top

      Object.assign(watermark.style, {
        position: 'fixed',
        left: `${left}%`,
        top: `${top}%`,
        transform: 'rotate(-30deg)',
        fontSize: '16px',
        color: 'rgba(100, 100, 100, 0.3)',
        padding: '10px',
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: '9999',
        textShadow: '0px 0px 2px rgba(150,150,150,0.2)'
      })

      document.body.appendChild(watermark)
    }

    // Create initial watermark
    createWatermarks()

    // Rotate watermarks every 5-10 seconds
    watermarkIntervalRef.current = window.setInterval(
      () => {
        createWatermarks()
      },
      5000 + Math.random() * 5000
    )

    return () => {
      if (watermarkIntervalRef.current) {
        clearInterval(watermarkIntervalRef.current)
      }
      // Clean up any watermarks
      const existingWatermarks = document.querySelectorAll('.exam-watermark')
      existingWatermarks.forEach((el) => el.remove())
    }
  }, [checksPassed, studentId, studentName])

  // Collect device fingerprint
  useEffect(() => {
    const getDeviceFingerprint = async () => {
      try {
        // Load FingerprintJS
        const fp = await FingerprintJS.load()

        // Get browser fingerprint
        const result = await fp.get()

        // Additional browser/device info
        const deviceInfo = {
          fingerprint: result.visitorId,
          userAgent: navigator.userAgent,
          screenResolution: `${window.screen.width}x${window.screen.height}`,
          availableScreenSize: `${window.screen.availWidth}x${window.screen.availHeight}`,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language: navigator.language,
          platform: navigator.platform,
          cores: navigator.hardwareConcurrency,
          touchSupport: 'ontouchstart' in window,
          colorDepth: window.screen.colorDepth,
          timestamp: new Date().toISOString()
        }

        setDeviceInfo(deviceInfo)

        // Send to server
        socket?.emit('register_device', {
          session_id: sessionId,
          device_info: deviceInfo
        })

        // Device check passed
        setChecksPassed(true)
      } catch (error) {
        console.error('Error getting device fingerprint:', error)
        onViolation('fingerprint_failed', { error: String(error) })
      }
    }

    getDeviceFingerprint()
  }, [sessionId, onViolation, socket])

  // Initialize webcam if required
  useEffect(() => {
    if (!requireWebcam || webcamActive) return

    const initializeWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })

        if (videoRef.current) {
          videoRef.current.srcObject = stream
          setWebcamActive(true)

          // Take an initial verification photo
          setTimeout(() => {
            if (videoRef.current) {
              const canvas = document.createElement('canvas')
              canvas.width = videoRef.current.videoWidth
              canvas.height = videoRef.current.videoHeight
              const ctx = canvas.getContext('2d')

              if (ctx && videoRef.current) {
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
                const photoData = canvas.toDataURL('image/jpeg', 0.7)

                // Send to server for verification
                socket?.emit('webcam_verification', {
                  session_id: sessionId,
                  photo: photoData
                })
              }
            }
          }, 3000) // Wait 3 seconds to ensure the camera is ready
        }
      } catch (error) {
        console.error('Error accessing webcam:', error)
        onViolation('webcam_access_failed', { error: String(error) })
        toast.error('Camera access is required for this exam')
      }
    }

    initializeWebcam()

    // Cleanup function
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream
        const tracks = stream.getTracks()
        tracks.forEach((track) => track.stop())
      }
    }
  }, [requireWebcam, webcamActive, sessionId, onViolation, socket])

  if (!checksPassed) {
    return (
      <div className='fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50'>
        <div className='text-center p-6 max-w-md'>
          <AlertTriangle className='mx-auto h-12 w-12 text-yellow-500 mb-4' />
          <h2 className='text-xl font-bold mb-2'>Initializing Exam Security</h2>
          <p className='text-gray-600 mb-4'>Please wait while we secure your exam environment...</p>
          <div className='w-full bg-gray-200 rounded-full h-2.5'>
            <div className='bg-blue-600 h-2.5 rounded-full animate-pulse' style={{ width: '100%' }}></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      {requireWebcam && (
        <div className='fixed top-4 left-4 w-32 h-24 bg-black rounded-lg overflow-hidden shadow-lg z-50'>
          {webcamActive ? (
            <video ref={videoRef} autoPlay playsInline muted className='w-full h-full object-cover' />
          ) : (
            <div className='w-full h-full flex items-center justify-center bg-gray-800 text-white'>
              <Camera className='w-8 h-8' />
            </div>
          )}
        </div>
      )}
    </>
  )
}

export default ExamSecurity
