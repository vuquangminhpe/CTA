import React from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, Users, Award, ArrowRight, CheckCircle } from 'lucide-react'
import path from '@/constants/path'
import { getAccessTokenFromLS } from '@/utils/auth'
import SEOComponent from '@/components/SEO/SEOComponent.tsx/SEOComponent'

const Home = () => {
  const navigate = useNavigate()

  const features = [
    {
      icon: BookOpen,
      title: 'Ngân hàng đề thi',
      description: 'Tạo đề thi thông minh với AI, phân loại theo độ khó'
    },
    {
      icon: Users,
      title: 'Quản lý lớp học',
      description: 'Quản lý học sinh và theo dõi tiến độ học tập'
    },
    {
      icon: Award,
      title: 'Chấm điểm tự động',
      description: 'Hệ thống chấm điểm nhanh chóng và chính xác'
    }
  ]

  return (
    <>
      <SEOComponent
        title='Thionl - Nền tảng thi trực tuyến'
        description='Hệ thống thi trực tuyến với AI cho giáo dục'
        canonical='https://thionl.site/'
      />

      <div className='min-h-screen bg-neutral-50'>
        {/* Header */}
        <header className='bg-white border-b border-neutral-200'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 py-4'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-3'>
                <div className='w-10 h-10 bg-neutral-800 rounded-lg flex items-center justify-center'>
                  <BookOpen className='w-6 h-6 text-white' />
                </div>
                <span className='text-xl font-bold text-neutral-900'>Thionl</span>
              </div>

              <div className='flex items-center space-x-4'>
                {!getAccessTokenFromLS() && (
                  <>
                    <button
                      onClick={() => navigate(path.login)}
                      className='px-4 py-2 text-neutral-700 hover:text-neutral-900 font-medium'
                    >
                      Đăng nhập
                    </button>
                    <button
                      onClick={() => navigate(path.register)}
                      className='px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 font-medium'
                    >
                      Đăng ký
                    </button>
                  </>
                )}
                {getAccessTokenFromLS() && (
                  <button
                    onClick={() => navigate(path.home)}
                    className='px-6 py-2 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 font-medium'
                  >
                    Vào hệ thống
                  </button>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className='py-20 px-4'>
          <div className='max-w-4xl mx-auto text-center'>
            <h1 className='text-5xl font-bold text-neutral-900 mb-6'>
              Nền tảng thi trực tuyến
              <span className='block mt-2 text-neutral-600'>thông minh với AI</span>
            </h1>
            <p className='text-xl text-neutral-600 mb-8 max-w-2xl mx-auto'>
              Giải pháp toàn diện cho giáo viên và học sinh, tạo đề thi, quản lý và chấm điểm tự động
            </p>
            <div className='flex gap-4 justify-center'>
              <button
                onClick={() => navigate(path.register)}
                className='px-8 py-3 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 font-medium flex items-center gap-2'
              >
                Bắt đầu ngay
                <ArrowRight className='w-5 h-5' />
              </button>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className='py-12 px-4 bg-white border-y border-neutral-200'>
          <div className='max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8'>
            <div className='text-center'>
              <div className='text-3xl font-bold text-neutral-900 mb-2'>100+</div>
              <div className='text-neutral-600'>Học sinh</div>
            </div>
            <div className='text-center'>
              <div className='text-3xl font-bold text-neutral-900 mb-2'>40+</div>
              <div className='text-neutral-600'>Giáo viên</div>
            </div>
            <div className='text-center'>
              <div className='text-3xl font-bold text-neutral-900 mb-2'>99%</div>
              <div className='text-neutral-600'>Độ chính xác</div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className='py-20 px-4'>
          <div className='max-w-6xl mx-auto'>
            <div className='text-center mb-16'>
              <h2 className='text-4xl font-bold text-neutral-900 mb-4'>Tính năng nổi bật</h2>
              <p className='text-xl text-neutral-600'>Những công cụ cần thiết cho giáo dục hiện đại</p>
            </div>

            <div className='grid md:grid-cols-3 gap-8'>
              {features.map((feature, index) => (
                <div
                  key={index}
                  className='bg-white p-8 rounded-xl border border-neutral-200 hover:border-neutral-300 transition-colors'
                >
                  <div className='w-12 h-12 bg-neutral-100 rounded-lg flex items-center justify-center mb-4'>
                    <feature.icon className='w-6 h-6 text-neutral-700' />
                  </div>
                  <h3 className='text-xl font-bold text-neutral-900 mb-2'>{feature.title}</h3>
                  <p className='text-neutral-600'>{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className='py-20 px-4 bg-neutral-900 text-white'>
          <div className='max-w-4xl mx-auto text-center'>
            <h2 className='text-4xl font-bold mb-4'>Sẵn sàng bắt đầu?</h2>
            <p className='text-xl text-neutral-300 mb-8'>Tham gia cùng hàng trăm giáo viên đang sử dụng Thionl</p>
            <button
              onClick={() => navigate(path.register)}
              className='px-8 py-3 bg-white text-neutral-900 rounded-lg hover:bg-neutral-100 font-medium inline-flex items-center gap-2'
            >
              Đăng ký miễn phí
              <ArrowRight className='w-5 h-5' />
            </button>
          </div>
        </section>

        {/* Footer */}
        <footer className='bg-white border-t border-neutral-200 py-12 px-4'>
          <div className='max-w-6xl mx-auto'>
            <div className='flex flex-col md:flex-row justify-between items-center gap-4'>
              <div className='flex items-center space-x-3'>
                <div className='w-8 h-8 bg-neutral-800 rounded-lg flex items-center justify-center'>
                  <BookOpen className='w-5 h-5 text-white' />
                </div>
                <span className='text-lg font-bold text-neutral-900'>Thionl</span>
              </div>
              <div className='text-neutral-600'>© 2025 Thionl. Tất cả quyền được bảo lưu.</div>
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}

export default Home
