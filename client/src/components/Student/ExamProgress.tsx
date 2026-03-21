/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'

interface ExamProgressProps {
  questions: Array<{ _id: React.Key | null | undefined }>
  answers: Record<string, number>
  currentQuestionIndex: number
  onNavigate: (index: number) => void
  showFinishStep?: boolean
  finishLabel?: string
}

const ExamProgress: React.FC<ExamProgressProps> = ({
  questions,
  answers,
  currentQuestionIndex,
  onNavigate,
  showFinishStep = false,
  finishLabel = 'Kết thúc'
}) => {
  const handleNavigate = (index: number) => {
    onNavigate(index)
  }

  return (
    <div className='bg-gray-50 rounded-lg p-4 mb-6 shadow-sm'>
      <h3 className='text-sm font-medium text-gray-700 mb-3'>Question Navigator</h3>
      <div className='grid grid-cols-10 gap-2'>
        {questions.map((question, index) => {
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

        {showFinishStep && (
          <button
            type='button'
            onClick={() => handleNavigate(questions.length)}
            className={`flex items-center justify-center p-2 rounded-md transition-colors min-w-[40px] text-sm font-medium ${
              currentQuestionIndex === questions.length
                ? 'bg-amber-500 text-white font-bold'
                : 'bg-amber-50 border border-amber-300 text-amber-700 hover:bg-amber-100'
            }`}
          >
            {finishLabel}
          </button>
        )}
      </div>
    </div>
  )
}

export default ExamProgress
