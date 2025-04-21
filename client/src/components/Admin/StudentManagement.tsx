/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { Search, Trash2, ArrowUp } from 'lucide-react'
import { useChangeUserRole, useDeleteUser, useStudents } from '../../hooks/useAdminQuery'
import { UserRole } from '@/types/User.type'

const StudentManagement = () => {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')

  // React Query hooks
  const { data, isLoading } = useStudents(page, limit, searchTerm)
  const deleteUserMutation = useDeleteUser()
  const changeRoleMutation = useChangeUserRole()
  console.log(data)

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setPage(1) // Reset to first page on new search
  }

  const handleDeleteStudent = (studentId: string) => {
    if (
      window.confirm('Are you sure you want to delete this student? This will also delete all their exam sessions.')
    ) {
      deleteUserMutation.mutate(studentId)
    }
  }

  const handlePromoteToTeacher = (studentId: string) => {
    if (window.confirm('Are you sure you want to promote this student to teacher?')) {
      changeRoleMutation.mutate({ userId: studentId, role: UserRole.Teacher })
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h2 className='text-xl font-semibold text-gray-900'>Student Management</h2>
      </div>

      <div className='flex items-center p-2 bg-gray-50 rounded-md shadow-sm'>
        <Search className='h-5 w-5 text-gray-400' aria-hidden='true' />
        <input
          type='text'
          value={searchTerm}
          onChange={handleSearch}
          placeholder='Search students by name, username or class...'
          className='ml-2 flex-1 bg-transparent outline-none text-sm text-gray-700'
        />
      </div>

      {isLoading ? (
        <div className='py-8 text-center text-gray-500'>Loading students...</div>
      ) : !data || data.students.length === 0 ? (
        <div className='py-8 text-center text-gray-500'>
          {searchTerm ? 'No students found matching your search' : 'No students available'}
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
                    Username
                  </th>
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
                    Class
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Exams Taken
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Exams Completed
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Created At
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
                {data.students.map((student: any) => (
                  <tr key={student._id}>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm font-medium text-gray-900'>{student.username}</div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>{student.name || '-'}</div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>{student.class || '-'}</div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>{student.session_count}</div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>{student.completed_session_count}</div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-500'>{new Date(student.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                      <div className='flex justify-end space-x-2'>
                        <button
                          onClick={() => handlePromoteToTeacher(student._id)}
                          className='text-blue-600 hover:text-blue-900'
                          title='Promote to Teacher'
                        >
                          <ArrowUp size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(student._id)}
                          className='text-red-600 hover:text-red-900'
                          title='Delete Student'
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
              <span className='font-medium'>{data.total}</span> students
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

export default StudentManagement
