/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import configBase from '../constants/config'
import { toast } from 'sonner'

const useSocketExam = (sessionId: unknown) => {
  const [socket, setSocket] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [violations, setViolations] = useState(0)
  const [serverTime, setServerTime] = useState(null)
  const [teacherMessages, setTeacherMessages] = useState<any[]>([])
  const [hasNewMessage, setHasNewMessage] = useState(false)

  const socketRef = useRef<Socket | null>(null)

  // Initialize socket connection
  useEffect(() => {
    if (!sessionId) return

    const token = localStorage.getItem('access_token')

    const newSocket = io(configBase.baseURL, {
      auth: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000
    })

    socketRef.current = newSocket
    setSocket(newSocket)

    // Clean up socket on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [sessionId])

  // Set up event listeners
  useEffect(() => {
    if (!socket) return

    const handleConnect = () => {
      setIsConnected(true)
      socket.emit('join_exam', sessionId)
    }

    const handleDisconnect = () => {
      setIsConnected(false)
    }

    const handleConnectError = (err: any) => {
      setIsConnected(false)
    }

    const handleTimeUpdate = (data: { session_id: unknown; timestamp: any }) => {
      if (data.session_id === sessionId) {
        setServerTime(data.timestamp)
      }
    }

    const handleViolationRecorded = (data: { session_id: unknown; violations: any }) => {
      if (data.session_id === sessionId) {
        setViolations(data.violations)
      }
    }

    // Add or update the teacher message handler
    const handleTeacherMessage = (data: any) => {
      if (data.session_id === sessionId) {
        const newMessage = {
          message: data.message,
          timestamp: new Date(data.timestamp || Date.now())
        }

        setTeacherMessages((prev) => [...prev, newMessage])
        setHasNewMessage(true)

        // Show more prominent toast notification
        toast.info(`Tin nhắn từ giáo viên: ${data.message}`, {
          duration: 8000, // Show for longer (8 seconds)
          position: 'top-center',
          style: {
            backgroundColor: '#EBF5FF', // Light blue background
            color: '#1E40AF', // Dark blue text
            border: '1px solid #93C5FD', // Blue border
            padding: '16px',
            fontWeight: 'bold'
          },
          icon: '📢' // Add an icon
        })
      }
    }

    // Register event handlers
    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect_error', handleConnectError)
    socket.on('time_update', handleTimeUpdate)
    socket.on('violation_recorded', handleViolationRecorded)
    socket.on('teacher_message', handleTeacherMessage)

    // Clean up event handlers on unmount
    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('connect_error', handleConnectError)
      socket.off('time_update', handleTimeUpdate)
      socket.off('violation_recorded', handleViolationRecorded)
      socket.off('teacher_message', handleTeacherMessage)
    }
  }, [socket, sessionId])

  // Handle visibility change for tab switching detection
  useEffect(() => {
    if (!socket || !isConnected) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        socket.emit('tab_switch', { session_id: sessionId })
        setViolations((prev) => prev + 1)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [socket, isConnected, sessionId])

  return {
    socket,
    isConnected,
    violations,
    serverTime,
    teacherMessages,
    hasNewMessage,
    setHasNewMessage,
    resetViolations: () => setViolations(0)
  }
}

export default useSocketExam
