/* eslint-disable @typescript-eslint/no-explicit-any */
import { SuccessResponse } from '../types/Utils.type'
import http from '../utils/http'

interface FaceProfileStatus {
  has_face_profile: boolean
  created_at: string | null
  updated_at: string | null
}

interface FaceVerificationResult {
  verified: boolean
  similarity: number
  confidence: 'high' | 'medium' | 'low'
}

interface HealthCheckResult {
  status: 'healthy' | 'unhealthy'
  models: {
    scrfd: boolean
    genderage: boolean
    glintr100: boolean
  }
  pipeline_ready: boolean
}

const faceVerificationApi = {
  // Upload face image for profile registration
  uploadFaceProfile: (faceImage: File) => {
    const formData = new FormData()
    formData.append('face_image', faceImage)

    return http.post<SuccessResponse<{ success: boolean }>>('/api/face/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 30000 // 30 seconds timeout for face processing
    })
  },

  // Verify face for exam start
  verifyFaceForExam: (faceImage: File) => {
    const formData = new FormData()
    formData.append('face_image', faceImage)

    return http.post<SuccessResponse<FaceVerificationResult>>('/api/face/verify', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      timeout: 30000 // 30 seconds timeout for verification
    })
  },

  // Get face profile status
  getFaceProfileStatus: () => http.get<SuccessResponse<FaceProfileStatus>>('/api/face/status'),

  // Delete face profile
  deleteFaceProfile: () => http.delete<SuccessResponse<{ message: string }>>('/api/face/profile'),

  // Get face service health (for debugging)
  getFaceServiceHealth: () => http.get<SuccessResponse<HealthCheckResult>>('/api/face/health'),

  // Batch verify faces for exam (Teacher only)
  batchVerifyFacesForExam: (examId: string) => http.get<SuccessResponse<any>>(`/api/face/batch-verify/${examId}`)
}

export default faceVerificationApi
