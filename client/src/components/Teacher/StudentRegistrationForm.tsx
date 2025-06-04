/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useContext } from 'react'
import { useForm } from 'react-hook-form'
import { User, Camera, Eye, EyeOff, Copy, RefreshCw, UserPlus, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import {
  generateUsernameFromName,
  generateRandomPassword,
  generateAlternativeUsername,
  isValidVietnameseName,
  getClassesByLevel,
  getAgeRangeByClass
} from '../helper/help_vietnam_classes'
import { AuthContext } from '../../Contexts/auth.context'
import FaceProfileRegistration from './FaceProfileRegistration'

interface StudentData {
  name: string
  age: number
  gender: 'nam' | 'nữ'
  phone: string
  class: string
  username: string
  password: string
}

interface StudentRegistrationFormProps {
  onSuccess?: (studentData: StudentData) => void
  onCancel?: () => void
}

const StudentRegistrationForm: React.FC<StudentRegistrationFormProps> = ({ onSuccess, onCancel }) => {
  const { profile } = useContext(AuthContext) as any
  const [step, setStep] = useState<'info' | 'face' | 'review' | 'success'>('info')
  const [studentData, setStudentData] = useState<StudentData | null>(null)
  const [showPassword, setShowPassword] = useState(false)
  const [availableClasses, setAvailableClasses] = useState<string[]>([])
  const [isRegistering, setIsRegistering] = useState(false)
  const [faceImageCaptured, setFaceImageCaptured] = useState(false)
  const [faceImageBlob, setFaceImageBlob] = useState<Blob | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<StudentData>()

  const watchedName = watch('name')
  const watchedClass = watch('class')
  const teacherLevel = profile?.teacher_level || 'middle_school'

  // Load available classes based on teacher level
  useEffect(() => {
    const classes = getClassesByLevel(teacherLevel)
    setAvailableClasses(classes)
  }, [teacherLevel])

  // Auto-generate username when name changes
  useEffect(() => {
    if (watchedName && watchedName.length >= 2) {
      if (isValidVietnameseName(watchedName)) {
        const username = generateUsernameFromName(watchedName)
        setValue('username', username)
      }
    }
  }, [watchedName, setValue])

  // Auto-generate password when class changes
  useEffect(() => {
    if (watchedClass) {
      const password = generateRandomPassword(watchedClass)
      setValue('password', password)
    }
  }, [watchedClass, setValue])

  const handleInfoSubmit = async (data: StudentData) => {
    try {
      // Validate age range for selected class
      const [minAge, maxAge] = getAgeRangeByClass(data.class)
      if (data.age < minAge - 2 || data.age > maxAge + 2) {
        toast.warning(`Tuổi thường cho lớp ${data.class} là từ ${minAge} đến ${maxAge}. Bạn có chắc chắn không?`)
      }

      // Check if username already exists (simulated)
      // In real implementation, you would call an API
      const existingUsernames: string[] = [] // Would come from API
      const finalUsername = generateAlternativeUsername(data.username, existingUsernames)

      if (finalUsername !== data.username) {
        setValue('username', finalUsername)
        data.username = finalUsername
        toast.info(`Username đã được điều chỉnh thành: ${finalUsername}`)
      }

      setStudentData(data)
      setStep('face')
    } catch (error) {
      console.error('Error validating student info:', error)
      toast.error('Có lỗi xảy ra khi xử lý thông tin')
    }
  }

  const handleFaceRegistrationComplete = (imageBlob: Blob) => {
    setFaceImageBlob(imageBlob)
    setFaceImageCaptured(true)
    setStep('review')
    toast.success('Đã chụp ảnh khuôn mặt thành công!')
  }

  const handleFinalSubmit = async () => {
    if (!studentData || !faceImageBlob) return

    setIsRegistering(true)

    try {
      // Create FormData for API call
      const formData = new FormData()
      formData.append('name', studentData.name)
      formData.append('age', studentData.age.toString())
      formData.append('gender', studentData.gender)
      formData.append('phone', studentData.phone)
      formData.append('class', studentData.class)
      formData.append('username', studentData.username)
      formData.append('password', studentData.password)
      formData.append('face_image', faceImageBlob, 'face_profile.jpg')
      formData.append('teacher_id', profile._id)

      // Call API to register student
      const response = await fetch('/api/teacher/register-student', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('Failed to register student')
      }

      toast.success('Đăng ký học sinh thành công!')
      setStep('success')

      if (onSuccess) {
        onSuccess(studentData)
      }
    } catch (error: any) {
      console.error('Error registering student:', error)
      toast.error(error.message || 'Không thể đăng ký học sinh')
    } finally {
      setIsRegistering(false)
    }
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`Đã copy ${label}`)
  }

  const regeneratePassword = () => {
    if (studentData?.class) {
      const newPassword = generateRandomPassword(studentData.class)
      setValue('password', newPassword)
      setStudentData({ ...studentData, password: newPassword })
      toast.info('Đã tạo mật khẩu mới')
    }
  }

  return (
    <div className='max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6'>
      {/* Progress Steps */}
      <div className='mb-8'>
        <div className='flex items-center justify-between'>
          {['info', 'face', 'review'].map((currentStep, index) => (
            <React.Fragment key={currentStep}>
              <div
                className={`flex items-center ${
                  step === currentStep
                    ? 'text-blue-600'
                    : ['face', 'review'].includes(currentStep) &&
                        ['face', 'review'].indexOf(step) > ['face', 'review'].indexOf(currentStep)
                      ? 'text-green-600'
                      : 'text-gray-400'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                    step === currentStep
                      ? 'border-blue-600 bg-blue-50'
                      : ['face', 'review'].includes(currentStep) &&
                          ['face', 'review'].indexOf(step) > ['face', 'review'].indexOf(currentStep)
                        ? 'border-green-600 bg-green-50'
                        : 'border-gray-300'
                  }`}
                >
                  {currentStep === 'info' && <User className='w-4 h-4' />}
                  {currentStep === 'face' && <Camera className='w-4 h-4' />}
                  {currentStep === 'review' && <Eye className='w-4 h-4' />}
                </div>
                <span className='ml-2 text-sm font-medium'>
                  {currentStep === 'info' && 'Thông tin'}
                  {currentStep === 'face' && 'Chụp ảnh'}
                  {currentStep === 'review' && 'Xác nhận'}
                </span>
              </div>
              {index < 2 && (
                <div
                  className={`flex-1 h-0.5 mx-4 ${
                    ['face', 'review'].indexOf(step) > index ? 'bg-green-600' : 'bg-gray-300'
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Step Content */}
      {step === 'info' && (
        <form onSubmit={handleSubmit(handleInfoSubmit)} className='space-y-6'>
          <div>
            <h3 className='text-lg font-medium text-gray-900 mb-4'>Thông tin học sinh</h3>

            {/* Name */}
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Họ và tên <span className='text-red-500'>*</span>
              </label>
              <input
                type='text'
                {...register('name', {
                  required: 'Vui lòng nhập họ tên',
                  validate: (value) => isValidVietnameseName(value) || 'Tên không hợp lệ'
                })}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='Ví dụ: Nguyễn Văn An'
              />
              {errors.name && <p className='mt-1 text-sm text-red-600'>{errors.name.message}</p>}
            </div>

            {/* Age and Gender */}
            <div className='grid grid-cols-2 gap-4 mb-4'>
              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Tuổi <span className='text-red-500'>*</span>
                </label>
                <input
                  type='number'
                  {...register('age', {
                    required: 'Vui lòng nhập tuổi',
                    min: { value: 5, message: 'Tuổi phải từ 5 trở lên' },
                    max: { value: 25, message: 'Tuổi không được quá 25' }
                  })}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                  placeholder='18'
                />
                {errors.age && <p className='mt-1 text-sm text-red-600'>{errors.age.message}</p>}
              </div>

              <div>
                <label className='block text-sm font-medium text-gray-700 mb-2'>
                  Giới tính <span className='text-red-500'>*</span>
                </label>
                <select
                  {...register('gender', { required: 'Vui lòng chọn giới tính' })}
                  className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                >
                  <option value=''>Chọn giới tính</option>
                  <option value='nam'>Nam</option>
                  <option value='nữ'>Nữ</option>
                </select>
                {errors.gender && <p className='mt-1 text-sm text-red-600'>{errors.gender.message}</p>}
              </div>
            </div>

            {/* Phone */}
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Số điện thoại</label>
              <input
                type='tel'
                {...register('phone', {
                  pattern: {
                    value: /^[0-9]{10,11}$/,
                    message: 'Số điện thoại không hợp lệ'
                  }
                })}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                placeholder='0123456789'
              />
              {errors.phone && <p className='mt-1 text-sm text-red-600'>{errors.phone.message}</p>}
            </div>

            {/* Class */}
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>
                Lớp học <span className='text-red-500'>*</span>
              </label>
              <select
                {...register('class', { required: 'Vui lòng chọn lớp' })}
                className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                <option value=''>Chọn lớp</option>
                {availableClasses.map((className) => (
                  <option key={className} value={className}>
                    Lớp {className}
                  </option>
                ))}
              </select>
              {errors.class && <p className='mt-1 text-sm text-red-600'>{errors.class.message}</p>}
            </div>

            {/* Generated Username */}
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Tên đăng nhập (tự động tạo)</label>
              <div className='flex'>
                <input
                  type='text'
                  {...register('username')}
                  readOnly
                  className='flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-gray-600'
                />
                <button
                  type='button'
                  onClick={() => copyToClipboard(watch('username'), 'username')}
                  className='px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200'
                >
                  <Copy className='w-4 h-4' />
                </button>
              </div>
            </div>

            {/* Generated Password */}
            <div className='mb-6'>
              <label className='block text-sm font-medium text-gray-700 mb-2'>Mật khẩu (tự động tạo)</label>
              <div className='flex'>
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  readOnly
                  className='flex-1 px-3 py-2 border border-gray-300 bg-gray-50 text-gray-600'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 hover:bg-gray-200'
                >
                  {showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                </button>
                <button
                  type='button'
                  onClick={regeneratePassword}
                  className='px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 hover:bg-gray-200'
                >
                  <RefreshCw className='w-4 h-4' />
                </button>
                <button
                  type='button'
                  onClick={() => copyToClipboard(watch('password'), 'mật khẩu')}
                  className='px-3 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200'
                >
                  <Copy className='w-4 h-4' />
                </button>
              </div>
            </div>
          </div>

          <div className='flex justify-between'>
            <button type='button' onClick={onCancel} className='px-4 py-2 text-gray-600 hover:text-gray-800'>
              Hủy
            </button>
            <button
              type='submit'
              className='px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              Tiếp theo: Chụp ảnh
            </button>
          </div>
        </form>
      )}

      {step === 'face' && studentData && (
        <div>
          <h3 className='text-lg font-medium text-gray-900 mb-4'>Chụp ảnh khuôn mặt cho {studentData.name}</h3>
          <div className='mb-4 p-4 bg-blue-50 rounded-lg'>
            <div className='flex items-start'>
              <AlertCircle className='w-5 h-5 text-blue-600 mr-2 mt-0.5' />
              <div className='text-sm text-blue-800'>
                <p className='font-medium'>Hướng dẫn quan trọng:</p>
                <ul className='mt-1 space-y-1'>
                  <li>• Đảm bảo học sinh nhìn thẳng vào camera</li>
                  <li>• Ánh sáng đầy đủ và rõ ràng</li>
                  <li>• Không đeo kính râm hoặc khẩu trang</li>
                  <li>• Ảnh này sẽ được dùng để xác thực trong các kỳ thi</li>
                </ul>
              </div>
            </div>
          </div>

          <FaceProfileRegistration
            onRegistrationComplete={handleFaceRegistrationComplete as any}
            studentName={studentData.name}
            hideDeleteOption={true}
          />

          <div className='flex justify-between mt-6'>
            <button
              type='button'
              onClick={() => setStep('info')}
              className='px-4 py-2 text-gray-600 hover:text-gray-800'
            >
              Quay lại
            </button>
            <button
              type='button'
              onClick={() => faceImageCaptured && setStep('review')}
              disabled={!faceImageCaptured}
              className='px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Tiếp theo: Xác nhận
            </button>
          </div>
        </div>
      )}

      {step === 'review' && studentData && (
        <div>
          <h3 className='text-lg font-medium text-gray-900 mb-4'>Xác nhận thông tin học sinh</h3>

          <div className='space-y-4 mb-6'>
            <div className='bg-gray-50 rounded-lg p-4'>
              <h4 className='font-medium text-gray-900 mb-3'>Thông tin cá nhân</h4>
              <div className='grid grid-cols-2 gap-4 text-sm'>
                <div>
                  <span className='text-gray-600'>Họ tên:</span>
                  <span className='ml-2 font-medium'>{studentData.name}</span>
                </div>
                <div>
                  <span className='text-gray-600'>Tuổi:</span>
                  <span className='ml-2 font-medium'>{studentData.age}</span>
                </div>
                <div>
                  <span className='text-gray-600'>Giới tính:</span>
                  <span className='ml-2 font-medium'>{studentData.gender}</span>
                </div>
                <div>
                  <span className='text-gray-600'>Lớp:</span>
                  <span className='ml-2 font-medium'>{studentData.class}</span>
                </div>
                {studentData.phone && (
                  <div className='col-span-2'>
                    <span className='text-gray-600'>Số điện thoại:</span>
                    <span className='ml-2 font-medium'>{studentData.phone}</span>
                  </div>
                )}
              </div>
            </div>

            <div className='bg-gray-50 rounded-lg p-4'>
              <h4 className='font-medium text-gray-900 mb-3'>Thông tin đăng nhập</h4>
              <div className='space-y-2 text-sm'>
                <div className='flex justify-between items-center'>
                  <span className='text-gray-600'>Username:</span>
                  <div className='flex items-center'>
                    <span className='font-mono bg-white px-2 py-1 rounded border'>{studentData.username}</span>
                    <button
                      onClick={() => copyToClipboard(studentData.username, 'username')}
                      className='ml-2 p-1 hover:bg-gray-200 rounded'
                    >
                      <Copy className='w-4 h-4' />
                    </button>
                  </div>
                </div>
                <div className='flex justify-between items-center'>
                  <span className='text-gray-600'>Password:</span>
                  <div className='flex items-center'>
                    <span className='font-mono bg-white px-2 py-1 rounded border'>
                      {showPassword ? studentData.password : '••••••••'}
                    </span>
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className='ml-2 p-1 hover:bg-gray-200 rounded'
                    >
                      {showPassword ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                    </button>
                    <button
                      onClick={() => copyToClipboard(studentData.password, 'mật khẩu')}
                      className='ml-2 p-1 hover:bg-gray-200 rounded'
                    >
                      <Copy className='w-4 h-4' />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className='bg-green-50 rounded-lg p-4'>
              <div className='flex items-center'>
                <Camera className='w-5 h-5 text-green-600 mr-2' />
                <span className='text-green-800 font-medium'>Ảnh khuôn mặt đã được chụp và lưu thành công</span>
              </div>
            </div>
          </div>

          <div className='flex justify-between'>
            <button
              type='button'
              onClick={() => setStep('face')}
              className='px-4 py-2 text-gray-600 hover:text-gray-800'
            >
              Quay lại
            </button>
            <button
              type='button'
              onClick={handleFinalSubmit}
              disabled={isRegistering}
              className='px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 flex items-center'
            >
              {isRegistering ? (
                <>
                  <RefreshCw className='w-4 h-4 mr-2 animate-spin' />
                  Đang đăng ký...
                </>
              ) : (
                <>
                  <UserPlus className='w-4 h-4 mr-2' />
                  Đăng ký học sinh
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {step === 'success' && studentData && (
        <div className='text-center'>
          <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
            <UserPlus className='w-8 h-8 text-green-600' />
          </div>
          <h3 className='text-lg font-medium text-gray-900 mb-2'>Đăng ký học sinh thành công!</h3>
          <p className='text-gray-600 mb-6'>Tài khoản cho {studentData.name} đã được tạo và có thể sử dụng ngay.</p>

          <div className='bg-gray-50 rounded-lg p-4 mb-6'>
            <h4 className='font-medium text-gray-900 mb-2'>Thông tin đăng nhập:</h4>
            <div className='text-left space-y-2 text-sm max-w-sm mx-auto'>
              <div className='flex justify-between'>
                <span>Username:</span>
                <span className='font-mono'>{studentData.username}</span>
              </div>
              <div className='flex justify-between'>
                <span>Password:</span>
                <span className='font-mono'>{studentData.password}</span>
              </div>
            </div>
          </div>

          <button
            type='button'
            onClick={() => {
              setStep('info')
              setStudentData(null)
              setFaceImageCaptured(false)
              setFaceImageBlob(null)
            }}
            className='px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
          >
            Đăng ký học sinh khác
          </button>
        </div>
      )}
    </div>
  )
}

export default StudentRegistrationForm
