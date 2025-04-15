/* eslint-disable @typescript-eslint/no-explicit-any */
import { useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { LogOut, User } from 'lucide-react'
import { AuthContext } from '../../Contexts/auth.context'
import { clearLocalStorage } from '../../utils/auth'
import { UserRole } from '../../constants/enum'

const Navbar = () => {
  const { isAuthenticated, profile, role, reset } = useContext(AuthContext)
  const navigate = useNavigate()

  const handleLogout = () => {
    clearLocalStorage()
    reset()
    navigate('/login')
  }

  return (
    <nav className='bg-blue-600 text-white shadow-md'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between h-16'>
          <div className='flex items-center'>
            <Link to='/' className='flex-shrink-0 flex items-center'>
              <span className='text-xl text-black font-bold'>Hệ thống kiểm tra</span>
            </Link>
          </div>

          {isAuthenticated && profile ? (
            <div className='flex items-center'>
              <div className='hidden md:block'>
                <div className='ml-4 flex items-center md:ml-6'>
                  {/* Role-specific navigation */}
                  <div className='ml-3 relative'>
                    <div className='flex items-center space-x-4'>
                      {/* For teachers */}
                      {(role === UserRole.Teacher || role === UserRole.Admin) && (
                        <Link
                          to='/teacher'
                          className='px-3 text-black py-2 rounded-md hover:text-black/90 text-sm font-medium hover:bg-gray-300'
                        >
                          Bảng điều khiển của giáo viên
                        </Link>
                      )}

                      {/* For students - everyone can access student features */}
                      <Link
                        to='/student'
                        className='px-3 py-2 text-black rounded-md hover:text-black/90 text-sm font-medium hover:bg-gray-300'
                      >
                        Bảng điều khiển của học sinh
                      </Link>

                      {/* For admins */}
                      {role === UserRole.Admin && (
                        <Link
                          to='/admin'
                          className='px-3 py-2 text-black hover:text-black/90 rounded-md text-sm font-medium hover:bg-gray-300'
                        >
                          Bảng điều khiển của quản trị viên
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* User menu */}
              <div className='ml-3 relative flex items-center space-x-4'>
                <div className='flex items-center'>
                  <div className='flex items-center space-x-2'>
                    <User size={20} />
                    <span className='text-sm font-medium'>{(profile as any)?.name || (profile as any)?.username}</span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className='p-1 rounded-full hover:bg-blue-700 bg-slate-900 transition-all '
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          ) : (
            <div className='flex items-center space-x-4'>
              <Link to='/login' className='px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700'>
                Login
              </Link>
              <Link
                to='/register'
                className='px-3 py-2 rounded-md text-sm font-medium bg-white text-blue-600 hover:bg-gray-100'
              >
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar
