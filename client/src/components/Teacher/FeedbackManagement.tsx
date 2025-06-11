import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Label } from '../ui/label'
import { ScrollArea } from '../ui/scroll-area'
import { Separator } from '../ui/separator'
import { 
  MessageCircle, 
  Plus, 
  Filter, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  Send,
  Tag
} from 'lucide-react'
import feedbackApi, { 
  FeedbackData, 
  FeedbackStatus, 
  FeedbackPriority, 
  FeedbackCategory,
  CreateFeedbackBody,
  GetFeedbacksQuery,
  AddMessageBody
} from '../../apis/feedback.api'
import { toast } from 'sonner'

interface FeedbackManagementProps {
  teacherId?: string
}

const FeedbackManagement: React.FC<FeedbackManagementProps> = ({ teacherId: _ }) => {
  const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackData | null>(null)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 0
  })

  // Get user info from localStorage
  const getUserInfo = () => {
    try {
      const profile = localStorage.getItem('profile')
      return profile ? JSON.parse(profile) : null
    } catch (error) {
      console.error('Error parsing profile from localStorage:', error)
      return null
    }
  }

  const userInfo = getUserInfo()
  // Filters
  const [filters, setFilters] = useState<GetFeedbacksQuery>({
    page: '1',
    limit: '10',
    sort_by: 'created_at',
    sort_order: 'desc'
  })
  // Separate search input state for debouncing
  const [searchInput, setSearchInput] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  // Debounce function
  const debounce = useCallback((func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout
    return (...args: any[]) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func.apply(null, args), delay)
    }
  }, [])
  // Debounced search function
  const debouncedSearch = useCallback(
    debounce((searchValue: string) => {
      setIsSearching(true)
      setFilters(prev => ({ 
        ...prev, 
        search: searchValue.length >= 2 ? searchValue : undefined,
        page: '1' 
      }))
    }, 500),
    []
  )
  // Create feedback form
  const [createForm, setCreateForm] = useState<CreateFeedbackBody>({
    title: '',
    message: '',
    category: FeedbackCategory.Other,
    priority: FeedbackPriority.Medium,
    tags: []
  })

  // Add message form
  const [newMessage, setNewMessage] = useState('')
  // Handle search input change
  useEffect(() => {
    debouncedSearch(searchInput)
  }, [searchInput, debouncedSearch])

  // Load feedbacks
  const loadFeedbacks = async () => {
    try {
      setLoading(true)
      const response = await feedbackApi.getFeedbacks(filters)
      setFeedbacks(response.data.result.feedbacks)
      setPagination(response.data.result.pagination)
    } catch (error: any) {
      // Enhanced error handling
      let errorMessage = 'Không thể tải danh sách feedback'
      
      if (error?.data?.errors) {
        // Extract specific field errors
        const fieldErrors = Object.values(error.data.errors).flat() as any[]
        if (fieldErrors.length > 0) {
          errorMessage = fieldErrors[0].msg || fieldErrors[0].message || errorMessage
        }
      } else if (error?.data?.message) {
        errorMessage = error.data.message
      }
      
      toast.error(errorMessage)
      console.error('Error loading feedbacks:', error)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    loadFeedbacks()
  }, [filters])

  useEffect(() => {
    // Reset searching state when loading completes
    if (!loading) {
      setIsSearching(false)
    }
  }, [loading])
  // Create new feedback
  const handleCreateFeedback = async () => {
    try {
      if (!createForm.title.trim() || !createForm.message.trim()) {
        toast.error('Vui lòng điền đầy đủ thông tin')
        return
      }

      await feedbackApi.createFeedback(createForm)
      toast.success('Tạo feedback thành công!');
      setCreateForm({
        title: '',
        message: '',
        category: FeedbackCategory.Other,
        priority: FeedbackPriority.Medium,
        tags: []
      })
      setIsCreateDialogOpen(false)
      loadFeedbacks()
    } catch (error: any) {
      // Enhanced error handling
      let errorMessage = 'Không thể tạo feedback'
      
      if (error?.data?.errors) {
        const fieldErrors = Object.values(error.data.errors).flat() as any[]
        if (fieldErrors.length > 0) {
          errorMessage = fieldErrors[0].msg || fieldErrors[0].message || errorMessage
        }
      } else if (error?.data?.message) {
        errorMessage = error.data.message
      }
      
      toast.error(errorMessage)
      console.error('Error creating feedback:', error)
    }
  }
  // Add message to feedback
  const handleAddMessage = async () => {
    if (!selectedFeedback || !newMessage.trim()) return

    try {
      const messageData: AddMessageBody = {
        message: newMessage
      }
      
      await feedbackApi.addMessage(selectedFeedback._id, messageData)
      toast.success('Đã thêm tin nhắn!')
      setNewMessage('')
      
      // Reload feedback detail
      const response = await feedbackApi.getFeedbackById(selectedFeedback._id)
      setSelectedFeedback(response.data.result)
      loadFeedbacks()
    } catch (error: any) {
      // Enhanced error handling
      let errorMessage = 'Không thể gửi tin nhắn'
      
      if (error?.data?.errors) {
        const fieldErrors = Object.values(error.data.errors).flat() as any[]
        if (fieldErrors.length > 0) {
          errorMessage = fieldErrors[0].msg || fieldErrors[0].message || errorMessage
        }
      } else if (error?.data?.message) {
        errorMessage = error.data.message
      }
      
      toast.error(errorMessage)
      console.error('Error adding message:', error)
    }
  }

  // Get status color and icon
  const getStatusDisplay = (status: FeedbackStatus) => {
    switch (status) {
      case FeedbackStatus.Pending:
        return { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Chờ xử lý' }
      case FeedbackStatus.InProgress:
        return { color: 'bg-blue-100 text-blue-800', icon: AlertCircle, text: 'Đang xử lý' }
      case FeedbackStatus.Resolved:
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Đã giải quyết' }
      case FeedbackStatus.Closed:
        return { color: 'bg-gray-100 text-gray-800', icon: XCircle, text: 'Đã đóng' }
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: Clock, text: 'Không xác định' }
    }
  }

  // Get priority color
  const getPriorityColor = (priority: FeedbackPriority) => {
    switch (priority) {
      case FeedbackPriority.Low:
        return 'bg-green-100 text-green-800'
      case FeedbackPriority.Medium:
        return 'bg-yellow-100 text-yellow-800'
      case FeedbackPriority.High:
        return 'bg-orange-100 text-orange-800'
      case FeedbackPriority.Urgent:
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN')
  }

  return (
    <div className="space-y-6">      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">📢 Hệ thống Feedback</h2>
          <p className="text-gray-600">Gửi feedback và trao đổi với quản trị viên</p>
          <p className="text-sm text-blue-600 mt-1">
            💡 Tất cả feedback sẽ được quản trị viên xem xét và phản hồi nhanh chóng
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Tạo Feedback
            </Button>
          </DialogTrigger>          <DialogContent className="max-w-2xl bg-white border shadow-xl">            <DialogHeader className="border-b pb-4">
              <DialogTitle className="text-xl font-semibold text-gray-900">✨ Tạo Feedback Mới</DialogTitle>
              <DialogDescription className="text-gray-600 mt-1">
                Gửi feedback, góp ý hoặc báo cáo vấn đề. Quản trị viên sẽ xem xét và phản hồi sớm nhất.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium text-gray-700">
                  Tiêu đề <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  placeholder="Nhập tiêu đề feedback..."
                  value={createForm.title}
                  onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                  className="w-full bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium text-gray-700">
                    Danh mục
                  </Label>
                  <Select
                    value={createForm.category}
                    onValueChange={(value) => setCreateForm({ ...createForm, category: value as FeedbackCategory })}
                  >
                    <SelectTrigger className="w-full bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>                    <SelectContent className="bg-white border shadow-lg">
                      <SelectItem value={FeedbackCategory.TechnicalIssue} className="hover:bg-blue-50">
                        🔧 Vấn đề kỹ thuật
                      </SelectItem>
                      <SelectItem value={FeedbackCategory.UserInterface} className="hover:bg-blue-50">
                        🎨 Giao diện người dùng
                      </SelectItem>
                      <SelectItem value={FeedbackCategory.ContentSuggestion} className="hover:bg-blue-50">
                        📝 Gợi ý nội dung
                      </SelectItem>
                      <SelectItem value={FeedbackCategory.FeatureRequest} className="hover:bg-blue-50">
                        ✨ Yêu cầu tính năng
                      </SelectItem>
                      <SelectItem value={FeedbackCategory.SystemBug} className="hover:bg-blue-50">
                        🐛 Lỗi hệ thống
                      </SelectItem>
                      <SelectItem value={FeedbackCategory.Performance} className="hover:bg-blue-50">
                        ⚡ Hiệu suất
                      </SelectItem>
                      <SelectItem value={FeedbackCategory.Other} className="hover:bg-blue-50">
                        💬 Khác
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority" className="text-sm font-medium text-gray-700">
                    Độ ưu tiên
                  </Label>
                  <Select
                    value={createForm.priority}
                    onValueChange={(value) => setCreateForm({ ...createForm, priority: value as FeedbackPriority })}
                  >
                    <SelectTrigger className="w-full bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                      <SelectValue placeholder="Chọn độ ưu tiên" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border shadow-lg">
                      <SelectItem value={FeedbackPriority.Low} className="hover:bg-green-50">
                        🟢 Thấp
                      </SelectItem>
                      <SelectItem value={FeedbackPriority.Medium} className="hover:bg-yellow-50">
                        🟡 Trung bình
                      </SelectItem>
                      <SelectItem value={FeedbackPriority.High} className="hover:bg-orange-50">
                        🟠 Cao
                      </SelectItem>
                      <SelectItem value={FeedbackPriority.Urgent} className="hover:bg-red-50">
                        🔴 Khẩn cấp
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message" className="text-sm font-medium text-gray-700">
                  Nội dung <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="message"
                  placeholder="Mô tả chi tiết vấn đề hoặc góp ý của bạn..."
                  rows={5}
                  value={createForm.message}
                  onChange={(e) => setCreateForm({ ...createForm, message: e.target.value })}
                  className="w-full bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags" className="text-sm font-medium text-gray-700">
                  Tags (tách bằng dấu phẩy)
                </Label>
                <Input
                  id="tags"
                  placeholder="ví dụ: thi-online, lỗi, khẩn-cấp"
                  value={createForm.tags?.join(', ') || ''}
                  onChange={(e) => setCreateForm({ 
                    ...createForm, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag)
                  })}
                  className="w-full bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500">
                  Nhập các từ khóa để phân loại feedback, tách bằng dấu phẩy
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  className="px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Hủy
                </Button>
                <Button 
                  onClick={handleCreateFeedback}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={!createForm.title.trim() || !createForm.message.trim()}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Tạo Feedback
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>      {/* Filters */}
      <Card className="bg-white border shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Bộ lọc tìm kiếm</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">              <div className="space-y-2">
                <Label htmlFor="search" className="text-sm font-medium text-gray-700">
                  Tìm kiếm {isSearching && <span className="text-xs text-blue-600">(đang tìm...)</span>}
                </Label>
                <div className="relative">
                  <Input
                    id="search"
                    placeholder="Tìm kiếm theo tiêu đề hoặc nội dung... (tối thiểu 2 ký tự)"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    className="w-full bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  />
                  {isSearching && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
                {searchInput.length > 0 && searchInput.length < 2 && (
                  <p className="text-xs text-orange-600">
                    Vui lòng nhập ít nhất 2 ký tự để tìm kiếm
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status" className="text-sm font-medium text-gray-700">
                  Trạng thái
                </Label>
                <Select
                  value={filters.status || 'all'}
                  onValueChange={(value) => setFilters({ 
                    ...filters, 
                    status: value === 'all' ? undefined : value as FeedbackStatus,
                    page: '1'
                  })}
                >
                  <SelectTrigger className="w-full bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-lg">
                    <SelectItem value="all" className="hover:bg-gray-50">Tất cả</SelectItem>
                    <SelectItem value={FeedbackStatus.Pending} className="hover:bg-yellow-50">
                      🟡 Chờ xử lý
                    </SelectItem>
                    <SelectItem value={FeedbackStatus.InProgress} className="hover:bg-blue-50">
                      🔵 Đang xử lý
                    </SelectItem>
                    <SelectItem value={FeedbackStatus.Resolved} className="hover:bg-green-50">
                      🟢 Đã giải quyết
                    </SelectItem>
                    <SelectItem value={FeedbackStatus.Closed} className="hover:bg-gray-50">
                      ⚪ Đã đóng
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority" className="text-sm font-medium text-gray-700">
                  Độ ưu tiên
                </Label>
                <Select
                  value={filters.priority || 'all'}
                  onValueChange={(value) => setFilters({ 
                    ...filters, 
                    priority: value === 'all' ? undefined : value as FeedbackPriority,
                    page: '1'
                  })}
                >
                  <SelectTrigger className="w-full bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                    <SelectValue placeholder="Chọn độ ưu tiên" />
                  </SelectTrigger>
                  <SelectContent className="bg-white border shadow-lg">
                    <SelectItem value="all" className="hover:bg-gray-50">Tất cả</SelectItem>
                    <SelectItem value={FeedbackPriority.Low} className="hover:bg-green-50">
                      🟢 Thấp
                    </SelectItem>
                    <SelectItem value={FeedbackPriority.Medium} className="hover:bg-yellow-50">
                      🟡 Trung bình
                    </SelectItem>
                    <SelectItem value={FeedbackPriority.High} className="hover:bg-orange-50">
                      🟠 Cao
                    </SelectItem>
                    <SelectItem value={FeedbackPriority.Urgent} className="hover:bg-red-50">
                      🔴 Khẩn cấp
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Hành động</Label>                <Button 
                  variant="outline"
                  onClick={() => {
                    setSearchInput('')
                    setFilters({
                      page: '1',
                      limit: '10',
                      sort_by: 'created_at',
                      sort_order: 'desc'
                    })
                  }}
                  className="w-full border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <Filter className="w-4 h-4 mr-2" />
                  Xóa bộ lọc
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedback List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : feedbacks.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-500">Chưa có feedback nào</p>
            </CardContent>
          </Card>
        ) : (
          feedbacks.map((feedback) => {
            const statusDisplay = getStatusDisplay(feedback.status)
            const StatusIcon = statusDisplay.icon

            return (
              <Card key={feedback._id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-2">{feedback.title}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {feedback.messages[0]?.message}
                      </p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Tạo: {formatDate(feedback.created_at)}</span>
                        <span>•</span>
                        <span>{feedback.messages.length} tin nhắn</span>
                        {feedback.updated_at !== feedback.created_at && (
                          <>
                            <span>•</span>
                            <span>Cập nhật: {formatDate(feedback.updated_at)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end space-y-2">
                      <div className="flex space-x-2">
                        <Badge className={statusDisplay.color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusDisplay.text}
                        </Badge>
                        <Badge className={getPriorityColor(feedback.priority)}>
                          {feedback.priority}
                        </Badge>
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"                        onClick={async () => {
                          try {
                            const response = await feedbackApi.getFeedbackById(feedback._id)
                            setSelectedFeedback(response.data.result)
                            setIsDetailDialogOpen(true)
                          } catch (error: any) {
                            // Enhanced error handling
                            let errorMessage = 'Không thể tải chi tiết feedback'
                            
                            if (error?.data?.errors) {
                              const fieldErrors = Object.values(error.data.errors).flat() as any[]
                              if (fieldErrors.length > 0) {
                                errorMessage = fieldErrors[0].msg || fieldErrors[0].message || errorMessage
                              }
                            } else if (error?.data?.message) {
                              errorMessage = error.data.message
                            }
                            
                            toast.error(errorMessage)
                          }
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Xem chi tiết
                      </Button>
                    </div>
                  </div>

                  {feedback.tags.length > 0 && (
                    <div className="flex items-center space-x-2">
                      <Tag className="w-4 h-4 text-gray-400" />
                      <div className="flex space-x-1">
                        {feedback.tags.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {pagination.total_pages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            variant="outline"
            disabled={pagination.page === 1}
            onClick={() => setFilters({ ...filters, page: (pagination.page - 1).toString() })}
          >
            Trước
          </Button>
          
          <span className="flex items-center px-4 py-2 text-sm">
            Trang {pagination.page} / {pagination.total_pages}
          </span>
          
          <Button
            variant="outline"
            disabled={pagination.page === pagination.total_pages}
            onClick={() => setFilters({ ...filters, page: (pagination.page + 1).toString() })}
          >
            Sau
          </Button>
        </div>
      )}      {/* Feedback Detail Dialog */}
     <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] bg-white border shadow-xl rounded-lg top-[5%] translate-y-0">
          {selectedFeedback && (
            <>
              <DialogHeader className="border-b pb-4 bg-white pr-12">
                <DialogTitle className="flex items-start justify-between text-xl font-semibold text-gray-900">
                  <span className="flex-1 pr-4">📋 {selectedFeedback.title}</span>
                  <div className="flex flex-wrap gap-2 min-w-0">
                    {(() => {
                      const statusDisplay = getStatusDisplay(selectedFeedback.status)
                      const StatusIcon = statusDisplay.icon
                      return (
                        <Badge className={`${statusDisplay.color} px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusDisplay.text}
                        </Badge>
                      )
                    })()}
                    <Badge className={`${getPriorityColor(selectedFeedback.priority)} px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap`}>
                      {selectedFeedback.priority}
                    </Badge>
                  </div>
                </DialogTitle>
                <DialogDescription className="text-gray-600 mt-2">
                  📅 Tạo: {formatDate(selectedFeedback.created_at)} • 
                  🔄 Cập nhật: {formatDate(selectedFeedback.updated_at)}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6 bg-white overflow-y-auto px-1">
                {/* Tags */}
                {selectedFeedback.tags.length > 0 && (
                  <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg border">
                    <Tag className="w-4 h-4 text-gray-400" />
                    <div className="flex space-x-2">
                      {selectedFeedback.tags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-md">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 flex items-center">
                    💬 Lịch sử tin nhắn ({selectedFeedback.messages.length} tin nhắn)
                  </h4>
                  <ScrollArea className="h-[350px] w-full border rounded-lg p-4 bg-gray-50">
                    <div className="space-y-4">                      {selectedFeedback.messages.map((message) => {
                        // Xác định role dựa trên sender_id và teacher_id
                        const isTeacher = message.sender_role === 'teacher' || 
                                        (message.sender_role === null && message.sender_id === selectedFeedback.teacher_id)
                        
                        return (
                          <div
                            key={message._id}
                            className={`p-4 rounded-lg border ${
                              isTeacher
                                ? 'bg-blue-50 ml-4 border-blue-200 border-l-4 border-l-blue-500' 
                                : 'bg-white mr-4 border-green-200 border-l-4 border-l-green-500 shadow-sm'
                            }`}
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex flex-col gap-1">
                                <Badge 
                                  variant={isTeacher ? 'default' : 'secondary'}
                                  className={`text-xs px-2 py-1 rounded-md w-fit ${
                                    isTeacher
                                      ? 'bg-blue-100 text-blue-800' 
                                      : 'bg-green-100 text-green-800'
                                  }`}
                                >
                                  {isTeacher ? '👨‍🏫 Giáo viên' : '👨‍💼 Quản trị viên'}
                                </Badge>
                                <span className="text-xs font-medium text-gray-700">
                                  {isTeacher
                                    ? (userInfo?.name || 'Giáo viên') 
                                    : 'Quản trị viên'
                                  }
                                </span>
                              </div>
                              <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                                {formatDate(message.created_at)}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap text-gray-700 leading-relaxed">{message.message}</p>
                          </div>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </div>

                {/* Add Message */}
                {selectedFeedback.status !== FeedbackStatus.Closed && (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg border sticky bottom-0">
                    <Separator />
                    <h4 className="text-sm font-medium text-gray-700">✍️ Thêm tin nhắn phản hồi</h4>
                    <div className="flex gap-3 items-end">
                      <Textarea
                        placeholder="Nhập tin nhắn phản hồi..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        rows={3}
                        className="flex-1 bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-md resize-none"
                      />
                      <Button
                        onClick={handleAddMessage}
                        disabled={!newMessage.trim()}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md shadow-md h-fit"
                      >
                        <Send className="w-4 h-4 mr-1" />
                        Gửi
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default FeedbackManagement
