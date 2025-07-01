/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RegisterType } from '../../types/Auth.type'
import authApi from '../../apis/auth.api'
import { User, Lock, AlertCircle, UserPlus, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import SEOComponent from '@/components/SEO/SEOComponent.tsx/SEOComponent'

const Register = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<RegisterType>({
    username: '',
    name: '',
    password: '',
    confirm_password: '',
    class: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    // Validate passwords match
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      await authApi.register({
        username: formData.username.trim(),
        name: formData?.name?.trim(),
        password: formData.password.trim(),
        class: formData.class.trim(),
        confirm_password: formData.confirm_password.trim()
      })
      toast.success('Registration successful. Please log in.')
      navigate('/login')
    } catch (error: any) {
      if (error.response?.data?.message) {
        setError(error.response.data.message)
      } else {
        setError('Registration failed. Please try again.')
      }
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword)
  }

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword)
  }

  return (
    <>
      <SEOComponent
        title='Đăng ký tài khoản - Thionl'
        description='Tạo tài khoản miễn phí để sử dụng hệ thống thi trực tuyến AI của Thionl'
        canonical='https://thionl.site/register'
        robots='noindex, nofollow'
      />
      <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden'>
        {/* Advanced Floating Shapes - giống Home */}
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
            {/* Logo/Header Section với gradient như Home */}
            <div className='bg-gradient-to-r from-cyan-500 via-blue-500 to-teal-500 py-8 px-8 relative overflow-hidden'>
              {/* Thêm hiệu ứng glowing */}
              <div className='absolute inset-0 bg-gradient-to-r from-teal-500 via-blue-500 to-cyan-500 opacity-0 animate-pulse' />

              <div className='flex justify-center relative z-10'>
                <div className='w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center shadow-lg'>
                  <UserPlus className='h-8 w-8 text-white' />
                </div>
              </div>
              <h2 className='mt-4 text-center text-3xl font-black text-white drop-shadow-sm'>Tạo tài khoản</h2>
              <p className='mt-2 text-center text-base text-white/90 font-medium'>
                Tham gia nền tảng của chúng tôi ngay hôm nay
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
                      Tên tài khoản
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
                        placeholder='Ví dụ nhập đúng: vuquangminh'
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor='name' className='block text-sm font-bold text-gray-700 mb-2'>
                      Tên đầy đủ của giáo viên
                    </label>
                    <div className='relative group'>
                      <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                        <User
                          className='h-5 w-5 text-blue-500 group-focus-within:text-blue-600 transition-colors'
                          aria-hidden='true'
                        />
                      </div>
                      <input
                        id='name'
                        name='name'
                        type='text'
                        autoComplete='name'
                        required
                        value={formData.name}
                        onChange={handleChange}
                        className='appearance-none block w-full px-4 py-4 pl-12 border border-gray-200 rounded-2xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 text-gray-900 text-sm bg-white/70 backdrop-blur-sm hover:bg-white/80 focus:bg-white/90'
                        placeholder='Nhập tên giáo viên'
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
                          className='h-5 w-5 text-teal-500 group-focus-within:text-teal-600 transition-colors'
                          aria-hidden='true'
                        />
                      </div>
                      <input
                        id='password'
                        name='password'
                        type={showPassword ? 'text' : 'password'}
                        autoComplete='new-password'
                        required
                        value={formData.password}
                        onChange={handleChange}
                        className='appearance-none block w-full px-4 py-4 pl-12 pr-12 border border-gray-200 rounded-2xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-300 text-gray-900 text-sm bg-white/70 backdrop-blur-sm hover:bg-white/80 focus:bg-white/90'
                        placeholder='Tạo mật khẩu'
                      />
                      <button
                        type='button'
                        className='absolute inset-y-0 bg-gray-200 right-0 pr-4 flex items-center hover:bg-gray-50/50 rounded-r-2xl transition-colors'
                        onClick={togglePasswordVisibility}
                      >
                        {showPassword ? (
                          <EyeOff className='h-5 w-5 text-gray-400 hover:text-teal-500 transition-colors' />
                        ) : (
                          <Eye className='h-5 w-5 text-gray-400 hover:text-teal-500 transition-colors' />
                        )}
                      </button>
                    </div>
                    <p className='mt-2 text-xs text-gray-500 font-medium'>Mật khẩu phải có ít nhất 8 ký tự</p>
                  </div>

                  <div>
                    <label htmlFor='confirm_password' className='block text-sm font-bold text-gray-700 mb-2'>
                      Xác nhận mật khẩu
                    </label>
                    <div className='relative group'>
                      <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                        <Lock
                          className='h-5 w-5 text-purple-500 group-focus-within:text-purple-600 transition-colors'
                          aria-hidden='true'
                        />
                      </div>
                      <input
                        id='confirm_password'
                        name='confirm_password'
                        type={showConfirmPassword ? 'text' : 'password'}
                        autoComplete='new-password'
                        required
                        value={formData.confirm_password}
                        onChange={handleChange}
                        className='appearance-none block w-full rounded-2xl px-4 py-4 pl-12 pr-12 border border-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300 text-gray-900 text-sm bg-white/70 backdrop-blur-sm hover:bg-white/80 focus:bg-white/90'
                        placeholder='Xác nhận mật khẩu của bạn'
                      />
                      <button
                        type='button'
                        className='absolute inset-y-0 right-0 bg-gray-200 pr-4 flex items-center hover:bg-gray-50/50 rounded-r-2xl transition-colors'
                        onClick={toggleConfirmPasswordVisibility}
                      >
                        {showConfirmPassword ? (
                          <EyeOff className='h-5 w-5 text-gray-400 hover:text-purple-500 transition-colors' />
                        ) : (
                          <Eye className='h-5 w-5 text-gray-400 hover:text-purple-500 transition-colors' />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor='class' className='block text-sm font-bold text-gray-700 mb-2'>
                      Trường bạn đang tham gia dạy học
                    </label>
                    <div className='relative group'>
                      <div className='absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none'>
                        <svg
                          className='h-5 w-5 text-orange-500 group-focus-within:text-orange-600 transition-colors'
                          xmlns='http://www.w3.org/2000/svg'
                          width='24'
                          height='24'
                          viewBox='0 0 24 24'
                          fill='none'
                          stroke='currentColor'
                          strokeWidth='2'
                          strokeLinecap='round'
                          strokeLinejoin='round'
                        >
                          <path d='M14 22v-4a2 2 0 1 0-4 0v4' />
                          <path d='m18 10 3.447 1.724a1 1 0 0 1 .553.894V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7.382a1 1 0 0 1 .553-.894L6 10' />
                          <path d='M18 5v17' />
                          <path d='m4 6 7.106-3.553a2 2 0 0 1 1.788 0L20 6' />
                          <path d='M6 5v17' />
                          <circle cx='12' cy='9' r='2' />
                        </svg>
                      </div>
                      <input
                        id='class'
                        name='class'
                        type='text'
                        autoComplete='organization'
                        required
                        value={formData.class}
                        onChange={handleChange}
                        className='appearance-none block w-full rounded-2xl px-4 py-4 pl-12 border border-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-300 text-gray-900 text-sm bg-white/70 backdrop-blur-sm hover:bg-white/80 focus:bg-white/90'
                        placeholder='Điền vào trường của bạn'
                      />
                    </div>
                  </div>
                </div>

                <div className='mt-4'>
                  <p className='text-xs text-gray-600 font-medium leading-relaxed'>
                    Bằng cách đăng ký, bạn đồng ý với chúng tôi{' '}
                    <Link to='/terms' className='text-cyan-600 hover:text-cyan-700 font-bold transition-colors'>
                      Terms of Service
                    </Link>{' '}
                    và{' '}
                    <Link to='/privacy' className='text-blue-600 hover:text-blue-700 font-bold transition-colors'>
                      Chính sách bảo mật
                    </Link>
                  </p>
                </div>

                <div>
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
                        <UserPlus
                          className='h-6 w-6 text-white group-hover:scale-110 transition-transform'
                          aria-hidden='true'
                        />
                      )}
                    </span>
                    <span className='relative z-10'>
                      {isLoading ? 'Đang trong quá trình tạo tài khoản...' : 'Đăng ký ngay'}
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
                      Bạn đã có tài khoản?
                    </span>
                  </div>
                </div>

                <div className='mt-6'>
                  <Link
                    to='/login'
                    className='w-full flex justify-center py-4 px-6 border-2 border-gray-200 rounded-2xl shadow-sm text-base font-bold text-gray-700 bg-white/70 hover:bg-white/90 hover:border-cyan-300 focus:outline-none focus:ring-4 focus:ring-cyan-100 transition-all duration-300 transform hover:-translate-y-1 backdrop-blur-sm hover:shadow-lg'
                  >
                    Thay vào đó hãy đăng nhập
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Register
