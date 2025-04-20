/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useEffect, useRef } from 'react'
import { toast } from 'sonner'

interface ExamCriticalViolationHandlerProps {
  socket: any
  session: any
  onViolation: (type: string, details?: any) => void
  handleSubmit: () => void
  isCompleted: boolean
}

const ExamCriticalViolationHandler: React.FC<ExamCriticalViolationHandlerProps> = ({
  socket,
  session,
  onViolation,
  handleSubmit,
  isCompleted
}) => {
  const isIntentionalUnloadRef = useRef(false)
  const devToolsDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const debuggerDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const lastVisibilityChangeRef = useRef(Date.now())
  const lastExecutionTimeRef = useRef(Date.now())

  // Function to detect if DevTools is open
  const detectDevTools = () => {
    let devtoolsDetected = false

    try {
      const element = document.createElement('div')
      element.className = 'devtools-detector'
      element.innerHTML = '&nbsp;'
      document.body.appendChild(element)

      // Force a reflow
      element.offsetHeight

      // When DevTools is open, the computed style might change unexpectedly
      const styles = window.getComputedStyle(element)

      // Check if styles were altered by inspection
      if (styles.transform !== 'none' && styles.transform !== '') {
        devtoolsDetected = true
      }

      // Clean up
      if (document.body.contains(element)) {
        document.body.removeChild(element)
      }

      const widthThreshold = 160 // Width typically occupied by devtools panel
      const heightThreshold = 160 // Height typically occupied by devtools panel

      if (
        Math.abs(window.outerWidth - window.innerWidth) > widthThreshold ||
        Math.abs(window.outerHeight - window.innerHeight) > heightThreshold
      ) {
        devtoolsDetected = true
      }

      const startTime = performance.now()
      console.debug('%c', 'padding:' + '1'.repeat(10000)) // This is slow when console is open
      const endTime = performance.now()

      if (endTime - startTime > 100) {
        // Taking more than 100ms indicates console is open
        devtoolsDetected = true
      }
    } catch (error) {
      console.error('Error in DevTools detection:', error)
    }

    return devtoolsDetected
  }

  // Handle critical violations that require immediate action
  const handleCriticalViolation = (violationType: string, details: any = {}) => {
    if (isCompleted || !socket || !session) return

    // Set as intentional to prevent double triggers
    isIntentionalUnloadRef.current = true

    // Show critical violation message
    toast.error('Vi phạm nghiêm trọng! Bạn đã vi phạm quy chế bài thi, kết quả sẽ bị hủy và bài thi tự động nộp.', {
      duration: 10000, // Show for 10 seconds
      position: 'top-center',
      style: {
        backgroundColor: '#FF0000',
        color: 'white',
        fontWeight: 'bold',
        fontSize: '16px',
        padding: '20px'
      }
    })

    // Add device info to details
    const enrichedDetails = {
      ...details,
      timestamp: new Date().toISOString(),
      device_info: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height,
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      }
    }

    // Emit violation to server
    if (socket && session) {
      socket.emit('exam_violation', {
        session_id: session._id,
        type: violationType,
        details: enrichedDetails
      })
    }

    // Create overlay with violation message
    const overlay = document.createElement('div')
    overlay.className = 'critical-violation-overlay'
    overlay.innerHTML = `
      <p class="title">⚠️ VI PHẠM QUY CHẾ THI ⚠️</p>
      <p>Bạn đã ${violationType === 'page_refresh' ? 'làm mới trang' : violationType === 'dev_tools_open' ? 'mở developer tools' : 'vi phạm quy chế thi'}</p>
      <p>Bài thi của bạn đang được nộp tự động.</p>
    `
    document.body.appendChild(overlay)

    // Update violation state
    onViolation(violationType, enrichedDetails)

    // Auto-submit the exam
    setTimeout(() => {
      handleSubmit()

      // Remove overlay after submit is initiated
      setTimeout(() => {
        if (document.body.contains(overlay)) {
          document.body.removeChild(overlay)
        }
      }, 3000)
    }, 2000)
  }

  useEffect(() => {
    if (isCompleted || !socket || !session) return

    // 1. Handle refresh/navigation attempts
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isIntentionalUnloadRef.current) {
        // This is an unauthorized page refresh or navigation
        handleCriticalViolation('page_refresh')

        // Standard beforeUnload message
        e.preventDefault()
        e.returnValue = 'Vi phạm quy chế thi: Bạn đang cố gắng làm mới trang!'
        return e.returnValue
      }
    }

    // 2. Track visibility state changes that might indicate DevTools
    const handleVisibilityChange = () => {
      const now = Date.now()
      // Detect very quick visibility toggles which can happen with DevTools
      if (now - lastVisibilityChangeRef.current < 100) {
        handleCriticalViolation('suspicious_visibility_change')
      }
      lastVisibilityChangeRef.current = now
    }

    // 3. Run periodic DevTools detection
    devToolsDetectionIntervalRef.current = setInterval(() => {
      if (detectDevTools()) {
        handleCriticalViolation('dev_tools_open')
        clearInterval(devToolsDetectionIntervalRef.current as NodeJS.Timeout)
      }
    }, 3000)

    // 4. Detect debugging pauses
    debuggerDetectionIntervalRef.current = setInterval(() => {
      const now = Date.now()
      const executionDelay = now - lastExecutionTimeRef.current - 500 // Subtract expected interval

      if (executionDelay > 200) {
        // If execution was delayed by more than 200ms
        handleCriticalViolation('debug_pause_detected', { delay: executionDelay })
        clearInterval(debuggerDetectionIntervalRef.current as NodeJS.Timeout)
      }

      lastExecutionTimeRef.current = now
    }, 500)

    // Prevent right-click menu entirely
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      handleCriticalViolation('context_menu_attempt')
      return false
    }

    // Add event listeners
    window.addEventListener('beforeunload', handleBeforeUnload)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    document.addEventListener('contextmenu', preventContextMenu)

    // Make safeSubmit function available globally
    ;(window as any).safeSubmitExam = () => {
      isIntentionalUnloadRef.current = true
    }

    // Clean up on unmount
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      document.removeEventListener('contextmenu', preventContextMenu)

      if (devToolsDetectionIntervalRef.current) {
        clearInterval(devToolsDetectionIntervalRef.current)
      }

      if (debuggerDetectionIntervalRef.current) {
        clearInterval(debuggerDetectionIntervalRef.current)
      }

      delete (window as any).safeSubmitExam
    }
  }, [socket, session, isCompleted, handleSubmit, onViolation])

  // This is a behavior-only component, no UI rendered
  return null
}

export default ExamCriticalViolationHandler
