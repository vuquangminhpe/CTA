/* eslint-disable @typescript-eslint/no-explicit-any */
import { useContext, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogOut, User, Settings, ChevronDown, Menu, X, BookOpen, Shield, GraduationCap } from 'lucide-react'
import { AuthContext } from '../../Contexts/auth.context'
import { clearLocalStorage } from '../../utils/auth'
import { UserRole } from '../../constants/enum'

const Navbar = () => {
  const { isAuthenticated, profile, role, reset } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  const handleLogout = () => {
    clearLocalStorage()
    reset()
    navigate('/login')
    setIsUserMenuOpen(false)
    setIsMenuOpen(false)
  }

  const isActiveLink = (path: string) => {
    return location.pathname.startsWith(path)
  }

  const navigationItems = [
    ...(role === UserRole.Teacher || role === UserRole.Admin
      ? [
          {
            path: '/teacher',
            label: 'Giáo viên',
            icon: BookOpen,
            description: 'Quản lý bài thi và học sinh'
          }
        ]
      : []),
    {
      path: '/student',
      label: 'Học sinh',
      icon: GraduationCap,
      description: 'Tham gia bài thi'
    },
    ...(role === UserRole.Admin
      ? [
          {
            path: '/admin',
            label: 'Quản trị',
            icon: Shield,
            description: 'Quản lý hệ thống'
          }
        ]
      : [])
  ]

  return (
    <>
      {/* Main Navigation */}
      <nav className='relative bg-white/95 backdrop-blur-md border-b border-blue-100 shadow-lg sticky top-0 z-50'>
        {/* Gradient overlay */}
        <div className='absolute inset-0 bg-gradient-to-r from-blue-50 via-white to-cyan-50 opacity-60'></div>

        <div className='relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between items-center h-20'>
            {/* Logo Section - Đồng bộ với Home */}
            <div className='flex items-center space-x-2 sm:space-x-4'>
              <Link to='/' className='flex items-center space-x-2 sm:space-x-4 group'>
                <div className='relative group cursor-pointer'>
                  <div className='w-10 h-10 sm:w-14 sm:h-14 bg-gradient-to-r from-cyan-500/80 via-blue-500/80 to-teal-500/80 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 shadow-lg shadow-cyan-200/50 border border-white/20'>
                    <img
                      src={'https://twitter-clone-minh-ap-southeast-1.s3.ap-southeast-1.amazonaws.com/MD.jpg'}
                      alt='Thionl Logo'
                      className='size-full rounded-xl sm:rounded-2xl text-white'
                    />
                  </div>
                  <div className='absolute inset-0 bg-gradient-to-r from-cyan-500/50 via-blue-500/50 to-teal-500/50 rounded-xl sm:rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500' />
                </div>
                <div className='hidden sm:block'>
                  <span className='text-xl sm:text-3xl font-black bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 bg-clip-text text-transparent drop-shadow-sm'>
                    Thionl
                  </span>
                  <div className='text-xs sm:text-sm text-cyan-600/80 font-semibold drop-shadow-sm'>
                    Giáo dục thông minh 4.0
                  </div>
                </div>
              </Link>
            </div>

            {isAuthenticated && profile ? (
              <div className='flex items-center space-x-6'>
                {/* Desktop Navigation */}
                <div className='hidden lg:flex items-center space-x-2'>
                  {navigationItems.map((item) => {
                    const Icon = item.icon
                    const isActive = isActiveLink(item.path)

                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={`group relative px-6 py-3 rounded-2xl font-medium transition-all duration-300 transform hover:scale-105 ${
                          isActive
                            ? 'bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 text-white shadow-lg'
                            : 'text-slate-700 hover:bg-gradient-to-r hover:from-cyan-50 hover:via-blue-50 hover:to-teal-50 hover:text-cyan-700'
                        }`}
                      >
                        <div className='flex items-center space-x-2'>
                          <Icon className='w-5 h-5' />
                          <span>{item.label}</span>
                        </div>

                        {/* Tooltip */}
                        <div className='absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap'>
                          {item.description}
                          <div className='absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-800'></div>
                        </div>
                      </Link>
                    )
                  })}
                </div>

                {/* User Profile Section */}
                <div className='relative'>
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className='flex items-center space-x-3 p-3 rounded-2xl bg-gradient-to-r from-cyan-50 via-blue-50 to-teal-50 border border-cyan-100 hover:from-cyan-100 hover:via-blue-100 hover:to-teal-100 transition-all duration-300 transform hover:scale-105 shadow-md hover:shadow-lg'
                  >
                    <div className='p-2 bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 rounded-xl shadow-lg'>
                      <User className='w-5 h-5 text-white' />
                    </div>
                    <div className='hidden md:block text-left'>
                      <p className='text-sm font-bold text-slate-800'>
                        {(profile as any)?.name || (profile as any)?.username}
                      </p>
                      <p className='text-xs text-cyan-600/80 capitalize font-semibold'>{role}</p>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-600 transition-transform duration-300 ${isUserMenuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* User Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div className='absolute right-0 mt-2 w-72 bg-white/95 backdrop-blur-md border border-cyan-100 rounded-2xl shadow-2xl py-2 z-50'>
                      <div className='px-4 py-3 border-b border-cyan-100'>
                        <div className='flex items-center space-x-3'>
                          <div className='p-3 bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 rounded-xl shadow-lg'>
                            <User className='w-6 h-6 text-white' />
                          </div>
                          <div>
                            <p className='font-bold text-slate-800'>
                              {(profile as any)?.name || (profile as any)?.username}
                            </p>
                            <div className='mt-1'>
                              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-cyan-100 via-blue-100 to-teal-100 text-cyan-800 border border-cyan-200'>
                                {role === UserRole.Admin && '👑 Quản trị viên'}
                                {role === UserRole.Teacher && '👨‍🏫 Giáo viên'}
                                {role === UserRole.Student && '🎓 Học sinh'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className='py-2'>
                        <button
                          onClick={() => {
                            // Handle settings - có thể navigate to profile page
                            setIsUserMenuOpen(false)
                          }}
                          className='w-full flex items-center space-x-3 px-4 py-3 text-slate-700 hover:bg-gradient-to-r hover:from-cyan-50 hover:via-blue-50 hover:to-teal-50 hover:text-cyan-700 transition-all duration-300'
                        >
                          <Settings className='w-5 h-5' />
                          <span className='font-medium'>Cài đặt tài khoản</span>
                        </button>

                        <button
                          onClick={handleLogout}
                          className='w-full flex items-center space-x-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-all duration-300'
                        >
                          <LogOut className='w-5 h-5' />
                          <span className='font-medium'>Đăng xuất</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className='lg:hidden p-3 rounded-2xl bg-gradient-to-r from-cyan-50 via-blue-50 to-teal-50 border border-cyan-100 hover:from-cyan-100 hover:via-blue-100 hover:to-teal-100 transition-all duration-300'
                >
                  {isMenuOpen ? <X className='w-6 h-6 text-slate-700' /> : <Menu className='w-6 h-6 text-slate-700' />}
                </button>
              </div>
            ) : (
              /* Guest Navigation */
              <div className='flex items-center space-x-4'>
                <Link
                  to='/login'
                  className='px-6 py-3 rounded-2xl font-medium text-slate-700 hover:bg-gradient-to-r hover:from-cyan-50 hover:via-blue-50 hover:to-teal-50 hover:text-cyan-700 transition-all duration-300'
                >
                  Đăng nhập
                </Link>
                <Link
                  to='/register'
                  className='px-6 py-3 rounded-2xl font-medium bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 text-white hover:from-cyan-700 hover:via-blue-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105'
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isAuthenticated && isMenuOpen && (
          <div className='lg:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-md border-b border-cyan-100 shadow-2xl'>
            <div className='px-4 py-6 space-y-3'>
              {navigationItems.map((item) => {
                const Icon = item.icon
                const isActive = isActiveLink(item.path)

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-3 p-4 rounded-2xl font-medium transition-all duration-300 ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 text-white shadow-lg'
                        : 'text-slate-700 hover:bg-gradient-to-r hover:from-cyan-50 hover:via-blue-50 hover:to-teal-50 hover:text-cyan-700'
                    }`}
                  >
                    <Icon className='w-6 h-6' />
                    <div>
                      <div className='font-semibold'>{item.label}</div>
                      <div className={`text-sm ${isActive ? 'text-cyan-100' : 'text-slate-500'}`}>
                        {item.description}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Overlay for closing dropdowns */}
      {(isUserMenuOpen || isMenuOpen) && (
        <div
          className='fixed inset-0 z-40'
          onClick={() => {
            setIsUserMenuOpen(false)
            setIsMenuOpen(false)
          }}
        />
      )}
    </>
  )
}

export default Navbar
