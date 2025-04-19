import { SuccessResponse } from '../types/Utils.type'
import http from '../utils/http'

interface Question {
  _id: string
  content: string
  answers: string[]
  correct_index: number
  teacher_id: string
  created_at: string
  updated_at: string
}

interface CreateQuestionRequest {
  content: string
  answers: string[]
  correct_index: number
}

const questionApi = {
  getQuestions: () => http.get<SuccessResponse<Question[]>>('/api/questions'),

  createQuestion: (body: CreateQuestionRequest) => http.post<SuccessResponse<Question>>('/api/questions', body),

  updateQuestion: (id: string, body: CreateQuestionRequest) =>
    http.put<SuccessResponse<Question>>(`/api/questions/${id}`, body),

  deleteQuestion: (id: string) => http.delete<SuccessResponse<{ message: string }>>(`/api/questions/${id}`),
  delete_all_questions: () => http.delete<SuccessResponse<{ message: string }>>(`/api/questions/all/delete_questions`)
}

export default questionApi
