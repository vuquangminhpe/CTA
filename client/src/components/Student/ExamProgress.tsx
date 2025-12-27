/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { CheckCircle, Circle } from 'lucide-react'

const ExamProgress = ({ questions, answers, currentQuestionIndex, onNavigate }: any) => {
  const handleNavigate = (index: any) => {
    onNavigate(index)
  }

  return (
    <div className='bg-gray-50 rounded-lg p-4 mb-6 shadow-sm'>
      <h3 className='text-sm font-medium text-gray-700 mb-3'>Question Navigator</h3>
      <div className='grid grid-cols-10 gap-2'>
        {questions.map((question: { _id: React.Key | null | undefined }, index: number) => {
          const isAnswered = answers[question._id as any] !== undefined
          const isCurrent = index === currentQuestionIndex

          return (
            <button
              key={question._id}
              onClick={() => handleNavigate(index)}
              className={`flex items-center justify-center p-2 rounded-md transition-colors min-w-[40px] ${
                isCurrent
                  ? 'bg-blue-500 text-white font-bold'
                  : isAnswered
                    ? 'bg-green-500 text-white hover:bg-green-600'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className='text-sm font-medium'>{index + 1}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default ExamProgress
