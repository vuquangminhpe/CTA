/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { Search, Trash2, Check, X } from 'lucide-react'
import { useChangeUserRole, useDeleteUser, useTeachers } from '../../hooks/useAdminQuery'
import { UserRole } from '@/types/User.type'

const TeacherManagement = () => {
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [searchTerm, setSearchTerm] = useState('')
  const [editingTeacher, setEditingTeacher] = useState<any>(null)

  // React Query hooks
  const { data, isLoading } = useTeachers(page, limit, searchTerm)
  const deleteUserMutation = useDeleteUser()
  const changeRoleMutation = useChangeUserRole()

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
    setPage(1) // Reset to first page on new search
  }

  const handleDeleteTeacher = (teacherId: string) => {
    if (window.confirm('Are you sure you want to delete this teacher? This will also delete all their exams.')) {
      deleteUserMutation.mutate(teacherId)
    }
  }

  const handleChangeRole = (teacherId: string, role: UserRole) => {
    changeRoleMutation.mutate({ userId: teacherId, role })
  }

  const handleUpdateTeacher = () => {
    if (editingTeacher) {
      changeRoleMutation.mutate(
        { userId: editingTeacher._id, role: editingTeacher.role },
        {
          onSuccess: () => {
            setEditingTeacher(null)
          }
        }
      )
    }
  }

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h2 className='text-xl font-semibold text-gray-900'>Teacher Management</h2>
      </div>

      <div className='flex items-center p-2 bg-gray-50 rounded-md shadow-sm'>
        <Search className='h-5 w-5 text-gray-400' aria-hidden='true' />
        <input
          type='text'
          value={searchTerm}
          onChange={handleSearch}
          placeholder='Search teachers by name or username...'
          className='ml-2 flex-1 bg-transparent outline-none text-sm text-gray-700'
        />
      </div>

      {isLoading ? (
        <div className='py-8 text-center text-gray-500'>Loading teachers...</div>
      ) : !data || data.teachers.length === 0 ? (
        <div className='py-8 text-center text-gray-500'>
          {searchTerm ? 'No teachers found matching your search' : 'No teachers available'}
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
                    Exams
                  </th>
                  <th
                    scope='col'
                    className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                  >
                    Master Exams
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
                {data.teachers.map((teacher: any) => (
                  <tr key={teacher._id}>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm font-medium text-gray-900'>{teacher.username}</div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>{teacher.name || '-'}</div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>{teacher.exam_count}</div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-900'>{teacher.master_exam_count}</div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm text-gray-500'>{new Date(teacher.created_at).toLocaleDateString()}</div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                      {editingTeacher && editingTeacher._id === teacher._id ? (
                        <div className='flex justify-end space-x-2'>
                          <button onClick={handleUpdateTeacher} className='text-green-600 hover:text-green-900'>
                            <Check size={18} />
                          </button>
                          <button onClick={() => setEditingTeacher(null)} className='text-red-600 hover:text-red-900'>
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className='flex justify-end space-x-2'>
                          <button
                            onClick={() => handleChangeRole(teacher._id, UserRole.Student)}
                            className='text-blue-600 hover:text-blue-900 px-2 py-1 text-xs border border-blue-600 rounded'
                          >
                            Demote to Student
                          </button>
                          <button
                            onClick={() => handleDeleteTeacher(teacher._id)}
                            className='text-red-600 hover:text-red-900'
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
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
              <span className='font-medium'>{data.total}</span> teachers
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

export default TeacherManagement
