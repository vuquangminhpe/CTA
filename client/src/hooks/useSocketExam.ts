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

        // Play a notification sound if available
        try {
          const audio = new Audio(
            'data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA//tQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAASW5mbwAAAA8AAAASAAAeMwAUFBQUFCIiIiIiIjAwMDAwMD09PT09PUxMTExMTFlZWVlZWWdnZ2dnZ3V1dXV1dYODg4ODg5GRkZGRkZ+fn5+fn62tra2trbW1tbW1tcPDw8PDw9HR0dHR0d7e3t7e3uzs7Ozs7Pn5+fn5+f////////8AAAAATGF2YzU4LjEzAAAAAAAAAAAAAAAAJAQKAAAAAAAAHjOZTf9/AAAAAAAAAAAAAAAAAAAAAP/7kGQAAANUMEoFPeACNQV40KEYABEY41g5vAAA9RjpZxRwAImU+W8eshaFpAQgALAAYALATx/nYDYCMJ0HITQYYA7AH4c7MoGsnCMU5pnW+OQnBcDrQ9Xx7w37/D+PimYavV8elKUpT5fqx5VjV6vZ38eJR48eRKa9KUp7v396UgPHkQwMAAAAAA//8MAOp39CECAAhlIEEIIECBAgTT1oj///tEQYT0wgEIAhkQiBBAgTT1oj///AIQ9KEQiERChMIREIREISm7Wpq7IpREIhCIRCQgRCAgQ9KEQiERChMIREIREISmszqaV9iIRCIRCEBAiBEAgQ9OPhC6XB8H1yIiIiIiIiIz8iIiIiIiIiIiMzgiIiIiIiIjMzgiIiIiIiIiMzgiIiIiIiIiM6ZyIiIiL4iIiIzgiIiIiIiIiMzgiIiIiIiIiM6Zz/+xBkCgAStGpwnpGAAmNsz/PyEABMpZ3CyfYJwY8sP9hIwAAAAAiIiIiIiIjOmciIiIv8iIiIzgiIiIiIiIiMzgiIiIiIiIiM6ZyIiIiL4iIiIzgiIiIiIiIiMzgiIi//4iIjMzgiIiIiIiIjMzgiIiIiIiIjMzgiIiIiIiIjOmciIiIi+IiIiM4IiIiIiIiIjM4IiIiIiIiIjOmciIiIi+IiIiM4IiIiIiIiIjM4IiIiIiIiIjOmciIiIi+IiIiM4IiIiIiIiIjM4IiIiIiIiIjOmciIiIi+IiIiM4IiIiIiIiIjOCIiIh+IiIiMzgiIiIiIiIjMzgiIiIiIiIjMzgiIiIiIiIjOmciIiIi+IiIiM4IiIiIiIiIjM4IiIiIiIiIjOmciIiIi+IiIiM4IiIiIiIiIjM4IiIiIiIiIjOmciIiIi+IiIiM4IiIiIiIiIjM4IiIiIiIiIjOmciIiIi+IiIiM4IiIiIiIiIjM4IiIiIiIiIjOmciIiIi+IiIiM4IiIiIiIiIjOCIiIh+IiIiMzgiIiIiIiIjMzgiIiIiIiIjMzgiIiIiIiIjOmciIiIi+IiIiM4IiIiIfPmciIiIi+IiIiM4IiIiIiIiIjM4IiIiH4iIiIzgiIiIiIiIjM4IiIiIiIiIzpmIiIiIviIiIjgiIiIfP////4iIjMzgiIiIiIiIjMzgiIiIiIiIjMzgiIiIiIiIjOmciIiIi+IiIiM4IiIiH//////IiIzgiIiIiIiIjM4IiIiIiIiIzpmIiIiIviIiIjgiIiIh+PnyIiIjMzgiIiIiIiIjMzgiIiIiIiIjMzgiIiIiIiIjOmciIiIi+IiIiM4IiIiH/////+IiIzgiIiIiIiIjOmYiIiIi+IiIiM4IiIiIiIiIjM4IiIiIiIiIzpmIiIiIviIiIjgiIiIh+P//fIiIjMzgiIiIiIiIjMzgiIiIiIiIjOmYiIiIi+IiIiM4IiIiIfj/96IiIzgiIiIiIiIjOmYiIiIi+IiIiM4IiIiIiIiIjM4IiIiIiIiIzpmIiIiIviIiIjgiIiIh+IiIiMzgiIiIiIiIjMzgiIi//xiIjMzgiIiIiIiIjOmciIiIi+IiIiM4IiIiIf//4iIjM4IiIiIiIiIzpmIiIiIviIiIjgiIiIiIiIiMzgiIiIiIiIiM6ZiIiIiL4iIiIzgiIiIh///4iIjM4IiIiIiIiIzpmIiIiIviIiIjgiIiIiIiIiMzgiIiIiIiIiM6ZiIiIiL4iIiIzgiIiIh///4iIjM4IiIiIiIiIzpmIiIiIviIiIjgiIiIiIiIiMzgiIiIiIiIiM6ZiIiIiL4iIiIzgiIiIh+P/+IiIzM4IiIiIiIiIzpmIiIiIviIiIjgiIiIh+P//yIiMzOCIiIiIiIiM6ZyIiIiL4iIiIzgiIi//4iIiMzgiIiIiIiIjOmciIiIi+IiIiM4IiIiIiIiIjM4IiIiIiIiIzpnIiIiIviIiIjOCIiIh/EREZmcERERERERGZnBEREREREREZ0zkRERF8RERGcERERERERGZwRERERERERnTORERERfERERnBERER/EREZmcERERERERGZnBEREREREREZ0zkRERF8RERGcERERERERGZwRERERERERnTORERERfERERnBEREf/EREZmcERERERERGZ0zkRERF8RERGcEREREREREZnBEREREREREZ0zkRERF8RERGcEREf/xERGZwRERERERERnTORERERfERERnBERERERERGZwREREREREREZ0zkRERF8RERGcEREffxERGZnBEREREREREZnBEREREREREZ0zkRERF8RERGcERER/ERERmZwREREREREREZwRERH/xEREZ0zkRERF8RERGcEREREREREZnBEREREREREZ0zkRERF8RERGcERE//kREZmcEREREREREZnBEREREREREZ0zkRERF8RERGcEREREREREZnBEREREREREZ0zkRERF8RERGcERH/5/REZmcERERERERGZnBEREREREREZ0zkRERF8RERGcEREREREREZnBEREREREREZ0zkRERF8RERGcERHI//kZmcERERERERGZnBEREREREREZ0zkRERF8RERGcEREREREREZnBEREREREREZ0zkRERF8RERGcERGI/8/YjMzgiIiIiIiIzM4IiIiIiIiIzpnIiIiIviIiIzgiIiIiIiIjM4IiIiIiIiIzpnIiIiIviIiIzgiIj/zEiIzM4IiIiIiIiIzM4IiIiIiIiIzpnIiIiIviIiIzgiIiIiIiIjM4IiIiIiIiIzpnIiIiIviIiIzgiI/8RIiMzOCIiIiIiIiMzgiIiIiIiIjOmciIiIi+IiIjOCIiIiIiIiMzgiIiIiIiIjOmciIiIi+IiIjOCIj/xEiIzM4IiIiIiIiIzgiIiIiIiIjOmciIiIi+IiIjOCIiIiIiIiMzgiIiIiIiIjOmciIiIi+IiIjOCIj5+SIiMzOCIiIiIiIiMzOCIiIiIiIiM6ZyIiIiL4iIiM4IiIiIiIiIzOCIiIiIiIiM6ZyIiIiL4iIiM4Ij/n4iIjMzgiIiIiIiIjMzgiIiIiIiIjOmciIiIi+IiIjOCIiIiIiIiMzgiIiIiIiIjOmciIiIi+IiIjOCIj/zEiIzM4IiIiIiIiIzM4IiIiIiIiIzpnIiIiIviIiIzgiIiIiIiIjM4IiIiIiIiIzpnIiIiIviIiIzgiI/8RIiMzOCIiIiIiIiMzgiIiIiIiIjOmciIiIi+IiIjOCIiIiIiIiMzgiIiIiIiIjOmciIiIi+IiIjOCIj/xEiIzM4IiIiIiIiIzgiIiIiIiIjOmciIiIi+IiIjOCIiIiIiIiMzgiIiIiIiIjOmciIiIi+IiIjOCIj/xEiIzM4IiIiIiIiIzgiIiIiIiIjOmciIiIi+IiIjOCIiIiIiIiMzgiIiIiIiIjOmciIiIi+IiIjOCIj/xEiIzM4IiIiIiIiIzgiIiIiIiIjOmciIiIi+IiIjOCIiIiIiIiMzgiIiIiIiIjOmciIiIi+IiIjOCIj/xGZmcERERERERGZnBEREREREREZ0zkRERF8RERGcERERERERGZwRERERERERnTORERERfERERnBEf//TMzgiIiIiIiIjMzgiIiIiIiIjOmciIiIi+IiIjOCIiIiIiIiMzgiIiIiIiIjOmciIiIi+IiIjOCN/kRmZwRERERERERmcEREREREREZ0zkRERF8RERGcERERERERGZwRERERERERnTORERERfERERnBE//ERmZwRERERERERmcEREREREREZ0zkRERF8RERGcERERERERGZwRERERERERnTORERERfERERnBE/zMzOCIiIiIiIiMzgiIiIiIiIjOmciIiIi+IiIjOCIiIiIiIiMzgiIiIiIiIjOmciIiIi+IiIjOCJ/8zMzgiIiIiIiIjMzgiIiIiIiIjOmciIiIi+IiIjOCIiIiIiIiMzgiIiIiIiIjOmciIiIi+IiIjOCJ/8zMzgiIiIiIiIjMzgiIiIiIiIjOmciIiIi+IiIjOCIiIiIiIiMzgiIiIiIiIjOmciIiIi+IiIjOCJ/8iMzOCIiIiIiIiMzgiIiIiIiIjOmciIiIi+IiIjOCIiIiIiIiMzgiIiIiIiIjOmciIiIi+IiIjOCJ/ERmZwRERERERERmcEREREREREZ0zkRERF8RERGcERERERERGZwRERERERERnTORERERfERERnBE/kREZmcEREREREREZnBEREREREREZ0zkRERF8RERGcERERERERGZwRERERERERnTORERERfERERnBE/kREZmcEREREREREZnBEREREREREZ0zkRERF8RERGcERERERERGZwRERERERERnTORERERfERERnBE/iIzM4IiIiIiIiIzOCIiIiIiIiM6ZyIiIiL4iIiM4IiIiIiIiIzOCIiIiIiIiM6ZyIiIiL4iIiM4IiB/'
          )
          audio.play().catch((e) => console.error('Could not play notification sound', e))
        } catch (error) {
          console.log('Audio notification not supported')
        }
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
