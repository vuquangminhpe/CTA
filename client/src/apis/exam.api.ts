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
}

interface QRCodeResponse {
  exam_code: string
  qrCode: string
  start_time?: string
}

interface StartExamRequest {
  exam_code: string
}

interface StartExamResponse {
  session: ExamSession
  exam: ExamWithQuestions
  remaining_time: number
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
    http.get<SuccessResponse<ExamResultsStatistics>>(`/api/exams/${examId}/statistics`)
}

export default examApi
