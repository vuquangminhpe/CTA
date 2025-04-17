/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Users,
  AlertTriangle,
  Clock,
  BarChart,
  CheckCircle,
  XCircle,
  RefreshCw,
  ArrowLeft,
  MessageSquare,
  Shield
} from 'lucide-react'
import useExamMonitoring from '../../hooks/useExamMonitoring'
import { formatDistance } from 'date-fns'
import { toast } from 'sonner'
import examApi from '../../apis/exam.api'

const ExamMonitor = () => {
  const { examId } = useParams()
  const navigate = useNavigate()
  const [exam, setExam] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null)
  const [messageText, setMessageText] = useState('')
  const [activeTab, setActiveTab] = useState<'students' | 'violations'>('students')

  // Get monitoring data from socket
  const { isConnected, activeSessions, violations, stats, error, endStudentExam, sendMessageToStudent, refreshData } =
    useExamMonitoring(examId || '')

  // Load exam data
  useEffect(() => {
    const fetchExam = async () => {
      try {
        if (!examId) return

        setIsLoading(true)
        const response = await examApi.getExamById(examId)
        setExam(response.data.result)
      } catch (error) {
        console.error('Failed to load exam:', error)
        toast.error('Failed to load exam details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchExam()
  }, [examId])

  // Handle refresh data
  const handleRefresh = () => {
    const success = refreshData()
    if (success) {
      toast.success('Refreshing data...')
    } else {
      toast.error('Failed to refresh data. Check connection.')
    }
  }

  // Handle sending a message to a student
  const handleSendMessage = () => {
    if (!selectedStudent || !messageText.trim()) return

    const success = sendMessageToStudent(selectedStudent, messageText.trim())
    if (success) {
      toast.success('Message sent to student')
      setMessageText('')
    } else {
      toast.error('Failed to send message. Check connection.')
    }
  }

  // Handle ending a student's exam
  const handleEndExam = (sessionId: string, studentName: string) => {
    if (window.confirm(`Are you sure you want to end the exam for ${studentName}? This action cannot be undone.`)) {
      const success = endStudentExam(sessionId, 'Terminated by teacher')
      if (success) {
        toast.success(`Exam ended for ${studentName}`)
      } else {
        toast.error('Failed to end exam. Check connection.')
      }
    }
  }

  // Format relative time for readability
  const formatRelativeTime = (dateString: string) => {
    return formatDistance(new Date(dateString), new Date(), { addSuffix: true })
  }

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

  // Function to get violation type display name
  const getViolationTypeName = (type: string) => {
    const typeMap: Record<string, string> = {
      tab_switch: 'Tab Switching',
      screen_capture: 'Screen Capture',
      keyboard_shortcut: 'Keyboard Shortcut',
      mobile_screenshot: 'Mobile Screenshot',
      sudden_disconnect: 'Sudden Disconnect',
      multiple_ips: 'Multiple IPs',
      webcam_manipulation: 'Webcam Manipulation',
      high_risk_device: 'High Risk Device',
      inactivity: 'Inactivity',
      unusual_activity: 'Unusual Activity'
    }

    return (
      typeMap[type] ||
      type
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
    )
  }

  if (isLoading) {
    return (
      <div className='flex justify-center items-center py-12'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  if (!exam) {
    return (
      <div className='text-center py-12'>
        <h2 className='text-xl font-medium text-gray-900'>Exam not found</h2>
        <p className='mt-2 text-gray-500'>The exam you're trying to monitor doesn't exist</p>
        <button
          onClick={() => navigate('/teacher')}
          className='mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700'
        >
          <ArrowLeft className='h-4 w-4 mr-2' /> Back to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className='max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>
      {/* Header */}
      <div className='md:flex md:items-center md:justify-between mb-6'>
        <div className='flex-1 min-w-0'>
          <h2 className='text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate flex items-center'>
            <Shield className='mr-2 h-8 w-8 text-blue-500' />
            Giám sát kỳ thi trực tiếp
          </h2>
          <p className='mt-1 text-sm text-gray-500'>
            {exam.title} — Code: {exam.exam_code} —{' '}
            {isConnected ? (
              <span className='text-green-600 font-medium'>Đã kết nối</span>
            ) : (
              <span className='text-red-600 font-medium'>Đã ngắt kết nối</span>
            )}
          </p>
        </div>

        <div className='mt-4 flex md:mt-0 md:ml-4 space-x-3'>
          <button
            type='button'
            onClick={handleRefresh}
            className='inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          >
            <RefreshCw className='h-4 w-4 mr-2' /> Làm mới
          </button>
          <button
            type='button'
            onClick={() => navigate(`/teacher/exams/${examId}`)}
            className='inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          >
            <ArrowLeft className='h-4 w-4 mr-2' /> Quay lại bài kiểm tra
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-6'>
        <div className='bg-white overflow-hidden shadow rounded-lg'>
          <div className='px-4 py-5 sm:p-6'>
            <div className='flex items-center'>
              <div className='flex-shrink-0 bg-blue-100 rounded-md p-3'>
                <Users className='h-6 w-6 text-blue-600' />
              </div>
              <div className='ml-5 w-0 flex-1'>
                <dl>
                  <dt className='text-sm font-medium text-gray-500 truncate'>học sinh tham gia</dt>
                  <dd>
                    <div className='text-lg font-medium text-gray-900'>{activeSessions.length}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white overflow-hidden shadow rounded-lg'>
          <div className='px-4 py-5 sm:p-6'>
            <div className='flex items-center'>
              <div className='flex-shrink-0 bg-green-100 rounded-md p-3'>
                <CheckCircle className='h-6 w-6 text-green-600' />
              </div>
              <div className='ml-5 w-0 flex-1'>
                <dl>
                  <dt className='text-sm font-medium text-gray-500 truncate'>Đã hoàn thành bài kiểm tra</dt>
                  <dd>
                    <div className='text-lg font-medium text-gray-900'>{stats.completed_sessions}</div>
                  </dd>
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
                  <dt className='text-sm font-medium text-gray-500 truncate'>Tổng số lỗi vi phạm</dt>
                  <dd>
                    <div className='text-lg font-medium text-gray-900'>{stats.total_violations}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white overflow-hidden shadow rounded-lg'>
          <div className='px-4 py-5 sm:p-6'>
            <div className='flex items-center'>
              <div className='flex-shrink-0 bg-indigo-100 rounded-md p-3'>
                <BarChart className='h-6 w-6 text-indigo-600' />
              </div>
              <div className='ml-5 w-0 flex-1'>
                <dl>
                  <dt className='text-sm font-medium text-gray-500 truncate'>Điểm trung bình</dt>
                  <dd>
                    <div className='text-lg font-medium text-gray-900'>
                      {stats.average_score ? `${stats.average_score.toFixed(1)}%` : 'N/A'}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className='rounded-md bg-red-50 p-4 mb-6'>
          <div className='flex'>
            <div className='flex-shrink-0'>
              <XCircle className='h-5 w-5 text-red-400' aria-hidden='true' />
            </div>
            <div className='ml-3'>
              <h3 className='text-sm font-medium text-red-800'>Lỗi</h3>
              <div className='mt-2 text-sm text-red-700'>
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs for Students and Violations */}
      <div className='mb-6'>
        <div className='sm:hidden'>
          <label htmlFor='tabs' className='sr-only'>
            Select a tab
          </label>
          <select
            id='tabs'
            name='tabs'
            className='block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as 'students' | 'violations')}
          >
            <option value='students'>học sinh tham gia ({activeSessions.length})</option>
            <option value='violations'>Tổng số lỗi vi phạm ({violations.length})</option>
          </select>
        </div>
        <div className='hidden sm:block'>
          <div className='border-b border-gray-200'>
            <nav className='-mb-px flex space-x-8' aria-label='Tabs'>
              <button
                onClick={() => setActiveTab('students')}
                className={`${
                  activeTab === 'students'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                <Users className='h-5 w-5 inline-block mr-2 -mt-1' />
                học sinh tham gia ({activeSessions.length})
              </button>
              <button
                onClick={() => setActiveTab('violations')}
                className={`${
                  activeTab === 'violations'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                <AlertTriangle className='h-5 w-5 inline-block mr-2 -mt-1' />
                Tổng lỗi vi phạm ({violations.length})
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left panel - Students or Violations list */}
        <div className='lg:col-span-2'>
          {activeTab === 'students' ? (
            <div className='bg-white shadow overflow-hidden sm:rounded-lg'>
              <div className='px-4 py-5 sm:px-6 flex justify-between items-center'>
                <h3 className='text-lg leading-6 font-medium text-gray-900'>Số học sinh tham gia</h3>
              </div>
              <div className='border-t border-gray-200'>
                {activeSessions.length > 0 ? (
                  <ul className='divide-y divide-gray-200 max-h-[60vh] overflow-y-auto'>
                    {activeSessions.map((session) => (
                      <li
                        key={session.session_id}
                        className={`px-4 py-4 hover:bg-gray-50 cursor-pointer ${
                          selectedStudent === session.session_id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => setSelectedStudent(session.session_id)}
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex items-center'>
                            <div
                              className={`h-2 w-2 rounded-full mr-3 ${session.active ? 'bg-green-500' : 'bg-gray-400'}`}
                            ></div>
                            <div>
                              <h4 className='text-sm font-medium text-gray-900'>{session.student_name}</h4>
                              <p className='text-sm text-gray-500'>{session.student_username}</p>
                            </div>
                          </div>

                          <div className='ml-2 flex-shrink-0 flex'>
                            {session.violations > 0 && (
                              <span className='px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800'>
                                {session.violations} violations
                              </span>
                            )}
                          </div>
                        </div>

                        <div className='mt-2 flex justify-between text-sm text-gray-500'>
                          <div>
                            <Clock className='h-4 w-4 inline-block mr-1' />
                            Started {formatRelativeTime(session.start_time)}
                          </div>
                          <div className='flex space-x-2'>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEndExam(session.session_id, session.student_name)
                              }}
                              className='text-red-600 hover:text-red-800'
                              title='End exam'
                            >
                              <XCircle className='h-4 w-4' />
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className='py-8 text-center'>
                    <Users className='mx-auto h-12 w-12 text-gray-400' />
                    <h3 className='mt-2 text-sm font-medium text-gray-900'>Không có học sinh tham gia</h3>
                    <p className='mt-1 text-sm text-gray-500'>Hiện tại không có học sinh nào tham gia kỳ thi này.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className='bg-white shadow overflow-hidden sm:rounded-lg'>
              <div className='px-4 py-5 sm:px-6'>
                <h3 className='text-lg leading-6 font-medium text-gray-900'>Vi phạm gần đây</h3>
                <p className='mt-1 text-sm text-gray-500'>Nhật ký vi phạm của học sinh trong kỳ thi này.</p>
              </div>
              <div className='border-t border-gray-200'>
                {violations.length > 0 ? (
                  <ul className='divide-y divide-gray-200 max-h-[60vh] overflow-y-auto'>
                    {violations.map((violation, index) => (
                      <li key={index} className='px-4 py-4 sm:px-6'>
                        <div className='flex items-center justify-between'>
                          <p className='text-sm font-medium text-gray-900'>{violation.student_name}</p>
                          <div className='ml-2 flex-shrink-0 flex'>
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityColor(violation.severity)}`}
                            >
                              {violation.severity.charAt(0).toUpperCase() + violation.severity.slice(1)}
                            </span>
                          </div>
                        </div>
                        <div className='mt-2 sm:flex sm:justify-between'>
                          <div className='sm:flex'>
                            <p className='flex items-center text-sm text-gray-500'>
                              {getViolationTypeName(violation.type)}
                            </p>
                          </div>
                          <div className='mt-2 flex items-center text-sm text-gray-500 sm:mt-0'>
                            <Clock className='flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400' />
                            <p>{violation.timestamp ? formatRelativeTime(violation.timestamp) : 'Unknown time'}</p>
                          </div>
                        </div>
                        {violation.details && (
                          <div className='mt-2 text-sm text-gray-500'>
                            <div className='overflow-hidden text-ellipsis'>
                              {typeof violation.details === 'object'
                                ? JSON.stringify(violation.details).substring(0, 100) + '...'
                                : String(violation.details).substring(0, 100) + '...'}
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className='py-8 text-center'>
                    <CheckCircle className='mx-auto h-12 w-12 text-green-500' />
                    <h3 className='mt-2 text-sm font-medium text-gray-900'>Không vi phạm</h3>
                    <p className='mt-1 text-sm text-gray-500'>Không có vi phạm nào được ghi nhận trong kỳ thi này.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right panel - Student details and message system */}
        <div className='lg:col-span-1'>
          {selectedStudent ? (
            <div className='bg-white shadow overflow-hidden sm:rounded-lg'>
              <div className='px-4 py-5 sm:px-6'>
                <h3 className='text-lg leading-6 font-medium text-gray-900'>Thông tin chi tiết về học sinh</h3>
                {activeSessions.find((s) => s.session_id === selectedStudent) && (
                  <p className='mt-1 text-sm text-gray-500'>
                    {activeSessions.find((s) => s.session_id === selectedStudent)?.student_name}
                  </p>
                )}
              </div>

              <div className='border-t border-gray-200 px-4 py-5 sm:p-0'>
                {activeSessions.find((s) => s.session_id === selectedStudent) ? (
                  <dl className='sm:divide-y sm:divide-gray-200'>
                    <div className='py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                      <dd className='mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2'>
                        {activeSessions.find((s) => s.session_id === selectedStudent)?.student_name}
                      </dd>
                    </div>
                    <div className='py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                      <dt className='text-sm font-medium text-gray-500'>Tên học sinh</dt>
                      <dd className='mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2'>
                        {activeSessions.find((s) => s.session_id === selectedStudent)?.student_username}
                      </dd>
                    </div>
                    <div className='py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                      <dt className='text-sm font-medium text-gray-500'>Thời gian bắt đầu</dt>
                      <dd className='mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2'>
                        {new Date(
                          activeSessions.find((s) => s.session_id === selectedStudent)?.start_time as string
                        ).toLocaleString()}
                      </dd>
                    </div>
                    <div className='py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                      <dt className='text-sm font-medium text-gray-500'>lỗi vi phạm</dt>
                      <dd className='mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2'>
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            activeSessions.find((s) => s.session_id === selectedStudent)?.violations || 0 > 0
                              ? 'bg-red-100 text-red-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {activeSessions.find((s) => s.session_id === selectedStudent)?.violations || 0} vi phạm
                        </span>
                      </dd>
                    </div>
                    <div className='py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                      <dt className='text-sm font-medium text-gray-500'>Status</dt>
                      <dd className='mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2'>
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            activeSessions.find((s) => s.session_id === selectedStudent)?.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {activeSessions.find((s) => s.session_id === selectedStudent)?.active
                            ? 'Active'
                            : 'Inactive or Disconnected'}
                        </span>
                      </dd>
                    </div>
                    <div className='py-4 sm:py-5 sm:px-6'>
                      <dt className='text-sm font-medium text-gray-500 mb-2'>Gửi tin nhắn</dt>
                      <dd className='mt-1 text-sm text-gray-900'>
                        <div className='mt-1'>
                          <textarea
                            rows={3}
                            name='message'
                            id='message'
                            className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md'
                            placeholder='Type a message to send to the student...'
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                          />
                        </div>
                        <div className='mt-2 flex justify-end'>
                          <button
                            type='button'
                            onClick={handleSendMessage}
                            disabled={!messageText.trim()}
                            className='inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50'
                          >
                            <MessageSquare className='h-4 w-4 mr-1' />
                            Gửi tin nhắn
                          </button>
                        </div>
                      </dd>
                    </div>
                    <div className='py-4 sm:py-5 sm:px-6'>
                      <dt className='text-sm font-medium text-gray-500 mb-2'>hành động</dt>
                      <dd className='mt-1 text-sm text-gray-900'>
                        <button
                          type='button'
                          onClick={() =>
                            handleEndExam(
                              selectedStudent,
                              activeSessions.find((s) => s.session_id === selectedStudent)?.student_name ||
                                'this student'
                            )
                          }
                          className='inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                        >
                          <XCircle className='h-4 w-4 mr-1' />
                          Kết thúc kỳ thi dành cho học sinh
                        </button>
                      </dd>
                    </div>
                  </dl>
                ) : (
                  <div className='py-8 text-center'>
                    <p className='text-sm text-gray-500'>học sinh không còn hoạt động</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className='bg-white shadow sm:rounded-lg'>
              <div className='px-4 py-5 sm:p-6 text-center'>
                <Users className='mx-auto h-12 w-12 text-gray-400' />
                <h3 className='mt-2 text-sm font-medium text-gray-900'>Chọn một học sinh</h3>
                <p className='mt-1 text-sm text-gray-500'>
                  Chọn một học sinh từ danh sách để xem chi tiết và gửi tin nhắn.
                </p>
              </div>
            </div>
          )}

          {/* Recent violations for selected student */}
          {selectedStudent && (
            <div className='mt-6 bg-white shadow overflow-hidden sm:rounded-lg'>
              <div className='px-4 py-5 sm:px-6'>
                <h3 className='text-lg leading-6 font-medium text-gray-900'>Recent Violations</h3>
              </div>
              <div className='border-t border-gray-200'>
                {violations.filter(
                  (v) =>
                    v.session_id === selectedStudent ||
                    activeSessions.find((s) => s.session_id === selectedStudent)?.student_id === v.student_id
                ).length > 0 ? (
                  <ul className='divide-y divide-gray-200 max-h-[30vh] overflow-y-auto'>
                    {violations
                      .filter(
                        (v) =>
                          v.session_id === selectedStudent ||
                          activeSessions.find((s) => s.session_id === selectedStudent)?.student_id === v.student_id
                      )
                      .map((violation, index) => (
                        <li key={index} className='px-4 py-3'>
                          <div className='flex justify-between'>
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityColor(violation.severity)}`}
                            >
                              {getViolationTypeName(violation.type)}
                            </span>
                            <span className='text-xs text-gray-500'>
                              {violation.timestamp ? formatRelativeTime(violation.timestamp) : 'Unknown time'}
                            </span>
                          </div>
                        </li>
                      ))}
                  </ul>
                ) : (
                  <div className='py-4 text-center'>
                    <p className='text-sm text-gray-500'>Không có vi phạm nào đối với học sinh này</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExamMonitor
