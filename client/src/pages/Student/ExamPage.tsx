/* eslint-disable @typescript-eslint/no-explicit-any */
// Cập nhật ExamPage.tsx để sử dụng ExamSessionContext

import { useState, useEffect, useRef, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ExamTimer from '../../components/Student/ExamTimer'
import ExamQuestion from '../../components/Student/ExamQuestion'
import ExamProgress from '../../components/Student/ExamProgress'
import ViolationWarning from '../../components/Student/ViolationWarning'
import ScreenCaptureDetector from '../../components/Student/ScreenCaptureDetector'
import useSocketExam from '../../hooks/useSocketExam'
import examApi from '../../apis/exam.api'
import { toast } from 'sonner'
import { ChevronLeft, ChevronRight, Save, AlertTriangle, CheckCircle, MessageSquare, XCircle } from 'lucide-react'
import { AuthContext } from '../../Contexts/auth.context'
import './AntiScreenshot.css'
import useExamProtection from '../../components/helper/ExamProtection'
import MobileTabDetector from '../../components/Student/MobileTabDetector'
import ConfirmDialog from '../../components/helper/ConfirmDialog'
import { useExamSession } from '@/Contexts/exam-session.context'

const ExamPage = () => {
  const { examCode } = useParams()
  const navigate = useNavigate()
  const { profile } = useContext(AuthContext) as any

  // Sử dụng ExamSession context
  const { markSessionActive, checkRefresh } = useExamSession()

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
  const [violations, setViolations] = useState(0)

  // Flag để kiểm soát refresh check
  const hasCheckedRefreshRef = useRef(false)

  // Socket connection
  const { resetViolations, socket, teacherMessages, hasNewMessage, setHasNewMessage } = useSocketExam(session?._id)

  // Enable exam protection
  useExamProtection(true, {
    name: profile?.name || profile?.username,
    id: profile?._id
  })

  // Time check ref
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null)

  // Load exam on mount
  useEffect(() => {
    loadExam()

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current)
      }
    }
  }, [examCode])

  // Kiểm tra refresh sau khi session được tải
  useEffect(() => {
    if (session && !hasCheckedRefreshRef.current && !isLoading && !completed) {
      // Đánh dấu là đã kiểm tra để không kiểm tra lại
      hasCheckedRefreshRef.current = true

      // Kiểm tra xem có phải trang đã bị làm mới không
      const isRefreshed = checkRefresh(session._id)

      if (isRefreshed) {
        // Nếu trang đã bị làm mới, tự động nộp bài
        handleSubmit()

        // Tăng số lượng vi phạm
        setViolations((prev) => prev + 1)
        setShowViolationWarning(true)
      } else {
        // Nếu không phải làm mới, đánh dấu phiên này là đang hoạt động
        markSessionActive(session._id)
      }
    }
  }, [session, isLoading, completed, checkRefresh, markSessionActive])

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
      const response = await examApi.startExam({ exam_code: examCode as string })

      const { session: examSession, exam: examData, remaining_time } = response.data.result

      setSession(examSession as any)
      setExam(examData as any)
      setRemainingTime(remaining_time)

      // Set initial answers from session if they exist
      if (examSession.answers && examSession.answers.length > 0) {
        const sessionAnswers: Record<string, number> = {}
        examSession.answers.forEach((answer: any) => {
          sessionAnswers[answer.question_id] = answer.selected_index
        })
        setAnswers(sessionAnswers)
      }

      // Check if the exam is already completed
      if (examSession.completed) {
        setCompleted(true)
      }
    } catch (error: any) {
      console.error('Failed to load exam:', error)
      toast.error(error.response?.data?.message || 'Không tải được bài kiểm tra, hãy liên hệ với giá giáo viên!')
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
    if (index >= 0 && index < exam.questions.length) {
      setCurrentQuestionIndex(index)
      // Scroll to top of the page
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleNext = () => {
    if (currentQuestionIndex < exam.questions.length - 1) {
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
          device_info: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            screenWidth: window.screen.width,
            screenHeight: window.screen.height,
            isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
          }
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

  const handleSubmit = () => {
    if (isSubmitting || completed) return

    setIsSubmitting(true)

    // Format answers for API
    const formattedAnswers = Object.entries(answers).map(([questionId, selectedIndex]) => ({
      question_id: questionId,
      selected_index: selectedIndex
    }))

    examApi
      .submitExam({
        session_id: session._id,
        answers: formattedAnswers as any
      })
      .then(() => {
        toast.success('Đã gửi bài kiểm tra thành công')
        setCompleted(true)

        // Redirect after a short delay
        setTimeout(() => {
          navigate('/student', { replace: true })
        }, 3000)
      })
      .catch((error: any) => {
        console.error('Failed to submit exam:', error)
        toast.error(
          error.response?.data?.message || 'Không nộp được bài thi, hãy liên hệ với giáo viên để làm lại bài thi!'
        )
      })
      .finally(() => {
        setIsSubmitting(false)
      })
  }

  // Submit and redirect immediately (for teacher termination)
  const handleSubmitAndRedirect = () => {
    if (isSubmitting || completed) return

    setIsSubmitting(true)

    // Format answers for API
    const formattedAnswers = Object.entries(answers).map(([questionId, selectedIndex]) => ({
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

  function playBeep() {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContext) return

      const context = new AudioContext()
      const oscillator = context.createOscillator()
      const gainNode = context.createGain()

      oscillator.type = 'sine'
      oscillator.frequency.value = 800 // Tần số
      gainNode.gain.value = 0.3 // Âm lượng

      oscillator.connect(gainNode)
      gainNode.connect(context.destination)

      oscillator.start()
      setTimeout(() => oscillator.stop(), 200)
    } catch (error) {
      console.log('Audio API error:', error)
    }
  }

  // Sử dụng trong useEffect
  useEffect(() => {
    if (hasNewMessage) {
      playBeep()
    }
  }, [hasNewMessage])

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
          <div className='mt-6'>
            <button
              type='button'
              onClick={() => navigate('/student', { replace: true })}
              className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            >
              Quay lại Bảng điều khiển
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Main exam UI
  return (
    <div className='min-h-screen bg-gray-50 pb-16 exam-protected'>
      {/* Screen Capture Detection */}
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
      {showViolationWarning && (
        <ViolationWarning
          count={violations}
          onDismiss={() => {
            setShowViolationWarning(false)
            resetViolations()
          }}
        />
      )}

      {/* Main Content */}
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16'>
        <div className='mb-8'>
          <h1 className='text-2xl font-bold text-gray-900'>{exam.title}</h1>
          <p className='mt-2 text-sm text-gray-500'>
            Mã bài thi: {examCode} • {exam.questions.length} câu hỏi
          </p>

          {violations > 0 && (
            <div className='mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-md flex items-start'>
              <AlertTriangle className='h-5 w-5 text-yellow-400 flex-shrink-0 mr-2' />
              <p className='text-sm text-yellow-700'>
                bạn có {violations} lỗi vi phạm {violations !== 1 ? '' : ''}. Việc chụp màn hình và chuyển đổi tab trong
                khi làm bài kiểm tra là không được phép và sẽ bị phạt.
              </p>
            </div>
          )}
        </div>

        {/* Progress indicator (for desktop) */}
        <ExamProgress
          questions={exam.questions}
          answers={answers}
          currentQuestionIndex={currentQuestionIndex}
          onNavigate={handleNavigate}
        />

        {/* Current Question */}
        <div className='mb-8'>
          <ExamQuestion
            question={exam.questions[currentQuestionIndex]}
            questionIndex={currentQuestionIndex}
            selectedAnswer={answers[exam.questions[currentQuestionIndex]._id]}
            onAnswerSelect={handleAnswerSelect}
          />
        </div>
        {teacherMessages && teacherMessages.length > 0 && (
          <div className='fixed top-4 left-24 z-50'>
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
        {teacherMessages && teacherMessages.length > 0 && (
          <div className='fixed top-4 left-24 z-50'>
            <button
              onClick={() => setShowMessages(!showMessages)}
              className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
                hasNewMessage
                  ? 'bg-blue-600 hover:text-black text-white animate-bounce shadow-lg border-2 border-blue-300'
                  : showMessages
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-white text-gray-700 border border-gray-300'
              } shadow-sm hover:bg-blue-50`}
            >
              <MessageSquare className={`text-black ${hasNewMessage ? 'h-5 w-5 mr-2' : 'h-4 w-4 mr-2'}`} />
              {hasNewMessage ? (
                <span className='font-bold'>
                  Tin nhắn mới! {teacherMessages.length > 0 && `(${teacherMessages.length})`}
                </span>
              ) : (
                <span>Tin nhắn {teacherMessages.length > 0 && `(${teacherMessages.length})`}</span>
              )}
            </button>
          </div>
        )}

        {/* Teacher Messages panel */}
        {showMessages && teacherMessages && teacherMessages.length > 0 && (
          <div className='fixed top-16 left-4 z-50 bg-white shadow-lg rounded-lg w-80 max-h-96 overflow-y-auto'>
            <div className='p-3 border-b border-gray-200 flex justify-between items-center'>
              <h3 className='font-medium text-gray-900'>Tin nhắn từ giáo viên</h3>
              <button
                onClick={() => {
                  setShowMessages(false)
                  setHasNewMessage(false)
                }}
                className='text-gray-400 hover:text-gray-500'
              >
                <XCircle className='h-4 w-4' />
              </button>
            </div>
            <div className='p-3'>
              {teacherMessages.length > 0 ? (
                <ul className='space-y-3'>
                  {teacherMessages.map((msg, index) => (
                    <li key={index} className='bg-blue-50 p-3 rounded-lg'>
                      <p className='text-sm text-gray-800'>{msg.message}</p>
                      <p className='text-xs text-gray-500 mt-1'>{new Date(msg.timestamp).toLocaleTimeString()}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className='text-sm text-gray-500 text-center py-4'>Không có tin nhắn</p>
              )}
            </div>
          </div>
        )}

        {/* Floating notification for new messages */}
        {hasNewMessage && !showMessages && (
          <div className='fixed top-16 left-24 z-50 bg-blue-100 shadow-lg rounded-lg p-3 border-l-4 border-blue-500 max-w-xs animate-fade-in'>
            <div className='flex'>
              <MessageSquare className='h-5 w-5 text-blue-500 mr-2' />
              <p className='text-sm text-blue-800'>Bạn có tin nhắn mới từ giáo viên! Nhấp vào nút "Tin nhắn" để xem.</p>
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

          <div className='flex items-center'>
            <span className='text-sm text-gray-500 mr-4'>
              {currentQuestionIndex + 1} of {exam.questions.length}
            </span>
            <button
              type='button'
              onClick={handleSubmitClick}
              disabled={isSubmitting}
              className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            >
              <Save className='-ml-1 mr-2 h-5 w-5' />
              {isSubmitting ? 'Đang trong quá trình nộp bài thi...' : 'Nộp bài thi'}
            </button>
          </div>

          <button
            type='button'
            onClick={handleNext}
            disabled={currentQuestionIndex === exam.questions.length - 1}
            className='inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-200 hover:text-black focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Kế tiếp
            <ChevronRight className='-mr-1 ml-2 h-5 w-5' />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExamPage
