/* eslint-disable @typescript-eslint/no-explicit-any */
import { SuccessResponse } from '../types/Utils.type'
import http from '../utils/http'

interface Exam {
  _id: string
  title: string
  exam_code: string
  teacher_id: string
  question_ids: string[]
  duration: number
  start_time?: string
  created_at: string
  active: boolean
  expired?: boolean
}

interface Question {
  _id: string
  content: string
  answers: string[]
}

interface ExamWithQuestions extends Omit<Exam, 'question_ids'> {
  questions: Question[]
}

interface ExamSession {
  _id: string
  exam_id: string
  student_id: string
  start_time: string
  end_time: string | null
  answers: Array<{
    question_id: string
    selected_index: number
  }>
  score: number
  violations: number
  completed: boolean
  created_at: string
  updated_at: string
}

interface ExamSessionWithStudentInfo extends ExamSession {
  student_name: string
  student_username: string
}

interface ExamHistoryItem extends ExamSession {
  exam_title: string
  duration: number
}

interface GenerateExamRequest {
  title: string
  quantity: number
  question_count: number
  duration: number
  start_time?: string
  master_exam_id?: string
}

interface QRCodeResponse {
  exam_code: string
  qrCode: string
  start_time?: string
}

interface StartExamRequest {
  exam_code: string
  user_code?: string
}

interface StartExamResponse {
  session: ExamSession
  exam: ExamWithQuestions
  remaining_time: number
  access_token?: string
}

interface SubmitExamRequest {
  session_id: string
  answers: Array<{
    question_id: string
    selected_index: number
  }>
}

interface ExamResultsStatistics {
  averageScore: number
  completionRate: number
  totalStudents: number
  violationCount: number
}

interface UpdateExamStatusRequest {
  active?: boolean
  start_time?: string | null
  duration?: number
}
interface ClassExamResultsParams {
  search_term?: string
  violation_types?: string[]
  page?: number
  limit?: number
}

interface ClassExamResult {
  session_id: string
  student_id: string
  student_name: string
  student_username: string
  score: number
  violations: number
  start_time: string
  end_time?: string
  completed: boolean
  exam_duration: number
}

interface Violation {
  session_id: string
  student_id: string
  type: string
  severity: 'low' | 'medium' | 'high'
  details?: any
  timestamp: string
}
interface MasterExam {
  _id: string
  name: string
  description?: string
  exam_period?: string
  start_time?: string
  end_time?: string
  teacher_id: string
  created_at: string
  updated_at: string
}

interface ClassInfo {
  class_name: string
  student_count: number
}

interface CreateMasterExamRequest {
  name: string
  description?: string
  exam_period?: string
  start_time?: string
  end_time?: string
}
interface MasterExam {
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
  examStatus?: {
    total: number
    active: number
  }
  questionLink: string
}

interface UpdateExamStatusRequest {
  active?: boolean
  start_time?: string | null
  duration?: number
  expired?: boolean
}

const examApi = {
  generateExam: (body: GenerateExamRequest) =>
    http.post<SuccessResponse<QRCodeResponse[]>>('/api/exams/generate', body),

  getExams: () => http.get<SuccessResponse<Exam[]>>('/api/exams'),

  getExamById: (examId: string) => http.get<SuccessResponse<Exam>>(`/api/exams/${examId}`),

  updateExamStatus: (examId: string, body: UpdateExamStatusRequest) =>
    http.put<SuccessResponse<Exam>>(`/api/exams/${examId}/status`, body),

  startExam: (body: StartExamRequest) => http.post<SuccessResponse<StartExamResponse>>('/api/exams/start', body),

  submitExam: (body: SubmitExamRequest) => http.post<SuccessResponse<ExamSession>>('/api/exams/submit', body),

  getExamHistory: () => http.get<SuccessResponse<ExamHistoryItem[]>>('/api/exams/history'),

  // Methods for teacher's exam results
  getExamResults: (examId: string) =>
    http.get<SuccessResponse<ExamSessionWithStudentInfo[]>>(`/api/exams/${examId}/results`),

  getExamResultsStatistics: (examId: string) =>
    http.get<SuccessResponse<ExamResultsStatistics>>(`/api/exams/${examId}/statistics`),
  getClassExamResults: (examId: string, params?: ClassExamResultsParams) =>
    http.get<SuccessResponse<ClassExamResult[]>>(`/api/exams/${examId}/class-results`, { params }),

  // Get student violations
  getStudentViolations: (examId: string, studentId: string) =>
    http.get<SuccessResponse<Violation[]>>(`/api/exams/${examId}/students/${studentId}/violations`),
  createMasterExam: (body: CreateMasterExamRequest) =>
    http.post<SuccessResponse<MasterExam>>('/api/exams/idea/master', body),

  // Get all master exams for the current teacher
  getMasterExams: () => http.get<SuccessResponse<MasterExam[]>>('/api/exams/idea/master'),

  // Get a specific master exam by ID
  getMasterExamById: (masterExamId: string) => http.get<SuccessResponse<any>>(`/api/exams/idea/master/${masterExamId}`),

  // Get all exams associated with a master exam
  getExamsByMasterExamId: (masterExamId: string) =>
    http.get<SuccessResponse<Exam[]>>(`/api/exams/idea/master/${masterExamId}/exams`),

  // Get all classes that participated in a master exam
  getClassesForMasterExam: (masterExamId: string) =>
    http.get<SuccessResponse<ClassInfo[]>>(`/api/exams/idea/master/${masterExamId}/classes`),

  // Get class results for a master exam
  getClassExamResultsForMasterExam: (masterExamId: string, className: string, params?: ClassExamResultsParams) =>
    http.get<SuccessResponse<ClassExamResult[]>>(
      `/api/exams/idea/master/${masterExamId}/classes/${encodeURIComponent(className)}/results`,
      { params }
    ),

  // New methods for our requirements
  toggleMasterExamStatus: (masterExamId: string, active: boolean) =>
    http.put<SuccessResponse<any>>(`/api/exams/idea/master/${masterExamId}/toggle-status`, { active }),

  deleteMasterExam: (masterExamId: string) =>
    http.delete<SuccessResponse<{ message: string }>>(`/api/exams/idea/master/${masterExamId}`),
  // Thêm những API này vào exam.api.ts nếu chưa có

  // API để lấy thống kê của một bài thi
  getExamStatistics: (examId: string) => http.get<SuccessResponse<any>>(`/api/exams/${examId}/statistics`)
}

export default examApi
