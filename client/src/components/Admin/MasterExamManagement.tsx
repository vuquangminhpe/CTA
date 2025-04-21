/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { Search, Trash2, Eye } from 'lucide-react'
import { useDeleteMasterExam, useMasterExams } from '../../hooks/useAdminQuery'
import { Link } from 'react-router-dom'

const MasterExamManagement = () => {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')

  // React Query hooks
  const { data, isLoading } = useMasterExams(page, limit, searchTerm)
  const deleteMasterExamMutation = useDeleteMasterExam()

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setPage(1) // Reset to first page on new search
  }

  const handleDeleteMasterExam = (masterExamId: string) => {
    if (
      window.confirm(
        'Are you sure you want to delete this master exam? This will delete all associated exams and sessions.'
      )
    ) {
      deleteMasterExamMutation.mutate(masterExamId)
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h2 className='text-xl font-semibold text-gray-900'>Master Exams Management</h2>
      </div>

      <div className='flex items-center p-2 bg-gray-50 rounded-md shadow-sm'>
        <Search className='h-5 w-5 text-gray-400' aria-hidden='true' />
        <input
          type='text'
          value={searchTerm}
          onChange={handleSearch}
          placeholder='Search by exam name or description...'
          className='ml-2 flex-1 bg-transparent outline-none text-sm text-gray-700'
        />
      </div>

      {isLoading ? (
        <div className='py-8 text-center text-gray-500'>Loading master exams...</div>
      ) : !data || data.master_exams.length === 0 ? (
        <div className='py-8 text-center text-gray-500'>
          {searchTerm ? 'No master exams found matching your search' : 'No master exams available'}
        </div>
      ) : (
        <>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-gray-200'>
              <thead className='bg-gray-50'>
                <tr>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Name
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Teacher
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Exam Period
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Child Exams
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Sessions
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
                {data.master_exams.map((exam: any) => (
                  <tr key={exam._id}>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm font-medium text-gray-900'>{exam.name}</div>
                      {exam.description && (
                        <div className='text-xs text-gray-500 truncate max-w-xs'>{exam.description}</div>
                      )}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>{exam.teacher.name || exam.teacher.username}</div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>{exam.exam_period || '-'}</div>
                      {exam.start_time && (
                        <div className='text-xs text-gray-500'>
                          From: {new Date(exam.start_time).toLocaleDateString()}
                          {exam.end_time && ` to ${new Date(exam.end_time).toLocaleDateString()}`}
                        </div>
                      )}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>{exam.exam_count}</div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>{exam.session_count}</div>
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
                          to={`/admin/admin-master-exams/${exam._id}`}
                          className='text-blue-600 hover:text-blue-900'
                          title='View Details'
                        >
                          <Eye size={18} />
                        </Link>
                        <button
                          onClick={() => handleDeleteMasterExam(exam._id)}
                          className='text-red-600 hover:text-red-900'
                          title='Delete Master Exam'
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className='flex items-center justify-between'>
            <div className='text-sm text-gray-700'>
              Showing <span className='font-medium'>{(page - 1) * limit + 1}</span> to{' '}
              <span className='font-medium'>{Math.min(page * limit, data.total)}</span> of{' '}
              <span className='font-medium'>{data.total}</span> master exams
            </div>
            <div className='flex space-x-2'>
              <button
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={page === 1}
                className='px-3 py-1 border rounded text-sm disabled:opacity-50'
              >
                Previous
              </button>
              <button
                onClick={() => setPage((prev) => (prev < data.total_pages ? prev + 1 : prev))}
                disabled={page >= data.total_pages}
                className='px-3 py-1 border rounded text-sm disabled:opacity-50'
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default MasterExamManagement
