/* eslint-disable @typescript-eslint/no-explicit-any */
import { AlertTriangle, X } from 'lucide-react'

const ViolationWarning = ({ count, onDismiss }: any) => {
  if (count <= 0) return null

  return (
    <div className='fixed bottom-4 right-4 bg-red-50 border border-red-200 p-4 rounded-lg shadow-lg z-50 max-w-md animate-bounce-once'>
      <div className='flex'>
        <div className='flex-shrink-0'>
          <AlertTriangle className='h-5 w-5 text-red-600' aria-hidden='true' />
        </div>
        <div className='ml-3 flex-1'>
          <h3 className='text-sm font-medium text-red-800'>Đã phát hiện vi phạm!</h3>
          <div className='mt-2 text-sm text-red-700'>
            <p>
              bạn có {count} lỗi vi phạm{count !== 1 ? '' : ''}. Không được phép rời khỏi tab thi hoặc mở cửa sổ mới và
              sẽ được ghi lại. Điểm của bạn có thể bị ảnh hưởng.
            </p>
          </div>
          <div className='mt-4'>
            <div className='-mx-2 -my-1.5 flex'>
              <button
                type='button'
                onClick={onDismiss}
                className='ml-auto bg-red-50 px-2 py-1.5 rounded-md text-sm font-medium text-red-800 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
              >
                <X className='h-5 w-5' />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ViolationWarning
