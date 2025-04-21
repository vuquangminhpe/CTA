/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Clock, Calendar, Users, FileText, BarChart2, Trash2, Eye, Power } from 'lucide-react'
import { toast } from 'sonner'
import examApi from '../../apis/exam.api'
import { useDeleteMasterExam } from '../../hooks/useAdminQuery'

const MasterExamView = () => {
  const { masterExamId } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // Fetch master exam details
  const {
    data: masterExam,
    isLoading: isLoadingMasterExam,
    isError: isMasterExamError,
    error: masterExamError
  } = useQuery({
    queryKey: ['masterExam', masterExamId],
    queryFn: async () => {
      const response = await examApi.getMasterExamById(masterExamId as string)

      return response.data.result
    },
    enabled: !!masterExamId
  })

  // Fetch exams associated with this master exam
  const {
    data: exams,
    isLoading: isLoadingExams,
    isError: isExamsError
  } = useQuery({
    queryKey: ['masterExamExams', masterExamId],
    queryFn: async () => {
      const response = await examApi.getExamsByMasterExamId(masterExamId as string)
      return response.data.result
    },
    enabled: !!masterExamId
  })

  // Fetch classes that participated in this master exam
  const { data: classes, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['masterExamClasses', masterExamId],
    queryFn: async () => {
      const response = await examApi.getClassesForMasterExam(masterExamId as string)

      return response.data.result
    },
    enabled: !!masterExamId
  })

  // Mutation for toggling master exam status
  const toggleStatusMutation = useMutation({
    mutationFn: (active: boolean) => examApi.toggleMasterExamStatus(masterExamId as string, active),
    onSuccess: () => {
      toast.success(`Status ${masterExam?.active ? 'deactivated' : 'activated'} successfully`)
      queryClient.invalidateQueries({ queryKey: ['masterExam', masterExamId] })
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update status')
    }
  })

  // Delete master exam mutation
  const deleteMasterExamMutation = useDeleteMasterExam()

  const handleToggleStatus = () => {
    if (masterExam) {
      toggleStatusMutation.mutate(!masterExam.active)
    }
  }

  const handleDeleteMasterExam = () => {
    deleteMasterExamMutation.mutate(masterExamId as string, {
      onSuccess: () => {
        toast.success('Master exam deleted successfully')
        navigate('/admin')
      }
    })
    setIsDeleteModalOpen(false)
  }

  // Error handling
  useEffect(() => {
    if (isMasterExamError) {
      toast.error('Failed to load master exam details')
      console.error('Master exam error:', masterExamError)
    }

    if (isExamsError) {
      toast.error('Failed to load exams for this master exam')
    }
  }, [isMasterExamError, isExamsError, masterExamError])

  if (isLoadingMasterExam) {
    return (
      <div className='max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8'>
        <div className='animate-pulse space-y-6'>
          <div className='h-10 bg-gray-200 rounded w-1/4'></div>
          <div className='h-40 bg-gray-200 rounded'></div>
          <div className='h-60 bg-gray-200 rounded'></div>
        </div>
      </div>
    )
  }

  if (isMasterExamError || !masterExam) {
    return (
      <div className='max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8'>
        <div className='bg-red-50 border border-red-200 text-red-800 rounded-lg p-4'>
          <h3 className='text-lg font-medium'>Error loading master exam</h3>
          <p className='mt-2'>
            Could not load the requested master exam. It may have been deleted or you may not have permission to view
            it.
          </p>
          <button
            onClick={() => navigate('/admin')}
            className='mt-4 px-4 py-2 bg-red-100 text-red-800 rounded hover:bg-red-200'
          >
            Go Back
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8'>
      {/* Back Button */}
      <button onClick={() => navigate('/admin')} className='mb-6 flex items-center text-blue-600 hover:text-blue-800'>
        <ArrowLeft size={16} className='mr-1' /> Back to Admin Dashboard
      </button>

      {/* Header */}
      <div className='bg-white shadow rounded-lg p-6 mb-8'>
        <div className='flex justify-between items-start'>
          <div>
            <h1 className='text-2xl font-bold text-gray-900'>{masterExam.name}</h1>
            {masterExam.description && <p className='mt-2 text-gray-600'>{masterExam.description}</p>}
          </div>
          <div className='flex space-x-2'>
            <button
              onClick={handleToggleStatus}
              disabled={toggleStatusMutation.isPending}
              className={`px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                masterExam.active
                  ? 'bg-red-100 text-red-800 hover:bg-red-200 focus:ring-red-500'
                  : 'bg-green-100 text-green-800 hover:bg-green-200 focus:ring-green-500'
              }`}
            >
              <Power size={16} className='inline mr-1' />
              {masterExam.active ? 'Deactivate' : 'Activate'}
            </button>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className='px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
            >
              <Trash2 size={16} className='inline mr-1' />
              Delete
            </button>
          </div>
        </div>

        {/* Master Exam Info */}
        <div className='mt-6 grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2 lg:grid-cols-4'>
          <div className='bg-gray-50 rounded-lg p-4'>
            <div className='flex items-center'>
              <Calendar className='h-5 w-5 text-gray-400 mr-2' />
              <span className='text-sm font-medium text-gray-500'>Exam Period</span>
            </div>
            <div className='mt-1 text-lg font-semibold'>{masterExam.exam_period || 'Not specified'}</div>
          </div>

          <div className='bg-gray-50 rounded-lg p-4'>
            <div className='flex items-center'>
              <Clock className='h-5 w-5 text-gray-400 mr-2' />
              <span className='text-sm font-medium text-gray-500'>Time Frame</span>
            </div>
            <div className='mt-1 text-sm'>
              {masterExam.start_time ? (
                <>Start: {new Date(masterExam.start_time).toLocaleString()}</>
              ) : (
                'No start time set'
              )}
              {masterExam.end_time && (
                <>
                  <br />
                  End: {new Date(masterExam.end_time).toLocaleString()}
                </>
              )}
            </div>
          </div>

          <div className='bg-gray-50 rounded-lg p-4'>
            <div className='flex items-center'>
              <FileText className='h-5 w-5 text-gray-400 mr-2' />
              <span className='text-sm font-medium text-gray-500'>Created Exams</span>
            </div>
            <div className='mt-1 text-lg font-semibold'>
              {isLoadingExams ? <span className='animate-pulse'>Loading...</span> : <>{exams?.length || 0}</>}
            </div>
          </div>

          <div className='bg-gray-50 rounded-lg p-4'>
            <div className='flex items-center'>
              <Users className='h-5 w-5 text-gray-400 mr-2' />
              <span className='text-sm font-medium text-gray-500'>Classes</span>
            </div>
            <div className='mt-1 text-lg font-semibold'>
              {isLoadingClasses ? <span className='animate-pulse'>Loading...</span> : <>{classes?.length || 0}</>}
            </div>
          </div>
        </div>
      </div>

      {/* Exams Section */}
      <div className='bg-white shadow rounded-lg p-6 mb-8'>
        <h2 className='text-lg font-semibold text-gray-900 mb-4'>Exams</h2>

        {isLoadingExams ? (
          <div className='animate-pulse space-y-4'>
            {[...Array(3)].map((_, i) => (
              <div key={i} className='h-16 bg-gray-200 rounded'></div>
            ))}
          </div>
        ) : exams && exams.length > 0 ? (
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Exam Title
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Exam Code
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Duration
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Status
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white divide-y divide-gray-200'>
                {exams.map((exam: any) => (
                  <tr key={exam._id}>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm font-medium text-gray-900'>{exam.title}</div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-500'>{exam.exam_code}</div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-500'>{exam.duration} minutes</div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          exam.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {exam.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                      <div className='flex justify-end space-x-2'>
                        <Link
                          to={`/teacher/exams/${exam._id}/monitor`}
                          className='text-indigo-600 hover:text-indigo-900'
                          title='Monitor'
                        >
                          <Eye size={18} />
                        </Link>
                        <Link
                          to={`/teacher/exams/${exam._id}/results`}
                          className='text-blue-600 hover:text-blue-900'
                          title='View Results'
                        >
                          <BarChart2 size={18} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className='text-center py-6 bg-gray-50 rounded-lg'>
            <p className='text-gray-500'>No exams created for this master exam yet.</p>
          </div>
        )}
      </div>

      {/* Classes Section */}
      <div className='bg-white shadow rounded-lg p-6'>
        <h2 className='text-lg font-semibold text-gray-900 mb-4'>Classes</h2>

        {isLoadingClasses ? (
          <div className='animate-pulse space-y-4'>
            {[...Array(3)].map((_, i) => (
              <div key={i} className='h-16 bg-gray-200 rounded'></div>
            ))}
          </div>
        ) : classes && classes.length > 0 ? (
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {classes.map((classInfo: any) => (
              <Link
                key={classInfo.class_name}
                to={`/teacher/master-exams/${masterExamId}/classes/${encodeURIComponent(classInfo.class_name)}`}
                className='bg-blue-50 border border-blue-200 rounded-lg p-4 hover:bg-blue-100 transition-colors'
              >
                <h3 className='font-medium text-blue-800'>{classInfo.class_name}</h3>
                <p className='text-blue-600 mt-1'>
                  {classInfo.student_count} {classInfo.student_count === 1 ? 'student' : 'students'}
                </p>
              </Link>
            ))}
          </div>
        ) : (
          <div className='text-center py-6 bg-gray-50 rounded-lg'>
            <p className='text-gray-500'>No classes have taken this exam yet.</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className='fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-md w-full'>
            <h3 className='text-lg font-medium text-gray-900 mb-4'>Delete Master Exam</h3>
            <p className='text-sm text-gray-500 mb-4'>
              Are you sure you want to delete this master exam? This will permanently delete the master exam, all
              associated exams, and all student results. This action cannot be undone.
            </p>
            <div className='flex justify-end space-x-3'>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className='px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200'
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMasterExam}
                disabled={deleteMasterExamMutation.isPending}
                className='px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700'
              >
                {deleteMasterExamMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MasterExamView
