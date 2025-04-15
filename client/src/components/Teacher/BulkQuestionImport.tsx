/* eslint-disable no-useless-escape */
import React, { useState, useEffect } from 'react'
import { FileText, Check, AlertTriangle, HelpCircle, X } from 'lucide-react'
import { toast } from 'sonner'

interface Question {
  content: string
  answers: string[]
  correct_index: number
}

interface BulkQuestionImportProps {
  onSubmit: (questions: Question[]) => void
  onCancel: () => void
}

const BulkQuestionImport: React.FC<BulkQuestionImportProps> = ({ onSubmit, onCancel }) => {
  const [rawText, setRawText] = useState('')
  const [parsedQuestions, setParsedQuestions] = useState<Question[]>([])
  const [isPreviewMode, setIsPreviewMode] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [selectedCorrectAnswers, setSelectedCorrectAnswers] = useState<Record<number, number>>({})

  // Parse the raw text into questions whenever it changes
  useEffect(() => {
    if (!rawText.trim()) {
      setParsedQuestions([])
      setParseError(null)
      return
    }

    try {
      const questions = parseQuestionsFromText(rawText)
      setParsedQuestions(questions)

      // Initialize selected correct answers
      const initialCorrectAnswers: Record<number, number> = {}
      questions.forEach((_, index) => {
        initialCorrectAnswers[index] = 0 // Default to first answer
      })
      setSelectedCorrectAnswers(initialCorrectAnswers)

      setParseError(null)
    } catch (error) {
      setParsedQuestions([])
      setParseError((error as Error).message)
    }
  }, [rawText])

  // Parse questions from formatted text
  const parseQuestionsFromText = (text: string): Question[] => {
    const questions: Question[] = []
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line)

    let currentQuestionIndex = -1
    let collectingAnswers = false

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]

      // Check for question
      if (
        line.toLowerCase().startsWith('câu') ||
        line.toLowerCase().startsWith('question') ||
        /^\d+[\.\:]\s/.test(line)
      ) {
        currentQuestionIndex++
        collectingAnswers = true
        questions[currentQuestionIndex] = {
          content: line.replace(/^(câu|question)\s*\d+[\.\:]?\s*/i, '').trim(),
          answers: [],
          correct_index: 0
        }

        // If the question content is empty, use the entire line
        if (!questions[currentQuestionIndex].content) {
          questions[currentQuestionIndex].content = line
        }

        continue
      }

      // Check for answer options
      if (collectingAnswers && /^[A-Ea-e][\.\)\:]/.test(line)) {
        const answerContent = line.replace(/^[A-Ea-e][\.\)\:]\s*/, '').trim()
        questions[currentQuestionIndex].answers.push(answerContent)
      }
    }

    // Validate questions
    for (let i = 0; i < questions.length; i++) {
      if (questions[i].answers.length < 2) {
        throw new Error(`Question ${i + 1} needs at least 2 answer options. Only found ${questions[i].answers.length}.`)
      }
    }

    if (questions.length === 0) {
      throw new Error('No valid questions found. Please check your format.')
    }

    return questions
  }

  // Handle correct answer selection
  const handleCorrectAnswerChange = (questionIndex: number, answerIndex: number) => {
    setSelectedCorrectAnswers((prev) => ({
      ...prev,
      [questionIndex]: answerIndex
    }))
  }

  // Handle submit
  const handleSubmit = () => {
    if (parsedQuestions.length === 0) {
      toast.error('No valid questions to import')
      return
    }

    // Apply correct answer selections
    const questionsWithCorrectAnswers = parsedQuestions.map((question, index) => ({
      ...question,
      correct_index: selectedCorrectAnswers[index] || 0
    }))

    onSubmit(questionsWithCorrectAnswers)
    toast.success(`${questionsWithCorrectAnswers.length} questions imported successfully`)
  }

  return (
    <div className='bg-white shadow-lg rounded-lg overflow-hidden max-w-4xl mx-auto'>
      <div className='px-6 py-4 bg-blue-600 text-white flex justify-between items-center'>
        <div className='flex items-center'>
          <FileText className='h-5 w-5 mr-2' />
          <h3 className='text-lg font-medium'>Bulk Question Import</h3>
        </div>
        <button onClick={onCancel} className='text-white hover:text-gray-200 focus:outline-none'>
          <X className='h-5 w-5' />
        </button>
      </div>

      <div className='p-6'>
        {!isPreviewMode ? (
          <>
            <div className='mb-4'>
              <div className='flex justify-between items-center mb-2'>
                <label htmlFor='questionText' className='block text-sm font-medium text-gray-700'>
                  Paste your questions below:
                </label>
                <button
                  type='button'
                  onClick={() => setRawText(getExampleText())}
                  className='text-sm text-blue-600 hover:text-blue-800 flex items-center'
                >
                  <HelpCircle className='h-4 w-4 mr-1' />
                  View example
                </button>
              </div>
              <textarea
                id='questionText'
                rows={15}
                className='shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md'
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                placeholder='Câu 1: What is the capital of France?&#10;A. Paris&#10;B. London&#10;C. Berlin&#10;D. Rome&#10;&#10;Câu 2: ...'
              />
            </div>

            {parseError && (
              <div className='mb-4 p-3 bg-red-50 border border-red-200 rounded-md'>
                <div className='flex'>
                  <AlertTriangle className='h-5 w-5 text-red-400 mr-2' />
                  <span className='text-sm text-red-700'>{parseError}</span>
                </div>
              </div>
            )}

            <div className='flex justify-between items-center'>
              <span className='text-sm text-gray-500'>
                Found {parsedQuestions.length} valid question{parsedQuestions.length !== 1 ? 's' : ''}
              </span>
              <div className='space-x-3'>
                <button
                  type='button'
                  onClick={onCancel}
                  className='inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                >
                  Cancel
                </button>
                <button
                  type='button'
                  onClick={() => setIsPreviewMode(true)}
                  disabled={parsedQuestions.length === 0}
                  className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Preview Questions
                </button>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className='mb-4'>
              <h4 className='text-lg font-medium text-gray-900 mb-2'>Select correct answers</h4>
              <p className='text-sm text-gray-500 mb-4'>
                Review each question and select the correct answer. By default, the first option (A) is selected.
              </p>

              <div className='space-y-6 max-h-[50vh] overflow-y-auto pr-2'>
                {parsedQuestions.map((question, questionIndex) => (
                  <div key={questionIndex} className='border border-gray-200 rounded-lg p-4 bg-gray-50'>
                    <h5 className='font-medium text-gray-900 mb-2'>
                      Question {questionIndex + 1}: {question.content}
                    </h5>
                    <div className='ml-4 space-y-2'>
                      {question.answers.map((answer, answerIndex) => (
                        <div key={answerIndex} className='flex items-center'>
                          <input
                            type='radio'
                            id={`q${questionIndex}-a${answerIndex}`}
                            name={`question-${questionIndex}`}
                            checked={selectedCorrectAnswers[questionIndex] === answerIndex}
                            onChange={() => handleCorrectAnswerChange(questionIndex, answerIndex)}
                            className='h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300'
                          />
                          <label
                            htmlFor={`q${questionIndex}-a${answerIndex}`}
                            className={`ml-2 block text-sm ${
                              selectedCorrectAnswers[questionIndex] === answerIndex
                                ? 'font-medium text-blue-700'
                                : 'text-gray-700'
                            }`}
                          >
                            {String.fromCharCode(65 + answerIndex)}. {answer}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className='flex justify-between items-center'>
              <button
                type='button'
                onClick={() => setIsPreviewMode(false)}
                className='inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              >
                Back to Edit
              </button>
              <button
                type='button'
                onClick={handleSubmit}
                className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
              >
                <Check className='h-4 w-4 mr-1' />
                Import Questions
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// Helper function to get example text
const getExampleText = () => {
  return `Câu 1: What is the capital of France?
A. Paris
B. London
C. Berlin
D. Rome

Câu 2: Which of the following is NOT a programming language?
A. Python
B. Java
C. Windows
D. JavaScript

Question 3: What is the largest planet in our solar system?
A. Earth
B. Mars
C. Jupiter
D. Venus

4. Who wrote "Romeo and Juliet"?
A. Charles Dickens
B. William Shakespeare
C. Jane Austen
D. Mark Twain`
}

export default BulkQuestionImport
