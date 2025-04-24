/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useContext } from 'react'
import { Tab } from '@headlessui/react'
import { Plus, HelpCircle, Book, QrCode, FileText, Eye, BookOpen } from 'lucide-react'
import QuestionForm from '../../components/Teacher/QuestionForm'
import QuestionList from '../../components/Teacher/QuestionList'
import ExamGenerator from '../../components/Teacher/ExamGenerator'
import QRCodeList from '../../components/Teacher/QRCodeList'
import BulkQuestionImport from '../../components/Teacher/BulkQuestionImport'
import questionApi from '../../apis/question.api'
import examApi from '../../apis/exam.api'
import { AuthContext } from '../../Contexts/auth.context'
import { toast } from 'sonner'
import ExamList from '../../components/Teacher/ExamList'
import { useNavigate } from 'react-router-dom'
import MasterExamForm from '../../components/Teacher/MasterExamForm'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { useMutation, useQuery } from '@tanstack/react-query'
function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

const TeacherDashboard = () => {
  const { profile } = useContext(AuthContext) as any
  const navigate = useNavigate()
  // State
  const [questions, setQuestions] = useState<any>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false)
  const [editingQuestion, setEditingQuestion] = useState<any>(null)
  const [qrCodes, setQrCodes] = useState<any>([])
  const [examTitle, setExamTitle] = useState<any>('')
  const [isMasterExamFormOpen, setIsMasterExamFormOpen] = useState(false)
  const [master_examId, setMasterExamId] = useState<string>('')

  useEffect(() => {
    // This condition determines when to refresh - modify as needed
    const shouldRefresh = localStorage.getItem('needsRefresh') === 'true'

    if (shouldRefresh) {
      // Clear the flag first to prevent infinite refresh
      localStorage.removeItem('needsRefresh')

      // Then reload the page
      window.location.reload()
    }
  }, [])
  // Fetch questions on component mount
  useEffect(() => {
    fetchQuestions()
  }, [])
  const { data: dataExams } = useQuery({
    queryKey: ['dataExams'],
    queryFn: () => examApi.getMasterExams()
  })
  const dataExam = dataExams?.data?.result || []

  const fetchQuestions = async () => {
    try {
      setIsLoading(true)
      const response = await questionApi.getQuestions(master_examId)
      setQuestions(response.data.result as any)
    } catch (error) {
      console.error('Error fetching questions:', error)
      toast.error('Failed to load questions')
    } finally {
      setIsLoading(false)
    }
  }

  const deleteAllQuestionMutation = useMutation({
    mutationFn: () => questionApi.delete_all_questions(),
    onSuccess: () => {
      toast.success('Xóa tất cả câu hỏi thành công')
      fetchQuestions()
    },
    onError: (error) => {
      console.error('Error deleting all questions:', error)
      toast.error('Failed to delete all questions')
    }
  })
  const handleCreateQuestion = async (questionData: any) => {
    try {
      await questionApi.createQuestion(questionData)
      setIsFormOpen(false)
      toast.success('Câu hỏi được tạo thành công')
      fetchQuestions()
    } catch (error) {
      if (!master_examId && master_examId === '') {
        toast.error('Vui lòng chọn kỳ thi trước khi tạo câu hỏi')
        return
      }
      console.error('Error creating question:', error)
      toast.error('Failed to create question')
    }
  }

  const handleUpdateQuestion = async (questionData: any) => {
    try {
      await questionApi.updateQuestion(editingQuestion._id, questionData)
      setIsFormOpen(false)
      setEditingQuestion(null)
      toast.success('Câu hỏi được cập nhật thành công')
      fetchQuestions()
    } catch (error) {
      console.error('Lỗi cập nhật câu hỏi:', error)
      toast.error('Không cập nhật được câu hỏi')
    }
  }
  const handleDeleteAllQuestions = async () => {
    deleteAllQuestionMutation.mutateAsync()
  }
  const handleDeleteQuestion = async (questionId: any) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này không?')) {
      return
    }

    try {
      await questionApi.deleteQuestion(questionId)
      toast.success('Đã xóa câu hỏi thành công')
      fetchQuestions()
    } catch (error) {
      console.error('Lỗi xóa câu hỏi:', error)
      toast.error('Không xóa được câu hỏi')
    }
  }

  const handleEditQuestion = (question: any) => {
    setEditingQuestion(question)
    setIsFormOpen(true)
  }

  const handleGenerateExam = async (formData: any) => {
    try {
      // Validate that start_time is in the future if provided
      if (formData.start_time && new Date(formData.start_time) <= new Date()) {
        toast.error('Thời gian bắt đầu phải ở tương lai')
        return
      }

      setQrCodes([])
      setExamTitle(formData.title)

      toast.loading('Tạo mã QR...')

      const response = await examApi.generateExam(formData)
      const generatedQRCodes = response.data.result

      toast.dismiss()
      toast.success(`${generatedQRCodes.length} mã QR đã được tạo thành công`)

      setQrCodes(generatedQRCodes)
    } catch (error: any) {
      toast.dismiss()
      console.error('Error generating exam:', error)
      toast.error(`${error?.data?.error?.message || 'Failed to generate exam'}`)
    }
  }

  const handleBulkImport = async (questions: any[]) => {
    try {
      // Create a loading toast
      toast.loading(`Bắt đầu tạo ${questions.length} câu hỏi...`)

      // Save all questions using Promise.all for parallel processing
      await Promise.all(questions.map((question) => questionApi.createQuestion(question)))

      // Close the bulk import dialog
      setIsBulkImportOpen(false)

      // Show success message and refresh question list
      toast.dismiss()
      toast.success(`Đã tạo thành công ${questions.length} câu hỏi`)
      fetchQuestions()
    } catch (error) {
      toast.dismiss()
      console.error('Error importing questions:', error)
      toast.error('Failed to import questions')
    }
  }

  const handleMasterExamSuccess = () => {
    setIsMasterExamFormOpen(false)
    toast.success('Kỳ thi chính được tạo thành công')
  }

  return (
    <div className='max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8'>
      <div className='sm:flex sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-bold text-gray-900'>Bảng điều khiển của giáo viên</h1>
          <p className='mt-1 text-sm text-gray-500'>
            Quản lý ngân hàng câu hỏi và tạo bài kiểm tra cho học sinh của bạn
          </p>
        </div>
        {profile && (
          <div className='mt-4 flex items-center text-sm text-gray-500 sm:mt-0'>
            <p>
              Xin chào giáo viên, <span className='font-medium text-gray-900'>{profile.name || profile.username}</span>
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
            Ngân hàng câu hỏi
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
            Tạo bài kiểm tra
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
            <FileText className='w-5 h-5 mr-2' />
            Danh sách bài thi
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
            <BookOpen className='w-5 h-5 mr-2' />
            Kỳ thi chính
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
            <div className='flex gap-3 items-center' onClick={() => navigate(`/teacher/monitoring`)}>
              <Eye className='w-5 h-5 mr-2' /> <div className='w-full'>Giám sát toàn cục</div>
            </div>
          </Tab>
        </Tab.List>

        <Tab.Panels className='mt-4'>
          {/* Question Bank Panel */}
          <Tab.Panel className='rounded-xl bg-white p-4'>
            {isBulkImportOpen ? (
              <BulkQuestionImport onSubmit={handleBulkImport} onCancel={() => setIsBulkImportOpen(false)} />
            ) : isFormOpen ? (
              <QuestionForm
                onSubmit={editingQuestion ? handleUpdateQuestion : handleCreateQuestion}
                initialData={editingQuestion}
                onCancel={() => {
                  setIsFormOpen(false)
                  setEditingQuestion(null)
                }}
              />
            ) : (
              <div className='space-y-6'>
                <div className='flex justify-between items-center'>
                  <h2 className='text-lg font-medium text-gray-900'>Ngân hàng câu hỏi</h2>
                  <div className='relative'>
                    <select
                      id='master_exam_id'
                      name='master_exam_id'
                      value={master_examId}
                      onChange={(e) => {
                        setMasterExamId(e.target.value)
                        fetchQuestions()
                      }}
                      className='block w-full pl-3 pr-10 py-2.5 text-base border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm transition-colors bg-white'
                    >
                      <option value=''>-- Chọn kỳ thi --</option>

                      {dataExam.map((exam: any) => (
                        <option key={exam._id} value={exam._id}>
                          {exam.name} {exam.exam_period ? `(${exam.exam_period})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className='flex space-x-3 w-full justify-end'>
                    <AlertDialog>
                      <AlertDialogTrigger className='bg-white border border-red-100'>
                        <div className='flex gap-3 items-center'>
                          <svg
                            xmlns='http://www.w3.org/2000/svg'
                            fill='none'
                            viewBox='0 0 24 24'
                            strokeWidth={1.5}
                            stroke='currentColor'
                            className='size-6 mr-2'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              d='m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m6 4.125 2.25 2.25m0 0 2.25 2.25M12 13.875l2.25-2.25M12 13.875l-2.25 2.25M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z'
                            />
                          </svg>
                          Xóa tất cả câu hỏi
                        </div>
                      </AlertDialogTrigger>

                      <AlertDialogContent className='bg-white w-full'>
                        <AlertDialogHeader className='bg-white text-black'>
                          <AlertDialogTitle>
                            Giáo viên chắc chắn về quyết định xóa toàn bộ câu hỏi mà mình đã tạo ?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Điều này sẽ khiến tất cả câu hỏi bị xóa và không thể khôi phục lại được. Bạn có chắc chắn
                            muốn tiếp tục không ?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter className='flex w-full'>
                          <AlertDialogCancel className='absolute left-5'>Không xóa</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteAllQuestions}
                            className='bg-red-500 text-white hover:bg-red-400 hover:text-black'
                          >
                            Tiếp tục xóa
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <button
                      onClick={() => setIsBulkImportOpen(true)}
                      className='inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    >
                      <FileText className='mr-2 -ml-1 h-5 w-5' />
                      Nhập số lượng lớn câu hỏi
                    </button>

                    <button
                      onClick={() => {
                        setIsFormOpen(true)
                        setEditingQuestion(null)
                      }}
                      className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    >
                      <Plus className='mr-2 -ml-1 h-5 w-5' />
                      thêm câu hỏi
                    </button>
                  </div>
                </div>

                {isLoading ? (
                  <div className='py-8 text-center text-gray-500'>
                    <div className='inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600'></div>
                    <p className='mt-2'>đang tải câu hỏi, vui lòng chờ vài giây...</p>
                  </div>
                ) : (
                  <QuestionList questions={questions} onEdit={handleEditQuestion} onDelete={handleDeleteQuestion} />
                )}

                {!isFormOpen && questions.length > 0 && (
                  <div className='pt-4 flex justify-between items-center border-t border-gray-200'>
                    <p className='text-sm text-gray-500'>
                      tổng số: {questions.length} câu hỏi{questions.length !== 1 ? '' : ''}
                    </p>
                  </div>
                )}
              </div>
            )}
          </Tab.Panel>

          {/* Generate Exams Panel */}
          <Tab.Panel className='rounded-xl bg-white p-4'>
            <div className='space-y-6'>
              <div className='flex justify-between items-center'>
                <h2 className='text-lg font-medium text-gray-900'>Tạo mã QR cho bài kiểm tra</h2>

                <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                  <HelpCircle className='mr-1 h-4 w-4' />
                  Mỗi mã QR tạo ra một kỳ thi ngẫu nhiên duy nhất
                </span>
              </div>

              <ExamGenerator
                master_examId={master_examId}
                setMasterExamId={setMasterExamId}
                fetchQuestions={fetchQuestions}
                onSubmit={handleGenerateExam}
                questionCount={questions.length}
              />

              {qrCodes.length > 0 && <QRCodeList qrCodes={qrCodes} examTitle={examTitle} />}
            </div>
          </Tab.Panel>

          {/* Exams List Panel */}
          <Tab.Panel className='rounded-xl bg-white p-4'>
            <ExamList />
          </Tab.Panel>

          {/* Master Exams Panel */}
          <Tab.Panel className='rounded-xl bg-white p-4'>
            <div className='space-y-6'>
              <div className='flex justify-between items-center'>
                <h2 className='text-lg font-medium text-gray-900'>Kỳ thi chính</h2>
                <div className='flex space-x-3'>
                  <button
                    onClick={() => setIsMasterExamFormOpen(true)}
                    className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  >
                    <Plus className='mr-2 -ml-1 h-5 w-5' />
                    Tạo kỳ thi chính mới
                  </button>
                  <button
                    onClick={() => navigate('/teacher/master-exams')}
                    className='inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                  >
                    <BookOpen className='mr-2 -ml-1 h-5 w-5' />
                    Xem tất cả kỳ thi
                  </button>
                </div>
              </div>

              {isMasterExamFormOpen ? (
                <MasterExamForm onSuccess={handleMasterExamSuccess} onCancel={() => setIsMasterExamFormOpen(false)} />
              ) : (
                <div className='text-center py-12 bg-gray-50 rounded-lg'>
                  <BookOpen className='mx-auto h-12 w-12 text-gray-400' />
                  <h3 className='mt-2 text-sm font-medium text-gray-900'>Quản lý kỳ thi chính</h3>
                  <p className='mt-1 text-sm text-gray-500'>
                    Kỳ thi chính giúp bạn nhóm các bài kiểm tra riêng lẻ theo học kỳ hoặc mục đích.
                  </p>
                  <div className='mt-6'>
                    <button
                      type='button'
                      onClick={() => navigate('/teacher/master-exams')}
                      className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                    >
                      Xem tất cả kỳ thi
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  )
}

export default TeacherDashboard
