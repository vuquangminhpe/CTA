import { Server } from 'socket.io'
import http from 'http'
import { verifyToken } from '../utils/jwt'
import { envConfig } from '../constants/config'
import examSessionService from '../services/examSessions.services'
import examSecurityService from '../services/examSecurity.services'

export const initSocketServer = (httpServer: http.Server) => {
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  })

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token

      if (!token) {
        return next(new Error('Authentication error'))
      }

      const decoded = await verifyToken({
        token,
        secretOnPublicKey: envConfig.privateKey_access_token as string
      })

      socket.data.user_id = decoded.user_id

      // Store IP address
      socket.data.ip_address = socket.handshake.address

      next()
    } catch (error) {
      next(new Error('Authentication error'))
    }
  })

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.data.user_id}, IP: ${socket.data.ip_address}`)

    // Track active exam sessions for this connection
    const activeExamSessions = new Set()

    // Join exam session room
    socket.on('join_exam', async (sessionId) => {
      socket.join(`exam_${sessionId}`)
      activeExamSessions.add(sessionId)
      console.log(`User ${socket.data.user_id} joined exam ${sessionId}`)

      // Get security level for this exam
      const securityLevel = await examSecurityService.getSecurityLevel(sessionId)

      // Send initial settings to client
      socket.emit('security_level_update', {
        session_id: sessionId,
        level: securityLevel
      })

      // Send initial time update
      io.to(`exam_${sessionId}`).emit('time_update', {
        session_id: sessionId,
        timestamp: Date.now()
      })
    })

    // Device registration
    socket.on('register_device', async (data) => {
      const { session_id, device_info } = data
      const user_id = socket.data.user_id
      const ip_address = socket.data.ip_address

      // Register the device and check for suspicious activity
      const isValid = await examSecurityService.registerDevice(session_id, user_id, device_info, ip_address)

      if (!isValid) {
        // Notify client of potential issues
        socket.emit('security_warning', {
          session_id,
          message: 'Suspicious activity detected with your device'
        })
      }
    })

    // Webcam verification
    socket.on('webcam_verification', async (data) => {
      const { session_id, photo } = data
      const user_id = socket.data.user_id

      // Verify the webcam image
      const isVerified = await examSecurityService.verifyWebcamImage(session_id, user_id, photo)

      // Send result back to client
      socket.emit('webcam_verification_result', {
        session_id,
        verified: isVerified
      })
    })

    // Handle tab switching events
    socket.on('tab_switch', async (data) => {
      const { session_id } = data
      const user_id = socket.data.user_id

      try {
        // Record as violation
        const violation = await examSecurityService.recordViolation(
          session_id,
          user_id,
          'tab_switch',
          { timestamp: new Date() },
          'medium'
        )

        // Update session in database
        const updatedSession = await examSessionService.recordViolation(session_id)

        if (updatedSession) {
          // Broadcast violation to the exam room
          io.to(`exam_${session_id}`).emit('violation_recorded', {
            session_id,
            violations: updatedSession.violations,
            score: updatedSession.score,
            type: 'tab_switch'
          })
        } else {
          console.error('Error: updatedSession is null')
        }
      } catch (error) {
        console.error('Error recording violation:', error)
      }
    })

    // Handle general exam violations
    socket.on('exam_violation', async (data) => {
      const { session_id, type, details } = data
      const user_id = socket.data.user_id

      try {
        // Determine severity based on violation type
        let severity: 'low' | 'medium' | 'high' = 'medium'

        // Higher severity for certain types of violations
        if (
          type === 'screen_capture_attempt' ||
          type === 'keyboard_shortcut' ||
          type === 'multiple_ips' ||
          type === 'webcam_manipulation'
        ) {
          severity = 'high'
        } else if (type === 'inactivity' || type === 'unusual_activity') {
          severity = 'low'
        }

        // Record the violation
        const violation = await examSecurityService.recordViolation(session_id, user_id, type, details, severity)

        // Get updated session
        const updatedSession = await examSessionService.recordViolation(session_id)

        if (updatedSession) {
          // Broadcast violation to the exam room
          io.to(`exam_${session_id}`).emit('violation_recorded', {
            session_id,
            violations: updatedSession.violations,
            score: updatedSession.score,
            type,
            severity
          })
        }
      } catch (error) {
        console.error('Error recording violation:', error)
      }
    })

    // Periodic time updates (every 5 seconds)
    const timeInterval = setInterval(() => {
      // Get all rooms this socket is in
      const rooms = Array.from(socket.rooms).filter((room) => room.startsWith('exam_'))

      // Send time update to each room
      rooms.forEach((room) => {
        const sessionId = room.replace('exam_', '')

        io.to(room).emit('time_update', {
          session_id: sessionId,
          timestamp: Date.now()
        })
      })
    }, 5000)

    // Cleanup on disconnect
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.data.user_id}`)
      clearInterval(timeInterval)

      // Check if user was in the middle of an exam
      if (activeExamSessions.size > 0) {
        // Record sudden disconnection as potential violation
        activeExamSessions.forEach(async (sessionId) => {
          try {
            await examSecurityService.recordViolation(
              sessionId as string,
              socket.data.user_id,
              'sudden_disconnect',
              { ip_address: socket.data.ip_address },
              'medium'
            )
          } catch (error) {
            console.error('Error recording disconnect violation:', error)
          }
        })
      }
    })
  })

  return io
}
