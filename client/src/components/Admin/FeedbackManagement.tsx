/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { 
  MessageCircle, 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  User, 
  Calendar,
  Tag,
  Send,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import { useFeedbacks } from '../../hooks/useFeedback'
import { useAdminFeedback } from '../../hooks/useAdminFeedback'
import feedbackApi, { 
  FeedbackData, 
  FeedbackStatus, 
  FeedbackPriority, 
  FeedbackCategory,
  GetFeedbacksQuery 
} from '../../apis/feedback.api'

// Status color mapping
const getStatusColor = (status: FeedbackStatus) => {
  switch (status) {
    case FeedbackStatus.Pending:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case FeedbackStatus.InProgress:
      return 'bg-blue-100 text-blue-800 border-blue-200'
    case FeedbackStatus.Resolved:
      return 'bg-green-100 text-green-800 border-green-200'
    case FeedbackStatus.Closed:
      return 'bg-gray-100 text-gray-800 border-gray-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

// Priority color mapping
const getPriorityColor = (priority: FeedbackPriority) => {
  switch (priority) {
    case FeedbackPriority.Low:
      return 'bg-green-100 text-green-800 border-green-200'
    case FeedbackPriority.Medium:
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case FeedbackPriority.High:
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case FeedbackPriority.Urgent:
      return 'bg-red-100 text-red-800 border-red-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

// Category labels
const getCategoryLabel = (category: FeedbackCategory) => {
  const labels = {
    [FeedbackCategory.TechnicalIssue]: 'Vấn đề kỹ thuật',
    [FeedbackCategory.FeatureRequest]: 'Yêu cầu tính năng',
    [FeedbackCategory.UserInterface]: 'Giao diện người dùng',
    [FeedbackCategory.Performance]: 'Hiệu suất',
    [FeedbackCategory.ContentSuggestion]: 'Đề xuất nội dung',
    [FeedbackCategory.SystemBug]: 'Lỗi hệ thống',
    [FeedbackCategory.Other]: 'Khác'
  }
  return labels[category] || category
}

// Status labels
const getStatusLabel = (status: FeedbackStatus) => {
  const labels = {
    [FeedbackStatus.Pending]: 'Đang chờ',
    [FeedbackStatus.InProgress]: 'Đang xử lý',
    [FeedbackStatus.Resolved]: 'Đã giải quyết',
    [FeedbackStatus.Closed]: 'Đã đóng'
  }
  return labels[status] || status
}

// Priority labels
const getPriorityLabel = (priority: FeedbackPriority) => {
  const labels = {
    [FeedbackPriority.Low]: 'Thấp',
    [FeedbackPriority.Medium]: 'Trung bình',
    [FeedbackPriority.High]: 'Cao',
    [FeedbackPriority.Urgent]: 'Khẩn cấp'
  }
  return labels[priority] || priority
}

const FeedbackManagement = () => {
  const [searchParams] = useSearchParams()
  
  // Get initial filters from URL parameters
  const getInitialFilters = (): GetFeedbacksQuery => {
    const initialFilters: GetFeedbacksQuery = {
      page: '1',
      limit: '10',
      sort_by: 'created_at',
      sort_order: 'desc'
    }
    
    // Apply URL parameters
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const feedback = searchParams.get('feedback')
    
    if (status) initialFilters.status = status as FeedbackStatus
    if (priority) initialFilters.priority = priority as FeedbackPriority
    if (category) initialFilters.category = category as FeedbackCategory
    if (search) initialFilters.search = search
    if (feedback) {
    
    }
    
    return initialFilters
  }

  // State for filters and search
  const [filters, setFilters] = useState<GetFeedbacksQuery>(getInitialFilters())
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')
  const [isSearching, setIsSearching] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackData | null>(null)
  const [showFeedbackDetail, setShowFeedbackDetail] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)

  // Custom hooks
  const { feedbacks, loading, error, pagination, refetch } = useFeedbacks(filters)
  const { resolveFeedback, closeFeedback } = useAdminFeedback()

  // Debounced search
  const debouncedSearch = useCallback(
    (searchTerm: string) => {
      const timeoutId = setTimeout(() => {
        setFilters(prev => ({
          ...prev,
          search: searchTerm || undefined,
          page: '1'
        }))
        setIsSearching(false)
      }, 500)

      return () => clearTimeout(timeoutId)
    },
    []
  )
  // Handle URL parameters changes
  useEffect(() => {
    const newFilters = getInitialFilters()
    setFilters(newFilters)
    setSearchInput(searchParams.get('search') || '')
  }, [searchParams])

  // Handle search input change
  useEffect(() => {
    if (searchInput.length >= 2 || searchInput.length === 0) {
      setIsSearching(true)
      const cleanup = debouncedSearch(searchInput)
      return cleanup
    }
  }, [searchInput, debouncedSearch])

  // Extract detailed error messages
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

  // Handle viewing feedback detail
  const handleViewFeedback = async (feedbackId: string) => {
    try {
      const response = await feedbackApi.getFeedbackById(feedbackId)
      setSelectedFeedback(response.data.result)
      setShowFeedbackDetail(true)
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  // Handle sending message
  const handleSendMessage = async () => {
    if (!selectedFeedback || !newMessage.trim()) return

    try {
      const response = await feedbackApi.addMessage(selectedFeedback._id, {
        message: newMessage.trim()
      })
      setSelectedFeedback(response.data.result)
      setNewMessage('')
      toast.success('Đã gửi phản hồi!')
      await refetch()
    } catch (err) {
      toast.error(extractErrorMessage(err))
    }
  }

  // Handle updating feedback status
  const handleUpdateStatus = async (feedbackId: string, status: FeedbackStatus) => {
    try {
      setIsUpdatingStatus(true)
      
      if (status === FeedbackStatus.Resolved) {
        await resolveFeedback(feedbackId)
      } else if (status === FeedbackStatus.Closed) {
        await closeFeedback(feedbackId)
      } else {
        await feedbackApi.updateFeedback(feedbackId, { status })
        toast.success('Đã cập nhật trạng thái!')
      }
      
      await refetch()
      if (selectedFeedback && selectedFeedback._id === feedbackId) {
        const response = await feedbackApi.getFeedbackById(feedbackId)
        setSelectedFeedback(response.data.result)
      }
    } catch (err) {
      toast.error(extractErrorMessage(err))
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  // Handle filter changes
  const handleFilterChange = (key: keyof GetFeedbacksQuery, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined,
      page: '1'
    }))
  }

  // Pagination
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page: page.toString() }))
  }

  // Get teacher name from feedback
  const getTeacherName = (feedback: FeedbackData) => {
    // Since we don't have teacher info in feedback object, we'll show teacher_id
    // In a real implementation, you might want to fetch teacher details
    return `Teacher ID: ${feedback.teacher_id}`
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
        <div className='flex items-center space-x-3'>
          <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center'>
            <MessageCircle className='w-5 h-5 text-white' />
          </div>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>Quản lý Feedback</h1>
            <p className='text-gray-600'>Xem và phản hồi feedback từ giáo viên</p>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-2xl p-6 shadow-lg'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4'>
          {/* Search */}
          <div className='relative'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
            <input
              type='text'
              placeholder='Tìm kiếm feedback...'
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className='w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
            />
            {isSearching && (
              <div className='absolute right-3 top-1/2 transform -translate-y-1/2'>
                <div className='w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin' />
              </div>
            )}
          </div>

          {/* Status Filter */}
          <select
            value={filters.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className='px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
          >
            <option value=''>Tất cả trạng thái</option>
            <option value={FeedbackStatus.Pending}>Đang chờ</option>
            <option value={FeedbackStatus.InProgress}>Đang xử lý</option>
            <option value={FeedbackStatus.Resolved}>Đã giải quyết</option>
            <option value={FeedbackStatus.Closed}>Đã đóng</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filters.priority || ''}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className='px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
          >
            <option value=''>Tất cả mức độ</option>
            <option value={FeedbackPriority.Low}>Thấp</option>
            <option value={FeedbackPriority.Medium}>Trung bình</option>
            <option value={FeedbackPriority.High}>Cao</option>
            <option value={FeedbackPriority.Urgent}>Khẩn cấp</option>
          </select>

          {/* Category Filter */}
          <select
            value={filters.category || ''}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className='px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
          >
            <option value=''>Tất cả danh mục</option>
            <option value={FeedbackCategory.TechnicalIssue}>Vấn đề kỹ thuật</option>
            <option value={FeedbackCategory.FeatureRequest}>Yêu cầu tính năng</option>
            <option value={FeedbackCategory.UserInterface}>Giao diện người dùng</option>
            <option value={FeedbackCategory.Performance}>Hiệu suất</option>
            <option value={FeedbackCategory.ContentSuggestion}>Đề xuất nội dung</option>
            <option value={FeedbackCategory.SystemBug}>Lỗi hệ thống</option>
            <option value={FeedbackCategory.Other}>Khác</option>
          </select>
        </div>

        {searchInput.length > 0 && searchInput.length < 2 && (
          <p className='text-sm text-gray-500 mt-2'>
            Nhập ít nhất 2 ký tự để tìm kiếm
          </p>
        )}
      </div>

      {/* Feedback List */}
      <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-2xl shadow-lg overflow-hidden'>
        {loading ? (
          <div className='flex items-center justify-center py-12'>
            <div className='w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin' />
            <span className='ml-3 text-gray-600'>Đang tải feedback...</span>
          </div>
        ) : error ? (
          <div className='flex items-center justify-center py-12'>
            <AlertTriangle className='w-8 h-8 text-red-500 mr-3' />
            <span className='text-red-600'>{error}</span>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-12'>
            <MessageCircle className='w-12 h-12 text-gray-400 mb-3' />
            <span className='text-gray-600'>Không có feedback nào</span>
          </div>
        ) : (
          <div className='divide-y divide-gray-200'>
            {feedbacks.map((feedback) => (
              <div key={feedback._id} className='p-6 hover:bg-gray-50/50 transition-colors'>
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <div className='flex items-center space-x-3 mb-2'>
                      <h3 className='text-lg font-semibold text-gray-900'>
                        {feedback.title}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(feedback.status)}`}>
                        {getStatusLabel(feedback.status)}
                      </span>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(feedback.priority)}`}>
                        {getPriorityLabel(feedback.priority)}
                      </span>
                    </div>
                    
                    <div className='flex items-center space-x-4 text-sm text-gray-600 mb-3'>
                      <div className='flex items-center space-x-1'>
                        <User className='w-4 h-4' />
                        <span>{getTeacherName(feedback)}</span>
                      </div>
                      <div className='flex items-center space-x-1'>
                        <Tag className='w-4 h-4' />
                        <span>{getCategoryLabel(feedback.category)}</span>
                      </div>
                      <div className='flex items-center space-x-1'>
                        <Calendar className='w-4 h-4' />
                        <span>{new Date(feedback.created_at).toLocaleDateString('vi-VN')}</span>
                      </div>
                      <div className='flex items-center space-x-1'>
                        <MessageCircle className='w-4 h-4' />
                        <span>{feedback.messages.length} tin nhắn</span>
                      </div>
                    </div>

                    {feedback.tags.length > 0 && (
                      <div className='flex flex-wrap gap-1 mb-3'>
                        {feedback.tags.map((tag, index) => (
                          <span
                            key={index}
                            className='px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full'
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Show first message preview */}
                    {feedback.messages.length > 0 && (
                      <div className='bg-gray-50 rounded-lg p-3 mb-3'>
                        <p className='text-sm text-gray-700 line-clamp-2'>
                          {feedback.messages[0].message}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className='flex items-center space-x-2 ml-4'>
                    {/* Status Update Buttons */}
                    {feedback.status !== FeedbackStatus.Resolved && feedback.status !== FeedbackStatus.Closed && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(feedback._id, FeedbackStatus.InProgress)}
                          disabled={isUpdatingStatus || feedback.status === FeedbackStatus.InProgress}
                          className='px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors disabled:opacity-50'
                        >
                          <Clock className='w-3 h-3 mr-1 inline' />
                          Đang xử lý
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(feedback._id, FeedbackStatus.Resolved)}
                          disabled={isUpdatingStatus}
                          className='px-3 py-1 text-xs bg-green-100 text-green-800 rounded-full hover:bg-green-200 transition-colors disabled:opacity-50'
                        >
                          <CheckCircle className='w-3 h-3 mr-1 inline' />
                          Giải quyết
                        </button>
                      </>
                    )}

                    {feedback.status === FeedbackStatus.Resolved && (
                      <button
                        onClick={() => handleUpdateStatus(feedback._id, FeedbackStatus.Closed)}
                        disabled={isUpdatingStatus}
                        className='px-3 py-1 text-xs bg-gray-100 text-gray-800 rounded-full hover:bg-gray-200 transition-colors disabled:opacity-50'
                      >
                        <XCircle className='w-3 h-3 mr-1 inline' />
                        Đóng
                      </button>
                    )}

                    <button
                      onClick={() => handleViewFeedback(feedback._id)}
                      className='px-3 py-1 text-xs bg-purple-100 text-purple-800 rounded-full hover:bg-purple-200 transition-colors'
                    >
                      <Eye className='w-3 h-3 mr-1 inline' />
                      Xem chi tiết
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && feedbacks.length > 0 && (
          <div className='flex items-center justify-between px-6 py-4 border-t border-gray-200'>
            <div className='text-sm text-gray-700'>
              Hiển thị {(pagination.page - 1) * pagination.limit + 1} đến{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} trong tổng số{' '}
              {pagination.total} feedback
            </div>
            <div className='flex items-center space-x-2'>
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className='px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
              >
                Trước
              </button>
              <span className='px-3 py-1 text-sm'>
                {pagination.page} / {pagination.total_pages}
              </span>
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.total_pages}
                className='px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50'
              >
                Tiếp
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Detail Modal */}
      {showFeedbackDetail && selectedFeedback && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden'>
            {/* Modal Header */}
            <div className='flex items-center justify-between p-6 border-b border-gray-200'>
              <div>
                <h2 className='text-xl font-bold text-gray-900'>{selectedFeedback.title}</h2>
                <div className='flex items-center space-x-2 mt-2'>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(selectedFeedback.status)}`}>
                    {getStatusLabel(selectedFeedback.status)}
                  </span>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(selectedFeedback.priority)}`}>
                    {getPriorityLabel(selectedFeedback.priority)}
                  </span>
                  <span className='px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full'>
                    {getCategoryLabel(selectedFeedback.category)}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowFeedbackDetail(false)}
                className='p-2 hover:bg-gray-100 rounded-lg transition-colors'
              >
                <X className='w-5 h-5' />
              </button>
            </div>

            {/* Modal Body */}
            <div className='flex flex-col h-[calc(90vh-140px)]'>
              {/* Messages */}
              <div className='flex-1 overflow-y-auto p-6 space-y-4'>
                {selectedFeedback.messages.map((message) => {
                  const isAdmin = message.sender_role === 'admin'
                  const isTeacher = message.sender_role === 'teacher' || 
                    (message.sender_role === null && message.sender_id === selectedFeedback.teacher_id)
                  
                  return (
                    <div
                      key={message._id}
                      className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] p-4 rounded-2xl ${
                          isAdmin
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <div className='flex items-center space-x-2 mb-2'>
                          <span className='text-sm font-medium'>
                            {isAdmin ? 'Admin' : isTeacher ? 'Giáo viên' : 'Người dùng'}
                          </span>
                          <span className={`text-xs ${isAdmin ? 'text-blue-100' : 'text-gray-500'}`}>
                            {new Date(message.created_at).toLocaleString('vi-VN')}
                          </span>
                        </div>
                        <p className='text-sm leading-relaxed'>{message.message}</p>
                      </div>
                    </div>
                  )
                })}
              </div>              {/* Message Input */}
              {selectedFeedback.status !== FeedbackStatus.Closed && (
                <div className='border-t border-gray-200 p-6'>
                  <div className='flex space-x-3'>
                    <div className='flex-1'>
                      <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder='Nhập phản hồi của bạn...'
                        className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none'
                        rows={3}
                      />
                    </div>
                    <div className='flex flex-col space-y-2'>
                      <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim()}
                        className='px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2'
                      >
                        <Send className='w-4 h-4' />
                        <span>Gửi</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default FeedbackManagement
