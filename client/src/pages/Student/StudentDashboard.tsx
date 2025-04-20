/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import QRScanner from '../../components/Student/QRScanner'
import ExamHistory from '../../components/Student/ExamHistory'
import examApi from '../../apis/exam.api'
import { toast } from 'sonner'
import { QrCode, History, User } from 'lucide-react'
import { AuthContext } from '../../Contexts/auth.context'

const StudentDashboard = () => {
  const [examHistory, setExamHistory] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('scanner')
  const [scanLoading, setScanLoading] = useState(false)
  const [scanError, setScanError] = useState('')
  const { profile } = useContext(AuthContext) as any
  const navigate = useNavigate()
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
  useEffect(() => {
    if (activeTab === 'history') {
      fetchExamHistory()
    }
  }, [activeTab])

  const fetchExamHistory = async () => {
    try {
      setIsLoading(true)
      const response = await examApi.getExamHistory()
      setExamHistory(response.data.result as any)
    } catch (error) {
      console.error('Failed to fetch exam history:', error)
      toast.error('Failed to load exam history')
    } finally {
      setIsLoading(false)
    }
  }

  const handleScan = async (examCode: any) => {
    try {
      setScanError('')
      setScanLoading(true)
      toast.loading('Đang bắt đầu kỳ thi...')

      // Ghi log để debug
      console.log('QR Code scanned:', examCode)

      // Clean up exam code (remove whitespace, etc)
      const cleanedCode = examCode.trim()

      if (!cleanedCode) {
        throw new Error('Mã QR không hợp lệ hoặc trống')
      }

      // Kiểm tra độ dài mã QR
      if (cleanedCode.length < 3 || cleanedCode.length > 100) {
        throw new Error('Độ dài mã QR không hợp lệ')
      }

      await examApi.startExam({ exam_code: cleanedCode })

      toast.dismiss()
      toast.success('Bắt đầu kỳ thi thành công')

      // Lưu thông tin vào localStorage để khôi phục nếu cần
      try {
        localStorage.setItem('last_exam_code', cleanedCode)
        localStorage.setItem('last_exam_time', new Date().toISOString())
      } catch (e) {
        console.log('Could not save to localStorage', e)
      }

      // Chuyển hướng đến trang thi
      navigate(`/exam/${cleanedCode}`)
    } catch (error: any) {
      console.error('Error starting exam:', error)
      toast.dismiss()

      // Hiển thị thông báo lỗi chi tiết hơn
      const errorMessage = error.data?.message || 'Không thể bắt đầu kỳ thi. Vui lòng thử lại.'

      toast.error(errorMessage)
    } finally {
      setScanLoading(false)
    }
  }

  // Hàm xử lý trường hợp quét QR thủ công
  const handleManualCode = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.target as HTMLFormElement
    const codeInput = form.elements.namedItem('examCode') as HTMLInputElement

    if (codeInput && codeInput.value) {
      handleScan(codeInput.value)
    }
  }

  // Kiểm tra xem có kỳ thi gần đây không
  const [recentExam, setRecentExam] = useState<{ code: string; time: string } | null>(null)

  useEffect(() => {
    try {
      const lastCode = localStorage.getItem('last_exam_code')
      const lastTime = localStorage.getItem('last_exam_time')

      if (lastCode && lastTime) {
        const examTime = new Date(lastTime)
        const now = new Date()

        // Nếu kỳ thi bắt đầu trong vòng 3 giờ qua
        if (now.getTime() - examTime.getTime() < 3 * 60 * 60 * 1000) {
          setRecentExam({
            code: lastCode,
            time: examTime.toLocaleTimeString()
          })
        }
      }
    } catch (e) {
      console.log('Could not read from localStorage', e)
    }
  }, [])

  return (
    <div className='max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8'>
      <div className='pb-5 border-b border-gray-200 sm:flex sm:items-center sm:justify-between'>
        <h1 className='text-2xl font-bold text-gray-900'>Bảng điều khiển của học sinh</h1>
        {profile && (
          <div className='mt-3 flex items-center text-sm text-gray-600 sm:mt-0'>
            <User className='flex-shrink-0 mr-1.5 h-5 w-5 text-gray-500' />
            <p>
              Xin chào học sinh, <span className='font-medium text-gray-900'>{profile?.name || profile?.username}</span>
            </p>
          </div>
        )}
      </div>

      <div className='mt-6'>
        <div className='sm:hidden'>
          <label htmlFor='tabs' className='sr-only'>
            Chọn một tab
          </label>
          <select
            id='tabs'
            name='tabs'
            className='block w-full rounded-md border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
          >
            <option value='scanner'>Quét mã QR</option>
            <option value='history'>Lịch sử thi</option>
          </select>
        </div>
        <div className='hidden sm:block'>
          <div className='border-b border-gray-200'>
            <nav className='-mb-px flex space-x-8' aria-label='Tabs'>
              <button
                onClick={() => setActiveTab('scanner')}
                className={`${
                  activeTab === 'scanner'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <QrCode className='-ml-0.5 mr-2 h-5 w-5' />
                Quét mã QR
              </button>
              {/* <button
                onClick={() => setActiveTab('history')}
                className={`${
                  activeTab === 'history'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
              >
                <History className='-ml-0.5 mr-2 h-5 w-5' />
                Lịch sử thi
              </button> */}
            </nav>
          </div>
        </div>
      </div>

      <div className='mt-8 bg-white shadow overflow-hidden sm:rounded-lg'>
        <div className='px-4 py-5 sm:p-6'>
          {activeTab === 'scanner' ? (
            <>
              <h2 className='text-lg font-medium text-gray-900 mb-4'>Quét mã QR của kỳ thi</h2>

              <QRScanner onScan={handleScan} />

              <div className='mt-8 border-t border-gray-200 pt-4'>
                <h3 className='text-sm font-medium text-gray-700 mb-3'>Hoặc nhập mã kỳ thi thủ công:</h3>
                <form onSubmit={handleManualCode} className='flex items-center space-x-2'>
                  <input
                    type='text'
                    name='examCode'
                    placeholder='Nhập mã kỳ thi...'
                    className='block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                    disabled={scanLoading}
                  />
                  <button
                    type='submit'
                    disabled={scanLoading}
                    className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50'
                  >
                    Bắt đầu
                  </button>
                </form>

                {scanError && <div className='mt-2 text-sm text-red-600'>{scanError}</div>}
              </div>
            </>
          ) : (
            <>
              <h2 className='text-lg font-medium text-gray-900 mb-4'>Lịch sử thi của bạn</h2>
              <ExamHistory examSessions={examHistory} isLoading={isLoading} />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentDashboard
