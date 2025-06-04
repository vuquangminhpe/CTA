/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Filter,
  Search,
  Eye,
  AlertTriangle,
  Clock,
  Download,
  FileText,
  X,
  TrendingUp,
  Users,
  Award,
  Target
} from 'lucide-react'
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
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 flex justify-center items-center'>
        <div className='relative'>
          <div className='w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin'></div>
          <div className='absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full animate-spin animation-delay-150'></div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30'>
      {/* Animated Background Elements */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse'></div>
        <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000'></div>
      </div>

      <div className='relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8'>
        {/* Modern Header */}
        <div className='mb-8'>
          <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-8 shadow-2xl shadow-blue-500/10'>
            <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between'>
              <div className='flex-1'>
                <div className='flex items-center mb-4'>
                  <button
                    onClick={() => navigate('/teacher')}
                    className='mr-6 w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 shadow-lg'
                  >
                    <ArrowLeft className='h-6 w-6 text-gray-600' />
                  </button>
                  <div>
                    <h1 className='text-4xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent'>
                      {examInfo?.title || 'Kết quả kỳ thi'}
                    </h1>
                    <div className='flex flex-wrap items-center gap-4 mt-2 text-lg text-gray-600 font-medium'>
                      <span className='flex items-center'>
                        <FileText className='w-5 h-5 mr-2 text-blue-500' />
                        Mã: {examInfo?.exam_code}
                      </span>
                      {examInfo?.start_time && (
                        <span className='flex items-center'>
                          <Clock className='w-5 h-5 mr-2 text-green-500' />
                          {formatDate(examInfo.start_time)}
                        </span>
                      )}
                      <span className='flex items-center'>
                        <Target className='w-5 h-5 mr-2 text-purple-500' />
                        {examInfo?.duration} phút
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className='mt-6 lg:mt-0'>
                <button
                  onClick={exportToCSV}
                  className='inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-2xl hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 hover:scale-105 font-semibold text-lg'
                >
                  <Download className='mr-3 h-6 w-6' />
                  Xuất kết quả (CSV)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Stats Cards */}
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8'>
          <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-6 shadow-xl shadow-blue-500/10 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:scale-105'>
            <div className='flex items-center'>
              <div className='w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg'>
                <Users className='h-7 w-7 text-white' />
              </div>
              <div className='ml-5 flex-1'>
                <p className='text-sm font-semibold text-gray-600 uppercase tracking-wider'>Tổng số học sinh</p>
                <p className='text-3xl font-black text-gray-900'>{stats.totalStudents}</p>
              </div>
            </div>
          </div>

          <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-6 shadow-xl shadow-green-500/10 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300 hover:scale-105'>
            <div className='flex items-center'>
              <div className='w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg'>
                <Award className='h-7 w-7 text-white' />
              </div>
              <div className='ml-5 flex-1'>
                <p className='text-sm font-semibold text-gray-600 uppercase tracking-wider'>Tỷ lệ hoàn thành</p>
                <p className='text-3xl font-black text-gray-900'>{stats.completionRate}%</p>
              </div>
            </div>
          </div>

          <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-6 shadow-xl shadow-yellow-500/10 hover:shadow-2xl hover:shadow-yellow-500/20 transition-all duration-300 hover:scale-105'>
            <div className='flex items-center'>
              <div className='w-14 h-14 bg-gradient-to-br from-yellow-500 to-orange-400 rounded-2xl flex items-center justify-center shadow-lg'>
                <TrendingUp className='h-7 w-7 text-white' />
              </div>
              <div className='ml-5 flex-1'>
                <p className='text-sm font-semibold text-gray-600 uppercase tracking-wider'>Điểm trung bình</p>
                <p className='text-3xl font-black text-gray-900'>{stats.averageScore / 10}</p>
              </div>
            </div>
          </div>

          <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-6 shadow-xl shadow-red-500/10 hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-300 hover:scale-105'>
            <div className='flex items-center'>
              <div className='w-14 h-14 bg-gradient-to-br from-red-500 to-pink-400 rounded-2xl flex items-center justify-center shadow-lg'>
                <AlertTriangle className='h-7 w-7 text-white' />
              </div>
              <div className='ml-5 flex-1'>
                <p className='text-sm font-semibold text-gray-600 uppercase tracking-wider'>Tổng số vi phạm</p>
                <p className='text-3xl font-black text-gray-900'>{stats.totalViolations}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Filters */}
        <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-8 shadow-xl shadow-blue-500/10 mb-8'>
          <div className='flex items-center mb-6'>
            <div className='w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-400 rounded-2xl flex items-center justify-center mr-4'>
              <Filter className='h-6 w-6 text-white' />
            </div>
            <h3 className='text-2xl font-bold text-gray-900'>Bộ lọc nâng cao</h3>
          </div>

          <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
            {/* Search box */}
            <div>
              <label htmlFor='search' className='block text-lg font-semibold text-gray-700 mb-3'>
                Tìm kiếm học sinh
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                  <Search className='h-6 w-6 text-gray-400' />
                </div>
                <input
                  type='text'
                  name='search'
                  id='search'
                  className='w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 text-gray-900 font-medium shadow-sm text-lg'
                  placeholder='Tên hoặc tên người dùng...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Violation type filters */}
            <div>
              <label className='block text-lg font-semibold text-gray-700 mb-3'>Lọc theo loại vi phạm</label>
              <div className='flex flex-wrap gap-3'>
                {Object.entries(violationTypeMap)
                  .slice(0, 4)
                  .map(([type, label]) => (
                    <label key={type} className='inline-flex items-center cursor-pointer'>
                      <input
                        type='checkbox'
                        className='w-5 h-5 text-blue-600 bg-white border-2 border-gray-300 rounded-lg focus:ring-blue-500 focus:ring-2'
                        checked={selectedViolationTypes.includes(type)}
                        onChange={() => toggleViolationTypeFilter(type)}
                      />
                      <span className='ml-3 text-base font-medium text-gray-700'>{label}</span>
                    </label>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Modern Results Table */}
        <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-2xl shadow-blue-500/10 overflow-hidden'>
          <div className='px-8 py-6 flex justify-between items-center border-b border-gray-200/50'>
            <div>
              <h3 className='text-2xl font-bold text-gray-900'>Kết quả học sinh</h3>
              <p className='text-gray-600 font-medium mt-1'>
                Hiển thị {filteredResults.length} trên {studentResults.length} học sinh
              </p>
            </div>
          </div>

          <div className='overflow-hidden'>
            {filteredResults.length > 0 ? (
              <div className='overflow-x-auto'>
                <table className='min-w-full'>
                  <thead className='bg-gradient-to-r from-gray-50 to-blue-50'>
                    <tr>
                      <th className='px-8 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider'>
                        Tên học sinh
                      </th>
                      <th className='px-8 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider'>
                        Điểm
                      </th>
                      <th className='px-8 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider'>
                        Lỗi vi phạm
                      </th>
                      <th className='px-8 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider'>
                        Thời gian làm bài
                      </th>
                      <th className='px-8 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider'>
                        Trạng thái
                      </th>
                      <th className='px-8 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wider'>
                        Chi tiết
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200/50'>
                    {filteredResults.map((student, index) => (
                      <tr key={student.student_id} className='hover:bg-white/50 transition-all duration-300'>
                        <td className='px-8 py-6'>
                          <div className='flex items-center'>
                            <div className='w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4'>
                              <span className='text-white font-bold text-sm'>{index + 1}</span>
                            </div>
                            <div>
                              <div className='text-lg font-bold text-gray-900'>{student.student_name}</div>
                              <div className='text-sm text-gray-500 font-medium'>{student.student_username}</div>
                            </div>
                          </div>
                        </td>
                        <td className='px-8 py-6'>
                          <div
                            className={`text-2xl font-bold ${
                              student.score >= 70
                                ? 'text-green-600'
                                : student.score >= 50
                                  ? 'text-yellow-600'
                                  : 'text-red-600'
                            }`}
                          >
                            {student.completed ? `${student.score / 10}` : 'Chưa có điểm'}
                          </div>
                        </td>
                        <td className='px-8 py-6'>
                          <span
                            className={`px-4 py-2 inline-flex text-sm font-bold rounded-2xl ${
                              student.violations > 0
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-green-100 text-green-800 border border-green-200'
                            }`}
                          >
                            {student.violations || 'Không có'}
                          </span>
                        </td>
                        <td className='px-8 py-6 text-lg font-medium text-gray-700'>
                          {calculateTimeSpent(student.start_time, student.end_time)}
                        </td>
                        <td className='px-8 py-6'>
                          <span
                            className={`px-4 py-2 inline-flex text-sm font-bold rounded-2xl ${
                              student.completed
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            }`}
                          >
                            {student.completed ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
                          </span>
                        </td>
                        <td className='px-8 py-6 text-right'>
                          <button
                            onClick={() => fetchViolations(student.student_id, student.session_id)}
                            disabled={student.violations === 0}
                            className={`px-6 py-3 rounded-2xl transition-all duration-300 font-semibold ${
                              student.violations === 0
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white hover:from-blue-600 hover:to-cyan-500 hover:scale-105 shadow-lg hover:shadow-blue-500/25'
                            }`}
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
              <div className='py-16 text-center'>
                <div className='w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6'>
                  <Search className='w-10 h-10 text-gray-400' />
                </div>
                <h3 className='text-xl font-bold text-gray-900 mb-2'>Không tìm thấy kết quả</h3>
                <p className='text-gray-600'>Không có kết quả phù hợp với bộ lọc hiện tại.</p>
              </div>
            )}
          </div>
        </div>

        {/* Modern Violations Modal */}
        {showViolationsModal && (
          <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
            <div className='backdrop-blur-xl bg-white/90 border border-white/20 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[80vh] flex flex-col'>
              <div className='px-8 py-6 border-b border-gray-200/50 flex justify-between items-center'>
                <div>
                  <h3 className='text-2xl font-bold text-gray-900'>Chi tiết vi phạm</h3>
                  {selectedStudent && (
                    <p className='text-gray-600 font-medium mt-1'>
                      {filteredResults.find((s) => s.student_id === selectedStudent)?.student_name}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setShowViolationsModal(false)}
                  className='w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-2xl flex items-center justify-center transition-all duration-300'
                >
                  <X className='h-5 w-5 text-gray-600' />
                </button>
              </div>

              <div className='px-8 py-6 flex-1 overflow-y-auto'>
                {violations.length > 0 ? (
                  <div className='space-y-4'>
                    {violations.map((violation, index) => (
                      <div
                        key={index}
                        className='backdrop-blur-sm bg-white/80 border border-white/40 rounded-2xl p-6 hover:bg-white/90 transition-all duration-300'
                      >
                        <div className='flex justify-between items-start mb-4'>
                          <span
                            className={`px-4 py-2 text-sm font-bold rounded-2xl ${
                              violation.severity === 'high'
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : violation.severity === 'medium'
                                  ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                  : 'bg-blue-100 text-blue-800 border border-blue-200'
                            }`}
                          >
                            {violationTypeMap[violation.type] || violation.type} -{' '}
                            {severityMap[violation.severity] || violation.severity}
                          </span>
                          <span className='text-sm text-gray-500 font-medium'>{formatDate(violation.timestamp)}</span>
                        </div>
                        {violation.details && (
                          <div className='mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200'>
                            <pre className='text-sm text-gray-600 whitespace-pre-wrap font-mono'>
                              {JSON.stringify(violation.details, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-center py-12'>
                    <div className='w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-4'>
                      <Award className='w-8 h-8 text-green-600' />
                    </div>
                    <h3 className='text-lg font-bold text-gray-900 mb-2'>Không có vi phạm</h3>
                    <p className='text-gray-600'>Không có thông tin vi phạm cho học sinh này.</p>
                  </div>
                )}
              </div>

              <div className='px-8 py-6 border-t border-gray-200/50 flex justify-end'>
                <button
                  onClick={() => setShowViolationsModal(false)}
                  className='px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-2xl hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 font-semibold'
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ClassExamResults
