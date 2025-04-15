/* eslint-disable @typescript-eslint/no-explicit-any */
import { ClipboardList, CheckCircle, Clock, XCircle } from 'lucide-react'
import { formatDistance } from 'date-fns'

const ExamHistory = ({ examSessions, isLoading }: any) => {
  if (isLoading) {
    return (
      <div className='flex justify-center items-center py-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  if (!examSessions || examSessions.length === 0) {
    return (
      <div className='py-8 text-center'>
        <ClipboardList className='mx-auto h-12 w-12 text-gray-400' />
        <h3 className='mt-2 text-sm font-medium text-gray-900'>Không có lịch sử thi</h3>
        <p className='mt-1 text-sm text-gray-500'>Bạn vẫn chưa tham gia kỳ thi nào.</p>
      </div>
    )
  }

  return (
    <div className='overflow-hidden bg-white shadow sm:rounded-md'>
      <ul className='divide-y divide-gray-200'>
        {examSessions.map((session: any) => (
          <li key={session._id}>
            <div className='px-4 py-4 sm:px-6'>
              <div className='flex items-center justify-between'>
                <p className='truncate text-sm font-medium text-blue-600'>{session.exam_title || 'Exam'}</p>
                <div className='ml-2 flex flex-shrink-0'>
                  {session.completed ? (
                    <p className='inline-flex rounded-full bg-green-100 px-2 text-xs font-semibold leading-5 text-green-800'>
                      <CheckCircle className='mr-1 h-4 w-4' />
                      Hoàn thành
                    </p>
                  ) : (
                    <p className='inline-flex rounded-full bg-yellow-100 px-2 text-xs font-semibold leading-5 text-yellow-800'>
                      <Clock className='mr-1 h-4 w-4' />
                      Đang tiến hành
                    </p>
                  )}
                </div>
              </div>
              <div className='mt-2 sm:flex sm:justify-between'>
                <div className='sm:flex'>
                  <p className='flex items-center text-sm text-gray-500'>
                    Điểm:{' '}
                    {session.completed ? (
                      <span className='ml-1 font-medium text-gray-900'>{session.score.toFixed(1)}%</span>
                    ) : (
                      <span className='ml-1 italic text-gray-500'>Pending</span>
                    )}
                  </p>
                  <p className='mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6'>
                    {session.violations > 0 && (
                      <span className='flex items-center text-red-500'>
                        <XCircle className='mr-1 h-4 w-4' />
                        {session.violations} lỗi vi phạm{session.violations !== 1 ? '' : ''}
                      </span>
                    )}
                  </p>
                </div>
                <div className='mt-2 flex items-center text-sm text-gray-500 sm:mt-0'>
                  <p>
                    {session.completed ? 'Completed' : 'Started'}{' '}
                    {formatDistance(new Date(session.created_at), new Date(), {
                      addSuffix: true
                    })}
                  </p>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default ExamHistory
