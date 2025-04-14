import { useNavigate } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'

const Unauthorized = () => {
  const navigate = useNavigate()

  return (
    <div className='min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8'>
      <div className='max-w-md w-full text-center'>
        <div className='mb-6 flex justify-center'>
          <AlertTriangle size={64} className='text-yellow-500' />
        </div>
        <h2 className='text-3xl font-bold text-gray-900 mb-4'>Unauthorized Access</h2>
        <p className='text-lg text-gray-700 mb-8'>
          You don't have permission to access this page. Please contact your administrator if you believe this is an
          error.
        </p>
        <div className='flex justify-center space-x-4'>
          <button
            onClick={() => navigate('/')}
            className='inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          >
            Go to Home
          </button>
          <button
            onClick={() => navigate(-1)}
            className='inline-flex items-center px-4 py-2 border border-gray-300 text-base font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}

export default Unauthorized
