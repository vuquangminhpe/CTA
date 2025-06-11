
/**
 * Feedback system configuration
 */
export const FEEDBACK_CONFIG = {
  // ID của admin cố định quản lý tất cả feedback
  ADMIN_ID: '67fdd9abcbf252146e7d30ef',
  
  // Cấu hình khác
  DEFAULT_PRIORITY: 'medium',
  DEFAULT_STATUS: 'in_progress', // Tự động chuyển sang in_progress vì đã có admin
  MAX_MESSAGE_LENGTH: 2000,
  MAX_TITLE_LENGTH: 200,
  
  // Thống kê
  RECENT_FEEDBACKS_LIMIT: 10,
  TOP_TAGS_LIMIT: 20
} as const

export type FeedbackConfig = typeof FEEDBACK_CONFIG
