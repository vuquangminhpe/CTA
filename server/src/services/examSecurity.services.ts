import { ObjectId } from 'mongodb'
import databaseService from './database.services'
import ExamSession from '../models/schemas/ExamSession.schema'

// New schema for device information
interface DeviceInfo {
  session_id: ObjectId
  student_id: ObjectId
  fingerprint: string
  userAgent: string
  screenResolution: string
  availableScreenSize: string
  timezone: string
  language: string
  platform: string
  cores: number
  ip_address: string
  created_at: Date
}

// New schema for violations
interface ViolationRecord {
  session_id: ObjectId
  student_id: ObjectId
  type: string
  details: any
  timestamp: Date
  severity: 'low' | 'medium' | 'high'
}

class ExamSecurityService {
  // Record a device for an exam session
  async registerDevice(sessionId: string, studentId: string, deviceInfo: any, ipAddress: string): Promise<boolean> {
    try {
      // Check if collection exists, create if not
      await this.ensureCollectionsExist()

      // Store the device information
      await databaseService.db.collection('exam_devices').insertOne({
        session_id: new ObjectId(sessionId),
        student_id: new ObjectId(studentId),
        ...deviceInfo,
        ip_address: ipAddress,
        created_at: new Date()
      })

      // Check for duplicate devices/sessions
      const deviceCount = await databaseService.db.collection('exam_devices').countDocuments({
        fingerprint: deviceInfo.fingerprint,
        session_id: { $ne: new ObjectId(sessionId) },
        created_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      })

      if (deviceCount > 0) {
        // Record this as a potential violation - same device used for multiple exams
        await this.recordViolation(
          sessionId,
          studentId,
          'duplicate_device',
          {
            fingerprint: deviceInfo.fingerprint,
            count: deviceCount
          },
          'medium'
        )

        return false
      }

      // Check for multiple IPs for same student in short timeframe
      const ipCount = await databaseService.db.collection('exam_devices').countDocuments({
        student_id: new ObjectId(studentId),
        ip_address: { $ne: ipAddress },
        created_at: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
      })

      if (ipCount > 0) {
        // Record this as a potential violation - multiple IPs
        await this.recordViolation(
          sessionId,
          studentId,
          'multiple_ips',
          {
            current_ip: ipAddress,
            count: ipCount
          },
          'medium'
        )

        return false
      }

      return true
    } catch (error) {
      console.error('Error registering device:', error)
      return false
    }
  }

  // Record a violation
  async recordViolation(
    sessionId: string,
    studentId: string,
    type: string,
    details: any,
    severity: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<ViolationRecord> {
    try {
      // Check if collection exists, create if not
      await this.ensureCollectionsExist()

      const violation: ViolationRecord = {
        session_id: new ObjectId(sessionId),
        student_id: new ObjectId(studentId),
        type,
        details,
        severity,
        timestamp: new Date()
      }

      // Insert the violation record
      await databaseService.db.collection('exam_violations').insertOne(violation)

      // Update the session with violation count
      await databaseService.examSessions.updateOne(
        { _id: new ObjectId(sessionId) },
        {
          $inc: { violations: 1 },
          $set: {
            // If it's a high severity violation, reset score to 0
            ...(severity === 'high' ? { score: 0 } : {}),
            updated_at: new Date()
          }
        }
      )

      return violation
    } catch (error) {
      console.error('Error recording violation:', error)
      throw error
    }
  }

  // Verify webcam image (placeholder for actual implementation)
  async verifyWebcamImage(sessionId: string, studentId: string, photoData: string): Promise<boolean> {
    try {
      // In a real implementation, you would:
      // 1. Store the image
      // 2. Possibly use facial recognition to verify student identity
      // 3. Check for multiple people in frame

      // For now, we'll just store a record that verification happened
      await databaseService.db.collection('exam_verifications').insertOne({
        session_id: new ObjectId(sessionId),
        student_id: new ObjectId(studentId),
        type: 'webcam',
        verified: true, // Placeholder, in real system would be result of verification
        timestamp: new Date()
      })

      return true
    } catch (error) {
      console.error('Error verifying webcam image:', error)
      return false
    }
  }

  // Get all violations for a session
  async getSessionViolations(sessionId: string): Promise<ViolationRecord[]> {
    try {
      const violations = await databaseService.db
        .collection('exam_violations')
        .find({ session_id: new ObjectId(sessionId) })
        .sort({ timestamp: -1 })
        .toArray()

      return violations as unknown as ViolationRecord[]
    } catch (error) {
      console.error('Error getting session violations:', error)
      return []
    }
  }

  // Calculate security score (0-100) for a session
  async calculateSecurityScore(sessionId: string): Promise<number> {
    try {
      const violations = await this.getSessionViolations(sessionId)

      if (violations.length === 0) return 100

      // Calculate score based on number and severity of violations
      let penaltyPoints = 0

      for (const violation of violations) {
        switch (violation.severity) {
          case 'low':
            penaltyPoints += 5
            break
          case 'medium':
            penaltyPoints += 15
            break
          case 'high':
            penaltyPoints += 30
            break
        }
      }

      // Cap at 100 points penalty
      penaltyPoints = Math.min(penaltyPoints, 100)

      return 100 - penaltyPoints
    } catch (error) {
      console.error('Error calculating security score:', error)
      return 0
    }
  }

  // Determine security level based on exam settings and environmental factors
  async getSecurityLevel(sessionId: string): Promise<'low' | 'medium' | 'high'> {
    // This could be based on exam settings, school policy, etc.
    // For now, just return 'medium' as default
    return 'medium'
  }

  // Ensure collections exist
  private async ensureCollectionsExist(): Promise<void> {
    const db = databaseService.db
    const collections = await db.listCollections().toArray()
    const collectionNames = collections.map((c) => c.name)

    const requiredCollections = ['exam_devices', 'exam_violations', 'exam_verifications']

    for (const collection of requiredCollections) {
      if (!collectionNames.includes(collection)) {
        await db.createCollection(collection)

        // Create indexes
        if (collection === 'exam_devices') {
          await db.collection(collection).createIndex({ session_id: 1 })
          await db.collection(collection).createIndex({ student_id: 1 })
          await db.collection(collection).createIndex({ fingerprint: 1 })
        } else if (collection === 'exam_violations') {
          await db.collection(collection).createIndex({ session_id: 1 })
          await db.collection(collection).createIndex({ student_id: 1 })
          await db.collection(collection).createIndex({ timestamp: 1 })
        } else if (collection === 'exam_verifications') {
          await db.collection(collection).createIndex({ session_id: 1 })
          await db.collection(collection).createIndex({ student_id: 1 })
        }
      }
    }
  }
}

const examSecurityService = new ExamSecurityService()
export default examSecurityService
