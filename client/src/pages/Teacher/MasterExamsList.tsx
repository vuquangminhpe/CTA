import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, PlusCircle, Search, ArrowLeft, BookOpen, Target, Sparkles } from 'lucide-react'
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
                    onClick={() => navigate('/teacher')}
                    className='mr-6 w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 shadow-lg'
                  >
                    <ArrowLeft className='h-6 w-6 text-gray-600' />
                  </button>
                  <div className='w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mr-6 shadow-lg'>
                    <BookOpen className='w-8 h-8 text-white' />
                  </div>
                  <div>
                    <h2 className='text-4xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent'>
                      Danh sách kỳ thi
                    </h2>
                    <p className='text-xl text-gray-600 font-medium mt-2'>
                      Quản lý tất cả các kỳ thi chính và xem kết quả của học sinh theo lớp
                    </p>
                  </div>
                </div>
              </div>
              <div className='mt-6 lg:mt-0'>
                <button
                  onClick={() => setShowCreateForm(true)}
                  className='inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-2xl hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 hover:scale-105 font-semibold text-lg'
                >
                  <PlusCircle className='mr-3 h-6 w-6' />
                  Tạo kỳ thi mới
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Search Box */}
        <div className='mb-8'>
          <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-6 shadow-xl shadow-blue-500/10'>
            <div className='relative max-w-2xl mx-auto'>
              <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                <Search className='h-6 w-6 text-gray-400' />
              </div>
              <input
                type='text'
                className='w-full pl-12 pr-4 py-4 bg-white/80 backdrop-blur border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 text-gray-900 font-medium shadow-sm text-lg'
                placeholder='Tìm kiếm kỳ thi theo tên, mô tả, học kỳ...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <div className='mb-8'>
            <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-8 shadow-2xl shadow-blue-500/10'>
              <MasterExamForm onSuccess={handleCreateExamSuccess} onCancel={() => setShowCreateForm(false)} />
            </div>
          </div>
        )}

        {/* Master Exams List */}
        {isLoading ? (
          <div className='flex justify-center items-center py-16'>
            <div className='relative'>
              <div className='w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin'></div>
              <div className='absolute inset-0 w-16 h-16 border-4 border-transparent border-t-purple-600 rounded-full animate-spin animation-delay-150'></div>
            </div>
          </div>
        ) : filteredExams.length > 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {filteredExams.map((exam, index) => (
              <div
                key={exam._id}
                className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-xl shadow-blue-500/10 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:scale-105 cursor-pointer overflow-hidden group'
                onClick={() => navigate(`/teacher/master-exams/${exam._id}`)}
              >
                {/* Card Header */}
                <div className='p-6 bg-gradient-to-r from-blue-50/50 to-purple-50/50 border-b border-white/20'>
                  <div className='flex items-start justify-between mb-4'>
                    <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center'>
                      <span className='text-white font-bold text-lg'>{index + 1}</span>
                    </div>
                    {exam.exam_period && (
                      <span className='px-4 py-2 bg-green-100 text-green-800 border border-green-200 rounded-2xl text-sm font-bold'>
                        {exam.exam_period}
                      </span>
                    )}
                  </div>
                  <h3 className='text-2xl font-black text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300'>
                    {exam.name}
                  </h3>
                  {exam.description && (
                    <p className='text-gray-600 font-medium leading-relaxed'>
                      {exam.description.length > 100 ? `${exam.description.substring(0, 100)}...` : exam.description}
                    </p>
                  )}
                </div>

                {/* Card Body */}
                <div className='p-6 space-y-4'>
                  {exam.start_time && (
                    <div className='flex items-center text-gray-600'>
                      <div className='w-10 h-10 bg-gradient-to-br from-green-100 to-emerald-100 rounded-2xl flex items-center justify-center mr-3'>
                        <Calendar className='h-5 w-5 text-green-600' />
                      </div>
                      <div>
                        <div className='text-sm font-semibold text-gray-500 uppercase tracking-wider'>Bắt đầu</div>
                        <div className='font-bold text-gray-900'>{formatDate(exam.start_time)}</div>
                      </div>
                    </div>
                  )}

                  {exam.end_time && (
                    <div className='flex items-center text-gray-600'>
                      <div className='w-10 h-10 bg-gradient-to-br from-red-100 to-pink-100 rounded-2xl flex items-center justify-center mr-3'>
                        <Clock className='h-5 w-5 text-red-600' />
                      </div>
                      <div>
                        <div className='text-sm font-semibold text-gray-500 uppercase tracking-wider'>Kết thúc</div>
                        <div className='font-bold text-gray-900'>{formatDate(exam.end_time)}</div>
                      </div>
                    </div>
                  )}

                  <div className='flex items-center text-gray-600'>
                    <div className='w-10 h-10 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-2xl flex items-center justify-center mr-3'>
                      <Target className='h-5 w-5 text-blue-600' />
                    </div>
                    <div>
                      <div className='text-sm font-semibold text-gray-500 uppercase tracking-wider'>Tạo lúc</div>
                      <div className='font-bold text-gray-900'>{formatDate(exam.created_at)}</div>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className='px-6 pb-6'>
                  <button className='w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-2xl hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 font-semibold group-hover:scale-105'>
                    <Sparkles className='h-5 w-5 inline-block mr-2' />
                    Xem chi tiết
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-2xl shadow-blue-500/10 p-12 text-center'>
            <div className='w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6'>
              <BookOpen className='w-10 h-10 text-gray-400' />
            </div>
            <h3 className='text-2xl font-black text-gray-900 mb-4'>
              {searchTerm ? 'Không tìm thấy kỳ thi phù hợp' : 'Chưa có kỳ thi nào'}
            </h3>
            <p className='text-xl text-gray-600 mb-8'>
              {searchTerm
                ? 'Thử tìm kiếm với từ khóa khác hoặc tạo kỳ thi mới.'
                : 'Bắt đầu bằng cách tạo kỳ thi mới để quản lý các bài kiểm tra của bạn.'}
            </p>
            {searchTerm ? (
              <button
                onClick={() => setSearchTerm('')}
                className='inline-flex items-center px-8 py-4 bg-white/80 text-gray-700 border border-gray-200/50 rounded-2xl hover:bg-white hover:shadow-lg transition-all duration-300 font-semibold text-lg'
              >
                Xóa tìm kiếm
              </button>
            ) : (
              <button
                onClick={() => setShowCreateForm(true)}
                className='inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-2xl hover:from-blue-600 hover:to-cyan-500 transition-all duration-300 shadow-lg hover:shadow-blue-500/25 hover:scale-105 font-semibold text-lg'
              >
                <PlusCircle className='mr-3 h-6 w-6' />
                Tạo kỳ thi đầu tiên
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MasterExamsList
