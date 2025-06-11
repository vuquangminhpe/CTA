/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  MessageCircle, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  BarChart3,
  RefreshCw
} from 'lucide-react'
import { toast } from 'sonner'
import { useFeedbackStats } from '../../hooks/useFeedback'
import feedbackApi, { FeedbackData, FeedbackStatus, FeedbackPriority } from '../../apis/feedback.api'

interface DashboardStats {
  totalFeedbacks: number
  pendingFeedbacks: number
  inProgressFeedbacks: number
  resolvedFeedbacks: number
  closedFeedbacks: number
  urgentFeedbacks: number
  recentFeedbacks: FeedbackData[]
}

const AdminFeedbackDashboard = () => {
  const navigate = useNavigate()
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalFeedbacks: 0,
    pendingFeedbacks: 0,
    inProgressFeedbacks: 0,
    resolvedFeedbacks: 0,
    closedFeedbacks: 0,
    urgentFeedbacks: 0,
    recentFeedbacks: []
  })
  const [loading, setLoading] = useState(true)
  const [topTags, setTopTags] = useState<any[]>([])

  // Custom hook for feedback stats
  const { stats, loading: statsLoading, refetch: refetchStats } = useFeedbackStats()  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true)

      // Fetch recent feedbacks and top tags with error handling
      const [recentResponse, tagsResponse] = await Promise.allSettled([
        feedbackApi.getRecentFeedbacks(10),
        feedbackApi.getTopTags(10)
      ])

      if (recentResponse.status === 'fulfilled') {
        setDashboardStats(prev => ({
          ...prev,
          recentFeedbacks: recentResponse.value.data.result
        }))
      } else {
        console.error('Failed to fetch recent feedbacks:', recentResponse.reason)
        setDashboardStats(prev => ({
          ...prev,
          recentFeedbacks: []
        }))
      }

      if (tagsResponse.status === 'fulfilled') {
        setTopTags(tagsResponse.value.data.result)
      } else {
        console.error('Failed to fetch top tags:', tagsResponse.reason)
        setTopTags([])
      }
    } catch (err) {
      console.error('Error in fetchDashboardData:', err)
      toast.error('Không thể tải một số dữ liệu dashboard')
    } finally {
      setLoading(false)
    }
  }

  // Update dashboard stats when stats change
  useEffect(() => {
    if (stats) {
      setDashboardStats(prev => ({
        ...prev,
        totalFeedbacks: stats.total,
        pendingFeedbacks: stats.pending,
        inProgressFeedbacks: stats.in_progress,
        resolvedFeedbacks: stats.resolved,
        closedFeedbacks: stats.closed,
        urgentFeedbacks: stats.urgent_priority
      }))
    }
  }, [stats])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const handleRefresh = async () => {
    await Promise.all([
      fetchDashboardData(),
      refetchStats()
    ])
    toast.success('Đã làm mới dữ liệu')
  }

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

  const getPriorityColor = (priority: FeedbackPriority) => {
    switch (priority) {
      case FeedbackPriority.Low:
        return 'text-green-600'
      case FeedbackPriority.Medium:
        return 'text-yellow-600'
      case FeedbackPriority.High:
        return 'text-orange-600'
      case FeedbackPriority.Urgent:
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  if (loading && !stats) {
    return (
      <div className='flex items-center justify-center min-h-[400px]'>
        <div className='w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin' />
        <span className='ml-3 text-gray-600'>Đang tải dashboard...</span>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
        <div className='flex items-center space-x-3'>
          <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center'>
            <BarChart3 className='w-6 h-6 text-white' />
          </div>
          <div>
            <h1 className='text-3xl font-bold text-gray-900'>Feedback Dashboard</h1>
            <p className='text-gray-600'>Tổng quan về hệ thống feedback</p>
          </div>
        </div>
        
        <div className='flex items-center space-x-3'>
          <button
            onClick={handleRefresh}
            disabled={loading || statsLoading}
            className='inline-flex items-center px-4 py-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50'
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${(loading || statsLoading) ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
          <button
            onClick={() => navigate('/admin/feedback-management')}
            className='inline-flex items-center px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors'
          >
            <MessageCircle className='w-4 h-4 mr-2' />
            Quản lý Feedback
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-2xl p-6 shadow-lg'>
          <div className='flex items-center'>
            <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center'>
              <MessageCircle className='w-6 h-6 text-white' />
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600'>Tổng Feedback</p>
              <p className='text-2xl font-bold text-gray-900'>{dashboardStats.totalFeedbacks}</p>
            </div>
          </div>
        </div>

        <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-2xl p-6 shadow-lg'>
          <div className='flex items-center'>
            <div className='w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-400 rounded-2xl flex items-center justify-center'>
              <Clock className='w-6 h-6 text-white' />
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600'>Đang chờ xử lý</p>
              <p className='text-2xl font-bold text-gray-900'>{dashboardStats.pendingFeedbacks}</p>
            </div>
          </div>
        </div>

        <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-2xl p-6 shadow-lg'>
          <div className='flex items-center'>
            <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-400 rounded-2xl flex items-center justify-center'>
              <TrendingUp className='w-6 h-6 text-white' />
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600'>Đang xử lý</p>
              <p className='text-2xl font-bold text-gray-900'>{dashboardStats.inProgressFeedbacks}</p>
            </div>
          </div>
        </div>

        <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-2xl p-6 shadow-lg'>
          <div className='flex items-center'>
            <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-400 rounded-2xl flex items-center justify-center'>
              <CheckCircle className='w-6 h-6 text-white' />
            </div>
            <div className='ml-4'>
              <p className='text-sm font-medium text-gray-600'>Đã giải quyết</p>
              <p className='text-2xl font-bold text-gray-900'>{dashboardStats.resolvedFeedbacks}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-2xl p-6 shadow-lg'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>Thống kê theo mức độ ưu tiên</h3>
          <div className='space-y-3'>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-600'>Thấp</span>
              <span className='text-sm font-medium text-green-600'>{stats?.low_priority || 0}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-600'>Trung bình</span>
              <span className='text-sm font-medium text-yellow-600'>{stats?.medium_priority || 0}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-600'>Cao</span>
              <span className='text-sm font-medium text-orange-600'>{stats?.high_priority || 0}</span>
            </div>
            <div className='flex items-center justify-between'>
              <span className='text-sm text-gray-600'>Khẩn cấp</span>
              <span className='text-sm font-medium text-red-600'>{stats?.urgent_priority || 0}</span>
            </div>
          </div>
        </div>

        <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-2xl p-6 shadow-lg'>
          <h3 className='text-lg font-semibold text-gray-900 mb-4'>Top Tags</h3>
          <div className='space-y-2'>
            {topTags.length > 0 ? (
              topTags.slice(0, 8).map((tag, index) => (
                <div key={index} className='flex items-center justify-between'>
                  <span className='text-sm text-gray-600'>#{tag._id}</span>
                  <span className='text-sm font-medium text-gray-900'>{tag.count}</span>
                </div>
              ))
            ) : (
              <p className='text-sm text-gray-500'>Chưa có tags nào</p>
            )}
          </div>
        </div>
      </div>



      {/* Quick Actions */}
      <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-2xl p-6 shadow-lg'>
        <h3 className='text-lg font-semibold text-gray-900 mb-4'>Hành động nhanh</h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <button
            onClick={() => navigate('/admin/feedback-management?status=pending')}
            className='flex items-center justify-center space-x-2 p-4 bg-yellow-50 border border-yellow-200 rounded-xl hover:bg-yellow-100 transition-colors'
          >
            <AlertTriangle className='w-5 h-5 text-yellow-600' />
            <span className='text-yellow-800 font-medium'>Feedback chờ xử lý</span>
          </button>
          
          <button
            onClick={() => navigate('/admin/feedback-management?priority=urgent')}
            className='flex items-center justify-center space-x-2 p-4 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors'
          >
            <AlertTriangle className='w-5 h-5 text-red-600' />
            <span className='text-red-800 font-medium'>Feedback khẩn cấp</span>
          </button>
          
          <button
            onClick={() => navigate('/admin/feedback-management?status=in_progress')}
            className='flex items-center justify-center space-x-2 p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors'
          >
            <Clock className='w-5 h-5 text-blue-600' />
            <span className='text-blue-800 font-medium'>Feedback đang xử lý</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AdminFeedbackDashboard
