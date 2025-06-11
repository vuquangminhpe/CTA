import { useState, useEffect, useCallback } from 'react'
import feedbackApi, { 
  FeedbackData, 
  GetFeedbacksQuery, 
  FeedbackStatsResponse,
  CreateFeedbackBody,
  AddMessageBody,
  UpdateFeedbackBody
} from '../apis/feedback.api'
import { toast } from 'sonner'

interface UseFeedbacksResult {
  feedbacks: FeedbackData[]
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
  refetch: () => Promise<void>
  createFeedback: (data: CreateFeedbackBody) => Promise<string | null>
  updateFeedback: (id: string, data: UpdateFeedbackBody) => Promise<FeedbackData | null>
  deleteFeedback: (id: string) => Promise<boolean>
  addMessage: (id: string, data: AddMessageBody) => Promise<FeedbackData | null>
}

interface UseFeedbackStatsResult {
  stats: FeedbackStatsResponse | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export const useFeedbacks = (query?: GetFeedbacksQuery): UseFeedbacksResult => {
  const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 0
  })

  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await feedbackApi.getFeedbacks(query)
      setFeedbacks(response.data.result.feedbacks)
      setPagination(response.data.result.pagination)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải danh sách feedback'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    fetchFeedbacks()
  }, [fetchFeedbacks])

  const createFeedback = async (data: CreateFeedbackBody): Promise<string | null> => {
    try {
      const response = await feedbackApi.createFeedback(data)
      toast.success('Tạo feedback thành công!')
      await fetchFeedbacks() // Refresh list
      return response.data.result.feedback_id
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tạo feedback'
      toast.error(errorMessage)
      return null
    }
  }

  const updateFeedback = async (id: string, data: UpdateFeedbackBody): Promise<FeedbackData | null> => {
    try {
      const response = await feedbackApi.updateFeedback(id, data)
      toast.success('Cập nhật feedback thành công!')
      await fetchFeedbacks() // Refresh list
      return response.data.result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể cập nhật feedback'
      toast.error(errorMessage)
      return null
    }
  }

  const deleteFeedback = async (id: string): Promise<boolean> => {
    try {
      await feedbackApi.deleteFeedback(id)
      toast.success('Xóa feedback thành công!')
      await fetchFeedbacks() // Refresh list
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể xóa feedback'
      toast.error(errorMessage)
      return false
    }
  }

  const addMessage = async (id: string, data: AddMessageBody): Promise<FeedbackData | null> => {
    try {
      const response = await feedbackApi.addMessage(id, data)
      toast.success('Đã gửi tin nhắn!')
      await fetchFeedbacks() // Refresh list
      return response.data.result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể gửi tin nhắn'
      toast.error(errorMessage)
      return null
    }
  }

  return {
    feedbacks,
    loading,
    error,
    pagination,
    refetch: fetchFeedbacks,
    createFeedback,
    updateFeedback,
    deleteFeedback,
    addMessage
  }
}

export const useFeedbackStats = (query?: Parameters<typeof feedbackApi.getFeedbackStats>[0]): UseFeedbackStatsResult => {
  const [stats, setStats] = useState<FeedbackStatsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await feedbackApi.getFeedbackStats(query)
      setStats(response.data.result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải thống kê feedback'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [query])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  }
}

export const useFeedbackDetail = (feedbackId: string | null) => {
  const [feedback, setFeedback] = useState<FeedbackData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFeedback = useCallback(async () => {
    if (!feedbackId) return

    try {
      setLoading(true)
      setError(null)
      const response = await feedbackApi.getFeedbackById(feedbackId)
      setFeedback(response.data.result)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể tải chi tiết feedback'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [feedbackId])

  useEffect(() => {
    fetchFeedback()
  }, [fetchFeedback])

  const addMessage = async (data: AddMessageBody): Promise<boolean> => {
    if (!feedbackId) return false

    try {
      const response = await feedbackApi.addMessage(feedbackId, data)
      setFeedback(response.data.result)
      toast.success('Đã gửi tin nhắn!')
      return true
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Không thể gửi tin nhắn'
      toast.error(errorMessage)
      return false
    }
  }

  return {
    feedback,
    loading,
    error,
    refetch: fetchFeedback,
    addMessage
  }
}

// Hook for admin functions
export const useAdminFeedback = () => {
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

  const assignFeedback = async (feedbackId: string, adminId: string): Promise<boolean> => {
    try {
      await feedbackApi.assignFeedback(feedbackId, { admin_id: adminId })
      toast.success('Đã phân công feedback!')
      return true
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      toast.error(errorMessage)
      return false
    }
  }

  const resolveFeedback = async (feedbackId: string): Promise<boolean> => {
    try {
      await feedbackApi.resolveFeedback(feedbackId)
      toast.success('Đã giải quyết feedback!')
      return true
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      toast.error(errorMessage)
      return false
    }
  }

  const closeFeedback = async (feedbackId: string): Promise<boolean> => {
    try {
      await feedbackApi.closeFeedback(feedbackId)
      toast.success('Đã đóng feedback!')
      return true
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      toast.error(errorMessage)
      return false
    }
  }

  const updateFeedbackStatus = async (feedbackId: string, status: any): Promise<boolean> => {
    try {
      await feedbackApi.updateFeedback(feedbackId, { status })
      toast.success('Đã cập nhật trạng thái!')
      return true
    } catch (err) {
      const errorMessage = extractErrorMessage(err)
      toast.error(errorMessage)
      return false
    }
  }

  return {
    assignFeedback,
    resolveFeedback,
    closeFeedback,
    updateFeedbackStatus
  }
}
