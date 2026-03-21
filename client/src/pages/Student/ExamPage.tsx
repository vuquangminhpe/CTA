/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useContext, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ExamTimer from '../../components/Student/ExamTimer'
import ExamQuestion from '../../components/Student/ExamQuestion'
import ExamProgress from '../../components/Student/ExamProgress'
import ViolationWarning from '../../components/Student/ViolationWarning'
import ScreenCaptureDetector from '../../components/Student/ScreenCaptureDetector'
import useSocketExam from '../../hooks/useSocketExam'
import examApi from '../../apis/exam.api'
import { toast } from 'sonner'
import {
  ChevronLeft,
  ChevronRight,
  Save,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  XCircle,
  Bell,
  Shield,
  Loader2
} from 'lucide-react'
import { AuthContext } from '../../Contexts/auth.context'
import './AntiScreenshot.css'
import './Notification.css'
import useExamProtection from '../../components/helper/ExamProtection'
import MobileTabDetector from '../../components/Student/MobileTabDetector'
import ConfirmDialog from '../../components/helper/ConfirmDialog'
// AI Proctoring imports
import ExamCamera from '../../components/Student/ExamCamera'
import ViolationAlert from '../../components/Student/ViolationAlert'
import type { AIViolation } from '../../utils/aiTypes'
import { isWeakDevice } from '../../utils/aiTypes'

