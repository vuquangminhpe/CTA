import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { useContext, useEffect } from 'react'
import { AppContext } from '@/Contexts/app.context'

const Unauthorized = () => {
  const navigate = useNavigate()
  const profile = useContext(AppContext).profile
  useEffect(() => {
    if (profile?.role === 'teacher' || profile?.role === 'admin') {
      navigate('/teacher')
    }
    if (profile?.role === 'student') {
      navigate('/student')
    }
    if (profile?.role === 'admin') {
      navigate('/admin')
    }
  }, [profile?.role])
  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full text-center'>
        <div className='mb-6 flex justify-center'>
          <AlertTriangle size={64} className='text-yellow-500' />
        </div>
        <h2 className='text-3xl font-bold text-gray-900 mb-4'>Bước cần thiết để chúng tôi xác thực</h2>
        <p className='text-lg text-gray-700 mb-8'>
          Vui lòng bỏ qua trang này và click vào nút bên dưới để trở về trang chủ hoặc quay lại trang trước.
        </p>
        <div className='flex justify-center space-x-4'>
          <button
            onClick={() => navigate('/')}
            className='inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          >
            Quay về trang chủ
          </button>
          <button
            onClick={() => navigate(-1)}
            className='inline-flex items-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          >
            Quay lại
          </button>
        </div>
      </div>
    </div>
  )
}

export default Unauthorized
