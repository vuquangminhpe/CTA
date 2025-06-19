// Format currency in Vietnamese Dong
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Format date in Vietnamese locale
export const formatDate = (dateString: string): string => {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(dateString))
}

// Format date without time
export const formatDateOnly = (dateString: string): string => {
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(dateString))
}

// Format relative time (e.g., "2 giờ trước")
export const formatRelativeTime = (dateString: string): string => {
  const now = new Date()
  const date = new Date(dateString)
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (diffInSeconds < 60) {
    return 'Vừa xong'
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60)
    return `${minutes} phút trước`
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600)
    return `${hours} giờ trước`
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400)
    return `${days} ngày trước`
  } else {
    return formatDateOnly(dateString)
  }
}

// Format package type display name
export const formatPackageType = (type: string): string => {
  switch (type) {
    case 'single':
      return 'Gói Đơn'
    case 'team_3':
      return 'Gói 3 Người'
    case 'team_7':
      return 'Gói 7 Người'
    default:
      return type
  }
}

// Format payment status display name
export const formatPaymentStatus = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'Chờ xử lý'
    case 'completed':
      return 'Đã hoàn thành'
    case 'rejected':
      return 'Bị từ chối'
    case 'expired':
      return 'Hết hạn'
    default:
      return status
  }
}
