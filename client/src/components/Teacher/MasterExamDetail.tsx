/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Clock, Settings, Eye, BarChart, Power } from 'lucide-react'
import { toast } from 'sonner'
import examApi from '../../apis/exam.api'
import { useQuery, useMutation } from '@tanstack/react-query'

const MasterExamDetail = () => {
  const { masterExamId } = useParams()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)

  // Fetch master exam with child exams
  const {
    data: masterExam,
    isLoading: isMasterExamLoading,
    refetch
  } = useQuery({
    queryKey: ['masterExam', masterExamId],
    queryFn: async () => {
      const response = await examApi.getMasterExamById(masterExamId as string)
      return response?.data?.result
    }
  })

  // Toggle master exam status
  const toggleMasterExamStatus = useMutation({
    mutationFn: async (active: boolean) => {
      return await examApi.toggleMasterExamStatus(masterExamId as string, active)
    },
    onSuccess: () => {
      refetch()
      toast.success('Master exam status updated successfully')
    }
  })

  // Toggle child exam status
  const toggleExamStatus = useMutation({
    mutationFn: async ({ examId, active }: { examId: string; active: boolean }) => {
      return await examApi.updateExamStatus(examId, { active })
    },
    onSuccess: () => {
      refetch()
      toast.success('Exam status updated successfully')
    }
  })

  useEffect(() => {
    setIsLoading(isMasterExamLoading)
  }, [isMasterExamLoading])

  const handleToggleMasterExamStatus = async () => {
    if (!masterExam) return

    try {
      toggleMasterExamStatus.mutateAsync(!(masterExam as any).active)
    } catch (error) {
      console.error('Error updating master exam status:', error)
    }
  }

  const handleToggleExamStatus = async (examId: string, currentStatus: boolean) => {
    try {
      toggleExamStatus.mutate({
        examId,
        active: !currentStatus
      })
    } catch (error) {
      console.error('Error updating exam status:', error)
    }
  }

  const formatDate = (dateString: string | number | Date) => {
    if (!dateString) return 'Not specified'
    return new Date(dateString).toLocaleString()
  }

  if (isLoading) {
    return (
      <div className='py-8 text-center text-gray-500'>
        <div className='inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600'></div>
        <p className='mt-2'>Loading master exam, please wait a moment...</p>
      </div>
    )
  }

  if (!masterExam) {
    return (
      <div className='bg-white shadow rounded-lg p-6 text-center'>
        <h3 className='mt-2 text-sm font-medium text-gray-900'>Master exam not found</h3>
        <p className='mt-1 text-sm text-gray-500'>
          The master exam you're looking for doesn't exist or you don't have access to it.
        </p>
        <button
          onClick={() => navigate('/teacher')}
          className='mt-4 px-4 py-2 rounded-md bg-blue-600 text-white font-medium hover:bg-blue-700'
        >
          Back to Exam List
        </button>
      </div>
    )
  }

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h2 className='text-lg font-medium text-gray-900'>Master Exam: {masterExam.name}</h2>
        <div className='flex space-x-2'>
          <button
            onClick={handleToggleMasterExamStatus}
            className={`px-4 py-2 rounded-md ${
              masterExam.active ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            } text-white font-medium`}
          >
            {masterExam.active ? 'Deactivate All Exams' : 'Activate All Exams'}
          </button>
        </div>
      </div>

      {/* Master exam details */}
      <div className='bg-white shadow rounded-lg p-6'>
        <h3 className='text-md font-medium text-gray-900 mb-4'>Master Exam Details</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <p className='text-sm text-gray-500'>Description</p>
            <p className='font-medium'>{masterExam.description || 'No description'}</p>
          </div>
          <div>
            <p className='text-sm text-gray-500'>Exam Period</p>
            <p className='font-medium'>{masterExam.exam_period || 'Not specified'}</p>
          </div>
          <div>
            <p className='text-sm text-gray-500'>Start Time</p>
            <p className='font-medium'>{formatDate(masterExam.start_time as any)}</p>
          </div>
          <div>
            <p className='text-sm text-gray-500'>End Time</p>
            <p className='font-medium'>{formatDate(masterExam.end_time as any)}</p>
          </div>
          <div>
            <p className='text-sm text-gray-500'>Status</p>
            <p className={`font-medium ${masterExam.active ? 'text-green-600' : 'text-red-600'}`}>
              {masterExam.active ? 'Active' : 'Inactive'}
            </p>
          </div>
          <div>
            <p className='text-sm text-gray-500'>Created At</p>
            <p className='font-medium'>{formatDate(masterExam.created_at)}</p>
          </div>
        </div>
      </div>

      {/* Child exams list */}
      <div className='bg-white shadow rounded-lg overflow-hidden'>
        <div className='p-4 border-b'>
          <h3 className='text-md font-medium text-gray-900'>Child Exams</h3>
          <p className='text-sm text-gray-500'>
            {masterExam.exams?.length
              ? `${masterExam.exams.length} exams for this master exam`
              : 'No exams for this master exam'}
          </p>
        </div>

        {masterExam.exams && masterExam.exams.length > 0 ? (
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-300'>
              <thead className='bg-gray-50'>
                <tr>
                  <th scope='col' className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'>
                    Title
                  </th>
                  <th scope='col' className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'>
                    Exam Code
                  </th>
                  <th scope='col' className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'>
                    Status
                  </th>
                  <th scope='col' className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'>
                    Start Time
                  </th>
                  <th scope='col' className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'>
                    Duration
                  </th>
                  <th scope='col' className='relative py-3.5 px-3'>
                    <span className='sr-only'>Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className='divide-y divide-gray-200 bg-white'>
                {masterExam?.exams?.map((exam: any) => (
                  <tr key={exam._id}>
                    <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-900'>{exam.title}</td>
                    <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>{exam.exam_code}</td>
                    <td className='whitespace-nowrap px-3 py-4 text-sm'>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          exam.expired
                            ? 'bg-gray-100 text-gray-800'
                            : exam.active
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {exam.expired ? 'Expired' : exam.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>{formatDate(exam.start_time)}</td>
                    <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
                      <div className='flex items-center'>
                        <Clock className='h-4 w-4 mr-1 text-gray-400' />
                        {exam.duration} minutes
                      </div>
                    </td>
                    <td className='whitespace-nowrap px-3 py-4 text-sm text-gray-500'>
                      <div className='flex items-center space-x-2'>
                        {!exam.expired && (
                          <button
                            onClick={() => handleToggleExamStatus(exam._id, exam.active)}
                            className={`p-1.5 rounded-full ${
                              exam.active ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
                            } hover:bg-opacity-70`}
                            title={exam.active ? 'Deactivate' : 'Activate'}
                            disabled={!masterExam.active && exam.active}
                          >
                            <Power className='h-4 w-4' />
                          </button>
                        )}
                        <button
                          onClick={() => navigate(`/teacher/exams/${exam._id}`)}
                          className='p-1.5 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200'
                          title='Exam Settings'
                        >
                          <Settings className='h-4 w-4' />
                        </button>
                        <button
                          onClick={() => navigate(`/teacher/exams/${exam._id}/monitor`)}
                          className='p-1.5 rounded-full bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                          title='Monitor Exam'
                        >
                          <Eye className='h-4 w-4' />
                        </button>
                        <button
                          onClick={() => navigate(`/teacher/exams/${exam._id}/results`)}
                          className='p-1.5 rounded-full bg-purple-100 text-purple-600 hover:bg-purple-200'
                          title='View Results'
                        >
                          <BarChart className='h-4 w-4' />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className='p-6 text-center'>
            <p className='text-gray-500'>No exams for this master exam.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default MasterExamDetail
