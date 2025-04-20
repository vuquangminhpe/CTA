import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { toast } from 'sonner'
import examApi from '../../apis/exam.api'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8']

const MasterExamResults = () => {
  const { masterExamId } = useParams()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [aggregatedData, setAggregatedData] = useState({
    totalSessions: 0,
    completedSessions: 0,
    averageScore: 0,
    violationCount: 0,
    scoreDistribution: [
      { range: '0-20', count: 0 },
      { range: '21-40', count: 0 },
      { range: '41-60', count: 0 },
      { range: '61-80', count: 0 },
      { range: '81-100', count: 0 }
    ]
  })

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

  // Show error messages
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

  // Process data when child exams are loaded
  useEffect(() => {
    const processExamData = async () => {
      const exams = childExamsQuery.data
      if (!exams || exams.length === 0) return

      try {
        // Fetch statistics for each exam
        const statsPromises = exams.map((exam) =>
          examApi
            .getExamStatistics(exam._id)
            .then((res) => res.data.result)
            .catch((err) => {
              console.error(`Lỗi khi lấy thống kê cho bài thi ${exam._id}:`, err)
              return null
            })
        )

        const resultsPromises = exams.map((exam) =>
          examApi
            .getExamResults(exam._id)
            .then((res) => res.data.result)
            .catch((err) => {
              console.error(`Lỗi khi lấy kết quả cho bài thi ${exam._id}:`, err)
              return []
            })
        )

        const [statsResults, examsResults] = await Promise.all([
          Promise.all(statsPromises),
          Promise.all(resultsPromises)
        ])

        const validStats = statsResults.filter(Boolean)
        const allSessions = examsResults.flat()

        if (validStats.length > 0) {
          // Aggregate statistics
          const totalSessions = validStats.reduce((sum, stat) => sum + (stat.totalStudents || 0), 0)
          const completedSessions = validStats.reduce(
            (sum, stat) => sum + ((stat.totalStudents || 0) * (stat.completionRate || 0)) / 100,
            0
          )
          const totalScore = validStats.reduce(
            (sum, stat) => sum + (stat.averageScore || 0) * (stat.totalStudents || 0),
            0
          )
          const averageScore = totalSessions > 0 ? totalScore / totalSessions : 0
          const violationCount = validStats.reduce((sum, stat) => sum + (stat.violationCount || 0), 0)

          // Calculate score distribution
          const scoreDistribution = [
            { range: '0-20', count: 0 },
            { range: '21-40', count: 0 },
            { range: '41-60', count: 0 },
            { range: '61-80', count: 0 },
            { range: '81-100', count: 0 }
          ]

          allSessions.forEach((session) => {
            if (session.score <= 20) scoreDistribution[0].count++
            else if (session.score <= 40) scoreDistribution[1].count++
            else if (session.score <= 60) scoreDistribution[2].count++
            else if (session.score <= 80) scoreDistribution[3].count++
            else scoreDistribution[4].count++
          })

          setAggregatedData({
            totalSessions,
            completedSessions,
            averageScore,
            violationCount,
            scoreDistribution
          })
        }
      } catch (error) {
        console.error('Lỗi khi xử lý dữ liệu bài thi:', error)
        toast.error('Lỗi khi xử lý kết quả bài thi')
      }
    }

    if (childExamsQuery.data) {
      processExamData()
    }
  }, [childExamsQuery.data])

  // Update loading state
  useEffect(() => {
    setIsLoading(masterExamQuery.isLoading || childExamsQuery.isLoading)
  }, [masterExamQuery.isLoading, childExamsQuery.isLoading])

  const formatPercentage = (value: number) => `${Math.round(value)}%`

  if (isLoading) {
    return (
      <div className='py-8 text-center text-gray-500'>
        <div className='inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600'></div>
        <p className='mt-2'>Đang tải kết quả kỳ thi chính, vui lòng đợi...</p>
      </div>
    )
  }

  const masterExam = masterExamQuery.data
  const childExams = childExamsQuery.data || []

  if (!masterExam) {
    return (
      <div className='py-8 text-center'>
        <h2 className='text-xl font-medium mb-2'>Không tìm thấy bài thi</h2>
        <p className='text-gray-600 mb-4'>Kết quả bài thi bạn đang cố xem không tồn tại</p>
        <button
          onClick={() => navigate('/teacher')}
          className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
        >
          Trở về Trang chủ
        </button>
      </div>
    )
  }

  const completionRate =
    aggregatedData.totalSessions > 0 ? (aggregatedData.completedSessions / aggregatedData.totalSessions) * 100 : 0

  return (
    <div className='space-y-6 mt-20 mx-3'>
      <div className='flex justify-between items-center'>
        <h2 className='text-lg font-medium text-gray-900'>Kết quả kỳ thi chính: {masterExam.name}</h2>
        <button
          onClick={() => navigate(`/teacher/master-exams/${masterExamId}`)}
          className='inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200'
        >
          <ArrowLeft className='mr-2 h-4 w-4 text-gray-500' />
          Trở về kỳ thi chính
        </button>
      </div>

      <div className='bg-white shadow rounded-lg p-6'>
        <h3 className='text-md font-medium text-gray-900 mb-4'>Tổng kết kết quả</h3>

        <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
          <div className='bg-blue-50 p-4 rounded-lg'>
            <p className='text-sm text-gray-500'>Tổng số học sinh tham gia</p>
            <p className='text-2xl font-bold'>{aggregatedData.totalSessions}</p>
          </div>
          <div className='bg-green-50 p-4 rounded-lg'>
            <p className='text-sm text-gray-500'>Điểm trung bình</p>
            <p className='text-2xl font-bold'>{aggregatedData.averageScore.toFixed(1)}%</p>
          </div>
          <div className='bg-purple-50 p-4 rounded-lg'>
            <p className='text-sm text-gray-500'>Tỷ lệ hoàn thành</p>
            <p className='text-2xl font-bold'>{completionRate.toFixed(1)}%</p>
          </div>
          <div className='bg-yellow-50 p-4 rounded-lg'>
            <p className='text-sm text-gray-500'>Tổng số vi phạm</p>
            <p className='text-2xl font-bold'>{aggregatedData.violationCount}</p>
          </div>
        </div>

        {/* Score Distribution */}
        {aggregatedData.totalSessions > 0 && (
          <div className='mt-8'>
            <h4 className='text-md font-medium text-gray-900 mb-4'>Phân phối điểm số</h4>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <div className='h-64'>
                <ResponsiveContainer width='100%' height='100%'>
                  <BarChart data={aggregatedData.scoreDistribution} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray='3 3' />
                    <XAxis dataKey='range' />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey='count' name='Số học sinh' fill='#8884d8' />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className='h-64'>
                <ResponsiveContainer width='100%' height='100%'>
                  <PieChart>
                    <Pie
                      data={aggregatedData.scoreDistribution}
                      cx='50%'
                      cy='50%'
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${formatPercentage(percent * 100)}`}
                      outerRadius={80}
                      fill='#8884d8'
                      dataKey='count'
                      nameKey='range'
                    >
                      {aggregatedData.scoreDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Child exams results */}
        <div className='mt-8'>
          <h4 className='text-md font-medium text-gray-900 mb-2'>Kết quả các bài thi con</h4>

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
                    <th scope='col' className='px-3 py-3.5 text-center text-sm font-semibold text-gray-900'>
                      Học sinh tham gia thi
                    </th>
                    <th scope='col' className='px-3 py-3.5 text-center text-sm font-semibold text-gray-900'>
                      Điểm TB
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
                        <td className='whitespace-nowrap px-3 py-4 text-sm text-center text-gray-500'>
                          {/* This would come from the statistics query */}-
                        </td>
                        <td className='whitespace-nowrap px-3 py-4 text-sm text-center text-gray-500'>
                          {/* This would come from the statistics query */}-
                        </td>
                        <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
                          <button
                            onClick={() => navigate(`/teacher/exams/${exam._id}/results`)}
                            className='px-3 py-1 bg-purple-600 text-white rounded-md hover:bg-purple-700'
                          >
                            Xem kết quả
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

export default MasterExamResults
