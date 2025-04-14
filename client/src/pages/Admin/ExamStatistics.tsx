/* eslint-disable @typescript-eslint/no-explicit-any */
import adminApi from '../../apis/admin.api'
import { useState, useEffect } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'
import { toast } from 'sonner'

const ExamStatistics = () => {
  const [statistics, setStatistics] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('7')

  useEffect(() => {
    fetchExamStatistics()
  }, [timeRange])

  const fetchExamStatistics = async () => {
    try {
      setIsLoading(true)
      const response = await adminApi.getExamStatistics({ days: parseInt(timeRange) })
      setStatistics(response.data.result as any)
    } catch (error) {
      toast.error('Failed to fetch exam statistics')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h2 className='text-xl font-semibold text-gray-900'>Exam Statistics</h2>
        <div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className='ml-2 block rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
          >
            <option value='7'>Last 7 days</option>
            <option value='30'>Last 30 days</option>
            <option value='90'>Last 90 days</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className='py-8 text-center text-gray-500'>Loading statistics...</div>
      ) : statistics ? (
        <div className='space-y-8'>
          {/* Exam Activity Over Time */}
          <div className='bg-white p-6 rounded-lg shadow'>
            <h3 className='text-lg font-medium text-gray-900 mb-4'>Exam Activity Over Time</h3>
            <div className='h-80'>
              <ResponsiveContainer width='100%' height='100%'>
                <LineChart data={statistics.activityOverTime} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='date' />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type='monotone' dataKey='exams_created' stroke='#8884d8' name='Exams Created' />
                  <Line type='monotone' dataKey='exams_taken' stroke='#82ca9d' name='Exams Taken' />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Score Distribution */}
          <div className='bg-white p-6 rounded-lg shadow'>
            <h3 className='text-lg font-medium text-gray-900 mb-4'>Score Distribution</h3>
            <div className='h-72'>
              <ResponsiveContainer width='100%' height='100%'>
                <BarChart data={statistics.scoreDistribution} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='range' />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey='count' fill='#8884d8' name='Number of Students' />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top Teachers and Top Students */}
          <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
            <div className='bg-white p-6 rounded-lg shadow'>
              <h3 className='text-lg font-medium text-gray-900 mb-4'>Top Teachers by Exams Created</h3>
              <div className='overflow-y-auto max-h-72'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Name
                      </th>
                      <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Exams Created
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {statistics.topTeachers.map((teacher: any, index: number) => (
                      <tr key={index}>
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                          {teacher.name || teacher.username}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500'>
                          {teacher.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className='bg-white p-6 rounded-lg shadow'>
              <h3 className='text-lg font-medium text-gray-900 mb-4'>Top Students by Exams Taken</h3>
              <div className='overflow-y-auto max-h-72'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='bg-gray-50'>
                    <tr>
                      <th className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Name
                      </th>
                      <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Exams Taken
                      </th>
                      <th className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'>
                        Avg. Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className='bg-white divide-y divide-gray-200'>
                    {statistics.topStudents.map((student: any, index: number) => (
                      <tr key={index}>
                        <td className='px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900'>
                          {student.name || student.username}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500'>
                          {student.exams_taken}
                        </td>
                        <td className='px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500'>
                          {student.average_score.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Summary Statistics */}
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
            <div className='bg-white p-6 rounded-lg shadow'>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>Average Score</h3>
              <p className='text-3xl font-bold text-blue-600'>{statistics.averageScore.toFixed(1)}%</p>
            </div>

            <div className='bg-white p-6 rounded-lg shadow'>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>Completion Rate</h3>
              <p className='text-3xl font-bold text-green-600'>{statistics.completionRate.toFixed(1)}%</p>
            </div>

            <div className='bg-white p-6 rounded-lg shadow'>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>Violation Rate</h3>
              <p className='text-3xl font-bold text-red-600'>{statistics.violationRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      ) : (
        <div className='py-8 text-center text-gray-500'>No statistics available</div>
      )}
    </div>
  )
}

export default ExamStatistics
