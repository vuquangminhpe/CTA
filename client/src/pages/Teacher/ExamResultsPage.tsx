/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, BarChart, User, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import examApi from '../../apis/exam.api'
import ExamResults from '../../components/Teacher/ExamResults'

const ExamResultsPage = () => {
  const { examId } = useParams()
  const navigate = useNavigate()
  const [exam, setExam] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchExamDetails = async () => {
      if (!examId) return

      try {
        setIsLoading(true)
        // Fetch basic exam information
        const examsResponse = await examApi.getExams()
        const examsList = examsResponse.data.result
        const targetExam = examsList.find((e: any) => e._id === examId)

        if (targetExam) {
          setExam(targetExam)
        } else {
          toast.error('Exam not found')
        }
      } catch (error) {
        console.error('Error fetching exam details:', error)
        toast.error('Failed to load exam details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchExamDetails()
  }, [examId])

  const handleBack = () => {
    navigate('/teacher')
  }

  if (isLoading) {
    return (
      <div className='flex justify-center items-center min-h-screen bg-gray-100'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  if (!exam) {
    return (
      <div className='max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8'>
        <div className='bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center'>
          <AlertCircle className='h-12 w-12 text-red-500 mx-auto mb-4' />
          <h3 className='text-lg font-medium text-gray-900'>Exam Not Found</h3>
          <p className='mt-2 text-gray-500'>
            The exam you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <button
            onClick={handleBack}
            className='mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700'
          >
            <ArrowLeft className='mr-2 -ml-1 h-5 w-5' />
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className='max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8'>
      <div className='mb-8 flex items-center justify-between'>
        <div>
          <div className='flex items-center'>
            <button
              onClick={handleBack}
              className='mr-4 p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors'
            >
              <ArrowLeft className='h-5 w-5 text-gray-600' />
            </button>
            <h1 className='text-2xl font-bold text-gray-900'>{exam.title}</h1>
          </div>
          <div className='mt-1 flex items-center text-sm text-gray-500'>
            <FileText className='mr-1 h-4 w-4' />
            <span>Exam Code: {exam.exam_code}</span>
          </div>
        </div>

        <div className='flex items-center space-x-4'>
          <div className='flex items-center text-sm text-gray-500'>
            <User className='mr-1 h-4 w-4' />
            <span>Created: {new Date(exam.created_at).toLocaleDateString()}</span>
          </div>
          <div className='flex items-center text-sm text-gray-500'>
            <BarChart className='mr-1 h-4 w-4' />
            <span>Duration: {exam.duration} minutes</span>
          </div>
        </div>
      </div>

      <div className='bg-white shadow overflow-hidden sm:rounded-lg'>
        <div className='px-4 py-5 border-b border-gray-200 sm:px-6'>
          <h3 className='text-lg leading-6 font-medium text-gray-900'>Exam Results</h3>
          <p className='mt-1 max-w-2xl text-sm text-gray-500'>
            View student performances and statistics for this exam.
          </p>
        </div>
        <div className='px-4 py-5 sm:px-6'>
          <ExamResults selectedExamId={examId} />
        </div>
      </div>
    </div>
  )
}

export default ExamResultsPage
