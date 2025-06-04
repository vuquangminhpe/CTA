/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  ArrowLeft,
  Shield,
  XCircle,
  MessageSquare,
  BarChart,
  CheckCircle,
  GraduationCap,
  FileText,
  Activity,
  TrendingUp,
  Zap,
  Target
} from 'lucide-react'
import { toast } from 'sonner'
import examApi from '../../apis/exam.api'
import configBase from '../../constants/config'
import io from 'socket.io-client'

interface StudentSession {
  session_id: string
  student_id: string
  student_name: string
  student_username: string
  exam_id: string
  exam_title: string
  exam_code?: string
  start_time: string
  violations: number
  active: boolean
  last_activity?: Date
  score?: number
  completed?: boolean
}

interface CompletedSession {
  session_id: string
  student_id: string
  student_name: string
  student_username: string
  exam_id: string
  exam_title: string
  exam_code?: string
  start_time: string
  end_time?: string
  violations: number
  score: number
  completed: boolean
}

interface Violation {
  session_id: string
  student_id: string
  student_name: string
  student_username: string
  exam_id: string
  type: string
  severity: 'low' | 'medium' | 'high'
  details?: any
  timestamp: string
}

const MonitoringDashboard = () => {
  const navigate = useNavigate()
  const [activeSessions, setActiveSessions] = useState<StudentSession[]>([])
  const [completedSessions, setCompletedSessions] = useState<CompletedSession[]>([])
  const [violations, setViolations] = useState<Violation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedExam, setSelectedExam] = useState<string | null>(null)
  const [exams, setExams] = useState<any[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const [stats, setStats] = useState({
    totalActive: 0,
    totalViolations: 0,
    examsInProgress: 0
  })
  const [selectedSession, setSelectedSession] = useState<string | null>(null)
  const [messageText, setMessageText] = useState('')
  const [activeTab, setActiveTab] = useState<'students' | 'violations' | 'scores'>('students')

  // Referencias para el socket y exámenes para evitar problemas de cierre
  const socketRef = useRef<any>(null)
  const examsRef = useRef<any[]>([])

  // Actualizaciones de estado consistentes
  const activeSessionsRef = useRef<StudentSession[]>([])
  const completedSessionsRef = useRef<CompletedSession[]>([])
  const violationsRef = useRef<Violation[]>([])

  // Fetch all exams when component mounts
  useEffect(() => {
    const fetchExams = async () => {
      try {
        const response = await examApi.getExams()
        const examsData = response.data.result
        setExams(examsData)
        examsRef.current = examsData
      } catch (error) {
        console.error('Failed to fetch exams:', error)
        toast.error('Không thể tải được danh sách bài thi')
      }
    }

    fetchExams()
  }, [])

  // Initialize socket connection - Este useEffect se ejecuta solo una vez
  useEffect(() => {
    const token = localStorage.getItem('access_token')

    // Función para crear y configurar el socket
    const setupSocket = () => {
      // Limpiar socket anterior si existe
      if (socketRef.current) {
        socketRef.current.disconnect()
      }

      // Inicializar socket
      const newSocket = io(configBase.baseURL, {
        auth: { token },
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        timeout: 20000
      })

      // Almacenar el socket en la referencia
      socketRef.current = newSocket

      // Configurar eventos
      newSocket.on('connect', () => {
        setIsConnected(true)
        setIsLoading(false)
        // Solicitar datos iniciales
        newSocket.emit('get_all_active_sessions')
      })

      newSocket.on('disconnect', () => {
        setIsConnected(false)
      })

      newSocket.on('connect_error', (error: any) => {
        setIsLoading(false)
      })

      // Manejar datos de todas las sesiones activas
      newSocket.on('all_active_sessions', (data: { sessions: StudentSession[]; violations: Violation[] }) => {
        if (!data) return

        // Separar sesiones activas y completadas
        const active = Array.isArray(data.sessions) ? data.sessions.filter((s) => !s.completed) : []
        const completed = Array.isArray(data.sessions)
          ? (data.sessions.filter((s) => s.completed) as CompletedSession[])
          : []

        // Actualizar referencias
        activeSessionsRef.current = active
        completedSessionsRef.current = completed
        violationsRef.current = Array.isArray(data.violations) ? data.violations : []

        // Actualizar estado
        setActiveSessions(active)
        setCompletedSessions(completed)
        setViolations(Array.isArray(data.violations) ? data.violations : [])

        // Actualizar estadísticas
        setStats({
          totalActive: active.length,
          totalViolations: Array.isArray(data.violations) ? data.violations.length : 0,
          examsInProgress: new Set(Array.isArray(data.sessions) ? data.sessions.map((s) => s.exam_id) : []).size
        })
      })

      // Manejar nuevo estudiante uniéndose a un examen
      newSocket.on('student_joined', (data: any) => {
        if (!data || !data.session_id) return

        // Buscar información del examen
        const exam = examsRef.current.find((e) => e._id === data.exam_id)

        // Crear nueva sesión
        const newSession: StudentSession = {
          session_id: data.session_id,
          student_id: data.student_id,
          student_name: data.student_name,
          student_username: data.student_username,
          exam_id: data.exam_id,
          exam_title: exam?.title || 'Unknown Exam',
          exam_code: exam?.exam_code,
          start_time: data.start_time,
          violations: data.violations || 0,
          active: true
        }

        // Actualizar lista de sesiones activas
        const updatedSessions = [newSession, ...activeSessionsRef.current]
        activeSessionsRef.current = updatedSessions
        setActiveSessions(updatedSessions)

        // Actualizar estadísticas
        setStats((prev) => ({
          ...prev,
          totalActive: prev.totalActive + 1,
          examsInProgress: new Set([...activeSessionsRef.current.map((s) => s.exam_id)]).size
        }))
      })

      // Manejar desconexión de estudiante
      newSocket.on('student_disconnected', (data: any) => {
        if (!data || !data.session_id) return

        // Actualizar estado de sesión a inactivo
        const updatedSessions = activeSessionsRef.current.map((session) =>
          session.session_id === data.session_id ? { ...session, active: false } : session
        )

        activeSessionsRef.current = updatedSessions
        setActiveSessions(updatedSessions)
      })

      // Manejar envío de examen
      newSocket.on('student_submitted', (data: any) => {
        if (!data || !data.session_id) return

        // Encontrar la sesión activa
        const activeSession = activeSessionsRef.current.find((s) => s.session_id === data.session_id)

        if (activeSession) {
          // Mover de activa a completada
          const newCompletedSession: CompletedSession = {
            ...activeSession,
            score: data.score,
            completed: true,
            end_time: new Date().toISOString()
          }

          // Actualizar listas
          const updatedActiveSessions = activeSessionsRef.current.filter((s) => s.session_id !== data.session_id)
          const updatedCompletedSessions = [newCompletedSession, ...completedSessionsRef.current]

          // Actualizar referencias
          activeSessionsRef.current = updatedActiveSessions
          completedSessionsRef.current = updatedCompletedSessions

          // Actualizar estado
          setActiveSessions(updatedActiveSessions)
          setCompletedSessions(updatedCompletedSessions)

          // Actualizar estadísticas
          setStats((prev) => ({
            ...prev,
            totalActive: prev.totalActive - 1
          }))
        }
      })

      // Manejar nuevas violaciones
      newSocket.on('violation_recorded', (data: any) => {
        if (!data || !data.session_id) return

        // Encontrar la sesión correspondiente
        const session = activeSessionsRef.current.find((s) => s.session_id === data.session_id)

        if (session) {
          // Crear registro de violación
          const newViolation: Violation = {
            session_id: data.session_id,
            student_id: session.student_id,
            student_name: session.student_name,
            student_username: session.student_username,
            exam_id: session.exam_id,
            type: data.type,
            severity: data.severity || 'medium',
            details: data.details,
            timestamp: new Date().toISOString()
          }

          // Actualizar lista de violaciones
          const updatedViolations = [newViolation, ...violationsRef.current]
          violationsRef.current = updatedViolations
          setViolations(updatedViolations)

          // Actualizar conteo de violaciones en la sesión correspondiente
          const violations = data.violations || session.violations + 1
          const updatedSessions = activeSessionsRef.current.map((s) =>
            s.session_id === data.session_id ? { ...s, violations } : s
          )

          activeSessionsRef.current = updatedSessions
          setActiveSessions(updatedSessions)

          // Actualizar estadísticas
          setStats((prev) => ({
            ...prev,
            totalViolations: prev.totalViolations + 1
          }))
        }
      })

      // Conectar socket
      newSocket.connect()

      return newSocket
    }

    // Configurar socket inicial
    const socket = setupSocket()

    // Limpiar al desmontar
    return () => {
      if (socket) {
        // Eliminar todos los listeners
        socket.off('connect')
        socket.off('disconnect')
        socket.off('connect_error')
        socket.off('all_active_sessions')
        socket.off('student_joined')
        socket.off('student_disconnected')
        socket.off('student_submitted')
        socket.off('violation_recorded')

        // Desconectar socket
        socket.disconnect()
      }
    }
  }, []) // Sin dependencias para que se ejecute solo una vez

  // Configurar actualización periódica cada 15 segundos
  useEffect(() => {
    // Función para solicitar datos
    const refreshData = () => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('get_all_active_sessions')
      }
    }

    // Configurar intervalo
    const intervalId = setInterval(refreshData, 15000)

    // Limpiar al desmontar
    return () => {
      clearInterval(intervalId)
    }
  }, [])

  // Filter sessions based on search term and selected exam
  const filteredActiveSessions = activeSessions.filter((session) => {
    const matchesSearch =
      session.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.student_username?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesExam = !selectedExam || session.exam_id === selectedExam

    return matchesSearch && matchesExam
  })

  // Filter completed sessions
  const filteredCompletedSessions = completedSessions.filter((session) => {
    const matchesSearch =
      session.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.student_username?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesExam = !selectedExam || session.exam_id === selectedExam

    return matchesSearch && matchesExam
  })

  // Combined list for scores tab (both active and completed sessions)
  const allSessions = [...filteredCompletedSessions, ...filteredActiveSessions]

  // Get violations for a specific session
  const getSessionViolations = (sessionId: string) => {
    return violations
      .filter((v) => v.session_id === sessionId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  // Calculate time elapsed since start
  const getElapsedTime = (startTime: string) => {
    const start = new Date(startTime).getTime()
    const now = new Date().getTime()
    const elapsed = now - start

    const minutes = Math.floor(elapsed / (1000 * 60))
    const seconds = Math.floor((elapsed % (1000 * 60)) / 1000)

    return `${minutes}m ${seconds}s`
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

  // Handle sending a message to a student
  const handleSendMessage = () => {
    if (!selectedSession || !messageText.trim() || !socketRef.current) return

    socketRef.current.emit('teacher_message', { session_id: selectedSession, message: messageText.trim() })
    toast.success('Message sent to student')
    setMessageText('')
  }

  // Handle ending a student's exam
  const handleEndExam = (sessionId: string, studentName: string) => {
    if (!socketRef.current) return

    if (window.confirm(`Bạn có chắc chắn muốn kết thúc kỳ thi của ${studentName}? Không thể hoàn tác hành động này.`)) {
      // Send termination event to student with reason
      socketRef.current.emit('end_student_exam', {
        session_id: sessionId,
        reason: 'Bị giáo viên chấm dứt'
      })

      toast.success(`Kỳ thi đã kết thúc cho ${studentName}`)

      // Remove from active sessions immediately in the UI
      const updatedSessions = activeSessionsRef.current.filter((s) => s.session_id !== sessionId)
      activeSessionsRef.current = updatedSessions
      setActiveSessions(updatedSessions)

      // Update stats
      setStats((prev) => ({
        ...prev,
        totalActive: prev.totalActive - 1
      }))
    }
  }

  useEffect(() => {
    // Function to refresh data
    const autoRefresh = () => {
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('get_all_active_sessions')
        // No toast message here to avoid flooding the UI
      }
    }

    // Setup the first timeout
    const timeoutId = setTimeout(autoRefresh, 3000)

    // Recursive function to continue refreshing
    const setupRecursiveRefresh = () => {
      const nextTimeoutId = setTimeout(() => {
        autoRefresh()
        setupRecursiveRefresh()
      }, 1000)

      // Store the timeout ID in a ref to clean it up later
      return nextTimeoutId
    }

    // Start the recursive refresh after the first timeout
    const recursiveTimeoutId = setupRecursiveRefresh()

    // Clean up on unmount
    return () => {
      clearTimeout(timeoutId)
      clearTimeout(recursiveTimeoutId)
    }
  }, []) // Empty dependency array means this runs once on mount

  // Handle refresh data
  const handleRefresh = () => {
    if (!socketRef.current) return

    socketRef.current.emit('get_all_active_sessions')
    toast.success('Refreshing data...')
  }

  // Format score as a number (not percentage)
  const formatScore = (score: number) => {
    return (score / 100).toFixed(2)
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
                      Bảng điều khiển giám sát
                    </h2>
                    <div className='flex items-center mt-2 text-lg font-medium'>
                      <span className='text-gray-600'>Theo dõi các kỳ thi đang diễn ra và vi phạm — </span>
                      {isConnected ? (
                        <span className='text-green-600 font-bold ml-2 flex items-center'>
                          <Activity className='w-5 h-5 mr-1' />
                          Đã kết nối
                        </span>
                      ) : (
                        <span className='text-red-600 font-bold ml-2 flex items-center'>
                          <XCircle className='w-5 h-5 mr-1' />
                          Mất kết nối
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className='flex flex-wrap gap-3'>
                <button
                  onClick={handleRefresh}
                  className='inline-flex items-center px-6 py-3 bg-white/80 text-gray-700 border border-gray-200/50 rounded-2xl hover:bg-white hover:shadow-lg transition-all duration-300 font-semibold'
                >
                  <RefreshCw className='h-5 w-5 mr-2' />
                  Làm mới
                </button>
                <button
                  onClick={() => navigate('/teacher')}
                  className='inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-2xl hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 hover:scale-105 font-semibold'
                >
                  <ArrowLeft className='h-5 w-5 mr-2' />
                  Quay lại
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Stats Cards */}
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 mb-8'>
          <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-6 shadow-xl shadow-blue-500/10 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:scale-105'>
            <div className='flex items-center'>
              <div className='w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg'>
                <Users className='h-7 w-7 text-white' />
              </div>
              <div className='ml-5 flex-1'>
                <p className='text-sm font-semibold text-gray-600 uppercase tracking-wider'>Học sinh đang thi</p>
                <p className='text-3xl font-black text-gray-900'>{activeSessions.length}</p>
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
                <p className='text-3xl font-black text-gray-900'>{violations.length}</p>
              </div>
            </div>
          </div>

          <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-6 shadow-xl shadow-indigo-500/10 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 hover:scale-105'>
            <div className='flex items-center'>
              <div className='w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-400 rounded-2xl flex items-center justify-center shadow-lg'>
                <TrendingUp className='h-7 w-7 text-white' />
              </div>
              <div className='ml-5 flex-1'>
                <p className='text-sm font-semibold text-gray-600 uppercase tracking-wider'>Bài thi đang diễn ra</p>
                <p className='text-3xl font-black text-gray-900'>{stats.examsInProgress}</p>
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

            {/* Exam filter */}
            <div>
              <label htmlFor='exam-filter' className='block text-lg font-semibold text-gray-700 mb-3'>
                Lọc theo bài thi
              </label>
              <select
                id='exam-filter'
                name='exam-filter'
                className='w-full px-4 py-4 bg-white/80 backdrop-blur border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 text-gray-900 font-medium shadow-sm text-lg'
                value={selectedExam || ''}
                onChange={(e) => setSelectedExam(e.target.value || null)}
              >
                <option value=''>Tất cả bài thi</option>
                {exams.map((exam) => (
                  <option key={exam._id} value={exam._id}>
                    {exam.title} ({exam.exam_code})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

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
                Học sinh đang thi ({filteredActiveSessions.length})
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
                Vi phạm ({violations.length})
              </button>
              <button
                onClick={() => setActiveTab('scores')}
                className={`flex-1 flex items-center justify-center px-6 py-4 rounded-xl transition-all duration-300 font-semibold ${
                  activeTab === 'scores'
                    ? 'bg-white shadow-lg text-blue-600 scale-105'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <GraduationCap className='h-5 w-5 mr-2' />
                Điểm số ({allSessions.length})
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Left panel - Content based on active tab */}
          <div className='lg:col-span-2'>
            {activeTab === 'students' && (
              <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-2xl shadow-blue-500/10 overflow-hidden'>
                <div className='px-8 py-6 bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-b border-white/20'>
                  <h3 className='text-2xl font-bold text-gray-900'>Số học sinh tham gia</h3>
                </div>
                <div className='max-h-[70vh] overflow-y-auto'>
                  {isLoading ? (
                    <div className='py-16 text-center'>
                      <div className='relative mx-auto w-12 h-12'>
                        <div className='w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin'></div>
                        <div className='absolute inset-0 w-12 h-12 border-4 border-transparent border-t-purple-600 rounded-full animate-spin animation-delay-150'></div>
                      </div>
                      <p className='mt-4 text-gray-600 font-medium'>Đang tải dữ liệu...</p>
                    </div>
                  ) : filteredActiveSessions.length > 0 ? (
                    <div className='divide-y divide-gray-200/50'>
                      {filteredActiveSessions.map((session, index) => (
                        <div
                          key={session.session_id}
                          className={`px-8 py-6 hover:bg-white/50 cursor-pointer transition-all duration-300 ${
                            selectedSession === session.session_id ? 'bg-blue-50/50 border-l-4 border-blue-500' : ''
                          }`}
                          onClick={() => setSelectedSession(session.session_id)}
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
                                  {session.violations} vi phạm
                                </span>
                              )}
                            </div>
                          </div>

                          <div className='mt-4 text-gray-600'>
                            <div className='mb-2'>
                              <span className='font-semibold'>Bài thi:</span> {session.exam_title}
                            </div>
                            <div className='flex justify-between items-center'>
                              <div className='flex items-center'>
                                <Clock className='h-5 w-5 mr-2' />
                                <span className='font-medium'>{getElapsedTime(session.start_time)}</span>
                              </div>
                              <div className='flex space-x-3'>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleEndExam(session.session_id, session.student_name)
                                  }}
                                  className='p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200 transition-all duration-300'
                                  title='Kết thúc bài thi'
                                >
                                  <XCircle className='h-5 w-5' />
                                </button>
                              </div>
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
                      <h3 className='text-xl font-bold text-gray-900 mb-2'>Không có học sinh đang thi</h3>
                      <p className='text-gray-600'>Hiện không có học sinh nào đang tham gia bài thi.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'violations' && (
              <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-2xl shadow-red-500/10 overflow-hidden'>
                <div className='px-8 py-6 bg-gradient-to-r from-red-50/50 to-pink-50/50 border-b border-white/20'>
                  <h3 className='text-2xl font-bold text-gray-900'>Vi phạm gần đây</h3>
                  <p className='text-gray-600 font-medium mt-1'>Nhật ký vi phạm của học sinh trong tất cả kỳ thi.</p>
                </div>
                <div className='max-h-[70vh] overflow-y-auto'>
                  {isLoading ? (
                    <div className='py-16 text-center'>
                      <div className='relative mx-auto w-12 h-12'>
                        <div className='w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin'></div>
                        <div className='absolute inset-0 w-12 h-12 border-4 border-transparent border-t-purple-600 rounded-full animate-spin animation-delay-150'></div>
                      </div>
                      <p className='mt-4 text-gray-600 font-medium'>Đang tải dữ liệu...</p>
                    </div>
                  ) : violations.length > 0 ? (
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
                                {violation.timestamp ? formatDate(violation.timestamp) : 'Unknown time'}
                              </span>
                            </div>
                          </div>
                          <div className='mt-2 text-sm text-gray-600'>
                            <span className='font-semibold'>Bài thi:</span> {violation.exam_id}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className='py-16 text-center'>
                      <div className='w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6'>
                        <CheckCircle className='w-10 h-10 text-green-600' />
                      </div>
                      <h3 className='text-xl font-bold text-gray-900 mb-2'>Không vi phạm</h3>
                      <p className='text-gray-600'>Không có vi phạm nào được ghi nhận.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'scores' && (
              <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-2xl shadow-green-500/10 overflow-hidden'>
                <div className='px-8 py-6 bg-gradient-to-r from-green-50/50 to-blue-50/50 border-b border-white/20'>
                  <h3 className='text-2xl font-bold text-gray-900'>Danh sách điểm học sinh</h3>
                  <p className='text-gray-600 font-medium mt-1'>Điểm số của học sinh trong tất cả kỳ thi.</p>
                </div>
                <div className='max-h-[70vh] overflow-y-auto'>
                  {isLoading ? (
                    <div className='py-16 text-center'>
                      <div className='relative mx-auto w-12 h-12'>
                        <div className='w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin'></div>
                        <div className='absolute inset-0 w-12 h-12 border-4 border-transparent border-t-purple-600 rounded-full animate-spin animation-delay-150'></div>
                      </div>
                      <p className='mt-4 text-gray-600 font-medium'>Đang tải dữ liệu...</p>
                    </div>
                  ) : allSessions.length > 0 ? (
                    <div className='overflow-x-auto'>
                      <table className='min-w-full'>
                        <thead className='bg-gradient-to-r from-gray-50 to-blue-50'>
                          <tr>
                            <th className='px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider'>
                              Tên học sinh
                            </th>
                            <th className='px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider'>
                              Mã bài thi
                            </th>
                            <th className='px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider'>
                              Số lỗi
                            </th>
                            <th className='px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider'>
                              Điểm số
                            </th>
                            <th className='px-6 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider'>
                              Trạng thái
                            </th>
                          </tr>
                        </thead>
                        <tbody className='divide-y divide-gray-200/50'>
                          {allSessions.map((session: any) => (
                            <tr
                              key={session.session_id}
                              className='hover:bg-white/50 cursor-pointer transition-all duration-300'
                              onClick={() => setSelectedSession(session.session_id)}
                            >
                              <td className='px-6 py-4'>
                                <div className='text-lg font-bold text-gray-900'>{session.student_name}</div>
                                <div className='text-sm text-gray-600'>{session.student_username}</div>
                              </td>
                              <td className='px-6 py-4 text-gray-600 font-medium'>{session.exam_code || 'N/A'}</td>
                              <td className='px-6 py-4'>
                                <span
                                  className={`px-3 py-1 text-sm font-bold rounded-2xl ${
                                    session.violations > 0
                                      ? 'bg-red-100 text-red-800 border border-red-200'
                                      : 'bg-green-100 text-green-800 border border-green-200'
                                  }`}
                                >
                                  {session.violations}
                                </span>
                              </td>
                              <td className='px-6 py-4'>
                                <div
                                  className={`text-lg font-bold ${
                                    session.completed
                                      ? session.score >= 70
                                        ? 'text-green-600'
                                        : session.score >= 50
                                          ? 'text-yellow-600'
                                          : 'text-red-600'
                                      : 'text-gray-500'
                                  }`}
                                >
                                  {session.completed ? formatScore(session.score) : 'Đang thi'}
                                </div>
                              </td>
                              <td className='px-6 py-4'>
                                <span
                                  className={`px-3 py-1 text-sm font-bold rounded-2xl ${
                                    session.completed
                                      ? 'bg-green-100 text-green-800 border border-green-200'
                                      : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                  }`}
                                >
                                  {session.completed ? 'Hoàn thành' : 'Đang làm bài'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className='py-16 text-center'>
                      <div className='w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6'>
                        <FileText className='w-10 h-10 text-gray-400' />
                      </div>
                      <h3 className='text-xl font-bold text-gray-900 mb-2'>Không có dữ liệu</h3>
                      <p className='text-gray-600'>Chưa có học sinh nào làm bài thi.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right panel - Student details and message system */}
          <div className='lg:col-span-1'>
            {selectedSession ? (
              <div className='space-y-6'>
                <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-xl overflow-hidden'>
                  <div className='px-6 py-6 bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-b border-white/20'>
                    <h3 className='text-xl font-bold text-gray-900'>Thông tin chi tiết về học sinh</h3>
                    {(activeSessions.find((s) => s.session_id === selectedSession) ||
                      completedSessions.find((s) => s.session_id === selectedSession)) && (
                      <p className='text-gray-600 font-medium mt-1'>
                        {
                          (
                            activeSessions.find((s) => s.session_id === selectedSession) ||
                            completedSessions.find((s) => s.session_id === selectedSession)
                          )?.student_name
                        }
                      </p>
                    )}
                  </div>

                  <div className='p-6'>
                    {activeSessions.find((s) => s.session_id === selectedSession) ||
                    completedSessions.find((s) => s.session_id === selectedSession) ? (
                      <div className='space-y-6'>
                        <div className='backdrop-blur-sm bg-white/50 border border-white/30 rounded-2xl p-4'>
                          <div className='text-sm font-semibold text-gray-600 uppercase tracking-wider mb-1'>
                            Tên học sinh
                          </div>
                          <div className='text-lg font-bold text-gray-900'>
                            {(
                              activeSessions.find((s) => s.session_id === selectedSession) ||
                              completedSessions.find((s) => s.session_id === selectedSession)
                            )?.student_name || 'Unknown'}
                          </div>
                        </div>

                        <div className='backdrop-blur-sm bg-white/50 border border-white/30 rounded-2xl p-4'>
                          <div className='text-sm font-semibold text-gray-600 uppercase tracking-wider mb-1'>
                            Tên đăng nhập
                          </div>
                          <div className='text-lg font-bold text-gray-900'>
                            {
                              (
                                activeSessions.find((s) => s.session_id === selectedSession) ||
                                completedSessions.find((s) => s.session_id === selectedSession)
                              )?.student_username
                            }
                          </div>
                        </div>

                        <div className='backdrop-blur-sm bg-white/50 border border-white/30 rounded-2xl p-4'>
                          <div className='text-sm font-semibold text-gray-600 uppercase tracking-wider mb-1'>
                            Bài thi
                          </div>
                          <div className='text-lg font-bold text-gray-900'>
                            {
                              (
                                activeSessions.find((s) => s.session_id === selectedSession) ||
                                completedSessions.find((s) => s.session_id === selectedSession)
                              )?.exam_title
                            }
                          </div>
                        </div>

                        <div className='backdrop-blur-sm bg-white/50 border border-white/30 rounded-2xl p-4'>
                          <div className='text-sm font-semibold text-gray-600 uppercase tracking-wider mb-1'>
                            Thời gian bắt đầu
                          </div>
                          <div className='text-lg font-bold text-gray-900'>
                            {formatDate(
                              (
                                activeSessions.find((s) => s.session_id === selectedSession) ||
                                completedSessions.find((s) => s.session_id === selectedSession)
                              )?.start_time as string
                            )}
                          </div>
                        </div>

                        {/* Show end time for completed sessions */}
                        {completedSessions.find((s) => s.session_id === selectedSession)?.end_time && (
                          <div className='backdrop-blur-sm bg-white/50 border border-white/30 rounded-2xl p-4'>
                            <div className='text-sm font-semibold text-gray-600 uppercase tracking-wider mb-1'>
                              Thời gian kết thúc
                            </div>
                            <div className='text-lg font-bold text-gray-900'>
                              {formatDate(
                                completedSessions.find((s) => s.session_id === selectedSession)?.end_time as string
                              )}
                            </div>
                          </div>
                        )}

                        <div className='backdrop-blur-sm bg-white/50 border border-white/30 rounded-2xl p-4'>
                          <div className='text-sm font-semibold text-gray-600 uppercase tracking-wider mb-1'>
                            Số vi phạm
                          </div>
                          <span
                            className={`px-4 py-2 text-sm font-bold rounded-2xl ${
                              ((
                                activeSessions.find((s) => s.session_id === selectedSession) ||
                                completedSessions.find((s) => s.session_id === selectedSession)
                              )?.violations || 0) > 0
                                ? 'bg-red-100 text-red-800 border border-red-200'
                                : 'bg-green-100 text-green-800 border border-green-200'
                            }`}
                          >
                            {(
                              activeSessions.find((s) => s.session_id === selectedSession) ||
                              completedSessions.find((s) => s.session_id === selectedSession)
                            )?.violations || 0}{' '}
                            vi phạm
                          </span>
                        </div>

                        {/* Show score for completed sessions */}
                        {completedSessions.find((s) => s.session_id === selectedSession)?.score !== undefined && (
                          <div className='backdrop-blur-sm bg-white/50 border border-white/30 rounded-2xl p-4'>
                            <div className='text-sm font-semibold text-gray-600 uppercase tracking-wider mb-1'>
                              Điểm số
                            </div>
                            <span
                              className={`text-2xl font-bold ${
                                (completedSessions.find((s) => s.session_id === selectedSession)?.score || 0) >= 70
                                  ? 'text-green-600'
                                  : (completedSessions.find((s) => s.session_id === selectedSession)?.score || 0) >= 50
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                              }`}
                            >
                              {formatScore(completedSessions.find((s) => s.session_id === selectedSession)?.score || 0)}
                            </span>
                          </div>
                        )}

                        <div className='backdrop-blur-sm bg-white/50 border border-white/30 rounded-2xl p-4'>
                          <div className='text-sm font-semibold text-gray-600 uppercase tracking-wider mb-1'>
                            Trạng thái
                          </div>
                          <span
                            className={`px-4 py-2 text-sm font-bold rounded-2xl ${
                              completedSessions.find((s) => s.session_id === selectedSession)
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : activeSessions.find((s) => s.session_id === selectedSession)?.active
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            }`}
                          >
                            {completedSessions.find((s) => s.session_id === selectedSession)
                              ? 'Hoàn thành'
                              : activeSessions.find((s) => s.session_id === selectedSession)?.active
                                ? 'Đang hoạt động'
                                : 'Không hoạt động hoặc bị ngắt kết nối'}
                          </span>
                        </div>

                        {/* Only show message box and actions for active sessions */}
                        {activeSessions.find((s) => s.session_id === selectedSession) && (
                          <>
                            <div className='backdrop-blur-sm bg-white/50 border border-white/30 rounded-2xl p-4'>
                              <div className='text-sm font-semibold text-gray-600 uppercase tracking-wider mb-3'>
                                Gửi tin nhắn
                              </div>
                              <textarea
                                rows={3}
                                className='w-full p-3 bg-white/80 backdrop-blur border border-gray-200/50 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 resize-none'
                                placeholder='Nhập tin nhắn để gửi cho học sinh...'
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
                                Hành động
                              </div>
                              <button
                                onClick={() =>
                                  handleEndExam(
                                    selectedSession,
                                    activeSessions.find((s) => s.session_id === selectedSession)?.student_name ||
                                      'this student'
                                  )
                                }
                                className='w-full px-4 py-3 bg-gradient-to-r from-red-500 to-pink-400 text-white rounded-xl hover:from-red-600 hover:to-pink-500 transition-all duration-300 shadow-lg hover:shadow-red-500/25 font-semibold'
                              >
                                <XCircle className='h-5 w-5 inline-block mr-2' />
                                Kết thúc bài thi
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className='py-8 text-center'>
                        <p className='text-gray-600 font-medium'>Học sinh không còn hoạt động</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Recent violations for selected student */}
                <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-xl overflow-hidden'>
                  <div className='px-6 py-4 bg-gradient-to-r from-red-50/50 to-pink-50/50 border-b border-white/20'>
                    <h3 className='text-lg font-bold text-gray-900'>Vi phạm gần đây</h3>
                  </div>
                  <div className='max-h-[40vh] overflow-y-auto'>
                    {getSessionViolations(selectedSession).length > 0 ? (
                      <div className='divide-y divide-gray-200/50'>
                        {getSessionViolations(selectedSession).map((violation, index) => (
                          <div key={index} className='px-6 py-4 hover:bg-white/50 transition-all duration-300'>
                            <div className='flex justify-between items-center'>
                              <span
                                className={`px-3 py-1 text-xs font-bold rounded-2xl ${getSeverityColor(violation.severity)}`}
                              >
                                {getViolationTypeName(violation.type)}
                              </span>
                              <span className='text-xs text-gray-500 font-medium'>
                                {formatDate(violation.timestamp)}
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
                  <p className='text-gray-600'>Chọn một học sinh từ danh sách bên trái để xem chi tiết và vi phạm.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MonitoringDashboard
