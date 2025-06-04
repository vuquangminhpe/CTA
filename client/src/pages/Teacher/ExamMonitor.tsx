/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Users,
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  ArrowLeft,
  MessageSquare,
  Shield,
  ArrowRight,
  Activity,
  Zap,
  TrendingUp
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
      toast.success('Tin nhắn gửi tới học sinh')
      setMessageText('')
    } else {
      toast.error('Failed to send message. Check connection.')
    }
  }

  // Handle ending a student's exam
  const handleEndExam = (sessionId: string, studentName: string) => {
    if (
      window.confirm(`Bạn có chắc chắn muốn kết thúc kỳ thi không? ${studentName}? Không thể hoàn tác hành động này.`)
    ) {
      const success = endStudentExam(sessionId, 'Terminated by teacher')
      if (success) {
        toast.success(`Kỳ thi đã kết thúc cho ${studentName}`)
      } else {
        toast.error('Không thể kết thúc kỳ thi. Kiểm tra kết nối.')
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
        return 'bg-red-100 text-red-800 border border-red-200'
      case 'medium':
        return 'bg-orange-100 text-orange-800 border border-orange-200'
      case 'low':
        return 'bg-yellow-100 text-yellow-800 border border-yellow-200'
      default:
        return 'bg-gray-100 text-gray-800 border border-gray-200'
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
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30 flex justify-center items-center'>
        <div className='relative'>
          <div className='w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin'></div>
          <div className='absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full animate-spin animation-delay-150'></div>
        </div>
      </div>
    )
  }

  if (!exam) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30'>
        <div className='relative z-10 max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8'>
          <div className='text-center backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-12 shadow-2xl shadow-blue-500/10'>
            <div className='w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-3xl flex items-center justify-center mx-auto mb-6'>
              <Shield className='w-10 h-10 text-red-600' />
            </div>
            <h2 className='text-3xl font-black text-gray-900 mb-4'>Exam not found</h2>
            <p className='text-xl text-gray-600 mb-8'>The exam you're trying to monitor doesn't exist</p>
            <button
              onClick={() => navigate('/teacher')}
              className='inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-2xl hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 hover:scale-105 font-semibold text-lg'
            >
              <ArrowLeft className='h-6 w-6 mr-3' />
              Back to Dashboard
            </button>
          </div>
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
                  <div className='w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mr-6 shadow-lg'>
                    <Shield className='w-8 h-8 text-white' />
                  </div>
                  <div>
                    <h2 className='text-4xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent'>
                      Giám sát kỳ thi trực tiếp
                    </h2>
                    <div className='flex items-center mt-2 text-lg font-medium'>
                      <span className='text-gray-600'>
                        {exam.title} — Code: {exam.exam_code} —{' '}
                      </span>
                      {isConnected ? (
                        <span className='text-green-600 font-bold ml-2 flex items-center'>
                          <Activity className='w-5 h-5 mr-1' />
                          Đã kết nối
                        </span>
                      ) : (
                        <span className='text-red-600 font-bold ml-2 flex items-center'>
                          <XCircle className='w-5 h-5 mr-1' />
                          Đã ngắt kết nối
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className='flex flex-wrap gap-3'>
                <button
                  onClick={() => window.history.back()}
                  className='inline-flex items-center px-6 py-3 bg-white/80 text-gray-700 border border-gray-200/50 rounded-2xl hover:bg-white hover:shadow-lg transition-all duration-300 font-semibold'
                >
                  <ArrowLeft className='h-5 w-5 mr-2' />
                  Quay lại kì thi chính
                </button>
                <button
                  onClick={handleRefresh}
                  className='inline-flex items-center px-6 py-3 bg-white/80 text-gray-700 border border-gray-200/50 rounded-2xl hover:bg-white hover:shadow-lg transition-all duration-300 font-semibold'
                >
                  <RefreshCw className='h-5 w-5 mr-2' />
                  Làm mới
                </button>
                <button
                  onClick={() => navigate(`/teacher/exams/${examId}`)}
                  className='inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-2xl hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 hover:scale-105 font-semibold'
                >
                  <ArrowRight className='h-5 w-5 mr-2' />
                  Xem bài kiểm tra chi tiết
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
                <p className='text-sm font-semibold text-gray-600 uppercase tracking-wider'>học sinh tham gia</p>
                <p className='text-3xl font-black text-gray-900'>{activeSessions.length}</p>
              </div>
            </div>
          </div>

          <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-6 shadow-xl shadow-green-500/10 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300 hover:scale-105'>
            <div className='flex items-center'>
              <div className='w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg'>
                <CheckCircle className='h-7 w-7 text-white' />
              </div>
              <div className='ml-5 flex-1'>
                <p className='text-sm font-semibold text-gray-600 uppercase tracking-wider'>
                  Đã hoàn thành bài kiểm tra
                </p>
                <p className='text-3xl font-black text-gray-900'>{stats.completed_sessions}</p>
              </div>
            </div>
          </div>

          <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-6 shadow-xl shadow-red-500/10 hover:shadow-2xl hover:shadow-red-500/20 transition-all duration-300 hover:scale-105'>
            <div className='flex items-center'>
              <div className='w-14 h-14 bg-gradient-to-br from-red-500 to-pink-400 rounded-2xl flex items-center justify-center shadow-lg'>
                <AlertTriangle className='h-7 w-7 text-white' />
              </div>
              <div className='ml-5 flex-1'>
                <p className='text-sm font-semibold text-gray-600 uppercase tracking-wider'>Tổng số lỗi vi phạm</p>
                <p className='text-3xl font-black text-gray-900'>{stats.total_violations}</p>
              </div>
            </div>
          </div>

          <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-6 shadow-xl shadow-indigo-500/10 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 hover:scale-105'>
            <div className='flex items-center'>
              <div className='w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-400 rounded-2xl flex items-center justify-center shadow-lg'>
                <TrendingUp className='h-7 w-7 text-white' />
              </div>
              <div className='ml-5 flex-1'>
                <p className='text-sm font-semibold text-gray-600 uppercase tracking-wider'>Điểm trung bình</p>
                <p className='text-3xl font-black text-gray-900'>
                  {stats.average_score ? `${stats.average_score.toFixed(1)}%` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className='backdrop-blur-xl bg-red-50/80 border border-red-200/50 rounded-3xl p-6 mb-8 shadow-xl'>
            <div className='flex items-center'>
              <div className='w-12 h-12 bg-gradient-to-br from-red-500 to-pink-400 rounded-2xl flex items-center justify-center mr-4'>
                <XCircle className='h-6 w-6 text-white' />
              </div>
              <div>
                <h3 className='text-lg font-bold text-red-800'>Lỗi kết nối</h3>
                <p className='text-red-700 mt-1'>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Modern Tabs */}
        <div className='mb-8'>
          <div className='backdrop-blur-xl bg-white/60 border border-white/20 rounded-2xl p-2 shadow-xl'>
            <div className='flex gap-2'>
              <button
                onClick={() => setActiveTab('students')}
                className={`flex-1 flex items-center justify-center px-6 py-4 rounded-xl transition-all duration-300 font-semibold ${
                  activeTab === 'students'
                    ? 'bg-white shadow-lg text-blue-600 scale-105'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <Users className='h-5 w-5 mr-2' />
                học sinh tham gia ({activeSessions.length})
              </button>
              <button
                onClick={() => setActiveTab('violations')}
                className={`flex-1 flex items-center justify-center px-6 py-4 rounded-xl transition-all duration-300 font-semibold ${
                  activeTab === 'violations'
                    ? 'bg-white shadow-lg text-blue-600 scale-105'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <AlertTriangle className='h-5 w-5 mr-2' />
                Tổng lỗi vi phạm ({violations.length})
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Left panel - Students or Violations list */}
          <div className='lg:col-span-2'>
            {activeTab === 'students' ? (
              <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-2xl shadow-blue-500/10 overflow-hidden'>
                <div className='px-8 py-6 bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-b border-white/20'>
                  <h3 className='text-2xl font-bold text-gray-900'>Số học sinh tham gia</h3>
                </div>
                <div className='max-h-[70vh] overflow-y-auto'>
                  {activeSessions.length > 0 ? (
                    <div className='divide-y divide-gray-200/50'>
                      {activeSessions.map((session, index) => (
                        <div
                          key={session.session_id}
                          className={`px-8 py-6 hover:bg-white/50 cursor-pointer transition-all duration-300 ${
                            selectedStudent === session.session_id ? 'bg-blue-50/50 border-l-4 border-blue-500' : ''
                          }`}
                          onClick={() => setSelectedStudent(session.session_id)}
                        >
                          <div className='flex items-center justify-between'>
                            <div className='flex items-center'>
                              <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4'>
                                <span className='text-white font-bold'>{index + 1}</span>
                              </div>
                              <div
                                className={`h-3 w-3 rounded-full mr-4 ${session.active ? 'bg-green-500' : 'bg-gray-400'}`}
                              ></div>
                              <div>
                                <h4 className='text-lg font-bold text-gray-900'>{session.student_name}</h4>
                                <p className='text-gray-600 font-medium'>{session.student_username}</p>
                              </div>
                            </div>

                            <div className='flex items-center gap-3'>
                              {session.violations > 0 && (
                                <span className='px-4 py-2 bg-red-100 text-red-800 border border-red-200 rounded-2xl text-sm font-bold'>
                                  {session.violations} violations
                                </span>
                              )}
                            </div>
                          </div>

                          <div className='mt-4 flex justify-between items-center text-gray-600'>
                            <div className='flex items-center'>
                              <Clock className='h-5 w-5 mr-2' />
                              <span className='font-medium'>Started {formatRelativeTime(session.start_time)}</span>
                            </div>
                            <div className='flex space-x-3'>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEndExam(session.session_id, session.student_name)
                                }}
                                className='p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all duration-300'
                                title='End exam'
                              >
                                <XCircle className='h-5 w-5' />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='py-16 text-center'>
                      <div className='w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6'>
                        <Users className='w-10 h-10 text-gray-400' />
                      </div>
                      <h3 className='text-xl font-bold text-gray-900 mb-2'>Không có học sinh tham gia</h3>
                      <p className='text-gray-600'>Hiện tại không có học sinh nào tham gia kỳ thi này.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-2xl shadow-red-500/10 overflow-hidden'>
                <div className='px-8 py-6 bg-gradient-to-r from-red-50/50 to-pink-50/50 border-b border-white/20'>
                  <h3 className='text-2xl font-bold text-gray-900'>Vi phạm gần đây</h3>
                  <p className='text-gray-600 font-medium mt-1'>Nhật ký vi phạm của học sinh trong kỳ thi này.</p>
                </div>
                <div className='max-h-[70vh] overflow-y-auto'>
                  {violations.length > 0 ? (
                    <div className='divide-y divide-gray-200/50'>
                      {violations.map((violation, index) => (
                        <div key={index} className='px-8 py-6 hover:bg-white/50 transition-all duration-300'>
                          <div className='flex items-center justify-between mb-4'>
                            <p className='text-lg font-bold text-gray-900'>{violation.student_name}</p>
                            <span
                              className={`px-4 py-2 text-sm font-bold rounded-2xl ${getSeverityColor(violation.severity)}`}
                            >
                              {violation.severity.charAt(0).toUpperCase() + violation.severity.slice(1)}
                            </span>
                          </div>
                          <div className='flex justify-between items-center'>
                            <div className='flex items-center text-gray-600'>
                              <Zap className='h-5 w-5 mr-2' />
                              <span className='font-medium'>{getViolationTypeName(violation.type)}</span>
                            </div>
                            <div className='flex items-center text-gray-500'>
                              <Clock className='h-4 w-4 mr-1' />
                              <span className='text-sm'>
                                {violation.timestamp ? formatRelativeTime(violation.timestamp) : 'Unknown time'}
                              </span>
                            </div>
                          </div>
                          {violation.details && (
                            <div className='mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200'>
                              <div className='text-sm text-gray-600 font-mono'>
                                {typeof violation.details === 'object'
                                  ? JSON.stringify(violation.details).substring(0, 100) + '...'
                                  : String(violation.details).substring(0, 100) + '...'}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='py-16 text-center'>
                      <div className='w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6'>
                        <CheckCircle className='w-10 h-10 text-green-600' />
                      </div>
                      <h3 className='text-xl font-bold text-gray-900 mb-2'>Không vi phạm</h3>
                      <p className='text-gray-600'>Không có vi phạm nào được ghi nhận trong kỳ thi này.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right panel - Student details and message system */}
          <div className='lg:col-span-1'>
            {selectedStudent ? (
              <div className='space-y-6'>
                <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-xl overflow-hidden'>
                  <div className='px-6 py-6 bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-b border-white/20'>
                    <h3 className='text-xl font-bold text-gray-900'>Thông tin chi tiết về học sinh</h3>
                    {activeSessions.find((s) => s.session_id === selectedStudent) && (
                      <p className='text-gray-600 font-medium mt-1'>
                        {activeSessions.find((s) => s.session_id === selectedStudent)?.student_name}
                      </p>
                    )}
                  </div>

                  <div className='p-6'>
                    {activeSessions.find((s) => s.session_id === selectedStudent) ? (
                      <div className='space-y-6'>
                        <div className='backdrop-blur-sm bg-white/50 border border-white/30 rounded-2xl p-4'>
                          <div className='text-sm font-semibold text-gray-600 uppercase tracking-wider mb-1'>
                            Tên học sinh
                          </div>
                          <div className='text-lg font-bold text-gray-900'>
                            {activeSessions.find((s) => s.session_id === selectedStudent)?.student_name}
                          </div>
                        </div>

                        <div className='backdrop-blur-sm bg-white/50 border border-white/30 rounded-2xl p-4'>
                          <div className='text-sm font-semibold text-gray-600 uppercase tracking-wider mb-1'>
                            Tên đăng nhập
                          </div>
                          <div className='text-lg font-bold text-gray-900'>
                            {activeSessions.find((s) => s.session_id === selectedStudent)?.student_username}
                          </div>
                        </div>

                        <div className='backdrop-blur-sm bg-white/50 border border-white/30 rounded-2xl p-4'>
                          <div className='text-sm font-semibold text-gray-600 uppercase tracking-wider mb-1'>
                            Thời gian bắt đầu
                          </div>
                          <div className='text-lg font-bold text-gray-900'>
                            {new Date(
                              activeSessions.find((s) => s.session_id === selectedStudent)?.start_time as string
                            ).toLocaleString()}
                          </div>
                        </div>

                        <div className='backdrop-blur-sm bg-white/50 border border-white/30 rounded-2xl p-4'>
                          <div className='text-sm font-semibold text-gray-600 uppercase tracking-wider mb-1'>
                            lỗi vi phạm
                          </div>
                          <span
                            className={`px-4 py-2 text-sm font-bold rounded-2xl ${
                              activeSessions.find((s) => s.session_id === selectedStudent)?.violations || 0 > 0
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-green-100 text-green-800 border border-green-200'
                            }`}
                          >
                            {activeSessions.find((s) => s.session_id === selectedStudent)?.violations || 0} vi phạm
                          </span>
                        </div>

                        <div className='backdrop-blur-sm bg-white/50 border border-white/30 rounded-2xl p-4'>
                          <div className='text-sm font-semibold text-gray-600 uppercase tracking-wider mb-1'>
                            Status
                          </div>
                          <span
                            className={`px-4 py-2 text-sm font-bold rounded-2xl ${
                              activeSessions.find((s) => s.session_id === selectedStudent)?.active
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            }`}
                          >
                            {activeSessions.find((s) => s.session_id === selectedStudent)?.active
                              ? 'Active'
                              : 'Inactive or Disconnected'}
                          </span>
                        </div>

                        <div className='backdrop-blur-sm bg-white/50 border border-white/30 rounded-2xl p-4'>
                          <div className='text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3'>
                            Gửi tin nhắn
                          </div>
                          <textarea
                            rows={3}
                            className='w-full p-3 bg-white/80 backdrop-blur border border-gray-200/50 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 resize-none'
                            placeholder='Type a message to send to the student...'
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                          />
                          <button
                            onClick={handleSendMessage}
                            disabled={!messageText.trim()}
                            className='mt-3 w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-xl hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
                          >
                            <MessageSquare className='h-5 w-5 inline-block mr-2' />
                            Gửi tin nhắn
                          </button>
                        </div>

                        <div className='backdrop-blur-sm bg-white/50 border border-white/30 rounded-2xl p-4'>
                          <div className='text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3'>
                            hành động
                          </div>
                          <button
                            onClick={() =>
                              handleEndExam(
                                selectedStudent,
                                activeSessions.find((s) => s.session_id === selectedStudent)?.student_name ||
                                  'this student'
                              )
                            }
                            className='w-full px-4 py-3 bg-gradient-to-r from-red-500 to-pink-400 text-white rounded-xl hover:from-red-600 hover:to-pink-500 transition-all duration-300 shadow-lg hover:shadow-red-500/25 font-semibold'
                          >
                            <XCircle className='h-5 w-5 inline-block mr-2' />
                            Kết thúc kỳ thi dành cho học sinh
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className='py-8 text-center'>
                        <p className='text-gray-600'>học sinh không còn hoạt động</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent violations for selected student */}
                <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-xl overflow-hidden'>
                  <div className='px-6 py-4 bg-gradient-to-r from-red-50/50 to-pink-50/50 border-b border-white/20'>
                    <h3 className='text-lg font-bold text-gray-900'>Recent Violations</h3>
                  </div>
                  <div className='max-h-[40vh] overflow-y-auto'>
                    {violations.filter(
                      (v) =>
                        v.session_id === selectedStudent ||
                        activeSessions.find((s) => s.session_id === selectedStudent)?.student_id === v.student_id
                    ).length > 0 ? (
                      <div className='divide-y divide-gray-200/50'>
                        {violations
                          .filter(
                            (v) =>
                              v.session_id === selectedStudent ||
                              activeSessions.find((s) => s.session_id === selectedStudent)?.student_id === v.student_id
                          )
                          .map((violation, index) => (
                            <div key={index} className='px-6 py-4 hover:bg-white/50 transition-all duration-300'>
                              <div className='flex justify-between items-center'>
                                <span
                                  className={`px-3 py-1 text-xs font-bold rounded-2xl ${getSeverityColor(violation.severity)}`}
                                >
                                  {getViolationTypeName(violation.type)}
                                </span>
                                <span className='text-xs text-gray-500 font-medium'>
                                  {violation.timestamp ? formatRelativeTime(violation.timestamp) : 'Unknown time'}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className='py-8 text-center'>
                        <div className='w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-4'>
                          <CheckCircle className='w-8 h-8 text-green-600' />
                        </div>
                        <p className='text-gray-600 font-medium'>Không có vi phạm nào đối với học sinh này</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-xl'>
                <div className='px-6 py-12 text-center'>
                  <div className='w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6'>
                    <Users className='w-10 h-10 text-gray-400' />
                  </div>
                  <h3 className='text-xl font-bold text-gray-900 mb-2'>Chọn một học sinh</h3>
                  <p className='text-gray-600'>Chọn một học sinh từ danh sách để xem chi tiết và gửi tin nhắn.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExamMonitor
