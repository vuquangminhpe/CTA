/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import paymentApi, {
  GetPaymentsQuery,
  CreatePaymentBody,
  UpdatePaymentStatusBody,
  CreatePackageBody,
  UpdatePackageBody,
  PaymentStatus
} from '../apis/payment.api'

// Query Keys
export const PAYMENT_QUERY_KEYS = {
  packages: ['packages'] as const,
  userPayments: (params?: GetPaymentsQuery) => ['userPayments', params] as const,
  payment: (id: string) => ['payment', id] as const,
  adminPayments: (params?: GetPaymentsQuery) => ['adminPayments', params] as const,
  paymentStatistics: ['paymentStatistics'] as const
}

// Public Hooks
export const usePackages = () => {
  return useQuery({
    queryKey: PAYMENT_QUERY_KEYS.packages,
    queryFn: () => paymentApi.getPackages(),
    select: (data) => data.data.result,
    staleTime: 5 * 60 * 1000 // 5 minutes
  })
}

// User Hooks
export const useUserPayments = (params?: GetPaymentsQuery) => {
  return useQuery({
    queryKey: PAYMENT_QUERY_KEYS.userPayments(params),
    queryFn: () => paymentApi.getUserPayments(params),
    select: (data) => data.data.result
  })
}

export const usePaymentById = (paymentId: string) => {
  return useQuery({
    queryKey: PAYMENT_QUERY_KEYS.payment(paymentId),
    queryFn: () => paymentApi.getPaymentById(paymentId),
    select: (data) => data.data.result,
    enabled: !!paymentId
  })
}

export const useCreatePayment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePaymentBody) => paymentApi.createPayment(data),
    onSuccess: (data) => {
      toast.success('Thanh toán được tạo thành công!')
      queryClient.invalidateQueries({ queryKey: ['userPayments'] })
      return data.data.result
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi tạo thanh toán')
    }
  })
}

// Admin Hooks
export const useAdminPayments = (params?: GetPaymentsQuery) => {
  return useQuery({
    queryKey: PAYMENT_QUERY_KEYS.adminPayments(params),
    queryFn: () => paymentApi.getAllPayments(params),
    select: (data) => data.data.result
  })
}

export const usePaymentStatistics = () => {
  return useQuery({
    queryKey: PAYMENT_QUERY_KEYS.paymentStatistics,
    queryFn: () => paymentApi.getPaymentStatistics(),
    select: (data) => data.data.result,
    staleTime: 2 * 60 * 1000 // 2 minutes
  })
}

export const useUpdatePaymentStatus = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ paymentId, ...data }: { paymentId: string } & UpdatePaymentStatusBody) =>
      paymentApi.updatePaymentStatus(paymentId, data),
    onSuccess: (data, variables) => {
      const statusText = getStatusText(variables.status)
      toast.success(`Thanh toán đã được ${statusText}`)
      queryClient.invalidateQueries({ queryKey: ['adminPayments'] })
      queryClient.invalidateQueries({ queryKey: ['paymentStatistics'] })
      queryClient.invalidateQueries({ queryKey: ['payment', variables.paymentId] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật thanh toán')
    }
  })
}

export const useDeletePayment = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (paymentId: string) => paymentApi.deletePayment(paymentId),
    onSuccess: () => {
      toast.success('Thanh toán đã được xóa')
      queryClient.invalidateQueries({ queryKey: ['adminPayments'] })
      queryClient.invalidateQueries({ queryKey: ['paymentStatistics'] })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi xóa thanh toán')
    }
  })
}

// Package Management Hooks
export const useCreatePackage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreatePackageBody) => paymentApi.createPackage(data),
    onSuccess: () => {
      toast.success('Gói được tạo thành công!')
      queryClient.invalidateQueries({ queryKey: PAYMENT_QUERY_KEYS.packages })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi tạo gói')
    }
  })
}

export const useUpdatePackage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ packageId, ...data }: { packageId: string } & UpdatePackageBody) =>
      paymentApi.updatePackage(packageId, data),
    onSuccess: () => {
      toast.success('Gói được cập nhật thành công!')
      queryClient.invalidateQueries({ queryKey: PAYMENT_QUERY_KEYS.packages })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật gói')
    }
  })
}

export const useDeletePackage = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (packageId: string) => paymentApi.deletePackage(packageId),
    onSuccess: () => {
      toast.success('Gói đã được xóa')
      queryClient.invalidateQueries({ queryKey: PAYMENT_QUERY_KEYS.packages })
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi xóa gói')
    }
  })
}

// Helper function
const getStatusText = (status: PaymentStatus): string => {
  switch (status) {
    case PaymentStatus.COMPLETED:
      return 'duyệt'
    case PaymentStatus.REJECTED:
      return 'từ chối'
    case PaymentStatus.EXPIRED:
      return 'đánh dấu hết hạn'
    default:
      return 'cập nhật'
  }
}
