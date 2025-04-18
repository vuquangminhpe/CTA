/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, Users, School, BarChart, Download } from 'lucide-react'
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
  const [selectedClass, setSelectedClass] = useState<string | null>(null)

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
      <div className='flex justify-center items-center py-12'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  if (!masterExam) {
    return (
      <div className='max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>
        <div className='text-center py-12'>
          <h2 className='text-xl font-medium text-gray-900'>Kỳ thi không tồn tại</h2>
          <p className='mt-2 text-gray-500'>Kỳ thi bạn đang tìm kiếm không tồn tại hoặc đã bị xóa.</p>
          <button
            onClick={() => navigate('/teacher')}
            className='mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700'
          >
            <ArrowLeft className='mr-2 -ml-1 h-5 w-5' />
            Quay lại trang chủ
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'>
      {/* Header */}
      <div className='md:flex md:items-center md:justify-between mb-6'>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center'>
            <button
              onClick={() => navigate('/teacher')}
              className='mr-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors'
            >
              <ArrowLeft className='h-5 w-5 text-gray-600' />
            </button>
            <h2 className='text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate'>{masterExam.name}</h2>
          </div>
          <div className='mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6'>
            {masterExam.exam_period && (
              <div className='mt-2 flex items-center text-sm text-gray-500'>
                <Calendar className='flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400' />
                Học kỳ: {masterExam.exam_period}
              </div>
            )}
            {masterExam.start_time && (
              <div className='mt-2 flex items-center text-sm text-gray-500'>
                <Clock className='flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400' />
                Bắt đầu: {formatDate(masterExam.start_time)}
              </div>
            )}
          </div>
          {masterExam.description && <p className='mt-2 text-sm text-gray-600'>{masterExam.description}</p>}
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 gap-5 sm:grid-cols-3 mb-6'>
        <div className='bg-white overflow-hidden shadow rounded-lg'>
          <div className='px-4 py-5 sm:p-6'>
            <div className='flex items-center'>
              <div className='flex-shrink-0 bg-blue-100 rounded-md p-3'>
                <BarChart className='h-6 w-6 text-blue-600' />
              </div>
              <div className='ml-5 w-0 flex-1'>
                <dl>
                  <dt className='text-sm font-medium text-gray-500 truncate'>Tổng số lần thi</dt>
                  <dd className='text-lg font-medium text-gray-900'>{exams.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white overflow-hidden shadow rounded-lg'>
          <div className='px-4 py-5 sm:p-6'>
            <div className='flex items-center'>
              <div className='flex-shrink-0 bg-green-100 rounded-md p-3'>
                <School className='h-6 w-6 text-green-600' />
              </div>
              <div className='ml-5 w-0 flex-1'>
                <dl>
                  <dt className='text-sm font-medium text-gray-500 truncate'>Số lớp tham gia</dt>
                  <dd className='text-lg font-medium text-gray-900'>{classes.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className='bg-white overflow-hidden shadow rounded-lg'>
          <div className='px-4 py-5 sm:p-6'>
            <div className='flex items-center'>
              <div className='flex-shrink-0 bg-indigo-100 rounded-md p-3'>
                <Users className='h-6 w-6 text-indigo-600' />
              </div>
              <div className='ml-5 w-0 flex-1'>
                <dl>
                  <dt className='text-sm font-medium text-gray-500 truncate'>Tổng số học sinh</dt>
                  <dd className='text-lg font-medium text-gray-900'>
                    {classes.reduce((total, cls) => total + cls.student_count, 0)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Classes Section */}
      <div className='bg-white shadow overflow-hidden sm:rounded-lg mb-6'>
        <div className='px-4 py-5 sm:px-6'>
          <h3 className='text-lg leading-6 font-medium text-gray-900'>Lớp tham gia</h3>
          <p className='mt-1 max-w-2xl text-sm text-gray-500'>Chọn một lớp để xem chi tiết kết quả và vi phạm</p>
        </div>
        <div className='border-t border-gray-200'>
          {classes.length > 0 ? (
            <ul className='divide-y divide-gray-200'>
              {classes.map((classInfo) => (
                <li key={classInfo.class_name} className='px-4 py-4 hover:bg-gray-50 sm:px-6'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center'>
                      <div className='flex-shrink-0 bg-indigo-100 rounded-full p-2'>
                        <School className='h-5 w-5 text-indigo-600' />
                      </div>
                      <div className='ml-4'>
                        <h4 className='text-lg font-medium text-gray-900'>{classInfo.class_name}</h4>
                        <p className='text-sm text-gray-500'>{classInfo.student_count} học sinh</p>
                      </div>
                    </div>
                    <div>
                      <button
                        onClick={() => handleClassSelect(classInfo.class_name)}
                        className='inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700'
                      >
                        Xem kết quả
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className='px-4 py-5 sm:px-6 text-center'>
              <p className='text-gray-500'>Chưa có lớp nào tham gia kỳ thi này.</p>
            </div>
          )}
        </div>
      </div>

      {/* Exams Table */}
      <div className='bg-white shadow overflow-hidden sm:rounded-lg'>
        <div className='px-4 py-5 sm:px-6 flex justify-between items-center'>
          <h3 className='text-lg leading-6 font-medium text-gray-900'>Danh sách bài thi</h3>
          <button
            onClick={() => {
              // Export functionality would go here
              toast.info('Feature coming soon')
            }}
            className='inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50'
          >
            <Download className='mr-2 h-4 w-4' />
            Xuất báo cáo
          </button>
        </div>
        <div className='border-t border-gray-200'>
          {exams.length > 0 ? (
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Tên bài thi
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Mã bài thi
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Thời gian bắt đầu
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Thời lượng
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Trạng thái
                  </th>
                  <th scope='col' className='relative px-6 py-3'>
                    <span className='sr-only'>Hành động</span>
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {exams.map((exam) => (
                  <tr key={exam._id} className='hover:bg-gray-50'>
                    <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>{exam.title}</td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{exam.exam_code}</td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                      {exam.start_time ? formatDate(exam.start_time) : 'Ngay lập tức'}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>{exam.duration} phút</td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          exam.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {exam.active ? 'Hoạt động' : 'Vô hiệu hóa'}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                      <button
                        onClick={() => navigate(`/teacher/exams/${exam._id}/class-results`)}
                        className='text-blue-600 hover:text-blue-900'
                      >
                        Xem kết quả
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className='px-4 py-5 sm:px-6 text-center'>
              <p className='text-gray-500'>Chưa có bài thi nào cho kỳ thi này.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MasterExamView
