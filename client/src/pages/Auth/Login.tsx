import React, { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../../Contexts/auth.context'
import { LoginReqBody } from '../../types/Auth.type'
import authApi from '../../apis/auth.api'
import { saveAccessTokenToLS, setProfileFromLS } from '../../utils/auth'
import { User, Lock, AlertCircle, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import SEOComponent from '@/components/SEO/SEOComponent.tsx/SEOComponent'

const Login = () => {
  const { setIsAuthenticated, setProfile } = useContext(AuthContext)
  const navigate = useNavigate()
  const [formData, setFormData] = useState<LoginReqBody>({
    username: '',
    password: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const response = await authApi.login(formData)

      const { access_token, user } = response.data.result

      saveAccessTokenToLS(access_token)
      setProfileFromLS(user)

      setIsAuthenticated(true)
      setProfile(user)

      toast.success('Login successful')
      localStorage.setItem('needsRefresh', 'true')
      // Redirect to the appropriate dashboard based on user role
      if (user.role === 'admin') {
        navigate('/admin')
      } else if (user.role === 'teacher') {
        navigate('/teacher')
      } else {
        navigate('/student')
      }
    } catch (error) {
      setError('Invalid username or password')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <SEOComponent
        title='Đăng nhập - Thionl'
        description='Đăng nhập vào hệ thống Thionl để trải nghiệm nền tảng thi trực tuyến thông minh'
        canonical='https://thionl.site/login'
        robots='noindex, nofollow'
      />
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden'>
          {/* Logo/Header Section */}
          <div className='bg-blue-600 py-6 px-8'>
            <div className='flex justify-center'>
              <div className='w-12 h-12 rounded-full bg-white flex items-center justify-center'>
                <LogIn className='h-6 w-6 text-blue-600' />
              </div>
            </div>
            <h2 className='mt-4 text-center text-2xl font-bold text-white'>Chào mừng trở lại</h2>
            <p className='mt-1 text-center text-sm text-blue-100'>Đăng nhập để truy cập tài khoản của bạn</p>
          </div>

          {/* Form Section */}
          <div className='p-8'>
            <form className='space-y-6' onSubmit={handleSubmit}>
              {error && (
                <div className='rounded-lg bg-red-50 p-4 border border-red-200 animate-fadeIn'>
                  <div className='flex'>
                    <div className='flex-shrink-0'>
                      <AlertCircle className='h-5 w-5 text-red-500' aria-hidden='true' />
                    </div>
                    <div className='ml-3'>
                      <h3 className='text-sm font-medium text-red-800'>{error}</h3>
                    </div>
                  </div>
                </div>
              )}

              <div className='space-y-4'>
                <div>
                  <label htmlFor='username' className='block text-sm font-medium text-gray-700 mb-1'>
                    Tên người dùng
                  </label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                      <User className='h-5 w-5 text-gray-400' aria-hidden='true' />
                    </div>
                    <input
                      id='username'
                      name='username'
                      type='text'
                      autoComplete='username'
                      required
                      value={formData.username}
                      onChange={handleChange}
                      className='appearance-none block w-full px-3 py-3 pl-10 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 text-sm'
                      placeholder='Enter your username'
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor='password' className='block text-sm font-medium text-gray-700 mb-1'>
                    Mật khẩu
                  </label>
                  <div className='relative'>
                    <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                      <Lock className='h-5 w-5 text-gray-400' aria-hidden='true' />
                    </div>
                    <input
                      id='password'
                      name='password'
                      type='password'
                      autoComplete='current-password'
                      required
                      value={formData.password}
                      onChange={handleChange}
                      className='appearance-none block w-full px-3 py-3 pl-10 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 text-sm'
                      placeholder='Enter your password'
                    />
                  </div>
                </div>
              </div>

              <div>
                <button
                  type='submit'
                  disabled={isLoading}
                  className='group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:-translate-y-1'
                >
                  <span className='absolute left-0 inset-y-0 flex items-center pl-3'>
                    {isLoading ? (
                      <svg
                        className='animate-spin h-5 w-5 text-white'
                        xmlns='http://www.w3.org/2000/svg'
                        fill='none'
                        viewBox='0 0 24 24'
                      >
                        <circle
                          className='opacity-25'
                          cx='12'
                          cy='12'
                          r='10'
                          stroke='currentColor'
                          strokeWidth='4'
                        ></circle>
                        <path
                          className='opacity-75'
                          fill='currentColor'
                          d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                        ></path>
                      </svg>
                    ) : (
                      <LogIn className='h-5 w-5 text-white' aria-hidden='true' />
                    )}
                  </span>
                  {isLoading ? 'đang đăng nhập vào hệ thống...' : 'Đăng nhập'}
                </button>
              </div>
            </form>

            <div className='mt-6'>
              <div className='relative'>
                <div className='absolute inset-0 flex items-center'>
                  <div className='w-full border-t border-gray-300'></div>
                </div>
                <div className='relative flex justify-center text-sm'>
                  <span className='px-2 bg-white text-gray-500'>Bạn chưa có tài khoản?</span>
                </div>
              </div>

              <div className='mt-6'>
                <Link
                  to='/register'
                  className='w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200'
                >
                  Tạo một tài khoản mới
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Login
