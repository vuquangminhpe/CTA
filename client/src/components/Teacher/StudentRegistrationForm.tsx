/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useContext } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { User, Upload, Eye, EyeOff, Copy, RefreshCw, UserPlus, Plus, Minus, X, ZoomIn } from 'lucide-react'
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

interface StudentData {
  name: string
  age: number
  gender: 'nam' | 'nữ'
  phone: string
  username: string
  password: string
  faceImage: File | null
}

interface BulkStudentForm {
  selectedClass: string
  students: StudentData[]
}

interface StudentRegistrationFormProps {
  onSuccess?: (studentsData: StudentData[]) => void
  onCancel?: () => void
}

const StudentRegistrationForm: React.FC<StudentRegistrationFormProps> = ({ onSuccess, onCancel }) => {
  const { profile } = useContext(AuthContext) as any
  const [step, setStep] = useState<'class' | 'students' | 'review' | 'success'>('class')
  const [selectedClass, setSelectedClass] = useState<string>('')
  const [availableClasses, setAvailableClasses] = useState<string[]>([])
  const [isRegistering, setIsRegistering] = useState(false)
  const [showPasswords, setShowPasswords] = useState<boolean[]>([])
  const [registeredStudents, setRegisteredStudents] = useState<StudentData[]>([])
  const [registrationProgress, setRegistrationProgress] = useState({ current: 0, total: 0 })
  const [imagePreviewModal, setImagePreviewModal] = useState<{
    isOpen: boolean
    imageUrl: string
    studentName: string
  }>({
    isOpen: false,
    imageUrl: '',
    studentName: ''
  })

  const teacherLevel = profile?.teacher_level || 'middle_school'

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<BulkStudentForm>({
    defaultValues: {
      selectedClass: '',
      students: [{ name: '', age: 16, gender: 'nam', phone: '', username: '', password: '', faceImage: null }]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'students'
  })

  const watchedStudents = watch('students')

  // Load available classes based on teacher level
  useEffect(() => {
    const classes = getClassesByLevel(teacherLevel)
    setAvailableClasses(classes)
  }, [teacherLevel])

  // Auto-generate usernames and passwords when student data changes
  useEffect(() => {
    watchedStudents.forEach((student, index) => {
      if (student.name && student.name.length >= 2 && isValidVietnameseName(student.name)) {
        const username = generateUsernameFromName(student.name)
        setValue(`students.${index}.username`, username)
      }

      if (selectedClass) {
        const password = generateRandomPassword(selectedClass)
        setValue(`students.${index}.password`, password)
      }
    })
  }, [watchedStudents, selectedClass, setValue])

  // Initialize password visibility array
  useEffect(() => {
    setShowPasswords(new Array(fields.length).fill(false))
  }, [fields.length])

  const handleClassSelect = (classValue: string) => {
    setSelectedClass(classValue)
    setValue('selectedClass', classValue)
    setStep('students')
  }

  const addStudent = () => {
    const [minAge, maxAge] = getAgeRangeByClass(selectedClass)
    const defaultAge = Math.floor((minAge + maxAge) / 2)

    append({
      name: '',
      age: defaultAge,
      gender: 'nam',
      phone: '',
      username: '',
      password: '',
      faceImage: null
    })
  }

  const removeStudent = (index: number) => {
    if (fields.length > 1) {
      remove(index)
    }
  }

  const handleImageUpload = (index: number, file: File) => {
    setValue(`students.${index}.faceImage`, file)
  }

  const showImagePreview = (imageFile: File, studentName: string) => {
    const imageUrl = URL.createObjectURL(imageFile)
    setImagePreviewModal({
      isOpen: true,
      imageUrl,
      studentName
    })
  }

  const closeImagePreview = () => {
    if (imagePreviewModal.imageUrl) {
      URL.revokeObjectURL(imagePreviewModal.imageUrl)
    }
    setImagePreviewModal({ isOpen: false, imageUrl: '', studentName: '' })
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`Đã copy ${label}`)
  }

  const togglePasswordVisibility = (index: number) => {
    setShowPasswords((prev) => {
      const newState = [...prev]
      newState[index] = !newState[index]
      return newState
    })
  }

  const regeneratePassword = (index: number) => {
    if (selectedClass) {
      const newPassword = generateRandomPassword(selectedClass)
      setValue(`students.${index}.password`, newPassword)
      toast.info('Đã tạo mật khẩu mới')
    }
  }

  const validateStudentsData = (data: BulkStudentForm) => {
    const errors: string[] = []

    data.students.forEach((student, index) => {
      // Validate age range for selected class
      const [minAge, maxAge] = getAgeRangeByClass(data.selectedClass)
      if (student.age < minAge - 2 || student.age > maxAge + 2) {
        errors.push(
          `Học sinh ${index + 1} (${student.name}): Tuổi thường cho lớp ${data.selectedClass} là từ ${minAge} đến ${maxAge}`
        )
      }

      // Check for required face image
      if (!student.faceImage) {
        errors.push(`Học sinh ${index + 1} (${student.name}): Chưa chọn ảnh khuôn mặt`)
      }
    })

    return errors
  }

  const handleStudentsSubmit = async (data: BulkStudentForm) => {
    try {
      const validationErrors = validateStudentsData(data)
      if (validationErrors.length > 0) {
        validationErrors.forEach((error) => toast.warning(error))
        return
      }

      // Check for duplicate usernames and adjust if needed
      const existingUsernames: string[] = [] // Would come from API in real implementation
      const adjustedStudents = data.students.map((student, index) => {
        const finalUsername = generateAlternativeUsername(student.username, existingUsernames)
        existingUsernames.push(finalUsername)

        if (finalUsername !== student.username) {
          setValue(`students.${index}.username`, finalUsername)
          toast.info(`Username học sinh ${index + 1} đã được điều chỉnh thành: ${finalUsername}`)
        }

        return { ...student, username: finalUsername }
      })

      setValue('students', adjustedStudents)
      setStep('review')
    } catch (error) {
      console.error('Error validating students data:', error)
      toast.error('Có lỗi xảy ra khi xử lý thông tin')
    }
  }

  const handleFinalSubmit = async () => {
    const formData = watch()
    if (!formData.students.length) return

    setIsRegistering(true)
    setRegistrationProgress({ current: 0, total: formData.students.length })

    const successfulRegistrations: StudentData[] = []
    const failedRegistrations: string[] = []

    try {
      for (let i = 0; i < formData.students.length; i++) {
        const student = formData.students[i]
        setRegistrationProgress({ current: i + 1, total: formData.students.length })

        try {
          // Create FormData for each student
          const studentFormData = new FormData()
          studentFormData.append('name', student.name)
          studentFormData.append('age', student.age.toString())
          studentFormData.append('gender', student.gender)
          studentFormData.append('phone', student.phone || '')
          studentFormData.append('class', formData.selectedClass)
          studentFormData.append('username', student.username)
          studentFormData.append('password', student.password)
          if (student.faceImage) {
            studentFormData.append('face_image', student.faceImage, `${student.username}_face.jpg`)
          }
          studentFormData.append('teacher_id', profile._id)

          // Call API to register individual student
          const response = await fetch('https://dsf-32wz.onrender.com/api/teacher/register-student', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${localStorage.getItem('access_token')}`
            },
            body: studentFormData
          })

          if (!response.ok) {
            throw new Error(`Failed to register ${student.name}`)
          }

          successfulRegistrations.push(student)
          toast.success(`Đã đăng ký thành công: ${student.name}`)
        } catch (error: any) {
          console.error(`Error registering ${student.name}:`, error)
          failedRegistrations.push(`${student.name}: ${error.message}`)
          toast.error(`Lỗi đăng ký ${student.name}: ${error.message}`)
        }
      }

      // Show final results
      if (successfulRegistrations.length > 0) {
        toast.success(`Đăng ký thành công ${successfulRegistrations.length}/${formData.students.length} học sinh`)
        setRegisteredStudents(successfulRegistrations)
        setStep('success')

        if (onSuccess) {
          onSuccess(successfulRegistrations)
        }
      }

      if (failedRegistrations.length > 0) {
        toast.error(`Có ${failedRegistrations.length} học sinh đăng ký thất bại`)
      }
    } catch (error: any) {
      console.error('Error in bulk registration:', error)
      toast.error('Có lỗi xảy ra trong quá trình đăng ký')
    } finally {
      setIsRegistering(false)
      setRegistrationProgress({ current: 0, total: 0 })
    }
  }

  return (
    <>
      <div className='w-full bg-white rounded-lg shadow-lg p-6'>
        {/* Progress Steps */}
        <div className='mb-8'>
          <div className='flex items-center justify-between'>
            {['class', 'students', 'review'].map((currentStep, index) => (
              <React.Fragment key={currentStep}>
                <div
                  className={`flex items-center ${
                    step === currentStep
                      ? 'text-blue-600'
                      : ['students', 'review'].includes(currentStep) &&
                          ['students', 'review'].indexOf(step) > ['students', 'review'].indexOf(currentStep)
                        ? 'text-green-600'
                        : 'text-gray-400'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                      step === currentStep
                        ? 'border-blue-600 bg-blue-50'
                        : ['students', 'review'].includes(currentStep) &&
                            ['students', 'review'].indexOf(step) > ['students', 'review'].indexOf(currentStep)
                          ? 'border-green-600 bg-green-50'
                          : 'border-gray-300'
                    }`}
                  >
                    {currentStep === 'class' && <User className='w-4 h-4' />}
                    {currentStep === 'students' && <UserPlus className='w-4 h-4' />}
                    {currentStep === 'review' && <Eye className='w-4 h-4' />}
                  </div>
                  <span className='ml-2 text-sm font-medium'>
                    {currentStep === 'class' && 'Chọn lớp'}
                    {currentStep === 'students' && 'Danh sách học sinh'}
                    {currentStep === 'review' && 'Xác nhận'}
                  </span>
                </div>
                {index < 2 && (
                  <div
                    className={`flex-1 h-0.5 mx-4 ${
                      ['students', 'review'].indexOf(step) > index ? 'bg-green-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Step Content */}
        {step === 'class' && (
          <div>
            <h3 className='text-lg font-medium text-gray-900 mb-4'>Chọn lớp học</h3>
            <p className='text-gray-600 mb-6'>Chọn lớp học cho toàn bộ danh sách học sinh sẽ đăng ký</p>

            <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8'>
              {availableClasses.map((className) => (
                <button
                  key={className}
                  onClick={() => handleClassSelect(className)}
                  className='p-4 border-2 bg-white border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center'
                >
                  <div className='text-lg font-medium text-gray-900'>Lớp {className}</div>
                  <div className='text-sm text-gray-500 mt-1'>
                    {(() => {
                      const [minAge, maxAge] = getAgeRangeByClass(className)
                      return `${minAge}-${maxAge} tuổi`
                    })()}
                  </div>
                </button>
              ))}
            </div>

            <div className='flex justify-between'>
              <button
                type='button'
                onClick={onCancel}
                className='px-4 bg-white border border-gray-200 py-2 text-gray-600 hover:text-gray-800'
              >
                Hủy
              </button>
            </div>
          </div>
        )}

        {step === 'students' && (
          <form onSubmit={handleSubmit(handleStudentsSubmit)} className='space-y-6'>
            <div className='flex items-center justify-between'>
              <h3 className='text-lg font-medium text-gray-900'>Danh sách học sinh lớp {selectedClass}</h3>
              <button
                type='button'
                onClick={addStudent}
                className='px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center'
              >
                <Plus className='w-4 h-4 mr-2' />
                Thêm học sinh
              </button>
            </div>

            {/* Horizontal Table Layout */}
            <div className='overflow-x-auto bg-gray-50 rounded-lg p-4'>
              <table className='w-full min-w-[1200px]'>
                <thead>
                  <tr className='border-b border-gray-200'>
                    <th className='text-left py-3 px-2 font-medium text-gray-700 w-8'>#</th>
                    <th className='text-left py-3 px-2 font-medium text-gray-700 min-w-[180px]'>Họ và tên *</th>
                    <th className='text-left py-3 px-2 font-medium text-gray-700 w-20'>Tuổi *</th>
                    <th className='text-left py-3 px-2 font-medium text-gray-700 w-24'>Giới tính *</th>
                    <th className='text-left py-3 px-2 font-medium text-gray-700 min-w-[120px]'>SĐT</th>
                    <th className='text-left py-3 px-2 font-medium text-gray-700 min-w-[140px] hidden'>Username</th>
                    <th className='text-left py-3 px-2 font-medium text-gray-700 min-w-[140px] hidden'>Password</th>
                    <th className='text-left py-3 px-2 font-medium text-gray-700 min-w-[150px]'>Ảnh khuôn mặt *</th>
                    <th className='text-left py-3 px-2 font-medium text-gray-700 w-12'>Xóa</th>
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => (
                    <tr key={field.id} className='border-b border-gray-100 hover:bg-white transition-colors'>
                      <td className='py-3 px-2'>
                        <span className='w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium'>
                          {index + 1}
                        </span>
                      </td>

                      {/* Name */}
                      <td className='py-3 px-2'>
                        <input
                          type='text'
                          {...register(`students.${index}.name`, {
                            required: 'Vui lòng nhập họ tên',
                            validate: (value) => isValidVietnameseName(value) || 'Tên không hợp lệ'
                          })}
                          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                          placeholder='Nguyễn Văn An'
                        />
                        {errors.students?.[index]?.name && (
                          <p className='mt-1 text-xs text-red-600'>{errors.students[index]?.name?.message}</p>
                        )}
                      </td>

                      {/* Age */}
                      <td className='py-3 px-2'>
                        <input
                          type='number'
                          {...register(`students.${index}.age`, {
                            required: 'Tuổi',
                            min: { value: 5, message: 'Min 5' },
                            max: { value: 25, message: 'Max 25' }
                          })}
                          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                        />
                        {errors.students?.[index]?.age && (
                          <p className='mt-1 text-xs text-red-600'>{errors.students[index]?.age?.message}</p>
                        )}
                      </td>

                      {/* Gender */}
                      <td className='py-3 px-2'>
                        <select
                          {...register(`students.${index}.gender`, { required: 'Chọn giới tính' })}
                          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                        >
                          <option value='nam'>Nam</option>
                          <option value='nữ'>Nữ</option>
                        </select>
                      </td>

                      {/* Phone */}
                      <td className='py-3 px-2'>
                        <input
                          type='tel'
                          {...register(`students.${index}.phone`, {
                            pattern: {
                              value: /^[0-9]{10,11}$/,
                              message: 'SĐT không hợp lệ'
                            }
                          })}
                          className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                          placeholder='0123456789'
                        />
                        {errors.students?.[index]?.phone && (
                          <p className='mt-1 text-xs text-red-600'>{errors.students[index]?.phone?.message}</p>
                        )}
                      </td>

                      {/* Username */}
                      <td className='py-3 px-2 hidden'>
                        <div className='flex'>
                          <input
                            type='text'
                            {...register(`students.${index}.username`)}
                            readOnly
                            className='flex-1 px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-gray-600 text-sm'
                          />
                          <button
                            type='button'
                            onClick={() => copyToClipboard(watch(`students.${index}.username`), 'username')}
                            className='px-2 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200'
                          >
                            <Copy className='w-4 h-4' />
                          </button>
                        </div>
                      </td>

                      {/* Password */}
                      <td className='py-3 px-2 hidden'>
                        <div className='flex'>
                          <input
                            type={showPasswords[index] ? 'text' : 'password'}
                            {...register(`students.${index}.password`)}
                            readOnly
                            className='flex-1 px-3 py-2 border border-gray-300 bg-gray-50 text-gray-600 text-sm'
                          />
                          <button
                            type='button'
                            onClick={() => togglePasswordVisibility(index)}
                            className='px-2 py-2 bg-gray-100 border border-l-0 border-gray-300 hover:bg-gray-200'
                          >
                            {showPasswords[index] ? <EyeOff className='w-4 h-4' /> : <Eye className='w-4 h-4' />}
                          </button>
                          <button
                            type='button'
                            onClick={() => regeneratePassword(index)}
                            className='px-2 py-2 bg-gray-100 border border-l-0 border-gray-300 hover:bg-gray-200'
                          >
                            <RefreshCw className='w-4 h-4' />
                          </button>
                          <button
                            type='button'
                            onClick={() => copyToClipboard(watch(`students.${index}.password`), 'mật khẩu')}
                            className='px-2 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-md hover:bg-gray-200'
                          >
                            <Copy className='w-4 h-4' />
                          </button>
                        </div>
                      </td>

                      {/* Face Image Upload */}
                      <td className='py-3 px-2'>
                        <div className='flex items-center space-x-2'>
                          <input
                            type='file'
                            accept='image/*'
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) {
                                handleImageUpload(index, file)
                              }
                            }}
                            className='hidden'
                            id={`image-upload-${index}`}
                          />
                          <label
                            htmlFor={`image-upload-${index}`}
                            className='px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer flex items-center text-sm'
                          >
                            <Upload className='w-4 h-4 mr-1' />
                            Chọn
                          </label>
                          {watchedStudents[index]?.faceImage && (
                            <button
                              type='button'
                              onClick={() =>
                                showImagePreview(
                                  watchedStudents[index].faceImage as File,
                                  watchedStudents[index].name || `Học sinh ${index + 1}`
                                )
                              }
                              className='p-2 bg-green-100 text-green-600 rounded-md hover:bg-green-200 transition-colors'
                              title='Xem ảnh'
                            >
                              <ZoomIn className='w-4 h-4' />
                            </button>
                          )}
                        </div>
                        {watchedStudents[index]?.faceImage && (
                          <div
                            className='mt-1 text-xs text-green-600 truncate'
                            title={watchedStudents[index].faceImage.name}
                          >
                            ✓ {watchedStudents[index].faceImage.name}
                          </div>
                        )}
                      </td>

                      {/* Remove Button */}
                      <td className='py-3 px-2'>
                        {fields.length > 1 && (
                          <button
                            type='button'
                            onClick={() => removeStudent(index)}
                            className='p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors'
                          >
                            <Minus className='w-4 h-4' />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className='flex justify-between'>
              <button
                type='button'
                onClick={() => setStep('class')}
                className='px-4 py-2 bg-white border border-gray-200 text-gray-600 hover:text-gray-800'
              >
                Quay lại
              </button>
              <button
                type='submit'
                className='px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
              >
                Tiếp theo: Xác nhận
              </button>
            </div>
          </form>
        )}

        {step === 'review' && (
          <div>
            <h3 className='text-lg font-medium text-gray-900 mb-4'>
              Xác nhận đăng ký {watchedStudents.length} học sinh lớp {selectedClass}
            </h3>

            <div className='space-y-4 mb-6 max-h-96 overflow-y-auto'>
              {watchedStudents.map((student, index) => (
                <div key={index} className='bg-gray-50 rounded-lg p-4'>
                  <h4 className='font-medium text-gray-900 mb-3'>
                    {index + 1}. {student.name} ({student.age} tuổi, {student.gender})
                  </h4>
                  <div className='grid grid-cols-2 gap-4 text-sm'>
                    <div>
                      <span className='text-gray-600'>Username:</span>
                      <span className='ml-2 font-mono'>{student.username}</span>
                    </div>
                    <div>
                      <span className='text-gray-600'>Password:</span>
                      <span className='ml-2 font-mono'>{student.password}</span>
                    </div>
                    {student.phone && (
                      <div>
                        <span className='text-gray-600'>SĐT:</span>
                        <span className='ml-2'>{student.phone}</span>
                      </div>
                    )}
                    <div>
                      <span className='text-gray-600'>Ảnh:</span>
                      <span className='ml-2 text-green-600'>{student.faceImage ? '✓ Đã chọn' : '✗ Chưa chọn'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {isRegistering && (
              <div className='mb-6 p-4 bg-blue-50 rounded-lg'>
                <div className='flex items-center justify-between'>
                  <span className='text-blue-800'>
                    Đang đăng ký học sinh {registrationProgress.current}/{registrationProgress.total}...
                  </span>
                  <RefreshCw className='w-4 h-4 text-blue-600 animate-spin' />
                </div>
                <div className='mt-2 bg-blue-200 rounded-full h-2'>
                  <div
                    className='bg-blue-600 h-2 rounded-full transition-all duration-300'
                    style={{
                      width: `${(registrationProgress.current / registrationProgress.total) * 100}%`
                    }}
                  />
                </div>
              </div>
            )}

            <div className='flex justify-between'>
              <button
                type='button'
                onClick={() => setStep('students')}
                disabled={isRegistering}
                className='px-4 py-2 bg-white text-gray-600 border border-gray-200 hover:text-gray-800 disabled:opacity-50'
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
                    Đăng ký tất cả học sinh
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className='text-center'>
            <div className='w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4'>
              <UserPlus className='w-8 h-8 text-green-600' />
            </div>
            <h3 className='text-lg font-medium text-gray-900 mb-2'>
              Đăng ký thành công {registeredStudents.length} học sinh!
            </h3>
            <p className='text-gray-600 mb-6'>Tất cả tài khoản đã được tạo và có thể sử dụng ngay.</p>

            <div className='bg-gray-50 rounded-lg p-4 mb-6 max-h-60 overflow-y-auto'>
              <h4 className='font-medium text-gray-900 mb-2'>Danh sách đã đăng ký:</h4>
              <div className='space-y-2 text-sm'>
                {registeredStudents.map((student, index) => (
                  <div key={index} className='flex justify-between items-center p-2 bg-white rounded border'>
                    <span>{student.name}</span>
                    <div className='text-xs text-gray-600'>
                      <span className='font-mono mr-2'>{student.username}</span>
                      <span className='font-mono'>{student.password}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type='button'
              onClick={() => {
                setStep('class')
                setSelectedClass('')
                setValue('students', [
                  { name: '', age: 16, gender: 'nam', phone: '', username: '', password: '', faceImage: null }
                ])
                setRegisteredStudents([])
              }}
              className='px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              Đăng ký lớp khác
            </button>
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {imagePreviewModal.isOpen && (
        <div
          className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
          onClick={closeImagePreview}
        >
          <div
            className='bg-white rounded-lg p-6 max-w-md max-h-[80vh] overflow-hidden'
            onClick={(e) => e.stopPropagation()}
          >
            <div className='flex justify-between items-center mb-4'>
              <h3 className='text-lg font-medium text-gray-900'>Ảnh khuôn mặt - {imagePreviewModal.studentName}</h3>
              <button onClick={closeImagePreview} className='p-1 hover:bg-gray-100 rounded-full'>
                <X className='w-5 h-5 text-gray-500' />
              </button>
            </div>
            <img
              src={imagePreviewModal.imageUrl}
              alt={`Ảnh của ${imagePreviewModal.studentName}`}
              className='w-full h-auto max-h-[60vh] object-contain rounded-lg'
            />
          </div>
        </div>
      )}
    </>
  )
}

export default StudentRegistrationForm
