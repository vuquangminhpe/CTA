// client/src/apis/grades.api.ts
import { SuccessResponse } from '../types/Utils.type'
import http from '../utils/http'

export interface Subject {
  _id: string
  name: string
  code: string
  grade_level: string
  is_main_subject: boolean
  evaluation_type: string
}

export interface Grade {
  _id?: string
  student_id: string
  subject_id: string
  class_name: string
  semester: number
  school_year: string
  exam_type: 'TX' | 'GK' | 'CK'
  exam_sequence?: number
  score: number
  teacher_id: string
}

export interface StudentComment {
  _id?: string
  student_id: string
  subject_id: string
  class_name: string
  semester: number
  school_year: string
  teacher_id: string
  strengths: string[]
  weaknesses: string[]
  progress: string
  average_score?: number
}

export interface ClassGradesParams {
  className: string
  subjectId: string
  semester: number
  schoolYear: string
}

export interface ClassGradesResponse {
  subject: Subject
  students: {
    student_id: string
    student_name: string
    student_username: string
    scores: {
      TX: number[]
      GK: number | null
      CK: number | null
    }
    average_score: number | null
    comments: {
      strengths: string[]
      weaknesses: string[]
      progress: string
    }
  }[]
  exam_columns: {
    key: string
    label: string
    type: string
  }[]
  class_info: {
    class_name: string
    semester: number
    school_year: string
    total_students: number
  }
}

export interface UpdateBulkGradesParams {
  grades: {
    student_id: string
    exam_type: 'TX' | 'GK' | 'CK'
    exam_sequence?: number
    score: number
  }[]
  comments: {
    student_id: string
    strengths: string[]
    weaknesses: string[]
    progress: string
    average_score?: number
  }[]
  class_name: string
  subject_id: string
  semester: number
  school_year: string
}

export interface CommentParams {
  category?: string
  type?: string
  grade_level?: string
}

const gradesApi = {
  // Lấy danh sách môn học
  getSubjects: (grade_level?: string) => {
    const params = grade_level ? `?grade_level=${grade_level}` : ''
    return http.get<SuccessResponse<Subject[]>>(`/api/grades/subjects${params}`)
  },

  // Lấy dữ liệu bảng điểm của lớp
  getClassGrades: (params: ClassGradesParams) => {
    const { className, subjectId, semester, schoolYear } = params
    return http.get<SuccessResponse<ClassGradesResponse>>(
      `/api/grades/class/${className}?subject_id=${subjectId}&semester=${semester}&school_year=${schoolYear}`
    )
  },

  // Lấy điểm của một học sinh cụ thể
  getStudentGrades: (studentId: string, params: Omit<ClassGradesParams, 'className'>) => {
    const { subjectId, semester, schoolYear } = params
    return http.get<
      SuccessResponse<{
        grades: Grade[]
        comments: {
          strengths: string[]
          weaknesses: string[]
          progress: string
        }
      }>
    >(`/api/grades/student/${studentId}?subject_id=${subjectId}&semester=${semester}&school_year=${schoolYear}`)
  },

  // Lấy thư viện nhận xét
  getComments: (params: CommentParams) => {
    const searchParams = new URLSearchParams()
    if (params.category) searchParams.append('category', params.category)
    if (params.type) searchParams.append('type', params.type)
    if (params.grade_level) searchParams.append('grade_level', params.grade_level)

    return http.get<
      SuccessResponse<
        {
          id: string
          content: string
          type: string
          category: string
          grade_level?: string
        }[]
      >
    >(`/api/grades/comments?${searchParams.toString()}`)
  },

  // Tạo điểm mới
  createGrade: (gradeData: Omit<Grade, '_id' | 'teacher_id'>) => {
    return http.post<SuccessResponse<Grade>>('/api/grades', gradeData)
  },

  // Cập nhật hàng loạt điểm và nhận xét
  updateBulkGrades: (data: UpdateBulkGradesParams) => {
    return http.put<
      SuccessResponse<{
        gradesUpdated: number
        commentsUpdated: number
      }>
    >('/api/grades/bulk-update', data)
  },

  // Xuất dữ liệu bảng điểm ra Excel (future feature)
  exportClassGrades: (params: ClassGradesParams) => {
    const { className, subjectId, semester, schoolYear } = params
    return http.get(
      `/api/grades/export/${className}?subject_id=${subjectId}&semester=${semester}&school_year=${schoolYear}`,
      { responseType: 'blob' }
    )
  },

  // Nhập dữ liệu từ Excel (future feature)
  importClassGrades: (file: File, params: ClassGradesParams) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('class_name', params.className)
    formData.append('subject_id', params.subjectId)
    formData.append('semester', params.semester.toString())
    formData.append('school_year', params.schoolYear)

    return http.post<
      SuccessResponse<{
        imported: number
        errors: string[]
      }>
    >('/api/grades/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  }
}

export default gradesApi

// client/src/types/Grade.type.ts
export interface GradeStatistic {
  total_students: number
  students_with_grades: number
  excellent: number // >= 9.0
  good: number // 8.0 - 8.9
  average_high: number // 7.0 - 7.9
  average: number // 5.0 - 6.9
  below_average: number // < 5.0
  class_average: string
}

export interface StudentGradeData {
  student_id: string
  student_name: string
  student_username: string
  user_code?: string
  scores: {
    TX: (number | null)[]
    GK: number | null
    CK: number | null
  }
  average_score: number | null
  comments: {
    strengths: string[]
    weaknesses: string[]
    progress: string
  }
  rank?: number
}

export interface GradeTableData {
  subject: Subject
  students: StudentGradeData[]
  exam_columns: ExamColumn[]
  class_info: {
    class_name: string
    semester: number
    school_year: string
    total_students: number
    teacher_name?: string
  }
  statistics?: GradeStatistic
}

export interface ExamColumn {
  key: string
  label: string
  type: 'multiple' | 'single' | 'calculated'
  weight?: number
}

export interface GradeFilter {
  className: string
  subjectId: string
  semester: number
  schoolYear: string
}
