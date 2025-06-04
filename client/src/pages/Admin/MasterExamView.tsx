/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Clock,
  Users,
  School,
  BarChart,
  Download,
  Target,
  Activity,
  TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'
import examApi from '../../apis/exam.api'

interface MasterExam {
  _id: string
  name: string
  description?: string
  exam_period?: string
  start_time?: string
  end_time?: string
  created_at: string
}

interface Exam {
  _id: string
  title: string
  exam_code: string
  duration: number
  start_time?: string
  active: boolean
}

interface ClassInfo {
  class_name: string
  student_count: number
}

const MasterExamView = () => {
  const { masterExamId } = useParams()
  const navigate = useNavigate()
  const [masterExam, setMasterExam] = useState<MasterExam | null>(null)
  const [exams, setExams] = useState<Exam[]>([])
  const [classes, setClasses] = useState<ClassInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [, setSelectedClass] = useState<string | null>(null)

  useEffect(() => {
    if (!masterExamId) return

    const fetchMasterExamData = async () => {
      try {
        setIsLoading(true)

        // Fetch master exam info
        const masterExamResponse = await examApi.getMasterExamById(masterExamId)
        setMasterExam(masterExamResponse.data.result)

        // Fetch exams associated with this master exam
        const examsResponse = await examApi.getExamsByMasterExamId(masterExamId)
        setExams(examsResponse.data.result)

        // Fetch classes that participated in this master exam
        const classesResponse = await examApi.getClassesForMasterExam(masterExamId)
        setClasses(classesResponse.data.result)

        setIsLoading(false)
      } catch (error) {
        console.error('Failed to fetch master exam data:', error)
        toast.error('Không thể tải dữ liệu kỳ thi')
        setIsLoading(false)
      }
    }

    fetchMasterExamData()
  }, [masterExamId])

  const handleClassSelect = (className: string) => {
    setSelectedClass(className)
    // Navigation to class results would happen here
    // This would need a new endpoint that filters by class
    navigate(`/teacher/master-exams/${masterExamId}/classes/${encodeURIComponent(className)}`)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
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

  if (!masterExam) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30'>
        {/* Animated Background Elements */}
        <div className='fixed inset-0 overflow-hidden pointer-events-none'>
          <div className='absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse'></div>
          <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000'></div>
        </div>

        <div className='relative z-10 max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8'>
          <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-12 shadow-2xl shadow-blue-500/10 text-center'>
            <div className='w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-3xl flex items-center justify-center mx-auto mb-6'>
              <Target className='h-10 w-10 text-red-600' />
            </div>
            <h2 className='text-3xl font-black text-gray-900 mb-4'>Kỳ thi không tồn tại</h2>
            <p className='text-xl text-gray-600 mb-8'>Kỳ thi bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
            <button
              onClick={() => navigate('/teacher')}
              className='inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-2xl hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 hover:scale-105 font-semibold text-lg'
            >
              <ArrowLeft className='mr-3 h-6 w-6' />
              Quay lại trang chủ
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
            <div className='flex items-center mb-6'>
              <button
                onClick={() => navigate('/teacher')}
                className='mr-6 w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 shadow-lg'
              >
                <ArrowLeft className='h-6 w-6 text-gray-600' />
              </button>
              <div className='flex-1'>
                <h2 className='text-4xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-2'>
                  {masterExam.name}
                </h2>
                <div className='flex flex-wrap items-center gap-4 text-lg text-gray-600 font-medium'>
                  {masterExam.exam_period && (
                    <span className='flex items-center'>
                      <Calendar className='w-5 h-5 mr-2 text-blue-500' />
                      Học kỳ: {masterExam.exam_period}
                    </span>
                  )}
                  {masterExam.start_time && (
                    <span className='flex items-center'>
                      <Clock className='w-5 h-5 mr-2 text-green-500' />
                      Bắt đầu: {formatDate(masterExam.start_time)}
                    </span>
                  )}
                </div>
                {masterExam.description && (
                  <p className='mt-3 text-xl text-gray-600 font-medium'>{masterExam.description}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modern Stats Cards */}
        <div className='grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8'>
          <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-6 shadow-xl shadow-blue-500/10 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:scale-105'>
            <div className='flex items-center'>
              <div className='w-14 h-14 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-lg'>
                <BarChart className='h-7 w-7 text-white' />
              </div>
              <div className='ml-5 flex-1'>
                <p className='text-sm font-semibold text-gray-600 uppercase tracking-wider'>Tổng số lần thi</p>
                <p className='text-3xl font-black text-gray-900'>{exams.length}</p>
              </div>
            </div>
          </div>

          <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-6 shadow-xl shadow-green-500/10 hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300 hover:scale-105'>
            <div className='flex items-center'>
              <div className='w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-400 rounded-2xl flex items-center justify-center shadow-lg'>
                <School className='h-7 w-7 text-white' />
              </div>
              <div className='ml-5 flex-1'>
                <p className='text-sm font-semibold text-gray-600 uppercase tracking-wider'>Số lớp tham gia</p>
                <p className='text-3xl font-black text-gray-900'>{classes.length}</p>
              </div>
            </div>
          </div>

          <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-6 shadow-xl shadow-indigo-500/10 hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-300 hover:scale-105'>
            <div className='flex items-center'>
              <div className='w-14 h-14 bg-gradient-to-br from-indigo-500 to-blue-400 rounded-2xl flex items-center justify-center shadow-lg'>
                <Users className='h-7 w-7 text-white' />
              </div>
              <div className='ml-5 flex-1'>
                <p className='text-sm font-semibold text-gray-600 uppercase tracking-wider'>Tổng số học sinh</p>
                <p className='text-3xl font-black text-gray-900'>
                  {classes.reduce((total, cls) => total + cls.student_count, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Classes Section */}
        <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-2xl shadow-blue-500/10 overflow-hidden mb-8'>
          <div className='px-8 py-6 bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-b border-white/20'>
            <div className='flex items-center'>
              <div className='w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-400 rounded-2xl flex items-center justify-center mr-4'>
                <School className='h-6 w-6 text-white' />
              </div>
              <div>
                <h3 className='text-2xl font-bold text-gray-900'>Lớp tham gia</h3>
                <p className='text-gray-600 font-medium mt-1'>Chọn một lớp để xem chi tiết kết quả và vi phạm</p>
              </div>
            </div>
          </div>

          <div className='p-8'>
            {classes.length > 0 ? (
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                {classes.map((classInfo) => (
                  <div
                    key={classInfo.class_name}
                    className='backdrop-blur-sm bg-white/50 border border-white/30 rounded-2xl p-6 hover:bg-white/60 transition-all duration-300 hover:scale-105 cursor-pointer group'
                    onClick={() => handleClassSelect(classInfo.class_name)}
                  >
                    <div className='flex items-center justify-between mb-4'>
                      <div className='w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-400 rounded-2xl flex items-center justify-center'>
                        <School className='h-6 w-6 text-white' />
                      </div>
                      <div className='text-right'>
                        <div className='text-2xl font-black text-gray-900'>{classInfo.student_count}</div>
                        <div className='text-sm text-gray-600 font-medium'>học sinh</div>
                      </div>
                    </div>
                    <h4 className='text-xl font-bold text-gray-900 mb-2'>{classInfo.class_name}</h4>
                    <button className='w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-xl hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 font-semibold group-hover:scale-105'>
                      Xem kết quả
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className='text-center py-12'>
                <div className='w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6'>
                  <School className='w-10 h-10 text-gray-400' />
                </div>
                <h3 className='text-xl font-bold text-gray-900 mb-2'>Chưa có lớp tham gia</h3>
                <p className='text-gray-600'>Chưa có lớp nào tham gia kỳ thi này.</p>
              </div>
            )}
          </div>
        </div>

        {/* Exams Table */}
        <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-2xl shadow-blue-500/10 overflow-hidden'>
          <div className='px-8 py-6 bg-gradient-to-r from-green-50/50 to-blue-50/50 border-b border-white/20 flex justify-between items-center'>
            <div className='flex items-center'>
              <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-400 rounded-2xl flex items-center justify-center mr-4'>
                <TrendingUp className='h-6 w-6 text-white' />
              </div>
              <div>
                <h3 className='text-2xl font-bold text-gray-900'>Danh sách bài thi</h3>
                <p className='text-gray-600 font-medium mt-1'>Tất cả các bài thi trong kỳ thi này</p>
              </div>
            </div>
            <button
              onClick={() => {
                // Export functionality would go here
                toast.info('Feature coming soon')
              }}
              className='inline-flex items-center px-6 py-3 bg-white/80 text-gray-700 border border-gray-200/50 rounded-2xl hover:bg-white hover:shadow-lg transition-all duration-300 font-semibold'
            >
              <Download className='mr-2 h-5 w-5' />
              Xuất báo cáo
            </button>
          </div>

          <div className='overflow-hidden'>
            {exams.length > 0 ? (
              <div className='overflow-x-auto'>
                <table className='min-w-full'>
                  <thead className='bg-gradient-to-r from-gray-50 to-blue-50'>
                    <tr>
                      <th className='px-8 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider'>
                        Tên bài thi
                      </th>
                      <th className='px-8 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider'>
                        Mã bài thi
                      </th>
                      <th className='px-8 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider'>
                        Thời gian bắt đầu
                      </th>
                      <th className='px-8 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider'>
                        Thời lượng
                      </th>
                      <th className='px-8 py-4 text-left text-sm font-bold text-gray-700 uppercase tracking-wider'>
                        Trạng thái
                      </th>
                      <th className='px-8 py-4 text-right text-sm font-bold text-gray-700 uppercase tracking-wider'>
                        Hành động
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-200/50'>
                    {exams.map((exam) => (
                      <tr key={exam._id} className='hover:bg-white/50 transition-all duration-300'>
                        <td className='px-8 py-6 text-lg font-bold text-gray-900'>{exam.title}</td>
                        <td className='px-8 py-6 text-gray-600 font-medium'>{exam.exam_code}</td>
                        <td className='px-8 py-6 text-gray-600 font-medium'>
                          {exam.start_time ? formatDate(exam.start_time) : 'Ngay lập tức'}
                        </td>
                        <td className='px-8 py-6 text-gray-600 font-medium'>{exam.duration} phút</td>
                        <td className='px-8 py-6'>
                          <span
                            className={`px-4 py-2 text-sm font-bold rounded-2xl ${
                              exam.active
                                ? 'bg-green-100 text-green-800 border border-green-200'
                                : 'bg-red-100 text-red-800 border border-red-200'
                            }`}
                          >
                            {exam.active ? 'Hoạt động' : 'Vô hiệu hóa'}
                          </span>
                        </td>
                        <td className='px-8 py-6 text-right'>
                          <button
                            onClick={() => navigate(`/teacher/exams/${exam._id}/class-results`)}
                            className='px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-2xl hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 hover:scale-105 font-semibold'
                          >
                            Xem kết quả
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
                  <Activity className='w-10 h-10 text-gray-400' />
                </div>
                <h3 className='text-xl font-bold text-gray-900 mb-2'>Chưa có bài thi</h3>
                <p className='text-gray-600'>Chưa có bài thi nào cho kỳ thi này.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MasterExamView
