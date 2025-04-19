/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Calendar, Clock, Settings, Eye, BarChart, Power, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import examApi from '../../apis/exam.api'
import { useQuery, useMutation } from '@tanstack/react-query'

const ExamList = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)

  const {
    data: masterExams,
    isLoading: isMasterExamsLoading,
    refetch
  } = useQuery({
    queryKey: ['masterExams'],
    queryFn: async () => {
      const response = await examApi.getMasterExams()
      return response.data.data
    }
  })

  // Toggle master exam status
  const toggleMasterExamStatus = useMutation({
    mutationFn: async ({ masterExamId, active }: { masterExamId: string; active: boolean }) => {
      return await examApi.toggleMasterExamStatus(masterExamId, active)
    },
    onSuccess: () => {
      refetch()
      toast.success('Master exam status updated successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to update master exam status')
    }
  })

  // Delete master exam
  const deleteMasterExam = useMutation({
    mutationFn: async (masterExamId: string) => {
      return await examApi.deleteMasterExam(masterExamId)
    },
    onSuccess: () => {
      refetch()
      toast.success('Master exam deleted successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Failed to delete master exam')
    }
  })

  useEffect(() => {
    setIsLoading(isMasterExamsLoading)
  }, [isMasterExamsLoading])

  const handleToggleMasterExamStatus = async (masterExamId: string, currentStatus: boolean) => {
    try {
      toggleMasterExamStatus.mutate({
        masterExamId,
        active: !currentStatus
      })
    } catch (error) {
      console.error('Error updating master exam status:', error)
      toast.error('Failed to update master exam status')
    }
  }

  const handleDeleteMasterExam = async (masterExamId: string, isActive: boolean, startTime: string) => {
    try {
      // Check if exam has already started
      if (startTime && new Date(startTime) <= new Date()) {
        toast.error('Cannot delete: Exam has already started')
        return
      }

      // Check if exam is active
      if (isActive) {
        toast.error('Cannot delete: Master exam is active. Please deactivate it first.')
        return
      }

      if (window.confirm('Are you sure you want to delete this master exam? This cannot be undone.')) {
        deleteMasterExam.mutate(masterExamId)
      }
    } catch (error) {
      console.error('Error deleting master exam:', error)
    }
  }

  const formatDate = (dateString: string | number | Date) => {
    if (!dateString) return 'Not specified'
    return new Date(dateString).toLocaleString()
  }

  const renderStatusBadge = (masterExam: any) => {
    // Check if exam has expired
    const hasExpired = masterExam.end_time && new Date(masterExam.end_time) < new Date()

    if (hasExpired) {
      return <span className='px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800'>Expired</span>
    }

    // Check child exams status
    if (masterExam.examStatus) {
      const { total, active } = masterExam.examStatus
      if (total === 0) {
        return (
          <span className='px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800'>
            No exams created
          </span>
        )
      }

      return (
        <span
          className={`px-2 py-1 text-xs font-medium rounded-full ${
            active === 0
              ? 'bg-red-100 text-red-800'
              : active === total
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
          }`}
        >
          {active}/{total} active
        </span>
      )
    }

    return <span className='px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800'>Unknown</span>
  }

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h2 className='text-lg font-medium text-gray-900'>Master Exam List</h2>
      </div>

      {isLoading ? (
        <div className='py-8 text-center text-gray-500'>
          <div className='inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600'></div>
          <p className='mt-2'>Loading master exams, please wait a moment...</p>
        </div>
      ) : !masterExams || masterExams.length === 0 ? (
        <div className='bg-white shadow rounded-lg p-6 text-center'>
          <Calendar className='h-12 w-12 text-gray-400 mx-auto' />
          <h3 className='mt-2 text-sm font-medium text-gray-900'>No master exams created yet</h3>
          <p className='mt-1 text-sm text-gray-500'>No master exams are available at this time.</p>
        </div>
      ) : (
        <div className='overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg'>
          <table className='min-w-full divide-y divide-gray-300'>
            <thead className='bg-gray-50'>
              <tr>
                <th scope='col' className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'>
                  Master Exam Name
                </th>
                <th scope='col' className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'>
                  Description
                </th>
                <th scope='col' className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'>
                  Status
                </th>
                <th scope='col' className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'>
                  Period
                </th>
                <th scope='col' className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'>
                  Start/End Time
                </th>
                <th scope='col' className='relative py-3.5 px-3'>
                  <span className='sr-only'>Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className='divide-y divide-gray-200 bg-white'>
              {masterExams.map((masterExam: any) => (
                <tr key={masterExam._id}>
                  <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-900'>{masterExam.name}</td>
                  <td className='px-3 py-4 text-sm text-gray-500'>{masterExam.description || 'No description'}</td>
                  <td className='whitespace-nowrap px-3 py-4 text-sm'>{renderStatusBadge(masterExam)}</td>
                  <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
                    {masterExam.exam_period || 'Not specified'}
                  </td>
                  <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
                    <div className='flex flex-col space-y-1'>
                      <div className='flex items-center'>
                        <Calendar className='h-4 w-4 mr-1 text-gray-400' />
                        Start: {formatDate(masterExam.start_time)}
                      </div>
                      <div className='flex items-center'>
                        <Clock className='h-4 w-4 mr-1 text-gray-400' />
                        End: {formatDate(masterExam.end_time)}
                      </div>
                    </div>
                  </td>
                  <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
                    <div className='flex items-center space-x-2'>
                      <button
                        onClick={() => handleToggleMasterExamStatus(masterExam._id, masterExam.active)}
                        className={`p-1.5 rounded-full ${
                          masterExam.active ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                        } hover:bg-opacity-70`}
                        title={masterExam.active ? 'Deactivate all exams' : 'Activate exams'}
                      >
                        <Power className='h-4 w-4' />
                      </button>
                      <button
                        onClick={() => navigate(`/teacher/master-exams/${masterExam._id}`)}
                        className='p-1.5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200'
                        title='View master exam details'
                      >
                        <Settings className='h-4 w-4' />
                      </button>
                      <button
                        onClick={() => navigate(`/teacher/master-exams/${masterExam._id}/monitor`)}
                        className='p-1.5 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                        title='Monitor exams'
                      >
                        <Eye className='h-4 w-4' />
                      </button>
                      <button
                        onClick={() => navigate(`/teacher/master-exams/${masterExam._id}/results`)}
                        className='p-1.5 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200'
                        title='View results'
                      >
                        <BarChart className='h-4 w-4' />
                      </button>
                      <button
                        onClick={() => handleDeleteMasterExam(masterExam._id, masterExam.active, masterExam.start_time)}
                        className='p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200'
                        title='Delete master exam'
                        disabled={
                          masterExam.active || (masterExam.start_time && new Date(masterExam.start_time) <= new Date())
                        }
                      >
                        <Trash2 className='h-4 w-4' />
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
