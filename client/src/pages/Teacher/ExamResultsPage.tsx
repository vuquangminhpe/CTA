/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, User, AlertCircle, Target, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import examApi from '../../apis/exam.api'
import ExamResults from '../../components/Teacher/ExamResults'

const ExamResultsPage = () => {
  const { examId } = useParams()
  const navigate = useNavigate()
  const [exam, setExam] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchExamDetails = async () => {
      if (!examId) return

      try {
        setIsLoading(true)
        // Fetch basic exam information
        const examsResponse = await examApi.getExams()
        const examsList = examsResponse.data.result
        const targetExam = examsList.find((e: any) => e._id === examId)

        if (targetExam) {
          setExam(targetExam)
        } else {
          toast.error('Exam not found')
        }
      } catch (error) {
        console.error('Error fetching exam details:', error)
        toast.error('Failed to load exam details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchExamDetails()
  }, [examId])

  const handleBack = () => {
    navigate('/teacher')
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
        {/* Animated Background Elements */}
        <div className='fixed inset-0 overflow-hidden pointer-events-none'>
          <div className='absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse'></div>
          <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000'></div>
        </div>

        <div className='relative z-10 max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8'>
          <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-12 shadow-2xl shadow-blue-500/10 text-center'>
            <div className='w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-3xl flex items-center justify-center mx-auto mb-6'>
              <AlertCircle className='h-10 w-10 text-red-600' />
            </div>
            <h3 className='text-3xl font-black text-gray-900 mb-4'>Không tìm thấy bài kiểm tra</h3>
            <p className='text-xl text-gray-600 mb-8'>
              Kỳ thi bạn đang tìm kiếm không tồn tại hoặc bạn không có quyền xem kỳ thi đó.
            </p>
            <button
              onClick={handleBack}
              className='inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-2xl hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 hover:scale-105 font-semibold text-lg'
            >
              <ArrowLeft className='mr-3 h-6 w-6' />
              Quay lại Bảng điều khiển
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
                  <button
                    onClick={handleBack}
                    className='mr-6 w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 shadow-lg'
                  >
                    <ArrowLeft className='h-6 w-6 text-gray-600' />
                  </button>
                  <div>
                    <h1 className='text-4xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent'>
                      {exam.title}
                    </h1>
                    <div className='flex flex-wrap items-center gap-4 mt-2 text-lg text-gray-600 font-medium'>
                      <span className='flex items-center'>
                        <FileText className='w-5 h-5 mr-2 text-blue-500' />
                        Mã bài thi: {exam.exam_code}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className='flex flex-wrap items-center gap-6 mt-6 lg:mt-0'>
                <div className='flex items-center text-lg text-gray-600 font-medium'>
                  <User className='w-5 h-5 mr-2 text-green-500' />
                  <span>Tạo: {new Date(exam.created_at).toLocaleDateString()}</span>
                </div>
                <div className='flex items-center text-lg text-gray-600 font-medium'>
                  <Target className='w-5 h-5 mr-2 text-purple-500' />
                  <span>Thời lượng: {exam.duration} phút</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-2xl shadow-blue-500/10 overflow-hidden'>
          {/* Header Section */}
          <div className='px-8 py-6 bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-b border-white/20'>
            <div className='flex items-center'>
              <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4'>
                <TrendingUp className='h-6 w-6 text-white' />
              </div>
              <div>
                <h3 className='text-2xl font-bold text-gray-900'>Kết quả thi chi tiết</h3>
                <p className='text-gray-600 font-medium mt-1'>
                  Xem thành tích và số liệu thống kê của học sinh trong kỳ thi này.
                </p>
              </div>
            </div>
          </div>

          {/* Results Component */}
          <div className='p-8'>
            <div className='backdrop-blur-sm bg-white/50 border border-white/30 rounded-3xl p-6'>
              <ExamResults selectedExamId={examId} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ExamResultsPage
