import React, { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode'

interface QRScannerProps {
  onScan: (examCode: string) => void
}

const QRScanner: React.FC<QRScannerProps> = ({ onScan }) => {
  const [isCameraOpen, setIsCameraOpen] = useState(false)
  const [error, setError] = useState('')
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  // Khởi tạo scanner khi mở camera
  useEffect(() => {
    if (!isCameraOpen) return

    const config = {
      fps: 10,
      qrbox: 250,
      supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
      rememberLastUsedCamera: true
    }

    scannerRef.current = new Html5QrcodeScanner('qr-scanner', config, false)

    const successHandler = (decodedText: string) => {
      try {
        const parsedData = JSON.parse(decodedText)
        if (parsedData.exam_code) {
          onScan(parsedData.exam_code)
          stopScanner()
        } else {
          setError('Invalid QR code format')
        }
      } catch (error) {
        setError('Could not parse QR code data: ' + error)
      }
    }

    const errorHandler = (err: string) => {
      console.error(err)
      setError('Error accessing camera')
    }

    scannerRef.current.render(successHandler, errorHandler)

    return () => stopScanner()
  }, [isCameraOpen])

  // Dừng scanner và clean up
  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(console.error)
      scannerRef.current = null
    }
    setIsCameraOpen(false)
  }

  return (
    <div className='max-w-md mx-auto'>
      {error && <div className='mb-4 p-3 bg-red-100 text-red-800 rounded-md text-sm'>{error}</div>}

      {isCameraOpen ? (
        <div className='space-y-4'>
          <div id='qr-scanner' className='rounded-lg overflow-hidden' />

          <div className='flex justify-center'>
            <button
              onClick={stopScanner}
              className='py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className='text-center'>
          <button
            onClick={() => setIsCameraOpen(true)}
            className='py-3 px-6 border border-transparent shadow-sm text-lg font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
          >
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
