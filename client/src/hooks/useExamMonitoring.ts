/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import configBase from '../constants/config'

interface StudentSession {
  session_id: string
  student_id: string
  student_name: string
  student_username: string
  violations: number
  start_time: string
  elapsed_time?: number
  last_activity?: Date
  active: boolean
  score?: number
}

interface Violation {
  session_id: string
  student_id: string
  student_name: string
  student_username?: string
  type: string
  severity: 'low' | 'medium' | 'high'
  details?: any
  timestamp: string
}

interface ExamStats {
  total_sessions: number
  completed_sessions: number
  in_progress_sessions: number
  average_score: number
  total_violations: number
}

interface MonitoringData {
  isConnected: boolean
  activeSessions: StudentSession[]
  completedSessions: StudentSession[]
  violations: Violation[]
  stats: ExamStats
  error: string | null
}

const useExamMonitoring = (examId: string) => {
  const [data, setData] = useState<MonitoringData>({
    isConnected: false,
    activeSessions: [],
    completedSessions: [],
    violations: [],
    stats: {
      total_sessions: 0,
      completed_sessions: 0,
      in_progress_sessions: 0,
      average_score: 0,
      total_violations: 0
    },
    error: null
  })

  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    if (!examId) return

    const token = localStorage.getItem('access_token')

    // Initialize socket
    const socket = io(configBase.baseURL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    })

    socketRef.current = socket

    // Set up event handlers
    socket.on('connect', () => {
      console.log('Socket connected for monitoring')
      setData((prev) => ({ ...prev, isConnected: true, error: null }))

      // Join monitoring room for this exam
      socket.emit('monitor_exam', examId)

      // Request initial exam progress
      socket.emit('get_exam_progress', examId)
    })

    socket.on('disconnect', () => {
      console.log('Socket disconnected')
      setData((prev) => ({ ...prev, isConnected: false }))
    })

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error)
      setData((prev) => ({
        ...prev,
        isConnected: false,
        error: 'Connection error: Please check your network connection'
      }))
    })

    socket.on('error', (error) => {
      console.error('Socket error:', error)
      setData((prev) => ({ ...prev, error: error.message || 'An error occurred' }))
    })

    // Handle active sessions data
    socket.on('active_sessions', (data) => {
      if (data.exam_id === examId) {
        setData((prev) => ({
          ...prev,
          activeSessions: data.sessions || []
        }))
      }
    })

    // Handle active sessions updates
    socket.on('active_sessions_update', (data) => {
      if (data.exam_id === examId) {
        setData((prev) => ({
          ...prev,
          activeSessions: data.active_sessions || []
        }))
      }
    })

    // Handle violations history
    socket.on('violations_history', (data) => {
      if (data.exam_id === examId) {
        setData((prev) => ({
          ...prev,
          violations: data.violations || []
        }))
      }
    })

    // Handle new violations
    socket.on('violation_recorded', (violation) => {
      if (violation.exam_id === examId) {
        // Update violations list
        setData((prev) => ({
          ...prev,
          violations: [violation, ...prev.violations].slice(0, 100), // Keep most recent 100
          // Also update the violations count for the specific student
          activeSessions: prev.activeSessions.map((session) =>
            session.session_id === violation.session_id ? { ...session, violations: violation.violations } : session
          )
        }))
      }
    })

    // Handle student joining
    socket.on('student_joined', (data) => {
      if (data.exam_id === examId) {
        setData((prev) => ({
          ...prev,
          activeSessions: [
            ...prev.activeSessions.filter((s) => s.session_id !== data.session_id),
            {
              session_id: data.session_id,
              student_id: data.student_id,
              student_name: data.student_name,
              student_username: data.student_username,
              violations: data.violations,
              start_time: data.start_time,
              active: true
            }
          ]
        }))
      }
    })

    // Handle student submission
    socket.on('student_submitted', (data) => {
      if (data.exam_id === examId) {
        // Move from active to completed
        setData((prev) => {
          const activeSession = prev.activeSessions.find((s) => s.session_id === data.session_id)
          if (!activeSession) return prev

          const completedSession = {
            ...activeSession,
            active: false,
            score: data.score
          }

          return {
            ...prev,
            activeSessions: prev.activeSessions.filter((s) => s.session_id !== data.session_id),
            completedSessions: [...prev.completedSessions, completedSession],
            stats: {
              ...prev.stats,
              completed_sessions: prev.stats.completed_sessions + 1,
              in_progress_sessions: Math.max(0, prev.stats.in_progress_sessions - 1),
              average_score:
                (prev.stats.average_score * prev.stats.completed_sessions + data.score) /
                (prev.stats.completed_sessions + 1)
            }
          }
        })
      }
    })

    // Handle student disconnect
    socket.on('student_disconnected', (data) => {
      if (data.exam_id === examId) {
        // Mark student as potentially inactive
        setData((prev) => ({
          ...prev,
          activeSessions: prev.activeSessions.map((session) =>
            session.session_id === data.session_id ? { ...session, active: false } : session
          )
        }))
      }
    })

    // Handle student being ended by teacher
    socket.on('student_exam_ended', (data) => {
      // Remove from active sessions
      setData((prev) => ({
        ...prev,
        activeSessions: prev.activeSessions.filter((s) => s.session_id !== data.session_id)
      }))
    })

    // Handle exam progress updates
    socket.on('exam_progress', (data) => {
      if (data.exam_id === examId) {
        setData((prev) => ({
          ...prev,
          stats: {
            total_sessions: data.total_sessions,
            completed_sessions: data.completed_sessions,
            in_progress_sessions: data.in_progress_sessions,
            average_score: data.average_score,
            total_violations: data.total_violations
          },
          activeSessions: data.active_students || prev.activeSessions
        }))
      }
    })

    // Connect the socket
    socket.connect()

    // Cleanup on unmount
    return () => {
      socket.off('connect')
      socket.off('disconnect')
      socket.off('connect_error')
      socket.off('error')
      socket.off('active_sessions')
      socket.off('active_sessions_update')
      socket.off('violations_history')
      socket.off('violation_recorded')
      socket.off('student_joined')
      socket.off('student_submitted')
      socket.off('student_disconnected')
      socket.off('student_exam_ended')
      socket.off('exam_progress')

      socket.disconnect()
    }
  }, [examId])

  // Function to end a student's exam
  const endStudentExam = (sessionId: string, reason: string = 'Ended by teacher') => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('end_student_exam', { session_id: sessionId, reason })
      return true
    }
    return false
  }

  // Function to send a message to a student
  const sendMessageToStudent = (sessionId: string, message: string) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('teacher_message', { session_id: sessionId, message })
      return true
    }
    return false
  }

  // Function to refresh data
  const refreshData = () => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit('get_exam_progress', examId)
      return true
    }
    return false
  }

  return {
    ...data,
    endStudentExam,
    sendMessageToStudent,
    refreshData
  }
}

export default useExamMonitoring
