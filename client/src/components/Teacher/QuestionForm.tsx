/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'

const QuestionForm = ({ onSubmit, initialData = null, onCancel }: any) => {
  const [question, setQuestion] = useState({
    content: initialData?.content || '',
    answers: initialData?.answers || ['', ''],
    correct_index: initialData?.correct_index || 0
  })

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

  const handleSubmit = (e: any) => {
    e.preventDefault()

    // Validate
    if (!question.content.trim()) {
      alert('Please enter a question')
      return
    }

    if (question.answers.some((answer: any) => !answer.trim())) {
      alert('All answers must have content')
      return
    }

    onSubmit(question)
  }

  return (
    <div className='bg-white shadow sm:rounded-lg'>
      <div className='px-4 py-5 sm:p-6'>
        <h3 className='text-lg font-medium leading-6 text-gray-900'>
          {initialData ? 'Edit Question' : 'Create New Question'}
        </h3>

        <form onSubmit={handleSubmit} className='mt-5 space-y-6'>
          <div>
            <label htmlFor='content' className='block text-sm font-medium text-gray-700'>
              Question
            </label>
            <textarea
              id='content'
              name='content'
              rows={3}
              value={question.content}
              onChange={handleContentChange}
              className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm'
              placeholder='Enter your question here'
              required
            />
          </div>

          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <label className='block text-sm font-medium text-gray-700'>Answers</label>
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
                    placeholder={`Answer ${index + 1}`}
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
            <p className='mt-2 text-sm text-gray-500'>Select the radio button next to the correct answer.</p>
          </div>

          <div className='flex justify-end space-x-3'>
            <button
              type='button'
              onClick={onCancel}
              className='inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            >
              Cancel
            </button>
            <button
              type='submit'
              className='inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
            >
              {initialData ? 'Save Changes' : 'Create Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default QuestionForm
