/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { Search, Edit, Trash2, Check, X } from 'lucide-react'

import { useChangeUserRole, useDeleteUser, useTeachers, useStudents } from '../../hooks/useAdminQuery'
import { UserRole } from '@/types/User.type'

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [editingUser, setEditingUser] = useState<any>(null)

  // React Query hooks - we'll combine teachers and students since we don't have a single users endpoint
  const { data: teachersData, isLoading: teachersLoading } = useTeachers(1, 100)
  const { data: studentsData, isLoading: studentsLoading } = useStudents(1, 100)

  // Mutations
  const deleteUserMutation = useDeleteUser()
  const changeRoleMutation = useChangeUserRole()

  // Combine and filter users
  const teachers = teachersData?.teachers || []
  const students = studentsData?.students || []
  const allUsers = [...teachers, ...students]

  const filteredUsers = allUsers.filter(
    (user) =>
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const handleUpdateUser = () => {
    if (editingUser) {
      changeRoleMutation.mutate(
        {
          userId: editingUser._id,
          role: editingUser.role
        },
        {
          onSuccess: () => {
            setEditingUser(null)
          }
        }
      )
    }
  }

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      deleteUserMutation.mutate(userId)
    }
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value)
  }

  const isLoading = teachersLoading || studentsLoading

  return (
    <div className='space-y-6 mt-9 mx-4'>
      <div className='flex justify-between items-center'>
        <h2
          className='border border-lime-400 p-2 hover:text-black text-slate-700 rounded-xl font-semibold text-lg cursor-pointer'
          onClick={() => window.history.back()}
        >
          Quay lại trang trước đó
        </h2>
        <h2 className='text-xl font-semibold text-gray-900'>User Management</h2>
      </div>

      <div className='flex items-center p-2 bg-gray-50 rounded-md shadow-sm'>
        <Search className='h-5 w-5 text-gray-400' aria-hidden='true' />
        <input
          type='text'
          value={searchTerm}
          onChange={handleSearch}
          placeholder='Search users by name, username or email...'
          className='ml-2 flex-1 bg-transparent outline-none text-sm text-gray-700'
        />
      </div>

      {isLoading ? (
        <div className='py-8 text-center text-gray-500'>Loading users...</div>
      ) : filteredUsers.length === 0 ? (
        <div className='py-8 text-center text-gray-500'>
          {searchTerm ? 'No users found matching your search' : 'No users available'}
        </div>
      ) : (
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
                  Email
                </th>
                <th
                  scope='col'
                  className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'
                >
                  Role
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
              {filteredUsers.map((user) => (
                <tr key={user._id}>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='text-sm font-medium text-gray-900'>{user.username}</div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    {editingUser && editingUser._id === user._id ? (
                      <input
                        type='text'
                        value={editingUser.name || ''}
                        onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                        className='text-sm text-gray-900 border-gray-300 rounded-md shadow-sm'
                      />
                    ) : (
                      <div className='text-sm text-gray-900'>{user.name || '-'}</div>
                    )}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='text-sm text-gray-900'>{user.email || '-'}</div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    {editingUser && editingUser._id === user._id ? (
                      <select
                        value={editingUser.role}
                        onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                        className='text-sm text-gray-900 border-gray-300 rounded-md shadow-sm'
                      >
                        <option value={UserRole.Student}>Student</option>
                        <option value={UserRole.Teacher}>Teacher</option>
                      </select>
                    ) : (
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          user.role === UserRole.Admin
                            ? 'bg-purple-100 text-purple-800'
                            : user.role === UserRole.Teacher
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {user.role}
                      </span>
                    )}
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap'>
                    <div className='text-sm text-gray-500'>{new Date(user.created_at).toLocaleDateString()}</div>
                  </td>
                  <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                    {editingUser && editingUser._id === user._id ? (
                      <div className='flex justify-end space-x-2'>
                        <button
                          onClick={handleUpdateUser}
                          className='text-green-600 hover:text-green-900'
                          disabled={changeRoleMutation.isPending}
                        >
                          <Check size={18} />
                        </button>
                        <button onClick={() => setEditingUser(null)} className='text-red-600 hover:text-red-900'>
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className='flex justify-end space-x-2'>
                        <button
                          onClick={() => setEditingUser(user)}
                          className='text-blue-600 hover:text-blue-900'
                          disabled={user.role === UserRole.Admin}
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className='text-red-600 hover:text-red-900'
                          disabled={user.role === UserRole.Admin || deleteUserMutation.isPending}
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
      )}
    </div>
  )
}

export default UserManagement
