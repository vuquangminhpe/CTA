import { Server } from 'socket.io'
import http from 'http'
import { verifyToken } from '../utils/jwt'
import { envConfig } from '../constants/config'
import examSessionService from '../services/examSessions.services'
import examSecurityService from '../services/examSecurity.services'
import { ObjectId } from 'mongodb'
import databaseService from '../services/database.services'

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
    socket.on('register_device_extended', async (data) => {
      const { session_id, device_info } = data
      const user_id = socket.data.user_id
      const ip_address = socket.data.ip_address

      try {
        // Store the extended device info
        await examSecurityService.registerExtendedDevice(session_id, user_id, {
          ...device_info,
          ip_address,
          connection_id: socket.id,
          timestamp: new Date()
        })

        // Check for suspicious activity based on the device info
        const deviceScore = await examSecurityService.evaluateDeviceRisk(session_id, user_id, device_info)

        // If risk score is high, notify the client
        if (deviceScore > 70) {
          socket.emit('security_warning', {
            session_id,
            message: 'High risk device detected. Extra monitoring enabled.',
            level: 'high'
          })

          // Also record a medium severity violation
          await examSecurityService.recordViolation(
            session_id,
            user_id,
            'high_risk_device',
            { risk_score: deviceScore, device_info },
            'medium'
          )
        }
      } catch (error) {
        console.error('Error processing extended device info:', error)
      }
    })

    // Enhanced violation recording with better metadata
    socket.on('exam_violation', async (data) => {
      const { session_id, type, details } = data
      const user_id = socket.data.user_id

      try {
        // Determine severity based on violation type
        let severity: 'low' | 'medium' | 'high' = 'medium'

        // Enhanced severity classification
        if (
          type === 'screen_capture' ||
          type === 'screen_capture_attempt' ||
          type === 'keyboard_shortcut' ||
          type === 'multiple_ips' ||
          type === 'webcam_manipulation'
        ) {
          // Get more details about the detection
          const detectionMethod = details?.detection_method || 'unknown'

          // Different methods have different confidence levels
          if (
            detectionMethod === 'ios_frame_drop' ||
            detectionMethod === 'memory_spike' ||
            detectionMethod === 'canvas_freeze'
          ) {
            severity = 'high' // High confidence methods
          } else if (detectionMethod === 'android_dimension_change' || detectionMethod === 'focus_change') {
            severity = 'medium' // Medium confidence
          } else {
            severity = 'low' // Lower confidence methods
          }
        } else if (type === 'inactivity' || type === 'unusual_activity') {
          severity = 'low'
        }

        // Add additional metadata to help with analysis
        const enhancedDetails = {
          ...details,
          client_info: {
            user_agent: socket.handshake.headers['user-agent'],
            ip: socket.data.ip_address,
            socket_id: socket.id
          },
          server_timestamp: new Date()
        }

        // Record the enhanced violation
        const violation = await examSecurityService.recordViolation(
          session_id,
          user_id,
          type,
          enhancedDetails,
          severity
        )

        // Get updated session
        const updatedSession = await examSessionService.recordViolation(session_id)

        if (updatedSession) {
          // Broadcast violation to the exam room with enhanced details
          io.to(`exam_${session_id}`).emit('violation_recorded', {
            session_id,
            violations: updatedSession.violations,
            score: updatedSession.score,
            type,
            severity,
            timestamp: new Date(),
            details: { detection_method: details?.detection_method || 'unknown' }
          })

          // If high severity, also notify teacher/admin monitors
          if (severity === 'high') {
            io.to('admin_monitors').emit('high_severity_violation', {
              session_id,
              student_id: user_id,
              type,
              details: enhancedDetails,
              timestamp: new Date()
            })
          }
        }
      } catch (error) {
        console.error('Error recording enhanced violation:', error)
      }
    })

    // Add a new handler for mobile screenshot detection
    socket.on('mobile_screenshot_detected', async (data) => {
      const { session_id, detection_method, confidence, evidence } = data
      const user_id = socket.data.user_id

      try {
        // Determine severity based on confidence
        let severity: 'low' | 'medium' | 'high'

        if (confidence >= 0.8) {
          severity = 'high'
        } else if (confidence >= 0.5) {
          severity = 'medium'
        } else {
          severity = 'low'
        }

        // Record the mobile-specific violation
        await examSecurityService.recordViolation(
          session_id,
          user_id,
          'mobile_screenshot',
          {
            detection_method,
            confidence,
            evidence,
            timestamp: new Date(),
            device_info: {
              user_agent: socket.handshake.headers['user-agent'],
              ip: socket.data.ip_address
            }
          },
          severity
        )

        // Update session
        const updatedSession = await examSessionService.recordViolation(session_id)

        if (updatedSession) {
          // Notify client
          socket.emit('violation_recorded', {
            session_id,
            violations: updatedSession.violations,
            score: updatedSession.score,
            type: 'mobile_screenshot',
            severity
          })
        }
      } catch (error) {
        console.error('Error processing mobile screenshot detection:', error)
      }
    })
    socket.on('activity_ping', async (data) => {
      const { session_id, state, timestamp } = data

      // Lưu trạng thái hoạt động vào cơ sở dữ liệu nếu cần
      try {
        await databaseService.db.collection('exam_activity_logs').insertOne({
          session_id: new ObjectId(session_id as string),
          student_id: new ObjectId(socket.data.user_id as string),
          state,
          timestamp: new Date(timestamp),
          socket_id: socket.id,
          ip_address: socket.data.ip_address
        })
      } catch (error) {
        console.error('Error logging activity ping:', error)
      }
    })

    // Cải tiến hàm xử lý tab_switch
    socket.on('tab_switch', async (data) => {
      const { session_id } = data
      const user_id = socket.data.user_id

      try {
        // Thêm thông tin chi tiết hơn về thiết bị và trình duyệt
        const deviceInfo = {
          userAgent: socket.handshake.headers['user-agent'],
          ip: socket.data.ip_address,
          timestamp: new Date(),
          isProbablyMobile: /mobile|android|iphone|ipad|ipod/i.test(socket.handshake.headers['user-agent'] || '')
        }

        // Record as violation with enhanced info
        const violation = await examSecurityService.recordViolation(
          session_id,
          user_id,
          'tab_switch',
          {
            timestamp: new Date(),
            device_info: deviceInfo,
            socket_id: socket.id
          },
          'medium'
        )

        // Cập nhật session
        const updatedSession = await examSessionService.recordViolation(session_id)

        if (updatedSession) {
          // Broadcast violation to the exam room
          io.to(`exam_${session_id}`).emit('violation_recorded', {
            session_id,
            violations: updatedSession.violations,
            score: updatedSession.score,
            type: 'tab_switch',
            severity: 'medium',
            // Thêm thông tin Chi tiết hơn
            details: {
              device_type: deviceInfo.isProbablyMobile ? 'mobile' : 'desktop',
              timestamp: new Date()
            }
          })
        } else {
          console.error('Error: updatedSession is null')
        }
      } catch (error) {
        console.error('Error recording tab switch violation:', error)
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
