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
  Tag,
  Sparkles,
  Users,
  TrendingUp,
  Search,
  History
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
      setFilters((prev) => ({
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
      let errorMessage = 'Không thể tải danh sách feedback'

      if (error?.data?.errors) {
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
      toast.success('Tạo feedback thành công!')
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

      const response = await feedbackApi.getFeedbackById(selectedFeedback._id)
      setSelectedFeedback(response.data.result)
      loadFeedbacks()
    } catch (error: any) {
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
        return {
          color: 'bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-700 border-amber-200',
          icon: Clock,
          text: 'Chờ xử lý',
          pulse: 'animate-pulse'
        }
      case FeedbackStatus.InProgress:
        return {
          color: 'bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border-blue-200',
          icon: AlertCircle,
          text: 'Đang xử lý',
          pulse: ''
        }
      case FeedbackStatus.Resolved:
        return {
          color: 'bg-gradient-to-r from-emerald-50 to-green-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle,
          text: 'Đã giải quyết',
          pulse: ''
        }
      case FeedbackStatus.Closed:
        return {
          color: 'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-600 border-gray-200',
          icon: XCircle,
          text: 'Đã đóng',
          pulse: ''
        }
      default:
        return {
          color: 'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-600 border-gray-200',
          icon: Clock,
          text: 'Không xác định',
          pulse: ''
        }
    }
  }

  // Get priority color
  const getPriorityColor = (priority: FeedbackPriority) => {
    switch (priority) {
      case FeedbackPriority.Low:
        return 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200'
      case FeedbackPriority.Medium:
        return 'bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-700 border-yellow-200'
      case FeedbackPriority.High:
        return 'bg-gradient-to-r from-orange-50 to-red-50 text-orange-700 border-orange-200'
      case FeedbackPriority.Urgent:
        return 'bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border-red-200 animate-pulse'
      default:
        return 'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-600 border-gray-200'
    }
  }

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN')
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50'>
      <div className='container mx-auto px-4 py-8 space-y-8'>
        {/* Header */}
        <div className='relative'>
          <div className='absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-600 to-blue-600 rounded-3xl opacity-10'></div>
          <div className='relative bg-white/80 backdrop-blur-sm border border-blue-100 rounded-3xl p-8 shadow-xl'>
            <div className='flex justify-between items-center'>
              <div className='space-y-3'>
                <div className='flex items-center space-x-3'>
                  <div className='p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl shadow-lg'>
                    <MessageCircle className='w-8 h-8 text-white' />
                  </div>
                  <div>
                    <h1 className='text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent'>
                      Hệ thống Feedback
                    </h1>
                    <p className='text-slate-600 text-lg'>Gửi feedback và trao đổi với quản trị viên</p>
                  </div>
                </div>
                <div className='flex items-center space-x-2 p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-100'>
                  <Sparkles className='w-5 h-5 text-blue-500' />
                  <p className='text-blue-700 font-medium'>
                    Tất cả feedback sẽ được quản trị viên xem xét và phản hồi nhanh chóng
                  </p>
                </div>
              </div>

              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <div className='flex items-center flex-col gap-5'>
                    <Button className='bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105'>
                      <Plus className='w-5 h-5 mr-2' />
                      Tạo Feedback
                    </Button>
                    <Button
                      onClick={() => window.history.back()}
                      className='bg-gradient-to-r mt-3 from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105'
                    >
                      <History className='w-5 h-5 mr-2' />
                      Quay lại trang
                    </Button>
                  </div>
                </DialogTrigger>

                <DialogContent className='max-w-3xl bg-white border-0 shadow-2xl rounded-3xl'>
                  <DialogHeader className='border-b border-blue-100 pb-6'>
                    <DialogTitle className='text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent flex items-center'>
                      <Sparkles className='w-6 h-6 mr-3 text-blue-500' />
                      Tạo Feedback Mới
                    </DialogTitle>
                    <DialogDescription className='text-slate-600 text-base mt-2'>
                      Gửi feedback, góp ý hoặc báo cáo vấn đề. Quản trị viên sẽ xem xét và phản hồi sớm nhất.
                    </DialogDescription>
                  </DialogHeader>

                  <div className='space-y-6 pt-6'>
                    <div className='space-y-3'>
                      <Label htmlFor='title' className='text-base font-semibold text-slate-700'>
                        Tiêu đề <span className='text-red-500'>*</span>
                      </Label>
                      <Input
                        id='title'
                        placeholder='Nhập tiêu đề feedback...'
                        value={createForm.title}
                        onChange={(e) => setCreateForm({ ...createForm, title: e.target.value })}
                        className='w-full h-12 bg-white border-2 border-blue-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 rounded-xl transition-all duration-300'
                      />
                    </div>

                    <div className='grid grid-cols-2 gap-6'>
                      <div className='space-y-3'>
                        <Label className='text-base font-semibold text-slate-700'>Danh mục</Label>
                        <Select
                          value={createForm.category}
                          onValueChange={(value) =>
                            setCreateForm({ ...createForm, category: value as FeedbackCategory })
                          }
                        >
                          <SelectTrigger className='w-full h-12 bg-white border-2 border-blue-100 focus:border-blue-400 rounded-xl'>
                            <SelectValue placeholder='Chọn danh mục' />
                          </SelectTrigger>
                          <SelectContent className='bg-white border-0 shadow-xl rounded-2xl'>
                            <SelectItem
                              value={FeedbackCategory.TechnicalIssue}
                              className='hover:bg-blue-50 rounded-xl m-1'
                            >
                              🔧 Vấn đề kỹ thuật
                            </SelectItem>
                            <SelectItem
                              value={FeedbackCategory.UserInterface}
                              className='hover:bg-blue-50 rounded-xl m-1'
                            >
                              🎨 Giao diện người dùng
                            </SelectItem>
                            <SelectItem
                              value={FeedbackCategory.ContentSuggestion}
                              className='hover:bg-blue-50 rounded-xl m-1'
                            >
                              📝 Gợi ý nội dung
                            </SelectItem>
                            <SelectItem
                              value={FeedbackCategory.FeatureRequest}
                              className='hover:bg-blue-50 rounded-xl m-1'
                            >
                              ✨ Yêu cầu tính năng
                            </SelectItem>
                            <SelectItem value={FeedbackCategory.SystemBug} className='hover:bg-blue-50 rounded-xl m-1'>
                              🐛 Lỗi hệ thống
                            </SelectItem>
                            <SelectItem
                              value={FeedbackCategory.Performance}
                              className='hover:bg-blue-50 rounded-xl m-1'
                            >
                              ⚡ Hiệu suất
                            </SelectItem>
                            <SelectItem value={FeedbackCategory.Other} className='hover:bg-blue-50 rounded-xl m-1'>
                              💬 Khác
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className='space-y-3'>
                        <Label className='text-base font-semibold text-slate-700'>Độ ưu tiên</Label>
                        <Select
                          value={createForm.priority}
                          onValueChange={(value) =>
                            setCreateForm({ ...createForm, priority: value as FeedbackPriority })
                          }
                        >
                          <SelectTrigger className='w-full h-12 bg-white border-2 border-blue-100 focus:border-blue-400 rounded-xl'>
                            <SelectValue placeholder='Chọn độ ưu tiên' />
                          </SelectTrigger>
                          <SelectContent className='bg-white border-0 shadow-xl rounded-2xl'>
                            <SelectItem value={FeedbackPriority.Low} className='hover:bg-green-50 rounded-xl m-1'>
                              🟢 Thấp
                            </SelectItem>
                            <SelectItem value={FeedbackPriority.Medium} className='hover:bg-yellow-50 rounded-xl m-1'>
                              🟡 Trung bình
                            </SelectItem>
                            <SelectItem value={FeedbackPriority.High} className='hover:bg-orange-50 rounded-xl m-1'>
                              🟠 Cao
                            </SelectItem>
                            <SelectItem value={FeedbackPriority.Urgent} className='hover:bg-red-50 rounded-xl m-1'>
                              🔴 Khẩn cấp
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className='space-y-3'>
                      <Label htmlFor='message' className='text-base font-semibold text-slate-700'>
                        Nội dung <span className='text-red-500'>*</span>
                      </Label>
                      <Textarea
                        id='message'
                        placeholder='Mô tả chi tiết vấn đề hoặc góp ý của bạn...'
                        rows={6}
                        value={createForm.message}
                        onChange={(e) => setCreateForm({ ...createForm, message: e.target.value })}
                        className='w-full bg-white border-2 border-blue-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 rounded-xl resize-none transition-all duration-300'
                      />
                    </div>

                    <div className='space-y-3'>
                      <Label htmlFor='tags' className='text-base font-semibold text-slate-700'>
                        Tags
                      </Label>
                      <Input
                        id='tags'
                        placeholder='ví dụ: thi-online, lỗi, khẩn-cấp'
                        value={createForm.tags?.join(', ') || ''}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            tags: e.target.value
                              .split(',')
                              .map((tag) => tag.trim())
                              .filter((tag) => tag)
                          })
                        }
                        className='w-full h-12 bg-white border-2 border-blue-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 rounded-xl transition-all duration-300'
                      />
                      <p className='text-sm text-slate-500'>
                        Nhập các từ khóa để phân loại feedback, tách bằng dấu phẩy
                      </p>
                    </div>

                    <div className='flex justify-end space-x-4 pt-6 border-t border-blue-100'>
                      <Button
                        variant='outline'
                        onClick={() => setIsCreateDialogOpen(false)}
                        className='px-6 py-3 border-2 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-all duration-300'
                      >
                        Hủy
                      </Button>
                      <Button
                        onClick={handleCreateFeedback}
                        className='px-8 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105'
                        disabled={!createForm.title.trim() || !createForm.message.trim()}
                      >
                        <Plus className='w-5 h-5 mr-2' />
                        Tạo Feedback
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className='bg-white/80 backdrop-blur-sm border border-blue-100 shadow-xl rounded-3xl overflow-hidden'>
          <CardContent className='p-8'>
            <div className='space-y-6'>
              <div className='flex items-center space-x-3'>
                <div className='p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl'>
                  <Filter className='w-5 h-5 text-white' />
                </div>
                <h3 className='text-xl font-bold text-slate-800'>Bộ lọc tìm kiếm</h3>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-4 gap-6'>
                <div className='space-y-3'>
                  <Label htmlFor='search' className='text-sm font-semibold text-slate-700 flex items-center'>
                    <Search className='w-4 h-4 mr-2' />
                    Tìm kiếm {isSearching && <span className='text-xs text-blue-600 ml-2'>(đang tìm...)</span>}
                  </Label>
                  <div className='relative'>
                    <Input
                      id='search'
                      placeholder='Tìm kiếm theo tiêu đề hoặc nội dung...'
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      className='w-full h-12 bg-white border-2 border-blue-100 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 rounded-xl pl-4 pr-12 transition-all duration-300'
                    />
                    {isSearching && (
                      <div className='absolute right-4 top-1/2 transform -translate-y-1/2'>
                        <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600'></div>
                      </div>
                    )}
                  </div>
                  {searchInput.length > 0 && searchInput.length < 2 && (
                    <p className='text-xs text-orange-600 bg-orange-50 p-2 rounded-lg'>
                      Vui lòng nhập ít nhất 2 ký tự để tìm kiếm
                    </p>
                  )}
                </div>

                <div className='space-y-3'>
                  <Label className='text-sm font-semibold text-slate-700'>Trạng thái</Label>
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={(value) =>
                      setFilters({
                        ...filters,
                        status: value === 'all' ? undefined : (value as FeedbackStatus),
                        page: '1'
                      })
                    }
                  >
                    <SelectTrigger className='w-full h-12 bg-white border-2 border-blue-100 focus:border-blue-400 rounded-xl'>
                      <SelectValue placeholder='Chọn trạng thái' />
                    </SelectTrigger>
                    <SelectContent className='bg-white border-0 shadow-xl rounded-2xl'>
                      <SelectItem value='all' className='hover:bg-slate-50 rounded-xl m-1'>
                        Tất cả
                      </SelectItem>
                      <SelectItem value={FeedbackStatus.Pending} className='hover:bg-yellow-50 rounded-xl m-1'>
                        🟡 Chờ xử lý
                      </SelectItem>
                      <SelectItem value={FeedbackStatus.InProgress} className='hover:bg-blue-50 rounded-xl m-1'>
                        🔵 Đang xử lý
                      </SelectItem>
                      <SelectItem value={FeedbackStatus.Resolved} className='hover:bg-green-50 rounded-xl m-1'>
                        🟢 Đã giải quyết
                      </SelectItem>
                      <SelectItem value={FeedbackStatus.Closed} className='hover:bg-gray-50 rounded-xl m-1'>
                        ⚪ Đã đóng
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-3'>
                  <Label className='text-sm font-semibold text-slate-700'>Độ ưu tiên</Label>
                  <Select
                    value={filters.priority || 'all'}
                    onValueChange={(value) =>
                      setFilters({
                        ...filters,
                        priority: value === 'all' ? undefined : (value as FeedbackPriority),
                        page: '1'
                      })
                    }
                  >
                    <SelectTrigger className='w-full h-12 bg-white border-2 border-blue-100 focus:border-blue-400 rounded-xl'>
                      <SelectValue placeholder='Chọn độ ưu tiên' />
                    </SelectTrigger>
                    <SelectContent className='bg-white border-0 shadow-xl rounded-2xl'>
                      <SelectItem value='all' className='hover:bg-slate-50 rounded-xl m-1'>
                        Tất cả
                      </SelectItem>
                      <SelectItem value={FeedbackPriority.Low} className='hover:bg-green-50 rounded-xl m-1'>
                        🟢 Thấp
                      </SelectItem>
                      <SelectItem value={FeedbackPriority.Medium} className='hover:bg-yellow-50 rounded-xl m-1'>
                        🟡 Trung bình
                      </SelectItem>
                      <SelectItem value={FeedbackPriority.High} className='hover:bg-orange-50 rounded-xl m-1'>
                        🟠 Cao
                      </SelectItem>
                      <SelectItem value={FeedbackPriority.Urgent} className='hover:bg-red-50 rounded-xl m-1'>
                        🔴 Khẩn cấp
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-3'>
                  <Label className='text-sm font-semibold text-slate-700'>Hành động</Label>
                  <Button
                    variant='outline'
                    onClick={() => {
                      setSearchInput('')
                      setFilters({
                        page: '1',
                        limit: '10',
                        sort_by: 'created_at',
                        sort_order: 'desc'
                      })
                    }}
                    className='w-full h-12 border-2 border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl transition-all duration-300'
                  >
                    <Filter className='w-4 h-4 mr-2' />
                    Xóa bộ lọc
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
          <Card className='bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-blue-600 text-sm font-medium'>Tổng Feedback</p>
                  <p className='text-2xl font-bold text-blue-800'>{pagination.total}</p>
                </div>
                <div className='p-3 bg-blue-500 rounded-xl'>
                  <MessageCircle className='w-6 h-6 text-white' />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-emerald-600 text-sm font-medium'>Đã giải quyết</p>
                  <p className='text-2xl font-bold text-emerald-800'>
                    {feedbacks.filter((f) => f.status === FeedbackStatus.Resolved).length}
                  </p>
                </div>
                <div className='p-3 bg-emerald-500 rounded-xl'>
                  <CheckCircle className='w-6 h-6 text-white' />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className='bg-gradient-to-br from-amber-50 to-yellow-50 border-amber-200 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300'>
            <CardContent className='p-6'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-amber-600 text-sm font-medium'>Đang xử lý</p>
                  <p className='text-2xl font-bold text-amber-800'>
                    {
                      feedbacks.filter(
                        (f) => f.status === FeedbackStatus.Pending || f.status === FeedbackStatus.InProgress
                      ).length
                    }
                  </p>
                </div>
                <div className='p-3 bg-amber-500 rounded-xl'>
                  <TrendingUp className='w-6 h-6 text-white' />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Feedback List */}
        <div className='space-y-6'>
          {loading ? (
            <div className='flex flex-col items-center justify-center py-16'>
              <div className='animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4'></div>
              <p className='text-slate-600 font-medium'>Đang tải dữ liệu...</p>
            </div>
          ) : feedbacks.length === 0 ? (
            <Card className='bg-white/80 backdrop-blur-sm border border-blue-100 rounded-3xl shadow-xl'>
              <CardContent className='text-center py-16'>
                <div className='p-4 bg-gradient-to-r from-blue-100 to-cyan-100 rounded-full w-20 h-20 mx-auto mb-6'>
                  <MessageCircle className='w-12 h-12 text-blue-500 mx-auto mt-2' />
                </div>
                <h3 className='text-xl font-semibold text-slate-800 mb-2'>Chưa có feedback nào</h3>
                <p className='text-slate-600'>Hãy tạo feedback đầu tiên để bắt đầu trao đổi</p>
              </CardContent>
            </Card>
          ) : (
            feedbacks.map((feedback) => {
              const statusDisplay = getStatusDisplay(feedback.status)
              const StatusIcon = statusDisplay.icon

              return (
                <Card
                  key={feedback._id}
                  className='bg-white/80 backdrop-blur-sm border border-blue-100 rounded-3xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1'
                >
                  <CardContent className='p-8'>
                    <div className='flex justify-between items-start mb-6'>
                      <div className='flex-1 space-y-4'>
                        <div className='flex items-start space-x-4'>
                          <div className='p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl shadow-lg'>
                            <MessageCircle className='w-6 h-6 text-white' />
                          </div>
                          <div className='flex-1'>
                            <h3 className='text-xl font-bold text-slate-800 mb-2'>{feedback.title}</h3>
                            <p className='text-slate-600 leading-relaxed line-clamp-2'>
                              {feedback.messages[0]?.message}
                            </p>
                          </div>
                        </div>

                        <div className='flex items-center space-x-6 text-sm text-slate-500'>
                          <div className='flex items-center space-x-2'>
                            <Clock className='w-4 h-4' />
                            <span>Tạo: {formatDate(feedback.created_at)}</span>
                          </div>
                          <div className='flex items-center space-x-2'>
                            <Users className='w-4 h-4' />
                            <span>{feedback.messages.length} tin nhắn</span>
                          </div>
                          {feedback.updated_at !== feedback.created_at && (
                            <div className='flex items-center space-x-2'>
                              <TrendingUp className='w-4 h-4' />
                              <span>Cập nhật: {formatDate(feedback.updated_at)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className='flex flex-col items-end space-y-4 ml-6'>
                        <div className='flex space-x-3'>
                          <Badge
                            className={`${statusDisplay.color} border px-4 py-2 rounded-full text-sm font-medium ${statusDisplay.pulse}`}
                          >
                            <StatusIcon className='w-4 h-4 mr-2' />
                            {statusDisplay.text}
                          </Badge>
                          <Badge
                            className={`${getPriorityColor(feedback.priority)} border px-4 py-2 rounded-full text-sm font-medium`}
                          >
                            {feedback.priority}
                          </Badge>
                        </div>

                        <Button
                          variant='outline'
                          size='sm'
                          onClick={async () => {
                            try {
                              const response = await feedbackApi.getFeedbackById(feedback._id)
                              setSelectedFeedback(response.data.result)
                              setIsDetailDialogOpen(true)
                            } catch (error: any) {
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
                          className='border-2 border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 rounded-xl px-6 py-2 transition-all duration-300'
                        >
                          <Eye className='w-4 h-4 mr-2' />
                          Xem chi tiết
                        </Button>
                      </div>
                    </div>

                    {feedback.tags.length > 0 && (
                      <div className='flex items-center space-x-3 pt-4 border-t border-blue-100'>
                        <div className='p-2 bg-blue-100 rounded-xl'>
                          <Tag className='w-4 h-4 text-blue-600' />
                        </div>
                        <div className='flex flex-wrap gap-2'>
                          {feedback.tags.map((tag, index) => (
                            <Badge
                              key={index}
                              className='bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full text-xs'
                            >
                              #{tag}
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
          <div className='flex justify-center items-center space-x-4'>
            <Button
              variant='outline'
              disabled={pagination.page === 1}
              onClick={() => setFilters({ ...filters, page: (pagination.page - 1).toString() })}
              className='border-2 border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl px-6 py-3 transition-all duration-300'
            >
              Trước
            </Button>

            <div className='flex items-center px-6 py-3 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl'>
              <span className='text-blue-700 font-medium'>
                Trang {pagination.page} / {pagination.total_pages}
              </span>
            </div>

            <Button
              variant='outline'
              disabled={pagination.page === pagination.total_pages}
              onClick={() => setFilters({ ...filters, page: (pagination.page + 1).toString() })}
              className='border-2 border-blue-200 text-blue-600 hover:bg-blue-50 rounded-xl px-6 py-3 transition-all duration-300'
            >
              Sau
            </Button>
          </div>
        )}

        {/* Feedback Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className='max-w-5xl max-h-[90vh] bg-white border-0 shadow-2xl rounded-3xl top-[5%] translate-y-0'>
            {selectedFeedback && (
              <>
                <DialogHeader className='border-b border-blue-100 pb-6 bg-white pr-12'>
                  <DialogTitle className='flex items-start justify-between text-2xl font-bold text-slate-800'>
                    <div className='flex items-start space-x-4 flex-1 pr-4'>
                      <div className='p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl shadow-lg'>
                        <MessageCircle className='w-6 h-6 text-white' />
                      </div>
                      <span className='flex-1'>{selectedFeedback.title}</span>
                    </div>
                    <div className='flex flex-wrap gap-3 min-w-0'>
                      {(() => {
                        const statusDisplay = getStatusDisplay(selectedFeedback.status)
                        const StatusIcon = statusDisplay.icon
                        return (
                          <Badge
                            className={`${statusDisplay.color} border px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${statusDisplay.pulse}`}
                          >
                            <StatusIcon className='w-4 h-4 mr-2' />
                            {statusDisplay.text}
                          </Badge>
                        )
                      })()}
                      <Badge
                        className={`${getPriorityColor(selectedFeedback.priority)} border px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap`}
                      >
                        {selectedFeedback.priority}
                      </Badge>
                    </div>
                  </DialogTitle>
                  <DialogDescription className='text-slate-600 mt-3 text-base'>
                    📅 Tạo: {formatDate(selectedFeedback.created_at)} • 🔄 Cập nhật:{' '}
                    {formatDate(selectedFeedback.updated_at)}
                  </DialogDescription>
                </DialogHeader>

                <div className='space-y-6 bg-white overflow-y-auto px-1 max-h-[60vh]'>
                  {/* Tags */}
                  {selectedFeedback.tags.length > 0 && (
                    <div className='flex items-center space-x-3 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border border-blue-100'>
                      <div className='p-2 bg-blue-500 rounded-xl'>
                        <Tag className='w-5 h-5 text-white' />
                      </div>
                      <div className='flex flex-wrap gap-2'>
                        {selectedFeedback.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            className='bg-white text-blue-700 border border-blue-200 px-3 py-2 rounded-xl text-sm font-medium'
                          >
                            #{tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Messages */}
                  <div className='space-y-4'>
                    <div className='flex items-center space-x-3'>
                      <div className='p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl'>
                        <MessageCircle className='w-5 h-5 text-white' />
                      </div>
                      <h4 className='text-lg font-bold text-slate-800'>
                        Lịch sử tin nhắn ({selectedFeedback.messages.length} tin nhắn)
                      </h4>
                    </div>

                    <ScrollArea className='h-[400px] w-full border-2 border-blue-100 rounded-2xl p-6 bg-gradient-to-br from-slate-50 to-blue-50'>
                      <div className='space-y-6'>
                        {selectedFeedback.messages.map((message) => {
                          const isTeacher =
                            message.sender_role === 'teacher' ||
                            (message.sender_role === null && message.sender_id === selectedFeedback.teacher_id)

                          return (
                            <div
                              key={message._id}
                              className={`p-6 rounded-2xl border-2 shadow-lg transition-all duration-300 hover:shadow-xl ${
                                isTeacher
                                  ? 'bg-gradient-to-r from-blue-50 to-cyan-50 ml-8 border-blue-200 border-l-4 border-l-blue-500'
                                  : 'bg-white mr-8 border-emerald-200 border-l-4 border-l-emerald-500'
                              }`}
                            >
                              <div className='flex justify-between items-start mb-4'>
                                <div className='flex flex-col gap-2'>
                                  <Badge
                                    className={`text-sm px-3 py-2 rounded-xl w-fit font-medium ${
                                      isTeacher
                                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    }`}
                                  >
                                    {isTeacher ? '👨‍🏫 Giáo viên' : '👨‍💼 Quản trị viên'}
                                  </Badge>
                                  <span className='text-sm font-semibold text-slate-700'>
                                    {isTeacher ? userInfo?.name || 'Giáo viên' : 'Quản trị viên'}
                                  </span>
                                </div>
                                <span className='text-sm text-slate-500 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm'>
                                  {formatDate(message.created_at)}
                                </span>
                              </div>
                              <p className='text-base whitespace-pre-wrap text-slate-700 leading-relaxed'>
                                {message.message}
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    </ScrollArea>
                  </div>

                  {/* Add Message */}
                  {selectedFeedback.status !== FeedbackStatus.Closed && (
                    <div className='space-y-4 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl border-2 border-blue-100 sticky bottom-0'>
                      <Separator className='bg-blue-200' />
                      <div className='flex items-center space-x-3'>
                        <div className='p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl'>
                          <Send className='w-5 h-5 text-white' />
                        </div>
                        <h4 className='text-lg font-bold text-slate-800'>Thêm tin nhắn phản hồi</h4>
                      </div>
                      <div className='flex gap-4 items-end'>
                        <Textarea
                          placeholder='Nhập tin nhắn phản hồi...'
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          rows={4}
                          className='flex-1 bg-white border-2 border-blue-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-100 rounded-2xl resize-none transition-all duration-300'
                        />
                        <Button
                          onClick={handleAddMessage}
                          disabled={!newMessage.trim()}
                          className='bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105'
                        >
                          <Send className='w-5 h-5 mr-2' />
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
    </div>
  )
}

export default FeedbackManagement
