// AI Exam Proctoring — ViolationAlert component
// Animated popup for AI-detected violations

import React, { useEffect, useState } from 'react'
import { AlertTriangle, Ban, Eye, Smartphone, X } from 'lucide-react'
import type { AIViolation, AIViolationType } from '../../utils/aiTypes'

interface ViolationAlertProps {
  violation: AIViolation | null
  onDismiss: () => void
}

const VIOLATION_CONFIG: Record<
  AIViolationType,
  {
    label: string
    description: string
    icon: React.ReactNode
    severity: 'warning' | 'critical'
    autoDismissMs: number
  }
> = {
  PHONE_DETECTED: {
    label: 'Phát hiện điện thoại!',
    description: 'Đã phát hiện điện thoại trong khu vực thi. Đây là vi phạm nghiêm trọng.',
    icon: <Smartphone className='w-6 h-6' />,
    severity: 'critical',
    autoDismissMs: 0 // persistent
  },
  EARPHONE_DETECTED: {
    label: 'Phát hiện tai nghe!',
    description: 'Đã phát hiện tai nghe. Không được phép sử dụng tai nghe khi thi.',
    icon: <Ban className='w-6 h-6' />,
    severity: 'critical',
      autoDismissMs: 0
    },
    HEAD_TURNED: {
    label: 'Nhìn ngang quá lâu',
    description: 'Vui lòng nhìn thẳng vào màn hình trong suốt bài thi.',
    icon: <Eye className='w-6 h-6' />,
    severity: 'warning',
    autoDismissMs: 5000
  },
  HEAD_TILTED: {
    label: 'Tư thế đầu bất thường',
    description: 'Vui lòng giữ đầu thẳng và nhìn trực tiếp vào màn hình.',
    icon: <Eye className='w-6 h-6' />,
    severity: 'warning',
    autoDismissMs: 5000
  }
}

const ViolationAlert: React.FC<ViolationAlertProps> = ({ violation, onDismiss }) => {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!violation) {
      setVisible(false)
      return
    }

    // Animate in
    setVisible(true)

    // Auto-dismiss for warnings
    const config = VIOLATION_CONFIG[violation.type]
    if (config.autoDismissMs > 0) {
      const timer = setTimeout(() => {
        setVisible(false)
        setTimeout(onDismiss, 300) // wait for animation out
      }, config.autoDismissMs)
      return () => clearTimeout(timer)
    }
  }, [violation, onDismiss])

  if (!violation) return null

  const config = VIOLATION_CONFIG[violation.type]
  const isCritical = config.severity === 'critical'

  return (
    <div
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-[100] max-w-sm w-full mx-4 transition-all duration-300
        ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}
    >
      <div
        className={`rounded-xl shadow-2xl border-2 overflow-hidden
          ${isCritical
            ? 'bg-red-50 border-red-300'
            : 'bg-amber-50 border-amber-300'
          }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between px-4 py-3
            ${isCritical
              ? 'bg-red-500 text-white'
              : 'bg-amber-500 text-white'
            }`}
        >
          <div className='flex items-center gap-2'>
            <AlertTriangle className='w-5 h-5' />
            <span className='font-bold text-sm'>
              {isCritical ? '⚠️ VI PHẠM NGHIÊM TRỌNG' : '⚠️ CẢNH BÁO'}
            </span>
          </div>
          {!isCritical && (
            <button
              onClick={() => {
                setVisible(false)
                setTimeout(onDismiss, 300)
              }}
              className='text-white/80 hover:text-white transition-colors'
            >
              <X className='w-4 h-4' />
            </button>
          )}
        </div>

        {/* Body */}
        <div className='px-4 py-3'>
          <div className='flex items-start gap-3'>
            <div
              className={`p-2 rounded-lg flex-shrink-0
                ${isCritical ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'}`}
            >
              {config.icon}
            </div>
            <div>
              <h4
                className={`font-bold text-sm ${isCritical ? 'text-red-800' : 'text-amber-800'}`}
              >
                {config.label}
              </h4>
              <p className={`text-xs mt-1 ${isCritical ? 'text-red-600' : 'text-amber-600'}`}>
                {config.description}
              </p>
              {violation.confidence > 0 && (
                <p className='text-[10px] text-gray-400 mt-1'>
                  Độ tin cậy: {(violation.confidence * 100).toFixed(0)}%
                </p>
              )}
            </div>
          </div>
          {isCritical && (
            <div className='mt-3 pt-2 border-t border-red-200'>
              <p className='text-xs text-red-700 font-medium'>
                🔴 Vi phạm này đã được ghi nhận và gửi đến giám thị.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ViolationAlert
