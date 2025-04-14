/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { UserPlus, Users, FileText, BarChart2 } from 'lucide-react'
import { toast } from 'sonner'
import { Tab } from '@headlessui/react'
import adminApi from '../../apis/admin.api'
import UserManagement from './UserManagement'
import ExamStatistics from './ExamStatistics'

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

const AdminDashboard = () => {
  const [dashboardStats, setDashboardStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setIsLoading(true)
      const response = await adminApi.getDashboardStats()
      setDashboardStats(response.data.result as any)
    } catch (error) {
      toast.error('Failed to fetch dashboard statistics')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8'>
      <div className='sm:flex sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Admin Dashboard</h1>
          <p className='mt-2 text-sm text-gray-700'>Manage users, monitor exams, and analyze system usage</p>
        </div>
      </div>

      {/* Statistics Cards */}
      {isLoading ? (
        <div className='mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4'>
          {[...Array(4)].map((_, index) => (
            <div key={index} className='bg-white overflow-hidden shadow rounded-lg animate-pulse'>
              <div className='px-4 py-5 sm:p-6'>
                <div className='h-4 bg-gray-200 rounded w-3/4 mb-4'></div>
                <div className='h-8 bg-gray-200 rounded w-1/2'></div>
              </div>
            </div>
          ))}
        </div>
      ) : dashboardStats ? (
        <div className='mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4'>
          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='px-4 py-5 sm:p-6'>
              <div className='flex items-center'>
                <div className='flex-shrink-0 bg-blue-100 rounded-md p-3'>
                  <Users className='h-6 w-6 text-blue-600' />
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-gray-500 truncate'>Total Users</dt>
                    <dd>
                      <div className='text-lg font-medium text-gray-900'>{dashboardStats.totalUsers}</div>
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
                  <UserPlus className='h-6 w-6 text-indigo-600' />
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-gray-500 truncate'>Teachers</dt>
                    <dd>
                      <div className='text-lg font-medium text-gray-900'>{dashboardStats.totalTeachers}</div>
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
                  <FileText className='h-6 w-6 text-green-600' />
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-gray-500 truncate'>Total Exams</dt>
                    <dd>
                      <div className='text-lg font-medium text-gray-900'>{dashboardStats.totalExams}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className='bg-white overflow-hidden shadow rounded-lg'>
            <div className='px-4 py-5 sm:p-6'>
              <div className='flex items-center'>
                <div className='flex-shrink-0 bg-yellow-100 rounded-md p-3'>
                  <BarChart2 className='h-6 w-6 text-yellow-600' />
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-gray-500 truncate'>Exams Completed</dt>
                    <dd>
                      <div className='text-lg font-medium text-gray-900'>{dashboardStats.completedExams}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className='mt-8 bg-white overflow-hidden shadow rounded-lg p-6'>
          <p className='text-center text-gray-500'>No statistics available</p>
        </div>
      )}

      {/* Tabs for Different Admin Functions */}
      <div className='mt-8'>
        <Tab.Group>
          <Tab.List className='flex space-x-1 rounded-xl bg-blue-50 p-1'>
            <Tab
              className={({ selected }: any) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  selected ? 'bg-white shadow text-blue-700' : 'text-blue-600 hover:bg-white/[0.12] hover:text-blue-700'
                )
              }
            >
              User Management
            </Tab>
            <Tab
              className={({ selected }: any) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  selected ? 'bg-white shadow text-blue-700' : 'text-blue-600 hover:bg-white/[0.12] hover:text-blue-700'
                )
              }
            >
              Exam Statistics
            </Tab>
          </Tab.List>

          <Tab.Panels className='mt-4'>
            <Tab.Panel className='rounded-xl bg-white p-4'>
              <UserManagement />
            </Tab.Panel>

            <Tab.Panel className='rounded-xl bg-white p-4'>
              <ExamStatistics />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  )
}

export default AdminDashboard
