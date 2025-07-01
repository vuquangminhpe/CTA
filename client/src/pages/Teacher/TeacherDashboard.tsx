/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useContext, Fragment } from 'react'
import { Tab } from '@headlessui/react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Plus,
  HelpCircle,
  Book,
  QrCode,
  FileText,
  Eye,
  BookOpen,
  UserPlus,
  Search,
  Users,
  GraduationCap,
  Sparkles,
  Zap,
  Target,
  Award,
  TrendingUp,
  Star,
  MessageCircle,
  Wallet,
  ListStart
} from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '../../components/ui/alert-dialog'
import QuestionForm from '../../components/Teacher/QuestionForm'
import QuestionList from '../../components/Teacher/QuestionList'
import ExamGenerator from '../../components/Teacher/ExamGenerator'
import QRCodeList from '../../components/Teacher/QRCodeList'
import BulkQuestionImport from '../../components/Teacher/BulkQuestionImport'
import ExamList from '../../components/Teacher/ExamList'
import MasterExamForm from '../../components/Teacher/MasterExamForm'
import StudentRegistrationForm from '../../components/Teacher/StudentRegistrationForm'
import StudentSearchComponent from '../../components/Teacher/StudentSearchComponent'
import FeedbackWidget from '../../components/Teacher/FeedbackWidget'
import QuickFeedbackButton from '../../components/Teacher/QuickFeedbackButton'
import questionApi from '../../apis/question.api'
import examApi from '../../apis/exam.api'
import { AuthContext } from '../../Contexts/auth.context'

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

interface StudentData {
  name: string
  age: number
  gender: 'nam' | 'nữ'
  phone: string
  class: string
  username: string
  password: string
}

