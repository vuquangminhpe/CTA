/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable prefer-rest-params */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'

interface Props {
  onScreenCaptureDetected: () => void
  enabled?: boolean
}

/**
 * Enhanced component to detect and prevent screen capture attempts
 * Uses multiple detection techniques for improved effectiveness
 */
const ScreenCaptureDetector: React.FC<Props> = ({ onScreenCaptureDetected, enabled = true }) => {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const lastScreenshotTime = useRef<number>(0)
  const screenshotAttemptCount = useRef<number>(0)

  useEffect(() => {
    if (!enabled) return

    // DETECTION METHOD 1: CSS-based detection using screenshot feedback
    // Create a unique CSS fingerprint that changes when screenshot is taken
    const createScreenshotFeedback = () => {
      const style = document.createElement('style')

      // Generate a unique random color for this session
      const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`

      style.innerHTML = `
        @media (prefers-color-scheme: dark) {
          body::after {
            content: "";
            position: fixed;
            top: -100%;
            left: -100%;
            width: 1px;
            height: 1px;
            background: ${randomColor};
            z-index: -9999;
          }
        }
      `

      document.head.appendChild(style)

      // Set up detection listener
      const detectScreenshot = () => {
        const now = Date.now()
        // Prevent multiple triggers in short succession
        if (now - lastScreenshotTime.current < 1000) return

        lastScreenshotTime.current = now
        screenshotAttemptCount.current += 1

        if (screenshotAttemptCount.current >= 1) {
          toast.error('Đã phát hiện thấy ảnh chụp màn hình!')
          onScreenCaptureDetected()

          // Add immediate visual feedback
          const feedback = document.createElement('div')
          feedback.style.position = 'fixed'
          feedback.style.top = '0'
          feedback.style.left = '0'
          feedback.style.width = '100%'
          feedback.style.height = '100%'
          feedback.style.backgroundColor = 'rgba(255,0,0,0.3)'
          feedback.style.color = 'white'
          feedback.style.display = 'flex'
          feedback.style.alignItems = 'center'
          feedback.style.justifyContent = 'center'
          feedback.style.zIndex = '9999'
          feedback.style.fontSize = '32px'
          feedback.style.fontWeight = 'bold'
          feedback.style.textAlign = 'center'
          feedback.innerHTML = 'SCREENSHOT DETECTED<br/>EXAM TERMINATED'

          document.body.appendChild(feedback)

          // Remove after 3 seconds
          setTimeout(() => {
            if (document.body.contains(feedback)) {
              document.body.removeChild(feedback)
            }
          }, 3000)
        }
      }

      // Detect via media query changes (this works on many browsers)
      const mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)')
      mediaQueryList.addEventListener('change', detectScreenshot)

      return () => {
        mediaQueryList.removeEventListener('change', detectScreenshot)
        if (document.head.contains(style)) {
          document.head.removeChild(style)
        }
      }
    }

    // DETECTION METHOD 2: Canvas-based screenshot detection
    const setupCanvasDetection = () => {
      // Create a hidden canvas with a timestamp that updates frequently
      const canvas = document.createElement('canvas')
      canvas.width = 200
      canvas.height = 50
      canvas.style.position = 'fixed'
      canvas.style.top = '-9999px'
      canvas.style.left = '-9999px'
      document.body.appendChild(canvas)

      const context = canvas.getContext('2d')
      if (!context) return () => {}

      let previousData: ImageData | null = null
      let lastUpdateTime = Date.now()
      const checkInterval = 100 // Check every 100ms

      // Update canvas with current timestamp
      const updateCanvas = () => {
        if (!context) return

        // Clear canvas
        context.clearRect(0, 0, canvas.width, canvas.height)

        // Draw random pattern and current timestamp
        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.fillStyle = '#000000'
        context.font = '12px Arial'
        context.fillText(`Timestamp: ${Date.now()}`, 10, 20)

        // Generate random dots
        for (let i = 0; i < 50; i++) {
          const x = Math.random() * canvas.width
          const y = Math.random() * canvas.height
          context.fillRect(x, y, 1, 1)
        }

        // Save current data for comparison
        previousData = context.getImageData(0, 0, canvas.width, canvas.height)
        lastUpdateTime = Date.now()
      }

      // Check if canvas has been captured
      const checkCanvasCapture = () => {
        if (!context || !previousData) return

        // If the canvas hasn't been updated recently (which it should be)
        // and the content remains the same, it might have been frozen due to screenshot
        const currentTime = Date.now()
        if (currentTime - lastUpdateTime > checkInterval * 2) {
          const currentData = context.getImageData(0, 0, canvas.width, canvas.height)

          // Compare data - if identical when it should have changed, possible screenshot
          let identical = true
          for (let i = 0; i < previousData.data.length; i += 100) {
            // Sample every 100 pixels
            if (previousData.data[i] !== currentData.data[i]) {
              identical = false
              break
            }
          }

          if (identical) {
            screenshotAttemptCount.current += 1
            if (screenshotAttemptCount.current >= 2) {
              toast.error('Có thể đã phát hiện có ghi lại màn hình!')
              onScreenCaptureDetected()
            }
          }
        }

        updateCanvas()
      }

      // Initial update
      updateCanvas()

      // Set interval for updates and checks
      const intervalId = setInterval(checkCanvasCapture, checkInterval)

      return () => {
        clearInterval(intervalId)
        if (document.body.contains(canvas)) {
          document.body.removeChild(canvas)
        }
      }
    }

    // DETECTION METHOD 3: Visual changes during screenshot
    const createVisualTrap = () => {
      const trap = document.createElement('div')
      trap.id = 'screenshot-trap'
      trap.style.position = 'fixed'
      trap.style.width = '100vw'
      trap.style.height = '100vh'
      trap.style.top = '0'
      trap.style.left = '0'
      trap.style.pointerEvents = 'none'
      trap.style.zIndex = '9999'
      trap.style.opacity = '0'
      trap.style.transition = 'opacity 0.1s'
      trap.style.backgroundColor = 'red'
      trap.style.display = 'flex'
      trap.style.alignItems = 'center'
      trap.style.justifyContent = 'center'
      trap.style.color = 'white'
      trap.style.fontSize = '48px'
      trap.style.fontWeight = 'bold'

      // CSS that only activates during screenshot/print
      const style = document.createElement('style')
      style.innerHTML = `
        @media print, (min-resolution: 2dppx) {
          #screenshot-trap {
            opacity: 0.8 !important;
            content: "UNAUTHORIZED SCREENSHOT";
          }
        }
      `

      document.head.appendChild(style)
      document.body.appendChild(trap)

      return () => {
        if (document.head.contains(style)) {
          document.head.removeChild(style)
        }
        if (document.body.contains(trap)) {
          document.body.removeChild(trap)
        }
      }
    }

    // DETECTION METHOD 4: Focus/blur detection
    const detectFocusChanges = () => {
      let focusChangeCount = 0
      let lastFocusTime = Date.now()

      const handleVisibilityChange = () => {
        if (document.hidden) {
          const now = Date.now()
          // Only count rapid focus changes (within 500ms)
          if (now - lastFocusTime < 500) {
            focusChangeCount++

            if (focusChangeCount >= 3) {
              // Rapid focus changes can indicate screenshot tools
              toast.warning('Đã phát hiện hoạt động tab đáng ngờ')
              onScreenCaptureDetected()
              focusChangeCount = 0
            }
          } else {
            focusChangeCount = 1
          }

          lastFocusTime = now
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
      }
    }

    // DETECTION METHOD 5: Direct keyboard monitoring for advanced screenshot tools
    const monitorKeyboard = () => {
      const handleKeyDown = (e: KeyboardEvent) => {
        // Windows Snipping Tool shortcuts
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 's' || e.key === 'S')) {
          e.preventDefault()
          e.stopPropagation()
          toast.error('Đã phát hiện thấy lối tắt ảnh chụp màn hình!')
          onScreenCaptureDetected()
          return false
        }

        // PrintScreen key
        if (e.key === 'PrintScreen') {
          e.preventDefault()
          e.stopPropagation()
          toast.error('Đã phát hiện thấy lối tắt ảnh chụp màn hình!')
          onScreenCaptureDetected()
          return false
        }

        // macOS screenshot shortcuts
        if (e.metaKey && e.shiftKey && (e.key === '3' || e.key === '4' || e.key === '5')) {
          e.preventDefault()
          e.stopPropagation()
          toast.error('Đã phát hiện thấy lối tắt ảnh chụp màn hình!')
          onScreenCaptureDetected()
          return false
        }
      }

      // Use multiple layers of event handlers to improve chances of capturing the event
      window.addEventListener('keydown', handleKeyDown, { capture: true })
      document.addEventListener('keydown', handleKeyDown, { capture: true })

      // Also override document keydown handler at a low level
      const originalAddEventListener = document.addEventListener
      document.addEventListener = function (...args: any[]) {
        if (args[0] === 'keydown' || args[0] === 'keyup') {
          const originalHandler = args[1]
          args[1] = function (event: KeyboardEvent) {
            if (
              event.key === 'PrintScreen' ||
              (event.ctrlKey && event.shiftKey && (event.key === 's' || event.key === 'S')) ||
              (event.metaKey && event.shiftKey && ['3', '4', '5'].includes(event.key))
            ) {
              event.preventDefault()
              event.stopPropagation()
              toast.error('Đã phát hiện thấy lối tắt ảnh chụp màn hình!')
              onScreenCaptureDetected()
              return false
            }
            // @ts-ignore
            return originalHandler.apply(this, arguments)
          }
        }
        // @ts-ignore
        return originalAddEventListener.apply(this, args)
      }

      return () => {
        window.removeEventListener('keydown', handleKeyDown, { capture: true })
        document.removeEventListener('keydown', handleKeyDown, { capture: true })
        document.addEventListener = originalAddEventListener
      }
    }

    // DETECTION METHOD 6: Clipboard monitoring
    const monitorClipboard = () => {
      const handleCopy = (e: ClipboardEvent) => {
        // Only allow copy from form elements
        if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
          e.preventDefault()
          screenshotAttemptCount.current += 1

          if (screenshotAttemptCount.current >= 2) {
            toast.error('Copying exam content is not allowed!')
            onScreenCaptureDetected()
          } else {
            toast.warning('Copying exam content is not allowed!')
          }
        }
      }

      document.addEventListener('copy', handleCopy)
      document.addEventListener('cut', handleCopy)

      return () => {
        document.removeEventListener('copy', handleCopy)
        document.removeEventListener('cut', handleCopy)
      }
    }

    // DETECTION METHOD 7: Browser-specific screen capture API interception
    const interceptScreenCaptureAPIs = () => {
      if (navigator.mediaDevices && 'getDisplayMedia' in navigator.mediaDevices) {
        const originalGetDisplayMedia = navigator.mediaDevices.getDisplayMedia
        // @ts-ignore
        navigator.mediaDevices.getDisplayMedia = function (...args) {
          toast.error('Screen sharing attempt detected!')
          onScreenCaptureDetected()
          // Still allow the original function to run, but alert the system
          // @ts-ignore
          return originalGetDisplayMedia.apply(this, args)
        }

        setIsMonitoring(true)

        return () => {
          navigator.mediaDevices.getDisplayMedia = originalGetDisplayMedia
          setIsMonitoring(false)
        }
      }

      return () => {}
    }

    // Combine all detection methods
    const cleanupFunctions = [
      createScreenshotFeedback(),
      setupCanvasDetection(),
      createVisualTrap(),
      detectFocusChanges(),
      monitorKeyboard(),
      monitorClipboard(),
      interceptScreenCaptureAPIs()
    ]

    // Return cleanup function
    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup && cleanup())
    }
  }, [enabled, onScreenCaptureDetected])

  return null
}

export default ScreenCaptureDetector
