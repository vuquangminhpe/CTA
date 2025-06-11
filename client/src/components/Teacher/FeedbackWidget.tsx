import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { 
  MessageCircle, 
  Plus, 
  ArrowRight, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  XCircle
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import feedbackApi, { FeedbackData, FeedbackStatus } from '../../apis/feedback.api'


interface FeedbackWidgetProps {
  maxItems?: number
}

const FeedbackWidget: React.FC<FeedbackWidgetProps> = ({ maxItems = 5 }) => {
  const [feedbacks, setFeedbacks] = useState<FeedbackData[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    resolved: 0
  })
  const navigate = useNavigate()

  // Load recent feedbacks
  const loadRecentFeedbacks = async () => {
    try {
      setLoading(true)
      const response = await feedbackApi.getFeedbacks({
        limit: maxItems.toString(),
        sort_by: 'created_at',
        sort_order: 'desc'
      })
      setFeedbacks(response.data.result.feedbacks)
    } catch (error) {
      console.error('Error loading recent feedbacks:', error)
    } finally {
      setLoading(false)
    }
  }

  // Load feedback stats
  const loadStats = async () => {
    try {
      const response = await feedbackApi.getFeedbackStats()
      setStats(response.data.result)
    } catch (error) {
      console.error('Error loading feedback stats:', error)
    }
  }

  useEffect(() => {
    loadRecentFeedbacks()
    loadStats()
  }, [maxItems])

  // Get status display
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

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - date.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 1) return 'Hôm qua'
    if (diffDays < 7) return `${diffDays} ngày trước`
    return date.toLocaleDateString('vi-VN')
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-medium flex items-center">
            <MessageCircle className="w-4 h-4 mr-2" />
            Feedback System
          </CardTitle>
          <CardDescription>
            Quản lý feedback và góp ý của bạn
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => navigate('/teacher/feedback')}
        >
          <Plus className="w-4 h-4 mr-1" />
          Tạo mới
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-xs text-blue-600">Tổng số</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{stats.in_progress}</div>
            <div className="text-xs text-yellow-600">Đang xử lý</div>
          </div>
        </div>

        {/* Recent Feedbacks */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Feedback gần đây</h4>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/teacher/feedback')}
            >
              Xem tất cả
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">Chưa có feedback nào</p>
              <Button 
                variant="ghost" 
                size="sm" 
                className="mt-2"
                onClick={() => navigate('/teacher/feedback')}
              >
                Tạo feedback đầu tiên
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {feedbacks.slice(0, maxItems).map((feedback) => {
                const statusDisplay = getStatusDisplay(feedback.status)
                const StatusIcon = statusDisplay.icon

                return (
                  <div
                    key={feedback._id}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate('/teacher/feedback')}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h5 className="text-sm font-medium line-clamp-1 flex-1 mr-2">
                        {feedback.title}
                      </h5>
                      <Badge className={`${statusDisplay.color} text-xs`}>
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusDisplay.text}
                      </Badge>
                    </div>
                    
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                      {feedback.messages[0]?.message}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span>{formatDate(feedback.created_at)}</span>
                      <span>{feedback.messages.length} tin nhắn</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t">
          <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/teacher/feedback')}
            >
              <MessageCircle className="w-4 h-4 mr-1" />
              Xem tất cả
            </Button>
            <Button 
              size="sm"
              onClick={() => navigate('/teacher/feedback')}
            >
              <Plus className="w-4 h-4 mr-1" />
              Tạo mới
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default FeedbackWidget
