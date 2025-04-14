/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  useState,
  useEffect,
  SetStateAction,
  JSXElementConstructor,
  Key,
  ReactElement,
  ReactNode,
  ReactPortal
} from 'react'
import { UserPlus, Search, Edit, Trash2, Check, X } from 'lucide-react'
import adminApi from '../../apis/admin.api'
import { toast } from 'sonner'
import { UserRole } from '../../types/User.type'

const UserManagement = () => {
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState<any>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddUserModal, setShowAddUserModal] = useState(false)
  const [editingUser, setEditingUser] = useState<any>(null)
  const [newUser, setNewUser] = useState<any>({
    username: '',
    password: '',
    name: '',
    role: UserRole.Student
  })

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    if (searchTerm) {
      const filtered = users.filter(
        (user: any) =>
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
      setFilteredUsers(filtered)
    } else {
      setFilteredUsers(users)
    }
  }, [searchTerm, users])

  const fetchUsers = async () => {
    try {
      setIsLoading(true)
      const response = await adminApi.getUsers()
      setUsers(response.data.result.users as any)
      setFilteredUsers(response.data.result.users as any)
    } catch (error) {
      toast.error('Failed to fetch users')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddUser = async () => {
    try {
      await adminApi.createUser(newUser)
      toast.success('User created successfully')
      setShowAddUserModal(false)
      setNewUser({
        username: '',
        password: '',
        name: '',
        role: UserRole.Student
      })
      fetchUsers()
    } catch (error) {
      toast.error('Failed to create user')
      console.error(error)
    }
  }

  const handleUpdateUser = async () => {
    try {
      await adminApi.updateUser(editingUser._id, {
        name: editingUser.name,
        role: editingUser.role
      })
      toast.success('User updated successfully')
      setEditingUser(null)
      fetchUsers()
    } catch (error) {
      toast.error('Failed to update user')
      console.error(error)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await adminApi.deleteUser(userId)
        toast.success('User deleted successfully')
        fetchUsers()
      } catch (error) {
        toast.error('Failed to delete user')
        console.error(error)
      }
    }
  }

  const handleSearch = (e: { target: { value: SetStateAction<string> } }) => {
    setSearchTerm(e.target.value)
  }

  return (
    <div className='space-y-6'>
      <div className='flex justify-between items-center'>
        <h2 className='text-xl font-semibold text-gray-900'>User Management</h2>
        <button
          onClick={() => setShowAddUserModal(true)}
          className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
        >
          <UserPlus size={18} className='mr-2' />
          Add User
        </button>
      </div>

      <div className='flex items-center p-2 bg-gray-50 rounded-md shadow-sm'>
        <Search className='h-5 w-5 text-gray-400' aria-hidden='true' />
        <input
          type='text'
          value={searchTerm}
          onChange={handleSearch}
          placeholder='Search users...'
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
              {filteredUsers.map(
                (user: {
                  _id: Key | null | undefined
                  username:
                    | string
                    | number
                    | boolean
                    | ReactElement<any, string | JSXElementConstructor<any>>
                    | Iterable<ReactNode>
                    | ReactPortal
                    | null
                    | undefined
                  name: any
                  role:
                    | string
                    | number
                    | boolean
                    | ReactElement<any, string | JSXElementConstructor<any>>
                    | Iterable<ReactNode>
                    | null
                    | undefined
                  created_at: string | number | Date
                }) => (
                  <tr key={user._id}>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div className='text-sm font-medium text-gray-900'>{user.username}</div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      {editingUser && editingUser._id === user._id ? (
                        <input
                          type='text'
                          value={editingUser.name}
                          onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                          className='text-sm text-gray-900 border-gray-300 rounded-md shadow-sm'
                        />
                      ) : (
                        <div className='text-sm text-gray-900'>{user.name || '-'}</div>
                      )}
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
                          <option value={UserRole.Admin}>Admin</option>
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
                          <button onClick={handleUpdateUser} className='text-green-600 hover:text-green-900'>
                            <Check size={18} />
                          </button>
                          <button onClick={() => setEditingUser(null)} className='text-red-600 hover:text-red-900'>
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className='flex justify-end space-x-2'>
                          <button onClick={() => setEditingUser(user)} className='text-blue-600 hover:text-blue-900'>
                            <Edit size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user._id as string)}
                            className='text-red-600 hover:text-red-900'
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className='fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50'>
          <div className='bg-white rounded-lg p-6 max-w-md w-full'>
            <h3 className='text-lg font-medium text-gray-900 mb-4'>Add New User</h3>

            <div className='space-y-4'>
              <div>
                <label htmlFor='username' className='block text-sm font-medium text-gray-700'>
                  Username
                </label>
                <input
                  type='text'
                  id='username'
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
                  required
                />
              </div>

              <div>
                <label htmlFor='password' className='block text-sm font-medium text-gray-700'>
                  Password
                </label>
                <input
                  type='password'
                  id='password'
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
                  required
                />
              </div>

              <div>
                <label htmlFor='name' className='block text-sm font-medium text-gray-700'>
                  Name
                </label>
                <input
                  type='text'
                  id='name'
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
                />
              </div>

              <div>
                <label htmlFor='role' className='block text-sm font-medium text-gray-700'>
                  Role
                </label>
                <select
                  id='role'
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
                >
                  <option value={UserRole.Student}>Student</option>
                  <option value={UserRole.Teacher}>Teacher</option>
                  <option value={UserRole.Admin}>Admin</option>
                </select>
              </div>
            </div>

            <div className='mt-6 flex justify-end space-x-3'>
              <button
                type='button'
                onClick={() => setShowAddUserModal(false)}
                className='inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              >
                Cancel
              </button>
              <button
                type='button'
                onClick={handleAddUser}
                className='inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              >
                Add User
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default UserManagement
