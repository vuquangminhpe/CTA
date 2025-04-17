/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useContext } from 'react'
import ExamQuestion from './ExamQuestion'
import { io, Socket } from 'socket.io-client'
import configBase from '../../constants/config'
import ExamTimer from './ExamTimer'
import ExamProgress from './ExamProgress'
import ViolationWarning from './ViolationWarning'
import ExamSecurity from './ExamSecurity'
import { AuthContext } from '../../Contexts/auth.context'
import { Save, ChevronLeft, ChevronRight, AlertTriangle, MessageSquare, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import MobileTabDetector from './MobileTabDetector'
import ConfirmDialog from '../helper/ConfirmDialog'

interface ExamSessionProps {
  session: { _id: string }
  exam: {
    title: string
    questions: { _id: string; content?: string; answers?: React.ReactNode[] }[]
  }
  remainingTime: number
  onSubmit: (sessionId: string, answers: { question_id: string; selected_index: number }[]) => void
}

const ExamSession: React.FC<ExamSessionProps> = ({ session, exam, remainingTime, onSubmit }) => {
  const { profile } = useContext(AuthContext) as any
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [timeLeft, setTimeLeft] = useState(remainingTime)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [hasViolation, setHasViolation] = useState(false)
  const [violations, setViolations] = useState<any[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [securityLevel, setSecurityLevel] = useState<'high' | 'medium' | 'low'>('high')
  const [teacherMessages, setTeacherMessages] = useState<{ message: string; timestamp: Date }[]>([])
  const [showMessages, setShowMessages] = useState(false)
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const [confirmAction, setConfirmAction] = useState<() => void>(() => () => {})
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [confirmMessage, setConfirmMessage] = useState<string>('')

  // Initialize socket connection
  useEffect(() => {
    const token = localStorage.getItem('access_token')

    const newSocket = io(configBase.baseURL, {
      auth: {
        token
      }
    })

    newSocket.on('connect', () => {
      console.log('Socket connected')
      newSocket.emit('join_exam', session._id)
    })

    newSocket.on('time_update', (data) => {
      // Update time based on server timestamp if needed
    })

    newSocket.on('violation_recorded', (data) => {
      if (data.session_id === session._id) {
        setHasViolation(true)
        setViolations((prev) => [...prev, data])

        // Show toast notification for violation
        toast.error(`Violation detected: ${data.type || 'Rule violation'}`)
      }
    })

    // Handle security level updates from server
    newSocket.on('security_level_update', (data) => {
      if (data.session_id === session._id) {
        setSecurityLevel(data.level)
      }
    })

    // Handle teacher messages
    newSocket.on('teacher_message', (data) => {
      if (data.session_id === session._id) {
        const newMessage = {
          message: data.message,
          timestamp: new Date(data.timestamp)
        }
        setTeacherMessages((prev) => [...prev, newMessage])
        setHasNewMessage(true)

        // Show toast notification for new message
        toast.info(`Message from teacher: ${data.message}`)
      }
    })

    // Handle exam being ended by teacher
    newSocket.on('exam_ended_by_teacher', (data) => {
      if (data.session_id === session._id) {
        toast.error(`Your exam has been ended: ${data.reason}`)
        // Force submit
        handleSubmit()
      }
    })

    setSocket(newSocket)

    return () => {
      if (newSocket) {
        newSocket.disconnect()
      }
    }
  }, [session._id])

  // Set up visibility change detection (tab switching)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && socket) {
        socket.emit('tab_switch', { session_id: session._id })

        // Record this type of violation
        const violation = {
          type: 'tab_switch',
          timestamp: new Date().toISOString()
        }

        setViolations((prev) => [...prev, violation])
        setHasViolation(true)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [socket, session._id])

  // Prevent exam abandonment
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const message = 'Việc rời khỏi trang này sẽ được ghi nhận là vi phạm. Bạn có chắc không?'
      e.returnValue = message
      return message
    }

    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  // Handle time up
  const handleTimeUp = () => {
    toast.warning('Đã hết giờ! Nộp bài thi của bạn...')
    handleSubmit()
  }

  // Select an answer
  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setAnswers({
      ...answers,
      [questionId]: answerIndex
    })
  }

  // Navigate between questions
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

  // Handle security violations
  const handleViolation = (type: string, details: any) => {
    const violation = {
      type,
      details,
      timestamp: new Date().toISOString()
    }

    setViolations((prev) => [...prev, violation])
    setHasViolation(true)

    // Send to server
    if (socket && socket.connected) {
      socket.emit('exam_violation', {
        session_id: session._id,
        violation_type: type,
        details
      })
    }
  }

  // Submit exam
  const handleSubmit = () => {
    if (isSubmitting) return

    setIsSubmitting(true)
    const formattedAnswers = Object.entries(answers).map(([questionId, selectedIndex]) => ({
      question_id: questionId,
      selected_index: selectedIndex
    }))

    // Notify server that exam is being submitted
    if (socket && socket.connected) {
      socket.emit('exam_submitted', session._id)
    }

    onSubmit(session._id, formattedAnswers)
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

  // Toggle teacher messages panel
  const toggleMessages = () => {
    setShowMessages(!showMessages)
    if (hasNewMessage) {
      setHasNewMessage(false)
    }
  }

  // Apply anti-screenshot/recording CSS
  useEffect(() => {
    // Create and append anti-screenshot styles
    const style = document.createElement('style')
    style.innerHTML = `
      /* Make screenshots harder to use */
      body.exam-active {
        background-color: #ffffff;
        background-image: 
          repeating-linear-gradient(45deg, rgba(200,200,200,.1), rgba(200,200,200,.1) 10px, rgba(240,240,240,.1) 10px, rgba(240,240,240,.1) 20px);
      }
      
      /* Make content selection harder */
      body.exam-active * {
        user-select: none !important;
      }
      
      /* Allow selection only for inputs and textareas */
      body.exam-active input, 
      body.exam-active textarea {
        user-select: text !important;
      }
      
      /* Disable printing */
      @media print {
        body.exam-active * {
          display: none !important;
        }
        body.exam-active:after {
          content: "Printing is not allowed during exams";
          display: block;
          padding: 50px;
          font-size: 24px;
          text-align: center;
        }
      }
    `
    document.head.appendChild(style)
    document.body.classList.add('exam-active')

    return () => {
      document.body.classList.remove('exam-active')
      document.head.removeChild(style)
    }
  }, [])

  return (
    <div className='min-h-screen bg-gray-50 pb-16'>
      {/* Security Component */}
      <ExamSecurity
        sessionId={session._id}
        studentId={profile?._id || 'unknown'}
        studentName={profile?.name || profile?.username || 'Student'}
        onViolation={handleViolation}
        socket={socket}
        requireWebcam={securityLevel === 'high'}
      />
      <MobileTabDetector
        sessionId={session._id}
        socket={socket}
        onViolation={() => {
          setHasViolation(true)
          setViolations((prev) => [
            ...prev,
            {
              type: 'tab_switch',
              timestamp: new Date().toISOString()
            }
          ])
        }}
        enabled={true}
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
      <ExamTimer remainingTime={timeLeft} onTimeUp={handleTimeUp} enabled={true} />

      {/* Violation Warning */}
      {hasViolation && <ViolationWarning count={violations.length} onDismiss={() => setHasViolation(false)} />}

      {/* Teacher Messages button */}
      <div className='fixed top-4 left-24 z-50'>
        <button
          onClick={toggleMessages}
          className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
            hasNewMessage
              ? 'bg-blue-600 text-white animate-pulse'
              : showMessages
                ? 'bg-blue-100 text-blue-800'
                : 'bg-white text-gray-700 border border-gray-300'
          } shadow-sm hover:bg-blue-50`}
        >
          <MessageSquare className='h-4 w-4 mr-2' />
          Messages {teacherMessages.length > 0 && `(${teacherMessages.length})`}
        </button>
      </div>

      {/* Teacher Messages panel */}
      {showMessages && (
        <div className='fixed top-16 left-4 z-50 bg-white shadow-lg rounded-lg w-80 max-h-96 overflow-y-auto'>
          <div className='p-3 border-b border-gray-200 flex justify-between items-center'>
            <h3 className='font-medium text-gray-900'>Teacher Messages</h3>
            <button onClick={toggleMessages} className='text-gray-400 hover:text-gray-500'>
              <XCircle className='h-4 w-4' />
            </button>
          </div>
          <div className='p-3'>
            {teacherMessages.length > 0 ? (
              <ul className='space-y-3'>
                {teacherMessages.map((msg, index) => (
                  <li key={index} className='bg-blue-50 p-3 rounded-lg'>
                    <p className='text-sm text-gray-800'>{msg.message}</p>
                    <p className='text-xs text-gray-500 mt-1'>{msg.timestamp.toLocaleTimeString()}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className='text-sm text-gray-500 text-center py-4'>No messages from teacher</p>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16'>
        <div className='mb-8'>
          <h1 className='text-2xl font-bold text-gray-900'>{exam.title}</h1>

          {violations.length > 0 && (
            <div className='mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-md flex items-start'>
              <AlertTriangle className='h-5 w-5 text-yellow-400 flex-shrink-0 mr-2' />
              <p className='text-sm text-yellow-700'>
                bạn có {violations.length} lỗi vi phạm{violations.length !== 1 ? '' : ''}. Các hành vi vi phạm trong kỳ
                thi đang được ghi lại và có thể ảnh hưởng đến điểm số của bạn.
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

        {/* Navigation and Submit */}
        <div className='flex items-center justify-between pb-12'>
          <button
            type='button'
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className='inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            <ChevronLeft className='-ml-1 mr-2 h-5 w-5' />
            Câu hỏi trước đó
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
              {isSubmitting ? 'Đang trong quá trình nộp bài...' : 'Nộp bài thi'}
            </button>
          </div>

          <button
            type='button'
            onClick={handleNext}
            disabled={currentQuestionIndex === exam.questions.length - 1}
            className='inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            Câu hỏi tiếp theo
            <ChevronRight className='-mr-1 ml-2 h-5 w-5' />
          </button>
        </div>
      </div>
    </div>
  )
}

export default ExamSession
