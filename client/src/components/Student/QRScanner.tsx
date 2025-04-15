/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner, Html5QrcodeScanType, Html5Qrcode } from 'html5-qrcode'
import { Camera, XCircle } from 'lucide-react'

interface QRScannerProps {
  onScan: (examCode: string) => void
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan }) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [error, setError] = useState('')
  const [debug, setDebug] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [cameraId, setCameraId] = useState<string | null>(null)
  const [availableCameras, setAvailableCameras] = useState<{ id: string; label: string }[]>([])
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null)

  // Kiểm tra thiết bị và khởi tạo
  useEffect(() => {
    // Kiểm tra xem có phải thiết bị di động không
    const userAgent = navigator.userAgent.toLowerCase()
    const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
    setIsMobile(isMobileDevice)

    // Hiển thị thông tin debug
    setDebug(`Thiết bị: ${isMobileDevice ? 'Di động' : 'Máy tính'}, UA: ${userAgent.substring(0, 50)}...`)

    // Lấy danh sách camera
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setAvailableCameras(devices)
          setCameraId(devices[0].id)
          setDebug((prev) => `${prev}\nĐã tìm thấy ${devices.length} camera`)
        } else {
          setDebug((prev) => `${prev}\nKhông tìm thấy camera nào`)
        }
      })
      .catch((err) => {
        setDebug((prev) => `${prev}\nLỗi khi lấy danh sách camera: ${err}`)
      })
  }, [])

  // Khởi tạo scanner khi mở camera
  useEffect(() => {
    if (!isCameraOpen) return

    setDebug((prev) => `${prev}\nĐang khởi tạo camera...`)

    if (isMobile) {
      // Sử dụng cách tiếp cận đơn giản hơn cho thiết bị di động
      try {
        html5QrcodeRef.current = new Html5Qrcode('qr-reader')

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          formatsToSupport: [0] // Chỉ quét QR code để tăng tốc
        }

        // Chọn camera sau (thường là camera chính trên điện thoại)
        const preferredCamera = cameraId || 'environment'

        setDebug((prev) => `${prev}\nBắt đầu camera với ID: ${preferredCamera}`)

        html5QrcodeRef.current
          .start(
            { facingMode: 'environment' }, // Sử dụng facingMode cho thiết bị di động
            config,
            (decodedText) => {
              // Thành công
              console.log(`QR code detected: ${decodedText}`)
              setDebug((prev) => `${prev}\nĐã quét được: ${decodedText}`)
              try {
                // Cố gắng parse dưới dạng JSON
                try {
                  const parsedData = JSON.parse(decodedText)
                  if (parsedData.exam_code) {
                    stopScanner()
                    onScan(parsedData.exam_code)
                  } else {
                    setError('Định dạng mã QR không hợp lệ (JSON thiếu exam_code)')
                  }
                } catch (e: any) {
                  console.log(e)

                  // Nếu không phải JSON, thử sử dụng trực tiếp chuỗi
                  if (decodedText && typeof decodedText === 'string' && decodedText.length > 3) {
                    stopScanner()
                    onScan(decodedText)
                  } else {
                    setError(`Mã QR không hợp lệ: ${decodedText}`)
                  }
                }
              } catch (error: any) {
                setError(`Lỗi xử lý dữ liệu QR: ${error.message}`)
                setDebug((prev) => `${prev}\nLỗi: ${JSON.stringify(error)}`)
              }
            },
            (errorMessage) => {
              // Xử lý lỗi quét nhưng không dừng scanner
              console.log(`QR code scan error: ${errorMessage}`)
            }
          )
          .catch((err: any) => {
            setError(`Không thể khởi tạo camera: ${err.message || err}`)
            setDebug((prev) => `${prev}\nLỗi camera: ${JSON.stringify(err)}`)
          })
      } catch (err: any) {
        setError(`Lỗi khởi tạo QR scanner: ${err.message || err}`)
        setDebug((prev) => `${prev}\nLỗi: ${JSON.stringify(err)}`)
      }
    } else {
      // Phương pháp gốc cho máy tính desktop
      const config = {
        fps: 10,
        qrbox: 250,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        rememberLastUsedCamera: true
      }

      try {
        scannerRef.current = new Html5QrcodeScanner('qr-scanner', config, false)

        const successHandler = (decodedText: string) => {
          setDebug((prev) => `${prev}\nĐã quét được (desktop): ${decodedText}`)
          try {
            const parsedData = JSON.parse(decodedText)
            if (parsedData.exam_code) {
              onScan(parsedData.exam_code)
              stopScanner()
            } else {
              setError('Định dạng mã QR không hợp lệ')
            }
          } catch (error: any) {
            // Thử sử dụng trực tiếp nếu không phải JSON
            if (decodedText && typeof decodedText === 'string' && decodedText.length > 3) {
              stopScanner()
              onScan(decodedText)
            } else {
              setError(`Không thể parse dữ liệu mã QR: ${error.message}`)
            }
          }
        }

        const errorHandler = (err: string) => {
          console.error(err)
          setError('Lỗi truy cập camera')
        }

        scannerRef.current.render(successHandler, errorHandler)
      } catch (err: any) {
        setError(`Lỗi khởi tạo QR scanner: ${err.message || err}`)
        setDebug((prev) => `${prev}\nLỗi: ${JSON.stringify(err)}`)
      }
    }

    return () => stopScanner()
  }, [isCameraOpen, cameraId, isMobile])

  // Dừng scanner và clean up
  const stopScanner = () => {
    if (isMobile && html5QrcodeRef.current) {
      html5QrcodeRef.current.stop().catch((err) => {
        console.error('Lỗi khi dừng camera:', err)
      })
      html5QrcodeRef.current = null
    } else if (scannerRef.current) {
      scannerRef.current.clear().catch((err) => {
        console.error('Lỗi khi dừng camera:', err)
      })
      scannerRef.current = null
    }
    setIsCameraOpen(false)
  }

  return (
    <div className='max-w-md mx-auto'>
      {error && (
        <div className='mb-4 p-3 bg-red-100 text-red-800 rounded-md text-sm'>
          {error}
          <button onClick={() => setError('')} className='float-right text-red-700 hover:text-red-900'>
            <XCircle size={16} />
          </button>
        </div>
      )}

      {isCameraOpen ? (
        <div className='space-y-4'>
          {isMobile ? (
            <div id='qr-reader' className='overflow-hidden rounded-lg' style={{ width: '100%', maxWidth: '500px' }} />
          ) : (
            <div id='qr-scanner' className='rounded-lg overflow-hidden' />
          )}

          {availableCameras.length > 1 && (
            <div className='mt-2'>
              <label className='block text-sm font-medium text-gray-700 mb-1'>Chọn camera:</label>
              <select
                className='block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500'
                value={cameraId || ''}
                onChange={(e) => setCameraId(e.target.value)}
              >
                {availableCameras.map((camera) => (
                  <option key={camera.id} value={camera.id}>
                    {camera.label || `Camera ${camera.id}`}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className='flex justify-center'>
            <button
              onClick={stopScanner}
              className='py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
            >
              Hủy
            </button>
          </div>
        </div>
      ) : (
        <div className='text-center'>
          <button
            onClick={() => setIsCameraOpen(true)}
            className='py-3 px-6 border border-transparent shadow-sm text-lg font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          >
            <Camera className='inline-block mr-2' size={20} />
            Quét mã QR
          </button>

          <div className='mt-4 p-4 bg-gray-100 rounded-lg text-sm text-gray-700'>
            <p>Quét mã QR để bắt đầu kỳ thi. Đảm bảo bạn có đủ ánh sáng và giữ máy ảnh ổn định.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default QRScanner
