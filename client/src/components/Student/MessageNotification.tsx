/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useState } from 'react'
import { MessageSquare, XCircle } from 'lucide-react'

interface MessageNotificationProps {
  messages: any[]
  hasNew: boolean
  setHasNew: (hasNew: boolean) => void
}

const MessageNotification: React.FC<MessageNotificationProps> = ({ messages, hasNew, setHasNew }) => {
  const [showMessages, setShowMessages] = useState(false)

  // Automatically show messages when a new one arrives
  useEffect(() => {
    if (hasNew) {
      setShowMessages(true)
    }
  }, [hasNew])

  // Play notification sound when a new message arrives
  useEffect(() => {
    if (hasNew && messages.length > 0) {
      try {
        const audio = new Audio('/notification.mp3') // Base64 MP3 data
        audio.play().catch((e) => console.error('Could not play notification sound', e))
      } catch (error) {
        console.log('Audio notification not supported')
      }
    }
  }, [hasNew, messages.length])

  const toggleMessages = () => {
    setShowMessages(!showMessages)
    if (hasNew && showMessages) {
      setHasNew(false)
    }
  }

  if (!messages || messages.length === 0) {
    return null
  }

  return (
    <>
      {/* Teacher Messages button */}
      <div className='fixed top-4 left-24 z-50'>
        <button
          onClick={toggleMessages}
          className={`flex items-center rounded-md px-3 py-2 text-sm font-medium ${
            hasNew
              ? 'bg-blue-600 text-white animate-bounce shadow-lg border-2 border-blue-300'
              : showMessages
                ? 'bg-blue-100 text-blue-800'
                : 'bg-white text-gray-700 border border-gray-300'
          } shadow-sm hover:bg-blue-50`}
        >
          <MessageSquare className={`${hasNew ? 'h-5 w-5 mr-2' : 'h-4 w-4 mr-2'}`} />
          {hasNew ? (
            <span className='font-bold'>Tin nhắn mới! ({messages.length})</span>
          ) : (
            <span>Tin nhắn ({messages.length})</span>
          )}
        </button>
      </div>

      {/* Teacher Messages panel */}
      {showMessages && (
        <div className='fixed top-16 left-4 z-50 bg-white shadow-lg rounded-lg w-80 max-h-96 overflow-y-auto'>
          <div className='p-3 border-b border-gray-200 flex justify-between items-center'>
            <h3 className='font-medium text-gray-900'>Tin nhắn từ giáo viên</h3>
            <button onClick={toggleMessages} className='text-gray-400 hover:text-gray-500'>
              <XCircle className='h-4 w-4' />
            </button>
          </div>
          <div className='p-3'>
            <ul className='space-y-3'>
              {messages.map((msg, index) => (
                <li key={index} className='bg-blue-50 p-3 rounded-lg'>
                  <p className='text-sm text-gray-800'>{msg.message}</p>
                  <p className='text-xs text-gray-500 mt-1'>{new Date(msg.timestamp).toLocaleTimeString()}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Floating notification for new messages */}
      {hasNew && !showMessages && (
        <div className='fixed top-16 left-24 z-50 bg-blue-100 shadow-lg rounded-lg p-3 border-l-4 border-blue-500 max-w-xs animate-bounce'>
          <div className='flex'>
            <MessageSquare className='h-5 w-5 text-blue-500 mr-2' />
            <p className='text-sm text-blue-800'>Bạn có tin nhắn mới từ giáo viên! Nhấp vào nút "Tin nhắn" để xem.</p>
          </div>
        </div>
      )}
    </>
  )
}

export default MessageNotification
