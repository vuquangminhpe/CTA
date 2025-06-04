/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Power, Eye, Calendar, Clock, ArrowLeft, Settings, Activity, Users, Target } from 'lucide-react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { toast } from 'sonner'
import examApi from '../../apis/exam.api'

const ExamManagement = () => {
  const { examId } = useParams()
  const navigate = useNavigate()
  const [exam, setExam] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Form state
  const [active, setActive] = useState(true)
  const [startTime, setStartTime] = useState<Date | null>(null)
  const [duration, setDuration] = useState(30)

  // Load exam data
  useEffect(() => {
    const fetchExam = async () => {
      try {
        setIsLoading(true)
        const response = await examApi.getExamById(examId as string)
        const examData = response.data.result

        setExam(examData)
        setActive(examData.active)
        setStartTime(examData.start_time ? new Date(examData.start_time) : null)
        setDuration(examData.duration)
      } catch (error) {
        toast.error('Failed to load exam')
        console.error(error)
      } finally {
        setIsLoading(false)
      }
    }

    if (examId) {
      fetchExam()
    }
  }, [examId])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate that start_time is in the future if provided
    if (startTime && new Date(startTime) <= new Date()) {
      toast.error('Thời gian bắt đầu phải là thời gian trong tương lai')
      return
    }

    try {
      setIsUpdating(true)

      await examApi.updateExamStatus(examId as string, {
        active,
        start_time: startTime ? startTime.toISOString() : null,
        duration
      })

      toast.success('Đã cập nhật cài đặt bài kiểm tra thành công')
      setShowSettings(false)

      // Refresh exam data
      const response = await examApi.getExamById(examId as string)
      setExam(response.data.result)
    } catch (error) {
      toast.error('Không cập nhật được cài đặt thi')
      console.error(error)
    } finally {
      setIsUpdating(false)
    }
  }

  // Toggle exam active status quickly
  const toggleExamStatus = async () => {
    try {
      setIsUpdating(true)

      await examApi.updateExamStatus(examId as string, {
        active: !active
      })

      setActive(!active)
      toast.success(`Bài thi ${!active ? 'đã bật' : 'đã tắt'} thành công`)

      // Refresh exam data
      const response = await examApi.getExamById(examId as string)
      setExam(response.data.result)
    } catch (error) {
      toast.error('Không cập nhật được trạng thái bài kiểm tra')
      console.error(error)
    } finally {
      setIsUpdating(false)
    }
  }

  // Navigate to monitoring page
  const goToMonitoring = () => {
    navigate(`/teacher/exams/${examId}/monitor`)
  }

  // Go back to teacher dashboard
  const goBack = () => {
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
        <div className='relative z-10 max-w-4xl mx-auto py-16 px-4 sm:px-6 lg:px-8'>
          <div className='text-center backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-12 shadow-2xl shadow-blue-500/10'>
            <div className='w-20 h-20 bg-gradient-to-br from-red-100 to-pink-100 rounded-3xl flex items-center justify-center mx-auto mb-6'>
              <Target className='w-10 h-10 text-red-600' />
            </div>
            <h2 className='text-3xl font-black text-gray-900 mb-4'>Không tìm thấy bài kiểm tra</h2>
            <p className='text-xl text-gray-600 mb-8'>Kỳ thi bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
            <button
              onClick={goBack}
              className='inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-2xl hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 hover:scale-105 font-semibold text-lg'
            >
              <ArrowLeft className='h-6 w-6 mr-3' />
              Quay lại Trang tổng quan
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

      <div className='relative z-10 max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8'>
        {/* Back Button */}
        <button
          onClick={() => window.history.back()}
          className='mb-6 flex items-center text-lg font-semibold text-gray-600 hover:text-blue-600 transition-all duration-300 hover:scale-105'
        >
          <div className='w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-2xl flex items-center justify-center mr-3 transition-all duration-300 shadow-lg'>
            <ArrowLeft className='h-6 w-6' />
          </div>
          Quay Lại
        </button>

        {/* Main Card */}
        <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-2xl shadow-blue-500/10 overflow-hidden'>
          {/* Header */}
          <div className='px-8 py-8 bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-b border-white/20'>
            <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6'>
              <div className='flex-1'>
                <h2 className='text-4xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent mb-2'>
                  {exam.title}
                </h2>
                <div className='flex items-center text-lg text-gray-600 font-medium'>
                  <Target className='w-5 h-5 mr-2 text-blue-500' />
                  Mã bài thi: {exam.exam_code}
                </div>
              </div>

              <div className='flex flex-wrap gap-3'>
                <button
                  onClick={toggleExamStatus}
                  disabled={isUpdating}
                  className={`inline-flex items-center px-6 py-3 rounded-2xl font-semibold transition-all duration-300 shadow-lg hover:scale-105 ${
                    active
                      ? 'bg-gradient-to-r from-red-500 to-pink-400 text-white hover:from-red-600 hover:to-pink-500 hover:shadow-red-500/25'
                      : 'bg-gradient-to-r from-green-500 to-emerald-400 text-white hover:from-green-600 hover:to-emerald-500 hover:shadow-green-500/25'
                  }`}
                >
                  <Power className='h-5 w-5 mr-2' />
                  {active ? 'Tắt bài thi' : 'Bật bài thi'}
                </button>

                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className='inline-flex items-center px-6 py-3 bg-white/80 text-gray-700 border border-gray-200/50 rounded-2xl hover:bg-white hover:shadow-lg transition-all duration-300 font-semibold'
                >
                  <Settings className='h-5 w-5 mr-2' />
                  Cài đặt
                </button>

                <button
                  onClick={goToMonitoring}
                  className='inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-2xl hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 hover:scale-105 font-semibold'
                >
                  <Eye className='h-5 w-5 mr-2' />
                  Giám sát
                </button>
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className='p-8'>
            <div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
              <div className='backdrop-blur-sm bg-white/50 border border-white/30 rounded-2xl p-6 hover:bg-white/60 transition-all duration-300'>
                <div className='flex items-center'>
                  <div className='w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-400 rounded-2xl flex items-center justify-center mr-4'>
                    <Clock className='h-6 w-6 text-white' />
                  </div>
                  <div>
                    <p className='text-sm font-semibold text-gray-600 uppercase tracking-wider'>Thời lượng</p>
                    <p className='text-2xl font-bold text-gray-900'>{exam.duration} phút</p>
                  </div>
                </div>
              </div>

              <div className='backdrop-blur-sm bg-white/50 border border-white/30 rounded-2xl p-6 hover:bg-white/60 transition-all duration-300'>
                <div className='flex items-center'>
                  <div className='w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-400 rounded-2xl flex items-center justify-center mr-4'>
                    <Calendar className='h-6 w-6 text-white' />
                  </div>
                  <div>
                    <p className='text-sm font-semibold text-gray-600 uppercase tracking-wider'>Thời gian bắt đầu</p>
                    <p className='text-lg font-bold text-gray-900'>
                      {exam.start_time ? new Date(exam.start_time).toLocaleString() : 'Ngay lập tức'}
                    </p>
                  </div>
                </div>
              </div>

              <div className='backdrop-blur-sm bg-white/50 border border-white/30 rounded-2xl p-6 hover:bg-white/60 transition-all duration-300'>
                <div className='flex items-center'>
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center mr-4 ${
                      exam.active
                        ? 'bg-gradient-to-br from-green-500 to-emerald-400'
                        : 'bg-gradient-to-br from-red-500 to-pink-400'
                    }`}
                  >
                    <Activity className='h-6 w-6 text-white' />
                  </div>
                  <div>
                    <p className='text-sm font-semibold text-gray-600 uppercase tracking-wider'>Trạng thái</p>
                    <span
                      className={`px-4 py-2 text-sm font-bold rounded-2xl ${
                        exam.active
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-red-100 text-red-800 border border-red-200'
                      }`}
                    >
                      {exam.active ? 'Đang hoạt động' : 'Vô hiệu hóa'}
                    </span>
                  </div>
                </div>
              </div>

              <div className='backdrop-blur-sm bg-white/50 border border-white/30 rounded-2xl p-6 hover:bg-white/60 transition-all duration-300'>
                <div className='flex items-center'>
                  <div className='w-12 h-12 bg-gradient-to-br from-indigo-500 to-blue-400 rounded-2xl flex items-center justify-center mr-4'>
                    <Users className='h-6 w-6 text-white' />
                  </div>
                  <div>
                    <p className='text-sm font-semibold text-gray-600 uppercase tracking-wider'>Số câu hỏi</p>
                    <p className='text-2xl font-bold text-gray-900'>{exam.question_ids.length}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className='border-t border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-blue-50/50'>
              <div className='p-8'>
                <div className='flex items-center mb-6'>
                  <div className='w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-400 rounded-2xl flex items-center justify-center mr-4'>
                    <Settings className='h-6 w-6 text-white' />
                  </div>
                  <h3 className='text-2xl font-bold text-gray-900'>Cài đặt bài kiểm tra</h3>
                </div>

                <form onSubmit={handleSubmit} className='space-y-8'>
                  {/* Status Setting */}
                  <div className='backdrop-blur-sm bg-white/50 border border-white/30 rounded-2xl p-6'>
                    <label className='block text-lg font-semibold text-gray-700 mb-4'>Trạng thái thi</label>
                    <div className='flex gap-6'>
                      <label className='inline-flex items-center cursor-pointer'>
                        <input
                          type='radio'
                          className='w-5 h-5 text-green-600 bg-white border-2 border-gray-300 focus:ring-green-500 focus:ring-2'
                          name='status'
                          checked={active}
                          onChange={() => setActive(true)}
                        />
                        <span className='ml-3 text-lg font-medium text-gray-700'>Đang hoạt động</span>
                      </label>
                      <label className='inline-flex items-center cursor-pointer'>
                        <input
                          type='radio'
                          className='w-5 h-5 text-red-600 bg-white border-2 border-gray-300 focus:ring-red-500 focus:ring-2'
                          name='status'
                          checked={!active}
                          onChange={() => setActive(false)}
                        />
                        <span className='ml-3 text-lg font-medium text-gray-700'>Vô hiệu hóa</span>
                      </label>
                    </div>
                  </div>

                  {/* Start Time Setting */}
                  <div className='backdrop-blur-sm bg-white/50 border border-white/30 rounded-2xl p-6'>
                    <label className='block text-lg font-semibold text-gray-700 mb-4'>Thời gian bắt đầu</label>
                    <div className='max-w-md'>
                      <DatePicker
                        selected={startTime}
                        onChange={setStartTime}
                        showTimeSelect
                        dateFormat='Pp'
                        placeholderText='Để trống để bắt đầu ngay lập tức'
                        className='w-full px-4 py-3 bg-white/80 backdrop-blur border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 text-gray-900 font-medium shadow-sm'
                        isClearable
                      />
                    </div>
                    <p className='mt-3 text-sm text-gray-600'>Để trống để cho phép kỳ thi bắt đầu ngay lập tức</p>
                  </div>

                  {/* Duration Setting */}
                  <div className='backdrop-blur-sm bg-white/50 border border-white/30 rounded-2xl p-6'>
                    <label htmlFor='duration' className='block text-lg font-semibold text-gray-700 mb-4'>
                      Thời lượng (phút)
                    </label>
                    <div className='max-w-md'>
                      <input
                        type='number'
                        name='duration'
                        id='duration'
                        min='1'
                        max='240'
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                        className='w-full px-4 py-3 bg-white/80 backdrop-blur border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 text-gray-900 font-medium shadow-sm'
                        required
                      />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className='flex justify-end gap-4'>
                    <button
                      type='button'
                      onClick={() => setShowSettings(false)}
                      className='px-8 py-3 bg-white/80 text-gray-700 border border-gray-200/50 rounded-2xl hover:bg-white hover:shadow-lg transition-all duration-300 font-semibold'
                    >
                      Hủy bỏ
                    </button>
                    <button
                      type='submit'
                      disabled={isUpdating}
                      className='px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-2xl hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 hover:scale-105 font-semibold disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      {isUpdating ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ExamManagement
