/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-ts-comment */
// Thêm component mới: MobileTabDetector.tsx

import React, { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

interface MobileTabDetectorProps {
  sessionId: string
  socket: any
  onViolation: () => void
  enabled?: boolean
}

/**
 * Component chuyên biệt để phát hiện chuyển tab trên thiết bị di động
 */
const MobileTabDetector: React.FC<MobileTabDetectorProps> = ({ sessionId, socket, onViolation, enabled = true }) => {
  const [isActive, setIsActive] = useState(true)
  const lastActiveTime = useRef(Date.now())
  const warningShownRef = useRef(false)
  const violationCountRef = useRef(0)
  const activeTimerRef = useRef<any>(null)
  const checkIntervalRef = useRef<any>(null)
  const lastVisibilityStateRef = useRef(document.visibilityState)
  const appStateRef = useRef<'active' | 'background' | 'blurred'>('active')
  const isFirstLoadRef = useRef(true)

  useEffect(() => {
    if (!enabled) return

    const DEBUG = false // Set to true to enable console logs

    const log = (...args: any[]) => {
      if (DEBUG) {
        console.log('[MobileTabDetector]', ...args)
      }
    }

    // Phát hiện chuyển tab qua sự kiện visibilitychange
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === 'visible'
      const now = Date.now()

      log(
        'Visibility changed:',
        document.visibilityState,
        'Previous:',
        lastVisibilityStateRef.current,
        'Time since last change:',
        now - lastActiveTime.current
      )

      // Bỏ qua sự kiện đầu tiên khi trang vừa load
      if (isFirstLoadRef.current) {
        isFirstLoadRef.current = false
        lastVisibilityStateRef.current = document.visibilityState
        return
      }

      // Nếu chuyển từ hiển thị sang ẩn -> đang rời khỏi tab
      if (!isVisible && lastVisibilityStateRef.current === 'visible') {
        appStateRef.current = 'background'
        setIsActive(false)

        // Ghi nhận thời điểm chuyển tab
        lastActiveTime.current = now

        // Báo cáo vi phạm nếu đang ở trong phiên thi
        if (socket && sessionId) {
          log('Báo cáo vi phạm: tab_switch')
          socket.emit('tab_switch', { session_id: sessionId })
          socket.emit('exam_violation', {
            session_id: sessionId,
            type: 'tab_switch',
            details: {
              timestamp: new Date().toISOString(),
              device_info: {
                userAgent: navigator.userAgent,
                platform: navigator.platform,
                isMobile: true
              }
            }
          })

          violationCountRef.current += 1
          onViolation()

          if (!warningShownRef.current) {
            toast.error('Không được phép chuyển sang ứng dụng khác trong khi làm bài!')
            warningShownRef.current = true
          }
        }
      }
      // Nếu chuyển từ ẩn sang hiển thị -> đang quay lại tab
      else if (isVisible && lastVisibilityStateRef.current === 'hidden') {
        appStateRef.current = 'active'
        setIsActive(true)

        // Nếu quay lại sau một khoảng thời gian dài (>10s), xem là vi phạm
        const timeAway = now - lastActiveTime.current
        if (timeAway > 10000) {
          // 10 giây
          log('Phát hiện thời gian vắng mặt dài:', timeAway)

          if (socket && sessionId) {
            socket.emit('exam_violation', {
              session_id: sessionId,
              type: 'extended_absence',
              details: {
                duration_ms: timeAway,
                timestamp: new Date().toISOString()
              }
            })

            violationCountRef.current += 1
            onViolation()

            toast.error(`Bạn đã rời khỏi bài thi trong ${Math.round(timeAway / 1000)} giây!`)
          }
        }

        // Reset cảnh báo sau khi quay lại
        setTimeout(() => {
          warningShownRef.current = false
        }, 5000)
      }

      // Cập nhật trạng thái visibility gần nhất
      lastVisibilityStateRef.current = document.visibilityState
    }

    // Xử lý sự kiện blur - khi người dùng chuyển sang cửa sổ/ứng dụng khác
    const handleBlur = () => {
      log('Window blur detected')
      appStateRef.current = 'blurred'
      setIsActive(false)

      const now = Date.now()
      lastActiveTime.current = now

      // Đối với thiết bị di động, blur có thể xảy ra khi chuyển ứng dụng
      if (socket && sessionId) {
        socket.emit('exam_violation', {
          session_id: sessionId,
          type: 'window_blur',
          details: {
            timestamp: new Date().toISOString()
          }
        })

        violationCountRef.current += 1
        onViolation()
      }
    }

    // Xử lý sự kiện focus - khi người dùng quay lại
    const handleFocus = () => {
      log('Window focus detected')
      appStateRef.current = 'active'
      setIsActive(true)

      const now = Date.now()
      const timeAway = now - lastActiveTime.current

      // Nếu quay lại sau thời gian dài, xem là vi phạm
      if (timeAway > 10000) {
        // 10 giây
        if (socket && sessionId) {
          socket.emit('exam_violation', {
            session_id: sessionId,
            type: 'extended_absence',
            details: {
              duration_ms: timeAway,
              timestamp: new Date().toISOString()
            }
          })

          violationCountRef.current += 1
          onViolation()
        }
      }
    }

    // Kỹ thuật phát hiện page lifecycle trên các trình duyệt di động
    const setupPageLifecycleDetection = () => {
      // Lắng nghe các sự kiện từ Page Lifecycle API
      document.addEventListener('freeze', () => {
        log('Page frozen - app going to background')
        appStateRef.current = 'background'

        if (socket && sessionId) {
          socket.emit('exam_violation', {
            session_id: sessionId,
            type: 'page_freeze',
            details: { timestamp: new Date().toISOString() }
          })

          violationCountRef.current += 1
          onViolation()
        }
      })

      document.addEventListener('resume', () => {
        log('Page resumed from frozen state')
        appStateRef.current = 'active'
      })

      // Safari specific
      // @ts-ignore
      document.addEventListener('webkitvisibilitychange', handleVisibilityChange)

      // Xử lý phiên bản Safari cũ
      // @ts-ignore
      if (typeof document.webkitHidden !== 'undefined') {
        log('Using webkit visibility API')
        // Override để có thể làm việc với Safari
        // @ts-ignore
        document.visibilityState = document.webkitHidden ? 'hidden' : 'visible'
      }
    }

    // Kỹ thuật heartbeat - kiểm tra liên tục xem ứng dụng có đang chạy
    const setupHeartbeatMonitoring = () => {
      let lastHeartbeatTime = Date.now()
      let missedHeartbeats = 0

      const expectedInterval = 1000 // 1 giây
      const heartbeatMargin = 500 // 0.5 giây dung sai

      const heartbeat = () => {
        const now = Date.now()
        lastHeartbeatTime = now
        missedHeartbeats = 0

        // Đăng ký heartbeat tiếp theo
        if (activeTimerRef.current) {
          clearTimeout(activeTimerRef.current)
        }
        activeTimerRef.current = setTimeout(heartbeat, expectedInterval)
      }

      // Khởi động heartbeat
      heartbeat()

      // Kiểm tra heartbeat mỗi 2 giây
      checkIntervalRef.current = setInterval(() => {
        const now = Date.now()
        const timeSinceLastHeartbeat = now - lastHeartbeatTime

        // Nếu thời gian từ lần cuối heartbeat lớn hơn dự kiến
        if (timeSinceLastHeartbeat > expectedInterval + heartbeatMargin) {
          missedHeartbeats += 1
          log('Missed heartbeat:', missedHeartbeats, 'Time since last:', timeSinceLastHeartbeat)

          // Nếu có nhiều hơn 2 heartbeat bị bỏ lỡ liên tiếp, có thể ứng dụng đã chuyển nền
          if (missedHeartbeats >= 2 && appStateRef.current === 'active') {
            log('Heartbeat indicates app went to background')
            appStateRef.current = 'background'

            if (socket && sessionId) {
              socket.emit('exam_violation', {
                session_id: sessionId,
                type: 'heartbeat_missed',
                details: {
                  missed_count: missedHeartbeats,
                  time_since_last_ms: timeSinceLastHeartbeat,
                  timestamp: new Date().toISOString()
                }
              })

              violationCountRef.current += 1
              onViolation()
            }
          }
        } else if (appStateRef.current === 'background') {
          // Ứng dụng có vẻ đã quay lại foreground
          appStateRef.current = 'active'
          log('Heartbeat indicates app is back to foreground')
        }
      }, 2000)
    }

    // Đăng ký tất cả các event listener
    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('blur', handleBlur)
    window.addEventListener('focus', handleFocus)

    // Thiết lập các kỹ thuật phát hiện nâng cao
    setupPageLifecycleDetection()
    setupHeartbeatMonitoring()

    // Mobile-specific: bắt sự kiện pagehide/pageshow
    window.addEventListener('pagehide', () => {
      log('Page hide event')
      if (socket && sessionId) {
        socket.emit('exam_violation', {
          session_id: sessionId,
          type: 'page_hide',
          details: { timestamp: new Date().toISOString() }
        })
      }
    })

    window.addEventListener('pageshow', (e) => {
      log('Page show event, persisted:', e.persisted)
      if (e.persisted && socket && sessionId) {
        // persisted=true nghĩa là trang đang được khôi phục từ bộ nhớ cache (bfcache)
        // Điều này thường xảy ra khi người dùng quay lại từ trang khác
        socket.emit('exam_violation', {
          session_id: sessionId,
          type: 'page_restored_from_cache',
          details: { timestamp: new Date().toISOString() }
        })
      }
    })

    // Mobile-specific: bắt sự kiện khi ứng dụng bị chuyển nền trên iOS Safari
    document.addEventListener('beforeunload', () => {
      log('Before unload event')
      if (socket && sessionId) {
        socket.emit('exam_violation', {
          session_id: sessionId,
          type: 'page_unload',
          details: { timestamp: new Date().toISOString() }
        })
      }
    })

    // Báo cáo định kỳ trạng thái hoạt động
    const activityInterval = setInterval(() => {
      if (socket && sessionId && socket.connected) {
        socket.emit('activity_ping', {
          session_id: sessionId,
          state: appStateRef.current,
          timestamp: new Date().toISOString()
        })
      }
    }, 30000)

    // Cleanup
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      // @ts-ignore
      document.removeEventListener('webkitvisibilitychange', handleVisibilityChange)
      window.removeEventListener('blur', handleBlur)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('pagehide', () => {})
      window.removeEventListener('pageshow', () => {})
      document.removeEventListener('beforeunload', () => {})

      if (activeTimerRef.current) {
        clearTimeout(activeTimerRef.current)
      }
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current)
      }
      clearInterval(activityInterval)
    }
  }, [enabled, sessionId, socket, onViolation])

  // Component này không render UI, chỉ xử lý logic
  return null
}

export default MobileTabDetector
