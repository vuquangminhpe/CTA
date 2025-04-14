/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'

const ExamGenerator = ({ onSubmit, questionCount = 0 }: any) => {
  const [formData, setFormData] = useState({
    title: '',
    quantity: 10,
    question_count: Math.min(5, questionCount),
    duration: 30 // minutes
  })

  const handleChange = (e: any) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: name === 'title' ? value : parseInt(value, 10)
    })
  }

  const handleSubmit = (e: any) => {
    e.preventDefault()

    // Validate
    if (formData.question_count > questionCount) {
      alert(
        `You only have ${questionCount} questions in your bank. Please create more questions or reduce the question count.`
      )
      return
    }

    if (!formData.title.trim()) {
      alert('Please enter an exam title')
      return
    }

    onSubmit(formData)
  }

  return (
    <div className='bg-white shadow overflow-hidden sm:rounded-lg'>
      <div className='px-4 py-5 sm:p-6'>
        <h3 className='text-lg leading-6 font-medium text-gray-900'>Generate Exam QR Codes</h3>
        <div className='mt-2 max-w-xl text-sm text-gray-500'>
          <p>Create QR codes for students to take an exam. Each QR code will represent a unique exam.</p>
        </div>

        <form onSubmit={handleSubmit} className='mt-5 space-y-6'>
          <div>
            <label htmlFor='title' className='block text-sm font-medium text-gray-700'>
              Exam Title
            </label>
            <input
              type='text'
              name='title'
              id='title'
              value={formData.title}
              onChange={handleChange}
              className='mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
              placeholder='Midterm Exam'
              required
            />
          </div>

          <div className='grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-3'>
            <div>
              <label htmlFor='quantity' className='block text-sm font-medium text-gray-700'>
                Number of QR Codes
              </label>
              <div className='mt-1'>
                <input
                  type='number'
                  name='quantity'
                  id='quantity'
                  min='1'
                  max='100'
                  value={formData.quantity}
                  onChange={handleChange}
                  className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md'
                  required
                />
              </div>
              <p className='mt-2 text-sm text-gray-500'>How many different exam versions to generate</p>
            </div>

            <div>
              <label htmlFor='question_count' className='block text-sm font-medium text-gray-700'>
                Questions per Exam
              </label>
              <div className='mt-1'>
                <input
                  type='number'
                  name='question_count'
                  id='question_count'
                  min='1'
                  max={questionCount}
                  value={formData.question_count}
                  onChange={handleChange}
                  className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md'
                  required
                />
              </div>
              <p className='mt-2 text-sm text-gray-500'>
                {questionCount === 0 ? (
                  <span className='text-red-500'>You need to create questions first</span>
                ) : (
                  `Questions will be randomly selected from your bank of ${questionCount} questions`
                )}
              </p>
            </div>

            <div>
              <label htmlFor='duration' className='block text-sm font-medium text-gray-700'>
                Duration (minutes)
              </label>
              <div className='mt-1'>
                <input
                  type='number'
                  name='duration'
                  id='duration'
                  min='1'
                  max='240'
                  value={formData.duration}
                  onChange={handleChange}
                  className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md'
                  required
                />
              </div>
              <p className='mt-2 text-sm text-gray-500'>Time students will have to complete the exam</p>
            </div>
          </div>

          <div className='flex justify-end'>
            <button
              type='submit'
              className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              disabled={questionCount === 0}
            >
              Generate QR Codes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ExamGenerator