const TeacherDashboard = () => {
  const { profile } = useContext(AuthContext) as any
  const navigate = useNavigate()

  // Existing states
  const [questions, setQuestions] = useState<any>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<any>(null)
  const [qrCodes, setQrCodes] = useState<any>([])
  const [examTitle, setExamTitle] = useState<any>('')
  const [isMasterExamFormOpen, setIsMasterExamFormOpen] = useState(false)
  const [master_examId, setMasterExamId] = useState<string>('')

  // New states for student management
  const [showStudentRegistration, setShowStudentRegistration] = useState(false)
  const [registeredStudents, setRegisteredStudents] = useState<StudentData[]>([])

  useEffect(() => {
    // Refresh check
    const shouldRefresh = localStorage.getItem('needsRefresh') === 'true'
    if (shouldRefresh) {
      localStorage.removeItem('needsRefresh')
      window.location.reload()
    }
  }, [])

  useEffect(() => {
    fetchQuestions()
  }, [])

  const { data: dataExams } = useQuery({
    queryKey: ['dataExams'],
    queryFn: () => examApi.getMasterExams()
  })
  const dataExam = dataExams?.data?.result || []

  const fetchQuestions = async () => {
    try {
      setIsLoading(true)
      const response = await questionApi.getQuestions(master_examId)
      setQuestions(response.data.result as any)
    } catch (error) {
      console.error('Error fetching questions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const deleteAllQuestionMutation = useMutation({
    mutationFn: () => questionApi.delete_all_questions(),
    onSuccess: () => {
      toast.success('Xóa tất cả câu hỏi thành công')
      fetchQuestions()
    },
    onError: (error) => {
      console.error('Error deleting all questions:', error)
      toast.error('Failed to delete all questions')
    }
  })

  const handleCreateQuestion = async (questionData: any) => {
    try {
      await questionApi.createQuestion(questionData)
      setIsFormOpen(false)
      toast.success('Câu hỏi được tạo thành công')
      fetchQuestions()
    } catch (error) {
      if (!master_examId && master_examId === '') {
        toast.error('Vui lòng chọn kỳ thi trước khi tạo câu hỏi')
        return
      }
      console.error('Error creating question:', error)
      toast.error('Failed to create question')
    }
  }

  const handleUpdateQuestion = async (questionData: any) => {
    try {
      await questionApi.updateQuestion(editingQuestion._id, questionData)
      setIsFormOpen(false)
      setEditingQuestion(null)
      toast.success('Câu hỏi được cập nhật thành công')
      fetchQuestions()
    } catch (error) {
      console.error('Lỗi cập nhật câu hỏi:', error)
      toast.error('Không cập nhật được câu hỏi')
    }
  }

  const handleDeleteAllQuestions = async () => {
    deleteAllQuestionMutation.mutateAsync()
  }

  const handleDeleteQuestion = async (questionId: any) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này không?')) {
      return
    }

    try {
      await questionApi.deleteQuestion(questionId)
      toast.success('Đã xóa câu hỏi thành công')
      fetchQuestions()
    } catch (error) {
      console.error('Lỗi xóa câu hỏi:', error)
      toast.error('Không xóa được câu hỏi')
    }
  }

  const handleEditQuestion = (question: any) => {
    setEditingQuestion(question)
    setIsFormOpen(true)
  }

  const handleGenerateExam = async (formData: any) => {
    try {
      if (formData.start_time && new Date(formData.start_time) <= new Date()) {
        toast.error('Thời gian bắt đầu phải ở tương lai')
        return
      }

      setQrCodes([])
      setExamTitle(formData.title)

      toast.loading('Tạo mã QR...')

      const response = await examApi.generateExam(formData)
      const generatedQRCodes = response.data.result

      toast.dismiss()
      toast.success(`${generatedQRCodes.length} mã QR đã được tạo thành công`)

      setQrCodes(generatedQRCodes)
    } catch (error: any) {
      toast.dismiss()
      console.error('Error generating exam:', error)
      toast.error(`${error?.data?.error?.message || 'Failed to generate exam'}`)
    }
  }

  const handleBulkImport = async (questions: any[]) => {
    try {
      toast.loading(`Bắt đầu tạo ${questions.length} câu hỏi...`)

      await Promise.all(questions.map((question) => questionApi.createQuestion(question)))

      setIsBulkImportOpen(false)

      toast.dismiss()
      toast.success(`Đã tạo thành công ${questions.length} câu hỏi`)
      fetchQuestions()
    } catch (error) {
      toast.dismiss()
      console.error('Error importing questions:', error)
      toast.error('Failed to import questions')
    }
  }

  const handleMasterExamSuccess = () => {
    setIsMasterExamFormOpen(false)
    toast.success('Kỳ thi chính được tạo thành công')
  }

  // New student management handlers
  const handleStudentRegistrationSuccess = (studentsData: StudentData[]) => {
    setRegisteredStudents((prev) => [...prev, ...studentsData])
    setShowStudentRegistration(false)
    toast.success(`Đã đăng ký thành công ${studentsData.length} học sinh!`)
  }

  const getTeacherLevelLabel = (level: string) => {
    switch (level) {
      case 'elementary':
        return 'Tiểu học'
      case 'middle_school':
        return 'THCS'
      case 'high_school':
        return 'THPT'
      case 'university':
        return 'Đại học'
      default:
        return 'Chưa xác định'
    }
  }

  const getTeacherLevelIcon = (level: string) => {
    switch (level) {
      case 'elementary':
        return <Star className='w-5 h-5 text-yellow-500' />
      case 'middle_school':
        return <Target className='w-5 h-5 text-blue-500' />
      case 'high_school':
        return <TrendingUp className='w-5 h-5 text-green-500' />
      case 'university':
        return <Award className='w-5 h-5 text-purple-500' />
      default:
        return <GraduationCap className='w-5 h-5 text-gray-500' />
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Chào buổi sáng'
    if (hour < 18) return 'Chào buổi chiều'
    return 'Chào buổi tối'
  }

  const tabItems = [
    {
      id: 'student-registration',
      name: 'Đăng ký học sinh',
      icon: UserPlus,
      description: 'Tạo tài khoản',
      color: 'from-indigo-500 to-blue-400'
    },
    {
      id: 'master-exams',
      name: 'Kỳ thi chính',
      icon: BookOpen,
      description: 'Quản lý kỳ thi',
      color: 'from-fuchsia-400 to-red-400'
    },
    {
      id: 'questions',
      name: 'Ngân hàng câu hỏi',
      icon: Book,
      description: 'Quản lý câu hỏi',
      color: 'from-blue-500 to-cyan-400'
    },
    {
      id: 'exams',
      name: 'Tạo bài kiểm tra',
      icon: QrCode,
      description: 'Tạo mã QR',
      color: 'from-purple-500 to-pink-400'
    },
    {
      id: 'exam-list',
      name: 'Danh sách bài thi',
      icon: FileText,
      description: 'Xem tất cả',
      color: 'from-green-500 to-emerald-400'
    },
    {
      id: 'monitoring',
      name: 'Giám sát toàn cục',
      icon: Eye,
      description: 'Theo dõi hệ thống',
      color: 'from-rose-500 to-pink-400',
      onClick: () => navigate('/teacher/monitoring')
    },
    {
      id: 'student-search',
      name: 'Tìm kiếm học sinh',
      icon: Search,
      description: 'Tra cứu thông tin',
      color: 'from-teal-500 to-cyan-400'
    },
    {
      id: 'feedback',
      name: 'Hệ thống Feedback',
      icon: MessageCircle,
      description: 'Gửi góp ý',
      color: 'from-pink-500 to-rose-400',
      onClick: () => navigate('/teacher/feedback')
    },

    {
      id: 'payment',
      name: 'Mua các gói sử dụng hạn mức',
      icon: Wallet,
      description: 'Các gói sử dụng',
      color: 'from-yellow-500 to-yellow-400',
      onClick: () => navigate('/teacher/payment')
    },
    {
      id: 'statistics',
      name: 'Thống kê theo từng lớp (chuẩn BGD)',
      icon: ListStart,
      description: 'Thống kê cá nhân',
      color: 'from-green-500 to-green-400',
      onClick: () => navigate('/teacher/statistics'),
      isNonActive: false
    }
    // },
    // {
    //   id: 'cs',
    //   name: 'Cá nhân hóa đề thi',
    //   icon: PersonStanding,
    //   description: 'Các gói sử dụng',
    //   color: 'from-purple-500 to-purple-400',
    //   isNonActive: true
    // }
  ]

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30'>
      {/* Animated Background Elements */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse'></div>
        <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000'></div>
        <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse delay-500'></div>
      </div>

      <div className='relative z-10 max-w-[1920px] mx-auto py-8 px-4 sm:px-6 lg:px-8'>
        {/* Modern Header */}
        <div className='mb-12'>
          <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-8 shadow-2xl shadow-blue-500/10'>
            <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between'>
              <div className='flex-1'>
                <div className='flex items-center mb-4'>
                  <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg'>
                    <Sparkles className='w-6 h-6 text-white' />
                  </div>
                  <div>
                    <h1 className='text-4xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent'>
                      {getGreeting()}, {profile?.name || profile?.username}
                    </h1>
                    <p className='text-xl text-gray-600 font-medium mt-1'>
                      Chào mừng trở lại với không gian giảng dạy hiện đại
                    </p>
                  </div>
                </div>

                {profile?.teacher_level && (
                  <div className='inline-flex items-center bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-2xl px-6 py-3 shadow-sm'>
                    {getTeacherLevelIcon(profile.teacher_level)}
                    <span className='ml-3 text-lg font-semibold text-gray-800'>
                      Cấp: {getTeacherLevelLabel(profile.teacher_level)}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>{' '}
        <Tab.Group className='space-y-8'>
          {' '}
          {/* Modern Tab Navigation */}
          <Tab.List className='backdrop-blur-xl bg-white/60 border border-white/20 rounded-2xl p-2 shadow-xl shadow-blue-500/5'>
            <div className='grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-1 sm:gap-2'>
              {tabItems.map((tab, index) => (
                <Tab
                  onClick={tab.onClick}
                  key={tab.id + index}
                  className='focus:outline-none relative bg-white border border-gray-50 rounded-xl'
                >
                  {({ selected }) => (
                    <Fragment>
                      {tab.isNonActive === true && (
                        <div className='absolute z-[1000] top-0 right-0 p-1 text-cyan-400 translate-x-2 border text-sm border-cyan-500 rounded-xl font-semibold transition-all hover:-translate-y-3'>
                          Sắp ra mắt
                        </div>
                      )}
                      <div
                        className={classNames(
                          'group relative overflow-hidden rounded-xl p-2 sm:p-3 transition-all duration-300 cursor-pointer min-h-[80px] sm:min-h-[90px] xl:min-h-[100px]',
                          selected
                            ? 'bg-white shadow-lg shadow-blue-500/20 scale-105'
                            : 'hover:bg-white/50 hover:shadow-md hover:scale-102'
                        )}
                      >
                        <div
                          className={`absolute inset-0 bg-gradient-to-r ${tab.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
                        ></div>{' '}
                        <div className='relative z-10 flex flex-col items-center text-center justify-center h-full'>
                          <div
                            className={classNames(
                              'w-7 h-7 sm:w-8 sm:h-8 xl:w-10 xl:h-10 rounded-xl flex items-center justify-center mb-1 sm:mb-2 transition-all duration-300',
                              selected
                                ? `bg-gradient-to-r ${tab.color} text-white shadow-lg`
                                : 'bg-gray-100 text-gray-600 group-hover:bg-gradient-to-r group-hover:from-gray-200 group-hover:to-gray-100'
                            )}
                          >
                            <tab.icon className='w-3 h-3 sm:w-4 sm:h-4 xl:w-5 xl:h-5' />
                          </div>

                          <div
                            className={classNames(
                              'text-[10px] sm:text-xs xl:text-sm font-bold transition-colors duration-300 leading-tight text-center px-0.5 sm:px-1',
                              selected ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'
                            )}
                          >
                            {tab.name}
                          </div>

                          <div className='text-[9px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hidden lg:block xl:block text-center px-0.5 sm:px-1'>
                            {tab.description}
                          </div>
                        </div>
                      </div>
                    </Fragment>
                  )}
                </Tab>
              ))}
            </div>
          </Tab.List>
          <Tab.Panels>
            {/* Student Registration Panel */}
            <Tab.Panel>
              <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-8 shadow-2xl shadow-indigo-500/10'>
                <div className='space-y-8'>
                  <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6'>
                    <div className='flex items-center'>
                      <div className='w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-400 rounded-2xl flex items-center justify-center mr-4'>
                        <UserPlus className='w-6 h-6 text-white' />
                      </div>
                      <div>
                        <h2 className='text-3xl font-black text-gray-900'>Đăng ký học sinh</h2>
                        <p className='text-gray-600 font-medium'>Tạo tài khoản và đăng ký thông tin học sinh</p>
                      </div>
                    </div>
                    {registeredStudents.length > 0 && (
                      <div className='flex items-center bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-2xl px-6 py-3'>
                        <Users className='w-5 h-5 text-green-600 mr-2' />
                        <span className='text-green-800 font-semibold'>
                          Đã đăng ký: {registeredStudents.length} học sinh
                        </span>
                      </div>
                    )}
                  </div>

                  {showStudentRegistration ? (
                    <div className='backdrop-blur-xl bg-white/50 border border-white/30 rounded-3xl p-6'>
                      <StudentRegistrationForm
                        onSuccess={handleStudentRegistrationSuccess as any}
                        onCancel={() => setShowStudentRegistration(false)}
                      />
                    </div>
                  ) : (
                    <div className='text-center py-16 backdrop-blur-xl bg-white/50 border border-white/30 rounded-3xl'>
                      <div className='w-20 h-20 bg-gradient-to-br from-indigo-100 to-blue-100 rounded-3xl flex items-center justify-center mx-auto mb-6'>
                        <UserPlus className='w-10 h-10 text-indigo-600' />
                      </div>
                      <h3 className='text-2xl font-bold text-gray-900 mb-3'>Đăng ký học sinh mới</h3>
                      <p className='text-lg text-gray-600 mb-8 max-w-md mx-auto'>
                        Tạo tài khoản học sinh với thông tin cá nhân và ảnh khuôn mặt để tăng tính bảo mật.
                      </p>
                      <button
                        onClick={() => setShowStudentRegistration(true)}
                        className='inline-flex items-center px-8 py-4 bg-gradient-to-r from-indigo-500 to-blue-400 text-white rounded-2xl hover:from-indigo-600 hover:to-blue-500 transition-all duration-300 shadow-lg hover:shadow-indigo-500/25 hover:scale-105 font-semibold text-lg'
                      >
                        <UserPlus className='w-6 h-6 mr-2' />
                        Bắt đầu đăng ký
                      </button>

                      {/* Recent registrations */}
                      {registeredStudents.length > 0 && (
                        <div className='mt-12'>
                          <h4 className='text-xl font-bold text-gray-900 mb-6'>Học sinh đã đăng ký gần đây</h4>
                          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                            {registeredStudents.slice(-6).map((student, index) => (
                              <div
                                key={index}
                                className='backdrop-blur-sm bg-white/80 border border-white/40 rounded-2xl p-4 hover:bg-white/90 transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-lg'
                              >
                                <div className='flex justify-between items-start'>
                                  <div className='flex-1'>
                                    <h5 className='font-bold text-gray-900 text-lg'>{student.name}</h5>
                                    <p className='text-sm text-indigo-600 font-medium'>@{student.username}</p>
                                    <p className='text-sm text-gray-600 mt-2'>
                                      {student.gender} • {student.age} tuổi • Lớp {student.class}
                                    </p>
                                  </div>
                                  <div className='w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-400 rounded-xl flex items-center justify-center'>
                                    <UserPlus className='w-4 h-4 text-white' />
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </Tab.Panel>

            {/* Master Exams Panel */}
            <Tab.Panel>
              <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-8 shadow-2xl shadow-orange-500/10'>
                <div className='space-y-8'>
                  <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6'>
                    <div className='flex items-center'>
                      <div className='w-12 h-12 bg-gradient-to-br from-orange-500 to-red-400 rounded-2xl flex items-center justify-center mr-4'>
                        <BookOpen className='w-6 h-6 text-white' />
                      </div>
                      <div>
                        <h2 className='text-3xl font-black text-gray-900'>Kỳ thi chính</h2>
                        <p className='text-gray-600 font-medium'>Quản lý các kỳ thi chính của bạn</p>
                      </div>
                    </div>
                    <div className='flex gap-3'>
                      <button
                        onClick={() => setIsMasterExamFormOpen(true)}
                        className='inline-flex bg-white text-black items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-red-400  rounded-2xl hover:from-orange-600 hover:to-red-500 transition-all duration-300 shadow-lg hover:shadow-orange-500/25 hover:scale-105 font-semibold'
                      >
                        <Plus className='w-5 h-5 mr-2' />
                        Tạo kỳ thi mới
                      </button>
                      <button
                        onClick={() => navigate('/teacher/master-exams')}
                        className='inline-flex items-center px-6 py-3 bg-white/80 text-gray-700 border border-gray-200/50 rounded-2xl hover:bg-white hover:shadow-lg transition-all duration-300 font-semibold'
                      >
                        <BookOpen className='w-5 h-5 mr-2' />
                        Xem tất cả
                      </button>
                    </div>
                  </div>

                  {isMasterExamFormOpen ? (
                    <div className='backdrop-blur-xl bg-white/50 border border-white/30 rounded-3xl p-6'>
                      <MasterExamForm
                        onSuccess={handleMasterExamSuccess}
                        onCancel={() => setIsMasterExamFormOpen(false)}
                      />
                    </div>
                  ) : (
                    <div className='text-center py-16 backdrop-blur-xl bg-white/50 border border-white/30 rounded-3xl'>
                      <div className='w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-3xl flex items-center justify-center mx-auto mb-6'>
                        <BookOpen className='w-10 h-10 text-orange-600' />
                      </div>
                      <h3 className='text-2xl font-bold text-gray-900 mb-3'>Quản lý kỳ thi chính</h3>
                      <p className='text-lg text-gray-600 mb-8 max-w-md mx-auto'>
                        Kỳ thi chính giúp bạn tổ chức và nhóm các bài kiểm tra theo học kỳ hoặc mục đích cụ thể.
                      </p>
                      <button
                        onClick={() => navigate('/teacher/master-exams')}
                        className='inline-flex bg-white items-center px-8 py-4 bg-gradient-to-r from-orange-500 to-red-400 text-black rounded-2xl hover:from-orange-600 hover:to-red-500 transition-all duration-300 shadow-lg hover:shadow-orange-500/25 hover:scale-105 font-semibold text-lg'
                      >
                        <BookOpen className='w-6 h-6 mr-2' />
                        Xem tất cả kỳ thi
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Tab.Panel>
            {/* Question Bank Panel */}
            <Tab.Panel>
              <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-8 shadow-2xl shadow-blue-500/10'>
                {isBulkImportOpen ? (
                  <BulkQuestionImport onSubmit={handleBulkImport} onCancel={() => setIsBulkImportOpen(false)} />
                ) : isFormOpen ? (
                  <QuestionForm
                    onSubmit={editingQuestion ? handleUpdateQuestion : handleCreateQuestion}
                    initialData={editingQuestion}
                    onCancel={() => {
                      setIsFormOpen(false)
                      setEditingQuestion(null)
                    }}
                  />
                ) : (
                  <div className='space-y-8'>
                    <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6'>
                      <div className='flex items-center'>
                        <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mr-4'>
                          <Book className='w-6 h-6 text-white' />
                        </div>
                        <div>
                          <h2 className='text-3xl font-black text-gray-900'>Ngân hàng câu hỏi</h2>
                          <p className='text-gray-600 font-medium'>Quản lý và tổ chức câu hỏi của bạn</p>
                        </div>
                      </div>

                      <div className='flex flex-col lg:flex-row items-stretch lg:items-center gap-4'>
                        <div className='min-w-[300px]'>
                          <select
                            id='master_exam_id'
                            name='master_exam_id'
                            value={master_examId}
                            onChange={(e) => {
                              setMasterExamId(e.target.value)
                              fetchQuestions()
                            }}
                            className='w-full px-4 py-3 bg-white/80 backdrop-blur border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 text-gray-900 font-medium shadow-sm'
                          >
                            <option value=''>-- Chọn kỳ thi --</option>
                            {dataExam.map((exam: any) => (
                              <option key={exam._id} value={exam._id}>
                                {exam.name} {exam.exam_period ? `(${exam.exam_period})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className='flex gap-3'>
                          <AlertDialog>
                            <AlertDialogTrigger className='inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-2xl hover:from-red-600 hover:to-pink-600 transition-all duration-300 shadow-lg hover:shadow-red-500/25 hover:scale-105 font-semibold'>
                              <svg className='w-5 h-5 mr-2' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                                <path
                                  strokeLinecap='round'
                                  strokeLinejoin='round'
                                  strokeWidth={2}
                                  d='m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z'
                                />
                              </svg>
                              Xóa tất cả
                            </AlertDialogTrigger>
                            <AlertDialogContent className='bg-white border-0 shadow-2xl rounded-3xl max-w-md'>
                              <AlertDialogHeader>
                                <AlertDialogTitle className='text-2xl font-bold text-gray-900'>
                                  Xác nhận xóa tất cả câu hỏi?
                                </AlertDialogTitle>
                                <AlertDialogDescription className='text-gray-600 text-lg mt-2'>
                                  Hành động này sẽ xóa vĩnh viễn tất cả câu hỏi và không thể khôi phục.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className='flex gap-3 mt-6'>
                                <AlertDialogCancel className='px-6 py-3 bg-gray-100 text-gray-700 rounded-2xl hover:bg-gray-200 transition-colors font-semibold border-0'>
                                  Hủy bỏ
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDeleteAllQuestions}
                                  className='px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-2xl hover:from-red-600 hover:to-pink-600 transition-all font-semibold shadow-lg'
                                >
                                  Xóa tất cả
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <button
                            onClick={() => setIsBulkImportOpen(true)}
                            className='inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-2xl hover:from-purple-600 hover:to-indigo-600 transition-all duration-300 shadow-lg hover:shadow-purple-500/25 hover:scale-105 font-semibold'
                          >
                            <FileText className='w-5 h-5 mr-2' />
                            Nhập hàng loạt
                          </button>

                          <button
                            onClick={() => {
                              setIsFormOpen(true)
                              setEditingQuestion(null)
                            }}
                            className='inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-2xl hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 hover:scale-105 font-semibold'
                          >
                            <Plus className='w-5 h-5 mr-2' />
                            Thêm câu hỏi
                          </button>
                        </div>
                      </div>
                    </div>

                    {isLoading ? (
                      <div className='py-16 text-center'>
                        <div className='inline-block relative'>
                          <div className='w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin'></div>
                          <div className='absolute inset-0 w-12 h-12 border-4 border-transparent border-t-purple-600 rounded-full animate-spin animation-delay-150'></div>
                        </div>
                        <p className='mt-4 text-lg text-gray-600 font-medium'>Đang tải câu hỏi...</p>
                      </div>
                    ) : (
                      <div className='backdrop-blur-xl bg-white/50 border border-white/30 rounded-3xl p-6'>
                        <QuestionList
                          questions={questions}
                          onEdit={handleEditQuestion}
                          onDelete={handleDeleteQuestion}
                        />
                      </div>
                    )}

                    {!isFormOpen && questions.length > 0 && (
                      <div className='flex justify-between items-center pt-6 border-t border-gray-200/50'>
                        <div className='flex items-center'>
                          <Zap className='w-5 h-5 text-blue-500 mr-2' />
                          <p className='text-lg font-semibold text-gray-700'>
                            Tổng số: <span className='text-blue-600'>{questions.length}</span> câu hỏi
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Tab.Panel>

            {/* Generate Exams Panel */}
            <Tab.Panel>
              <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-8 shadow-2xl shadow-purple-500/10'>
                <div className='space-y-8'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center'>
                      <div className='w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-400 rounded-2xl flex items-center justify-center mr-4'>
                        <QrCode className='w-6 h-6 text-white' />
                      </div>
                      <div>
                        <h2 className='text-3xl font-black text-gray-900'>Tạo bài kiểm tra</h2>
                        <p className='text-gray-600 font-medium'>Tạo mã QR cho kỳ thi của bạn</p>
                      </div>
                    </div>
                    <div className='flex items-center bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/50 rounded-2xl px-6 py-3'>
                      <HelpCircle className='w-5 h-5 text-purple-600 mr-2' />
                      <span className='text-purple-800 font-semibold'>Mỗi mã QR tạo kỳ thi ngẫu nhiên</span>
                    </div>
                  </div>

                  <div className='backdrop-blur-xl bg-white/50 border border-white/30 rounded-3xl p-6'>
                    <ExamGenerator
                      master_examId={master_examId}
                      setMasterExamId={setMasterExamId}
                      fetchQuestions={fetchQuestions}
                      onSubmit={handleGenerateExam}
                      questionCount={questions.length}
                    />
                  </div>

                  {qrCodes.length > 0 && (
                    <div className='backdrop-blur-xl bg-white/50 border border-white/30 rounded-3xl p-6'>
                      <QRCodeList qrCodes={qrCodes} examTitle={examTitle} />
                    </div>
                  )}
                </div>
              </div>
            </Tab.Panel>

            {/* Exams List Panel */}
            <Tab.Panel>
              <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-8 shadow-2xl shadow-green-500/10'>
                <div className='flex items-center mb-8'>
                  <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-400 rounded-2xl flex items-center justify-center mr-4'>
                    <FileText className='w-6 h-6 text-white' />
                  </div>
                  <div>
                    <h2 className='text-3xl font-black text-gray-900'>Danh sách bài thi</h2>
                    <p className='text-gray-600 font-medium'>Xem tất cả các bài thi đã tạo</p>
                  </div>
                </div>
                <div className='backdrop-blur-xl bg-white/50 border border-white/30 rounded-3xl p-6'>
                  <ExamList />
                </div>
              </div>
            </Tab.Panel>
            {/* Feedback Panel */}
            <Tab.Panel className='space-y-8'>
              <div className='space-y-6'>
                <div className='flex items-center space-x-4 mb-8'>
                  <div className='p-4 bg-gradient-to-r from-pink-500 to-rose-400 rounded-2xl'>
                    <MessageCircle className='w-6 h-6 text-white' />
                  </div>
                  <div>
                    <h2 className='text-3xl font-black text-gray-900'>Hệ thống Feedback</h2>
                    <p className='text-gray-600 font-medium'>Gửi góp ý, báo cáo vấn đề và theo dõi phản hồi</p>
                  </div>
                  <div className='ml-auto'>
                    <QuickFeedbackButton
                      variant='default'
                      size='lg'
                      onSuccess={() => {
                        toast.success('Feedback đã được gửi thành công!')
                      }}
                    />
                  </div>
                </div>

                <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                  {/* Feedback Widget */}
                  <div className='lg:col-span-1'>
                    <FeedbackWidget maxItems={8} />
                  </div>

                  {/* Quick Actions */}
                  <div className='lg:col-span-2'>
                    <div className='backdrop-blur-xl bg-white/50 border border-white/30 rounded-3xl p-6 h-full'>
                      <h3 className='text-xl font-bold text-gray-900 mb-4'>Hành động nhanh</h3>
                      <div className='grid grid-cols-2 gap-4'>
                        <div
                          className='p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl border border-blue-100/50 cursor-pointer hover:shadow-lg transition-all duration-300 group'
                          onClick={() => navigate('/teacher/feedback')}
                        >
                          <div className='flex items-center justify-between mb-3'>
                            <div className='p-2 bg-blue-500 rounded-xl group-hover:scale-110 transition-transform'>
                              <MessageCircle className='w-5 h-5 text-white' />
                            </div>
                            <span className='text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full'>
                              Mới
                            </span>
                          </div>
                          <h4 className='font-bold text-gray-900 mb-1'>Xem tất cả Feedback</h4>
                          <p className='text-sm text-gray-600'>Quản lý và theo dõi tất cả feedback của bạn</p>
                        </div>

                        <div
                          className='p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-100/50 cursor-pointer hover:shadow-lg transition-all duration-300 group'
                          onClick={() => {
                            const element = document.querySelector('[data-feedback-button]')
                            if (element) {
                              ;(element as HTMLElement).click()
                            }
                          }}
                        >
                          <div className='flex items-center justify-between mb-3'>
                            <div className='p-2 bg-green-500 rounded-xl group-hover:scale-110 transition-transform'>
                              <Plus className='w-5 h-5 text-white' />
                            </div>
                          </div>
                          <h4 className='font-bold text-gray-900 mb-1'>Tạo Feedback mới</h4>
                          <p className='text-sm text-gray-600'>Gửi góp ý hoặc báo cáo vấn đề mới</p>
                        </div>

                        <div
                          className='p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl border border-purple-100/50 cursor-pointer hover:shadow-lg transition-all duration-300 group'
                          onClick={() => {
                            toast.info('Tính năng đang được phát triển')
                          }}
                        >
                          <div className='flex items-center justify-between mb-3'>
                            <div className='p-2 bg-purple-500 rounded-xl group-hover:scale-110 transition-transform'>
                              <TrendingUp className='w-5 h-5 text-white' />
                            </div>
                            <span className='text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full'>
                              Sắp có
                            </span>
                          </div>
                          <h4 className='font-bold text-gray-900 mb-1'>Thống kê Feedback</h4>
                          <p className='text-sm text-gray-600'>Xem báo cáo và phân tích feedback</p>
                        </div>

                        <div
                          className='p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl border border-orange-100/50 cursor-pointer hover:shadow-lg transition-all duration-300 group'
                          onClick={() => {
                            window.open('mailto:support@example.com?subject=Hỗ trợ khẩn cấp', '_blank')
                          }}
                        >
                          <div className='flex items-center justify-between mb-3'>
                            <div className='p-2 bg-orange-500 rounded-xl group-hover:scale-110 transition-transform'>
                              <Award className='w-5 h-5 text-white' />
                            </div>
                            <span className='text-xs font-medium text-orange-600 bg-orange-100 px-2 py-1 rounded-full'>
                              24/7
                            </span>
                          </div>
                          <h4 className='font-bold text-gray-900 mb-1'>Hỗ trợ khẩn cấp</h4>
                          <p className='text-sm text-gray-600'>Liên hệ trực tiếp khi cần hỗ trợ gấp</p>
                        </div>
                      </div>

                      {/* Tips Section */}
                      <div className='mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100'>
                        <h4 className='font-bold text-gray-900 mb-2 flex items-center'>
                          <Sparkles className='w-4 h-4 mr-2 text-blue-500' />
                          Mẹo sử dụng Feedback hiệu quả
                        </h4>
                        <ul className='text-sm text-gray-600 space-y-1'>
                          <li>• Mô tả chi tiết vấn đề để nhận được hỗ trợ nhanh nhất</li>
                          <li>• Sử dụng tags để phân loại feedback dễ dàng</li>
                          <li>• Chọn mức độ ưu tiên phù hợp với tình huống</li>
                          <li>• Theo dõi thường xuyên để cập nhật tình trạng xử lý</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Tab.Panel>
            {/* Student Search Panel */}
            <Tab.Panel>
              <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-8 shadow-2xl shadow-teal-500/10'>
                <div className='flex items-center mb-8'>
                  <div className='w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-400 rounded-2xl flex items-center justify-center mr-4'>
                    <Search className='w-6 h-6 text-white' />
                  </div>
                  <div>
                    <h2 className='text-3xl font-black text-gray-900'>Tìm kiếm học sinh</h2>
                    <p className='text-gray-600 font-medium'>Tra cứu thông tin học sinh trong hệ thống</p>
                  </div>
                </div>
                <div className='backdrop-blur-xl bg-white/50 border border-white/30 rounded-3xl p-6'>
                  <StudentSearchComponent />
                </div>{' '}
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  )
}

export default TeacherDashboard
