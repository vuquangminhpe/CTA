/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import { Tab } from '@headlessui/react'
import {
  CreditCard,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  BarChart3,
  Users,
  DollarSign,
  Calendar
} from 'lucide-react'
import {
  useAdminPayments,
  usePaymentStatistics,
  useUpdatePaymentStatus,
  useDeletePayment,
  usePackages,
  useCreatePackage,
  useUpdatePackage,
  useDeletePackage
} from '../../hooks/usePayment'
import { PaymentStatus, PackageType, CreatePackageBody } from '../../apis/payment.api'
import { formatCurrency, formatDate } from '../../utils/format'

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

const AdminPaymentManagement = () => {
  // Payment filters
  const [paymentFilters, setPaymentFilters] = useState({
    page: 1,
    limit: 10,
    status: undefined as PaymentStatus | undefined,
    search: '',
    sort_by: 'created_at' as const,
    sort_order: 'desc' as const
  })

  // Package form state
  const [packageForm, setPackageForm] = useState<CreatePackageBody | null>(null)
  const [editingPackage, setEditingPackage] = useState<any>(null)
  const [showPackageForm, setShowPackageForm] = useState(false)

  // Payment detail modal
  const [selectedPayment, setSelectedPayment] = useState<any>(null)

  // React Query hooks
  const { data: paymentsData, isLoading: paymentsLoading } = useAdminPayments(paymentFilters)
  const { data: statistics, isLoading: statisticsLoading } = usePaymentStatistics()
  const { data: packages, isLoading: packagesLoading } = usePackages()
  const updatePaymentMutation = useUpdatePaymentStatus()
  const deletePaymentMutation = useDeletePayment()
  const createPackageMutation = useCreatePackage()
  const updatePackageMutation = useUpdatePackage()
  const deletePackageMutation = useDeletePackage()

  const handleUpdatePaymentStatus = async (paymentId: string, status: PaymentStatus, adminNote?: string) => {
    try {
      await updatePaymentMutation.mutateAsync({ paymentId, status, admin_note: adminNote })
      setSelectedPayment(null)
    } catch (error) {
      console.log('Error updating payment status:', error)
    }
  }

  const handleDeletePayment = async (paymentId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa thanh toán này?')) {
      try {
        await deletePaymentMutation.mutateAsync(paymentId)
        setSelectedPayment(null)
      } catch (error) {
        console.log('Error updating payment status:', error)
      }
    }
  }

  const handleCreatePackage = async () => {
    if (!packageForm) return

    try {
      await createPackageMutation.mutateAsync(packageForm)
      setShowPackageForm(false)
      setPackageForm(null)
    } catch (error) {
      console.log('Error updating payment status:', error)
    }
  }

  const handleUpdatePackage = async () => {
    if (!editingPackage || !packageForm) return

    try {
      await updatePackageMutation.mutateAsync({
        packageId: editingPackage._id,
        ...packageForm
      })
      setShowPackageForm(false)
      setEditingPackage(null)
      setPackageForm(null)
    } catch (error) {
      console.log('Error updating payment status:', error)
    }
  }

  const handleDeletePackage = async (packageId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa gói này?')) {
      try {
        await deletePackageMutation.mutateAsync(packageId)
      } catch (error) {
        console.log('Error updating payment status:', error)
      }
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

  const resetPackageForm = () => {
    setPackageForm({
      name: '',
      type: PackageType.SINGLE,
      price: 0,
      duration_months: 1,
      max_teachers: 1,
      question_generation_limit: 10,
      features: []
    })
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30'>
      <div className='max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-8 shadow-2xl shadow-blue-500/10'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center'>
                <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg'>
                  <CreditCard className='w-6 h-6 text-white' />
                </div>
                <div>
                  <h1 className='text-3xl font-black text-gray-900'>Quản lý thanh toán</h1>
                  <p className='text-gray-600 font-medium'>Quản lý gói giá và thanh toán của hệ thống</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {!statisticsLoading && statistics && (
          <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
            <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-6 shadow-lg'>
              <div className='flex items-center'>
                <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-400 rounded-2xl flex items-center justify-center mr-4'>
                  <DollarSign className='w-6 h-6 text-white' />
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-600'>Tổng doanh thu</p>
                  <p className='text-2xl font-black text-gray-900'>{formatCurrency(statistics.total_revenue)}</p>
                </div>
              </div>
            </div>

            <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-6 shadow-lg'>
              <div className='flex items-center'>
                <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mr-4'>
                  <BarChart3 className='w-6 h-6 text-white' />
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-600'>Thanh toán hoàn thành</p>
                  <p className='text-2xl font-black text-gray-900'>
                    {statistics.by_status.find((s) => s._id === PaymentStatus.COMPLETED)?.count || 0}
                  </p>
                </div>
              </div>
            </div>

            <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-6 shadow-lg'>
              <div className='flex items-center'>
                <div className='w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-400 rounded-2xl flex items-center justify-center mr-4'>
                  <Clock className='w-6 h-6 text-white' />
                </div>
                <div>
                  <p className='text-sm font-medium text-gray-600'>Chờ xử lý</p>
                  <p className='text-2xl font-black text-gray-900'>
                    {statistics.by_status.find((s) => s._id === PaymentStatus.PENDING)?.count || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

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
                        <CreditCard className='w-4 h-4' />
                      </div>
                      <span
                        className={classNames(
                          'text-lg font-bold transition-colors duration-300',
                          selected ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'
                        )}
                      >
                        Thanh toán
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
                        <Package className='w-4 h-4' />
                      </div>
                      <span
                        className={classNames(
                          'text-lg font-bold transition-colors duration-300',
                          selected ? 'text-gray-900' : 'text-gray-700 group-hover:text-gray-900'
                        )}
                      >
                        Quản lý gói
                      </span>
                    </div>
                  </div>
                )}
              </Tab>
            </div>
          </Tab.List>

          <Tab.Panels>
            {/* Payments Management Tab */}
            <Tab.Panel>
              <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-8 shadow-2xl shadow-blue-500/10'>
                {/* Filters */}
                <div className='flex flex-col lg:flex-row gap-4 mb-6'>
                  <div className='flex-1'>
                    <div className='relative'>
                      <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5' />
                      <input
                        type='text'
                        placeholder='Tìm kiếm theo tên, email...'
                        value={paymentFilters.search}
                        onChange={(e) => setPaymentFilters({ ...paymentFilters, search: e.target.value, page: 1 })}
                        className='w-full pl-10 pr-4 py-3 bg-white/80 backdrop-blur border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300'
                      />
                    </div>
                  </div>
                  <div className='flex gap-3'>
                    <select
                      value={paymentFilters.status || ''}
                      onChange={(e) =>
                        setPaymentFilters({
                          ...paymentFilters,
                          status: e.target.value ? (e.target.value as PaymentStatus) : undefined,
                          page: 1
                        })
                      }
                      className='px-4 py-3 bg-white/80 backdrop-blur border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300'
                    >
                      <option value=''>Tất cả trạng thái</option>
                      <option value={PaymentStatus.PENDING}>Chờ xử lý</option>
                      <option value={PaymentStatus.COMPLETED}>Hoàn thành</option>
                      <option value={PaymentStatus.REJECTED}>Từ chối</option>
                      <option value={PaymentStatus.EXPIRED}>Hết hạn</option>
                    </select>
                  </div>
                </div>

                {/* Payments List */}
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
                ) : paymentsData && paymentsData.payments.length > 0 ? (
                  <div className='space-y-4'>
                    {paymentsData.payments.map((payment) => (
                      <div
                        key={payment._id}
                        className='backdrop-blur-xl bg-white/50 border border-white/30 rounded-3xl p-6 hover:bg-white/60 transition-all duration-300'
                      >
                        <div className='flex items-center justify-between'>
                          <div className='flex-1'>
                            <div className='flex items-center gap-4 mb-3'>
                              <h3 className='text-lg font-bold text-gray-900'>
                                {payment.user?.name || 'N/A'} (@{payment.user?.username || 'N/A'})
                              </h3>
                              {getStatusBadge(payment.status)}
                            </div>
                            <div className='grid grid-cols-1 md:grid-cols-4 gap-4 text-sm'>
                              <div className='flex items-center text-gray-700'>
                                <Package className='w-4 h-4 mr-2' />
                                <span>{payment.package?.name}</span>
                              </div>
                              <div className='flex items-center text-gray-700'>
                                <DollarSign className='w-4 h-4 mr-2' />
                                <span>{formatCurrency(payment.amount)}</span>
                              </div>
                              <div className='flex items-center text-gray-700'>
                                <Calendar className='w-4 h-4 mr-2' />
                                <span>{formatDate(payment.created_at)}</span>
                              </div>
                              {payment.teacher_usernames && payment.teacher_usernames.length > 0 && (
                                <div className='flex items-center text-gray-700'>
                                  <Users className='w-4 h-4 mr-2' />
                                  <span>{payment.teacher_usernames.length} giáo viên</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className='ml-6 flex gap-2'>
                            <button
                              onClick={() => setSelectedPayment(payment)}
                              className='inline-flex items-center px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-2xl transition-colors font-medium text-sm'
                            >
                              <Eye className='w-4 h-4 mr-2' />
                              Chi tiết
                            </button>
                            {payment.status === PaymentStatus.PENDING && (
                              <>
                                <button
                                  onClick={() => handleUpdatePaymentStatus(payment._id, PaymentStatus.COMPLETED)}
                                  className='inline-flex items-center px-4 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-2xl transition-colors font-medium text-sm'
                                >
                                  <CheckCircle className='w-4 h-4 mr-2' />
                                  Duyệt
                                </button>
                                <button
                                  onClick={() => handleUpdatePaymentStatus(payment._id, PaymentStatus.REJECTED)}
                                  className='inline-flex items-center px-4 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-2xl transition-colors font-medium text-sm'
                                >
                                  <X className='w-4 h-4 mr-2' />
                                  Từ chối
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Pagination */}
                    {paymentsData.total_pages > 1 && (
                      <div className='flex items-center justify-between mt-6 pt-6 border-t border-gray-200/50'>
                        <div className='text-sm text-gray-700'>
                          Hiển thị {(paymentFilters.page - 1) * paymentFilters.limit + 1} -{' '}
                          {Math.min(paymentFilters.page * paymentFilters.limit, paymentsData.total)} trên{' '}
                          {paymentsData.total} kết quả
                        </div>
                        <div className='flex gap-2'>
                          <button
                            onClick={() => setPaymentFilters({ ...paymentFilters, page: paymentFilters.page - 1 })}
                            disabled={paymentFilters.page === 1}
                            className='px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-2xl transition-colors font-medium text-sm'
                          >
                            Trước
                          </button>
                          <button
                            onClick={() => setPaymentFilters({ ...paymentFilters, page: paymentFilters.page + 1 })}
                            disabled={paymentFilters.page >= paymentsData.total_pages}
                            className='px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 rounded-2xl transition-colors font-medium text-sm'
                          >
                            Sau
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className='text-center py-16'>
                    <CreditCard className='w-16 h-16 text-gray-400 mx-auto mb-4' />
                    <h3 className='text-xl font-bold text-gray-900 mb-2'>Không có thanh toán nào</h3>
                    <p className='text-gray-600'>Chưa có thanh toán nào trong hệ thống</p>
                  </div>
                )}
              </div>
            </Tab.Panel>

            {/* Package Management Tab */}
            <Tab.Panel>
              <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-8 shadow-2xl shadow-blue-500/10'>
                <div className='flex items-center justify-between mb-6'>
                  <div>
                    <h2 className='text-2xl font-black text-gray-900'>Quản lý gói</h2>
                    <p className='text-gray-600 font-medium'>Tạo và chỉnh sửa các gói sử dụng</p>
                  </div>
                  <button
                    onClick={() => {
                      resetPackageForm()
                      setEditingPackage(null)
                      setShowPackageForm(true)
                    }}
                    className='inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-2xl hover:from-blue-600 hover:to-purple-600 transition-all duration-300 shadow-lg hover:shadow-xl font-semibold'
                  >
                    <Plus className='w-5 h-5 mr-2' />
                    Tạo gói mới
                  </button>
                </div>

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
                        className='backdrop-blur-xl bg-white/50 border border-white/30 rounded-3xl p-6 hover:bg-white/60 transition-all duration-300'
                      >
                        <div className='flex items-center justify-between mb-4'>
                          <h3 className='text-xl font-bold text-gray-900'>{pkg.name}</h3>
                          <div className='flex gap-2'>
                            <button
                              onClick={() => {
                                setEditingPackage(pkg)
                                setPackageForm({
                                  name: pkg.name,
                                  type: pkg.type,
                                  price: pkg.price,
                                  duration_months: pkg.duration_months,
                                  max_teachers: pkg.max_teachers,
                                  question_generation_limit: pkg.question_generation_limit,
                                  features: pkg.features,
                                  active: pkg.active
                                } as any)
                                setShowPackageForm(true)
                              }}
                              className='p-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-xl transition-colors'
                            >
                              <Edit className='w-4 h-4' />
                            </button>
                            <button
                              onClick={() => handleDeletePackage(pkg._id)}
                              className='p-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl transition-colors'
                            >
                              <Trash2 className='w-4 h-4' />
                            </button>
                          </div>
                        </div>

                        <div className='space-y-2 mb-4'>
                          <div className='text-2xl font-black text-gray-900'>{formatCurrency(pkg.price)}</div>
                          <div className='text-sm text-gray-600'>
                            {pkg.max_teachers} giáo viên • {pkg.question_generation_limit} câu hỏi •{' '}
                            {pkg.duration_months} tháng
                          </div>
                        </div>

                        <div className='space-y-2'>
                          {pkg.features.slice(0, 3).map((feature, index) => (
                            <div key={index} className='flex items-start'>
                              <CheckCircle className='w-4 h-4 text-green-500 mr-2 mt-0.5 flex-shrink-0' />
                              <span className='text-sm text-gray-700'>{feature}</span>
                            </div>
                          ))}
                          {pkg.features.length > 3 && (
                            <div className='text-sm text-gray-500'>+{pkg.features.length - 3} tính năng khác</div>
                          )}
                        </div>

                        <div className='mt-4 pt-4 border-t border-gray-200/50'>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              pkg.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {pkg.active ? 'Đang hoạt động' : 'Tạm dừng'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className='text-center py-16'>
                    <Package className='w-16 h-16 text-gray-400 mx-auto mb-4' />
                    <h3 className='text-xl font-bold text-gray-900 mb-2'>Chưa có gói nào</h3>
                    <p className='text-gray-600'>Bắt đầu tạo gói đầu tiên cho hệ thống</p>
                  </div>
                )}
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>

        {/* Payment Detail Modal */}
        {selectedPayment && (
          <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
            <div className='backdrop-blur-xl bg-white/90 border border-white/20 rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto'>
              <div className='flex items-center justify-between mb-6'>
                <h2 className='text-2xl font-black text-gray-900'>Chi tiết thanh toán</h2>
                <button
                  onClick={() => setSelectedPayment(null)}
                  className='w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-2xl flex items-center justify-center transition-colors'
                >
                  <X className='w-5 h-5' />
                </button>
              </div>

              <div className='space-y-6'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-600 mb-1'>Người dùng</label>
                    <div className='text-lg font-bold text-gray-900'>
                      {selectedPayment.user?.name} (@{selectedPayment.user?.username})
                    </div>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-600 mb-1'>Trạng thái</label>
                    <div>{getStatusBadge(selectedPayment.status)}</div>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-600 mb-1'>Gói</label>
                    <div className='text-lg font-bold text-gray-900'>{selectedPayment.package?.name}</div>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-600 mb-1'>Số tiền</label>
                    <div className='text-lg font-bold text-gray-900'>{formatCurrency(selectedPayment.amount)}</div>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-medium text-gray-600 mb-1'>Ngày tạo</label>
                    <div className='text-gray-900'>{formatDate(selectedPayment.created_at)}</div>
                  </div>
                  <div>
                    <label className='block text-sm font-medium text-gray-600 mb-1'>Hết hạn</label>
                    <div className='text-gray-900'>{formatDate(selectedPayment.expires_at)}</div>
                  </div>
                </div>

                {selectedPayment.teacher_usernames && selectedPayment.teacher_usernames.length > 0 && (
                  <div>
                    <label className='block text-sm font-medium text-gray-600 mb-2'>
                      Tên giáo viên ( tên đăng nhập của giáo viên, ví dụ: vuquanghai)
                    </label>
                    <div className='space-y-2'>
                      {selectedPayment.teacher_usernames.map((username: string, index: number) => (
                        <div key={index} className='px-3 py-2 bg-gray-100 rounded-xl text-gray-900'>
                          @{username}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedPayment.note && (
                  <div>
                    <label className='block text-sm font-medium text-gray-600 mb-2'>Ghi chú</label>
                    <div className='p-3 bg-gray-100 rounded-xl text-gray-900'>{selectedPayment.note}</div>
                  </div>
                )}

                {selectedPayment.admin_note && (
                  <div>
                    <label className='block text-sm font-medium text-gray-600 mb-2'>Phản hồi admin</label>
                    <div className='p-3 bg-blue-100 rounded-xl text-blue-900'>{selectedPayment.admin_note}</div>
                  </div>
                )}

                {selectedPayment.status === PaymentStatus.PENDING && (
                  <div className='flex gap-3 pt-4 border-t border-gray-200'>
                    <button
                      onClick={() => handleUpdatePaymentStatus(selectedPayment._id, PaymentStatus.COMPLETED)}
                      className='flex-1 py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl'
                    >
                      Duyệt thanh toán
                    </button>
                    <button
                      onClick={() => handleUpdatePaymentStatus(selectedPayment._id, PaymentStatus.REJECTED)}
                      className='flex-1 py-3 px-6 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl'
                    >
                      Từ chối
                    </button>
                  </div>
                )}

                <div className='flex gap-3 pt-4 border-t border-gray-200'>
                  <button
                    onClick={() => window.open(selectedPayment.qr_code_url, '_blank')}
                    className='flex-1 py-3 px-6 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-2xl font-bold transition-colors'
                  >
                    Xem QR Code
                  </button>
                  <button
                    onClick={() => handleDeletePayment(selectedPayment._id)}
                    className='flex-1 py-3 px-6 bg-red-100 hover:bg-red-200 text-red-700 rounded-2xl font-bold transition-colors'
                  >
                    Xóa thanh toán
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Package Form Modal */}
        {showPackageForm && packageForm && (
          <div className='fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4'>
            <div className='backdrop-blur-xl bg-white/90 border border-white/20 rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto'>
              <div className='flex items-center justify-between mb-6'>
                <h2 className='text-2xl font-black text-gray-900'>
                  {editingPackage ? 'Chỉnh sửa gói' : 'Tạo gói mới'}
                </h2>
                <button
                  onClick={() => setShowPackageForm(false)}
                  className='w-8 h-8 bg-gray-100 hover:bg-gray-200 rounded-2xl flex items-center justify-center transition-colors'
                >
                  <X className='w-5 h-5' />
                </button>
              </div>

              <div className='space-y-6'>
                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <label className='block text-sm font-bold text-gray-900 mb-2'>Tên gói</label>
                    <input
                      type='text'
                      value={packageForm.name}
                      onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                      className='w-full px-4 py-3 bg-white/80 backdrop-blur border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300'
                      placeholder='Nhập tên gói'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-bold text-gray-900 mb-2'>Loại gói</label>
                    <select
                      value={packageForm.type}
                      onChange={(e) => setPackageForm({ ...packageForm, type: e.target.value as PackageType })}
                      className='w-full px-4 py-3 bg-white/80 backdrop-blur border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300'
                    >
                      <option value={PackageType.SINGLE}>Gói đơn</option>
                      <option value={PackageType.TEAM_3}>Gói 4 Người</option>
                      <option value={PackageType.TEAM_7}>Gói 7 người</option>
                    </select>
                  </div>
                </div>

                <div className='grid grid-cols-3 gap-4'>
                  <div>
                    <label className='block text-sm font-bold text-gray-900 mb-2'>Giá (VND)</label>
                    <input
                      type='number'
                      value={packageForm.price}
                      onChange={(e) => setPackageForm({ ...packageForm, price: Number(e.target.value) })}
                      className='w-full px-4 py-3 bg-white/80 backdrop-blur border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300'
                      placeholder='0'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-bold text-gray-900 mb-2'>Thời hạn (tháng)</label>
                    <input
                      type='number'
                      value={packageForm.duration_months}
                      onChange={(e) => setPackageForm({ ...packageForm, duration_months: Number(e.target.value) })}
                      className='w-full px-4 py-3 bg-white/80 backdrop-blur border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300'
                      placeholder='1'
                    />
                  </div>
                  <div>
                    <label className='block text-sm font-bold text-gray-900 mb-2'>Số giáo viên</label>
                    <input
                      type='number'
                      value={packageForm.max_teachers}
                      onChange={(e) => setPackageForm({ ...packageForm, max_teachers: Number(e.target.value) })}
                      className='w-full px-4 py-3 bg-white/80 backdrop-blur border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300'
                      placeholder='1'
                    />
                  </div>
                </div>

                <div>
                  <label className='block text-sm font-bold text-gray-900 mb-2'>Giới hạn tạo câu hỏi</label>
                  <input
                    type='number'
                    value={packageForm.question_generation_limit}
                    onChange={(e) =>
                      setPackageForm({ ...packageForm, question_generation_limit: Number(e.target.value) })
                    }
                    className='w-full px-4 py-3 bg-white/80 backdrop-blur border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300'
                    placeholder='10'
                  />
                </div>

                <div>
                  <label className='block text-sm font-bold text-gray-900 mb-2'>Tính năng</label>
                  <div className='space-y-3'>
                    {packageForm.features.map((feature, index) => (
                      <div key={index} className='flex items-center gap-3'>
                        <input
                          type='text'
                          value={feature}
                          onChange={(e) => {
                            const newFeatures = [...packageForm.features]
                            newFeatures[index] = e.target.value
                            setPackageForm({ ...packageForm, features: newFeatures })
                          }}
                          className='flex-1 px-4 py-3 bg-white/80 backdrop-blur border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300'
                          placeholder='Nhập tính năng'
                        />
                        <button
                          onClick={() => {
                            const newFeatures = packageForm.features.filter((_, i) => i !== index)
                            setPackageForm({ ...packageForm, features: newFeatures })
                          }}
                          className='w-10 h-10 bg-red-100 hover:bg-red-200 text-red-600 rounded-xl flex items-center justify-center transition-colors'
                        >
                          <Trash2 className='w-4 h-4' />
                        </button>
                      </div>
                    ))}
                    <button
                      onClick={() => setPackageForm({ ...packageForm, features: [...packageForm.features, ''] })}
                      className='w-full py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl transition-colors font-medium'
                    >
                      + Thêm tính năng
                    </button>
                  </div>
                </div>

                {editingPackage && (
                  <div>
                    <label className='flex items-center'>
                      <input
                        type='checkbox'
                        checked={(packageForm as any).active}
                        onChange={(e) => setPackageForm({ ...packageForm, active: e.target.checked } as any)}
                        className='w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2'
                      />
                      <span className='ml-2 text-sm font-medium text-gray-900'>Gói đang hoạt động</span>
                    </label>
                  </div>
                )}

                <div className='flex gap-4 pt-4 border-t border-gray-200'>
                  <button
                    onClick={() => setShowPackageForm(false)}
                    className='flex-1 py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl font-bold transition-colors'
                  >
                    Hủy bỏ
                  </button>
                  <button
                    onClick={editingPackage ? handleUpdatePackage : handleCreatePackage}
                    disabled={createPackageMutation.isPending || updatePackageMutation.isPending}
                    className='flex-1 py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl disabled:opacity-50'
                  >
                    {editingPackage ? 'Cập nhật' : 'Tạo gói'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPaymentManagement
