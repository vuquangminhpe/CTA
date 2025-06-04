/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect } from 'react'
import { Camera, Check, X, AlertTriangle, RefreshCw, User, Loader } from 'lucide-react'
import { toast } from 'sonner'
import faceVerificationApi from '@/apis/faceVerification.api'

interface FaceVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  onSkip?: () => void
  examCode: string
}

const FaceVerificationModal: React.FC<FaceVerificationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onSkip,
  examCode
}) => {
  const [step, setStep] = useState<'camera_check' | 'capture' | 'verify' | 'result'>('camera_check')
  const [hasCamera, setHasCamera] = useState<boolean | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string>('')

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Check camera availability when modal opens
  useEffect(() => {
    if (isOpen) {
      checkCameraAvailability()
    }
  }, [isOpen])

  // Cleanup stream when modal closes
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [stream])

  const checkCameraAvailability = async () => {
    try {
      console.log('🔍 Checking camera availability...')

      // Check if camera APIs are available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCamera(false)
        setCameraError('Camera API không được hỗ trợ trên trình duyệt này')
        return
      }

      // Try to get camera stream
      const testStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user' // Front camera
        }
      })

      console.log('✅ Camera access granted')
      setHasCamera(true)

      // Stop test stream immediately
      testStream.getTracks().forEach((track) => track.stop())

      // Move to capture step
      setStep('capture')
    } catch (error: any) {
      console.error('❌ Camera access failed:', error)
      setHasCamera(false)

      if (error.name === 'NotAllowedError') {
        setCameraError('Bạn cần cho phép truy cập camera để xác thực khuôn mặt')
      } else if (error.name === 'NotFoundError') {
        setCameraError('Không tìm thấy camera trên thiết bị này')
      } else {
        setCameraError('Không thể truy cập camera. Vui lòng kiểm tra lại thiết bị.')
      }
    }
  }
  useEffect(() => {
    if (step === 'capture' && hasCamera === true) {
      startCamera()
    }
  }, [step, hasCamera])
  const startCamera = async () => {
    try {
      console.log('🎥 Starting camera...')

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      })

      setStream(newStream)

      if (videoRef.current) {
        videoRef.current.srcObject = newStream

        // Wait for video to be ready
        videoRef.current.addEventListener('loadedmetadata', () => {
          console.log('📹 Video metadata loaded')
          if (videoRef.current) {
            videoRef.current.play().catch(console.error)
          }
        })
      }
    } catch (error: any) {
      console.error('Failed to start camera:', error)
      toast.error('Không thể khởi động camera')

      // Set error state
      setHasCamera(false)
      if (error.name === 'NotAllowedError') {
        setCameraError('Bạn cần cho phép truy cập camera để xác thực khuôn mặt')
      } else {
        setCameraError('Không thể khởi động camera')
      }
      setStep('camera_check')
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    setIsCapturing(true)

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    // Set canvas size to video size
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    // Draw video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Get image data as base64
    const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8)
    setCapturedImage(imageDataUrl)

    // Stop camera stream
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }

    setIsCapturing(false)
    setStep('verify')
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    setStep('capture')
  }

  const verifyFace = async () => {
    if (!capturedImage) return

    setIsVerifying(true)

    try {
      // Convert base64 to blob
      const response = await fetch(capturedImage)
      const blob = await response.blob()

      // Create file object
      const file = new File([blob], 'face_capture.jpg', { type: 'image/jpeg' })

      // Call face verification API using our API service
      const result = await faceVerificationApi.verifyFaceForExam(file)

      if (result.data.result?.verified) {
        setVerificationResult({
          success: true,
          similarity: result.data.result.similarity,
          confidence: result.data.result.confidence
        })

        toast.success('Xác thực khuôn mặt thành công!')

        // Wait a moment then call success
        setTimeout(() => {
          onSuccess()
        }, 1500)
      } else {
        setVerificationResult({
          success: false,
          message: 'Xác thực khuôn mặt thất bại'
        })

        toast.error('Xác thực khuôn mặt thất bại')
      }

      setStep('result')
    } catch (error: any) {
      console.error('Face verification failed:', error)

      const errorMessage = error.response?.data?.message || error.message

      if (errorMessage?.includes('No stored face embedding') || errorMessage?.includes('No face profile found')) {
        setVerificationResult({
          success: false,
          message: 'Bạn chưa đăng ký khuôn mặt. Vui lòng đăng ký trong phần hồ sơ cá nhân.'
        })
      } else {
        setVerificationResult({
          success: false,
          message: errorMessage || 'Có lỗi xảy ra khi xác thực khuôn mặt'
        })
      }

      setStep('result')
      toast.error('Xác thực khuôn mặt thất bại')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleSkip = () => {
    if (onSkip) {
      onSkip()
    } else {
      onSuccess() // Fallback to success if no skip handler
    }
  }

  if (!isOpen) return null

  return (
    <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'>
      <div className='bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto'>
        {/* Header */}
        <div className='p-6 border-b border-gray-200'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center'>
              <User className='h-6 w-6 text-blue-600 mr-2' />
              <h3 className='text-lg font-medium text-gray-900'>Xác thực khuôn mặt</h3>
            </div>
            <button onClick={onClose} className='text-gray-400 hover:text-gray-500'>
              <X className='h-6 w-6' />
            </button>
          </div>
          <p className='mt-2 text-sm text-gray-600'>
            Mã thi: <span className='font-medium'>{examCode}</span>
          </p>
        </div>

        {/* Content */}
        <div className='p-6'>
          {/* Camera Check Step */}
          {step === 'camera_check' && (
            <div className='text-center'>
              <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4'>
                <Camera className='h-6 w-6 text-blue-600' />
              </div>
              <h4 className='text-lg font-medium text-gray-900 mb-2'>Đang kiểm tra camera...</h4>
              <p className='text-sm text-gray-600 mb-4'>Vui lòng cho phép truy cập camera để tiếp tục</p>

              {hasCamera === false && (
                <div className='bg-red-50 border border-red-200 rounded-md p-4 mb-4'>
                  <div className='flex'>
                    <AlertTriangle className='h-5 w-5 text-red-400 mr-2' />
                    <div className='text-sm text-red-700'>
                      <p className='font-medium'>Không thể truy cập camera</p>
                      <p>{cameraError}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className='flex space-x-3 justify-center'>
                <button
                  onClick={checkCameraAvailability}
                  className='inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50'
                >
                  <RefreshCw className='h-4 w-4 mr-2' />
                  Thử lại
                </button>
                {onSkip && (
                  <button
                    onClick={handleSkip}
                    className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700'
                  >
                    Bỏ qua
                  </button>
                )}
              </div>
            </div>
          )}

          {step === 'capture' && (
            <div className='text-center'>
              <h4 className='text-lg font-medium text-gray-900 mb-4'>Chụp ảnh khuôn mặt</h4>

              <div className='relative mb-4'>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline // Thêm attribute này cho mobile
                  className='w-full max-w-sm mx-auto rounded-lg border shadow-sm'
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                {/* Overlay guide */}
                <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
                  <div className='border-2 border-blue-500 border-dashed rounded-full w-48 h-48 opacity-50' />
                </div>

                {/* Loading overlay khi chưa có stream */}
                {!stream && (
                  <div className='absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg'>
                    <div className='text-center'>
                      <Loader className='h-8 w-8 animate-spin mx-auto mb-2 text-blue-600' />
                      <p className='text-sm text-gray-600'>Đang khởi động camera...</p>
                    </div>
                  </div>
                )}
              </div>

              <p className='text-sm text-gray-600 mb-4'>
                Đảm bảo khuôn mặt của bạn nằm trong khung và được chiếu sáng đầy đủ
              </p>

              <div className='flex space-x-3 justify-center'>
                <button
                  onClick={onClose}
                  className='inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50'
                >
                  Hủy
                </button>
                <button
                  onClick={capturePhoto}
                  disabled={isCapturing || !stream}
                  className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50'
                >
                  <Camera className='h-4 w-4 mr-2' />
                  {isCapturing ? 'Đang chụp...' : 'Chụp ảnh'}
                </button>
              </div>
            </div>
          )}

          {/* Verify Step */}
          {step === 'verify' && (
            <div className='text-center'>
              <h4 className='text-lg font-medium text-gray-900 mb-4'>Xác nhận ảnh</h4>

              {capturedImage && (
                <div className='mb-4'>
                  <img
                    src={capturedImage}
                    alt='Captured face'
                    className='w-full max-w-sm mx-auto rounded-lg border shadow-sm'
                  />
                </div>
              )}

              <p className='text-sm text-gray-600 mb-4'>
                Ảnh có rõ ràng không? Nhấn "Xác thực" để tiếp tục hoặc "Chụp lại"
              </p>

              <div className='flex space-x-3 justify-center'>
                <button
                  onClick={retakePhoto}
                  className='inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50'
                >
                  <RefreshCw className='h-4 w-4 mr-2' />
                  Chụp lại
                </button>
                <button
                  onClick={verifyFace}
                  disabled={isVerifying}
                  className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50'
                >
                  {isVerifying ? (
                    <>
                      <Loader className='h-4 w-4 mr-2 animate-spin' />
                      Đang xác thực...
                    </>
                  ) : (
                    <>
                      <Check className='h-4 w-4 mr-2' />
                      Xác thực
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Result Step */}
          {step === 'result' && verificationResult && (
            <div className='text-center'>
              <div
                className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full mb-4 ${
                  verificationResult.success ? 'bg-green-100' : 'bg-red-100'
                }`}
              >
                {verificationResult.success ? (
                  <Check className='h-6 w-6 text-green-600' />
                ) : (
                  <X className='h-6 w-6 text-red-600' />
                )}
              </div>

              <h4
                className={`text-lg font-medium mb-2 ${verificationResult.success ? 'text-green-900' : 'text-red-900'}`}
              >
                {verificationResult.success ? 'Xác thực thành công!' : 'Xác thực thất bại'}
              </h4>

              <p className='text-sm text-gray-600 mb-4'>
                {verificationResult.success ? (
                  <>
                    Độ tương đồng: {(verificationResult.similarity * 100).toFixed(1)}%<br />
                    Bạn có thể bắt đầu làm bài thi
                  </>
                ) : (
                  <>
                    {'Không thể xác thực khuôn mặt của bạn.'}
                    <br />
                    <div>Vui lòng thử lại hoặc liên hệ với hỗ trợ nếu cần.</div>
                  </>
                )}
              </p>

              <div className='flex space-x-3 justify-center'>
                {!verificationResult.success && (
                  <>
                    <button
                      onClick={() => setStep('capture')}
                      className='inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50'
                    >
                      Thử lại
                    </button>
                    {onSkip && (
                      <button
                        onClick={handleSkip}
                        className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700'
                      >
                        Bỏ qua
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FaceVerificationModal
