/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { Clock, Calendar, Book, BookOpen } from 'lucide-react'
import examApi from '../../apis/exam.api'

interface MasterExam {
  _id: string
  name: string
  exam_period?: string
  fetchQuestions?: () => Promise<any>
  setMasterExamId?: (id: string) => void
  master_examId?: string
}

const ExamGenerator = ({ onSubmit, questionCount = 0, fetchQuestions, setMasterExamId, master_examId }: any) => {
  const [formData, setFormData] = useState({
    title: '',
    quantity: 10,
    question_count: Math.min(5, questionCount),
    duration: 30,
    start_time: null,
    master_exam_id: ''
  })
  const [masterExams, setMasterExams] = useState<MasterExam[]>([])
  const [isLoadingMasterExams, setIsLoadingMasterExams] = useState(false)

  // Fetch master exams when component mounts
  useEffect(() => {
    const fetchMasterExams = async () => {
      try {
        setIsLoadingMasterExams(true)
        const response = await examApi.getMasterExams()
        setMasterExams(response.data.result)
      } catch (error) {
        console.error('Failed to fetch master exams:', error)
      } finally {
        setIsLoadingMasterExams(false)
      }
    }

    fetchMasterExams()
  }, [])

  const handleChange = (e: any) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: name === 'title' ? value : parseInt(value, 10)
    })
  }

  const handleStringChange = (e: any) => {
    const { name, value } = e.target
    fetchQuestions()
    setMasterExamId(value)
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const handleDateChange = (date: Date | null) => {
    setFormData({
      ...formData,
      start_time: date as any
    })
  }

  const handleSubmit = (e: any) => {
    e.preventDefault()

    // Validate
    if (formData.question_count > questionCount) {
      alert(
        `Bạn chỉ có ${questionCount} câu hỏi trong ngân hàng của bạn. Vui lòng tạo thêm câu hỏi hoặc giảm số lượng câu hỏi.`
      )
      return
    }

    if (!formData.title.trim()) {
      alert('Vui lòng nhập tiêu đề bài kiểm tra')
      return
    }

    // Validate that start_time is in the future if provided
    if (formData.start_time && new Date(formData.start_time) <= new Date()) {
      alert('Thời gian bắt đầu phải là thời gian trong tương lai')
      return
    }

    onSubmit(formData)
  }

  return (
    <div className='bg-white shadow overflow-hidden sm:rounded-lg'>
      <div className='px-4 py-5 sm:p-6'>
        <h3 className='text-lg leading-6 font-medium text-gray-900'>Tạo mã QR cho bài kiểm tra</h3>
        <div className='mt-2 max-w-xl text-sm text-gray-500'>
          <p>Tạo mã QR để học sinh làm bài kiểm tra. Mỗi mã QR sẽ đại diện cho một bài kiểm tra duy nhất.</p>
        </div>

        <form onSubmit={handleSubmit} className='mt-5 space-y-6'>
          <div>
            <label htmlFor='title' className='block text-sm font-medium text-gray-700'>
              Tiêu đề bài thi
            </label>
            <input
              type='text'
              name='title'
              id='title'
              value={formData.title}
              onChange={handleChange}
              className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
              placeholder='Kỳ thi giữa kỳ'
              required
            />
          </div>

          <div>
            <label htmlFor='master_exam_id' className=' text-sm font-medium text-gray-700 flex items-center'>
              <BookOpen className='w-4 h-4 mr-1 text-gray-500' />
              Thuộc kỳ thi chính
            </label>
            <select
              id='master_exam_id'
              name='master_exam_id'
              value={formData.master_exam_id}
              onChange={handleStringChange}
              className='mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md'
            >
              <option value=''>-- Chọn kỳ thi chính --</option>
              {isLoadingMasterExams ? (
                <option disabled>Đang tải...</option>
              ) : (
                masterExams.map((exam) => (
                  <option key={exam._id} value={exam._id}>
                    {exam.name} {exam.exam_period ? `(${exam.exam_period})` : ''}
                  </option>
                ))
              )}
            </select>
            <p className='mt-1 text-xs text-gray-500'>
              Liên kết bài thi này với một kỳ thi chính để quản lý và xem kết quả theo lớp
            </p>
          </div>

          <div className='grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2'>
            <div>
              <label htmlFor='start_time' className='block text-sm font-medium text-gray-700 flex items-center'>
                <Calendar className='w-4 h-4 mr-1 text-gray-500' />
                Thời gian bắt đầu
              </label>
              <div className='mt-1'>
                <DatePicker
                  selected={formData.start_time}
                  onChange={handleDateChange}
                  timeIntervals={10}
                  showTimeSelect
                  dateFormat='Pp'
                  placeholderText='Chọn thời gian bắt đầu'
                  className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2'
                  isClearable
                />
              </div>
              <p className='mt-2 text-sm text-gray-500'>Nếu không chọn thời gian, bài thi sẽ bắt đầu ngay lập tức</p>
            </div>

            <div>
              <label htmlFor='quantity' className='block text-sm font-medium text-gray-700'>
                Số lượng mã QR
              </label>
              <div className='mt-1'>
                <input
                  type='number'
                  name='quantity'
                  id='quantity'
                  min='1'
                  max='100'
                  value={formData.quantity}
                  onChange={handleChange}
                  className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md'
                  required
                />
              </div>
              <p className='mt-2 text-sm text-gray-500'>Có bao nhiêu phiên bản bài kiểm tra khác nhau để tạo ra</p>
            </div>
          </div>

          <div className='grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2'>
            <div>
              <label htmlFor='question_count' className='block text-sm font-medium text-gray-700 flex items-center'>
                <Book className='w-4 h-4 mr-1 text-gray-500' />
                Câu hỏi cho mỗi kỳ thi
              </label>
              <div className='mt-1'>
                <input
                  type='number'
                  name='question_count'
                  id='question_count'
                  min='1'
                  max={questionCount}
                  value={formData.question_count}
                  onChange={handleChange}
                  className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md'
                  required
                />
              </div>
              <p className='mt-2 text-sm text-gray-500 translate-y-2'>
                {questionCount === 0 ? (
                  <span className='text-red-500 bg-white border font-bold  border-red-700 rounded-xl p-1'>
                    {!master_examId
                      ? 'Hãy chọn một kỳ thi chính để lấy câu hỏi'
                      : 'Bạn chưa có câu hỏi nào trong ngân hàng của bạn'}
                  </span>
                ) : (
                  `Các câu hỏi sẽ được chọn ngẫu nhiên từ ngân hàng có ${questionCount} câu hỏi của bạn`
                )}
              </p>
            </div>

            <div>
              <label htmlFor='duration' className=' text-sm font-medium text-gray-700 flex items-center'>
                <Clock className='w-4 h-4 mr-1 text-gray-500' />
                Thời lượng (phút)
              </label>
              <div className='mt-1'>
                <input
                  type='number'
                  name='duration'
                  id='duration'
                  min='1'
                  max='240'
                  value={formData.duration}
                  onChange={handleChange}
                  className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md'
                  required
                />
              </div>
              <p className='mt-2 text-sm text-gray-500'>Thời gian sinh viên sẽ phải hoàn thành bài thi</p>
            </div>
          </div>

          <div className='flex justify-end'>
            <button
              type='submit'
              className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              disabled={questionCount === 0}
            >
              Tạo mã QR
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ExamGenerator
