/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Filter, Search, Eye, AlertTriangle, Clock, Download, User, FileText } from 'lucide-react'
import { toast } from 'sonner'
import examApi from '../../apis/exam.api'
import StudentResultDetail from '../../components/Teacher/StudentResultDetail'
import Papa from 'papaparse'
interface ClassExamResult {
  session_id: string
  student_id: string
  student_name: string
  student_username: string
  score: number
  violations: number
  start_time: string
  end_time?: string
  completed: boolean
  exam_duration: number
}

const ClassResultsList: React.FC = () => {
  const { masterExamId, className } = useParams<{ masterExamId: string; className: string }>()
  const navigate = useNavigate()
  const [results, setResults] = useState<ClassExamResult[]>([])
  const [filteredResults, setFilteredResults] = useState<ClassExamResult[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedViolationTypes, setSelectedViolationTypes] = useState<string[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null)
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null)
  const [selectedStudentName, setSelectedStudentName] = useState<string>('')
  const [showViolationsModal, setShowViolationsModal] = useState(false)
  const [stats, setStats] = useState({
    averageScore: 0,
    completionRate: 0,
    totalStudents: 0,
    totalViolations: 0
  })

  const violationTypeMap: Record<string, string> = {
    tab_switch: 'Chuyển tab/ứng dụng',
    screen_capture: 'Chụp màn hình',
    sudden_disconnect: 'Mất kết nối đột ngột',
    window_blur: 'Thoát khỏi cửa sổ thi',
    page_hide: 'Chụp ảnh trong quá trình thi',
    extended_absence: 'Vắng mặt kéo dài',
    other: 'Lỗi khác'
  }

  useEffect(() => {
    if (!masterExamId || !className) return
    fetchResults()
  }, [masterExamId, className])
  const safeRender = (value: any) => {
    if (value === null || value === undefined) {
      return 'N/A'
    }
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }
    return value
  }
  // Filter results when search term or violation filters change
  useEffect(() => {
    if (!results.length) return

    let filtered = [...results]

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (student) =>
          student.student_name.toLowerCase().includes(term) || student.student_username.toLowerCase().includes(term)
      )
    }

    if (selectedViolationTypes.length > 0) {
      // But for now, we'll just filter students with any violations
      filtered = filtered.filter((student) => student.violations > 0)
    }

    setFilteredResults(filtered)
  }, [searchTerm, selectedViolationTypes, results])
  useEffect(() => {
    // Don't run on initial mount since the other useEffect handles that
    if (masterExamId && className) {
      fetchResults()
    }
  }, [searchTerm, selectedViolationTypes])

  useEffect(() => {
    // When selectedViolationTypes changes, fetch from server
    if (masterExamId && className && selectedViolationTypes.length > 0) {
      // Only fetch if violation types are selected
      fetchResults()
    } else if (masterExamId && className && searchTerm) {
      // Fetch if search term changes
      fetchResults()
    }
  }, [selectedViolationTypes, searchTerm])

  const fetchResults = async () => {
    try {
      setIsLoading(true)

      const response = await examApi.getClassExamResultsForMasterExam(masterExamId!, decodeURIComponent(className!), {
        search_term: searchTerm,
        violation_types: selectedViolationTypes.length > 0 ? selectedViolationTypes : undefined
      })

      const resultsData = response.data.result
      setResults(resultsData)
      setFilteredResults(resultsData)

      // Calculate stats
      if (resultsData.length > 0) {
        const completedSessions = resultsData.filter((r) => r.completed)
        const avgScore =
          completedSessions.length > 0
            ? completedSessions.reduce((sum, r) => sum + r.score, 0) / completedSessions.length
            : 0

        setStats({
          averageScore: Math.round(avgScore * 100) / 100,
          completionRate: Math.round((completedSessions.length / resultsData.length) * 100),
          totalStudents: resultsData.length,
          totalViolations: resultsData.reduce((sum, r) => sum + r.violations, 0)
        })
      }
    } catch (error) {
      console.error('Failed to fetch class results:', error)
      toast.error('Không thể tải kết quả lớp')
    } finally {
      setIsLoading(false)
    }
  }

  const handleViewViolations = (studentId: string, sessionId: string, studentName: string) => {
    setSelectedStudentId(studentId)
    setSelectedSessionId(sessionId)
    setSelectedStudentName(studentName)
    setShowViolationsModal(true)
  }

  const toggleViolationTypeFilter = (type: string) => {
    setSelectedViolationTypes((prev) => (prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]))
  }

  // Calculate time spent on exam
  const calculateTimeSpent = (start: string, end?: string, duration?: number) => {
    const startDate = new Date(start)
    const endDate = end ? new Date(end) : null

    if (!endDate && !duration) return 'N/A'

    const diffMs = endDate ? endDate.getTime() - startDate.getTime() : duration! * 60 * 1000
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
    // Prepare data in the format PapaParse expects
    const csvData = filteredResults.map((student) => ({
      'Tên học sinh': student.student_name,
      Điểm: student.completed ? student.score / 10 : '',
      'Lỗi vi phạm': Number(student.violations),
      'Thời gian làm bài': calculateTimeSpent(student.start_time, student.end_time, student.exam_duration),
      'Hoàn thành': student.completed ? 'Đã hoàn thành' : 'Chưa hoàn thành',
      'Thời gian bắt đầu': formatDate(student.start_time),
      'Thời gian kết thúc': formatDate(student.end_time)
    }))

    // Use PapaParse to convert to CSV
    const csv = Papa.unparse(csvData, {
      header: true
    })

    // Add UTF-8 BOM for Excel
    const BOM = '\uFEFF'
    const csvContentWithBOM = BOM + csv

    // Create and download file
    const blob = new Blob([csvContentWithBOM], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `ket-qua-lop-${decodeURIComponent(className || '')}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className='max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>
      {/* Header */}
      <div className='mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between'>
        <div className='mb-4 sm:mb-0'>
          <div className='flex items-center'>
            <button
              onClick={() => navigate(`/teacher/master-exams/${masterExamId}`)}
              className='mr-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors'
            >
              <ArrowLeft className='h-5 w-5 text-gray-600' />
            </button>
            <h1 className='text-2xl font-bold text-gray-900'>Kết quả lớp: {decodeURIComponent(className || '')}</h1>
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
                <User className='h-6 w-6 text-blue-600' />
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
                <FileText className='h-6 w-6 text-green-600' />
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
                  <dd className='text-lg font-medium text-gray-900'>{String(stats.totalViolations).split('[')[0]}</dd>
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
              {Object.entries(violationTypeMap).map(([type, label]) => (
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
            Hiển thị {results.length} trên {results.length} học sinh
          </span>
        </div>
        <div className='border-t border-gray-200'>
          {isLoading ? (
            <div className='py-8 text-center'>
              <div className='inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600'></div>
              <p className='mt-2 text-gray-500'>Đang tải dữ liệu...</p>
            </div>
          ) : results.length > 0 ? (
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
                      <span className='sr-only'>Chi tiết </span>
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white divide-y divide-gray-200'>
                  {results.map((result, index) => (
                    <tr key={result.session_id || index} className='hover:bg-gray-50'>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='text-sm font-medium text-gray-900'>{safeRender(result.student_name)}</div>
                        <div className='text-sm text-gray-500'>{safeRender(result.student_username)}</div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div
                          className={`text-sm font-medium ${
                            result.score >= 70
                              ? 'text-green-600'
                              : result.score >= 50
                                ? 'text-yellow-600'
                                : 'text-red-600'
                          }`}
                        >
                          {result.completed ? `${safeRender(result.score) / 10}` : 'Học sinh chưa hoàn thành'}
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            result.violations > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {typeof result.violations === 'number' ? safeRender(result.violations) : 'Không có'}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                        {calculateTimeSpent(result.start_time, result.end_time, result.exam_duration)}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            result.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {result.completed === true
                            ? 'Đã hoàn thành'
                            : result.completed === false
                              ? 'Chưa hoàn thành'
                              : 'N/A'}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                        <button
                          onClick={() =>
                            handleViewViolations(
                              safeRender(result.student_id),
                              safeRender(result.session_id),
                              safeRender(result.student_name)
                            )
                          }
                          className={`text-blue-600 hover:text-blue-900 ${
                            typeof result.violations === 'number' && result.violations === 0
                              ? 'opacity-50 cursor-not-allowed'
                              : ''
                          }`}
                          disabled={typeof result.violations === 'number' && result.violations === 0}
                        >
                          {typeof result.violations === 'number' && result.violations > 0 ? (
                            <div className='flex items-center'>
                              <Eye className='h-4 w-4 mr-1' />
                              Chi tiết
                            </div>
                          ) : (
                            'Không có vi phạm'
                          )}
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
      {showViolationsModal && selectedStudentId && masterExamId && (
        <StudentResultDetail
          examId={masterExamId}
          studentId={selectedStudentId}
          sessionId={selectedSessionId!}
          studentName={selectedStudentName}
          onClose={() => setShowViolationsModal(false)}
        />
      )}
    </div>
  )
}

export default ClassResultsList
