/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import gradesApi, { ClassGradesParams, UpdateBulkGradesParams } from '../apis/grades.api'

export const useGrades = () => {
  const queryClient = useQueryClient()

  // Get subjects
  const useSubjects = (grade_level?: string) => {
    return useQuery({
      queryKey: ['subjects', grade_level],
      queryFn: () => gradesApi.getSubjects(grade_level),
      staleTime: 30 * 60 * 1000 // 30 minutes
    })
  }

  // Get class grades
  const useClassGrades = (params: ClassGradesParams, enabled: boolean = true) => {
    return useQuery({
      queryKey: ['classGrades', params],
      queryFn: () => gradesApi.getClassGrades(params),
      enabled: enabled && !!(params.className && params.subjectId),
      staleTime: 5 * 60 * 1000 // 5 minutes
    })
  }

  // Get student grades
  const useStudentGrades = (studentId: string, params: Omit<ClassGradesParams, 'className'>) => {
    return useQuery({
      queryKey: ['studentGrades', studentId, params],
      queryFn: () => gradesApi.getStudentGrades(studentId, params),
      enabled: !!(studentId && params.subjectId),
      staleTime: 5 * 60 * 1000
    })
  }

  // Get comments
  const useComments = (params: { category?: string; type?: string; grade_level?: string }) => {
    return useQuery({
      queryKey: ['comments', params],
      queryFn: () => gradesApi.getComments(params),
      staleTime: 30 * 60 * 1000
    })
  }

  // Bulk update mutation
  const useBulkUpdateGrades = () => {
    return useMutation({
      mutationFn: (data: UpdateBulkGradesParams) => gradesApi.updateBulkGrades(data),
      onSuccess: () => {
        toast.success('Cập nhật điểm và nhận xét thành công!')
        queryClient.invalidateQueries({ queryKey: ['classGrades'] })
        queryClient.invalidateQueries({ queryKey: ['studentGrades'] })
      },
      onError: (error: any) => {
        console.error('Bulk update error:', error)
        toast.error(`Lỗi khi cập nhật: ${error?.response?.data?.message || 'Vui lòng thử lại'}`)
      }
    })
  }

  // Create grade mutation
  const useCreateGrade = () => {
    return useMutation({
      mutationFn: gradesApi.createGrade,
      onSuccess: () => {
        toast.success('Tạo điểm thành công!')
        queryClient.invalidateQueries({ queryKey: ['classGrades'] })
        queryClient.invalidateQueries({ queryKey: ['studentGrades'] })
      },
      onError: (error: any) => {
        toast.error(`Lỗi khi tạo điểm: ${error?.response?.data?.message || 'Vui lòng thử lại'}`)
      }
    })
  }

  return {
    useSubjects,
    useClassGrades,
    useStudentGrades,
    useComments,
    useBulkUpdateGrades,
    useCreateGrade
  }
}
