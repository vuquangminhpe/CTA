/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import ExamQuestion from './ExamQuestion'
import { io, Socket } from 'socket.io-client'
import configBase from '../../constants/config'
import ExamTimer from './ExamTimer'

interface ExamSessionProps {
  session: { _id: string }
  exam: { title: string; questions: { _id: string; content?: string; answers?: React.ReactNode[] }[] }
  remainingTime: number
  onSubmit: (sessionId: string, answers: { question_id: string; selected_index: number }[]) => void
}

const ExamSession: React.FC<ExamSessionProps> = ({ session, exam, remainingTime, onSubmit }) => {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [timeLeft, setTimeLeft] = useState(remainingTime)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [hasViolation, setHasViolation] = useState(false)
  const navigate = useNavigate()

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
      // Update time based on server timestamp
    })

    newSocket.on('violation_recorded', (data) => {
      if (data.session_id === session._id) {
        setHasViolation(true)
      }
    })

    setSocket(newSocket as any)

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
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [socket, session._id])

  // Handle time up
  const handleTimeUp = () => {
    handleSubmit()
  }

  // Select an answer
  const handleAnswerSelect = (questionId: any, answerIndex: any) => {
    setAnswers({
      ...answers,
      [questionId]: answerIndex
    })
  }

  // Submit exam
  const handleSubmit = () => {
    const formattedAnswers = Object.entries(answers).map(([questionId, selectedIndex]) => ({
      question_id: questionId,
      selected_index: selectedIndex
    }))

    onSubmit(session._id, formattedAnswers)
  }

  return (
    <div className='max-w-3xl mx-auto py-6 px-4'>
      <ExamTimer remainingTime={timeLeft} onTimeUp={handleTimeUp} />

      {hasViolation && (
        <div className='mb-6 p-4 bg-red-100 text-red-800 rounded-lg'>
          <p className='font-medium'>Violation detected!</p>
          <p>You've switched tabs or windows during the exam. Your score has been reset to 0.</p>
        </div>
      )}

      <h1 className='text-2xl font-bold text-gray-900 mb-6'>{exam.title}</h1>

      <div className='space-y-6'>
        {exam.questions.map((question: { _id: any; content?: string; answers?: React.ReactNode[] }, index: number) => (
          <ExamQuestion
            key={question._id}
            question={question as any}
            questionIndex={index}
            onAnswerSelected={handleAnswerSelect}
            selectedAnswer={answers[question._id]}
          />
        ))}
      </div>

      <div className='mt-8 flex justify-end'>
        <button
          onClick={handleSubmit}
          className='py-2 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        >
          Submit Exam
        </button>
      </div>
    </div>
  )
}

export default ExamSession
