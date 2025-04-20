/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RegisterType } from '../../types/Auth.type'
import authApi from '../../apis/auth.api'
import { User, Lock, AlertCircle, UserPlus, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

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
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden'>
        {/* Logo/Header Section */}
        <div className='bg-blue-600 py-6 px-8'>
          <div className='flex justify-center'>
            <div className='w-12 h-12 rounded-full bg-white flex items-center justify-center'>
              <UserPlus className='h-6 w-6 text-blue-600' />
            </div>
          </div>
          <h2 className='mt-4 text-center text-2xl font-bold text-white'>Tạo tài khoản</h2>
          <p className='mt-1 text-center text-sm text-blue-100'>Tham gia nền tảng của chúng tôi ngay hôm nay</p>
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
                  Tên tài khoản
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
                    placeholder='Ví dụ nhập đúng: vuquangminh'
                  />
                </div>
              </div>
              <div>
                <label htmlFor='name' className='block text-sm font-medium text-gray-700 mb-1'>
                  Tên đầy đủ của học sinh
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                    <User className='h-5 w-5 text-gray-400' aria-hidden='true' />
                  </div>
                  <input
                    id='name'
                    name='name'
                    type='text'
                    autoComplete='name'
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className='appearance-none block w-full px-3 py-3 pl-10 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 text-sm'
                    placeholder='Nhập tên học sinh'
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
                    type={showPassword ? 'text' : 'password'}
                    autoComplete='new-password'
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className='appearance-none block w-full px-3 py-3 pl-10 pr-10 border border-gray-300 rounded-xl placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 text-sm'
                    placeholder='Tạo mật khẩu'
                  />
                  <button
                    type='button'
                    className='absolute inset-y-0 right-0 pr-3 flex items-center'
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? (
                      <EyeOff className='h-5 w-5 text-gray-400 hover:text-gray-500' />
                    ) : (
                      <Eye className='h-5 w-5 text-gray-400 hover:text-gray-500' />
                    )}
                  </button>
                </div>
                <p className='mt-1 text-xs text-gray-500'>Password must be at least 8 characters</p>
              </div>

              <div>
                <label htmlFor='confirm_password' className='block text-sm font-medium text-gray-700 mb-1'>
                  Xác nhận mật khẩu
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                    <Lock className='h-5 w-5 text-gray-400' aria-hidden='true' />
                  </div>
                  <input
                    id='confirm_password'
                    name='confirm_password'
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete='new-password'
                    required
                    value={formData.confirm_password}
                    onChange={handleChange}
                    className='appearance-none block w-full rounded-xl px-3 py-3 pl-10 pr-10 border border-gray-300  placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 text-sm'
                    placeholder='Xác nhận mật khẩu của bạn'
                  />
                  <button
                    type='button'
                    className='absolute inset-y-0 right-0 pr-3 flex items-center'
                    onClick={toggleConfirmPasswordVisibility}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className='h-5 w-5 text-gray-400 hover:text-gray-500' />
                    ) : (
                      <Eye className='h-5 w-5 text-gray-400 hover:text-gray-500' />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor='confirm_password' className='block text-sm font-medium text-gray-700 mb-1'>
                  Lớp học của bạn
                </label>
                <div className='relative'>
                  <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                    <svg
                      xmlns='http://www.w3.org/2000/svg'
                      width='24'
                      height='24'
                      viewBox='0 0 24 24'
                      fill='none'
                      stroke='currentColor'
                      stroke-width='2'
                      stroke-linecap='round'
                      stroke-linejoin='round'
                      className='lucide lucide-school-icon lucide-school'
                    >
                      <path d='M14 22v-4a2 2 0 1 0-4 0v4' />
                      <path d='m18 10 3.447 1.724a1 1 0 0 1 .553.894V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-7.382a1 1 0 0 1 .553-.894L6 10' />
                      <path d='M18 5v17' />
                      <path d='m4 6 7.106-3.553a2 2 0 0 1 1.788 0L20 6' />
                      <path d='M6 5v17' />
                      <circle cx='12' cy='9' r='2' />
                    </svg>{' '}
                  </div>
                  <input
                    id='class'
                    name='class'
                    type={'text'}
                    autoComplete='class'
                    required
                    value={formData.class}
                    onChange={handleChange}
                    className='appearance-none block w-full rounded-xl px-3 py-3 pl-10 pr-10 border border-gray-300  placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 text-sm'
                    placeholder='Điền vào lớp học của bạn'
                  />
                </div>
              </div>
            </div>

            <div className='mt-1'>
              <p className='text-xs text-gray-500'>
                Bằng cách đăng ký, bạn đồng ý với chúng tôi{' '}
                <Link to='/terms' className='text-blue-600 hover:text-blue-500'>
                  Terms of Service
                </Link>{' '}
                và{' '}
                <Link to='/privacy' className='text-blue-600 hover:text-blue-500'>
                  Chính sách bảo mật
                </Link>
              </p>
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
                    <UserPlus className='h-5 w-5 text-white' aria-hidden='true' />
                  )}
                </span>
                {isLoading ? 'Đang trong quá trình tạo tài khoản...' : 'Đăng ký'}
              </button>
            </div>
          </form>

          <div className='mt-6'>
            <div className='relative'>
              <div className='absolute inset-0 flex items-center'>
                <div className='w-full border-t border-gray-300'></div>
              </div>
              <div className='relative flex justify-center text-sm'>
                <span className='px-2 bg-white text-gray-500'>Bạn đã có tài khoản?</span>
              </div>
            </div>

            <div className='mt-6'>
              <Link
                to='/login'
                className='w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200'
              >
                Thay vào đó hãy đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Register
