import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  const [activeSection, setActiveSection] = useState('home')

  useEffect(() => {
    const sections = ['features', 'process', 'pricing']
    const observers: IntersectionObserver[] = []

    sections.forEach((id) => {
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id)
        },
        { threshold: 0.3 }
      )
      obs.observe(el)
      observers.push(obs)
    })

    // Khi scroll lên đầu trang → active về 'home'
    const heroObs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setActiveSection('home')
      },
      { threshold: 0.2 }
    )
    const heroEl = document.getElementById('hero')
    if (heroEl) heroObs.observe(heroEl)

    return () => {
      observers.forEach((o) => o.disconnect())
      heroObs.disconnect()
    }
  }, [])

  const navLinks = [
    { label: 'Trang chủ', href: '#hero', id: 'home' },
    { label: 'Tính năng', href: '#features', id: 'features' },
    { label: 'Quy trình', href: '#process', id: 'process' },
    { label: 'Bảng giá', href: '#pricing', id: 'pricing' }
  ]

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;700;800&family=Inter:wght@300;400;600&family=Manrope:wght@500;700&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,300,0,0&display=swap');
        .material-symbols-outlined {
          font-family: 'Material Symbols Outlined';
          font-weight: normal;
          font-style: normal;
          font-size: 24px;
          line-height: 1;
          letter-spacing: normal;
          text-transform: none;
          display: inline-block;
          white-space: nowrap;
          word-wrap: normal;
          direction: ltr;
          font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
        }
        .home-bg-grid {
          background-image: radial-gradient(#eceef0 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .home-glass {
          backdrop-filter: blur(20px);
          background-color: rgba(255,255,255,0.6);
        }
        .home-glass-card {
          backdrop-filter: blur(12px);
          background: rgba(255,255,255,0.7);
          border: 1px solid rgba(255,255,255,0.3);
        }
        .home-flow-line {
          background: linear-gradient(90deg, transparent 0%, #00ccf9 50%, transparent 100%);
          background-size: 200% 100%;
          animation: homeFlow 3s linear infinite;
        }
        @keyframes homeFlow {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes homeFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-10px); }
        }
        .home-float-1 { animation: homeFloat 3.2s ease-in-out infinite; }
        .home-float-2 { animation: homeFloat 3.8s ease-in-out infinite 0.6s; }
        .home-float-3 { animation: homeFloat 2.9s ease-in-out infinite 1.2s; }
        .home-float-4 { animation: homeFloat 3.5s ease-in-out infinite 1.8s; }
        .home-font-headline { font-family: 'Noto Serif', serif; }
        .home-font-label    { font-family: 'Manrope', sans-serif; }
        .home-font-body     { font-family: 'Inter', sans-serif; }
        html { scroll-behavior: smooth; }
      `}</style>

      <div className='home-bg-grid home-font-body min-h-screen' style={{ background: '#f7f9fb', color: '#191c1e' }}>
        {/* ── Navbar ─────────────────────────────────────── */}
        <header
          className='fixed top-0 w-full z-50 shadow-sm transition-colors duration-300'
          style={{ backdropFilter: 'blur(20px)', backgroundColor: 'rgba(255,255,255,0.6)' }}
        >
          <nav className='flex justify-between items-center px-8 py-4 max-w-7xl mx-auto'>
            <Link to='/'>
              <img src='/images/logo.png' alt='Thionl Logo' className='h-10 w-auto object-contain' />
            </Link>
            <div className='hidden md:flex space-x-10 items-center'>
              {navLinks.map(({ label, href, id }) => {
                const isActive = activeSection === id
                return (
                  <a
                    key={id}
                    href={href}
                    className='text-sm home-font-label transition-all duration-200 pb-0.5'
                    style={
                      isActive
                        ? { color: '#00ccf9', fontWeight: 600, borderBottom: '2px solid #00ccf9' }
                        : { color: '#44474d', borderBottom: '2px solid transparent' }
                    }
                  >
                    {label}
                  </a>
                )
              })}
            </div>
            <Link to='/login'>
              <button
                className='px-6 py-2 rounded-md home-font-label text-sm text-white hover:opacity-80 transition-opacity active:scale-95 duration-200'
                style={{ backgroundColor: '#0d1c32' }}
              >
                Bắt đầu ngay
              </button>
            </Link>
          </nav>
        </header>

        {/* ── Hero ───────────────────────────────────────── */}
        <section
          id='hero'
          className='relative min-h-screen pt-32 pb-20 px-8 flex flex-col justify-center overflow-hidden'
        >
          <div className='max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center'>
            {/* Left */}
            <div className='lg:col-span-6 z-10'>
              <div
                className='inline-flex items-center space-x-2 px-4 py-1.5 rounded-full mb-8'
                style={{ backgroundColor: 'rgba(0,204,249,0.08)' }}
              >
                <span className='w-2 h-2 rounded-full' style={{ backgroundColor: '#00ccf9' }} />
                <span
                  className='text-xs home-font-label uppercase tracking-widest font-bold'
                  style={{ color: '#005266' }}
                >
                  Thế hệ khảo thí mới
                </span>
              </div>

              <h1 className='home-font-headline text-7xl md:text-8xl font-extrabold leading-tight mb-8 tracking-tighter'>
                Thi thật — <br />
                <span
                  className='text-transparent bg-clip-text'
                  style={{ backgroundImage: 'linear-gradient(to right, #0d1c32, #00677f)' }}
                >
                  Học thật.
                </span>
              </h1>

              <p className='text-lg md:text-xl max-w-xl mb-12 leading-relaxed' style={{ color: '#44474d' }}>
                Nền tảng khảo thí trí tuệ nhân tạo đầu tiên tại Việt Nam đảm bảo tính minh bạch tuyệt đối và phân tích
                lộ trình học tập cá nhân hóa thông qua hệ thống AI Proctoring đa tầng.
              </p>

              <div className='flex flex-wrap gap-4'>
                <Link to='/student'>
                  <button
                    className='px-10 py-4 rounded-md home-font-label font-bold text-lg hover:brightness-110 transition-all shadow-lg'
                    style={{
                      backgroundColor: '#00ccf9',
                      color: '#005266',
                      boxShadow: '0 8px 24px rgba(0,204,249,0.25)'
                    }}
                  >
                    Trải nghiệm ngay
                  </button>
                </Link>
              </div>
            </div>

            {/* Right — 5-image cluster */}
            <div className='lg:col-span-6 relative h-full min-h-[520px] flex items-center justify-center'>
              <div
                className='absolute inset-0 rounded-full blur-3xl -z-10'
                style={{ background: 'radial-gradient(ellipse at center, rgba(0,204,249,0.15) 0%, transparent 70%)' }}
              />

              {/*
                Root cause fix: CSS animation (transform: translateY) overrides inline transform: rotateY/X.
                Solution: 2-layer wrapper — outer holds static 3D rotation, inner runs float animation.
              */}
              {/* perspective đủ để con rotate 3D; KHÔNG dùng preserve-3d ở đây vì sẽ vô hiệu z-index */}
              <div className='relative w-full max-w-[500px] h-[580px]' style={{ perspective: '1000px' }}>
                {/* VR1 — Top Left: outer=3D rotation, inner=float */}
                <div
                  className='absolute top-6 left-0 w-[125px] h-[150px] z-30'
                  style={{ transform: 'rotateY(22deg) rotateX(-12deg)', transformStyle: 'preserve-3d' }}
                >
                  <div
                    className='home-float-1 w-full h-full rounded-xl overflow-hidden'
                    style={{
                      opacity: 0.82,
                      border: '1.5px solid rgba(255,255,255,0.5)',
                      boxShadow: '0 10px 28px rgba(0,0,0,0.2)'
                    }}
                  >
                    <img src='/images/vr1.png' alt='AI Monitoring 1' className='w-full h-full object-cover' />
                  </div>
                </div>

                {/* VR3 — Top Right */}
                <div
                  className='absolute top-6 right-0 w-[125px] h-[150px] z-30'
                  style={{ transform: 'rotateY(-22deg) rotateX(-12deg)', transformStyle: 'preserve-3d' }}
                >
                  <div
                    className='home-float-2 w-full h-full rounded-xl overflow-hidden'
                    style={{
                      opacity: 0.82,
                      border: '1.5px solid rgba(255,255,255,0.5)',
                      boxShadow: '0 10px 28px rgba(0,0,0,0.2)'
                    }}
                  >
                    <img src='/images/vr3.png' alt='AI Monitoring 3' className='w-full h-full object-cover' />
                  </div>
                </div>

                {/* Middle — HERO (ảnh chính to nhất, không rotate) */}
                <div
                  className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[360px] h-[440px] rounded-3xl overflow-hidden z-20'
                  style={{
                    border: '3px solid rgba(0,204,249,0.55)',
                    boxShadow: '0 40px 80px rgba(0,0,0,0.25), 0 0 50px rgba(0,204,249,0.18)'
                  }}
                >
                  <img src='/images/middle.png' alt='Student Exam' className='w-full h-full object-cover' />
                  <div className='absolute inset-0 pointer-events-none'>
                    <div className='absolute top-4 left-4 flex flex-col gap-2'>
                      <div
                        className='flex items-center space-x-1.5 text-[10px] home-font-label px-2.5 py-1.5 rounded'
                        style={{ color: '#67e8f9', backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
                      >
                        <span className='w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse' />
                        <span>EYE TRACKING: ACTIVE</span>
                      </div>
                      <div
                        className='flex items-center space-x-1.5 text-[10px] home-font-label px-2.5 py-1.5 rounded'
                        style={{ color: '#86efac', backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)' }}
                      >
                        <span className='w-1.5 h-1.5 rounded-full bg-green-400' />
                        <span>IDENTITY: VERIFIED</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* VR4 — Bottom Left */}
                <div
                  className='absolute bottom-6 left-0 w-[125px] h-[150px] z-30'
                  style={{ transform: 'rotateY(22deg) rotateX(12deg)', transformStyle: 'preserve-3d' }}
                >
                  <div
                    className='home-float-3 w-full h-full rounded-xl overflow-hidden'
                    style={{
                      opacity: 0.82,
                      border: '1.5px solid rgba(255,255,255,0.5)',
                      boxShadow: '0 10px 28px rgba(0,0,0,0.2)'
                    }}
                  >
                    <img src='/images/vr4.png' alt='AI Monitoring 4' className='w-full h-full object-cover' />
                  </div>
                </div>

                {/* VR5 — Bottom Right */}
                <div
                  className='absolute bottom-6 right-0 w-[125px] h-[150px] z-30'
                  style={{ transform: 'rotateY(-22deg) rotateX(12deg)', transformStyle: 'preserve-3d' }}
                >
                  <div
                    className='home-float-4 w-full h-full rounded-xl overflow-hidden'
                    style={{
                      opacity: 0.82,
                      border: '1.5px solid rgba(255,255,255,0.5)',
                      boxShadow: '0 10px 28px rgba(0,0,0,0.2)'
                    }}
                  >
                    <img src='/images/vr5.png' alt='AI Monitoring 5' className='w-full h-full object-cover' />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Stats ──────────────────────────────────────── */}
        <section className='py-20' style={{ backgroundColor: '#0d1c32', color: 'white' }}>
          <div className='max-w-7xl mx-auto px-8'>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-12 text-center'>
              {[
                { value: '1M+', label: 'Kỳ thi đã tổ chức' },
                { value: '500+', label: 'Trường đối tác' },
                { value: '24/7', label: 'AI Giám sát' },
                { value: '98%', label: 'Hài lòng' }
              ].map(({ value, label }) => (
                <div key={label} className='space-y-2'>
                  <h3 className='text-5xl home-font-headline font-bold' style={{ color: '#00ccf9' }}>
                    {value}
                  </h3>
                  <p className='text-sm home-font-label uppercase tracking-widest' style={{ color: '#76849f' }}>
                    {label}
                  </p>
                </div>
              ))}
            </div>
            <div className='mt-20 flex flex-wrap justify-center items-center gap-12 opacity-40 hover:opacity-70 transition-all duration-500'>
              {['EduTech Lab', 'VNU Institute', 'SmartLearning', 'Global Academy'].map((name) => (
                <span key={name} className='home-font-headline text-2xl font-bold'>
                  {name}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ───────────────────────────────────── */}
        <section id='features' className='py-32 px-8 overflow-hidden'>
          <div className='max-w-7xl mx-auto'>
            <div className='mb-24 max-w-2xl'>
              <h2 className='home-font-headline text-5xl font-bold mb-6'>
                Công nghệ định hình <br /> tương lai giáo dục
              </h2>
              <div className='h-1 w-20' style={{ backgroundColor: '#00ccf9' }} />
            </div>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
              {[
                {
                  icon: 'visibility',
                  title: 'AI Giám Sát',
                  desc: 'Công nghệ Proctoring tiên tiến theo dõi cử động mắt, nhận diện khuôn mặt và tư thế để đảm bảo tính trung thực tuyệt đối.',
                  items: [
                    'Iris Tracking & Face Matching',
                    'Chống chuyển thẻ (Tab switching)',
                    'Chống chụp ảnh màn hình',
                    'Phát hiện quay trái/phải & dùng điện thoại'
                  ]
                },
                {
                  icon: 'qr_code_2',
                  title: 'Thi Nhanh',
                  desc: 'Vào phòng thi tức thì bằng mã QR. Hệ thống chấm điểm tự động hỗ trợ cả trắc nghiệm và câu hỏi tự luận ngắn.',
                  items: ['QR Entry — Vào phòng 1-click', 'Auto-Grading — Chấm điểm AI']
                },
                {
                  icon: 'insights',
                  title: 'Phân Tích Thông Minh',
                  desc: 'Thống kê chi tiết điểm mạnh/yếu của từng học sinh và gợi ý lộ trình học tập tối ưu dựa trên dữ liệu thực tế.',
                  items: ['Performance Insights', 'Personalized Learning Paths']
                }
              ].map((card) => (
                <div
                  key={card.title}
                  className='group bg-white p-10 rounded-xl transition-all duration-500 hover:-translate-y-4 border'
                  style={{ borderColor: 'rgba(197,198,205,0.15)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 24px 48px rgba(13,28,50,0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '')}
                >
                  <div
                    className='w-16 h-16 flex items-center rounded-full justify-center  mb-8 transition-colors duration-500'
                    style={{ backgroundColor: '#0d1c32' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#00ccf9')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0d1c32')}
                  >
                    <span
                      className='material-symbols-outlined text-white text-5xl'
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {card.icon}
                    </span>
                  </div>
                  <h3 className='text-2xl font-bold mb-4 home-font-headline'>{card.title}</h3>
                  <p className='leading-relaxed mb-6' style={{ color: '#44474d' }}>
                    {card.desc}
                  </p>
                  <ul className='space-y-3'>
                    {card.items.map((item) => (
                      <li key={item} className='flex items-start text-sm home-font-label' style={{ color: '#44474d' }}>
                        <span className='material-symbols-outlined text-lg mr-2 mt-0.5' style={{ color: '#00ccf9' }}>
                          check_circle
                        </span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Process ────────────────────────────────────── */}
        <section id='process' className='py-32 px-8 relative overflow-hidden' style={{ backgroundColor: '#f8fafc' }}>
          <div className='max-w-7xl mx-auto relative z-10'>
            <div className='text-center mb-24'>
              <div
                className='inline-block px-4 py-1 rounded-full text-xs font-bold home-font-label uppercase tracking-widest mb-4'
                style={{ backgroundColor: 'rgba(13,28,50,0.05)', color: '#0d1c32' }}
              >
                Quy trình vận hành 4.0
              </div>
              <p style={{ color: '#44474d' }}>Hệ thống hóa trải nghiệm khảo thí kỹ thuật số toàn diện.</p>
            </div>
            <div className='relative'>
              <div className='absolute top-24 left-1/2 -translate-x-1/2 w-4/5 h-[2px] home-flow-line hidden lg:block opacity-30' />
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12'>
                {[
                  {
                    icon: 'psychology',
                    step: '01',
                    title: 'Khởi tạo đề thi AI',
                    desc: 'Tạo ngân hàng câu hỏi thông minh chỉ trong vài giây với trợ lý AI NLP tiên tiến.',
                    offset: false
                  },
                  {
                    icon: 'qr_code_scanner',
                    step: '02',
                    title: 'Vào phòng QR',
                    desc: 'Thí sinh quét mã để truy cập tức thì.',
                    offset: true
                  },
                  {
                    icon: 'security',
                    step: '03',
                    title: 'AI Live Monitoring',
                    desc: 'AI liên tục phân tích hành vi và môi trường xung quanh thời gian thực.',
                    offset: false
                  },
                  {
                    icon: 'analytics',
                    step: '04',
                    title: 'Báo cáo tức thì',
                    desc: 'Nhận kết quả và phân tích hổng kiến thức chi tiết ngay sau khi hoàn thành.',
                    offset: true
                  }
                ].map(({ icon, step, title, desc, offset }) => (
                  <div key={step} className={`relative group ${offset ? 'lg:mt-12' : ''}`}>
                    <div
                      className='home-glass-card p-8 rounded-2xl transition-all duration-300 group-hover:-translate-y-2 relative z-10'
                      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)')}
                      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '')}
                    >
                      <div
                        className='w-20 h-20 bg-white shadow-lg rounded-2xl flex items-center justify-center mb-6 relative overflow-hidden transition-colors duration-500'
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0d1c32')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                      >
                        <span
                          className='material-symbols-outlined text-3xl transition-colors relative z-10'
                          style={{ color: '#0d1c32' }}
                        >
                          {icon}
                        </span>
                        <div
                          className='absolute right-0 bottom-0 home-font-headline text-4xl font-bold select-none leading-none'
                          style={{ color: '#0d1c32', opacity: 0.15 }}
                        >
                          {step}
                        </div>
                      </div>
                      <h4 className='font-bold text-xl mb-3 home-font-headline'>{title}</h4>
                      <p className='text-sm leading-relaxed' style={{ color: '#44474d' }}>
                        {desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className='absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-cyan-50/50 to-transparent -z-0' />
        </section>

        {/* ── Pricing ────────────────────────────────────── */}
        <section id='pricing' className='py-32 px-8'>
          <div className='max-w-7xl mx-auto'>
            <div className='text-center mb-20'>
              <h2 className='home-font-headline text-5xl font-bold mb-4'>Gói dịch vụ linh hoạt</h2>
              <p style={{ color: '#44474d' }}>Lựa chọn giải pháp phù hợp với quy mô tổ chức của bạn.</p>
            </div>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-8 items-end'>
              {/* Free */}
              <div className='bg-white p-10 rounded-xl border' style={{ borderColor: 'rgba(197,198,205,0.2)' }}>
                <p
                  className='home-font-label text-xs uppercase tracking-widest font-bold mb-4'
                  style={{ color: '#44474d' }}
                >
                  Cá nhân
                </p>
                <div className='mb-8'>
                  <span className='text-4xl home-font-headline font-bold'>Miễn phí</span>
                </div>
                <ul className='space-y-4 mb-10 text-sm'>
                  {['Tối đa 50 thí sinh / tháng', 'Giám sát cơ bản'].map((item) => (
                    <li key={item} className='flex items-center'>
                      <span className='material-symbols-outlined mr-3 text-lg' style={{ color: '#00677f' }}>
                        check
                      </span>
                      {item}
                    </li>
                  ))}
                  <li className='flex items-center opacity-30'>
                    <span className='material-symbols-outlined mr-3 text-lg'>close</span>Phân tích AI nâng cao
                  </li>
                </ul>
                <button
                  className='w-full py-4 rounded-md home-font-label font-bold border hover:text-white transition-all'
                  style={{ borderColor: '#0d1c32' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0d1c32'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = ''
                    e.currentTarget.style.color = ''
                  }}
                >
                  Bắt đầu ngay
                </button>
              </div>

              {/* Pro */}
              <div
                className='p-12 rounded-xl relative shadow-2xl scale-105 z-20 text-white'
                style={{ backgroundColor: '#0d1c32', boxShadow: '0 25px 50px rgba(13,28,50,0.4)' }}
              >
                <div
                  className='absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold home-font-label uppercase whitespace-nowrap'
                  style={{ backgroundColor: '#00ccf9', color: '#005266' }}
                >
                  Phổ biến nhất
                </div>
                <p
                  className='home-font-label text-xs uppercase tracking-widest font-bold mb-4'
                  style={{ color: '#76849f' }}
                >
                  Trường học / Trung tâm
                </p>
                <div className='mb-8'>
                  <span className='text-4xl home-font-headline font-bold'>2.9tr</span>
                  <span className='home-font-label' style={{ color: '#76849f' }}>
                    {' '}
                    / tháng
                  </span>
                </div>
                <ul className='space-y-4 mb-10 text-sm'>
                  {[
                    'Không giới hạn thí sinh',
                    'AI Giám sát toàn diện (Iris/Face)',
                    'Xuất báo cáo chi tiết',
                    'Hỗ trợ 24/7'
                  ].map((item) => (
                    <li key={item} className='flex items-center'>
                      <span className='material-symbols-outlined mr-3 text-lg' style={{ color: '#00ccf9' }}>
                        check
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  className='w-full py-4 rounded-md home-font-label font-bold hover:brightness-110 transition-all'
                  style={{ backgroundColor: '#00ccf9', color: '#005266', boxShadow: '0 8px 20px rgba(0,204,249,0.3)' }}
                >
                  Nâng cấp Pro
                </button>
              </div>

              {/* Enterprise */}
              <div className='bg-white p-10 rounded-xl border' style={{ borderColor: 'rgba(197,198,205,0.2)' }}>
                <p
                  className='home-font-label text-xs uppercase tracking-widest font-bold mb-4'
                  style={{ color: '#44474d' }}
                >
                  Doanh nghiệp
                </p>
                <div className='mb-8'>
                  <span className='text-4xl home-font-headline font-bold'>Liên hệ</span>
                </div>
                <ul className='space-y-4 mb-10 text-sm'>
                  {['Tích hợp API riêng', 'Tùy chỉnh thương hiệu', 'Bảo mật cấp độ cao nhất'].map((item) => (
                    <li key={item} className='flex items-center'>
                      <span className='material-symbols-outlined mr-3 text-lg' style={{ color: '#00677f' }}>
                        check
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  className='w-full py-4 rounded-md home-font-label font-bold border hover:text-white transition-all'
                  style={{ borderColor: '#0d1c32' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#0d1c32'
                    e.currentTarget.style.color = 'white'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = ''
                    e.currentTarget.style.color = ''
                  }}
                >
                  Liên hệ tư vấn
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ─────────────────────────────────────── */}
        <footer className='w-full py-12 px-8' style={{ backgroundColor: '#0A192F' }}>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-12 max-w-7xl mx-auto'>
            <div className='space-y-6'>
              <div className='text-xl home-font-headline text-white'>Thiol</div>
              <p className='text-sm leading-relaxed' style={{ color: '#94a3b8' }}>
                Tiên phong trong việc áp dụng AI vào quy trình khảo thí hiện đại, minh bạch và hiệu quả tại Việt Nam.
              </p>
            </div>
            <div className='space-y-4'>
              <h5 className='text-white font-bold home-font-label text-sm uppercase tracking-widest'>Sản phẩm</h5>
              <ul className='space-y-2'>
                {['AI Proctoring', 'Smart Grading', 'Insights Dashboard'].map((item) => (
                  <li key={item}>
                    <a href='#' className='text-sm transition-all hover:text-cyan-400' style={{ color: '#cbd5e1' }}>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className='space-y-4'>
              <h5 className='text-white font-bold home-font-label text-sm uppercase tracking-widest'>Pháp lý</h5>
              <ul className='space-y-2'>
                {['Privacy Policy', 'Terms of Service', 'Cookie Settings'].map((item) => (
                  <li key={item}>
                    <a href='#' className='text-sm transition-all hover:text-cyan-400' style={{ color: '#cbd5e1' }}>
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className='space-y-4'>
              <h5 className='text-white font-bold home-font-label text-sm uppercase tracking-widest'>Newsletter</h5>
              <p className='text-xs' style={{ color: '#94a3b8' }}>
                Cập nhật những tính năng AI mới nhất.
              </p>
              <div className='flex'>
                <input
                  className='text-white text-sm rounded-l-md w-full px-3 py-2 outline-none focus:ring-1 focus:ring-cyan-400'
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                  placeholder='Email của bạn'
                  type='email'
                />
                <button
                  className='px-4 py-2 rounded-r-md font-bold'
                  style={{ backgroundColor: '#67e8f9', color: '#0A192F' }}
                >
                  <span className='material-symbols-outlined text-sm'>send</span>
                </button>
              </div>
            </div>
          </div>
          <div
            className='max-w-7xl mx-auto mt-20 pt-8 flex flex-col md:flex-row justify-between items-center text-xs'
            style={{ borderTop: '1px solid rgba(255,255,255,0.05)', color: '#64748b' }}
          >
            <p>© 2024 Thiol. All rights reserved.</p>
            <div className='flex space-x-6 mt-4 md:mt-0'>
              {['Facebook', 'LinkedIn', 'YouTube'].map((social) => (
                <a key={social} href='#' className='hover:text-white transition-colors'>
                  {social}
                </a>
              ))}
            </div>
          </div>
        </footer>
      </div>
    </>
  )
}
