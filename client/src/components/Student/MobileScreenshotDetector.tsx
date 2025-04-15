/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'

interface MobileScreenshotDetectorProps {
  onScreenCaptureDetected: () => void
  enabled?: boolean
  sessionId: string
  socket: any
}

/**
 * Enhanced screenshot detection component with specific mobile optimization
 * Uses multiple detection techniques and avoids false positives on mobile
 */
const MobileScreenshotDetector: React.FC<MobileScreenshotDetectorProps> = ({
  onScreenCaptureDetected,
  enabled = true,
  sessionId,
  socket
}) => {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const lastScreenshotTime = useRef<number>(0)
  const screenshotAttemptCount = useRef<number>(0)

  // Device detection
  const [isMobile, setIsMobile] = useState(false)
  const [deviceInfo, setDeviceInfo] = useState<any>(null)

  // Visual difference detection
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const previousImagesRef = useRef<ImageData[]>([])
  const captureIntervalRef = useRef<number | null>(null)

  // Reference dimensions for capturing samples
  const sampleWidth = 50
  const sampleHeight = 50

  // Setup device detection
  useEffect(() => {
    if (!enabled) return

    // Check if device is mobile
    const checkMobile = () => {
      const userAgent = navigator.userAgent.toLowerCase()
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
      setIsMobile(isMobileDevice)

      // Gather additional device info
      const info = {
        userAgent,
        platform: navigator.platform,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        devicePixelRatio: window.devicePixelRatio,
        orientation: window.screen.orientation ? window.screen.orientation.type : 'unknown',
        vendor: navigator.vendor,
        isMobile: isMobileDevice
      }

      setDeviceInfo(info)

      // Send device info to server for tracking
      if (socket && sessionId) {
        socket.emit('register_device_extended', {
          session_id: sessionId,
          device_info: info
        })
      }
    }

    checkMobile()

    // Also check on orientation change as this can be a signal of screenshot on some devices
    window.addEventListener('orientationchange', checkMobile)

    return () => {
      window.removeEventListener('orientationchange', checkMobile)
    }
  }, [enabled, socket, sessionId])

  // Initialize canvas for visual difference detection
  useEffect(() => {
    if (!enabled || !isMobile) return

    // Create hidden canvas
    const canvas = document.createElement('canvas')
    canvas.width = sampleWidth
    canvas.height = sampleHeight
    canvas.style.position = 'fixed'
    canvas.style.top = '-9999px'
    canvas.style.left = '-9999px'
    document.body.appendChild(canvas)
    canvasRef.current = canvas

    return () => {
      if (document.body.contains(canvas)) {
        document.body.removeChild(canvas)
      }
    }
  }, [enabled, isMobile])

  // Handle visual comparison detection for mobile
  useEffect(() => {
    if (!enabled || !isMobile || !canvasRef.current) return

    const canvas = canvasRef.current
    const context = canvas.getContext('2d', { willReadFrequently: true })
    if (!context) return

    // Take visual samples of different parts of the screen
    const captureScreenSamples = () => {
      const samples = [
        { x: 0, y: 0 }, // Top-left
        { x: window.innerWidth - sampleWidth, y: 0 }, // Top-right
        { x: 0, y: window.innerHeight - sampleHeight }, // Bottom-left
        { x: window.innerWidth - sampleWidth, y: window.innerHeight - sampleHeight } // Bottom-right
      ]

      // Clean previous images if we have too many
      if (previousImagesRef.current.length > 20) {
        previousImagesRef.current = previousImagesRef.current.slice(-10)
      }

      // For each sample location
      samples.forEach((sample, index) => {
        try {
          // Draw from screen to canvas
          context.clearRect(0, 0, canvas.width, canvas.height)

          // Use a colored rectangle with timestamp as a unique marker
          context.fillStyle = `rgb(${Date.now() % 255}, ${(Date.now() / 1000) % 255}, ${(Date.now() / 2000) % 255})`
          context.fillRect(0, 0, canvas.width, canvas.height)
          context.fillStyle = 'white'
          context.font = '8px Arial'
          context.fillText(`${Date.now()}`, 5, 10)

          // Save image data
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
          previousImagesRef.current.push(imageData)
        } catch (error) {
          console.error('Error capturing screen sample', error)
        }
      })
    }

    // Setup periodic capture
    captureIntervalRef.current = window.setInterval(captureScreenSamples, 500) as unknown as number

    return () => {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current)
      }
    }
  }, [enabled, isMobile])

  // Mobile-specific screenshot detection
  useEffect(() => {
    if (!enabled || !isMobile) return

    // iOS-specific display capture detection
    const detectIOSCapture = () => {
      let previousTime = Date.now()
      let frameDropDetected = false

      // Check for frame drops that happen during iOS screenshots
      const checkFrame = () => {
        const now = Date.now()
        const elapsed = now - previousTime

        // If we detect a significant frame delay (iOS screenshot typically causes this)
        if (elapsed > 200 && !frameDropDetected) {
          frameDropDetected = true
          screenshotAttemptCount.current += 1

          // Throttle to prevent multiple triggers
          if (now - lastScreenshotTime.current > 1000 && screenshotAttemptCount.current >= 1) {
            lastScreenshotTime.current = now
            handlePotentialScreenshot('ios_frame_drop')
          }

          // Reset after a short delay
          setTimeout(() => {
            frameDropDetected = false
          }, 1000)
        }

        previousTime = now
        requestAnimationFrame(checkFrame)
      }

      requestAnimationFrame(checkFrame)
    }

    // Android-specific detection
    const detectAndroidCapture = () => {
      // Android often changes window dimensions slightly during screenshot
      let previousWidth = window.innerWidth
      let previousHeight = window.innerHeight

      const checkDimensions = () => {
        if (Math.abs(window.innerWidth - previousWidth) > 1 || Math.abs(window.innerHeight - previousHeight) > 1) {
          // This might be a screenshot or just rotation/resize
          // We'll check if it's a momentary change
          setTimeout(() => {
            if (
              Math.abs(window.innerWidth - previousWidth) <= 1 &&
              Math.abs(window.innerHeight - previousHeight) <= 1
            ) {
              // Dimensions returned to normal quickly - possible screenshot
              const now = Date.now()
              if (now - lastScreenshotTime.current > 1000) {
                lastScreenshotTime.current = now
                screenshotAttemptCount.current += 1

                if (screenshotAttemptCount.current >= 1) {
                  handlePotentialScreenshot('android_dimension_change')
                }
              }
            }

            // Update previous dimensions
            previousWidth = window.innerWidth
            previousHeight = window.innerHeight
          }, 300)
        }
      }

      // Check periodically
      const intervalId = setInterval(checkDimensions, 100)

      return () => clearInterval(intervalId)
    }

    // Image brightness check (screenshot often causes momentary brightness change)
    const setupBrightnessCheck = () => {
      // Create a fullscreen overlay to detect brightness changes
      const overlay = document.createElement('div')
      overlay.style.position = 'fixed'
      overlay.style.top = '0'
      overlay.style.left = '0'
      overlay.style.width = '100vw'
      overlay.style.height = '100vh'
      overlay.style.backgroundColor = 'rgba(0,0,0,0.01)' // Almost invisible
      overlay.style.pointerEvents = 'none'
      overlay.style.zIndex = '9999999'
      document.body.appendChild(overlay)

      // Use MutationObserver to detect if any screenshot UI appears
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            // Look for screenshot UI elements (this is platform-specific and might need tuning)
            Array.from(mutation.addedNodes).forEach((node) => {
              if (node instanceof HTMLElement) {
                // Check for typical screenshot UI elements
                const innerHTML = node.innerHTML?.toLowerCase() || ''
                const classNames = node.className?.toLowerCase() || ''

                if (
                  innerHTML.includes('screenshot') ||
                  classNames.includes('screenshot') ||
                  innerHTML.includes('screen capture') ||
                  classNames.includes('screen-capture')
                ) {
                  handlePotentialScreenshot('ui_element_detection')
                }
              }
            })
          }
        }
      })

      // Start observing
      observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
      })

      return () => {
        observer.disconnect()
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay)
        }
      }
    }

    // Visual fingerprinting method
    const setupVisualFingerprinting = () => {
      // Create hidden elements with unique patterns for tracking
      const fingerprints: HTMLElement[] = []

      for (let i = 0; i < 3; i++) {
        const elem = document.createElement('div')
        elem.style.position = 'fixed'
        elem.style.opacity = '0.01' // Almost invisible
        elem.style.pointerEvents = 'none'
        elem.style.zIndex = '9999'

        // Position differently
        if (i === 0) {
          elem.style.top = '10px'
          elem.style.left = '10px'
        } else if (i === 1) {
          elem.style.bottom = '10px'
          elem.style.right = '10px'
        } else {
          elem.style.top = '50%'
          elem.style.left = '50%'
        }

        // Create a unique identifier that changes each time
        const uniqueId = `fp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
        elem.setAttribute('data-fp', uniqueId)
        elem.textContent = uniqueId

        document.body.appendChild(elem)
        fingerprints.push(elem)
      }

      return () => {
        fingerprints.forEach((elem) => {
          if (document.body.contains(elem)) {
            document.body.removeChild(elem)
          }
        })
      }
    }

    // Handle memory usage detection (screenshots often cause memory spikes)
    const setupMemoryCheck = () => {
      // Only works in Chrome but worth trying
      let lastMemory = 0

      const checkMemory = () => {
        // @ts-ignore - performance.memory is non-standard
        if (performance && performance.memory) {
          // @ts-ignore
          const memoryUsed = performance.memory.usedJSHeapSize

          // Detect unusual memory jumps (can indicate screenshot being processed)
          if (lastMemory > 0) {
            const memoryDiff = memoryUsed - lastMemory
            const percentChange = (memoryDiff / lastMemory) * 100

            // If memory usage jumped by >20% suddenly
            if (percentChange > 20) {
              handlePotentialScreenshot('memory_spike')
            }
          }

          lastMemory = memoryUsed
        }
      }

      const intervalId = setInterval(checkMemory, 1000)

      return () => clearInterval(intervalId)
    }

    // Combine active detection methods based on device
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent.toLowerCase())

    // Start appropriate detectors
    const cleanupFunctions = [setupVisualFingerprinting(), setupBrightnessCheck()]

    if (isIOS) {
      cleanupFunctions.push(() => detectIOSCapture())
    } else {
      cleanupFunctions.push(detectAndroidCapture())
    }

    // Try memory checker (Chrome only)
    cleanupFunctions.push(setupMemoryCheck())

    // We're now monitoring
    setIsMonitoring(true)

    return () => {
      cleanupFunctions.forEach((cleanup) => cleanup && cleanup())
      setIsMonitoring(false)
    }
  }, [enabled, isMobile, sessionId, socket])

  // Handler for potential screenshots
  const handlePotentialScreenshot = (detectionMethod: string) => {
    console.log(`Potential screenshot detected via ${detectionMethod}`)

    // Notify server about the detection
    if (socket && sessionId) {
      socket.emit('exam_violation', {
        session_id: sessionId,
        type: 'screen_capture',
        details: {
          detection_method: detectionMethod,
          timestamp: new Date().toISOString(),
          device_info: deviceInfo
        }
      })
    }

    // Call the callback
    onScreenCaptureDetected()

    // Show visual feedback to user
    const feedback = document.createElement('div')
    feedback.style.position = 'fixed'
    feedback.style.top = '0'
    feedback.style.left = '0'
    feedback.style.width = '100%'
    feedback.style.height = '100%'
    feedback.style.backgroundColor = 'rgba(255,0,0,0.7)'
    feedback.style.color = 'white'
    feedback.style.fontSize = '24px'
    feedback.style.fontWeight = 'bold'
    feedback.style.display = 'flex'
    feedback.style.alignItems = 'center'
    feedback.style.justifyContent = 'center'
    feedback.style.zIndex = '999999'
    feedback.style.textAlign = 'center'
    feedback.innerHTML = `
      <div>
        <p>SCREENSHOT DETECTED</p>
        <p style="font-size: 16px; margin-top: 10px;">This violation has been recorded and may affect your grade.</p>
      </div>
    `

    document.body.appendChild(feedback)

    // Add toast notification
    toast.error('Screenshot detected! This violation has been recorded.')

    // Remove visual feedback after 3 seconds
    setTimeout(() => {
      if (document.body.contains(feedback)) {
        document.body.removeChild(feedback)
      }
    }, 3000)
  }

  // For desktop, we'll continue using the existing implementation
  return null
}

export default MobileScreenshotDetector