const ExamPage = () => {
  const { examCode } = useParams()
  const navigate = useNavigate()
  const { profile } = useContext(AuthContext) as any

  // Exam state
  const [session, setSession] = useState<any>(null)
  const [exam, setExam] = useState<any>(null)
  const [remainingTime, setRemainingTime] = useState(0)
  const [answers, setAnswers] = useState<any>({})
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<any>(0)

  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showViolationWarning, setShowViolationWarning] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmMessage, setConfirmMessage] = useState<string>('')
  const [confirmAction, setConfirmAction] = useState<() => void>(() => () => {})
  const [showMessages, setShowMessages] = useState(false)

  // Face verification and camera state
  const [faceVerificationStatus, setFaceVerificationStatus] = useState<any>(null)
  const [hasCamera, setHasCamera] = useState(false)
  const [deviceInfo, setDeviceInfo] = useState<any>(null)

  // Socket connection
  const { resetViolations, socket, teacherMessages, hasNewMessage, setHasNewMessage } = useSocketExam(session?._id)
  const [notificationSound] = useState(new Audio('/notification.mp3'))
  const [violations, setViolations] = useState(0)

  // AI Proctoring state
  const [currentAIViolation, setCurrentAIViolation] = useState<AIViolation | null>(null)
  const [aiEnabled] = useState(true) // AI proctoring enabled by default
  const [aiModelReady, setAiModelReady] = useState(false)
  const [setupProgress, setSetupProgress] = useState(0)
  const [setupStep, setSetupStep] = useState('Đang khởi tạo...')

  // Enable exam protection
  useExamProtection(true, {
    name: profile?.name || profile?.username,
    id: profile?._id
  })

  // Time check ref
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Ref to always read latest answers (avoids stale closure in callbacks)
  const answersRef = useRef(answers)
  answersRef.current = answers

  // Detect camera availability
  const detectCamera = async (): Promise<boolean> => {
    try {
      // Try to access camera
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      // If successful, stop the stream and return true
      stream.getTracks().forEach((track) => track.stop())
      return true
    } catch (error) {
      console.log('Camera not available:', error)
      return false
    }
  }

  // Get device info
  const getDeviceInfo = () => {
    const userAgent = navigator.userAgent
    const screenResolution = `${window.screen.width}x${window.screen.height}`

    let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop'
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      if (/iPad|Tablet/i.test(userAgent)) {
        deviceType = 'tablet'
      } else {
        deviceType = 'mobile'
      }
    }

    return {
      user_agent: userAgent,
      screen_resolution: screenResolution,
      device_type: deviceType
    }
  }

  // AI model ready callback
  const handleAIReady = useCallback((ready: boolean) => {
    if (ready) {
      setSetupStep('AI giám sát đã sẵn sàng!')
      setSetupProgress(100)
      // Small delay so user sees 100% before transitioning
      setTimeout(() => setAiModelReady(true), 600)
    }
  }, [])

  // Prefetch model files — start downloading before workers init
  useEffect(() => {
    const links = ['/models/p_uint8.onnx', '/models/pose_uint8.onnx'].map((url) => {
      const link = document.createElement('link')
      link.rel = 'prefetch'
      link.href = url
      link.as = 'fetch'
      link.crossOrigin = 'anonymous'
      document.head.appendChild(link)
      return link
    })
    return () => links.forEach((l) => l.remove())
  }, [])

  // Adaptive setup progress while AI model loads
  useEffect(() => {
    if (aiModelReady || !aiEnabled) return

    const weak = isWeakDevice()
    const steps = weak
      ? [
          { at: 0, text: 'Đang khởi tạo camera...', progress: 10 },
          { at: 3000, text: 'Đang tải AI model phát hiện...', progress: 25 },
          { at: 8000, text: 'Đang tải AI model tư thế...', progress: 40 },
          { at: 15000, text: 'Đang khởi động inference engine...', progress: 55 },
          { at: 25000, text: 'Đang chuẩn bị hệ thống giám sát...', progress: 70 },
          { at: 40000, text: 'Vẫn đang tải (máy của bạn đang xử lý)...', progress: 80 },
          { at: 60000, text: 'Sắp hoàn tất, vui lòng đợi...', progress: 85 }
        ]
      : [
          { at: 0, text: 'Đang khởi tạo camera...', progress: 10 },
          { at: 1500, text: 'Đang tải AI model phát hiện...', progress: 30 },
          { at: 3000, text: 'Đang tải AI model tư thế...', progress: 50 },
          { at: 5000, text: 'Đang khởi động inference engine...', progress: 70 },
          { at: 8000, text: 'Đang chuẩn bị hệ thống giám sát...', progress: 85 }
        ]

    const timers = steps.map(({ at, text, progress }) =>
      setTimeout(() => {
        if (!aiModelReady) {
          setSetupStep(text)
          setSetupProgress(progress)
        }
      }, at)
    )

    return () => timers.forEach(clearTimeout)
  }, [aiModelReady, aiEnabled])

  // Load exam on mount
  useEffect(() => {
    loadExam()

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [examCode])

  // Play sound when new message arrives
  useEffect(() => {
    if (hasNewMessage) {
      try {
        notificationSound.play().catch((err) => console.error('Error playing notification sound:', err))
      } catch (error) {
        console.error('Error playing notification sound:', error)
      }
    }
  }, [hasNewMessage])

  // Watch for violations
  useEffect(() => {
    if (violations > 0) {
      setShowViolationWarning(true)

      // If violations are severe (3 or more), auto-submit
      if (violations >= 3) {
        toast.error('Đã phát hiện nhiều vi phạm! Bài kiểm tra của bạn đang được gửi tự động.')
        handleSubmit()
      }
    }
  }, [violations])

  // Listen for exam ended by teacher event
  useEffect(() => {
    if (!socket) return

    const handleExamEndedByTeacher = (data: any) => {
      if (data.session_id === session?._id) {
        toast.error(
          'Bạn đã bị giáo viên kết thúc bài thi (để biết rõ hơn về lí do hãy trao đổi trực tiếp với giáo viên)',
          {
            duration: 5000
          }
        )

        // Submit exam and redirect to home
        handleSubmitAndRedirect()
      }
    }

    socket.on('exam_ended_by_teacher', handleExamEndedByTeacher)

    return () => {
      socket.off('exam_ended_by_teacher', handleExamEndedByTeacher)
    }
  }, [socket, session])

  const loadExam = async () => {
    try {
      setIsLoading(true)

      // Detect camera and get device info
      const cameraAvailable = await detectCamera()
      const deviceInfo = getDeviceInfo()

      setHasCamera(cameraAvailable)
      setDeviceInfo(deviceInfo)

      const response = await examApi.startExam({
        exam_code: examCode as string
      })
      const result = response.data.result as any

      // Extract data from response structure
      const sessionData = {
        _id: result.session_id
        // Add other session fields if needed
      }

      const examData = {
        title: result.exam_title,
        duration: result.exam_duration,
        questions: result.questions
      }

      setSession(sessionData)
      setExam(examData)
      setRemainingTime(result.remaining_time)
      setFaceVerificationStatus(result.face_verification_status)

      // Set device info from response if available
      if (result.device_info) {
        setDeviceInfo(result.device_info)
      }

      // Set initial answers from session if they exist
      // This would need to be implemented if the API returns existing answers

      // Check if the exam is already completed
      // This would need to be implemented if the API returns completion status

      // Display face verification status
      if (result.face_verification_status) {
        const faceStatus = result.face_verification_status
        if (faceStatus.required && faceStatus.verified) {
          const similarityText = faceStatus.similarity
            ? ` Độ tương đồng: ${(faceStatus.similarity * 100).toFixed(1)}%`
            : ''
          toast.success(`Xác thực khuôn mặt thành công!${similarityText}`)
        } else if (faceStatus.required && !faceStatus.verified) {
          toast.warning('Xác thực khuôn mặt không thành công, nhưng bài thi vẫn có thể tiếp tục.')
        } else if (!faceStatus.has_camera) {
          toast.info('Không phát hiện camera. Bài thi sẽ tiếp tục mà không có xác thực khuôn mặt.')
        }
      }
    } catch (error: any) {
      console.error('Failed to load exam:', error)

      if (error.response?.data?.error_type === 'FACE_VERIFICATION_FAILED') {
        toast.error('Xác thực khuôn mặt thất bại: ' + error.response.data.message)
      } else {
        toast.error(error.response?.data?.message || 'Không tải được bài kiểm tra, hãy liên hệ với giá giáo viên!')
      }

      navigate('/student', { replace: true })
    } finally {
      setIsLoading(false)
    }
  }

  const handleAnswerSelect = (questionId: any, answerIndex: any) => {
    setAnswers((prev: any) => ({
      ...prev,
      [questionId]: answerIndex
    }))
  }

  const handleNavigate = (index: number) => {
    if (index >= 0 && index <= exam.questions.length) {
      setCurrentQuestionIndex(index)
      // Scroll to top of the page
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleNext = () => {
    if (currentQuestionIndex < exam.questions.length) {
      handleNavigate(currentQuestionIndex + 1)
    }
  }

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      handleNavigate(currentQuestionIndex - 1)
    }
  }

  const handleTimeUp = () => {
    toast.warning('Đã hết giờ! Nộp bài thi của bạn...')
    handleSubmit()
  }

  // Handle screen capture detection
  const handleScreenCaptureDetected = () => {
    if (socket) {
      socket.emit('exam_violation', {
        session_id: session._id,
        type: 'screen_capture',
        details: {
          detection_method: 'ui_detector',
          timestamp: new Date().toISOString(),
          device_info: deviceInfo
        }
      })

      setShowViolationWarning(true)

      toast.error('Screenshot detected! This is a serious violation and your exam may be terminated.')

      // Increment local violation count
      setViolations((prev) => prev + 1)

      // Auto-submit exam for severe violations
      handleSubmit()
    }
  }

  // Handle AI proctoring violations
  const handleAIViolation = useCallback(
    (violation: AIViolation) => {
      // Show the violation alert
      setCurrentAIViolation(violation)

      const isCritical =
        violation.type === 'PHONE_DETECTED' ||
        violation.type === 'EARPHONE_DETECTED' ||
        violation.type === 'PHONE_CHECKING_POSE'

      // Emit to server via socket
      if (socket) {
        socket.emit('exam_violation', {
          session_id: session?._id,
          type: `ai_${violation.type.toLowerCase()}`,
          details: {
            detection_method: 'ai_proctoring',
            confidence: violation.confidence,
            consecutive_frames: violation.frameCount,
            timestamp: new Date(violation.timestamp).toISOString(),
            device_info: deviceInfo
          }
        })
      }

      // Increment violation count
      setViolations((prev) => prev + 1)
      setShowViolationWarning(true)

      if (isCritical) {
        const criticalMessages: Record<string, string> = {
          PHONE_DETECTED: 'Phát hiện điện thoại',
          EARPHONE_DETECTED: 'Phát hiện tai nghe',
          PHONE_CHECKING_POSE: 'Phát hiện tư thế sử dụng điện thoại'
        }
        toast.error(
          `🚨 Vi phạm nghiêm trọng: ${criticalMessages[violation.type] || violation.type}! Bài thi sẽ bị khóa.`
        )
        // Auto-submit for critical violations
        handleSubmit()
      } else {
        const warningMessages: Record<string, string> = {
          HEAD_TURNED: 'Nhìn ngang quá lâu',
          HEAD_TILTED: 'Tư thế đầu bất thường',
          LOOKING_DOWN: 'Nhìn xuống quá lâu',
          SUSPICIOUS_POSTURE: 'Tư thế bất thường'
        }
        toast.warning(
          `⚠️ Cảnh báo: ${warningMessages[violation.type] || violation.type}. Vui lòng nhìn thẳng vào màn hình.`
        )
      }
    },
    [socket, session, deviceInfo]
  )

  const handleSubmit = () => {
    if (isSubmitting || completed) return

    setIsSubmitting(true)

    // Read from ref to always get latest answers (avoids stale closure bug
    // where auto-submit from AI violation callback captured empty/initial answers)
    const currentAnswers = answersRef.current

    // Format answers for API
    const formattedAnswers = Object.entries(currentAnswers).map(([questionId, selectedIndex]) => ({
      question_id: questionId,
      selected_index: selectedIndex
    }))

    examApi
      .submitExam({
        session_id: session._id,
        answers: formattedAnswers as any
      })
      .then((response) => {
        const result = response.data.result
        toast.success('Đã gửi bài kiểm tra thành công')
        setCompleted(true)

        // Show final score if available
        if (result?.score !== undefined) {
          toast.info(`Điểm số: ${result.score.toFixed(1)}/100`)
        }

        // Redirect after a short delay
        setTimeout(() => {
          navigate('/student', { replace: true })
        }, 3000)
      })
      .catch((error: any) => {
        console.error('Failed to submit exam:', error)
        navigate('/student', { replace: true })
      })
      .finally(() => {
        setIsSubmitting(false)
      })
  }

  // Submit and redirect immediately (for teacher termination)
  const handleSubmitAndRedirect = () => {
    if (isSubmitting || completed) return

    setIsSubmitting(true)

    // Read from ref to always get latest answers
    const currentAnswers = answersRef.current

    // Format answers for API
    const formattedAnswers = Object.entries(currentAnswers).map(([questionId, selectedIndex]) => ({
      question_id: questionId,
      selected_index: selectedIndex
    }))

    // Notify server that exam is being submitted
    if (socket) {
      socket.emit('exam_submitted', session._id)
    }

    examApi
      .submitExam({
        session_id: session._id,
        answers: formattedAnswers as any
      })
      .then(() => {
        setCompleted(true)
        // Immediate redirect
        navigate('/student', { replace: true })
      })
      .catch((error: any) => {
        console.error('Failed to submit exam:', error)
        // Still redirect even on error
        navigate('/student', { replace: true })
      })
  }

  const handleSubmitClick = () => {
    // Check if all questions have been answered
    const answeredCount = Object.keys(answers).length
    const totalQuestions = exam.questions.length

    if (answeredCount < totalQuestions) {
      setConfirmMessage(
        `Bạn chỉ trả lời ${answeredCount} out of ${totalQuestions} câu hỏi. Bạn có chắc chắn muốn gửi không?`
      )
      setConfirmAction(() => handleSubmit)
      setShowConfirmDialog(true)
    } else {
      setConfirmMessage('Bạn có chắc chắn muốn nộp bài thi của mình không? Hành động này không thể hoàn tác.')
      setConfirmAction(() => handleSubmit)
      setShowConfirmDialog(true)
    }
  }

  const totalQuestions = exam?.questions?.length || 0
  const answeredCount = Object.keys(answers).length
  const isFinishStep = currentQuestionIndex === totalQuestions

  // Render loading state
  if (isLoading) {
    return (
      <div className='flex justify-center items-center min-h-screen bg-gray-50'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  // Render completed state
  if (completed) {
    return (
      <div className='flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4 py-12'>
        <div className='bg-white shadow rounded-lg p-8 max-w-md w-full text-center'>
          <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100'>
            <CheckCircle className='h-6 w-6 text-green-600' aria-hidden='true' />
          </div>
          <h2 className='mt-4 text-xl font-medium text-gray-900'>Đã hoàn thành bài thi</h2>
          <p className='mt-2 text-sm text-gray-500'>Bài kiểm tra của bạn đã được nộp thành công.</p>

          {/* Display face verification status */}
          {faceVerificationStatus && (
            <div className='mt-4 p-3 bg-blue-50 rounded-md'>
              <p className='text-xs text-blue-700'>
                Xác thực khuôn mặt: {faceVerificationStatus.verified ? 'Thành công' : 'Không yêu cầu'}
                {faceVerificationStatus.has_camera ? ' (Có camera)' : ' (Không có camera)'}
              </p>
            </div>
          )}

          <div className='flex space-x-2 mt-4'>
            <button
              type='button'
              onClick={() => setShowMessages(!showMessages)}
              className={`inline-flex items-center px-3 py-1.5 border shadow-sm text-sm font-medium rounded-md ${hasNewMessage ? 'text-white bg-blue-600 hover:bg-blue-700 border-blue-600' : 'text-gray-700 bg-white hover:bg-gray-100 border-gray-300'} transition-colors duration-200`}
            >
              <MessageSquare className={`h-4 w-4 ${hasNewMessage ? 'mr-1.5' : 'mr-1.5'}`} />
              Tin nhắn
              {hasNewMessage && (
                <span className='relative flex ml-2'>
                  <span className='animate-ping absolute inline-flex h-2 w-2 rounded-full bg-red-400 opacity-75'></span>
                  <span className='relative inline-flex rounded-full h-2 w-2 bg-red-500'></span>
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Main exam UI
  return (
    <div className='min-h-screen bg-gray-50 pb-16 exam-protected'>
      <ScreenCaptureDetector
        onScreenCaptureDetected={handleScreenCaptureDetected}
        enabled={!completed}
        sessionId={session?._id}
        socket={socket}
      />
      <MobileTabDetector
        sessionId={session?._id}
        socket={socket}
        onViolation={() => {
          setShowViolationWarning(true)
          setViolations((prev) => prev + 1)
        }}
        enabled={!completed}
      />

      {/* AI Proctoring Camera — always mounted here, never unmounts during exam */}
      <ExamCamera
        enabled={aiEnabled && !completed}
        onViolation={handleAIViolation}
        onReady={handleAIReady}
        showDebugOverlay={true}
      />

      {/* AI Setup Loading Overlay — covers exam content until model is ready */}
      {aiEnabled && !aiModelReady && (
        <div className='fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col items-center justify-center'>
          <div className='max-w-md w-full mx-4'>
            <div className='flex justify-center mb-6'>
              <div className='relative'>
                <div className='w-20 h-20 rounded-2xl bg-blue-500/20 flex items-center justify-center'>
                  <Shield className='w-10 h-10 text-blue-400' />
                </div>
                <div className='absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full animate-ping opacity-75' />
                <div className='absolute -top-1 -right-1 w-5 h-5 bg-blue-400 rounded-full' />
              </div>
            </div>
            <h2 className='text-2xl font-bold text-white text-center mb-2'>Đang thiết lập hệ thống giám sát</h2>
            <p className='text-blue-300/70 text-center text-sm mb-8'>
              Vui lòng đợi trong khi AI proctoring được khởi tạo
            </p>
            <div className='bg-white/10 rounded-full h-3 mb-4 overflow-hidden backdrop-blur-sm'>
              <div
                className='h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-700 ease-out'
                style={{ width: `${setupProgress}%` }}
              />
            </div>
            <div className='flex justify-between items-center mb-8'>
              <span className='text-blue-300/80 text-sm flex items-center gap-2'>
                <Loader2 className='w-3.5 h-3.5 animate-spin' />
                {setupStep}
              </span>
              <span className='text-blue-300/60 text-sm font-mono'>{setupProgress}%</span>
            </div>
            <div className='bg-white/5 rounded-xl p-4 backdrop-blur-sm border border-white/10 space-y-3'>
              {[
                { label: 'Truy cập camera', done: setupProgress >= 10 },
                { label: 'Tải model phát hiện đối tượng', done: setupProgress >= 30 },
                { label: 'Tải model phân tích tư thế', done: setupProgress >= 50 },
                { label: 'Khởi động inference engine', done: setupProgress >= 70 },
                { label: 'Hệ thống giám sát sẵn sàng', done: setupProgress >= 100 }
              ].map((step, i) => (
                <div key={i} className='flex items-center gap-3'>
                  {step.done ? (
                    <CheckCircle className='w-4 h-4 text-green-400 flex-shrink-0' />
                  ) : setupProgress >= [0, 10, 30, 50, 70][i] ? (
                    <Loader2 className='w-4 h-4 text-blue-400 animate-spin flex-shrink-0' />
                  ) : (
                    <div className='w-4 h-4 rounded-full border border-white/20 flex-shrink-0' />
                  )}
                  <span
                    className={`text-sm ${step.done ? 'text-green-300' : setupProgress >= [0, 10, 30, 50, 70][i] ? 'text-blue-300' : 'text-white/30'}`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
            <div className='mt-6 text-center'>
              <p className='text-white/40 text-xs'>
                {exam?.title} — {exam?.questions?.length} câu hỏi
              </p>
            </div>
          </div>
        </div>
      )}

      {/* AI Violation Alert */}
      <ViolationAlert violation={currentAIViolation} onDismiss={() => setCurrentAIViolation(null)} />
      <ConfirmDialog
        isOpen={showConfirmDialog}
        message={confirmMessage}
        onConfirm={() => {
          setShowConfirmDialog(false)
          confirmAction()
        }}
        onCancel={() => setShowConfirmDialog(false)}
      />

      {/* Timer */}
      <ExamTimer remainingTime={remainingTime} onTimeUp={handleTimeUp} enabled={!completed} />

      {/* Violation Warning */}
      {/* {showViolationWarning && (
        <ViolationWarning
          count={violations}
          onDismiss={() => {
            setShowViolationWarning(false)
            resetViolations()
          }}
        />
      )} */}

      {/* Main Content */}
      <div className='py-4 px-8 bg-white shadow'>
        <div className='flex justify-between items-center'>
          <h2 className='text-2xl font-semibold text-gray-800'>{exam.title}</h2>
          <div className='text-right'>
            <p className='text-sm text-gray-500'>
              Mã bài thi: {examCode} • {exam.questions.length} câu hỏi
            </p>
            {/* Display device and camera info */}
            {faceVerificationStatus && (
              <p className='text-xs text-gray-400 mt-1'>
                {deviceInfo?.device_type || 'unknown'} •{' '}
                {faceVerificationStatus.has_camera ? 'Có camera' : 'Không có camera'}
              </p>
            )}
          </div>
        </div>

        {violations > 0 && (
          <div className='mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-md flex items-start'>
            <AlertTriangle className='h-5 w-5 text-yellow-400 flex-shrink-0 mr-2' />
            <p className='text-sm text-yellow-700'>
              bạn có {violations} lỗi vi phạm {violations !== 1 ? '' : ''}. Việc chụp màn hình và chuyển đổi tab trong
              khi làm bài kiểm tra là không được phép và sẽ bị phạt.
            </p>
          </div>
        )}

        {/* Progress indicator - Question Navigator */}
        <div className='mt-6'>
          <ExamProgress
            questions={exam.questions}
            answers={answers}
            currentQuestionIndex={currentQuestionIndex}
            onNavigate={handleNavigate}
            showFinishStep={true}
            finishLabel='Kết thúc'
          />
        </div>

        {/* Current Question */}
        <div className='mb-8'>
          {isFinishStep ? (
            <div className='min-h-[400px] rounded-2xl border border-blue-200 bg-gradient-to-b from-white to-blue-50 p-6 flex flex-col items-center justify-center text-center'>
              <h3 className='text-2xl font-bold text-gray-900 mb-2'>Bước kết thúc bài thi</h3>
              <p className='text-gray-600 mb-6'>
                Bạn đã trả lời {answeredCount}/{totalQuestions} câu. Hãy kiểm tra lần cuối trước khi nộp.
              </p>
              <div className='flex flex-col sm:flex-row gap-3 items-center justify-center'>
                <button
                  type='button'
                  onClick={() => handleNavigate(totalQuestions - 1)}
                  className='inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-100'
                >
                  Quay lại câu cuối
                </button>
                <button
                  type='button'
                  onClick={handleSubmitClick}
                  disabled={isSubmitting}
                  className='inline-flex items-center px-5 py-2.5 border border-transparent text-sm font-semibold rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  <Save className='-ml-1 mr-2 h-5 w-5' />
                  {isSubmitting ? 'Đang trong quá trình nộp bài thi...' : 'Nộp bài thi'}
                </button>
              </div>
            </div>
          ) : (
            <ExamQuestion
              question={exam.questions[currentQuestionIndex]}
              questionIndex={currentQuestionIndex}
              selectedAnswer={answers[exam?.questions[currentQuestionIndex]?._id]}
              onAnswerSelect={handleAnswerSelect}
            />
          )}
        </div>

        {/* Teacher Messages UI - keeping existing implementation */}
        {teacherMessages && teacherMessages.length > 0 && (
          <div className='fixed top-4 right-4 z-50'>
            <button
              onClick={() => setShowMessages(!showMessages)}
              className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                hasNewMessage
                  ? 'bg-blue-600 text-white  animate-bounce shadow-lg border-2 border-blue-300'
                  : showMessages
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-white text-gray-700 border border-gray-300'
              } shadow-sm hover:bg-blue-50`}
            >
              <MessageSquare className={`${hasNewMessage ? 'h-5 w-5 mr-2' : 'h-4 w-4 mr-2'}`} />
              {hasNewMessage ? (
                <span className='font-bold hover:text-black'>
                  Tin nhắn mới! {teacherMessages.length > 0 && `(${teacherMessages.length})`}
                </span>
              ) : (
                <span>Tin nhắn {teacherMessages.length > 0 && `(${teacherMessages.length})`}</span>
              )}
            </button>
          </div>
        )}

        {/* Teacher Messages panel - keeping existing implementation */}
        {showMessages && teacherMessages && (
          <div className='fixed top-16 right-4 z-50 bg-white shadow-lg rounded-lg w-80 max-h-96 overflow-y-auto animate-fade-in-scale transition-all duration-300'>
            <div className='p-3 bg-blue-600 text-white border-b rounded-t-lg flex justify-between items-center'>
              <h3 className='font-medium flex items-center'>
                <MessageSquare className='h-4 w-4 mr-2' />
                Tin nhắn từ giáo viên
                {teacherMessages.length > 0 && (
                  <span className='ml-2 bg-white text-blue-600 text-xs font-semibold px-2 py-0.5 rounded-full'>
                    {teacherMessages.length}
                  </span>
                )}
              </h3>
              <button
                onClick={() => {
                  setShowMessages(false)
                  setHasNewMessage(false)
                }}
                className='text-white hover:text-red-100 transition-colors'
                aria-label='Đóng thông báo'
              >
                <XCircle className='h-4 w-4' />
              </button>
            </div>
            <div className='p-3'>
              {teacherMessages.length > 0 ? (
                <ul className='space-y-3'>
                  {teacherMessages.map((msg, index) => (
                    <li
                      key={index}
                      className='bg-blue-50 p-3 rounded-lg border-l-4 border-blue-400 shadow-sm hover:shadow-md transition-shadow'
                    >
                      <p className='text-sm text-gray-800 font-medium'>{msg.message}</p>
                      <div className='flex justify-between items-center mt-2'>
                        <p className='text-xs text-gray-500'>{new Date(msg.timestamp).toLocaleTimeString()}</p>
                        <span className='inline-flex items-center text-xs text-blue-600'>
                          <CheckCircle className='h-3 w-3 mr-1' /> Đã nhận
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className='text-center py-6 text-gray-500'>
                  <MessageSquare className='h-8 w-8 mx-auto mb-2 opacity-50' />
                  <p className='text-sm'>Không có tin nhắn</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Floating notification for new messages - keeping existing implementation */}
        {hasNewMessage && !showMessages && (
          <div
            className='fixed top-16 right-4 z-50 bg-gradient-to-r from-blue-600 to-blue-500 shadow-lg rounded-lg p-4 max-w-xs animate-bounce-in transform transition-all duration-300 cursor-pointer text-white'
            onClick={() => {
              setShowMessages(true)
              setHasNewMessage(false)
            }}
            role='button'
            aria-label='Xem tin nhắn mới'
          >
            <div className='flex items-center'>
              <div className='relative mr-3'>
                <MessageSquare className='h-6 w-6 text-white' />
                <span className='absolute -top-1 -right-1 flex h-3 w-3'>
                  <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75'></span>
                  <span className='relative inline-flex rounded-full h-3 w-3 bg-red-500'></span>
                </span>
              </div>
              <div>
                <h4 className='font-medium text-sm'>Tin nhắn mới từ giáo viên!</h4>
                <p className='text-xs text-blue-100 mt-0.5'>Nhấp để xem ngay</p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation and Submit */}
        <div className='flex items-center justify-between pb-12'>
          <button
            type='button'
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className='inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-200 hover:text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <ChevronLeft className='-ml-1 mr-2 h-5 w-5' />
            Trước
          </button>

          <span className='text-sm text-gray-500'>
            {isFinishStep
              ? `Kết thúc (${answeredCount}/${totalQuestions})`
              : `${currentQuestionIndex + 1} of ${totalQuestions}`}
          </span>

          <button
            type='button'
            onClick={handleNext}
            disabled={isFinishStep}
            className='inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-200 hover:text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {currentQuestionIndex === totalQuestions - 1 ? 'Kết thúc' : 'Kế tiếp'}
            <ChevronRight className='-mr-1 ml-2 h-5 w-5' />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExamPage
