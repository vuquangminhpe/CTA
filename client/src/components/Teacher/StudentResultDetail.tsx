/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react'
import { X, User, Check } from 'lucide-react'
import examApi from '../../apis/exam.api'
import { toast } from 'sonner'

interface Violation {
  session_id: string
  student_id: string
  type: string
  severity: 'low' | 'medium' | 'high'
  details?: any
  timestamp: string
}

interface StudentResultDetailProps {
  examId: string
  studentId: string
  sessionId: string
  studentName: string
  onClose: () => void
}

const StudentResultDetail: React.FC<StudentResultDetailProps> = ({ examId, studentId, studentName, onClose }) => {
  const [violations, setViolations] = useState<Violation[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchViolations = async () => {
      try {
        setIsLoading(true)
        const response = await examApi.getStudentViolations(examId, studentId)
        setViolations(response.data.result)
      } catch (error) {
        console.error('Failed to fetch violations:', error)
        toast.error('Không thể tải dữ liệu vi phạm')
      } finally {
        setIsLoading(false)
      }
    }

    fetchViolations()
  }, [examId, studentId])

  // Function to get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-orange-100 text-orange-800'
      case 'low':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Function to map violation type to Vietnamese name
  const getViolationTypeName = (type: string) => {
    const violationTypeMap: Record<string, string> = {
      tab_switch: 'Chuyển tab/ứng dụng',
      screen_capture: 'Chụp màn hình',
      sudden_disconnect: 'Mất kết nối đột ngột',
      window_blur: 'Thoát khỏi cửa sổ thi',
      keyboard_shortcut: 'Phím tắt đáng ngờ',
      multiple_ips: 'Nhiều địa chỉ IP',
      webcam_manipulation: 'Can thiệp webcam',
      high_risk_device: 'Thiết bị rủi ro cao',
      inactivity: 'Không hoạt động',
      unusual_activity: 'Hoạt động bất thường'
    }

    return violationTypeMap[type] || type
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className='fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50'>
      <div className='bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] flex flex-col'>
        <div className='px-6 py-4 border-b border-gray-200 flex justify-between items-center'>
          <h3 className='text-lg font-medium text-gray-900 flex items-center'>
            <User className='mr-2 h-5 w-5 text-blue-500' />
            Chi tiết vi phạm - {studentName}
          </h3>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-500'>
            <span className='sr-only'>Đóng</span>
            <X className='h-6 w-6' />
          </button>
        </div>

        <div className='px-6 py-4 flex-1 overflow-y-auto'>
          {isLoading ? (
            <div className='flex justify-center items-center py-10'>
              <div className='animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500'></div>
            </div>
          ) : violations.length > 0 ? (
            <div className='space-y-4'>
              {violations.map((violation, index) => (
                <div key={index} className='p-4 border border-gray-200 rounded-md'>
                  <div className='flex justify-between'>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${getSeverityColor(violation.severity)}`}
                    >
                      {getViolationTypeName(violation.type)} -
                      {violation.severity === 'high'
                        ? ' Mức độ cao'
                        : violation.severity === 'medium'
                          ? ' Mức độ trung bình'
                          : ' Mức độ thấp'}
                    </span>
                    <span className='text-xs text-gray-500'>{formatDate(violation.timestamp)}</span>
                  </div>
                  {violation.details && (
                    <div className='mt-2 text-sm text-gray-600'>
                      <pre className='whitespace-pre-wrap'>{JSON.stringify(violation.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center py-10'>
              <Check className='h-12 w-12 text-green-500 mb-4' />
              <p className='text-gray-500 text-center'>Không có vi phạm nào được ghi nhận.</p>
            </div>
          )}
        </div>

        <div className='px-6 py-4 border-t border-gray-200 flex justify-end'>
          <button
            type='button'
            className='inline-flex justify-center px-4 py-2 text-sm font-medium text-blue-900 bg-blue-100 border border-transparent rounded-md hover:bg-blue-200 focus:outline-none'
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  )
}

export default StudentResultDetail
