/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState, useRef } from 'react'
import { toast } from 'sonner'

interface RemoteAccessDetectorProps {
  sessionId: string
  socket: any
  onViolation: () => void
  enabled?: boolean
}

/**
 */
const RemoteAccessDetector: React.FC<RemoteAccessDetectorProps> = ({
  sessionId,
  socket,
  onViolation,
  enabled = true
}) => {
  const [isDetecting, setIsDetecting] = useState(false)
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const mouseMoveCountRef = useRef(0)
  const mousePositionsRef = useRef<{ x: number; y: number; time: number }[]>([])
  const keyPressTimestampsRef = useRef<number[]>([])
  const mouseClicksRef = useRef<{ x: number; y: number; time: number }[]>([])
  const lastScreenshotRef = useRef<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const focusChangesRef = useRef<{ focused: boolean; time: number }[]>([])

  // Tạo canvas ẩn để chụp ảnh màn hình (phát hiện thay đổi pixel)
  useEffect(() => {
    if (!enabled) return

    const canvas = document.createElement('canvas')
    canvas.width = 100 // Chỉ cần độ phân giải thấp để phát hiện thay đổi lớn
    canvas.height = 100
    canvas.style.display = 'none'
    document.body.appendChild(canvas)
    canvasRef.current = canvas

    return () => {
      if (document.body.contains(canvas)) {
        document.body.removeChild(canvas)
      }
    }
  }, [enabled])

  // Lắng nghe thông báo từ server
  useEffect(() => {
    if (!enabled || !socket) return

    const handleRemoteAccessDetected = (data: any) => {
      if (data.session_id === sessionId) {
        // Hiển thị cảnh báo cho học sinh
        toast.error('Phát hiện phần mềm điều khiển từ xa! Vi phạm nghiêm trọng này có thể dẫn đến đình chỉ bài thi.')

        // Hiển thị cảnh báo trực quan
        showVisualWarning(data.details)

        // Thông báo cho component cha
        onViolation()
      }
    }

    socket.on('remote_access_detected', handleRemoteAccessDetected)

    return () => {
      socket.off('remote_access_detected', handleRemoteAccessDetected)
    }
  }, [enabled, socket, sessionId, onViolation])

  // Theo dõi hành vi người dùng
  useEffect(() => {
    if (!enabled) return

    // Theo dõi di chuyển chuột
    const handleMouseMove = (e: MouseEvent) => {
      mouseMoveCountRef.current++

      // Lưu vị trí chuột với timestamp
      mousePositionsRef.current.push({
        x: e.clientX,
        y: e.clientY,
        time: performance.now()
      })

      // Giới hạn số lượng vị trí được lưu
      if (mousePositionsRef.current.length > 100) {
        mousePositionsRef.current = mousePositionsRef.current.slice(-100)
      }
    }

    // Theo dõi nhấn phím
    const handleKeyDown = (e: KeyboardEvent) => {
      keyPressTimestampsRef.current.push(performance.now())

      // Giới hạn số lượng timestamps được lưu
      if (keyPressTimestampsRef.current.length > 50) {
        keyPressTimestampsRef.current = keyPressTimestampsRef.current.slice(-50)
      }
    }

    // Theo dõi nhấp chuột
    const handleMouseClick = (e: MouseEvent) => {
      mouseClicksRef.current.push({
        x: e.clientX,
        y: e.clientY,
        time: performance.now()
      })

      // Giới hạn số lượng clicks được lưu
      if (mouseClicksRef.current.length > 30) {
        mouseClicksRef.current = mouseClicksRef.current.slice(-30)
      }
    }

    // Theo dõi trạng thái focus của cửa sổ
    const handleFocusChange = () => {
      focusChangesRef.current.push({
        focused: document.hasFocus(),
        time: performance.now()
      })

      // Giới hạn số lượng focus changes được lưu
      if (focusChangesRef.current.length > 20) {
        focusChangesRef.current = focusChangesRef.current.slice(-20)
      }
    }

    // Đăng ký các event listeners
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('click', handleMouseClick)
    window.addEventListener('focus', handleFocusChange)
    window.addEventListener('blur', handleFocusChange)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('click', handleMouseClick)
      window.removeEventListener('focus', handleFocusChange)
      window.removeEventListener('blur', handleFocusChange)
    }
  }, [enabled])

  // Thu thập và gửi dữ liệu hành vi định kỳ
  useEffect(() => {
    if (!enabled || !socket || !sessionId) return

    setIsDetecting(true)

    // Thu thập và gửi dữ liệu ngay lập tức
    collectAndSendData()

    // Sau đó thiết lập interval để thu thập và gửi định kỳ
    detectionIntervalRef.current = setInterval(collectAndSendData, 20000) // Kiểm tra mỗi 20 giây

    return () => {
      if (detectionIntervalRef.current) {
        clearInterval(detectionIntervalRef.current)
      }
      setIsDetecting(false)
    }
  }, [enabled, socket, sessionId])

  // Chụp ảnh màn hình (độ phân giải thấp) để phát hiện thay đổi
  const captureScreenSnapshot = () => {
    if (!canvasRef.current) return null

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return null

    try {
      // Chỉ vẽ một phần của trang web (đủ để phát hiện thay đổi lớn)
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Vẽ nhiều vùng khác nhau của trang
      const areas = [
        { sx: 0, sy: 0, sw: window.innerWidth / 2, sh: window.innerHeight / 2, dx: 0, dy: 0, dw: 50, dh: 50 },
        {
          sx: window.innerWidth / 2,
          sy: 0,
          sw: window.innerWidth / 2,
          sh: window.innerHeight / 2,
          dx: 50,
          dy: 0,
          dw: 50,
          dh: 50
        },
        {
          sx: 0,
          sy: window.innerHeight / 2,
          sw: window.innerWidth / 2,
          sh: window.innerHeight / 2,
          dx: 0,
          dy: 50,
          dw: 50,
          dh: 50
        },
        {
          sx: window.innerWidth / 2,
          sy: window.innerHeight / 2,
          sw: window.innerWidth / 2,
          sh: window.innerHeight / 2,
          dx: 50,
          dy: 50,
          dw: 50,
          dh: 50
        }
      ]

      // Sử dụng drawWindow nếu có thể (Firefox)
      // @ts-ignore
      if (ctx.drawWindow && window.content) {
        try {
          // @ts-ignore
          ctx.drawWindow(window.content, 0, 0, window.innerWidth, window.innerHeight, 'rgb(255,255,255)')
        } catch (e) {
          // Fallback
          areas.forEach((area) => {
            try {
              // Tạo một vùng ngẫu nhiên để phát hiện thay đổi
              ctx.fillStyle = `rgb(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255})`
              ctx.fillRect(area.dx, area.dy, area.dw, area.dh)
            } catch (e) {
              // Ignore errors
            }
          })
        }
      } else {
        // Backup method
        areas.forEach((area) => {
          try {
            // Tạo một vùng ngẫu nhiên để phát hiện thay đổi
            ctx.fillStyle = `rgb(${Math.random() * 255},${Math.random() * 255},${Math.random() * 255})`
            ctx.fillRect(area.dx, area.dy, area.dw, area.dh)
          } catch (e) {
            // Ignore errors
          }
        })
      }

      // Lấy dữ liệu canvas
      return canvas.toDataURL('image/jpeg', 0.1) // Chất lượng thấp để giữ kích thước nhỏ
    } catch (e) {
      console.error('Error capturing screen snapshot:', e)
      return null
    }
  }

  // Hàm phân tích mẫu di chuyển chuột để phát hiện điều khiển từ xa
  const analyzeMouseMovements = () => {
    const positions = mousePositionsRef.current
    if (positions.length < 10) return { suspicious: false, score: 0 }

    // Phân tích 1: Kiểm tra chuyển động chuột không tự nhiên
    // UltraView thường tạo ra chuyển động thẳng hoặc góc cạnh
    let unnaturalMovements = 0
    let straightLineSegments = 0

    for (let i = 2; i < positions.length; i++) {
      const p1 = positions[i - 2]
      const p2 = positions[i - 1]
      const p3 = positions[i]

      // Tính góc giữa hai đoạn vector
      const v1x = p2.x - p1.x
      const v1y = p2.y - p1.y
      const v2x = p3.x - p2.x
      const v2y = p3.y - p2.y

      // Tính độ cong (góc giữa hai vector)
      // Công thức: cos(theta) = (v1·v2)/(|v1|·|v2|)
      const dotProduct = v1x * v2x + v1y * v2y
      const v1Mag = Math.sqrt(v1x * v1x + v1y * v1y)
      const v2Mag = Math.sqrt(v2x * v2x + v2y * v2y)

      if (v1Mag > 0 && v2Mag > 0) {
        const cosTheta = dotProduct / (v1Mag * v2Mag)

        // Kiểm tra đường thẳng (cosine gần bằng 1)
        if (cosTheta > 0.98) {
          straightLineSegments++
        }

        // Kiểm tra góc vuông (cosine gần bằng 0)
        if (Math.abs(cosTheta) < 0.1) {
          unnaturalMovements++
        }
      }
    }

    // Phân tích 2: Tốc độ di chuyển khác thường
    let abnormalSpeeds = 0
    for (let i = 1; i < positions.length; i++) {
      const p1 = positions[i - 1]
      const p2 = positions[i]

      const distance = Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
      const timeMs = p2.time - p1.time

      if (timeMs > 0) {
        const speed = distance / timeMs

        // Tốc độ quá cao hoặc quá đều (không tự nhiên)
        if (speed > 5 || (speed > 0.5 && speed < 0.51)) {
          abnormalSpeeds++
        }
      }
    }

    // Tính tổng điểm đáng ngờ
    const straightLinesRatio = straightLineSegments / positions.length
    const unnaturalMovementsRatio = unnaturalMovements / positions.length
    const abnormalSpeedsRatio = abnormalSpeeds / positions.length

    let score = 0
    if (straightLinesRatio > 0.4) score += 30
    if (unnaturalMovementsRatio > 0.3) score += 25
    if (abnormalSpeedsRatio > 0.3) score += 25

    // Phân tích 3: Thời gian dừng bất thường
    let pauseCount = 0
    for (let i = 1; i < positions.length; i++) {
      const timeDiff = positions[i].time - positions[i - 1].time
      if (timeDiff > 300 && timeDiff < 500) {
        // Dừng 300-500ms (phổ biến trong điều khiển từ xa)
        pauseCount++
      }
    }

    if (pauseCount > 5) score += 20

    return {
      suspicious: score > 30,
      score,
      details: {
        straightLinesRatio,
        unnaturalMovementsRatio,
        abnormalSpeedsRatio,
        pauseCount
      }
    }
  }

  // Phân tích mẫu nhấn phím
  const analyzeKeyPresses = () => {
    const timestamps = keyPressTimestampsRef.current
    if (timestamps.length < 5) return { suspicious: false, score: 0 }

    let uniformIntervals = 0
    const intervalClusters: Record<string, number> = {}

    // Kiểm tra khoảng thời gian nhấn phím đều đặn (không tự nhiên)
    for (let i = 1; i < timestamps.length; i++) {
      const interval = timestamps[i] - timestamps[i - 1]

      // Làm tròn khoảng cách (thời gian) đến 10ms gần nhất
      const roundedInterval = Math.round(interval / 10) * 10

      // Đếm số lần xuất hiện của mỗi khoảng cách
      intervalClusters[roundedInterval] = (intervalClusters[roundedInterval] || 0) + 1

      // Nếu khoảng cách quá đều
      if (i > 1 && Math.abs(interval - (timestamps[i - 1] - timestamps[i - 2])) < 5) {
        uniformIntervals++
      }
    }

    // Tìm khoảng cách phổ biến nhất
    let maxCount = 0
    for (const interval in intervalClusters) {
      if (intervalClusters[interval] > maxCount) {
        maxCount = intervalClusters[interval]
      }
    }

    // Tính tỉ lệ của khoảng cách phổ biến nhất
    const dominantIntervalRatio = maxCount / (timestamps.length - 1)

    let score = 0

    // Nếu có nhiều khoảng cách đều đặn
    if (uniformIntervals / (timestamps.length - 2) > 0.5) {
      score += 30
    }

    // Nếu có một khoảng cách chiếm ưu thế
    if (dominantIntervalRatio > 0.6) {
      score += 30
    }

    return {
      suspicious: score > 20,
      score,
      details: {
        uniformIntervalsRatio: uniformIntervals / (timestamps.length - 2),
        dominantIntervalRatio
      }
    }
  }

  // Phát hiện sự thay đổi pixel bất thường
  const detectPixelChanges = () => {
    const currentSnapshot = captureScreenSnapshot()
    if (!currentSnapshot || !lastScreenshotRef.current) {
      lastScreenshotRef.current = currentSnapshot
      return { suspicious: false, score: 0 }
    }

    // So sánh với ảnh chụp trước đó
    const previousSnapshot = lastScreenshotRef.current

    // Cập nhật ảnh chụp mới nhất
    lastScreenshotRef.current = currentSnapshot

    // Nếu khác nhau hoàn toàn -> Có thể là do chuyển đổi màn hình đột ngột
    if (previousSnapshot !== currentSnapshot) {
      // Lưu ý: Đây là so sánh chuỗi đơn giản
      // Trong thực tế, bạn có thể muốn so sánh histogram hoặc phân tích chi tiết hơn

      return {
        suspicious: true,
        score: 40,
        details: {
          screenshotChanged: true
        }
      }
    }

    return { suspicious: false, score: 0 }
  }

  // Kiểm tra kết nối mạng
  const checkNetworkActivity = async () => {
    try {
      // Kiểm tra tốc độ kết nối
      // @ts-ignore
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection

      // Tạo dữ liệu kết nối mạng
      const networkData: any = {
        // Thông tin cơ bản
        online: navigator.onLine,
        userAgent: navigator.userAgent,
        platform: navigator.platform,

        // Thông tin connection nếu có
        connectionType: connection ? connection.type : null,
        effectiveType: connection ? connection.effectiveType : null,
        downlink: connection ? connection.downlink : null,
        rtt: connection ? connection.rtt : null,

        // Thêm timestamp
        timestamp: new Date().toISOString()
      }

      // Test kết nối đến các server phổ biến để phát hiện proxy
      const testUrls = [
        { url: 'https://www.google.com/favicon.ico', type: 'google' },
        { url: 'https://www.bing.com/favicon.ico', type: 'bing' }
      ]

      // Kiểm tra kết nối tới các địa chỉ phổ biến (để phát hiện độ trễ bất thường)
      const connectionTests = await Promise.all(
        testUrls.map(async (test) => {
          try {
            const startTime = performance.now()
            const response = await fetch(test.url, {
              method: 'HEAD',
              mode: 'no-cors',
              cache: 'no-cache'
            })
            const endTime = performance.now()

            return {
              type: test.type,
              latency: endTime - startTime,
              success: true
            }
          } catch (e) {
            return {
              type: test.type,
              latency: -1,
              success: false,
              error: String(e)
            }
          }
        })
      )

      // Thêm kết quả kiểm tra vào dữ liệu mạng
      networkData.connectionTests = connectionTests

      // Thu thập thông tin WebRTC
      try {
        networkData.webRTC = await getWebRTCInfo()
      } catch (e) {
        networkData.webRTCError = String(e)
      }

      // Phân tích dữ liệu mạng
      let score = 0
      const details: any = {}

      // 1. Kiểm tra độ trễ bất thường
      const latencies = connectionTests.filter((t) => t.success).map((t) => t.latency)
      if (latencies.length > 0) {
        const avgLatency = latencies.reduce((sum, val) => sum + val, 0) / latencies.length

        // Độ trễ cao có thể do điều khiển từ xa
        if (avgLatency > 500) {
          score += 20
          details.highLatency = avgLatency
        }

        // Độ trễ quá thấp cũng đáng ngờ (có thể do proxy cục bộ)
        if (avgLatency < 10) {
          score += 15
          details.suspiciouslyLowLatency = avgLatency
        }
      }

      // 2. Kiểm tra thông tin WebRTC
      if (networkData.webRTC) {
        // Nhiều địa chỉ IP cục bộ (>2) không bình thường
        if (networkData.webRTC.localIPs && networkData.webRTC.localIPs.length > 2) {
          score += 25
          details.multipleIPs = networkData.webRTC.localIPs
        }

        // Kiểm tra loại kết nối
        if (networkData.webRTC.connectionType === 'relay') {
          score += 30
          details.relayConnection = true
        }
      }

      // 3. Kiểm tra loại kết nối
      if (connection && connection.type) {
        // VPN và proxy thường sử dụng kết nối ảo
        if (['vpn', 'virtual', 'proxy'].some((t) => connection.type.toLowerCase().includes(t))) {
          score += 30
          details.suspiciousConnectionType = connection.type
        }
      }

      return {
        suspicious: score > 25,
        score,
        details,
        networkData
      }
    } catch (e) {
      console.error('Error checking network activity:', e)
      return { suspicious: false, score: 0 }
    }
  }

  // Kiểm tra độ trễ và đồng bộ hóa đồng hồ
  const checkTimingSynchronization = () => {
    // Lấy thời gian từ nhiều nguồn để phát hiện sự không đồng bộ
    const now = new Date()
    const performanceNow = performance.now()

    // Nếu chênh lệch quá lớn, có thể là do đồng hồ hệ thống bị điều chỉnh
    const dateNowMs = now.getTime()
    const performanceTimestamp = Math.floor(performance.timeOrigin + performanceNow)
    const timeDiff = Math.abs(dateNowMs - performanceTimestamp)

    let score = 0
    const details: any = {}

    // Chênh lệch > 5000ms là đáng ngờ (hiếm khi xảy ra trong các trường hợp thông thường)
    if (timeDiff > 5000) {
      score += 40
      details.clockDesync = timeDiff
    }

    // Kiểm tra độ trễ GPU
    // @ts-ignore
    if (window.chrome && window.chrome.gpuBenchmarking) {
      try {
        // @ts-ignore
        const gpuTimings = window.chrome.gpuBenchmarking.calcTimeDelta()
        if (gpuTimings > 50) {
          // Ngưỡng độ trễ bất thường
          score += 25
          details.highGpuLatency = gpuTimings
        }
      } catch (e) {
        // Ignore errors
      }
    }

    return {
      suspicious: score > 20,
      score,
      details
    }
  }

  // Phát hiện các API điều khiển từ xa phổ biến trong window
  const detectRemoteAccessAPIs = () => {
    const remoteAPISignatures = [
      'TeamViewer',
      'AnyDesk',
      'VNC',
      'UltraViewer',
      'RemoteDesktop',
      'ScreenSharing',
      'SharedWorker',
      'rtcPeerConnection',
      'webkitRTCPeerConnection',
      'mozRTCPeerConnection',
      'RTCDataChannel',
      'webrtc'
    ]

    const windowProperties = Object.getOwnPropertyNames(window)
    const documentProperties = Object.getOwnPropertyNames(document)
    const navigatorProperties = Object.getOwnPropertyNames(navigator)

    const detectedAPIs: string[] = []

    // Kiểm tra các thuộc tính window
    remoteAPISignatures.forEach((api) => {
      if (windowProperties.some((prop) => prop.toLowerCase().includes(api.toLowerCase()))) {
        detectedAPIs.push(`window.${api}`)
      }
    })

    // Kiểm tra các thuộc tính document
    remoteAPISignatures.forEach((api) => {
      if (documentProperties.some((prop) => prop.toLowerCase().includes(api.toLowerCase()))) {
        detectedAPIs.push(`document.${api}`)
      }
    })

    // Kiểm tra các thuộc tính navigator
    remoteAPISignatures.forEach((api) => {
      if (navigatorProperties.some((prop) => prop.toLowerCase().includes(api.toLowerCase()))) {
        detectedAPIs.push(`navigator.${api}`)
      }
    })

    // Kiểm tra extension API
    // @ts-ignore
    if (window.chrome && window.chrome.runtime) {
      detectedAPIs.push('chrome.runtime')
    }

    let score = 0
    if (detectedAPIs.length > 0) {
      score = 20 * detectedAPIs.length
    }

    // Kiểm tra hành vi điều khiển từ xa đặc biệt
    try {
      // UltraViewer thường thêm các phần tử ẩn vào DOM
      const hiddenElements = document.querySelectorAll('div[style*="position: absolute"][style*="z-index: 2147483647"]')

      if (hiddenElements.length > 0) {
        detectedAPIs.push('UltraViewer DOM elements')
        score += 50 // Mạnh mẽ hơn vì là bằng chứng rõ ràng
      }

      // Kiểm tra có nút ẩn được thêm vào để điều khiển từ xa không
      const suspiciousButtons = document.querySelectorAll(
        'button[style*="display: none"], input[type="button"][style*="visibility: hidden"]'
      )
      if (suspiciousButtons.length > 0) {
        detectedAPIs.push('Hidden control buttons')
        score += 40
      }
    } catch (e) {
      // Ignore errors
    }

    return {
      suspicious: score > 30,
      score,
      details: {
        detectedAPIs
      }
    }
  }

  // Phân tích nhịp độ nhấp chuột
  const analyzeMouseClicks = () => {
    const clicks = mouseClicksRef.current
    if (clicks.length < 5) return { suspicious: false, score: 0 }

    // Kiểm tra mẫu nhấp chuột bất thường
    let unnaturalClicks = 0

    // Kiểm tra khoảng cách thời gian giữa các lần nhấp
    for (let i = 1; i < clicks.length; i++) {
      const timeDiff = clicks[i].time - clicks[i - 1].time

      // Khoảng thời gian quá đều đặn là đáng ngờ
      if (i > 1) {
        const prevTimeDiff = clicks[i - 1].time - clicks[i - 2].time
        if (Math.abs(timeDiff - prevTimeDiff) < 10) {
          // Chênh lệch < 10ms
          unnaturalClicks++
        }
      }

      // Khoảng thời gian quá ngắn giữa các lần nhấp (< 100ms) là không tự nhiên
      if (timeDiff < 100) {
        unnaturalClicks++
      }
    }

    // Kiểm tra vị trí nhấp chuột
    let gridAlignedClicks = 0
    for (const click of clicks) {
      // UltraViewer thường tạo ra nhấp chuột theo lưới (grid)
      if (click.x % 5 === 0 || click.y % 5 === 0) {
        gridAlignedClicks++
      }
    }

    const unnaturalRatio = unnaturalClicks / (clicks.length - 1)
    const gridAlignedRatio = gridAlignedClicks / clicks.length

    let score = 0
    if (unnaturalRatio > 0.4) score += 30
    if (gridAlignedRatio > 0.6) score += 25

    return {
      suspicious: score > 20,
      score,
      details: {
        unnaturalRatio,
        gridAlignedRatio
      }
    }
  }

  // Phát hiện UltraViewer-cụ thể bằng cách tìm kiếm DOM đặc trưng
  const detectUltraViewer = () => {
    try {
      // UltraViewer thường tạo các phần tử cụ thể trong DOM
      // Tìm kiếm các phần tử div với z-index rất cao, thường được UltraViewer sử dụng
      const highZIndexElements = document.querySelectorAll('div[style*="z-index: 214748"]')

      // Kiểm tra các thuộc tính UltraViewer cụ thể trong cửa sổ
      // @ts-ignore
      const hasUVWindow = window.UVWindowObject || window.UVManager || window.UVViewer || window.UV

      // Kiểm tra các cookie UltraViewer
      const hasCookies = document.cookie.includes('UV_') || document.cookie.includes('UltraViewer')

      // Kiểm tra các phần tử mà UltraViewer thường chèn vào
      const controlElements = document.querySelectorAll(`
        div[class*="uv-"],
        div[id*="uv-"],
        div[class*="ultra"],
        div[id*="ultra"],
        iframe[src*="ultraviewer"],
        iframe[id*="uv-"]
      `)

      // Tìm các style sheet đáng ngờ
      const suspiciousStyles = Array.from(document.styleSheets).some((sheet) => {
        try {
          return (
            sheet.href &&
            (sheet.href.includes('ultraviewer') || sheet.href.includes('uv-') || sheet.href.includes('remote-access'))
          )
        } catch (e) {
          return false
        }
      })

      const details: any = {}
      let score = 0

      if (highZIndexElements.length > 0) {
        score += 40
        details.highZIndexElements = highZIndexElements.length
      }

      if (hasUVWindow) {
        score += 80 // Dấu hiệu rất mạnh
        details.uvWindowFound = true
      }

      if (hasCookies) {
        score += 50
        details.uvCookiesFound = true
      }

      if (controlElements.length > 0) {
        score += 60
        details.uvControlElementsFound = controlElements.length
      }

      if (suspiciousStyles) {
        score += 30
        details.suspiciousStylesFound = true
      }

      return {
        suspicious: score > 30,
        score,
        details
      }
    } catch (e) {
      console.error('Error in detectUltraViewer:', e)
      return { suspicious: false, score: 0 }
    }
  }

  // Hàm thu thập dữ liệu và gửi đến server
  const collectAndSendData = async () => {
    try {
      // Phân tích các mẫu hành vi
      const mouseAnalysis = analyzeMouseMovements()
      const keyPressAnalysis = analyzeKeyPresses()
      const pixelChanges = detectPixelChanges()
      const networkAnalysis = await checkNetworkActivity()
      const timingAnalysis = checkTimingSynchronization()
      const apiDetection = detectRemoteAccessAPIs()
      const mouseClickAnalysis = analyzeMouseClicks()
      const ultraViewerDetection = detectUltraViewer()

      // Tính tổng điểm đáng ngờ
      const totalScore =
        mouseAnalysis.score +
        keyPressAnalysis.score +
        pixelChanges.score +
        networkAnalysis.score +
        timingAnalysis.score +
        apiDetection.score +
        mouseClickAnalysis.score +
        ultraViewerDetection.score

      // Xác định mức độ nghi ngờ tổng thể
      const remoteAccessDetected = totalScore > 70 || ultraViewerDetection.score > 40

      // Thu thập dữ liệu hệ thống bổ sung
      const systemInfo = {
        screen: {
          width: window.screen.width,
          height: window.screen.height,
          availWidth: window.screen.availWidth,
          availHeight: window.screen.availHeight,
          colorDepth: window.screen.colorDepth
        },
        navigator: {
          userAgent: navigator.userAgent,
          language: navigator.language,
          languages: navigator.languages,
          platform: navigator.platform,
          vendor: navigator.vendor,
          maxTouchPoints: navigator.maxTouchPoints
        },
        plugins: Array.from(navigator.plugins).map((p) => ({
          name: p.name,
          filename: p.filename
        })),
        timestamp: new Date().toISOString(),
        focusHistory: focusChangesRef.current.slice(-10) // Lấy 10 lần thay đổi focus gần nhất
      }

      // Tổng hợp kết quả
      const behavioralData = {
        mouseMovements: mouseAnalysis,
        keyPresses: keyPressAnalysis,
        pixelChanges,
        network: networkAnalysis,
        timing: timingAnalysis,
        apiDetection,
        mouseClicks: mouseClickAnalysis,
        ultraViewerSpecific: ultraViewerDetection,
        totalScore,
        remoteAccessDetected,
        systemInfo
      }

      // Gửi đến server qua socket
      if (socket && socket.connected) {
        socket.emit('check_remote_access', {
          session_id: sessionId,
          data: behavioralData
        })
      }

      // Nếu phát hiện localy, thông báo ngay
      if (remoteAccessDetected) {
        // Cập nhật UI để hiển thị cảnh báo
        // (socket sẽ xử lý trên server và gửi thông báo chính thức sau)
        toast.error('Dấu hiệu phần mềm điều khiển từ xa được phát hiện!')

        // Hiển thị cảnh báo trực quan
        showVisualWarning({
          score: totalScore,
          details: `UltraViewer score: ${ultraViewerDetection.score}, 
                   Mouse patterns: ${mouseAnalysis.score}, 
                   API detection: ${apiDetection.score}`
        })

        // Thông báo cho component cha
        onViolation()
      }
    } catch (error) {
      console.error('Error collecting behavioral data:', error)
    }
  }

  // Hàm hiển thị cảnh báo hình ảnh
  const showVisualWarning = (details: any) => {
    // Tạo overlay cảnh báo
    const warningOverlay = document.createElement('div')
    warningOverlay.style.position = 'fixed'
    warningOverlay.style.top = '0'
    warningOverlay.style.left = '0'
    warningOverlay.style.width = '100%'
    warningOverlay.style.height = '100%'
    warningOverlay.style.backgroundColor = 'rgba(255, 0, 0, 0.9)'
    warningOverlay.style.color = 'white'
    warningOverlay.style.fontSize = '24px'
    warningOverlay.style.fontWeight = 'bold'
    warningOverlay.style.display = 'flex'
    warningOverlay.style.flexDirection = 'column'
    warningOverlay.style.alignItems = 'center'
    warningOverlay.style.justifyContent = 'center'
    warningOverlay.style.zIndex = '99999'
    warningOverlay.style.padding = '20px'
    warningOverlay.style.textAlign = 'center'

    warningOverlay.innerHTML = `
      <div>
        <div style="font-size: 32px; margin-bottom: 20px;">⚠️ CẢNH BÁO VI PHẠM NGHIÊM TRỌNG ⚠️</div>
        <div style="margin-bottom: 20px;">Phát hiện phần mềm điều khiển từ xa (UltraViewer hoặc tương tự)!</div>
        <div style="font-size: 18px; margin-bottom: 20px;">
          ${details.score ? `Mức độ vi phạm: ${details.score}/100` : ''}
          ${details.details ? `<br>${details.details}` : ''}
        </div>
        <div style="font-size: 16px;">Vi phạm này đã được ghi lại và có thể dẫn đến điểm 0 hoặc đình chỉ bài thi.</div>
      </div>
    `

    document.body.appendChild(warningOverlay)

    // Xóa overlay sau 10 giây
    setTimeout(() => {
      if (document.body.contains(warningOverlay)) {
        document.body.removeChild(warningOverlay)
      }
    }, 10000)
  }

  // Lấy thông tin từ WebRTC API
  const getWebRTCInfo = async (): Promise<any> => {
    return new Promise((resolve) => {
      const webRTCData: any = {
        localIPs: []
      }

      // Kiểm tra RTCPeerConnection có sẵn không
      if (!window.RTCPeerConnection) {
        resolve({ error: 'RTCPeerConnection not supported' })
        return
      }

      try {
        // Tạo RTCPeerConnection
        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        })

        // Timeout sau 5 giây nếu không có phản hồi
        const timeout = setTimeout(() => {
          if (pc && pc.signalingState !== 'closed') {
            pc.close()
            resolve(webRTCData)
          }
        }, 5000)

        // Lắng nghe các sự kiện ICE candidate
        pc.onicecandidate = (event) => {
          try {
            if (!event.candidate) return

            const candidate = event.candidate.candidate

            // Phân tích IPv4 từ candidate string
            const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3})/
            const match = ipRegex.exec(candidate)

            if (match && match[1]) {
              const ip = match[1]

              // Bỏ qua các địa chỉ riêng tư và đã biết
              if (ip.match(/^(10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/)) {
                webRTCData.hasPrivateIP = true
              }

              if (webRTCData.localIPs.indexOf(ip) === -1) {
                webRTCData.localIPs.push(ip)
              }
            }

            // Xác định loại kết nối
            if (candidate.indexOf('typ relay') !== -1) {
              webRTCData.connectionType = 'relay'
            } else if (candidate.indexOf('typ srflx') !== -1) {
              webRTCData.connectionType = 'reflexive'
            } else if (candidate.indexOf('typ host') !== -1) {
              webRTCData.connectionType = 'host'
            }
          } catch (e) {
            webRTCData.error = true
          }
        }

        // Tạo các kênh dữ liệu cần thiết để kích hoạt ICE gathering
        pc.createDataChannel('detector')

        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer))
          .catch((error) => {
            webRTCData.offerError = true
            clearTimeout(timeout)
            pc.close()
            resolve(webRTCData)
          })

        // Đóng kết nối sau 3 giây để thu thập thông tin
        setTimeout(() => {
          clearTimeout(timeout)
          if (pc && pc.signalingState !== 'closed') {
            pc.close()
            resolve(webRTCData)
          }
        }, 3000)
      } catch (e) {
        resolve({ error: 'Error creating RTCPeerConnection' })
      }
    })
  }

  // Component này không render UI
  return null
}

export default RemoteAccessDetector
