/* eslint-disable @typescript-eslint/no-explicit-any */
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import adminApi from '../apis/admin.api'
import { UserRole } from '../types/User.type'

// Teachers query
export const useTeachers = (page = 1, limit = 10, search = '') => {
  return useQuery({
    queryKey: ['admin', 'teachers', page, limit, search],
    queryFn: async () => {
      const response = await adminApi.getTeachers({ page, limit, search })
      console.log(response.data.result)

      return response.data.result
    },
    placeholderData: keepPreviousData,
    staleTime: 3 * 60 * 1000 // 3 minutes
  })
}

// Students query
export const useStudents = (page = 1, limit = 10, search = '') => {
  return useQuery({
    queryKey: ['admin', 'students', page, limit, search],
    queryFn: async () => {
      const response = await adminApi.getStudents({ page, limit, search })
      return response.data.result
    },
    placeholderData: keepPreviousData,
    staleTime: 3 * 60 * 1000 // 3 minutes
  })
}

// Master exams query
export const useMasterExams = (page = 1, limit = 10, search = '') => {
  return useQuery({
    queryKey: ['admin', 'master-exams', page, limit, search],
    queryFn: async () => {
      const response = await adminApi.getMasterExams({ page, limit, search })
      return response.data.result
    },
    placeholderData: keepPreviousData,
    staleTime: 3 * 60 * 1000 // 3 minutes
  })
}

// User statistics query
export const useUserStatistics = (params: {
  from_date?: string
  to_date?: string
  interval?: 'daily' | 'weekly' | 'monthly'
  account_type?: string
  verification_status?: string
}) => {
  return useQuery({
    queryKey: ['admin', 'user-statistics', params],
    queryFn: async () => {
      const response = await adminApi.getUserStatistics(params)
      return response.data.result
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}

// Content statistics query
export const useContentStatistics = (params: {
  from_date?: string
  to_date?: string
  interval?: 'daily' | 'weekly' | 'monthly'
  content_type?: string
  has_media?: string
}) => {
  return useQuery({
    queryKey: ['admin', 'content-statistics', params],
    queryFn: async () => {
      const response = await adminApi.getContentStatistics(params)
      return response.data.result
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}

// Delete user mutation
export const useDeleteUser = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await adminApi.deleteUser(userId)
      return response.data.result
    },
    onSuccess: () => {
      toast.success('User deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['admin', 'teachers'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete user')
    }
  })
}

// Change user role mutation
export const useChangeUserRole = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: UserRole }) => {
      const response = await adminApi.changeUserRole(userId, role)
      return response.data.result
    },
    onSuccess: () => {
      toast.success('User role updated successfully')
      queryClient.invalidateQueries({ queryKey: ['admin', 'teachers'] })
      queryClient.invalidateQueries({ queryKey: ['admin', 'students'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to change user role')
    }
  })
}

// Delete master exam mutation
export const useDeleteMasterExam = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (masterExamId: string) => {
      const response = await adminApi.deleteMasterExam(masterExamId)
      return response.data.result
    },
    onSuccess: () => {
      toast.success('Master exam deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['admin', 'master-exams'] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete master exam')
    }
  })
}
