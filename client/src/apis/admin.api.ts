import { SuccessResponse } from '../types/Utils.type'
import http from '../utils/http'
import { User, UserRole } from '../types/User.type'

interface DashboardStats {
  totalUsers: number
  totalTeachers: number
  totalExams: number
  completedExams: number
  // Add other dashboard stats as needed
}

interface ExamStatisticsParams {
  days?: number
}

interface ExamStatistics {
  activityOverTime: Array<{
    date: string
    exams_created: number
    exams_taken: number
  }>
  scoreDistribution: Array<{
    range: string
    count: number
  }>
  topTeachers: Array<{
    _id: string
    name: string
    username: string
    count: number
  }>
  topStudents: Array<{
    _id: string
    name: string
    username: string
    exams_taken: number
    average_score: number
  }>
  averageScore: number
  completionRate: number
  violationRate: number
}

const adminApi = {
  getDashboardStats: () => http.get<SuccessResponse<DashboardStats>>('/admin/dashboard'),

  getUsers: () =>
    http.get<SuccessResponse<{ users: User[]; total: number; page: number; limit: number; totalPages: number }>>(
      '/admin/users'
    ),

  createUser: (body: { username: string; password: string; name?: string; role: UserRole }) =>
    http.post<SuccessResponse<User>>('/admin/users', body),

  updateUser: (id: string, body: { name?: string; role?: UserRole }) =>
    http.put<SuccessResponse<User>>(`/admin/users/${id}`, body),

  deleteUser: (id: string) => http.delete<SuccessResponse<{ message: string }>>(`/admin/users/${id}`),

  getExamStatistics: (params?: ExamStatisticsParams) =>
    http.get<SuccessResponse<ExamStatistics>>('/admin/statistics/exams', { params })
}

export default adminApi
