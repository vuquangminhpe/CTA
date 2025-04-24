/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeEvent, useState } from 'react'
import { Plus, Trash2, Image, X } from 'lucide-react'
import { useMutation, useQuery } from '@tanstack/react-query'
import examApi from '../../apis/exam.api'
import mediasApi from '@/apis/medias.api'

const QuestionForm = ({ onSubmit, initialData = null, onCancel }: any) => {
  const [question, setQuestion] = useState({
    content: initialData?.content || '',
    answers: initialData?.answers || ['', ''],
    correct_index: initialData?.correct_index || 0,
    master_exam_id: initialData?.master_exam_id || '',
    questionLink: initialData?.questionLink || ''
  })
  const [uploadingImage, setUploadingImage] = useState<boolean>(false)
  const [imagePreview, setImagePreview] = useState<string | null>(
    initialData?.questionLink ? initialData.questionLink : null
  )

  const { data: dataExams } = useQuery({
    queryKey: ['dataExams'],
    queryFn: () => examApi.getMasterExams()
  })
  const dataExam = dataExams?.data?.result || []
  const handleSelectMasterId = (master_exams_id: string) => {
    setQuestion({ ...question, master_exam_id: master_exams_id })
  }
  const handleContentChange = (e: any) => {
    setQuestion({ ...question, content: e.target.value })
  }

  const handleAnswerChange = (index: any, value: any) => {
    const newAnswers = [...question.answers]
    newAnswers[index] = value
    setQuestion({ ...question, answers: newAnswers })
  }

  const handleCorrectAnswerChange = (index: any) => {
    setQuestion({ ...question, correct_index: index })
  }

  const addAnswer = () => {
    setQuestion({
      ...question,
      answers: [...question.answers, '']
    })
  }

  const removeAnswer = (index: any) => {
    if (question.answers.length <= 2) {
      return // Minimum 2 answers required
    }

    const newAnswers = [...question.answers]
    newAnswers.splice(index, 1)

    // Adjust correct_index if needed
    let newCorrectIndex = question.correct_index
    if (index === question.correct_index) {
      newCorrectIndex = 0
    } else if (index < question.correct_index) {
      newCorrectIndex--
    }

    setQuestion({
      ...question,
      answers: newAnswers,
      correct_index: newCorrectIndex
    })
  }

  const uploadImagesMutation = useMutation({
    mutationFn: mediasApi.uploadImages,
    onMutate: () => {
      setUploadingImage(true)
    },
    onSuccess: (data) => {
      // Extract URL from the response
      const uploadedImageUrl = data.data.result[0].url

      // Update the question state with the new URL
      setQuestion({ ...question, questionLink: uploadedImageUrl })

      // Set the preview
      setImagePreview(uploadedImageUrl)
    },
    onError: (error) => {
      console.error('Failed to upload image:', error)
      alert('Tải ảnh lên thất bại. Vui lòng thử lại.')
    },
    onSettled: () => {
      setUploadingImage(false)
    }
  })

  const handleImageSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files && files.length > 0) {
      const file = files[0] // Take only the first file

      // Create a preview for immediate feedback
      setImagePreview(URL.createObjectURL(file))

      // Upload the image
      uploadImagesMutation.mutate(file)
    }
  }

  const removeImage = () => {
    setImagePreview(null)
    setQuestion({ ...question, questionLink: '' })
  }

  const handleSubmit = (e: any) => {
    e.preventDefault()

    // Validate
    if (!question.content.trim()) {
      alert('Vui lòng nhập câu hỏi')
      return
    }

    if (question.answers.some((answer: any) => !answer.trim())) {
      alert('Tất cả các câu trả lời phải có nội dung')
      return
    }

    onSubmit(question)
  }

  return (
    <div className='bg-white shadow sm:rounded-lg'>
      <div className='px-4 py-5 sm:p-6'>
        <div className='flex items-center justify-between'>
          <label htmlFor='master_exam_id' className='block text-sm font-medium text-gray-700'>
            Hãy chọn xem câu hỏi này thuộc kỳ thi nào
          </label>
          <select
            id='master_exam_id'
            name='master_exam_id'
            value={question.master_exam_id}
            onChange={(e) => handleSelectMasterId(e.target.value)}
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
          >
            <option value=''>Chọn kỳ thi</option>
            {dataExam.map((exam: any) => (
              <option key={exam._id} value={exam._id}>
                {exam.name}
              </option>
            ))}
          </select>
        </div>
        <h3 className='text-lg font-medium leading-6 text-gray-900'>
          {initialData ? 'Chỉnh sửa câu hỏi' : 'Tạo câu hỏi mới'}
        </h3>

        <form onSubmit={handleSubmit} className='mt-5 space-y-6'>
          <div>
            <label htmlFor='content' className='block text-sm font-medium text-gray-700'>
              Câu hỏi
            </label>
            <textarea
              id='content'
              name='content'
              rows={3}
              value={question.content}
              onChange={handleContentChange}
              className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
              placeholder='Nhập câu hỏi của bạn vào đây'
              required
            />
          </div>

          {/* Image upload section */}
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-2'>Hình ảnh cho câu hỏi</label>

            {imagePreview ? (
              <div className='relative mt-2 max-w-md'>
                <img
                  src={imagePreview}
                  alt='Hình ảnh câu hỏi'
                  className='max-w-full h-auto rounded-md border border-gray-300'
                />
                <button
                  type='button'
                  onClick={removeImage}
                  className='absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none'
                >
                  <X className='h-4 w-4' />
                </button>
              </div>
            ) : (
              <label className='flex justify-center items-center px-4 py-6 border-2 border-gray-300 border-dashed rounded-md cursor-pointer hover:bg-gray-50'>
                <div className='space-y-1 text-center'>
                  <Image className='mx-auto h-12 w-12 text-gray-400' />
                  <div className='flex text-sm text-gray-600'>
                    <span>Kéo thả ảnh vào đây hoặc</span>
                    <span className='relative ml-1 text-blue-600 hover:underline'>
                      chọn ảnh từ thiết bị
                      <input
                        type='file'
                        className='absolute inset-0 w-full h-full opacity-0 cursor-pointer'
                        accept='image/*'
                        onChange={handleImageSelect}
                        disabled={uploadingImage}
                      />
                    </span>
                  </div>
                  <p className='text-xs text-gray-500'>PNG, JPG, GIF lên đến 10MB</p>
                </div>
              </label>
            )}

            {uploadingImage && <div className='mt-2 text-sm text-blue-600'>Đang tải ảnh lên, vui lòng đợi...</div>}
          </div>

          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <label className='block text-sm font-medium text-gray-700'>Câu trả lời</label>
              <button
                type='button'
                onClick={addAnswer}
                className='inline-flex items-center p-1.5 border border-transparent rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              >
                <Plus className='h-4 w-4' aria-hidden='true' />
              </button>
            </div>

            {question.answers.map((answer: any, index: any) => (
              <div key={index} className='flex items-center space-x-3'>
                <div className='flex items-center h-5'>
                  <input
                    id={`correct-answer-${index}`}
                    name='correct-answer'
                    type='radio'
                    checked={question.correct_index === index}
                    onChange={() => handleCorrectAnswerChange(index)}
                    className='h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500'
                  />
                </div>
                <div className='flex-grow'>
                  <input
                    type='text'
                    value={answer}
                    onChange={(e) => handleAnswerChange(index, e.target.value)}
                    className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
                    placeholder={`Trả lời ${index + 1}`}
                    required
                  />
                </div>
                <button
                  type='button'
                  onClick={() => removeAnswer(index)}
                  className='p-1.5 border border-transparent rounded-full text-red-600 hover:text-red-800 focus:outline-none'
                >
                  <Trash2 className='h-4 w-4' aria-hidden='true' />
                </button>
              </div>
            ))}
            <p className='mt-2 text-sm text-gray-500'>Chọn nút radio bên cạnh câu trả lời đúng.</p>
          </div>

          <div className='flex justify-end space-x-3'>
            <button
              type='button'
              onClick={onCancel}
              className='inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            >
              Hủy bỏ
            </button>
            <button
              type='submit'
              className='inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            >
              {initialData ? 'Lưu thay đổi' : 'Tạo câu hỏi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default QuestionForm
