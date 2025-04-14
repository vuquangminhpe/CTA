/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { RegisterType } from '../../types/Auth.type'
import authApi from '../../apis/auth.api'
import { User, Lock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

const Register = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<RegisterType>({
    username: '',
    password: '',
    confirm_password: ''
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

    // Validate passwords match
    if (formData.password !== formData.confirm_password) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      await authApi.register(formData)
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

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full space-y-8'>
        <div>
          <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900'>Create your account</h2>
          <p className='mt-2 text-center text-sm text-gray-600'>
            Or{' '}
            <Link to='/login' className='font-medium text-blue-600 hover:text-blue-500'>
              sign in to your account
            </Link>
          </p>
        </div>

        <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
          {error && (
            <div className='rounded-md bg-red-50 p-4'>
              <div className='flex'>
                <div className='flex-shrink-0'>
                  <AlertCircle className='h-5 w-5 text-red-400' aria-hidden='true' />
                </div>
                <div className='ml-3'>
                  <h3 className='text-sm font-medium text-red-800'>{error}</h3>
                </div>
              </div>
            </div>
          )}

          <div className='rounded-md shadow-sm -space-y-px'>
            <div>
              <label htmlFor='username' className='sr-only'>
                Username
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
                  className='appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm'
                  placeholder='Username'
                />
              </div>
            </div>
            <div>
              <label htmlFor='password' className='sr-only'>
                Password
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <Lock className='h-5 w-5 text-gray-400' aria-hidden='true' />
                </div>
                <input
                  id='password'
                  name='password'
                  type='password'
                  autoComplete='new-password'
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className='appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm'
                  placeholder='Password'
                />
              </div>
            </div>
            <div>
              <label htmlFor='confirm_password' className='sr-only'>
                Confirm Password
              </label>
              <div className='relative'>
                <div className='absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none'>
                  <Lock className='h-5 w-5 text-gray-400' aria-hidden='true' />
                </div>
                <input
                  id='confirm_password'
                  name='confirm_password'
                  type='password'
                  autoComplete='new-password'
                  required
                  value={formData.confirm_password}
                  onChange={handleChange}
                  className='appearance-none rounded-none relative block w-full px-3 py-2 pl-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm'
                  placeholder='Confirm Password'
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type='submit'
              disabled={isLoading}
              className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Register
