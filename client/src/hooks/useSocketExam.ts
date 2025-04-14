/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'
import configBase from '../constants/config'

const useSocketExam = (sessionId: unknown) => {
  const [socket, setSocket] = useState<any>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [violations, setViolations] = useState(0)
  const [serverTime, setServerTime] = useState(null)

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
      console.log('Socket connected')
      setIsConnected(true)
      socket.emit('join_exam', sessionId)
    }

    const handleDisconnect = () => {
      console.log('Socket disconnected')
      setIsConnected(false)
    }

    const handleConnectError = (err: any) => {
      console.error('Socket connection error:', err)
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

    // Register event handlers
    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect_error', handleConnectError)
    socket.on('time_update', handleTimeUpdate)
    socket.on('violation_recorded', handleViolationRecorded)

    // Clean up event handlers on unmount
    return () => {
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('connect_error', handleConnectError)
      socket.off('time_update', handleTimeUpdate)
      socket.off('violation_recorded', handleViolationRecorded)
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
    resetViolations: () => setViolations(0)
  }
}

export default useSocketExam
