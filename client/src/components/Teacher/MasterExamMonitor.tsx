import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import examApi from '../../apis/exam.api'
import { useQuery } from '@tanstack/react-query'

const MasterExamMonitor = () => {
  const { masterExamId } = useParams()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)

  // Fetch master exam details
  const masterExamQuery = useQuery({
    queryKey: ['masterExam', masterExamId],
    queryFn: async () => {
      const response = await examApi.getMasterExamById(masterExamId as string)
      return response?.data?.result || null
    },
    enabled: !!masterExamId
  })

  // Fetch child exams
  const childExamsQuery = useQuery({
    queryKey: ['examsByMasterExam', masterExamId],
    queryFn: async () => {
      const response = await examApi.getExamsByMasterExamId(masterExamId as string)
      return response?.data?.result || []
    },
    enabled: !!masterExamId
  })

  useEffect(() => {
    if (masterExamQuery.error) {
      toast.error('Không thể tải kỳ thi chính')
    }
  }, [masterExamQuery.error])

  useEffect(() => {
    if (childExamsQuery.error) {
      toast.error('Không thể tải các bài thi con')
    }
  }, [childExamsQuery.error])

  useEffect(() => {
    setIsLoading(masterExamQuery.isLoading || childExamsQuery.isLoading)
  }, [masterExamQuery.isLoading, childExamsQuery.isLoading])

  if (isLoading) {
    return (
      <div className='py-8 text-center text-gray-500'>
        <div className='inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600'></div>
        <p className='mt-2'>Đang tải giám sát kỳ thi chính, vui lòng đợi...</p>
      </div>
    )
  }

  const masterExam = masterExamQuery.data
  const childExams = childExamsQuery.data || []

  if (!masterExam) {
    return (
      <div className='py-8 text-center'>
        <h2 className='text-xl font-medium mb-2'>Không tìm thấy kỳ thi</h2>
        <p className='text-gray-600 mb-4'>Kỳ thi bạn đang cố giám sát không tồn tại</p>
        <button
          onClick={() => navigate('/teacher')}
          className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
        >
          Trở về Trang chủ
        </button>
      </div>
    )
  }

  // Count active exams
  const activeExamsCount = childExams.filter((exam) => exam.active).length

  // Count started exams
  const startedExamsCount = childExams.filter(
    (exam) => exam.start_time && new Date(exam.start_time) <= new Date()
  ).length

  return (
    <div className='space-y-6 mt-20 mx-3'>
      <div className='flex justify-between items-center'>
        <h2 className='text-lg font-medium text-gray-900'>Giám sát kỳ thi chính: {masterExam.name}</h2>
        <button
          onClick={() => navigate(`/teacher/master-exams/${masterExamId}`)}
          className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
        >
          Trở về kỳ thi chính
        </button>
      </div>

      <div className='bg-white shadow rounded-lg p-6'>
        <h3 className='text-md font-medium text-gray-900 mb-4'>Bảng điều khiển giám sát kỳ thi chính</h3>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-6'>
          <div className='bg-blue-50 p-4 rounded-lg'>
            <p className='text-sm text-gray-500'>Tổng số bài thi con</p>
            <p className='text-2xl font-bold'>{childExams.length}</p>
          </div>
          <div className='bg-green-50 p-4 rounded-lg'>
            <p className='text-sm text-gray-500'>Bài thi đang hoạt động</p>
            <p className='text-2xl font-bold'>{activeExamsCount}</p>
          </div>
          <div className='bg-purple-50 p-4 rounded-lg'>
            <p className='text-sm text-gray-500'>Bài thi đã bắt đầu</p>
            <p className='text-2xl font-bold'>{startedExamsCount}</p>
          </div>
        </div>

        {/* Child exams list */}
        <div className='mt-6'>
          <h4 className='text-md font-medium text-gray-900 mb-2'>Danh sách bài thi con</h4>

          {childExams.length > 0 ? (
            <div className='overflow-x-auto'>
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
                    <th scope='col' className='relative py-3.5 px-3'>
                      <span className='sr-only'>Hành động</span>
                    </th>
                  </tr>
                </thead>
                <tbody className='divide-y divide-gray-200 bg-white'>
                  {childExams.map((exam) => {
                    // Check if exam is expired
                    const isExpired =
                      exam.start_time &&
                      new Date(new Date(exam.start_time).getTime() + exam.duration * 60000) < new Date()

                    return (
                      <tr key={exam._id}>
                        <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-900'>{exam.title}</td>
                        <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>{exam.exam_code}</td>
                        <td className='whitespace-nowrap px-3 py-4 text-sm'>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              isExpired
                                ? 'bg-gray-100 text-gray-800'
                                : exam.active
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {isExpired ? 'Hết hạn' : exam.active ? 'Đang hoạt động' : 'Không hoạt động'}
                          </span>
                        </td>
                        <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
                          {exam.start_time ? new Date(exam.start_time).toLocaleString() : 'Chưa lên lịch'}
                        </td>
                        <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
                          <button
                            onClick={() => navigate(`/teacher/exams/${exam._id}/monitor`)}
                            className='px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700'
                          >
                            Giám sát
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className='text-center py-4 text-gray-500'>Không tìm thấy bài thi con nào cho kỳ thi chính này.</div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MasterExamMonitor
