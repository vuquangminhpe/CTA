/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { BarChart, Search, Calendar, UserCheck, Activity } from 'lucide-react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'
import examApi from '../../apis/exam.api'

interface ExamResultsProps {
  selectedExamId?: string
}

const ExamResults = ({ selectedExamId }: ExamResultsProps) => {
  const navigate = useNavigate()
  const [examResults, setExamResults] = useState<any>([])
  const [selectedExam, setSelectedExam] = useState<string | null>(selectedExamId || null)
  const [exams, setExams] = useState<any>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filteredResults, setFilteredResults] = useState<any>([])
  const [stats, setStats] = useState({
    averageScore: 0,
    completionRate: 0,
    totalSessions: 0,
    violationCount: 0
  })

  // Fetch all exams created by the teacher
  useEffect(() => {
    const fetchExams = async () => {
      try {
        setIsLoading(true)
        const response = await examApi.getExams()
        setExams(response.data.result)

        // If selectedExamId is provided, use it
        if (selectedExamId) {
          setSelectedExam(selectedExamId)
        }

        setIsLoading(false)
      } catch (error) {
        console.error('Failed to fetch exams:', error)
        toast.error('Failed to load exams')
        setIsLoading(false)
      }
    }

    fetchExams()
  }, [selectedExamId])

  // Fetch results for selected exam
  useEffect(() => {
    if (selectedExam) {
      fetchExamResults(selectedExam)
    }
  }, [selectedExam])

  // Open detailed view when exam is selected in dashboard
  const handleViewDetailedResults = (examId: string) => {
    if (!selectedExamId) {
      // Only navigate if we're in the dashboard view
      navigate(`/teacher/exams/${examId}/results`)
    }
  }

  // Filter results based on search term
  useEffect(() => {
    if (!examResults.length) {
      setFilteredResults([])
      return
    }

    if (!searchTerm.trim()) {
      setFilteredResults(examResults)
      return
    }

    const filtered = examResults.filter(
      (result: any) =>
        result.student_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        result.student_username?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    setFilteredResults(filtered)
  }, [searchTerm, examResults])

  // Calculate stats whenever results change
  useEffect(() => {
    if (!examResults.length) return

    const completed = examResults.filter((result: any) => result.completed)
    const averageScore = completed.reduce((sum: number, item: any) => sum + item.score, 0) / (completed.length || 1)
    const violationCount = examResults.reduce((sum: number, item: any) => sum + item.violations, 0)

    setStats({
      averageScore: parseFloat(averageScore.toFixed(2)),
      completionRate: parseFloat(((completed.length / examResults.length) * 100).toFixed(2)),
      totalSessions: examResults.length,
      violationCount
    })
  }, [examResults])

  const fetchExamResults = async (examId: string) => {
    try {
      setIsLoading(true)
      const response = await examApi.getExamResults(examId)
      setExamResults(response.data.result)
      setFilteredResults(response.data.result)
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to fetch exam results:', error)
      toast.error('Failed to load exam results')
      setExamResults([])
      setFilteredResults([])
      setIsLoading(false)
    }
  }

  // Format date nicely
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString()
  }

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h2 className='text-xl font-semibold text-gray-900'>Exam Results</h2>
      </div>

      {/* Exam Selector - Only show in dashboard view, not in detailed view */}
      {!selectedExamId && (
        <div className='bg-white rounded-lg shadow p-4'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>Select an exam to view results</label>
          <select
            className='mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md'
            value={selectedExam || ''}
            onChange={(e) => setSelectedExam(e.target.value)}
          >
            <option value=''>-- Select an exam --</option>
            {exams.map((exam: any) => (
              <option key={exam._id} value={exam._id}>
                {exam.title} - {exam.exam_code}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedExam && (
        <>
          {/* Stats Cards */}
          <div className='grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4'>
            <div className='bg-white overflow-hidden shadow rounded-lg'>
              <div className='px-4 py-5 sm:p-6'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0 bg-blue-100 rounded-md p-3'>
                    <Activity className='h-6 w-6 text-blue-600' />
                  </div>
                  <div className='ml-5 w-0 flex-1'>
                    <dl>
                      <dt className='text-sm font-medium text-gray-500 truncate'>Average Score</dt>
                      <dd>
                        <div className='text-lg font-medium text-gray-900'>{stats.averageScore}%</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className='bg-white overflow-hidden shadow rounded-lg'>
              <div className='px-4 py-5 sm:p-6'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0 bg-green-100 rounded-md p-3'>
                    <UserCheck className='h-6 w-6 text-green-600' />
                  </div>
                  <div className='ml-5 w-0 flex-1'>
                    <dl>
                      <dt className='text-sm font-medium text-gray-500 truncate'>Completion Rate</dt>
                      <dd>
                        <div className='text-lg font-medium text-gray-900'>{stats.completionRate}%</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className='bg-white overflow-hidden shadow rounded-lg'>
              <div className='px-4 py-5 sm:p-6'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0 bg-indigo-100 rounded-md p-3'>
                    <BarChart className='h-6 w-6 text-indigo-600' />
                  </div>
                  <div className='ml-5 w-0 flex-1'>
                    <dl>
                      <dt className='text-sm font-medium text-gray-500 truncate'>Total Sessions</dt>
                      <dd>
                        <div className='text-lg font-medium text-gray-900'>{stats.totalSessions}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className='bg-white overflow-hidden shadow rounded-lg'>
              <div className='px-4 py-5 sm:p-6'>
                <div className='flex items-center'>
                  <div className='flex-shrink-0 bg-red-100 rounded-md p-3'>
                    <Calendar className='h-6 w-6 text-red-600' />
                  </div>
                  <div className='ml-5 w-0 flex-1'>
                    <dl>
                      <dt className='text-sm font-medium text-gray-500 truncate'>Violations</dt>
                      <dd>
                        <div className='text-lg font-medium text-gray-900'>{stats.violationCount}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Search Box */}
          <div className='flex items-center p-2 bg-gray-50 rounded-md shadow-sm'>
            <Search className='h-5 w-5 text-gray-400' aria-hidden='true' />
            <input
              type='text'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder='Search by student name or username...'
              className='ml-2 flex-1 bg-transparent outline-none text-sm text-gray-700'
            />
          </div>

          {/* Results Table */}
          <div className='flex flex-col'>
            <div className='-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8'>
              <div className='py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8'>
                <div className='shadow overflow-hidden border-b border-gray-200 sm:rounded-lg'>
                  {isLoading ? (
                    <div className='bg-white px-4 py-12 text-center'>
                      <div className='inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600'></div>
                      <p className='mt-2 text-gray-500'>Loading results...</p>
                    </div>
                  ) : filteredResults.length > 0 ? (
                    <table className='min-w-full divide-y divide-gray-200'>
                      <thead className='bg-gray-50'>
                        <tr>
                          <th
                            scope='col'
                            className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                          >
                            Học sinh
                          </th>
                          <th
                            scope='col'
                            className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                          >
                            Điểm
                          </th>
                          <th
                            scope='col'
                            className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                          >
                            Hoàn thành
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
                            Thời gian kết thúc
                          </th>
                          <th
                            scope='col'
                            className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                          >
                            số lần vi phạm
                          </th>
                        </tr>
                      </thead>
                      <tbody className='bg-white divide-y divide-gray-200'>
                        {filteredResults.map((result: any) => (
                          <tr
                            key={result._id}
                            className={!selectedExamId ? 'cursor-pointer hover:bg-gray-50' : ''}
                            onClick={() => !selectedExamId && handleViewDetailedResults(selectedExam || '')}
                          >
                            <td className='px-6 py-4 whitespace-nowrap'>
                              <div className='flex items-center'>
                                <div className='ml-4'>
                                  <div className='text-sm font-medium text-gray-900'>
                                    {result.student_name || 'Unknown'}
                                  </div>
                                  <div className='text-sm text-gray-500'>{result.student_username}</div>
                                </div>
                              </div>
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap'>
                              <div
                                className={`text-sm ${result.score >= 70 ? 'text-green-600' : result.score >= 50 ? 'text-yellow-600' : 'text-red-600'} font-medium`}
                              >
                                {result.completed ? `${result.score}%` : 'N/A'}
                              </div>
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap'>
                              <span
                                className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                  result.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                }`}
                              >
                                {result.completed ? 'Completed' : 'In Progress'}
                              </span>
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                              {formatDate(result.start_time)}
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap text-sm text-gray-500'>
                              {result.end_time ? formatDate(result.end_time) : 'N/A'}
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap'>
                              <div
                                className={`text-sm ${result.violations > 0 ? 'text-red-600' : 'text-gray-500'} font-medium`}
                              >
                                {result.violations > 0
                                  ? `${result.violations} lỗi vi phạm ${result.violations !== 1 ? '' : ''}`
                                  : 'None'}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className='bg-white px-4 py-12 text-center'>
                      <p className='text-gray-500'>Không tìm thấy kết quả nào cho kỳ thi này.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {!selectedExam && !isLoading && !selectedExamId && (
        <div className='bg-white rounded-lg shadow p-8 text-center'>
          <BarChart className='mx-auto h-12 w-12 text-gray-400' />
          <h3 className='mt-2 text-lg font-medium text-gray-900'>Chọn một kỳ thi để xem kết quả</h3>
          <p className='mt-1 text-gray-500'>
            Chọn một kỳ thi từ danh sách thả xuống ở trên để xem kết quả và số liệu đánh giá hiệu suất của học sinh.
          </p>
        </div>
      )}
    </div>
  )
}

export default ExamResults
