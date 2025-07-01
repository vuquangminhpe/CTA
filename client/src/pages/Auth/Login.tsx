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
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden'>
        <div className='fixed inset-0 overflow-hidden pointer-events-none z-0'>
          <div className='absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse' />
          <div className='absolute bottom-32 right-32 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-teal-400/10 rounded-full blur-3xl animate-pulse delay-1000' />
          <div
            className='absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-r from-teal-400/10 to-cyan-400/10 rounded-full blur-2xl animate-bounce'
            style={{ animationDuration: '4s' }}
          />
        </div>

        <div className='max-w-md w-full relative z-10'>
          {/* Glassmorphism Card */}
          <div
            className='bg-white/80 backdrop-blur-2xl border border-white/20 rounded-3xl shadow-2xl shadow-cyan-200/20 overflow-hidden'
            style={{
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              background: 'linear-gradient(135deg, rgba(255,255,255,0.9), rgba(255,255,255,0.7))'
            }}
          >
            <div className='bg-gradient-to-r from-cyan-500 via-blue-500 to-teal-500 py-8 px-8 relative overflow-hidden'>
              {/* Thêm hiệu ứng glowing */}
              <div className='absolute inset-0 bg-gradient-to-r from-teal-500 via-blue-500 to-cyan-500 opacity-0 animate-pulse' />

              <div className='flex justify-center relative z-10'>
                <div className='w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg'>
                  <LogIn className='h-8 w-8 text-white' />
                </div>
              </div>
              <h2 className='mt-4 text-center text-3xl font-black text-white drop-shadow-sm'>Chào mừng trở lại</h2>
              <p className='mt-2 text-center text-base text-white/90 font-medium'>
                Đăng nhập để truy cập tài khoản của bạn
              </p>

              {/* Decorative elements */}
              <div className='absolute top-4 right-4 w-8 h-8 border-2 border-white/30 rounded-full animate-ping' />
              <div className='absolute bottom-4 left-4 w-6 h-6 bg-white/20 rounded-full animate-bounce' />
            </div>

            {/* Form Section */}
            <div className='p-8'>
              <form className='space-y-6' onSubmit={handleSubmit}>
                {error && (
                  <div className='rounded-2xl bg-red-50/80 backdrop-blur-sm p-4 border border-red-200/50 animate-fadeIn shadow-lg'>
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

                <div className='space-y-5'>
                  <div>
                    <label htmlFor='username' className='block text-sm font-bold text-gray-700 mb-2'>
                      Tên người dùng
                    </label>
                    <div className='relative group'>
                      <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                        <User
                          className='h-5 w-5 text-cyan-500 group-focus-within:text-cyan-600 transition-colors'
                          aria-hidden='true'
                        />
                      </div>
                      <input
                        id='username'
                        name='username'
                        type='text'
                        autoComplete='username'
                        required
                        value={formData.username}
                        onChange={handleChange}
                        className='appearance-none block w-full px-4 py-4 pl-12 border border-gray-200 rounded-2xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 text-gray-900 text-sm bg-white/70 backdrop-blur-sm hover:bg-white/80 focus:bg-white/90'
                        placeholder='Nhập tên tài khoản của bạn'
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor='password' className='block text-sm font-bold text-gray-700 mb-2'>
                      Mật khẩu
                    </label>
                    <div className='relative group'>
                      <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                        <Lock
                          className='h-5 w-5 text-blue-500 group-focus-within:text-blue-600 transition-colors'
                          aria-hidden='true'
                        />
                      </div>
                      <input
                        id='password'
                        name='password'
                        type='password'
                        autoComplete='current-password'
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className='appearance-none block w-full px-4 py-4 pl-12 border border-gray-200 rounded-2xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-900 text-sm bg-white/70 backdrop-blur-sm hover:bg-white/80 focus:bg-white/90'
                        placeholder='Nhập mật khẩu của bạn'
                      />
                    </div>
                  </div>
                </div>

                <div className='pt-2'>
                  <button
                    type='submit'
                    disabled={isLoading}
                    className='group relative w-full flex justify-center py-4 px-6 border border-transparent text-base font-black rounded-2xl text-white bg-gradient-to-r from-cyan-500 via-blue-500 to-teal-500 hover:from-cyan-600 hover:via-blue-600 hover:to-teal-600 focus:outline-none focus:ring-4 focus:ring-cyan-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-cyan-300/50 overflow-hidden'
                  >
                    <span className='absolute left-0 inset-y-0 flex items-center pl-4'>
                      {isLoading ? (
                        <svg
                          className='animate-spin h-6 w-6 text-white'
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
                        <LogIn
                          className='h-6 w-6 text-white group-hover:scale-110 transition-transform'
                          aria-hidden='true'
                        />
                      )}
                    </span>
                    <span className='relative z-10'>
                      {isLoading ? 'Đang đăng nhập vào hệ thống...' : 'Đăng nhập ngay'}
                    </span>

                    {/* Button animation overlay */}
                    <div className='absolute inset-0 bg-gradient-to-r from-teal-500 via-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500' />
                    <div className='absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700' />
                  </button>
                </div>
              </form>

              <div className='mt-8'>
                <div className='relative'>
                  <div className='absolute inset-0 flex items-center'>
                    <div className='w-full border-t border-gray-200'></div>
                  </div>
                  <div className='relative flex justify-center text-sm'>
                    <span className='px-4 bg-white/80 text-gray-600 font-medium backdrop-blur-sm rounded-full'>
                      Bạn chưa có tài khoản?
                    </span>
                  </div>
                </div>

                <div className='mt-6'>
                  <Link
                    to='/register'
                    className='w-full flex justify-center py-4 px-6 border-2 border-gray-200 rounded-2xl shadow-sm text-base font-bold text-gray-700 bg-white/70 hover:bg-white/90 hover:border-cyan-300 focus:outline-none focus:ring-4 focus:ring-cyan-100 transition-all duration-300 transform hover:-translate-y-1 backdrop-blur-sm hover:shadow-lg'
                  >
                    Tạo một tài khoản mới
                  </Link>
                </div>
              </div>

              {/* Optional: Forgot Password Link */}
              <div className='mt-6 text-center'>
                <Link
                  to='/forgot-password'
                  className='text-sm text-cyan-600 hover:text-cyan-700 font-medium transition-colors'
                >
                  Quên mật khẩu?
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
