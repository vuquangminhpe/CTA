// client/src/Contexts/exam-session.context.tsx
import { createContext, useState, useEffect, useContext } from 'react'
import { toast } from 'sonner'
import { useNavigate } from 'react-router-dom'

interface ExamSessionState {
  activeSession: string | null
  markSessionActive: (sessionId: string) => void
  checkRefresh: (sessionId: string | undefined) => boolean
  isFirstLoad: boolean
  setIsFirstLoad: (value: boolean) => void
}

const initialExamSessionState: ExamSessionState = {
  activeSession: null,
  markSessionActive: () => {},
  checkRefresh: () => false,
  isFirstLoad: true,
  setIsFirstLoad: () => {}
}

export const ExamSessionContext = createContext<ExamSessionState>(initialExamSessionState)

export const ExamSessionProvider = ({ children }: { children: React.ReactNode }) => {
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  const navigate = useNavigate()

  // Đánh dấu một phiên thi đang hoạt động
  const markSessionActive = (sessionId: string) => {
    setActiveSession(sessionId)
    console.log('Phiên thi đã được đánh dấu: ', sessionId)
  }

  // Kiểm tra xem có phải trang bị làm mới không
  const checkRefresh = (sessionId: string | undefined): boolean => {
    // Bỏ qua lần load đầu tiên
    if (isFirstLoad) {
      return false
    }

    // Nếu có sessionId từ URL nhưng không có trong state
    // hoặc sessionId khác với sessionId đã lưu
    // => Trang đã bị làm mới
    if (sessionId && (!activeSession || sessionId !== activeSession)) {
      console.log('Phát hiện làm mới trang! Session trong URL:', sessionId, 'Session đã lưu:', activeSession)

      // Hiển thị thông báo vi phạm
      toast.error('Vi phạm nghiêm trọng! Phát hiện làm mới trang, bài thi sẽ bị nộp tự động.', {
        duration: 5000,
        position: 'top-center',
        style: {
          backgroundColor: '#FF0000',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '16px',
          padding: '20px'
        }
      })

      // Tạo overlay cảnh báo
      const overlay = document.createElement('div')
      overlay.style.position = 'fixed'
      overlay.style.top = '0'
      overlay.style.left = '0'
      overlay.style.width = '100%'
      overlay.style.height = '100%'
      overlay.style.backgroundColor = 'rgba(255, 0, 0, 0.9)'
      overlay.style.color = 'white'
      overlay.style.display = 'flex'
      overlay.style.flexDirection = 'column'
      overlay.style.alignItems = 'center'
      overlay.style.justifyContent = 'center'
      overlay.style.fontSize = '24px'
      overlay.style.fontWeight = 'bold'
      overlay.style.textAlign = 'center'
      overlay.style.zIndex = '999999'

      overlay.innerHTML = `
        <div>
          <p style="font-size: 32px; margin-bottom: 20px;">⚠️ VI PHẠM QUY CHẾ THI ⚠️</p>
          <p style="margin: 10px 0;">Bạn đã làm mới trang.</p>
          <p style="margin: 10px 0;">Bài thi của bạn đang được nộp tự động.</p>
        </div>
      `

      document.body.appendChild(overlay)

      // Sau 3 giây, chuyển hướng về trang chủ
      setTimeout(() => {
        navigate('/student', { replace: true })
      }, 3000)

      return true
    }

    return false
  }

  // Trong quá trình phát triển, React có thể gọi mount và unmount nhiều lần
  // Chúng ta sẽ giữ lại trạng thái activeSession trong một biến bên ngoài re-render
  useEffect(() => {
    // Đánh dấu rằng đã qua quá trình load đầu tiên
    setIsFirstLoad(false)

    return () => {
      // Trong trường hợp unmount bất ngờ, chúng ta vẫn giữ trạng thái
      console.log('Component unmounted, session state preserved')
    }
  }, [])

  return (
    <ExamSessionContext.Provider
      value={{
        activeSession,
        markSessionActive,
        checkRefresh,
        isFirstLoad,
        setIsFirstLoad
      }}
    >
      {children}
    </ExamSessionContext.Provider>
  )
}

// Hook tiện ích để sử dụng context này
export const useExamSession = () => {
  return useContext(ExamSessionContext)
}
