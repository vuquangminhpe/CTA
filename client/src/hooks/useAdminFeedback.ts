import { useState, useCallback } from 'react'
import feedbackApi, { 
  FeedbackData, 
  UpdateFeedbackBody, 
  AddMessageBody,
  FeedbackStatus
} from '../apis/feedback.api'
import { toast } from 'sonner'

interface UseAdminFeedbackResult {
  loading: boolean
  error: string | null
  updateFeedbackStatus: (feedbackId: string, status: FeedbackStatus) => Promise<FeedbackData | null>
  updateFeedback: (feedbackId: string, data: UpdateFeedbackBody) => Promise<FeedbackData | null>
  addAdminMessage: (feedbackId: string, message: string) => Promise<FeedbackData | null>
  assignFeedback: (feedbackId: string, adminId: string) => Promise<boolean>
  resolveFeedback: (feedbackId: string) => Promise<boolean>
  closeFeedback: (feedbackId: string) => Promise<boolean>
  deleteFeedback: (feedbackId: string) => Promise<boolean>
  getFeedbackDetail: (feedbackId: string) => Promise<FeedbackData | null>
}

export const useAdminFeedback = (): UseAdminFeedbackResult => {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Helper function to extract error messages
  const extractErrorMessage = (error: any): string => {
    if (typeof error === 'string') return error
    
    if (error?.response?.data?.message) {
      const message = error.response.data.message
      if (typeof message === 'object') {
        return Object.values(message).flat().join(', ')
      }
      return message
    }
    
    if (error?.message) return error.message
    return 'Đã xảy ra lỗi không xác định'
  }

  // Update feedback status
  const updateFeedbackStatus = useCallback(async (feedbackId: string, status: FeedbackStatus): Promise<FeedbackData | null> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await feedbackApi.updateFeedback(feedbackId, { status })
      toast.success('Đã cập nhật trạng thái feedback!')
      return response.data.result
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Update feedback
  const updateFeedback = useCallback(async (feedbackId: string, data: UpdateFeedbackBody): Promise<FeedbackData | null> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await feedbackApi.updateFeedback(feedbackId, data)
      toast.success('Đã cập nhật feedback!')
      return response.data.result
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Add admin message
  const addAdminMessage = useCallback(async (feedbackId: string, message: string): Promise<FeedbackData | null> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await feedbackApi.addMessage(feedbackId, { message })
      toast.success('Đã gửi phản hồi!')
      return response.data.result
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // Assign feedback to admin (although API auto-assigns)
  const assignFeedback = useCallback(async (feedbackId: string, adminId: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      
      await feedbackApi.assignFeedback(feedbackId, { admin_id: adminId })
      toast.success('Đã phân công feedback!')
      return true
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Resolve feedback
  const resolveFeedback = useCallback(async (feedbackId: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      
      await feedbackApi.resolveFeedback(feedbackId)
      toast.success('Đã giải quyết feedback!')
      return true
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Close feedback
  const closeFeedback = useCallback(async (feedbackId: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      
      await feedbackApi.closeFeedback(feedbackId)
      toast.success('Đã đóng feedback!')
      return true
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Delete feedback
  const deleteFeedback = useCallback(async (feedbackId: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      
      await feedbackApi.deleteFeedback(feedbackId)
      toast.success('Đã xóa feedback!')
      return true
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      setError(errorMessage)
      toast.error(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // Get feedback detail
  const getFeedbackDetail = useCallback(async (feedbackId: string): Promise<FeedbackData | null> => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await feedbackApi.getFeedbackById(feedbackId)
      return response.data.result
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      setError(errorMessage)
      toast.error(errorMessage)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return {
    loading,
    error,
    updateFeedbackStatus,
    updateFeedback,
    addAdminMessage,
    assignFeedback,
    resolveFeedback,
    closeFeedback,
    deleteFeedback,
    getFeedbackDetail
  }
}

export default useAdminFeedback
