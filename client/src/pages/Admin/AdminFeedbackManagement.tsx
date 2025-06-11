/* eslint-disable @typescript-eslint/no-explicit-any */
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import FeedbackManagement from '../../components/Admin/FeedbackManagement'

const AdminFeedbackManagement = () => {
  const navigate = useNavigate()

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30'>
      {/* Animated Background Elements */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse'></div>
        <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000'></div>
        <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse delay-500'></div>
      </div>

      <div className='relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-8 shadow-2xl shadow-blue-500/10'>
            <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between'>
              <div className='flex-1'>
                <div className='flex items-center mb-4'>
                  <button
                    onClick={() => navigate('/admin')}
                    className='mr-6 w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 hover:from-gray-200 hover:to-gray-300 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 shadow-lg'
                  >
                    <ArrowLeft className='h-6 w-6 text-gray-600' />
                  </button>
                  
                  <div>
                    <h1 className='text-4xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent'>
                      Quản lý Feedback
                    </h1>
                    <p className='text-xl text-gray-600 font-medium mt-1'>
                      Xem và phản hồi feedback từ giáo viên trong hệ thống
                    </p>
                  </div>
                </div>
              </div>

              <div className='mt-6 lg:mt-0 lg:ml-8'>
                <div className='flex flex-wrap gap-3'>
                  <button
                    onClick={() => navigate('/admin')}
                    className='inline-flex items-center px-6 py-3 bg-white/80 text-gray-700 border border-gray-200/50 rounded-2xl hover:bg-white hover:shadow-lg transition-all duration-300 font-semibold'
                  >
                    <ArrowLeft className='w-5 h-5 mr-2' />
                    Quay lại Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className='backdrop-blur-xl bg-white/50 border border-white/30 rounded-3xl p-6 shadow-xl'>
          <FeedbackManagement />
        </div>
      </div>
    </div>
  )
}

export default AdminFeedbackManagement
