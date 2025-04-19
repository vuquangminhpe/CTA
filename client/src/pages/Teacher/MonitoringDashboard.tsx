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
  FileText
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
    console.log('Initializing socket connection')
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
        console.log('Socket connected for global monitoring')
        setIsConnected(true)
        setIsLoading(false)
        // Solicitar datos iniciales
        newSocket.emit('get_all_active_sessions')
      })

      newSocket.on('disconnect', () => {
        console.log('Socket disconnected')
        setIsConnected(false)
      })

      newSocket.on('connect_error', (error: any) => {
        console.error('Socket connection error:', error)
        setIsLoading(false)
      })

      // Manejar datos de todas las sesiones activas
      newSocket.on('all_active_sessions', (data: { sessions: StudentSession[]; violations: Violation[] }) => {
        console.log('Received all_active_sessions event:', data)

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
        console.log('Received student_joined event:', data)

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
        console.log('Received student_disconnected event:', data)

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
        console.log('Received student_submitted event:', data)

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
        console.log('Received violation_recorded event:', data)

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
      console.log('Cleaning up socket connection')
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
    console.log('Setting up periodic refresh')

    // Función para solicitar datos
    const refreshData = () => {
      if (socketRef.current && socketRef.current.connected) {
        console.log('Requesting fresh data from server')
        socketRef.current.emit('get_all_active_sessions')
      }
    }

    // Configurar intervalo
    const intervalId = setInterval(refreshData, 15000)

    // Limpiar al desmontar
    return () => {
      console.log('Clearing periodic refresh')
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
      console.log('Clearing auto refresh')
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
    <div className='max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>
      {/* Header */}
      <div className='md:flex md:items-center md:justify-between mb-6'>
        <div className='flex-1 min-w-0'>
          <h2 className='text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate flex items-center'>
            <Shield className='mr-2 h-8 w-8 text-blue-500' />
            Bảng điều khiển giám sát
          </h2>
          <p className='mt-1 text-sm text-gray-500'>
            Theo dõi các kỳ thi đang diễn ra và vi phạm —{' '}
            {isConnected ? (
              <span className='text-green-600 font-medium'>Đã kết nối</span>
            ) : (
              <span className='text-red-600 font-medium'>Mất kết nối</span>
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
            onClick={() => navigate('/teacher')}
            className='inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          >
            <ArrowLeft className='h-4 w-4 mr-2' /> Quay lại
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 mb-6'>
        <div className='bg-white overflow-hidden shadow rounded-lg'>
          <div className='px-4 py-5 sm:p-6'>
            <div className='flex items-center'>
              <div className='flex-shrink-0 bg-blue-100 rounded-md p-3'>
                <Users className='h-6 w-6 text-blue-600' />
              </div>
              <div className='ml-5 w-0 flex-1'>
                <dl>
                  <dt className='text-sm font-medium text-gray-500 truncate'>Học sinh đang thi</dt>
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
              <div className='flex-shrink-0 bg-red-100 rounded-md p-3'>
                <AlertTriangle className='h-6 w-6 text-red-600' />
              </div>
              <div className='ml-5 w-0 flex-1'>
                <dl>
                  <dt className='text-sm font-medium text-gray-500 truncate'>Tổng số vi phạm</dt>
                  <dd>
                    <div className='text-lg font-medium text-gray-900'>{violations.length}</div>
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
                  <dt className='text-sm font-medium text-gray-500 truncate'>Bài thi đang diễn ra</dt>
                  <dd>
                    <div className='text-lg font-medium text-gray-900'>{stats.examsInProgress}</div>
                  </dd>
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

          {/* Exam filter */}
          <div className='sm:col-span-3'>
            <label htmlFor='exam-filter' className='block text-sm font-medium text-gray-700'>
              Lọc theo bài thi
            </label>
            <select
              id='exam-filter'
              name='exam-filter'
              className='mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md'
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

      {/* Tabs */}
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
            onChange={(e) => setActiveTab(e.target.value as 'students' | 'violations' | 'scores')}
          >
            <option value='students'>Học sinh đang thi ({filteredActiveSessions.length})</option>
            <option value='violations'>Vi phạm ({violations.length})</option>
            <option value='scores'>Điểm số ({allSessions.length})</option>
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
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <Users className='h-5 w-5 inline-block mr-2' />
                Học sinh đang thi ({filteredActiveSessions.length})
              </button>
              <button
                onClick={() => setActiveTab('violations')}
                className={`${
                  activeTab === 'violations'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <AlertTriangle className='h-5 w-5 inline-block mr-2' />
                Vi phạm ({violations.length})
              </button>
              <button
                onClick={() => setActiveTab('scores')}
                className={`${
                  activeTab === 'scores'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <GraduationCap className='h-5 w-5 inline-block mr-2' />
                Điểm số ({allSessions.length})
              </button>
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Left panel - Content based on active tab */}
        <div className='lg:col-span-2'>
          {activeTab === 'students' && (
            <div className='bg-white shadow overflow-hidden sm:rounded-lg'>
              <div className='px-4 py-5 sm:px-6 flex justify-between items-center'>
                <h3 className='text-lg leading-6 font-medium text-gray-900'>Số học sinh tham gia</h3>
              </div>
              <div className='border-t border-gray-200'>
                {isLoading ? (
                  <div className='bg-white px-4 py-12 text-center'>
                    <div className='inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600'></div>
                    <p className='mt-2 text-gray-500'>Đang tải dữ liệu...</p>
                  </div>
                ) : filteredActiveSessions.length > 0 ? (
                  <ul className='divide-y divide-gray-200 max-h-[60vh] overflow-y-auto'>
                    {filteredActiveSessions.map((session) => (
                      <li
                        key={session.session_id}
                        className={`px-4 py-4 hover:bg-gray-50 cursor-pointer ${
                          selectedSession === session.session_id ? 'bg-blue-50' : ''
                        }`}
                        onClick={() => setSelectedSession(session.session_id)}
                      >
                        <div className='flex items-start justify-between'>
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
                                {session.violations} vi phạm
                              </span>
                            )}
                          </div>
                        </div>

                        <div className='mt-2 text-sm text-gray-500'>
                          <div>
                            <span className='font-medium'>Bài thi:</span> {session.exam_title}
                          </div>
                          <div className='flex justify-between mt-1'>
                            <div className='flex items-center'>
                              <Clock className='h-4 w-4 inline-block mr-1' />
                              {getElapsedTime(session.start_time)}
                            </div>
                            <div className='flex space-x-2'>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEndExam(session.session_id, session.student_name)
                                }}
                                className='text-red-600 hover:text-red-800'
                                title='Kết thúc bài thi'
                              >
                                <XCircle className='h-4 w-4' />
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className='py-8 text-center'>
                    <Users className='mx-auto h-12 w-12 text-gray-400' />
                    <h3 className='mt-2 text-sm font-medium text-gray-900'>Không có học sinh đang thi</h3>
                    <p className='mt-1 text-sm text-gray-500'>Hiện không có học sinh nào đang tham gia bài thi.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'violations' && (
            <div className='bg-white shadow overflow-hidden sm:rounded-lg'>
              <div className='px-4 py-5 sm:px-6'>
                <h3 className='text-lg leading-6 font-medium text-gray-900'>Vi phạm gần đây</h3>
                <p className='mt-1 text-sm text-gray-500'>Nhật ký vi phạm của học sinh trong tất cả kỳ thi.</p>
              </div>
              <div className='border-t border-gray-200'>
                {isLoading ? (
                  <div className='bg-white px-4 py-12 text-center'>
                    <div className='inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600'></div>
                    <p className='mt-2 text-gray-500'>Đang tải dữ liệu...</p>
                  </div>
                ) : violations.length > 0 ? (
                  <ul className='divide-y divide-gray-200 max-h-[60vh] overflow-y-auto'>
                    {violations.map((violation, index) => (
                      <li key={index} className='px-4 py-4 sm:px-6'>
                        <div className='flex items-center justify-between'>
                          <p className='text-sm font-medium text-gray-900'>{violation.student_name}</p>
                          <div className='ml-2 flex-shrink-0 flex'>
                            <span
                              className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityColor(
                                violation.severity
                              )}`}
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
                            <p>{violation.timestamp ? formatDate(violation.timestamp) : 'Unknown time'}</p>
                          </div>
                        </div>
                        <div className='mt-1 text-xs text-gray-500'>
                          <span className='font-medium'>Bài thi:</span> {violation.exam_id}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className='py-8 text-center'>
                    <CheckCircle className='mx-auto h-12 w-12 text-green-500' />
                    <h3 className='mt-2 text-sm font-medium text-gray-900'>Không vi phạm</h3>
                    <p className='mt-1 text-sm text-gray-500'>Không có vi phạm nào được ghi nhận.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'scores' && (
            <div className='bg-white shadow overflow-hidden sm:rounded-lg'>
              <div className='px-4 py-5 sm:px-6'>
                <h3 className='text-lg leading-6 font-medium text-gray-900'>Danh sách điểm học sinh</h3>
                <p className='mt-1 text-sm text-gray-500'>Điểm số của học sinh trong tất cả kỳ thi.</p>
              </div>
              <div className='border-t border-gray-200'>
                {isLoading ? (
                  <div className='bg-white px-4 py-12 text-center'>
                    <div className='inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600'></div>
                    <p className='mt-2 text-gray-500'>Đang tải dữ liệu...</p>
                  </div>
                ) : allSessions.length > 0 ? (
                  <div className='overflow-x-auto'>
                    <table className='min-w-full divide-y divide-gray-200'>
                      <thead className='bg-gray-50'>
                        <tr>
                          <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            Tên học sinh
                          </th>
                          <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            Mã bài thi
                          </th>
                          <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            Số lỗi
                          </th>
                          <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            Điểm số
                          </th>
                          <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            Trạng thái
                          </th>
                        </tr>
                      </thead>
                      <tbody className='bg-white divide-y divide-gray-200'>
                        {allSessions.map((session: any) => (
                          <tr
                            key={session.session_id}
                            className='hover:bg-gray-50 cursor-pointer'
                            onClick={() => setSelectedSession(session.session_id)}
                          >
                            <td className='px-4 py-3 whitespace-nowrap'>
                              <div className='text-sm font-medium text-gray-900'>{session.student_name}</div>
                              <div className='text-xs text-gray-500'>{session.student_username}</div>
                            </td>
                            <td className='px-4 py-3 whitespace-nowrap text-sm text-gray-500'>
                              {session.exam_code || 'N/A'}
                            </td>
                            <td className='px-4 py-3 whitespace-nowrap'>
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  session.violations > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {session.violations}
                              </span>
                            </td>
                            <td className='px-4 py-3 whitespace-nowrap'>
                              <div
                                className={`text-sm font-medium ${
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
                            <td className='px-4 py-3 whitespace-nowrap'>
                              <span
                                className={`px-2 py-1 text-xs rounded-full ${
                                  session.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
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
                  <div className='py-8 text-center'>
                    <FileText className='mx-auto h-12 w-12 text-gray-400' />
                    <h3 className='mt-2 text-sm font-medium text-gray-900'>Không có dữ liệu</h3>
                    <p className='mt-1 text-sm text-gray-500'>Chưa có học sinh nào làm bài thi.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right panel - Student details and message system */}
        <div className='lg:col-span-1'>
          {selectedSession ? (
            <>
              <div className='bg-white shadow overflow-hidden sm:rounded-lg mb-6'>
                <div className='px-4 py-5 sm:px-6'>
                  <h3 className='text-lg leading-6 font-medium text-gray-900'>Thông tin chi tiết về học sinh</h3>
                  {(activeSessions.find((s) => s.session_id === selectedSession) ||
                    completedSessions.find((s) => s.session_id === selectedSession)) && (
                    <p className='mt-1 text-sm text-gray-500'>
                      {
                        (
                          activeSessions.find((s) => s.session_id === selectedSession) ||
                          completedSessions.find((s) => s.session_id === selectedSession)
                        )?.student_name
                      }
                    </p>
                  )}
                </div>

                <div className='border-t border-gray-200 px-4 py-5 sm:p-0'>
                  {activeSessions.find((s) => s.session_id === selectedSession) ||
                  completedSessions.find((s) => s.session_id === selectedSession) ? (
                    <dl className='sm:divide-y sm:divide-gray-200'>
                      <div className='py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                        <dt className='text-sm font-medium text-gray-500'>Tên học sinh</dt>
                        <dd className='mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2'>
                          {(
                            activeSessions.find((s) => s.session_id === selectedSession) ||
                            completedSessions.find((s) => s.session_id === selectedSession)
                          )?.student_name || 'Unknown'}
                        </dd>
                      </div>
                      <div className='py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                        <dt className='text-sm font-medium text-gray-500'>Tên đăng nhập</dt>
                        <dd className='mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2'>
                          {
                            (
                              activeSessions.find((s) => s.session_id === selectedSession) ||
                              completedSessions.find((s) => s.session_id === selectedSession)
                            )?.student_username
                          }
                        </dd>
                      </div>
                      <div className='py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                        <dt className='text-sm font-medium text-gray-500'>Bài thi</dt>
                        <dd className='mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2'>
                          {
                            (
                              activeSessions.find((s) => s.session_id === selectedSession) ||
                              completedSessions.find((s) => s.session_id === selectedSession)
                            )?.exam_title
                          }
                        </dd>
                      </div>
                      <div className='py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                        <dt className='text-sm font-medium text-gray-500'>Thời gian bắt đầu</dt>
                        <dd className='mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2'>
                          {formatDate(
                            (
                              activeSessions.find((s) => s.session_id === selectedSession) ||
                              completedSessions.find((s) => s.session_id === selectedSession)
                            )?.start_time as string
                          )}
                        </dd>
                      </div>

                      {/* Show end time for completed sessions */}
                      {completedSessions.find((s) => s.session_id === selectedSession)?.end_time && (
                        <div className='py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                          <dt className='text-sm font-medium text-gray-500'>Thời gian kết thúc</dt>
                          <dd className='mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2'>
                            {formatDate(
                              completedSessions.find((s) => s.session_id === selectedSession)?.end_time as string
                            )}
                          </dd>
                        </div>
                      )}

                      <div className='py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                        <dt className='text-sm font-medium text-gray-500'>Số vi phạm</dt>
                        <dd className='mt-1 text-sm sm:mt-0 sm:col-span-2'>
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              ((
                                activeSessions.find((s) => s.session_id === selectedSession) ||
                                completedSessions.find((s) => s.session_id === selectedSession)
                              )?.violations || 0) > 0
                                ? 'bg-red-100 text-red-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {(
                              activeSessions.find((s) => s.session_id === selectedSession) ||
                              completedSessions.find((s) => s.session_id === selectedSession)
                            )?.violations || 0}{' '}
                            vi phạm
                          </span>
                        </dd>
                      </div>

                      {/* Show score for completed sessions */}
                      {completedSessions.find((s) => s.session_id === selectedSession)?.score !== undefined && (
                        <div className='py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                          <dt className='text-sm font-medium text-gray-500'>Điểm số</dt>
                          <dd className='mt-1 text-sm sm:mt-0 sm:col-span-2'>
                            <span
                              className={`font-medium ${
                                (completedSessions.find((s) => s.session_id === selectedSession)?.score || 0) >= 70
                                  ? 'text-green-600'
                                  : (completedSessions.find((s) => s.session_id === selectedSession)?.score || 0) >= 50
                                    ? 'text-yellow-600'
                                    : 'text-red-600'
                              }`}
                            >
                              {formatScore(completedSessions.find((s) => s.session_id === selectedSession)?.score || 0)}
                            </span>
                          </dd>
                        </div>
                      )}

                      <div className='py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6'>
                        <dt className='text-sm font-medium text-gray-500'>Trạng thái</dt>
                        <dd className='mt-1 text-sm sm:mt-0 sm:col-span-2'>
                          <span
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              completedSessions.find((s) => s.session_id === selectedSession)
                                ? 'bg-green-100 text-green-800'
                                : activeSessions.find((s) => s.session_id === selectedSession)?.active
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-yellow-100 text-yellow-800'
                            }`}
                          >
                            {completedSessions.find((s) => s.session_id === selectedSession)
                              ? 'Hoàn thành'
                              : activeSessions.find((s) => s.session_id === selectedSession)?.active
                                ? 'Đang hoạt động'
                                : 'Không hoạt động hoặc bị ngắt kết nối'}
                          </span>
                        </dd>
                      </div>

                      {/* Only show message box and actions for active sessions */}
                      {activeSessions.find((s) => s.session_id === selectedSession) && (
                        <>
                          <div className='py-4 sm:py-5 sm:px-6'>
                            <dt className='text-sm font-medium text-gray-500 mb-2'>Gửi tin nhắn</dt>
                            <dd className='mt-1 text-sm text-gray-900'>
                              <div className='mt-1'>
                                <textarea
                                  rows={3}
                                  name='message'
                                  id='message'
                                  className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border border-gray-300 rounded-md'
                                  placeholder='Nhập tin nhắn để gửi cho học sinh...'
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
                            <dt className='text-sm font-medium text-gray-500 mb-2'>Hành động</dt>
                            <dd className='mt-1 text-sm text-gray-900'>
                              <button
                                type='button'
                                onClick={() =>
                                  handleEndExam(
                                    selectedSession,
                                    activeSessions.find((s) => s.session_id === selectedSession)?.student_name ||
                                      'this student'
                                  )
                                }
                                className='inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                              >
                                <XCircle className='h-4 w-4 mr-1' />
                                Kết thúc bài thi
                              </button>
                            </dd>
                          </div>
                        </>
                      )}
                    </dl>
                  ) : (
                    <div className='py-8 text-center'>
                      <p className='text-sm text-gray-500'>Học sinh không còn hoạt động</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Recent violations for selected student */}
              <div className='bg-white shadow overflow-hidden sm:rounded-lg'>
                <div className='px-4 py-5 sm:px-6'>
                  <h3 className='text-lg leading-6 font-medium text-gray-900'>Vi phạm gần đây</h3>
                </div>
                <div className='border-t border-gray-200'>
                  {getSessionViolations(selectedSession).length > 0 ? (
                    <ul className='divide-y divide-gray-200 max-h-[40vh] overflow-y-auto'>
                      {getSessionViolations(selectedSession).map((violation, index) => (
                        <li key={index} className='px-4 py-4'>
                          <div className='flex items-center justify-between'>
                            <div>
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getSeverityColor(
                                  violation.severity
                                )}`}
                              >
                                {getViolationTypeName(violation.type)}
                              </span>
                            </div>
                            <div className='text-xs text-gray-500'>{formatDate(violation.timestamp)}</div>
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
            </>
          ) : (
            <div className='bg-white shadow sm:rounded-lg'>
              <div className='px-4 py-5 sm:p-6 text-center'>
                <Users className='mx-auto h-12 w-12 text-gray-400' />
                <h3 className='mt-2 text-sm font-medium text-gray-900'>Chọn một học sinh</h3>
                <p className='mt-1 text-sm text-gray-500'>
                  Chọn một học sinh từ danh sách bên trái để xem chi tiết và vi phạm.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MonitoringDashboard
