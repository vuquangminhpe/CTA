/* eslint-disable @typescript-eslint/no-explicit-any */
import { SuccessResponse } from '../types/Utils.type'
import http from '../utils/http'

// Enums
export enum PackageType {
  SINGLE = 'single',
  TEAM_4 = 'team_4',
  TEAM_7 = 'team_7'
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  REJECTED = 'rejected',
  EXPIRED = 'expired'
}

export enum PaymentMethod {
  QR_CODE = 'qr_code'
}

// Interfaces
export interface Package {
  _id: string
  name: string
  type: PackageType
  price: number
  duration_months: number
  max_teachers: number
  question_generation_limit: number
  features: string[]
  active: boolean
  created_at: string
  updated_at: string
}

export interface Payment {
  _id: string
  user_id: string
  package_id: string
  package_type: PackageType
  amount: number
  payment_method: PaymentMethod
  status: PaymentStatus
  teacher_usernames?: string[]
  qr_code_url: string
  note?: string
  admin_note?: string
  processed_by?: string
  processed_at?: string
  expires_at?: string
  created_at: string
  updated_at: string
  user?: {
    name: string
    username: string
    email?: string
  }
  package?: Package
  processed_by_user?: {
    name: string
    username: string
  }
}

export interface PaymentListResponse {
  payments: Payment[]
  total: number
  page: number
  limit: number
  total_pages: number
}

export interface PaymentStatistics {
  by_status: Array<{
    _id: PaymentStatus
    count: number
    total_amount: number
  }>
  total_revenue: number
  monthly_revenue: Array<{
    _id: {
      year: number
      month: number
    }
    revenue: number
    count: number
  }>
}

// Request interfaces
export interface CreatePaymentBody {
  package_id: string
  teacher_usernames?: string[]
  note?: string
}

export interface UpdatePaymentStatusBody {
  status: PaymentStatus
  admin_note?: string
}

export interface GetPaymentsQuery {
  page?: number
  limit?: number
  status?: PaymentStatus
  package_type?: PackageType
  user_id?: string
  search?: string
  sort_by?: 'created_at' | 'updated_at' | 'amount'
  sort_order?: 'asc' | 'desc'
  from_date?: string
  to_date?: string
}

export interface CreatePackageBody {
  name: string
  type: PackageType
  price: number
  duration_months: number
  max_teachers: number
  question_generation_limit: number
  features: string[]
}

export interface UpdatePackageBody {
  name?: string
  price?: number
  duration_months?: number
  max_teachers?: number
  question_generation_limit?: number
  features?: string[]
  active?: boolean
}

const paymentApi = {
  // Public APIs
  getPackages: () => http.get<SuccessResponse<Package[]>>('/api/payments/packages'),

  // User APIs
  createPayment: (body: CreatePaymentBody) => http.post<SuccessResponse<Payment>>('/api/payments', body),

  getUserPayments: (params?: GetPaymentsQuery) =>
    http.get<SuccessResponse<PaymentListResponse>>('/api/payments/my-payments', { params }),

  getPaymentById: (paymentId: string) => http.get<SuccessResponse<Payment>>(`/api/payments/${paymentId}`),

  // Admin APIs
  getAllPayments: (params?: GetPaymentsQuery) =>
    http.get<SuccessResponse<PaymentListResponse>>('/admin/api/payments', { params }),

  updatePaymentStatus: (paymentId: string, body: UpdatePaymentStatusBody) =>
    http.put<SuccessResponse<Payment>>(`/admin/api/payments/${paymentId}/status`, body),

  deletePayment: (paymentId: string) =>
    http.delete<SuccessResponse<{ message: string }>>(`/admin/api/payments/${paymentId}`),

  getPaymentStatistics: () => http.get<SuccessResponse<PaymentStatistics>>('/admin/statistics/api/payments'),

  // Package management (Admin only)
  createPackage: (body: CreatePackageBody) => http.post<SuccessResponse<Package>>('/admin/packages', body),

  updatePackage: (packageId: string, body: UpdatePackageBody) =>
    http.put<SuccessResponse<Package>>(`/admin/packages/${packageId}`, body),

  deletePackage: (packageId: string) =>
    http.delete<SuccessResponse<{ message: string }>>(`/admin/packages/${packageId}`)
}

export default paymentApi
