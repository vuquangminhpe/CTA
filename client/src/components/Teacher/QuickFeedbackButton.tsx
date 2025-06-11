import React, { useState } from 'react'
import { Button } from '../ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog'
import { Label } from '../ui/label'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { MessageCircle, Send } from 'lucide-react'
import feedbackApi, { CreateFeedbackBody, FeedbackCategory, FeedbackPriority } from '../../apis/feedback.api'
import { toast } from 'sonner'

interface QuickFeedbackButtonProps {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
  onSuccess?: () => void
}

const QuickFeedbackButton: React.FC<QuickFeedbackButtonProps> = ({ 
  variant = 'outline', 
  size = 'default',
  className = '',
  onSuccess 
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<CreateFeedbackBody>({
    title: '',
    message: '',
    category: FeedbackCategory.Other,
    priority: FeedbackPriority.Medium,
    tags: []
  })

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.message.trim()) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }

    try {
      setLoading(true)
      await feedbackApi.createFeedback(form)
      toast.success('Gửi feedback thành công!')
      
      // Reset form
      setForm({
        title: '',
        message: '',
        category: FeedbackCategory.Other,
        priority: FeedbackPriority.Medium,
        tags: []
      })
      
      setIsOpen(false)
      onSuccess?.()
    } catch (error) {
      toast.error('Không thể gửi feedback')
      console.error('Error creating feedback:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className}>
          <MessageCircle className="w-4 h-4 mr-2" />
          Gửi Feedback
        </Button>
      </DialogTrigger>
        <DialogContent className="max-w-lg bg-white border shadow-xl">
        <DialogHeader className="border-b pb-4">
          <DialogTitle className="text-xl font-semibold text-gray-900">Gửi Feedback Nhanh</DialogTitle>
          <DialogDescription className="text-gray-600 mt-1">
            Gửi góp ý, báo cáo lỗi hoặc yêu cầu hỗ trợ
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-4">
          <div className="space-y-2">
            <Label htmlFor="quick-title" className="text-sm font-medium text-gray-700">
              Tiêu đề <span className="text-red-500">*</span>
            </Label>
            <Input
              id="quick-title"
              placeholder="Tóm tắt vấn đề hoặc góp ý..."
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Loại</Label>
              <Select
                value={form.category}
                onValueChange={(value) => setForm({ ...form, category: value as FeedbackCategory })}
              >
                <SelectTrigger className="w-full bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Chọn loại" />
                </SelectTrigger>                <SelectContent className="bg-white border shadow-lg">
                  <SelectItem value={FeedbackCategory.TechnicalIssue} className="hover:bg-blue-50">🔧 Vấn đề kỹ thuật</SelectItem>
                  <SelectItem value={FeedbackCategory.UserInterface} className="hover:bg-blue-50">🎨 Giao diện người dùng</SelectItem>
                  <SelectItem value={FeedbackCategory.ContentSuggestion} className="hover:bg-blue-50">📝 Gợi ý nội dung</SelectItem>
                  <SelectItem value={FeedbackCategory.FeatureRequest} className="hover:bg-blue-50">✨ Yêu cầu tính năng</SelectItem>
                  <SelectItem value={FeedbackCategory.SystemBug} className="hover:bg-blue-50">🐛 Lỗi hệ thống</SelectItem>
                  <SelectItem value={FeedbackCategory.Performance} className="hover:bg-blue-50">⚡ Hiệu suất</SelectItem>
                  <SelectItem value={FeedbackCategory.Other} className="hover:bg-blue-50">💬 Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-gray-700">Mức độ</Label>
              <Select
                value={form.priority}
                onValueChange={(value) => setForm({ ...form, priority: value as FeedbackPriority })}
              >
                <SelectTrigger className="w-full bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                  <SelectValue placeholder="Chọn mức độ" />
                </SelectTrigger>
                <SelectContent className="bg-white border shadow-lg">
                  <SelectItem value={FeedbackPriority.Low} className="hover:bg-green-50">🟢 Thấp</SelectItem>
                  <SelectItem value={FeedbackPriority.Medium} className="hover:bg-yellow-50">🟡 Trung bình</SelectItem>
                  <SelectItem value={FeedbackPriority.High} className="hover:bg-orange-50">🟠 Cao</SelectItem>
                  <SelectItem value={FeedbackPriority.Urgent} className="hover:bg-red-50">🔴 Khẩn cấp</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-message" className="text-sm font-medium text-gray-700">
              Chi tiết <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="quick-message"
              placeholder="Mô tả chi tiết vấn đề, góp ý hoặc yêu cầu của bạn..."
              rows={4}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full bg-white border-gray-300 focus:border-blue-500 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <Button 
              variant="outline" 
              onClick={() => setIsOpen(false)}
              disabled={loading}
              className="px-4 py-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Hủy
            </Button>
            <Button 
              onClick={handleSubmit}
              disabled={loading || !form.title.trim() || !form.message.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Gửi Feedback
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default QuickFeedbackButton
