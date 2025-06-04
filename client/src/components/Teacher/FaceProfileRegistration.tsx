/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef, useEffect } from 'react'
import { Camera, Check, AlertTriangle, RefreshCw, Loader, Shield, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import faceVerificationApi from '../../apis/faceVerification.api'

interface FaceProfileRegistrationProps {
  onRegistrationComplete?: () => void
}

const FaceProfileRegistration: React.FC<FaceProfileRegistrationProps> = ({ onRegistrationComplete }) => {
  const [step, setStep] = useState<'check_status' | 'camera_check' | 'capture' | 'upload' | 'success'>('check_status')
  const [hasCamera, setHasCamera] = useState<boolean | null>(null)
  const [, setHasExistingProfile] = useState<boolean | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string>('')
  const [profileStatus, setProfileStatus] = useState<any>(null)

  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Check profile status on mount
  useEffect(() => {
    checkProfileStatus()
  }, [])

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [stream])

  const checkProfileStatus = async () => {
    try {
      const response = await faceVerificationApi.getFaceProfileStatus()
      const status = response.data.result

      setProfileStatus(status)
      setHasExistingProfile(status.has_face_profile)

      if (status.has_face_profile) {
        setStep('success')
      } else {
        setStep('camera_check')
      }
    } catch (error) {
      console.error('Failed to check profile status:', error)
      toast.error('Không thể kiểm tra trạng thái hồ sơ khuôn mặt')
      setStep('camera_check')
    }
  }

  const checkCameraAvailability = async () => {
    try {
      console.log('🔍 Checking camera availability...')

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasCamera(false)
        setCameraError('Camera API không được hỗ trợ trên trình duyệt này')
        return
      }

      const testStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        }
      })

      console.log('✅ Camera access granted')
      setHasCamera(true)
      testStream.getTracks().forEach((track) => track.stop())
      setStep('capture')
    } catch (error: any) {
      console.error('❌ Camera access failed:', error)
      setHasCamera(false)

      if (error.name === 'NotAllowedError') {
        setCameraError('Bạn cần cho phép truy cập camera để đăng ký khuôn mặt')
      } else if (error.name === 'NotFoundError') {
        setCameraError('Không tìm thấy camera trên thiết bị này')
      } else {
        setCameraError('Không thể truy cập camera. Vui lòng kiểm tra lại thiết bị.')
      }
    }
  }

  const startCamera = async () => {
    try {
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
        await videoRef.current.play()
      }
    } catch (error: any) {
      console.error('Failed to start camera:', error)
      toast.error('Không thể khởi động camera')
    }
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return

    setIsCapturing(true)

    const video = videoRef.current
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')

    if (!context) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob(
      (blob) => {
        if (blob) {
          const imageDataUrl = canvas.toDataURL('image/jpeg', 0.8)
          setCapturedImage(imageDataUrl)
          setCapturedBlob(blob)

          if (stream) {
            stream.getTracks().forEach((track) => track.stop())
            setStream(null)
          }

          setStep('upload')
        }
      },
      'image/jpeg',
      0.8
    )

    setIsCapturing(false)
  }

  const retakePhoto = () => {
    setCapturedImage(null)
    setCapturedBlob(null)
    setStep('capture')
  }

  const uploadFaceProfile = async () => {
    if (!capturedBlob) return

    setIsUploading(true)

    try {
      const file = new File([capturedBlob], 'face_profile.jpg', { type: 'image/jpeg' })
      await faceVerificationApi.uploadFaceProfile(file)

      toast.success('Đăng ký khuôn mặt thành công!')
      setStep('success')
      setHasExistingProfile(true)

      if (onRegistrationComplete) {
        onRegistrationComplete()
      }
    } catch (error: any) {
      console.error('Face profile upload failed:', error)

      const errorMessage = error.response?.data?.message || 'Đăng ký khuôn mặt thất bại'
      toast.error(errorMessage)

      // Stay on upload step to allow retry
    } finally {
      setIsUploading(false)
    }
  }

  const deleteFaceProfile = async () => {
    if (
      !window.confirm(
        'Bạn có chắc chắn muốn xóa hồ sơ khuôn mặt? Điều này sẽ ảnh hưởng đến việc xác thực trong các kỳ thi.'
      )
    ) {
      return
    }

    try {
      await faceVerificationApi.deleteFaceProfile()
      toast.success('Đã xóa hồ sơ khuôn mặt')

      setHasExistingProfile(false)
      setProfileStatus(null)
      setStep('camera_check')
    } catch (error: any) {
      console.error('Failed to delete face profile:', error)
      toast.error('Không thể xóa hồ sơ khuôn mặt')
    }
  }

  const restartRegistration = () => {
    setCapturedImage(null)
    setCapturedBlob(null)
    setStep('camera_check')
  }

  return (
    <div className='bg-white shadow sm:rounded-lg'>
      <div className='px-4 py-5 sm:p-6'>
        <h3 className='text-lg leading-6 font-medium text-gray-900 flex items-center'>
          <Shield className='h-5 w-5 text-blue-600 mr-2' />
          Đăng ký khuôn mặt
        </h3>
        <p className='mt-2 text-sm text-gray-600'>Đăng ký khuôn mặt để tăng tính bảo mật khi tham gia các kỳ thi</p>

        <div className='mt-6'>
          {/* Check Status Step */}
          {step === 'check_status' && (
            <div className='text-center'>
              <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4'>
                <Loader className='h-6 w-6 text-blue-600 animate-spin' />
              </div>
              <p className='text-sm text-gray-600'>Đang kiểm tra trạng thái hồ sơ...</p>
            </div>
          )}

          {/* Camera Check Step */}
          {step === 'camera_check' && (
            <div className='text-center'>
              <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4'>
                <Camera className='h-6 w-6 text-blue-600' />
              </div>
              <h4 className='text-lg font-medium text-gray-900 mb-2'>Kiểm tra camera</h4>
              <p className='text-sm text-gray-600 mb-4'>Chúng tôi cần truy cập camera để chụp ảnh khuôn mặt của bạn</p>

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

              <button
                onClick={checkCameraAvailability}
                className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700'
              >
                <Camera className='h-4 w-4 mr-2' />
                Kiểm tra camera
              </button>
            </div>
          )}

          {/* Capture Step */}
          {step === 'capture' && (
            <div className='text-center'>
              <h4 className='text-lg font-medium text-gray-900 mb-4'>Chụp ảnh khuôn mặt</h4>

              <div className='relative mb-4'>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className='w-full max-w-md mx-auto rounded-lg border shadow-sm'
                  onLoadedMetadata={startCamera}
                />
                <canvas ref={canvasRef} style={{ display: 'none' }} />

                <div className='absolute inset-0 flex items-center justify-center pointer-events-none'>
                  <div className='border-2 border-blue-500 border-dashed rounded-full w-48 h-48 opacity-50' />
                </div>
              </div>

              <div className='bg-blue-50 border border-blue-200 rounded-md p-4 mb-4'>
                <h5 className='text-sm font-medium text-blue-800 mb-2'>Hướng dẫn chụp ảnh:</h5>
                <ul className='text-sm text-blue-700 text-left space-y-1'>
                  <li>• Đảm bảo khuôn mặt nằm trong khung tròn</li>
                  <li>• Ánh sáng đầy đủ và rõ ràng</li>
                  <li>• Không đeo kính râm hoặc khẩu trang</li>
                  <li>• Nhìn thẳng vào camera</li>
                </ul>
              </div>

              <div className='flex space-x-3 justify-center'>
                <button
                  onClick={restartRegistration}
                  className='inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50'
                >
                  Hủy
                </button>
                <button
                  onClick={capturePhoto}
                  disabled={isCapturing}
                  className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50'
                >
                  <Camera className='h-4 w-4 mr-2' />
                  {isCapturing ? 'Đang chụp...' : 'Chụp ảnh'}
                </button>
              </div>
            </div>
          )}

          {/* Upload Step */}
          {step === 'upload' && (
            <div className='text-center'>
              <h4 className='text-lg font-medium text-gray-900 mb-4'>Xác nhận và đăng ký</h4>

              {capturedImage && (
                <div className='mb-4'>
                  <img
                    src={capturedImage}
                    alt='Captured face'
                    className='w-full max-w-sm mx-auto rounded-lg border shadow-sm'
                  />
                </div>
              )}

              <p className='text-sm text-gray-600 mb-4'>Ảnh có rõ ràng không? Nhấn "Đăng ký" để lưu hồ sơ khuôn mặt</p>

              <div className='flex space-x-3 justify-center'>
                <button
                  onClick={retakePhoto}
                  disabled={isUploading}
                  className='inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50'
                >
                  <RefreshCw className='h-4 w-4 mr-2' />
                  Chụp lại
                </button>
                <button
                  onClick={uploadFaceProfile}
                  disabled={isUploading}
                  className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50'
                >
                  {isUploading ? (
                    <>
                      <Loader className='h-4 w-4 mr-2 animate-spin' />
                      Đang đăng ký...
                    </>
                  ) : (
                    <>
                      <Check className='h-4 w-4 mr-2' />
                      Đăng ký
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <div className='text-center'>
              <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4'>
                <Check className='h-6 w-6 text-green-600' />
              </div>
              <h4 className='text-lg font-medium text-green-900 mb-2'>Đăng ký thành công!</h4>
              <p className='text-sm text-gray-600 mb-4'>
                Hồ sơ khuôn mặt của bạn đã được đăng ký và sẵn sàng sử dụng cho xác thực
              </p>

              {profileStatus && (
                <div className='bg-gray-50 border border-gray-200 rounded-md p-4 mb-4'>
                  <div className='text-sm text-gray-600'>
                    <p>
                      <strong>Ngày đăng ký:</strong> {new Date(profileStatus.created_at).toLocaleDateString('vi-VN')}
                    </p>
                    {profileStatus.updated_at && profileStatus.updated_at !== profileStatus.created_at && (
                      <p>
                        <strong>Cập nhật:</strong> {new Date(profileStatus.updated_at).toLocaleDateString('vi-VN')}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className='flex space-x-3 justify-center'>
                <button
                  onClick={restartRegistration}
                  className='inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50'
                >
                  <RefreshCw className='h-4 w-4 mr-2' />
                  Đăng ký lại
                </button>
                <button
                  onClick={deleteFaceProfile}
                  className='inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700'
                >
                  <Trash2 className='h-4 w-4 mr-2' />
                  Xóa hồ sơ
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FaceProfileRegistration
