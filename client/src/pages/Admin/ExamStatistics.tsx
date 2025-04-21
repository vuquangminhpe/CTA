/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
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
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import { useUserStatistics, useContentStatistics } from '../../hooks/useAdminQuery'

// Mock data for demonstration purposes since we don't have direct exam statistics
const generateMockScoreDistribution = () => {
  return [
    { range: '0-10%', count: Math.floor(Math.random() * 5) },
    { range: '11-20%', count: Math.floor(Math.random() * 10) },
    { range: '21-30%', count: Math.floor(Math.random() * 15) },
    { range: '31-40%', count: Math.floor(Math.random() * 20) },
    { range: '41-50%', count: Math.floor(Math.random() * 25) },
    { range: '51-60%', count: Math.floor(Math.random() * 30) },
    { range: '61-70%', count: Math.floor(Math.random() * 35) },
    { range: '71-80%', count: Math.floor(Math.random() * 40) },
    { range: '81-90%', count: Math.floor(Math.random() * 30) },
    { range: '91-100%', count: Math.floor(Math.random() * 20) }
  ]
}

// Colors for pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042']

const ExamStatistics = () => {
  const [timeRange, setTimeRange] = useState('30')

  // Prepare parameters based on selected time range
  const now = new Date()
  const fromDate = new Date(now)
  fromDate.setDate(now.getDate() - parseInt(timeRange))

  // Format dates for API request
  const from_date = fromDate.toISOString().split('T')[0]
  const to_date = now.toISOString().split('T')[0]

  // Use existing statistics endpoints
  const { data: userStats, isLoading: userStatsLoading } = useUserStatistics({
    from_date,
    to_date,
    interval: timeRange === '7' ? 'daily' : timeRange === '30' ? 'weekly' : 'monthly'
  })

  const { data: contentStats, isLoading: contentStatsLoading } = useContentStatistics({
    from_date,
    to_date,
    interval: timeRange === '7' ? 'daily' : timeRange === '30' ? 'weekly' : 'monthly'
  })

  // State for derived or mock statistics
  const [activityOverTime, setActivityOverTime] = useState<any[]>([])
  const [scoreDistribution, setScoreDistribution] = useState<any[]>([])
  const [summaryStats, setSummaryStats] = useState({
    averageScore: 75.5,
    completionRate: 82.3,
    violationRate: 4.7
  })

  // Generate mock data for demonstration
  useEffect(() => {
    // Mock activity over time
    const mockActivity = Array.from({ length: parseInt(timeRange) }, (_, i) => {
      const date = new Date(now)
      date.setDate(date.getDate() - (parseInt(timeRange) - i))
      return {
        date: date.toISOString().split('T')[0],
        exams_created: Math.floor(Math.random() * 10) + 1,
        exams_taken: Math.floor(Math.random() * 20) + 5
      }
    })

    setActivityOverTime(mockActivity)
    setScoreDistribution(generateMockScoreDistribution())

    // Update summary stats with small random variations
    setSummaryStats({
      averageScore: 70 + Math.random() * 15,
      completionRate: 75 + Math.random() * 20,
      violationRate: 2 + Math.random() * 8
    })
  }, [timeRange])

  const isLoading = userStatsLoading || contentStatsLoading

  // Prepare teacher and student data
  const topTeachers = [
    { _id: '1', name: 'Teacher 1', username: 'teacher1', count: 25 },
    { _id: '2', name: 'Teacher 2', username: 'teacher2', count: 19 },
    { _id: '3', name: 'Teacher 3', username: 'teacher3', count: 15 },
    { _id: '4', name: 'Teacher 4', username: 'teacher4', count: 12 },
    { _id: '5', name: 'Teacher 5', username: 'teacher5', count: 8 }
  ]

  const topStudents = [
    { _id: '1', name: 'Student 1', username: 'student1', exams_taken: 32, average_score: 92.5 },
    { _id: '2', name: 'Student 2', username: 'student2', exams_taken: 28, average_score: 88.2 },
    { _id: '3', name: 'Student 3', username: 'student3', exams_taken: 25, average_score: 85.7 },
    { _id: '4', name: 'Student 4', username: 'student4', exams_taken: 23, average_score: 79.3 },
    { _id: '5', name: 'Student 5', username: 'student5', exams_taken: 20, average_score: 76.8 }
  ]

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
      ) : (
        <div className='space-y-8'>
          {/* Exam Activity Over Time */}
          <div className='bg-white p-6 rounded-lg shadow'>
            <h3 className='text-lg font-medium text-gray-900 mb-4'>Exam Activity Over Time</h3>
            <div className='h-80'>
              <ResponsiveContainer width='100%' height='100%'>
                <LineChart data={activityOverTime} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
                <BarChart data={scoreDistribution} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray='3 3' />
                  <XAxis dataKey='range' />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey='count' fill='#8884d8' name='Number of Students' />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* User Role Distribution (from user stats) */}
          {userStats && (
            <div className='bg-white p-6 rounded-lg shadow'>
              <h3 className='text-lg font-medium text-gray-900 mb-4'>User Role Distribution</h3>
              <div className='h-72 flex items-center justify-center'>
                <ResponsiveContainer width='100%' height='100%'>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Students', value: userStats.by_verification_status?.unverified || 80 },
                        { name: 'Teachers', value: userStats.by_verification_status?.verified || 20 }
                      ]}
                      cx='50%'
                      cy='50%'
                      labelLine={false}
                      outerRadius={120}
                      fill='#8884d8'
                      dataKey='value'
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {[
                        { name: 'Students', value: userStats.by_verification_status?.unverified || 80 },
                        { name: 'Teachers', value: userStats.by_verification_status?.verified || 20 }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

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
                    {topTeachers.map((teacher, index) => (
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
                    {topStudents.map((student, index) => (
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
              <p className='text-3xl font-bold text-blue-600'>{summaryStats.averageScore.toFixed(1)}%</p>
            </div>

            <div className='bg-white p-6 rounded-lg shadow'>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>Completion Rate</h3>
              <p className='text-3xl font-bold text-green-600'>{summaryStats.completionRate.toFixed(1)}%</p>
            </div>

            <div className='bg-white p-6 rounded-lg shadow'>
              <h3 className='text-lg font-medium text-gray-900 mb-2'>Violation Rate</h3>
              <p className='text-3xl font-bold text-red-600'>{summaryStats.violationRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExamStatistics
