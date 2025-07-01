/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { Tab } from '@headlessui/react'
import {
  CreditCard,
  Package,
  Clock,
  Users,
  Zap,
  CheckCircle,
  QrCode,
  History,
  AlertCircle,
  Crown,
  Star,
  Copy,
  Eye,
  User
} from 'lucide-react'
import { toast } from 'sonner'
import { usePackages, useUserPayments, useCreatePayment } from '../../hooks/usePayment'
import { PackageType, PaymentStatus, CreatePaymentBody } from '../../apis/payment.api'
import { formatCurrency, formatDate } from '../../utils/format'

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

const PaymentPage = () => {
  const [selectedPackage, setSelectedPackage] = useState<any>(null)
  const [teacherUsernames, setTeacherUsernames] = useState<string[]>([''])
  const [note, setNote] = useState('')
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [, setShowQRModal] = useState(false)
  const [, setSelectedQRUrl] = useState('')

  // React Query hooks
  const { data: packages, isLoading: packagesLoading } = usePackages()

  const { data: userPayments, isLoading: paymentsLoading } = useUserPayments({
    page: 1,
    limit: 10,
    sort_by: 'created_at',
    sort_order: 'desc'
  })
  const createPaymentMutation = useCreatePayment()

  const handleSelectPackage = (pkg: any) => {
    setSelectedPackage(pkg)
    setShowPaymentForm(true)

    // Reset teacher usernames based on package type
    if (pkg.type === PackageType.SINGLE) {
      setTeacherUsernames([''])
    } else {
      const count = pkg.type === PackageType.TEAM_3 ? 3 : 7
      setTeacherUsernames(Array(count).fill(''))
    }
  }

  const handleAddTeacherUsername = () => {
    if (selectedPackage && teacherUsernames.length < selectedPackage.max_teachers) {
      setTeacherUsernames([...teacherUsernames, ''])
    }
  }

  const handleRemoveTeacherUsername = (index: number) => {
    const newUsernames = teacherUsernames.filter((_, i) => i !== index)
    setTeacherUsernames(newUsernames)
  }

  const handleUsernameChange = (index: number, value: string) => {
    const newUsernames = [...teacherUsernames]
    newUsernames[index] = value
    setTeacherUsernames(newUsernames)
  }

  const handleCreatePayment = async () => {
    if (!selectedPackage) return

    const filteredUsernames = teacherUsernames.filter((username) => username.trim() !== '')

    const paymentData: CreatePaymentBody = {
      package_id: selectedPackage._id,
      note: note.trim() || undefined
    }

    if (selectedPackage.type !== PackageType.SINGLE && filteredUsernames.length > 0) {
      paymentData.teacher_usernames = filteredUsernames
    }

    try {
      await createPaymentMutation.mutateAsync(paymentData)
      setShowPaymentForm(false)
      setSelectedPackage(null)
      setNote('')
      setTeacherUsernames([''])

      // Show QR code information
      toast.success(
        <div className='flex flex-col gap-2'>
          <div>Thanh toán được tạo thành công!</div>
          <div className='text-sm text-gray-600'>Vui lòng quét mã QR để thanh toán</div>
        </div>
      )
    } catch (error) {
      console.log('Error creating payment:', error)
    }
  }

  const getPackageIcon = (type: PackageType) => {
    switch (type) {
      case PackageType.SINGLE:
        return <User className='w-6 h-6' />
      case PackageType.TEAM_3:
        return <Users className='w-6 h-6' />
      case PackageType.TEAM_7:
        return <Crown className='w-6 h-6' />
      default:
        return <Package className='w-6 h-6' />
    }
  }

  const getPackageColor = (type: PackageType) => {
    switch (type) {
      case PackageType.SINGLE:
        return 'from-blue-500 to-cyan-400'
      case PackageType.TEAM_3:
        return 'from-purple-500 to-pink-400'
      case PackageType.TEAM_7:
        return 'from-cyan-500 to-red-400'
      default:
        return 'from-gray-500 to-gray-400'
    }
  }

  const getStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case PaymentStatus.PENDING:
        return (
          <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800'>
            <Clock className='w-4 h-4 mr-1' />
            Chờ xử lý
          </span>
        )
      case PaymentStatus.COMPLETED:
        return (
          <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800'>
            <CheckCircle className='w-4 h-4 mr-1' />
            Đã hoàn thành
          </span>
        )
      case PaymentStatus.REJECTED:
        return (
          <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800'>
            <AlertCircle className='w-4 h-4 mr-1' />
            Bị từ chối
          </span>
        )
      case PaymentStatus.EXPIRED:
        return (
          <span className='inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800'>
            <Clock className='w-4 h-4 mr-1' />
            Hết hạn
          </span>
        )
      default:
        return null
    }
  }

  const copyQRCode = (url: string) => {
    navigator.clipboard.writeText(url)
    toast.success('Link QR code đã được sao chép!')
  }

  const showQRCode = (url: string) => {
    setSelectedQRUrl(url)
    setShowQRModal(true)
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30'>
      {/* Background Elements */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse'></div>
        <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000'></div>
      </div>

      <div className='relative z-10 max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-12'>
          <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-8 shadow-2xl shadow-blue-500/10'>
            <div className='flex items-center'>
              <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg'>
                <CreditCard className='w-6 h-6 text-white' />
              </div>
              <div>
                <h1 className='text-4xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent'>
                  Gói sử dụng
                </h1>
                <p className='text-xl text-gray-600 font-medium mt-1'>
                  Chọn gói phù hợp để nâng cao trải nghiệm giảng dạy
                </p>
              </div>
            </div>
          </div>
        </div>

        <Tab.Group>
          <Tab.List className='backdrop-blur-xl bg-white/60 border border-white/20 rounded-2xl p-2 shadow-xl shadow-blue-500/5 mb-8'>
            <div className='grid grid-cols-2 gap-2'>
              <Tab className='focus:outline-none'>
                {({ selected }) => (
                  <div
                    className={classNames(
                      'group relative overflow-hidden rounded-xl p-4 transition-all duration-300 cursor-pointer',
                      selected
                        ? 'bg-white shadow-lg shadow-blue-500/20 scale-105'
                        : 'hover:bg-white/50 hover:shadow-md hover:scale-102'
                    )}
                  >
                    <div className='flex items-center justify-center text-center'>
                      <div
                        className={classNames(
                          'w-8 h-8 rounded-xl flex items-center justify-center mr-3 transition-all duration-300',
                          selected
                            ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-600 group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 group-hover:text-white'
                        )}
                      >
                        <Package className='w-4 h-4' />
                      </div>
                      <span
                        className={classNames(
                          'text-lg font-bold transition-colors duration-300',
                          selected ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'
                        )}
                      >
                        Chọn gói
                      </span>
                    </div>
                  </div>
                )}
              </Tab>
              <Tab className='focus:outline-none'>
                {({ selected }) => (
                  <div
                    className={classNames(
                      'group relative overflow-hidden rounded-xl p-4 transition-all duration-300 cursor-pointer',
                      selected
                        ? 'bg-white shadow-lg shadow-blue-500/20 scale-105'
                        : 'hover:bg-white/50 hover:shadow-md hover:scale-102'
                    )}
                  >
                    <div className='flex items-center justify-center text-center'>
                      <div
                        className={classNames(
                          'w-8 h-8 rounded-xl flex items-center justify-center mr-3 transition-all duration-300',
                          selected
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-600 group-hover:bg-gradient-to-r group-hover:from-green-400 group-hover:to-emerald-400 group-hover:text-white'
                        )}
                      >
                        <History className='w-4 h-4' />
                      </div>
                      <span
                        className={classNames(
                          'text-lg font-bold transition-colors duration-300',
                          selected ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'
                        )}
                      >
                        Lịch sử thanh toán
                      </span>
                    </div>
                  </div>
                )}
              </Tab>
            </div>
          </Tab.List>

          <Tab.Panels>
            {/* Packages Tab */}
            <Tab.Panel>
              <div className='space-y-8'>
                {packagesLoading ? (
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {[...Array(3)].map((_, index) => (
                      <div
                        key={index}
                        className='backdrop-blur-xl bg-white/50 border border-white/30 rounded-3xl p-6 animate-pulse'
                      >
                        <div className='h-6 bg-gray-200 rounded w-3/4 mb-4'></div>
                        <div className='h-8 bg-gray-200 rounded w-1/2 mb-6'></div>
                        <div className='space-y-3'>
                          <div className='h-4 bg-gray-200 rounded'></div>
                          <div className='h-4 bg-gray-200 rounded'></div>
                          <div className='h-4 bg-gray-200 rounded'></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : packages && packages.length > 0 ? (
                  <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {packages.map((pkg) => (
                      <div
                        key={pkg._id}
                        className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-6 shadow-2xl shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-300 hover:scale-105 group cursor-pointer'
                        onClick={() => handleSelectPackage(pkg)}
                      >
                        <div className='flex items-center justify-between mb-6'>
                          <div
                            className={`w-12 h-12 bg-gradient-to-r ${getPackageColor(pkg.type)} rounded-2xl flex items-center justify-center text-white shadow-lg`}
                          >
                            {getPackageIcon(pkg.type)}
                          </div>
                          {pkg.type === PackageType.TEAM_7 && (
                            <div className='flex items-center bg-gradient-to-r from-yellow-300 to-orange-100 border border-yellow-200/50 rounded-full px-3 py-1'>
                              <Star className='w-4 h-4 text-yellow-600 mr-1' />
                              <span className='text-xs font-bold text-yellow-800'>PHỔ BIẾN</span>
                            </div>
                          )}
                        </div>

                        <div className='mb-6'>
                          <h3 className='text-2xl font-black text-gray-900 mb-2'>{pkg.name}</h3>
                          <div className='flex items-baseline'>
                            <span className='text-3xl font-black text-gray-900'>{formatCurrency(pkg.price)}</span>
                            <span className='text-lg text-gray-600 ml-2'>/{pkg.duration_months} tháng</span>
                          </div>
                        </div>

                        <div className='space-y-3 mb-6'>
                          <div className='flex items-center text-gray-700'>
                            <Users className='w-5 h-5 text-blue-500 mr-3' />
                            <span className='font-medium'>{pkg.max_teachers} giáo viên</span>
                          </div>
                          <div className='flex items-center text-gray-700'>
                            <Zap className='w-5 h-5 text-purple-500 mr-3' />
                            <span className='font-medium'>{pkg.question_generation_limit} lần tạo câu hỏi</span>
                          </div>
                          <div className='flex items-center text-gray-700'>
                            <Clock className='w-5 h-5 text-green-500 mr-3' />
                            <span className='font-medium'>{pkg.duration_months} tháng sử dụng</span>
                          </div>
                        </div>

                        <div className='space-y-2 mb-6'>
                          {pkg.features.map((feature, index) => (
                            <div key={index} className='flex items-start'>
                              <CheckCircle className='w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0' />
                              <span className='text-sm text-gray-700 font-medium'>{feature}</span>
                            </div>
                          ))}
                        </div>

                        <button
                          className={`w-full py-3 px-6 bg-gradient-to-r ${getPackageColor(pkg.type)} text-black rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105`}
                        >
                          Chọn gói này
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-center py-16 backdrop-blur-xl bg-white/50 border border-white/30 rounded-3xl'>
                    <Package className='w-16 h-16 text-gray-400 mx-auto mb-4' />
                    <h3 className='text-xl font-bold text-gray-900 mb-2'>Chưa có gói nào</h3>
                    <p className='text-gray-600'>Hiện tại chưa có gói nào khả dụng</p>
                  </div>
                )}

                {/* Payment Form Modal */}
                {showPaymentForm && selectedPackage && (
                  <div className='fixed inset-0 max-w-[1920px] bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
                    <div className='backdrop-blur-xl bg-white/90 border border-white/20 rounded-3xl p-8 max-w-3xl w-full shadow-2xl max-h-[90vh] overflow-y-auto'>
                      <div className='flex items-center justify-between mb-6'>
                        <h2 className='text-2xl font-black text-gray-900'>Xác nhận thanh toán</h2>
                        <button
                          onClick={() => setShowPaymentForm(false)}
                          className='w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-2xl flex items-center justify-center transition-colors'
                        >
                          ×
                        </button>
                      </div>

                      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'>
                        {/* Package Info */}
                        <div className='p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200/50 rounded-2xl'>
                          <h3 className='font-bold text-gray-900 mb-2'>{selectedPackage.name}</h3>
                          <p className='text-2xl font-black text-blue-600 mb-3'>
                            {formatCurrency(selectedPackage.price)}
                          </p>
                          <div className='space-y-2 text-sm text-gray-700'>
                            <div className='flex items-center'>
                              <Users className='w-4 h-4 mr-2 text-blue-500' />
                              <span>{selectedPackage.max_teachers} giáo viên</span>
                            </div>
                            <div className='flex items-center'>
                              <Zap className='w-4 h-4 mr-2 text-purple-500' />
                              <span>{selectedPackage.question_generation_limit} lần tạo câu hỏi</span>
                            </div>
                            <div className='flex items-center'>
                              <Clock className='w-4 h-4 mr-2 text-green-500' />
                              <span>{selectedPackage.duration_months} tháng sử dụng</span>
                            </div>
                          </div>
                        </div>

                        {/* QR Code */}
                        <div className='p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-2xl text-center'>
                          <h3 className='font-bold text-gray-900 mb-3 flex items-center justify-center'>
                            <QrCode className='w-5 h-5 mr-2 text-green-600' />
                            Quét mã QR để thanh toán
                          </h3>
                          <div className='relative inline-block'>
                            <img
                              src='https://twitter-clone-minh-ap-southeast-1.s3.ap-southeast-1.amazonaws.com/QR.jpg'
                              alt='QR Code thanh toán'
                              className='size-72 mx-auto rounded-2xl shadow-lg border-4 border-white'
                              onError={(e) => {
                                e.currentTarget.src =
                                  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTVlN2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTZweCIgZmlsbD0iIzk5YTNhZiI+UVIgQ29kZTwvdGV4dD48L3N2Zz4='
                              }}
                            />
                          </div>
                          <p className='text-sm text-gray-600 mt-3 font-medium'>Scan mã QR này để chuyển khoản</p>
                          <button
                            onClick={() =>
                              copyQRCode(
                                'https://twitter-clone-minh-ap-southeast-1.s3.ap-southeast-1.amazonaws.com/QR.jpg'
                              )
                            }
                            className='mt-3 inline-flex items-center px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-2xl transition-colors font-medium text-sm'
                          >
                            <Copy className='w-4 h-4 mr-2' />
                            Copy link QR
                          </button>
                        </div>
                      </div>

                      {selectedPackage.type !== PackageType.SINGLE && (
                        <div className='mb-6'>
                          <label className='block text-sm font-bold text-gray-900 mb-3'>
                            Tên giáo viên ( tên đăng nhập của giáo viên, ví dụ: vuquanghai) (
                            {selectedPackage.max_teachers} tối đa)
                          </label>
                          <div className='space-y-3'>
                            {teacherUsernames.map((username, index) => (
                              <div key={index} className='flex items-center gap-3'>
                                <input
                                  type='text'
                                  value={username}
                                  onChange={(e) => handleUsernameChange(index, e.target.value)}
                                  placeholder={`Tên giáo viên ( tên đăng nhập của giáo viên, ví dụ: vuquanghai) ${index + 1}`}
                                  className='flex-1 px-4 py-3 bg-white/80 backdrop-blur border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300'
                                />
                                {index > 0 && (
                                  <button
                                    onClick={() => handleRemoveTeacherUsername(index)}
                                    className='w-10 h-10 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl flex items-center justify-center transition-colors'
                                  >
                                    ×
                                  </button>
                                )}
                              </div>
                            ))}
                            {teacherUsernames.length < selectedPackage.max_teachers && (
                              <button
                                onClick={handleAddTeacherUsername}
                                className='w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl transition-colors font-medium'
                              >
                                + Thêm giáo viên
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      <div className='mb-6'>
                        <label className='block text-sm font-bold text-gray-900 mb-3'>Ghi chú (tùy chọn)</label>
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder='Nhập ghi chú cho thanh toán...'
                          rows={3}
                          className='w-full px-4 py-3 bg-white/80 backdrop-blur border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 resize-none'
                        />
                      </div>

                      <div className='flex gap-4'>
                        <button
                          onClick={() => setShowPaymentForm(false)}
                          className='flex-1 py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold transition-colors'
                        >
                          Hủy bỏ
                        </button>
                        <button
                          onClick={handleCreatePayment}
                          disabled={createPaymentMutation.isPending}
                          className='flex-1 py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50'
                        >
                          {createPaymentMutation.isPending ? 'Đang tạo...' : 'Tạo thanh toán'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Tab.Panel>

            {/* Payment History Tab */}
            <Tab.Panel>
              <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-8 shadow-2xl shadow-blue-500/10'>
                <div className='flex items-center  mb-8'>
                  <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-400 rounded-2xl flex items-center justify-center mr-4'>
                    <History className='w-6 h-6 text-white' />
                  </div>
                  <div>
                    <h2 className='text-3xl font-black text-gray-900'>Lịch sử thanh toán</h2>
                    <p className='text-gray-600 font-medium'>Xem tất cả các giao dịch của bạn</p>
                  </div>
                </div>

                {paymentsLoading ? (
                  <div className='space-y-4'>
                    {[...Array(5)].map((_, index) => (
                      <div
                        key={index}
                        className='backdrop-blur-xl bg-white/50 border border-white/30 rounded-3xl p-6 animate-pulse'
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex-1'>
                            <div className='h-5 bg-gray-200 rounded w-1/3 mb-2'></div>
                            <div className='h-4 bg-gray-200 rounded w-1/4'></div>
                          </div>
                          <div className='h-8 bg-gray-200 rounded w-24'></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : userPayments && userPayments.payments.length > 0 ? (
                  <div className='space-y-4'>
                    {userPayments.payments.map((payment) => (
                      <div
                        key={payment._id}
                        className='backdrop-blur-xl bg-white/50 border border-white/30 rounded-3xl p-6 hover:bg-white/60 transition-all duration-300'
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex-1'>
                            <div className='flex items-center gap-4 mb-3'>
                              <h3 className='text-xl font-bold text-gray-900'>{payment.package?.name}</h3>
                              {getStatusBadge(payment.status)}
                            </div>
                            <div className='grid grid-cols-1 md:grid-cols-3 gap-4 text-sm'>
                              <div className='flex items-center text-gray-700'>
                                <CreditCard className='w-4 h-4 mr-2' />
                                <span>{formatCurrency(payment.amount)}</span>
                              </div>
                              <div className='flex items-center text-gray-700'>
                                <Clock className='w-4 h-4 mr-2' />
                                <span>{formatDate(payment.created_at)}</span>
                              </div>
                              {payment.teacher_usernames && payment.teacher_usernames.length > 0 && (
                                <div className='flex items-center text-gray-700'>
                                  <Users className='w-4 h-4 mr-2' />
                                  <span>{payment.teacher_usernames.length} giáo viên</span>
                                </div>
                              )}
                            </div>
                            {payment.note && (
                              <div className='mt-3 text-sm text-gray-600 bg-gray-50 rounded-2xl p-3'>
                                <strong>Ghi chú:</strong> {payment.note}
                              </div>
                            )}
                            {payment.admin_note && (
                              <div className='mt-3 text-sm text-gray-600 bg-blue-50 rounded-2xl p-3'>
                                <strong>Phản hồi từ admin:</strong> {payment.admin_note}
                              </div>
                            )}
                          </div>
                          {payment.status === PaymentStatus.PENDING && (
                            <div className='ml-6 flex flex-col items-center space-y-3'>
                              <div className='text-center'>
                                <div className='w-32 h-32 mb-3'>
                                  <img
                                    src={payment.qr_code_url}
                                    alt='QR Code thanh toán'
                                    className='w-full h-full rounded-2xl shadow-lg border-2 border-white'
                                    onError={(e) => {
                                      e.currentTarget.src =
                                        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZTVlN2ViIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJtb25vc3BhY2UiIGZvbnQtc2l6ZT0iMTZweCIgZmlsbD0iIzk5YTNhZiI+UVIgQ29kZTwvdGV4dD48L3N2Zz4='
                                    }}
                                  />
                                </div>
                                <p className='text-xs text-gray-600 mb-3'>Scan để thanh toán</p>
                              </div>
                              <div className='flex flex-col gap-2'>
                                <button
                                  onClick={() => copyQRCode(payment.qr_code_url)}
                                  className='inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl hover:from-blue-600 hover:to-purple-600 transition-all font-medium text-sm shadow-lg hover:shadow-xl'
                                >
                                  <Copy className='w-4 h-4 mr-2' />
                                  Copy QR
                                </button>
                                <button
                                  onClick={() => showQRCode(payment.qr_code_url)}
                                  className='inline-flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl transition-colors font-medium text-sm text-center justify-center'
                                >
                                  <Eye className='w-4 h-4 mr-2' />
                                  Xem lớn
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-center py-16'>
                    <History className='w-16 h-16 text-gray-400 mx-auto mb-4' />
                    <h3 className='text-xl font-bold text-gray-900 mb-2'>Chưa có giao dịch nào</h3>
                    <p className='text-gray-600'>Bạn chưa có giao dịch thanh toán nào</p>
                  </div>
                )}
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  )
}

export default PaymentPage
