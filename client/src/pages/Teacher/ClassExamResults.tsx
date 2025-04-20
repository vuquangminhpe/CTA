/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Filter, Search, Eye, AlertTriangle, Clock, Download, FileText, X } from 'lucide-react'
import { toast } from 'sonner'
import examApi from '../../apis/exam.api'

// Define types for our data
interface StudentResult {
  student_id: string
  student_name: string
  student_username: string
  score: number
  violations: number
  start_time: string
  end_time?: string
  session_id: string
  completed: boolean
  exam_duration: number
}

interface ViolationDetail {
  type: string
  severity: 'low' | 'medium' | 'high'
  timestamp: string
  details?: any
}

interface ExamInfo {
  _id: string
  title: string
  exam_code: string
  duration: number
  start_time?: string
  question_count: number
  active: boolean
}

// Map violation types to Vietnamese
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
  unusual_activity: 'Hoạt động bất thường',
  extended_absence: 'Vắng mặt kéo dài',
  other: 'Lỗi khác'
}

// Severity to Vietnamese
const severityMap: Record<string, string> = {
  low: 'Thấp',
  medium: 'Trung bình',
  high: 'Cao'
}

const ClassExamResults = () => {
  const { examId } = useParams()
  const navigate = useNavigate()
  const [examInfo, setExamInfo] = useState<ExamInfo | null>(null)
  const [studentResults, setStudentResults] = useState<StudentResult[]>([])
  const [filteredResults, setFilteredResults] = useState<StudentResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [violations, setViolations] = useState<ViolationDetail[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedViolationTypes, setSelectedViolationTypes] = useState<string[]>([])
  const [showViolationsModal, setShowViolationsModal] = useState(false)
  const [stats, setStats] = useState({
    averageScore: 0,
    completionRate: 0,
    totalStudents: 0,
    totalViolations: 0
  })

  // Load exam info and results
  useEffect(() => {
    if (!examId) return

    const fetchExamData = async () => {
      try {
        setIsLoading(true)

        // Fetch exam information
        const examResponse = await examApi.getExamById(examId)
        setExamInfo(examResponse.data.result as any)

        // Fetch exam results
        const resultsResponse = await examApi.getExamResults(examId)
        const results = resultsResponse.data.result
        setStudentResults(results as any)
        setFilteredResults(results as any)

        // Calculate stats
        if (results.length > 0) {
          const completedSessions = results.filter((r) => r.completed)
          const avgScore =
            completedSessions.length > 0
              ? completedSessions.reduce((sum, r) => sum + r.score, 0) / completedSessions.length
              : 0

          setStats({
            averageScore: Math.round(avgScore * 100) / 100,
            completionRate: Math.round((completedSessions.length / results.length) * 100),
            totalStudents: results.length,
            totalViolations: results.reduce((sum, r) => sum + r.violations, 0)
          })
        }
      } catch (error) {
        console.error('Failed to fetch exam data:', error)
        toast.error('Không thể tải dữ liệu kỳ thi')
      } finally {
        setIsLoading(false)
      }
    }

    fetchExamData()
  }, [examId])

  // Apply filters when search term or violation filters change
  useEffect(() => {
    if (!studentResults.length) return

    let filtered = [...studentResults]

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (student) =>
          student.student_name.toLowerCase().includes(term) || student.student_username.toLowerCase().includes(term)
      )
    }

    // Apply violation type filters
    if (selectedViolationTypes.length > 0) {
      // This would ideally be filtered on the server, but for now we're using client-side filtering
      // In a real implementation, we'd fetch the filtered results from the server
      filtered = filtered.filter((student) => student.violations > 0)
    }

    setFilteredResults(filtered)
  }, [searchTerm, selectedViolationTypes, studentResults])

  // Fetch violations for a student
  const fetchViolations = async (studentId: string, sessionId: string) => {
    try {
      // This would be a real API call in the implementation
      // const response = await examApi.getStudentViolations(examId, studentId)

      // Placeholder data - in a real implementation, this would come from the server
      const mockViolations: ViolationDetail[] = [
        {
          type: 'tab_switch',
          severity: 'medium',
          timestamp: new Date().toISOString(),
          details: { count: 2 }
        },
        {
          type: 'sudden_disconnect',
          severity: 'high',
          timestamp: new Date(Date.now() - 30000).toISOString()
        }
      ]

      setViolations(mockViolations)
      setSelectedStudent(studentId)
      setShowViolationsModal(true)
    } catch (error) {
      console.error('Failed to fetch violations:', error)
      toast.error('Không thể tải dữ liệu vi phạm')
    }
  }

  // Toggle violation type filter
  const toggleViolationTypeFilter = (type: string) => {
    setSelectedViolationTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  // Calculate time spent on exam
  const calculateTimeSpent = (start: string, end?: string) => {
    const startDate = new Date(start)
    const endDate = end ? new Date(end) : new Date()

    const diffMs = endDate.getTime() - startDate.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffSecs = Math.floor((diffMs % 60000) / 1000)

    return `${diffMins}m ${diffSecs}s`
  }

  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
  }

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'Tên học sinh',
      'Tên người dùng',
      'Điểm',
      'Lỗi vi phạm',
      'Thời gian làm bài',
      'Hoàn thành',
      'Thời gian bắt đầu',
      'Thời gian kết thúc'
    ]

    const csvRows = [
      headers.join(','),
      ...filteredResults.map((student) =>
        [
          `"${student.student_name}"`,
          `"${student.student_username}"`,
          student.score / 10,
          student.violations,
          calculateTimeSpent(student.start_time, student.end_time),
          student.completed ? 'Đã hoàn thành' : 'Chưa hoàn thành',
          formatDate(student.start_time),
          formatDate(student.end_time)
        ].join(',')
      )
    ]

    const csvContent = csvRows.join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `ket-qua-thi-${examInfo?.title || 'export'}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (isLoading) {
    return (
      <div className='flex justify-center items-center py-12'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  return (
    <div className='max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>
      {/* Header */}
      <div className='mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between'>
        <div className='mb-4 sm:mb-0'>
          <div className='flex items-center'>
            <button
              onClick={() => navigate('/teacher')}
              className='mr-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors'
            >
              <ArrowLeft className='h-5 w-5 text-gray-600' />
            </button>
            <h1 className='text-2xl font-bold text-gray-900'>{examInfo?.title || 'Kết quả kỳ thi'}</h1>
          </div>
          <div className='mt-1 text-sm text-gray-500'>
            <span>Mã kỳ thi: {examInfo?.exam_code}</span>
            {examInfo?.start_time && <span className='ml-4'>Thời gian bắt đầu: {formatDate(examInfo.start_time)}</span>}
            <span className='ml-4'>Thời lượng: {examInfo?.duration} phút</span>
          </div>
        </div>
        <button
          onClick={exportToCSV}
          className='inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700'
        >
          <Download className='mr-2 -ml-1 h-5 w-5' />
          Xuất kết quả (CSV)
        </button>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6'>
        <div className='bg-white overflow-hidden shadow rounded-lg'>
          <div className='px-4 py-5 sm:p-6'>
            <div className='flex items-center'>
              <div className='flex-shrink-0 bg-blue-100 rounded-md p-3'>
                <FileText className='h-6 w-6 text-blue-600' />
              </div>
              <div className='ml-5 w-0 flex-1'>
                <dl>
                  <dt className='text-sm font-medium text-gray-500 truncate'>Tổng số học sinh</dt>
                  <dd className='text-lg font-medium text-gray-900'>{stats.totalStudents}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white overflow-hidden shadow rounded-lg'>
          <div className='px-4 py-5 sm:p-6'>
            <div className='flex items-center'>
              <div className='flex-shrink-0 bg-green-100 rounded-md p-3'>
                <Eye className='h-6 w-6 text-green-600' />
              </div>
              <div className='ml-5 w-0 flex-1'>
                <dl>
                  <dt className='text-sm font-medium text-gray-500 truncate'>Tỷ lệ hoàn thành</dt>
                  <dd className='text-lg font-medium text-gray-900'>{stats.completionRate}%</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white overflow-hidden shadow rounded-lg'>
          <div className='px-4 py-5 sm:p-6'>
            <div className='flex items-center'>
              <div className='flex-shrink-0 bg-yellow-100 rounded-md p-3'>
                <Clock className='h-6 w-6 text-yellow-600' />
              </div>
              <div className='ml-5 w-0 flex-1'>
                <dl>
                  <dt className='text-sm font-medium text-gray-500 truncate'>Điểm trung bình</dt>
                  <dd className='text-lg font-medium text-gray-900'>{stats.averageScore / 10}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white overflow-hidden shadow rounded-lg'>
          <div className='px-4 py-5 sm:p-6'>
            <div className='flex items-center'>
              <div className='flex-shrink-0 bg-red-100 rounded-md p-3'>
                <AlertTriangle className='h-6 w-6 text-red-600' />
              </div>
              <div className='ml-5 w-0 flex-1'>
                <dl>
                  <dt className='text-sm font-medium text-gray-500 truncate'>Tổng số vi phạm</dt>
                  <dd className='text-lg font-medium text-gray-900'>{stats.totalViolations}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className='bg-white shadow sm:rounded-lg p-4 mb-6'>
        <div className='sm:flex sm:items-center sm:justify-between'>
          <div className='flex-1'>
            <h3 className='text-lg leading-6 font-medium text-gray-900 flex items-center'>
              <Filter className='h-5 w-5 mr-2 text-gray-500' />
              Bộ lọc
            </h3>
          </div>
        </div>

        <div className='mt-4 grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6'>
          {/* Search box */}
          <div className='sm:col-span-3'>
            <label htmlFor='search' className='block text-sm font-medium text-gray-700'>
              Tìm kiếm học sinh
            </label>
            <div className='mt-1 relative rounded-md shadow-sm'>
              <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                <Search className='h-4 w-4 text-gray-400' />
              </div>
              <input
                type='text'
                name='search'
                id='search'
                className='focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md'
                placeholder='Tên hoặc tên người dùng...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Violation type filters */}
          <div className='sm:col-span-3'>
            <label className='block text-sm font-medium text-gray-700'>Lọc theo loại vi phạm</label>
            <div className='mt-1 flex flex-wrap gap-2'>
              {Object.entries(violationTypeMap)
                .slice(0, 4)
                .map(([type, label]) => (
                  <label key={type} className='inline-flex items-center'>
                    <input
                      type='checkbox'
                      className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded'
                      checked={selectedViolationTypes.includes(type)}
                      onChange={() => toggleViolationTypeFilter(type)}
                    />
                    <span className='ml-2 text-sm text-gray-700'>{label}</span>
                  </label>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className='bg-white shadow overflow-hidden sm:rounded-lg'>
        <div className='px-4 py-5 sm:px-6 flex justify-between items-center'>
          <h3 className='text-lg leading-6 font-medium text-gray-900'>Kết quả học sinh</h3>
          <span className='text-sm text-gray-500'>
            Hiển thị {filteredResults.length} trên {studentResults.length} học sinh
          </span>
        </div>
        <div className='border-t border-gray-200'>
          {filteredResults.length > 0 ? (
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-gray-200'>
                <thead className='bg-gray-50'>
                  <tr>
                    <th
                      scope='col'
                      className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                    >
                      Tên học sinh
                    </th>
                    <th
                      scope='col'
                      className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                    >
                      Điểm
                    </th>
                    <th
                      scope='col'
                      className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                    >
                      Lỗi vi phạm
                    </th>
                    <th
                      scope='col'
                      className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                    >
                      Thời gian làm bài
                    </th>
                    <th
                      scope='col'
                      className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                    >
                      Trạng thái
                    </th>
                    <th scope='col' className='relative px-6 py-3'>
                      <span className='sr-only'>Chi tiết</span>
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {filteredResults.map((student) => (
                    <tr key={student.student_id} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm font-medium text-gray-900'>{student.student_name}</div>
                        <div className='text-sm text-gray-500'>{student.student_username}</div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div
                          className={`text-sm font-medium ${
                            student.score >= 70
                              ? 'text-green-600'
                              : student.score >= 50
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }`}
                        >
                          {student.completed ? `${student.score / 10}` : 'Chưa có điểm của học sinh'}
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            student.violations > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {student.violations || 'Không có'}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {calculateTimeSpent(student.start_time, student.end_time)}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            student.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {student.completed ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                        <button
                          onClick={() => fetchViolations(student.student_id, student.session_id)}
                          className={`text-blue-600 hover:text-blue-900 ${student.violations === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                          disabled={student.violations === 0}
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className='py-8 text-center'>
              <p className='text-gray-500'>Không tìm thấy kết quả phù hợp với bộ lọc.</p>
            </div>
          )}
        </div>
      </div>

      {/* Violations Modal */}
      {showViolationsModal && (
        <div className='fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col'>
            <div className='px-6 py-4 border-b border-gray-200 flex justify-between items-center'>
              <h3 className='text-lg font-medium text-gray-900'>
                Chi tiết vi phạm
                {selectedStudent && ` - ${filteredResults.find((s) => s.student_id === selectedStudent)?.student_name}`}
              </h3>
              <button onClick={() => setShowViolationsModal(false)} className='text-gray-400 hover:text-gray-500'>
                <span className='sr-only'>Close</span>
                <X className='h-6 w-6' />
              </button>
            </div>
            <div className='px-6 py-4 flex-1 overflow-y-auto'>
              {violations.length > 0 ? (
                <div className='space-y-4'>
                  {violations.map((violation, index) => (
                    <div key={index} className='p-4 border border-gray-200 rounded-md'>
                      <div className='flex justify-between'>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            violation.severity === 'high'
                              ? 'bg-red-100 text-red-800'
                              : violation.severity === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {violationTypeMap[violation.type] || violation.type} -
                          {severityMap[violation.severity] || violation.severity}
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
                <div className='text-center py-8'>
                  <p className='text-gray-500'>Không có thông tin vi phạm.</p>
                </div>
              )}
            </div>
            <div className='px-6 py-4 border-t border-gray-200 flex justify-end'>
              <button
                type='button'
                className='inline-flex justify-center px-4 py-2 text-sm font-medium text-blue-900 bg-blue-100 border border-transparent rounded-md hover:bg-blue-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500'
                onClick={() => setShowViolationsModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ClassExamResults
