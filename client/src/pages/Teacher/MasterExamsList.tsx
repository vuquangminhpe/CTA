import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, PlusCircle, Search, ArrowLeft, BookOpen, School } from 'lucide-react'
import { toast } from 'sonner'
import examApi from '../../apis/exam.api'
import MasterExamForm from '../../components/Teacher/MasterExamForm'

interface MasterExam {
  _id: string
  name: string
  description?: string
  exam_period?: string
  start_time?: string
  end_time?: string
  created_at: string
  updated_at: string
  teacher_id: string
}

const MasterExamsList: React.FC = () => {
  const navigate = useNavigate()
  const [masterExams, setMasterExams] = useState<MasterExam[]>([])
  const [filteredExams, setFilteredExams] = useState<MasterExam[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch all master exams on component mount
  useEffect(() => {
    fetchMasterExams()
  }, [])

  // Filter exams when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredExams(masterExams)
      return
    }

    const filtered = masterExams.filter(
      (exam) =>
        exam.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exam.description && exam.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (exam.exam_period && exam.exam_period.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    setFilteredExams(filtered)
  }, [searchTerm, masterExams])

  const fetchMasterExams = async () => {
    try {
      setIsLoading(true)
      const response = await examApi.getMasterExams()
      console.log(response)

      setMasterExams(response.data.result)
      setFilteredExams(response.data.result)
    } catch (error) {
      console.error('Failed to fetch master exams:', error)
      toast.error('Không thể tải danh sách kỳ thi')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateExamSuccess = () => {
    setShowCreateForm(false)
    fetchMasterExams()
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleString()
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
            <h2 className='text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate flex items-center'>
              <BookOpen className='mr-2 h-8 w-8 text-blue-500' />
              Danh sách kỳ thi
            </h2>
          </div>
          <p className='mt-1 text-sm text-gray-500'>
            Quản lý tất cả các kỳ thi chính và xem kết quả của học sinh theo lớp
          </p>
        </div>
        <div className='mt-4 flex md:mt-0 md:ml-4'>
          <button
            type='button'
            onClick={() => setShowCreateForm(true)}
            className='inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700'
          >
            <PlusCircle className='mr-2 -ml-1 h-5 w-5' />
            Tạo kỳ thi mới
          </button>
        </div>
      </div>

      {/* Search box */}
      <div className='mb-6'>
        <div className='mt-1 relative rounded-md shadow-sm'>
          <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
            <Search className='h-5 w-5 text-gray-400' />
          </div>
          <input
            type='text'
            className='focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md'
            placeholder='Tìm kiếm kỳ thi theo tên, mô tả, học kỳ...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className='mb-6'>
          <MasterExamForm onSuccess={handleCreateExamSuccess} onCancel={() => setShowCreateForm(false)} />
        </div>
      )}

      {/* Master Exams List */}
      {isLoading ? (
        <div className='flex justify-center items-center py-12'>
          <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600'></div>
        </div>
      ) : filteredExams.length > 0 ? (
        <div className='bg-white shadow overflow-hidden sm:rounded-md'>
          <ul className='divide-y divide-gray-200'>
            {filteredExams.map((exam) => (
              <li key={exam._id}>
                <div
                  className='block hover:bg-gray-50 cursor-pointer'
                  onClick={() => navigate(`/teacher/master-exams/${exam._id}`)}
                >
                  <div className='px-4 py-4 sm:px-6'>
                    <div className='flex items-center justify-between'>
                      <p className='text-lg font-medium text-blue-600 truncate'>{exam.name}</p>
                      <div className='ml-2 flex-shrink-0 flex'>
                        {exam.exam_period && (
                          <p className='px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800'>
                            {exam.exam_period}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className='mt-2 sm:flex sm:justify-between'>
                      <div className='sm:flex'>
                        {exam.description && (
                          <p className='flex items-center text-sm text-gray-500'>
                            <School className='flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400' />
                            {exam.description}
                          </p>
                        )}
                      </div>
                      <div className='mt-2 flex items-center text-sm text-gray-500 sm:mt-0'>
                        <div className='flex space-x-4'>
                          {exam.start_time && (
                            <div className='flex items-center'>
                              <Calendar className='flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400' />
                              <p>Bắt đầu: {formatDate(exam.start_time)}</p>
                            </div>
                          )}
                          {exam.end_time && (
                            <div className='flex items-center'>
                              <Clock className='flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400' />
                              <p>Kết thúc: {formatDate(exam.end_time)}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className='bg-white shadow sm:rounded-lg p-6 text-center'>
          <BookOpen className='mx-auto h-12 w-12 text-gray-400' />
          <h3 className='mt-2 text-sm font-medium text-gray-900'>
            {searchTerm ? 'Không tìm thấy kỳ thi phù hợp' : 'Chưa có kỳ thi nào'}
          </h3>
          <p className='mt-1 text-sm text-gray-500'>
            {searchTerm
              ? 'Thử tìm kiếm với từ khóa khác hoặc tạo kỳ thi mới.'
              : 'Bắt đầu bằng cách tạo kỳ thi mới để quản lý các bài kiểm tra của bạn.'}
          </p>
          {searchTerm && (
            <div className='mt-6'>
              <button
                type='button'
                onClick={() => setSearchTerm('')}
                className='inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50'
              >
                Xóa tìm kiếm
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default MasterExamsList
