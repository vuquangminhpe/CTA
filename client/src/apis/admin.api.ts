/* eslint-disable @typescript-eslint/no-explicit-any */
import { SuccessResponse } from '../types/Utils.type'
import http from '../utils/http'
import { User, UserRole } from '../types/User.type'

interface TeacherData {
  _id: string
  name?: string
  username: string
  email?: string
  role: UserRole
  created_at: string
  updated_at: string
  exam_count: number
  master_exam_count: number
}

interface StudentData {
  _id: string
  name?: string
  username: string
  email?: string
  class?: string
  role: UserRole
  created_at: string
  updated_at: string
  session_count: number
  completed_session_count: number
}

interface MasterExamData {
  _id: string
  name: string
  description?: string
  exam_period?: string
  start_time?: string
  end_time?: string
  teacher_id: string
  created_at: string
  updated_at: string
  active: boolean
  teacher: {
    name: string
    username: string
    email?: string
  }
  exam_count: number
  session_count: number
}

interface UserStatsQuery {
  from_date?: string
  to_date?: string
  interval?: 'daily' | 'weekly' | 'monthly'
  account_type?: string
  verification_status?: string
}

interface ContentStatsQuery {
  from_date?: string
  to_date?: string
  interval?: 'daily' | 'weekly' | 'monthly'
  content_type?: string
  has_media?: string
}

const adminApi = {
  // User statistics
  getUserStatistics: (params?: UserStatsQuery) => http.get<SuccessResponse<any>>('/admin/statistics/users', { params }),

  // Content statistics
  getContentStatistics: (params?: ContentStatsQuery) =>
    http.get<SuccessResponse<any>>('/admin/statistics/content', { params }),

  // Teacher management
  getTeachers: (params?: { page?: number; limit?: number; search?: string }) =>
    http.get<
      SuccessResponse<{ teachers: TeacherData[]; total: number; page: number; limit: number; total_pages: number }>
    >('/admin/teachers', { params }),

  // Student management
  getStudents: (params?: { page?: number; limit?: number; search?: string }) =>
    http.get<
      SuccessResponse<{ students: StudentData[]; total: number; page: number; limit: number; total_pages: number }>
    >('/admin/students', { params }),

  // User operations
  deleteUser: (userId: string) => http.delete<SuccessResponse<{ message: string }>>(`/admin/users/${userId}`),

  changeUserRole: (userId: string, role: UserRole) =>
    http.put<SuccessResponse<User>>(`/admin/users/${userId}/role`, { role }),

  // Master exam management
  getMasterExams: (params?: { page?: number; limit?: number; search?: string }) =>
    http.get<
      SuccessResponse<{
        master_exams: MasterExamData[]
        total: number
        page: number
        limit: number
        total_pages: number
      }>
    >('/admin/master-exams', { params }),

  deleteMasterExam: (masterExamId: string) =>
    http.delete<SuccessResponse<{ message: string }>>(`/admin/master-exams/${masterExamId}`)
}

export default adminApi
