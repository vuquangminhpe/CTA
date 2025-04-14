export interface SubscriptionStatus {
  isActive: boolean
  subscriptionType: string
  expiryDate: string | null
}

export interface PricingInfo {
  prices: Record<string, number>
  duration: Record<string, number>
}

export interface PaymentHistoryItem {
  id: string
  orderId: string
  transactionId?: string
  amount: number
  subscriptionType: string
  status: PaymentStatus
  bankCode?: string
  cardType?: string
  createdAt: string
  updatedAt?: string
}

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'

export interface PaymentDetail {
  status: PaymentStatus
  orderId: string
  amount: number
  subscriptionType: string
  bankCode?: string
  cardType?: string
  createdAt: string
  updatedAt?: string
}

export interface CreatePaymentResponse {
  message: string
  payUrl: string
  orderId: string
}

export interface PaymentParams {
  subscription_type: number
}

export interface PaymentHistoryParams {
  page?: number
  limit?: number
}
