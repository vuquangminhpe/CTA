/* eslint-disable no-useless-escape */
import React, { useState } from 'react'
import { X, Loader } from 'lucide-react'
import { toast } from 'sonner'
import http from '../../utils/http'

interface AutoQuestionGeneratorProps {
  onGenerate: (formattedQuestions: string, correctAnswers: Record<number, number>) => void
  onCancel: () => void
  exam_id?: string
}

interface GeminiResponse {
  data: {
    result: {
      questions: Array<{
        id: number
        question_text: string
      }>
      answers: string[]
    }
  }
}

const AutoQuestionGenerator: React.FC<AutoQuestionGeneratorProps> = ({ onGenerate, onCancel, exam_id }) => {
  const [count, setCount] = useState(5)
  const [isLoading, setIsLoading] = useState(false)

  const handleGenerate = async () => {
    try {
      if (!exam_id && exam_id === '') {
        toast.error('Vui lòng chọn một bài kiểm tra để tạo câu hỏi.')
        return
      }
      setIsLoading(true)
      toast.loading('Đang tạo câu hỏi...')

      const response = await http.post<GeminiResponse>('/gemini/generate/text', {
        count: count
      })

      const { questions, answers } = response.data.data.result

      // Format questions into the expected text format
      const formattedQuestions = formatQuestionsForImport(questions)

      // Create a mapping of question index to correct answer index
      const correctAnswers = createCorrectAnswersMapping(answers)

      toast.dismiss()
      toast.success(`Đã tạo ${questions.length} câu hỏi thành công`)

      // Pass the formatted questions and correct answers back to parent
      onGenerate(formattedQuestions, correctAnswers)
    } catch (error) {
      toast.dismiss()
      console.error('Error generating questions:', error)
      toast.error('Không thể tạo câu hỏi. Vui lòng thử lại.')
    } finally {
      setIsLoading(false)
    }
  }

  // Format the questions from the API into the expected text format
  const formatQuestionsForImport = (questions: Array<{ id: number; question_text: string }>): string => {
    // Process each question to ensure it's in the correct format
    const formattedQuestions = questions.map((q) => {
      let formattedText = q.question_text

      // First, check if the response is already properly formatted
      // If the format is correct (has question with Câu/Question prefix and A./B./C./D. options)
      if (formattedText.match(/^(Câu|Question|[0-9]+)[\.\:]/) && formattedText.match(/[A-D][\.\:]/)) {
        // The question is already formatted correctly, but we need to ensure proper line breaks
        // Break the question into lines
        const lines = formattedText
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line)

        // The first line is the question
        let result = lines[0]

        // Process the answer options, ensuring they start with A., B., etc.
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i]
          // Check if this line starts with a letter option (A., B., etc.)
          if (line.match(/^[A-D][\.\:\)]/)) {
            result += '\n' + line
          } else {
            // This might be a continuation of the previous line
            result += ' ' + line
          }
        }

        return result
      } else {
        // The question isn't properly formatted, we need to extract and reformat it

        // Check if it contains answer options like "A. ", "B. ", etc.
        const hasOptions = /[A-D][\.\:\)]\s/.test(formattedText)

        if (hasOptions) {
          // Extract question text and answer options
          const optionsRegex = /([A-D])[\.\:\)]\s*(.*?)(?=\s*[A-D][\.\:\)]\s*|$)/gs
          const matches = Array.from(formattedText.matchAll(optionsRegex))

          // Extract the question part (everything before the first option)
          const firstOptionIndex = formattedText.search(/[A-D][\.\:\)]\s/)
          let questionPart = formattedText.substring(0, firstOptionIndex).trim()

          // Ensure question has the correct prefix
          if (
            !questionPart.toLowerCase().startsWith('câu') &&
            !questionPart.toLowerCase().startsWith('question') &&
            !questionPart.match(/^[0-9]+[\.\:]/)
          ) {
            questionPart = `Câu ${q.id}: ${questionPart}`
          }

          // Rebuild the formatted text
          let result = questionPart

          // Add each answer option
          matches.forEach((match) => {
            const letter = match[1]
            const content = match[2].trim()
            result += `\n${letter}. ${content}`
          })

          return result
        } else {
          // No answer options found - this is likely just a question without options
          // We'll need to add a placeholder and warn the user
          console.warn(`Question ${q.id} doesn't have proper answer options. Adding placeholders.`)

          // Ensure question has proper prefix
          if (
            !formattedText.toLowerCase().startsWith('câu') &&
            !formattedText.toLowerCase().startsWith('question') &&
            !formattedText.match(/^[0-9]+[\.\:]/)
          ) {
            formattedText = `Câu ${q.id}: ${formattedText}`
          }

          // Add placeholder options
          formattedText += '\nA. Option A\nB. Option B\nC. Option C\nD. Option D'

          return formattedText
        }
      }
    })

    // Join all questions with double newlines between them
    return formattedQuestions.join('\n\n')
  }

  // Create a mapping of question index to correct answer index (0-based)
  const createCorrectAnswersMapping = (answers: string[]): Record<number, number> => {
    const mapping: Record<number, number> = {}

    answers.forEach((answer, index) => {
      // Convert letter answer (A, B, C, D) to index (0, 1, 2, 3)
      let answerIndex = 0

      switch (answer) {
        case 'A':
          answerIndex = 0
          break
        case 'B':
          answerIndex = 1
          break
        case 'C':
          answerIndex = 2
          break
        case 'D':
          answerIndex = 3
          break
        default:
          // If answer is not A, B, C, D, fallback to the first option
          console.warn(`Unknown answer format: ${answer}, defaulting to A`)
          answerIndex = 0
      }

      mapping[index] = answerIndex
    })

    console.log('Mapped answers:', mapping)
    return mapping
  }

  return (
    <div className='bg-white shadow-lg rounded-lg overflow-hidden max-w-md mx-auto'>
      <div className='px-6 py-4 bg-blue-600 text-white flex justify-between items-center'>
        <h3 className='text-lg font-medium'>Tự động tạo câu hỏi</h3>
        <button onClick={onCancel} className='text-white hover:text-white/60 focus:outline-none'>
          <X className='h-5 w-5 text-black' />
        </button>
      </div>

      <div className='p-6'>
        <div className='space-y-4'>
          <div>
            <label htmlFor='count' className='block text-sm font-medium text-gray-700 mb-1'>
              Số lượng câu hỏi
            </label>
            <input
              type='number'
              id='count'
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value) || 5)}
              className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md'
            />
            <p className='mt-1 text-xs text-gray-500'>Số lượng câu hỏi tối đa là 20</p>
          </div>
        </div>

        <div className='mt-6 flex justify-end space-x-3'>
          <button
            type='button'
            onClick={onCancel}
            className='inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          >
            Hủy bỏ
          </button>
          <button
            type='button'
            onClick={handleGenerate}
            disabled={isLoading}
            className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
          >
            {isLoading ? (
              <>
                <Loader className='animate-spin -ml-1 mr-2 h-4 w-4' />
                Đang tạo...
              </>
            ) : (
              'Tạo câu hỏi'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AutoQuestionGenerator
