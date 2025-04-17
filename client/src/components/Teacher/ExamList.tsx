/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, Settings, Eye, BarChart, Power } from 'lucide-react'
import { toast } from 'sonner'
import examApi from '../../apis/exam.api'

const ExamList = () => {
  const navigate = useNavigate()
  const [exams, setExams] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchExams()
  }, [])

  const fetchExams = async () => {
    try {
      setIsLoading(true)
      const response = await examApi.getExams()
      setExams(response?.data?.result as any)
    } catch (error) {
      console.error('Error fetching exams:', error)
      toast.error('Failed to load exams')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleExamStatus = async (examId: string, currentStatus: any) => {
    try {
      await examApi.updateExamStatus(examId, {
        active: !currentStatus
      })
      toast.success(`Exam ${currentStatus ? 'disabled' : 'enabled'} successfully`)
      fetchExams() // Refresh the list
    } catch (error) {
      console.error('Error updating exam status:', error)
      toast.error('Failed to update exam status')
    }
  }

  const formatDate = (dateString: string | number | Date) => {
    if (!dateString) return 'Immediately'
    return new Date(dateString).toLocaleString()
  }

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h2 className='text-lg font-medium text-gray-900'>Danh sách bài kiểm tra</h2>
      </div>

      {isLoading ? (
        <div className='py-8 text-center text-gray-500'>
          <div className='inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600'></div>
          <p className='mt-2'>Đang tải bài kiểm tra, vui lòng chờ vài giây...</p>
        </div>
      ) : exams.length === 0 ? (
        <div className='bg-white shadow rounded-lg p-6 text-center'>
          <Calendar className='h-12 w-12 text-gray-400 mx-auto' />
          <h3 className='mt-2 text-sm font-medium text-gray-900'>Chưa có bài kiểm tra nào</h3>
          <p className='mt-1 text-sm text-gray-500'>Bạn có thể tạo bài kiểm tra mới từ tab "Tạo bài kiểm tra".</p>
        </div>
      ) : (
        <div className='overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg'>
          <table className='min-w-full divide-y divide-gray-300'>
            <thead className='bg-gray-50'>
              <tr>
                <th scope='col' className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'>
                  Tiêu đề
                </th>
                <th scope='col' className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'>
                  Mã bài thi
                </th>
                <th scope='col' className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'>
                  Trạng thái
                </th>
                <th scope='col' className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'>
                  Thời gian bắt đầu
                </th>
                <th scope='col' className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'>
                  Thời lượng
                </th>
                <th scope='col' className='relative py-3.5 px-3'>
                  <span className='sr-only'>Thao tác</span>
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200 bg-white'>
              {exams.map((exam: any) => (
                <tr key={exam._id}>
                  <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-900'>{exam.title}</td>
                  <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>{exam.exam_code}</td>
                  <td className='whitespace-nowrap px-3 py-4 text-sm'>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        exam.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {exam.active ? 'Hoạt động' : 'Vô hiệu hóa'}
                    </span>
                  </td>
                  <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
                    <div className='flex items-center'>
                      <Calendar className='h-4 w-4 mr-1 text-gray-400' />
                      {formatDate(exam.start_time)}
                    </div>
                  </td>
                  <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
                    <div className='flex items-center'>
                      <Clock className='h-4 w-4 mr-1 text-gray-400' />
                      {exam.duration} phút
                    </div>
                  </td>
                  <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
                    <div className='flex items-center space-x-2'>
                      <button
                        onClick={() => handleToggleExamStatus(exam._id, exam.active)}
                        className={`p-1.5 rounded-full ${
                          exam.active ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                        } hover:bg-opacity-70`}
                        title={exam.active ? 'Đã tắt' : 'Đã bật'}
                      >
                        <Power className='h-4 w-4' />
                      </button>
                      <button
                        onClick={() => navigate(`/teacher/exams/${exam._id}`)}
                        className='p-1.5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200'
                        title='Settings'
                      >
                        <Settings className='h-4 w-4' />
                      </button>
                      <button
                        onClick={() => navigate(`/teacher/exams/${exam._id}/monitor`)}
                        className='p-1.5 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                        title='Monitor'
                      >
                        <Eye className='h-4 w-4' />
                      </button>
                      <button
                        onClick={() => navigate(`/teacher/exams/${exam._id}/results`)}
                        className='p-1.5 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200'
                        title='Results'
                      >
                        <BarChart className='h-4 w-4' />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default ExamList
