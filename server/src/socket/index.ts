import { Server } from 'socket.io'
import http from 'http'
import { verifyToken } from '../utils/jwt'
import { envConfig } from '../constants/config'
import examSessionService from '../services/examSessions.services'

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
      next()
    } catch (error) {
      next(new Error('Authentication error'))
    }
  })

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.data.user_id}`)

    // Join exam session room
    socket.on('join_exam', (sessionId) => {
      socket.join(`exam_${sessionId}`)
      console.log(`User ${socket.data.user_id} joined exam ${sessionId}`)

      // Send initial time update
      io.to(`exam_${sessionId}`).emit('time_update', {
        session_id: sessionId,
        timestamp: Date.now()
      })
    })

    // Handle tab switching events
    socket.on('tab_switch', async (data) => {
      const { session_id } = data

      try {
        const updatedSession = await examSessionService.recordViolation(session_id)

        if (updatedSession) {
          // Broadcast violation to the exam room
          io.to(`exam_${session_id}`).emit('violation_recorded', {
            session_id,
            violations: updatedSession.violations,
            score: updatedSession.score
          })
        } else {
          console.error('Error: updatedSession is null')
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
    })
  })

  return io
}
