/* eslint-disable @typescript-eslint/no-explicit-any */
import { Edit, Trash2, Check, BookOpen, Calendar } from 'lucide-react'

const QuestionList = ({ questions, onEdit, onDelete }: any) => {
  if (!questions || questions.length === 0) {
    return (
      <div className='text-center py-12 bg-white rounded-lg shadow'>
        <svg
          className='mx-auto h-12 w-12 text-gray-400'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
          xmlns='http://www.w3.org/2000/svg'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2'
          />
        </svg>
        <h3 className='mt-2 text-sm font-medium text-gray-900'>Không có câu hỏi</h3>
        <p className='mt-1 text-sm text-gray-500'>Bắt đầu bằng cách tạo một câu hỏi mới.</p>
      </div>
    )
  }

  return (
    <div className='bg-white shadow overflow-hidden sm:rounded-md'>
      <ul className='divide-y divide-gray-200'>
        {questions.map((question: any) => (
          <li key={question._id}>
            <div className='px-4 py-5 sm:px-6'>
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <div className='flex items-center text-xs text-gray-500 mb-2'>
                    <BookOpen className='h-3.5 w-3.5 text-blue-500 mr-1.5' />
                    <span className='font-medium text-gray-600'>Thuộc:</span>
                    <span className='ml-1 mr-2'>{question.exam_name || 'Chưa phân loại'}</span>

                    {question.exam_period && (
                      <>
                        <span className='h-1 w-1 rounded-full bg-gray-300 mx-2'></span>
                        <Calendar className='h-3.5 w-3.5 text-blue-500 mr-1.5' />
                        <span className='font-medium text-gray-600'>Mùa thi:</span>
                        <span className='ml-1 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full'>
                          {question.exam_period}
                        </span>
                      </>
                    )}
                  </div>
                  <div className='flex flex-col gap-2 mb-3'>
                    {question.content && (
                      <h4 className='text-lg font-medium text-gray-900 break-words'>{question.content}</h4>
                    )}

                    {question.questionLink && (
                      <div className='mt-2 max-w-full overflow-hidden'>
                        <img
                          src={question.questionLink}
                          alt='Hình ảnh câu hỏi'
                          className='object-contain h-auto max-h-[300px] max-w-full rounded-md border border-gray-200'
                          loading='lazy'
                        />
                      </div>
                    )}
                  </div>
                  <ul className='mt-3 space-y-2'>
                    {question.answers.map((answer: any, index: any) => (
                      <li key={index} className='flex items-start'>
                        <span
                          className={`inline-flex items-center justify-center mt-0.5 h-5 w-5 rounded-full flex-shrink-0 ${
                            question.correct_index === index
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {question.correct_index === index ? (
                            <Check className='h-3 w-3' />
                          ) : (
                            <span className='text-xs'>{index + 1}</span>
                          )}
                        </span>
                        <span className='ml-2 text-sm text-gray-700'>{answer}</span>
                        {question.correct_index === index && (
                          <span className='ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                            đáp án
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className='ml-4 flex-shrink-0 flex space-x-2'>
                  <button
                    onClick={() => onEdit(question)}
                    className='inline-flex items-center p-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  >
                    <Edit className='h-4 w-4' />
                  </button>
                  <button
                    onClick={() => onDelete(question._id)}
                    className='inline-flex items-center p-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                  >
                    <Trash2 className='h-4 w-4' />
                  </button>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default QuestionList
