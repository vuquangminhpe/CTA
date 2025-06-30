/* eslint-disable @typescript-eslint/no-explicit-any */
// client/src/components/Teacher/CommentSelector.tsx
import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, X, Plus, MessageSquare, Sparkles } from 'lucide-react'
import { getSmartComments, getStudentCategory } from '../../constants/comments'
import gradesApi from '../../apis/grades.api'

interface CommentSelectorProps {
  studentScore: number | null
  commentType: 'STRENGTH' | 'WEAKNESS' | 'PROGRESS'
  selectedComments: string[]
  onChange: (comments: string[]) => void
  filters: any
  singleSelect?: boolean
}

const CommentSelector: React.FC<CommentSelectorProps> = ({
  studentScore,
  commentType,
  selectedComments,
  onChange,
  singleSelect = false
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [customComment, setCustomComment] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)

  // Lấy nhận xét thông minh dựa trên điểm số
  const smartComments = studentScore !== null ? getSmartComments(studentScore, commentType) : []

  // Lấy thêm nhận xét từ API nếu cần
  const { data: apiComments } = useQuery({
    queryKey: ['comments', commentType, studentScore],
    queryFn: () => {
      const category = getStudentCategory(studentScore!)
      return gradesApi.getComments({
        type: commentType,
        category,
        grade_level: 'middle_school' // Có thể điều chỉnh dựa trên filters
      })
    },
    enabled: studentScore !== null,
    staleTime: 30 * 60 * 1000 // 30 phút
  })

  // Kết hợp nhận xét từ constants và API
  const availableComments = [...smartComments, ...(apiComments?.data?.result || [])].filter(
    (comment, index, self) => index === self.findIndex((c) => c.content === comment.content)
  ) // Loại bỏ duplicate

  const handleCommentToggle = (commentContent: string) => {
    if (singleSelect) {
      onChange([commentContent])
      setIsOpen(false)
    } else {
      const isSelected = selectedComments.includes(commentContent)
      if (isSelected) {
        onChange(selectedComments.filter((c) => c !== commentContent))
      } else {
        onChange([...selectedComments, commentContent])
      }
    }
  }

  const handleAddCustomComment = () => {
    if (customComment.trim()) {
      if (singleSelect) {
        onChange([customComment.trim()])
      } else {
        onChange([...selectedComments, customComment.trim()])
      }
      setCustomComment('')
      setShowCustomInput(false)
      setIsOpen(false)
    }
  }

  const handleRemoveComment = (commentToRemove: string) => {
    onChange(selectedComments.filter((c) => c !== commentToRemove))
  }

  const getTypeColor = () => {
    switch (commentType) {
      case 'STRENGTH':
        return 'green'
      case 'WEAKNESS':
        return 'red'
      case 'PROGRESS':
        return 'blue'
      default:
        return 'gray'
    }
  }

  const getTypeIcon = () => {
    switch (commentType) {
      case 'STRENGTH':
        return '💪'
      case 'WEAKNESS':
        return '⚠️'
      case 'PROGRESS':
        return '📈'
      default:
        return '💬'
    }
  }

  const getScoreLabel = () => {
    if (studentScore === null) return 'Chưa có điểm'
    if (studentScore >= 9.0) return 'Xuất sắc'
    if (studentScore >= 8.0) return 'Giỏi'
    if (studentScore >= 7.0) return 'Khá'
    if (studentScore >= 5.0) return 'Trung bình'
    if (studentScore >= 3.5) return 'Yếu'
    return 'Kém'
  }

  return (
    <div className='relative'>
      {/* Hiển thị nhận xét đã chọn */}
      <div className='min-h-[60px] mb-2'>
        {selectedComments.length > 0 ? (
          <div className='space-y-1'>
            {selectedComments.map((comment, index) => (
              <div
                key={index}
                className={`inline-flex items-center bg-${getTypeColor()}-50 text-${getTypeColor()}-700 text-xs px-2 py-1 rounded-lg border border-${getTypeColor()}-200 mr-1 mb-1`}
              >
                <span className='mr-1'>{getTypeIcon()}</span>
                <span className='max-w-[200px] truncate'>{comment}</span>
                <button
                  onClick={() => handleRemoveComment(comment)}
                  className='ml-1 hover:bg-red-200 rounded-full p-0.5 transition-colors'
                >
                  <X className='w-3 h-3' />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className='text-xs text-gray-400 italic py-2'>
            {studentScore !== null ? 'Chọn nhận xét phù hợp...' : 'Cần có điểm để gợi ý nhận xét'}
          </div>
        )}
      </div>

      {/* Nút mở dropdown */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={studentScore === null}
        className={`w-full flex items-center justify-between px-3 py-2 bg-white border border-gray-300 rounded-lg hover:border-${getTypeColor()}-500 focus:ring-2 focus:ring-${getTypeColor()}-500/20 focus:border-${getTypeColor()}-500 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <div className='flex items-center'>
          <MessageSquare className='w-4 h-4 mr-2 text-gray-500' />
          <span className='text-sm text-gray-700'>
            {studentScore !== null ? `Thêm nhận xét (${getScoreLabel()})` : 'Cần có điểm'}
          </span>
          {studentScore !== null && availableComments.length > 0 && (
            <Sparkles className='w-3 h-3 ml-1 text-yellow-500' />
          )}
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && studentScore !== null && (
        <div className='absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto'>
          {/* Header */}
          <div className={`px-3 py-2 bg-${getTypeColor()}-50 border-b border-gray-200`}>
            <div className='flex items-center justify-between'>
              <span className='text-sm font-semibold text-gray-700'>
                {getTypeIcon()} Gợi ý cho điểm {studentScore?.toFixed(1)} ({getScoreLabel()})
              </span>
              <button
                onClick={() => setShowCustomInput(!showCustomInput)}
                className='text-xs text-blue-600 hover:text-blue-800 flex items-center'
              >
                <Plus className='w-3 h-3 mr-1' />
                Tự nhập
              </button>
            </div>
          </div>

          {/* Custom input */}
          {showCustomInput && (
            <div className='p-3 border-b border-gray-200 bg-gray-50'>
              <div className='flex gap-2'>
                <input
                  type='text'
                  value={customComment}
                  onChange={(e) => setCustomComment(e.target.value)}
                  placeholder='Nhập nhận xét tùy chỉnh...'
                  className='flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500'
                  onKeyPress={(e) => e.key === 'Enter' && handleAddCustomComment()}
                />
                <button
                  onClick={handleAddCustomComment}
                  disabled={!customComment.trim()}
                  className='px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50'
                >
                  Thêm
                </button>
              </div>
            </div>
          )}

          {/* Danh sách nhận xét gợi ý */}
          <div className='max-h-40 overflow-y-auto'>
            {availableComments.length > 0 ? (
              availableComments.map((comment, index) => {
                const isSelected = selectedComments.includes(comment.content)
                return (
                  <button
                    key={index}
                    onClick={() => handleCommentToggle(comment.content)}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                      isSelected ? `bg-${getTypeColor()}-50 text-${getTypeColor()}-700` : 'text-gray-700'
                    }`}
                  >
                    <div className='flex items-start'>
                      <span className='mr-2 mt-0.5'>{getTypeIcon()}</span>
                      <span className='flex-1'>{comment.content}</span>
                      {isSelected && <span className='ml-2 text-green-600'>✓</span>}
                    </div>
                  </button>
                )
              })
            ) : (
              <div className='px-3 py-4 text-sm text-gray-500 text-center'>
                <MessageSquare className='w-8 h-8 mx-auto mb-2 text-gray-300' />
                Không có gợi ý nhận xét cho mức điểm này
              </div>
            )}
          </div>

          {/* Footer */}
          <div className='px-3 py-2 bg-gray-50 border-t border-gray-200'>
            <div className='flex items-center justify-between text-xs text-gray-500'>
              <span>{availableComments.length > 0 ? `${availableComments.length} gợi ý` : 'Không có gợi ý'}</span>
              <button onClick={() => setIsOpen(false)} className='text-blue-600 hover:text-blue-800'>
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CommentSelector
