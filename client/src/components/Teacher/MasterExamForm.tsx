import React, { useState } from 'react'
import { X, Calendar, Clock, BookText } from 'lucide-react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import { toast } from 'sonner'
import examApi from '../../apis/exam.api'

interface MasterExamFormProps {
  onSuccess: () => void
  onCancel: () => void
}

const MasterExamForm: React.FC<MasterExamFormProps> = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    exam_period: '',
    start_time: null as Date | null,
    end_time: null as Date | null
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleDateChange = (field: 'start_time' | 'end_time', date: Date | null) => {
    setFormData((prev) => ({
      ...prev,
      [field]: date
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate
    if (!formData.name.trim()) {
      toast.error('Vui lòng nhập tên kỳ thi')
      return
    }

    if (formData.start_time && formData.end_time && formData.start_time > formData.end_time) {
      toast.error('Thời gian kết thúc phải sau thời gian bắt đầu')
      return
    }

    try {
      setIsSubmitting(true)
      await examApi.createMasterExam({
        ...formData,
        start_time: formData.start_time ? formData.start_time.toISOString() : undefined,
        end_time: formData.end_time ? formData.end_time.toISOString() : undefined
      })
      toast.success('Đã tạo kỳ thi chính thành công')
      onSuccess()
    } catch (error) {
      console.error('Failed to create master exam:', error)
      toast.error('Không thể tạo kỳ thi chính')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className='bg-white shadow overflow-hidden sm:rounded-lg'>
      <div className='px-4 py-5 sm:px-6 flex justify-between items-center'>
        <h3 className='text-lg leading-6 font-medium text-gray-900 flex items-center'>
          <BookText className='mr-2 h-5 w-5 text-blue-500' />
          Tạo kỳ thi chính mới
        </h3>
        <button type='button' onClick={onCancel} className='text-gray-400 hover:text-gray-500'>
          <X className='h-5 w-5' />
        </button>
      </div>

      <form onSubmit={handleSubmit} className='border-t border-gray-200'>
        <div className='px-4 py-5 sm:p-6'>
          <div className='grid grid-cols-1 gap-6 sm:grid-cols-2'>
            <div className='sm:col-span-2'>
              <label htmlFor='name' className='block text-sm font-medium text-gray-700'>
                Tên kỳ thi <span className='text-red-500'>*</span>
              </label>
              <div className='mt-1'>
                <input
                  type='text'
                  name='name'
                  id='name'
                  value={formData.name}
                  onChange={handleChange}
                  className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md'
                  placeholder='Ví dụ: Kỳ thi cuối kì 1'
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor='start_time' className='block text-sm font-medium text-gray-700 flex items-center'>
                <Calendar className='w-4 h-4 mr-1 text-gray-500' />
                Thời gian bắt đầu
              </label>
              <div className='mt-1'>
                <DatePicker
                  selected={formData.start_time}
                  onChange={(date) => handleDateChange('start_time', date)}
                  timeIntervals={10}
                  showTimeSelect
                  dateFormat='Pp'
                  placeholderText='Chọn thời gian bắt đầu'
                  className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2'
                  isClearable
                />
              </div>
            </div>

            <div>
              <label htmlFor='end_time' className='block text-sm font-medium text-gray-700 flex items-center'>
                <Clock className='w-4 h-4 mr-1 text-gray-500' />
                Thời gian kết thúc
              </label>
              <div className='mt-1'>
                <DatePicker
                  selected={formData.end_time}
                  onChange={(date) => handleDateChange('end_time', date)}
                  timeIntervals={10}
                  showTimeSelect
                  dateFormat='Pp'
                  placeholderText='Chọn thời gian kết thúc'
                  className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md p-2'
                  isClearable
                  minDate={formData.start_time || undefined}
                />
              </div>
            </div>
          </div>
        </div>

        <div className='px-4 py-3 bg-gray-50 sm:px-6 sm:flex sm:flex-row-reverse'>
          <button
            type='submit'
            disabled={isSubmitting}
            className='w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50'
          >
            {isSubmitting ? 'Đang tạo...' : 'Tạo kỳ thi'}
          </button>
          <button
            type='button'
            onClick={onCancel}
            className='mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm'
          >
            Hủy bỏ
          </button>
        </div>
      </form>
    </div>
  )
}

export default MasterExamForm
