/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Power, Edit, Eye, Calendar, Clock, ArrowLeft } from 'lucide-react'
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
      <div className='flex justify-center items-center py-12'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  if (!exam) {
    return (
      <div className='text-center py-12'>
        <h2 className='text-xl font-medium text-gray-900'>Không tìm thấy bài kiểm tra</h2>
        <p className='mt-2 text-gray-500'>Kỳ thi bạn đang tìm kiếm không tồn tại</p>
        <button
          onClick={goBack}
          className='mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700'
        >
          <ArrowLeft className='h-4 w-4 mr-2' /> Quay lại Trang tổng quan
        </button>
      </div>
    )
  }

  return (
    <div className='max-w-3xl mx-auto py-8 px-4 sm:px-6 lg:px-8'>
      <div className='bg-white shadow rounded-lg overflow-hidden'>
        <div className='px-4 py-5 sm:px-6 flex justify-between items-center'>
          <div>
            <h2 className='text-xl font-bold text-gray-900'>{exam.title}</h2>
            <p className='mt-1 text-sm text-gray-500'>Mã bài thi: {exam.exam_code}</p>
          </div>
          <div className='flex space-x-2'>
            <button
              onClick={toggleExamStatus}
              disabled={isUpdating}
              className={`inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white ${
                active ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
              } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
            >
              <Power className='h-4 w-4 mr-1' />
              {active ? 'Disable' : 'Enable'}
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className='inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            >
              <Edit className='h-4 w-4 mr-1' />
              Cài đặt
            </button>
            <button
              onClick={goToMonitoring}
              className='inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            >
              <Eye className='h-4 w-4 mr-1' />
              Màn hình
            </button>
          </div>
        </div>

        <div className='border-t border-gray-200 px-4 py-5 sm:p-6'>
          <dl className='grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2'>
            <div>
              <dt className='text-sm font-medium text-gray-500 flex items-center'>
                <Clock className='h-4 w-4 mr-1' />
                Khoảng thời gian
              </dt>
              <dd className='mt-1 text-sm text-gray-900'>{exam.duration} minutes</dd>
            </div>

            <div>
              <dt className='text-sm font-medium text-gray-500 flex items-center'>
                <Calendar className='h-4 w-4 mr-1' />
                Thời gian bắt đầu
              </dt>
              <dd className='mt-1 text-sm text-gray-900'>
                {exam.start_time ? new Date(exam.start_time).toLocaleString() : 'Immediately (no scheduled time)'}
              </dd>
            </div>

            <div>
              <dt className='text-sm font-medium text-gray-500'>Trạng thái</dt>
              <dd className='mt-1 text-sm text-gray-900'>
                <span
                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                    exam.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {exam.active ? 'đã bật' : 'đã tắt'}
                </span>
              </dd>
            </div>

            <div>
              <dt className='text-sm font-medium text-gray-500'>Câu hỏi</dt>
              <dd className='mt-1 text-sm text-gray-900'>{exam.question_ids.length} câu hỏi</dd>
            </div>
          </dl>
        </div>

        {showSettings && (
          <div className='border-t border-gray-200 px-4 py-5 sm:p-6'>
            <h3 className='text-lg font-medium text-gray-900 mb-4'>Cài đặt bài kiểm tra</h3>

            <form onSubmit={handleSubmit}>
              <div className='space-y-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700'>Trạng thái thi</label>
                  <div className='mt-1 flex items-center space-x-4'>
                    <label className='inline-flex items-center'>
                      <input
                        type='radio'
                        className='form-radio'
                        name='status'
                        checked={active}
                        onChange={() => setActive(true)}
                      />
                      <span className='ml-2 text-sm text-gray-700'>đã bật</span>
                    </label>
                    <label className='inline-flex items-center'>
                      <input
                        type='radio'
                        className='form-radio'
                        name='status'
                        checked={!active}
                        onChange={() => setActive(false)}
                      />
                      <span className='ml-2 text-sm text-gray-700'>đã tắt</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700'>Thời gian bắt đầu</label>
                  <div className='mt-1'>
                    <DatePicker
                      selected={startTime}
                      onChange={setStartTime}
                      showTimeSelect
                      dateFormat='Pp'
                      placeholderText='No scheduled start time (start immediately)'
                      className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2'
                      isClearable
                      minDate={new Date()}
                      minTime={new Date()}
                    />
                  </div>
                  <p className='mt-1 text-xs text-gray-500'>Để trống để cho phép kỳ thi bắt đầu ngay lập tức</p>
                </div>

                <div>
                  <label htmlFor='duration' className='block text-sm font-medium text-gray-700'>
                    Thời lượng (phút)
                  </label>
                  <div className='mt-1'>
                    <input
                      type='number'
                      name='duration'
                      id='duration'
                      min='1'
                      max='240'
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value, 10))}
                      className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md'
                      required
                    />
                  </div>
                </div>
              </div>

              <div className='mt-6 flex justify-end space-x-3'>
                <button
                  type='button'
                  onClick={() => setShowSettings(false)}
                  className='px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                >
                  Hủy bỏ
                </button>
                <button
                  type='submit'
                  disabled={isUpdating}
                  className='px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}

export default ExamManagement
