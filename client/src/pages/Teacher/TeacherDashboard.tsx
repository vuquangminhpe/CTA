/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useContext } from 'react'
import { Tab } from '@headlessui/react'
import { Plus, HelpCircle, Book, QrCode } from 'lucide-react'
import QuestionForm from '../../components/Teacher/QuestionForm'
import QuestionList from '../../components/Teacher/QuestionList'
import ExamGenerator from '../../components/Teacher/ExamGenerator'
import QRCodeList from '../../components/Teacher/QRCodeList'
import questionApi from '../../apis/question.api'
import examApi from '../../apis/exam.api'
import { AuthContext } from '../../Contexts/auth.context'
import { toast } from 'sonner'

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

const TeacherDashboard = () => {
  const { profile } = useContext(AuthContext) as any

  // State
  const [questions, setQuestions] = useState<any>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<any>(null)
  const [qrCodes, setQrCodes] = useState<any>([])
  const [examTitle, setExamTitle] = useState<any>('')

  // Fetch questions on component mount
  useEffect(() => {
    fetchQuestions()
  }, [])

  const fetchQuestions = async () => {
    try {
      setIsLoading(true)
      const response = await questionApi.getQuestions()
      setQuestions(response.data.result as any)
    } catch (error) {
      console.error('Error fetching questions:', error)
      toast.error('Failed to load questions')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateQuestion = async (questionData: any) => {
    try {
      await questionApi.createQuestion(questionData)
      setIsFormOpen(false)
      toast.success('Question created successfully')
      fetchQuestions()
    } catch (error) {
      console.error('Error creating question:', error)
      toast.error('Failed to create question')
    }
  }

  const handleUpdateQuestion = async (questionData: any) => {
    try {
      await questionApi.updateQuestion(editingQuestion._id, questionData)
      setIsFormOpen(false)
      setEditingQuestion(null)
      toast.success('Question updated successfully')
      fetchQuestions()
    } catch (error) {
      console.error('Error updating question:', error)
      toast.error('Failed to update question')
    }
  }

  const handleDeleteQuestion = async (questionId: any) => {
    if (!window.confirm('Are you sure you want to delete this question?')) {
      return
    }

    try {
      await questionApi.deleteQuestion(questionId)
      toast.success('Question deleted successfully')
      fetchQuestions()
    } catch (error) {
      console.error('Error deleting question:', error)
      toast.error('Failed to delete question')
    }
  }

  const handleEditQuestion = (question: any) => {
    setEditingQuestion(question)
    setIsFormOpen(true)
  }

  const handleGenerateExam = async (formData: any) => {
    try {
      setQrCodes([])
      setExamTitle(formData.title)

      toast.loading('Generating QR codes...')

      const response = await examApi.generateExam(formData)
      const generatedQRCodes = response.data.result

      toast.dismiss()
      toast.success(`${generatedQRCodes.length} QR codes generated successfully`)

      setQrCodes(generatedQRCodes)
    } catch (error) {
      toast.dismiss()
      console.error('Error generating exam:', error)
      toast.error('Failed to generate QR codes')
    }
  }

  return (
    <div className='max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8'>
      <div className='sm:flex sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Teacher Dashboard</h1>
          <p className='mt-1 text-sm text-gray-500'>Manage your question bank and generate exams for your students</p>
        </div>
        {profile && (
          <div className='mt-4 flex items-center text-sm text-gray-500 sm:mt-0'>
            <p>
              Welcome, <span className='font-medium text-gray-900'>{profile.name || profile.username}</span>
            </p>
          </div>
        )}
      </div>

      <Tab.Group className='mt-8'>
        <Tab.List className='flex space-x-1 rounded-xl bg-blue-50/60 p-1'>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5 flex items-center justify-center',
                'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-white text-blue-700 shadow'
                  : 'text-blue-700/70 hover:bg-white/[0.12] hover:text-blue-700'
              )
            }
          >
            <Book className='w-5 h-5 mr-2' />
            Question Bank
          </Tab>
          <Tab
            className={({ selected }) =>
              classNames(
                'w-full rounded-lg py-2.5 text-sm font-medium leading-5 flex items-center justify-center',
                'ring-white/60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2',
                selected
                  ? 'bg-white text-blue-700 shadow'
                  : 'text-blue-700/70 hover:bg-white/[0.12] hover:text-blue-700'
              )
            }
          >
            <QrCode className='w-5 h-5 mr-2' />
            Generate Exams
          </Tab>
        </Tab.List>

        <Tab.Panels className='mt-4'>
          {/* Question Bank Panel */}
          <Tab.Panel className='rounded-xl bg-white p-4'>
            <div className='space-y-6'>
              <div className='flex justify-between items-center'>
                <h2 className='text-lg font-medium text-gray-900'>
                  {isFormOpen ? (editingQuestion ? 'Edit Question' : 'Create Question') : 'Question Bank'}
                </h2>
                {!isFormOpen && (
                  <button
                    onClick={() => {
                      setIsFormOpen(true)
                      setEditingQuestion(null)
                    }}
                    className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  >
                    <Plus className='mr-2 -ml-1 h-5 w-5' />
                    Add Question
                  </button>
                )}
              </div>

              {isFormOpen ? (
                <QuestionForm
                  onSubmit={editingQuestion ? handleUpdateQuestion : handleCreateQuestion}
                  initialData={editingQuestion}
                  onCancel={() => {
                    setIsFormOpen(false)
                    setEditingQuestion(null)
                  }}
                />
              ) : isLoading ? (
                <div className='py-8 text-center text-gray-500'>
                  <div className='inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600'></div>
                  <p className='mt-2'>Loading questions...</p>
                </div>
              ) : (
                <QuestionList questions={questions} onEdit={handleEditQuestion} onDelete={handleDeleteQuestion} />
              )}

              {!isFormOpen && questions.length > 0 && (
                <div className='pt-4 flex justify-between items-center border-t border-gray-200'>
                  <p className='text-sm text-gray-500'>
                    Total: {questions.length} question{questions.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}
            </div>
          </Tab.Panel>

          {/* Generate Exams Panel */}
          <Tab.Panel className='rounded-xl bg-white p-4'>
            <div className='space-y-6'>
              <div className='flex justify-between items-center'>
                <h2 className='text-lg font-medium text-gray-900'>Generate Exam QR Codes</h2>

                <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                  <HelpCircle className='mr-1 h-4 w-4' />
                  Each QR code creates a unique randomized exam
                </span>
              </div>

              <ExamGenerator onSubmit={handleGenerateExam} questionCount={questions.length} />

              {qrCodes.length > 0 && <QRCodeList qrCodes={qrCodes} examTitle={examTitle} />}
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  )
}

export default TeacherDashboard
