/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Feedback API - Hệ thống quản lý feedback với admin duy nhất
 * 
 * Tính năng chính:
 * - Tự động assign feedback mới cho admin được ủy quyền
 * - Chỉ admin được ủy quyền mới có thể thực hiện các thao tác quản lý
 * - Feedback mới sẽ có status "InProgress" thay vì "Pending"
 * - Teacher chỉ có thể xem và tạo feedback của mình
 */
import { SuccessResponse } from '../types/Utils.type'
import http from '../utils/http'

// Enums
export enum FeedbackStatus {
  Pending = 'pending',
  InProgress = 'in_progress',
  Resolved = 'resolved',
  Closed = 'closed'
}

export enum FeedbackPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Urgent = 'urgent'
}

export enum FeedbackCategory {
  TechnicalIssue = 'technical_issue',
  FeatureRequest = 'feature_request', 
  UserInterface = 'user_interface',
  Performance = 'performance',
  ContentSuggestion = 'content_suggestion',
  SystemBug = 'system_bug',
  Other = 'other'
}

// Interfaces
export interface FeedbackAttachment {
  filename: string
  url: string
  size: number
  type: string
}

export interface FeedbackMessage {
  _id: string
  sender_id: string
  sender_role: 'teacher' | 'admin'
  message: string
  attachments: string[]
  created_at: string
}

export interface FeedbackData {
  _id: string
  teacher_id: string
  admin_id: string // Admin luôn được tự động assign
  title: string
  category: FeedbackCategory
  priority: FeedbackPriority
  status: FeedbackStatus
  messages: FeedbackMessage[]
  tags: string[]
  created_at: string
  updated_at: string
  resolved_at?: string
}

// Request body interfaces
export interface CreateFeedbackBody {
  title: string
  category: FeedbackCategory
  priority?: FeedbackPriority
  message: string
  attachments?: string[]
  tags?: string[]
  // Note: admin_id và status sẽ được tự động assign bởi system
}

export interface UpdateFeedbackBody {
  title?: string
  category?: FeedbackCategory
  priority?: FeedbackPriority
  status?: FeedbackStatus
  tags?: string[]
}

export interface AddMessageBody {
  message: string
  attachments?: string[]
}

// Note: AssignFeedbackBody hiện tại không được sử dụng do auto-assignment
export interface AssignFeedbackBody {
  admin_id: string
}

// Query interfaces
export interface GetFeedbacksQuery {
  page?: string
  limit?: string
  status?: FeedbackStatus
  priority?: FeedbackPriority
  category?: FeedbackCategory
  teacher_id?: string
  admin_id?: string
  search?: string
  tags?: string
  sort_by?: 'created_at' | 'updated_at' | 'priority'
  sort_order?: 'asc' | 'desc'
}

export interface FeedbackStatsQuery {
  teacher_id?: string
  admin_id?: string
  from_date?: string
  to_date?: string
}

// Response interfaces
export interface FeedbackListResponse {
  feedbacks: FeedbackData[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

export interface FeedbackStatsResponse {
  total: number
  pending: number
  in_progress: number
  resolved: number
  closed: number
  low_priority: number
  medium_priority: number
  high_priority: number
  urgent_priority: number
}

export interface TopTagsResponse {
  _id: string
  count: number
}

// Create feedback API
export interface CreateFeedbackResponse {
  feedback_id: string
}

// API Object
const feedbackApi = {
  // Tạo feedback mới (Teacher only) - Admin sẽ được tự động assign
  createFeedback: (body: CreateFeedbackBody) =>
    http.post<SuccessResponse<CreateFeedbackResponse>>('/api/feedbacks', body),

  // Lấy danh sách feedback với phân trang và filter
  getFeedbacks: (query?: GetFeedbacksQuery) => {
    const params = new URLSearchParams()
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })
    }
    const queryString = params.toString()
    return http.get<SuccessResponse<FeedbackListResponse>>(
      `/api/feedbacks${queryString ? `?${queryString}` : ''}`
    )
  },

  // Lấy feedback theo ID
  getFeedbackById: (feedbackId: string) =>
    http.get<SuccessResponse<FeedbackData>>(`/api/feedbacks/${feedbackId}`),

  // Cập nhật feedback
  updateFeedback: (feedbackId: string, body: UpdateFeedbackBody) =>
    http.patch<SuccessResponse<FeedbackData>>(`/api/feedbacks/${feedbackId}`, body),

  // Thêm message vào feedback
  addMessage: (feedbackId: string, body: AddMessageBody) =>
    http.post<SuccessResponse<FeedbackData>>(`/api/feedbacks/${feedbackId}/messages`, body),

  // Assign feedback cho admin (Deprecated - Admin được tự động assign)
  assignFeedback: (feedbackId: string, body: AssignFeedbackBody) =>
    http.post<SuccessResponse<FeedbackData>>(`/api/feedbacks/${feedbackId}/assign`, body),

  // Resolve feedback (Chỉ admin được ủy quyền)
  resolveFeedback: (feedbackId: string) =>
    http.patch<SuccessResponse<FeedbackData>>(`/api/feedbacks/${feedbackId}/resolve`),

  // Close feedback (Chỉ admin được ủy quyền)
  closeFeedback: (feedbackId: string) =>
    http.patch<SuccessResponse<FeedbackData>>(`/api/feedbacks/${feedbackId}/close`),

  // Xóa feedback
  deleteFeedback: (feedbackId: string) =>
    http.delete<SuccessResponse<{ message: string }>>(`/api/feedbacks/${feedbackId}`),

  // Lấy thống kê feedback
  getFeedbackStats: (query?: FeedbackStatsQuery) => {
    const params = new URLSearchParams()
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString())
        }
      })
    }
    const queryString = params.toString()
    return http.get<SuccessResponse<FeedbackStatsResponse>>(
      `/api/feedbacks/stats${queryString ? `?${queryString}` : ''}`
    )
  },

  // Lấy top tags
  getTopTags: (limit?: number) => {
    const params = new URLSearchParams()
    if (limit) {
      params.append('limit', limit.toString())
    }
    const queryString = params.toString()
    return http.get<SuccessResponse<TopTagsResponse[]>>(
      `/api/feedbacks/tags/top${queryString ? `?${queryString}` : ''}`
    )
  },
  // Lấy feedback gần đây (Chỉ admin được ủy quyền)
  getRecentFeedbacks: (limit?: number) => {
    const params = new URLSearchParams()
    if (limit) {
      params.append('limit', limit.toString())
    }
    const queryString = params.toString()
    return http.get<SuccessResponse<FeedbackData[]>>(
      `/api/feedbacks/recent${queryString ? `?${queryString}` : ''}`
    )
  }
}

export default feedbackApi
