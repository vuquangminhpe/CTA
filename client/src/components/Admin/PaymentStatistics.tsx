/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'
import { DollarSign, TrendingUp, CheckCircle, Clock, AlertCircle, CreditCard } from 'lucide-react'
import { usePaymentStatistics, useAdminPayments } from '../../hooks/usePayment'
import { PaymentStatus } from '../../apis/payment.api'
import { formatCurrency } from '../../utils/format'

const PaymentStatistics = () => {
  const [dateRange, setDateRange] = useState('last_30_days')

  const { data: statistics, isLoading: statisticsLoading } = usePaymentStatistics()
  const { data: recentPayments } = useAdminPayments({
    page: 1,
    limit: 5,
    sort_by: 'created_at',
    sort_order: 'desc'
  })

  // Colors for charts
  const COLORS = {
    [PaymentStatus.PENDING]: '#f59e0b',
    [PaymentStatus.COMPLETED]: '#10b981',
    [PaymentStatus.REJECTED]: '#ef4444',
    [PaymentStatus.EXPIRED]: '#6b7280'
  }

  // Prepare status distribution data for pie chart
  const statusData =
    statistics?.by_status.map((item) => ({
      name: getStatusDisplayName(item._id),
      value: item.count,
      color: COLORS[item._id],
      amount: item.total_amount
    })) || []

  // Prepare monthly revenue data for line chart
  const monthlyRevenueData =
    statistics?.monthly_revenue.map((item) => ({
      month: `${item._id.month}/${item._id.year}`,
      revenue: item.revenue,
      count: item.count
    })) || []

  // Calculate key metrics
  const totalRevenue = statistics?.total_revenue || 0
  const totalPayments = statistics?.by_status.reduce((sum, item) => sum + item.count, 0) || 0
  const completedPayments = statistics?.by_status.find((s) => s._id === PaymentStatus.COMPLETED)?.count || 0
  const pendingPayments = statistics?.by_status.find((s) => s._id === PaymentStatus.PENDING)?.count || 0
  const conversionRate = totalPayments > 0 ? (completedPayments / totalPayments) * 100 : 0

  function getStatusDisplayName(status: PaymentStatus): string {
    switch (status) {
      case PaymentStatus.PENDING:
        return 'Chờ xử lý'
      case PaymentStatus.COMPLETED:
        return 'Hoàn thành'
      case PaymentStatus.REJECTED:
        return 'Từ chối'
      case PaymentStatus.EXPIRED:
        return 'Hết hạn'
      default:
        return status
    }
  }

  if (statisticsLoading) {
    return (
      <div className='space-y-6'>
        {/* Loading skeleton */}
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {[...Array(4)].map((_, index) => (
            <div
              key={index}
              className='backdrop-blur-xl bg-white/50 border border-white/30 rounded-3xl p-6 animate-pulse'
            >
              <div className='h-4 bg-gray-200 rounded w-3/4 mb-4'></div>
              <div className='h-8 bg-gray-200 rounded w-1/2'></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className='space-y-8'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-3xl font-black text-gray-900'>Thống kê thanh toán</h2>
          <p className='text-gray-600 font-medium'>Theo dõi doanh thu và hiệu suất thanh toán</p>
        </div>
        <div className='flex items-center gap-4'>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className='px-4 py-2 bg-white/80 backdrop-blur border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300'
          >
            <option value='last_7_days'>7 ngày qua</option>
            <option value='last_30_days'>30 ngày qua</option>
            <option value='last_90_days'>90 ngày qua</option>
            <option value='last_year'>Năm qua</option>
          </select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
        <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300'>
          <div className='flex items-center'>
            <div className='w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-400 rounded-2xl flex items-center justify-center mr-4'>
              <DollarSign className='w-6 h-6 text-white' />
            </div>
            <div>
              <p className='text-sm font-medium text-gray-600'>Tổng doanh thu</p>
              <p className='text-2xl font-black text-gray-900'>{formatCurrency(totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300'>
          <div className='flex items-center'>
            <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-2xl flex items-center justify-center mr-4'>
              <CreditCard className='w-6 h-6 text-white' />
            </div>
            <div>
              <p className='text-sm font-medium text-gray-600'>Tổng thanh toán</p>
              <p className='text-2xl font-black text-gray-900'>{totalPayments}</p>
            </div>
          </div>
        </div>

        <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300'>
          <div className='flex items-center'>
            <div className='w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-400 rounded-2xl flex items-center justify-center mr-4'>
              <TrendingUp className='w-6 h-6 text-white' />
            </div>
            <div>
              <p className='text-sm font-medium text-gray-600'>Tỷ lệ thành công</p>
              <p className='text-2xl font-black text-gray-900'>{conversionRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300'>
          <div className='flex items-center'>
            <div className='w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-400 rounded-2xl flex items-center justify-center mr-4'>
              <Clock className='w-6 h-6 text-white' />
            </div>
            <div>
              <p className='text-sm font-medium text-gray-600'>Chờ xử lý</p>
              <p className='text-2xl font-black text-gray-900'>{pendingPayments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
        {/* Status Distribution Pie Chart */}
        <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-6 shadow-lg'>
          <h3 className='text-xl font-bold text-gray-900 mb-6'>Phân bố trạng thái</h3>
          <div className='h-80'>
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie
                  data={statusData}
                  cx='50%'
                  cy='50%'
                  outerRadius={100}
                  fill='#8884d8'
                  dataKey='value'
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any, name: any, props: any) => [
                    `${value} thanh toán`,
                    `${formatCurrency(props.payload.amount)}`
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Revenue Line Chart */}
        <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-6 shadow-lg'>
          <h3 className='text-xl font-bold text-gray-900 mb-6'>Doanh thu theo tháng</h3>
          <div className='h-80'>
            <ResponsiveContainer width='100%' height='100%'>
              <LineChart data={monthlyRevenueData}>
                <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
                <XAxis dataKey='month' stroke='#6b7280' fontSize={12} />
                <YAxis stroke='#6b7280' fontSize={12} tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(value as number), 'Doanh thu']}
                  labelStyle={{ color: '#374151' }}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Line
                  type='monotone'
                  dataKey='revenue'
                  stroke='#3b82f6'
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, stroke: '#3b82f6', strokeWidth: 2, fill: '#ffffff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Status Breakdown Bar Chart */}
      <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-6 shadow-lg'>
        <h3 className='text-xl font-bold text-gray-900 mb-6'>Chi tiết trạng thái thanh toán</h3>
        <div className='h-80'>
          <ResponsiveContainer width='100%' height='100%'>
            <BarChart data={statusData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray='3 3' stroke='#e5e7eb' />
              <XAxis dataKey='name' stroke='#6b7280' fontSize={12} />
              <YAxis stroke='#6b7280' fontSize={12} />
              <Tooltip
                formatter={(value: any, name: any, props: any) => [
                  `${value} thanh toán`,
                  `${formatCurrency(props.payload.amount)}`
                ]}
                labelStyle={{ color: '#374151' }}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Bar dataKey='value' radius={[8, 8, 0, 0]}>
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Payments */}
      {recentPayments && recentPayments.payments.length > 0 && (
        <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-6 shadow-lg'>
          <h3 className='text-xl font-bold text-gray-900 mb-6'>Thanh toán gần đây</h3>
          <div className='space-y-4'>
            {recentPayments.payments.map((payment) => (
              <div
                key={payment._id}
                className='flex items-center justify-between p-4 bg-white/50 rounded-2xl hover:bg-white/70 transition-all duration-300'
              >
                <div className='flex items-center'>
                  <div className='w-10 h-10 bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl flex items-center justify-center mr-4'>
                    <CreditCard className='w-5 h-5 text-blue-600' />
                  </div>
                  <div>
                    <div className='font-semibold text-gray-900'>
                      {payment.user?.name} (@{payment.user?.username})
                    </div>
                    <div className='text-sm text-gray-600'>
                      {payment.package?.name} • {formatCurrency(payment.amount)}
                    </div>
                  </div>
                </div>
                <div className='flex items-center gap-3'>
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      payment.status === PaymentStatus.PENDING
                        ? 'bg-yellow-100 text-yellow-800'
                        : payment.status === PaymentStatus.COMPLETED
                          ? 'bg-green-100 text-green-800'
                          : payment.status === PaymentStatus.REJECTED
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {payment.status === PaymentStatus.PENDING && <Clock className='w-4 h-4 mr-1' />}
                    {payment.status === PaymentStatus.COMPLETED && <CheckCircle className='w-4 h-4 mr-1' />}
                    {payment.status === PaymentStatus.REJECTED && <AlertCircle className='w-4 h-4 mr-1' />}
                    {getStatusDisplayName(payment.status)}
                  </span>
                  <div className='text-sm text-gray-500'>
                    {new Date(payment.created_at).toLocaleDateString('vi-VN')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentStatistics
