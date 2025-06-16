import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import './Home.css'
import BlurText from '@/components/ui/BlurText';
import ScrollReveal from '@/components/ui/ScrollReveal';
import { AuthContext } from '@/Contexts/auth.context';
import { UserRole } from '@/types/User.type';
import { clearLocalStorage } from '@/utils/auth';

function Home() {
  const navigate = useNavigate();
  const { isAuthenticated, role, reset } = useContext(AuthContext);  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);  const [currentBanner, setCurrentBanner] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [startX, setStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const banners = ['/banner1.png', '/banner2.png', '/banner3.png', '/banner4.png'];

  // Handle scroll for header transparency
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Check if user is already logged in and redirect to appropriate dashboard
  useEffect(() => {
    if (isAuthenticated && role) {
      switch (role) {
        case UserRole.Teacher:
          navigate('/teacher', { replace: true });
          break;
        case UserRole.Student:
          navigate('/student', { replace: true });
          break;
        case UserRole.Admin:
          navigate('/admin', { replace: true });
          break;
        default:
          break;
      }
    }
  }, [isAuthenticated, role, navigate]);  // Auto-change banner every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  // Handle swipe/drag functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    setStartX(e.clientX);
    setIsDragging(true);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const endX = e.clientX;
    const diff = startX - endX;
    
    if (Math.abs(diff) > 50) { // Minimum swipe distance
      if (diff > 0) {
        // Swiped left - next banner
        setCurrentBanner((prev) => (prev + 1) % banners.length);
      } else {
        // Swiped right - previous banner
        setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
      }
    }
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const endX = e.changedTouches[0].clientX;
    const diff = startX - endX;
    
    if (Math.abs(diff) > 50) { // Minimum swipe distance
      if (diff > 0) {
        // Swiped left - next banner
        setCurrentBanner((prev) => (prev + 1) % banners.length);
      } else {
        // Swiped right - previous banner
        setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length);
      }
    }
    setIsDragging(false);
  };

  // Debug function for navigation
  const handleNavigation = (destination: string) => {
    console.log('Navigating to:', destination);
    navigate(destination);
  };

  // Handle logout
  const handleLogout = () => {
    // Clear auth state using utility function
    clearLocalStorage();
    reset();
    // Navigate to login page
    navigate('/login', { replace: true });
  };
  // Intersection Observer for scroll animations
  useEffect(() => {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate');
        }
      });
    }, observerOptions);

    // Observe all elements with animate-on-scroll class
    const animateElements = document.querySelectorAll('.animate-on-scroll');
    animateElements.forEach(el => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      title: "Ngân hàng đề thi",
      description: "Tạo và quản lý ngân hàng đề thi phong phú, phân loại theo môn học và cấp lớp một cách khoa học",
      icon: "📚"
    },
    {
      title: "Tổ chức thi online",
      description: "Lịch thi tự động, thông báo thông minh và hệ thống thi trực tuyến an toàn, bảo mật cao",
      icon: "💻"
    },
    {
      title: "Chấm điểm thông minh",
      description: "Hệ thống chấm điểm tự động và thủ công, lưu trữ kết quả chi tiết và phân tích sâu",
      icon: "🎯"
    },
    {
      title: "Phân tích học sinh",
      description: "Phân tích dữ liệu thi để xác định điểm yếu, điểm mạnh của từng học sinh một cách chính xác",
      icon: "📊"
    },
    {
      title: "Bài tập cá nhân hóa",
      description: "Gợi ý bài tập phù hợp dựa trên kết quả phân tích, giúp học sinh cải thiện hiệu quả",
      icon: "🎓"
    },
    {
      title: "Giám sát chống gian lận",
      description: "Hệ thống giám sát tiên tiến với nhiều biện pháp ngăn chặn gian lận hiệu quả",
      icon: "🛡️"
    }  ];

  return (
    <>
      <Helmet>
        <title>Thionl - Hệ thống quản lý thi cử thông minh</title>        <meta name="description" content="Phần mềm web quản lý thi cử toàn diện cho học sinh cấp 1, 2, 3. Hỗ trợ giáo viên và nhà trường tổ chức thi, phân tích kết quả, cá nhân hóa bài tập và giám sát chống gian lận." />
        <meta name="keywords" content="quản lý thi cử, thi online, giáo dục, chống gian lận, phân tích học sinh" />
        <meta property="og:title" content="Thionl - Hệ thống quản lý thi cử thông minh" />
        <meta property="og:description" content="Giải pháp toàn diện cho việc quản lý thi cử hiện đại" />
        <meta property="og:type" content="website" />
      </Helmet>
      
      <div className="min-h-screen bg-gray-50">      {/* Header */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-lg' : 'bg-transparent'
      }`}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">            <div className="flex items-center space-x-3">
              <img src="/logo2.png" alt="Thionl Logo" className="h-10 w-auto" />
              <h1 className={`text-2xl font-bold transition-colors duration-300 ${
                isScrolled ? 'text-gray-800' : 'text-white'
              }`}>Thionl</h1>
            </div><nav className="hidden md:flex space-x-8">
              <a href="#features" className={`transition ${
                isScrolled ? 'text-gray-600 hover:text-purple-600' : 'text-white hover:text-purple-200'
              }`}>Tính năng</a>
              <a href="#about" className={`transition ${
                isScrolled ? 'text-gray-600 hover:text-purple-600' : 'text-white hover:text-purple-200'
              }`}>Giới thiệu</a>
              <a href="#contact" className={`transition ${
                isScrolled ? 'text-gray-600 hover:text-purple-600' : 'text-white hover:text-purple-200'
              }`}>Liên hệ</a>
            </nav>            <div className="flex items-center space-x-4">
              {!isAuthenticated ? (
                <button 
                  className={`btn-primary px-6 py-2 rounded-lg font-semibold transition ${
                    isScrolled ? 'text-white' : 'text-purple-600 bg-white'
                  }`} 
                  onClick={() => handleNavigation('/login')}
                >
                  Bắt đầu ngay
                </button>
              ) : (
                <div className="flex items-center space-x-3">
                  <button 
                    className={`btn-primary px-6 py-2 rounded-lg font-semibold transition ${
                      isScrolled ? 'text-white' : 'text-purple-600 bg-white'
                    }`} 
                    onClick={() => handleNavigation('/dashboard')}
                  >
                    Vào Dashboard
                  </button>
                  <button 
                    className={`px-3 py-2 rounded-lg border transition ${
                      isScrolled 
                        ? 'text-gray-600 hover:text-red-600 border-gray-300 hover:border-red-300' 
                        : 'text-white hover:text-red-200 border-white hover:border-red-200'
                    }`} 
                    onClick={handleLogout}
                  >
                    Đăng xuất
                  </button>
                </div>
              )}
                {/* Mobile menu button */}
              <button 
                className={`md:hidden p-2 transition ${
                  isScrolled ? 'text-gray-600' : 'text-white'
                }`}
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>          {/* Mobile menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden border-t border-gray-200 py-4">
              <nav className="flex flex-col space-y-4">
                <a 
                  href="#features" 
                  className="text-gray-600 hover:text-purple-600 transition"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Tính năng
                </a>
                <a 
                  href="#about" 
                  className="text-gray-600 hover:text-purple-600 transition"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Giới thiệu
                </a>
                <a 
                  href="#contact" 
                  className="text-gray-600 hover:text-purple-600 transition"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Liên hệ
                </a>
                {isAuthenticated && (
                  <div className="border-t border-gray-200 pt-4 mt-4 space-y-3">
                    <button 
                      className="w-full text-left text-purple-600 hover:text-purple-800 transition"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleNavigation('/dashboard');
                      }}
                    >
                      Vào Dashboard
                    </button>
                    <button 
                      className="w-full text-left text-red-600 hover:text-red-800 transition"
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        handleLogout();
                      }}
                    >
                      Đăng xuất
                    </button>
                  </div>
                )}
              </nav>
            </div>
          )}
        </div>
      </header>      {/* Hero Banner Carousel - Full Screen with Horizontal Thumbnails */}
      <section className="relative h-screen overflow-hidden">
        <div 
          id="horizontal-thumbnails" 
          className="relative w-full h-full"
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div className="carousel h-full">
            {/* Main Banner Display - Full Screen */}
            <div className="carousel-body h-full relative overflow-hidden cursor-grab active:cursor-grabbing select-none">
              {banners.map((banner, index) => (
                <div
                  key={index}
                  className={`carousel-slide absolute inset-0 transition-all duration-700 ease-in-out ${
                    index === currentBanner 
                      ? 'opacity-100 transform translate-x-0' 
                      : index < currentBanner 
                        ? 'opacity-0 transform -translate-x-full'
                        : 'opacity-0 transform translate-x-full'
                  }`}
                >
                  <div className="flex size-full justify-center">
                    <img
                      src={banner}
                      alt={`Banner ${index + 1}`}
                      className="size-full object-cover"
                      draggable={false}
                    />
                    {/* Darker overlay for better contrast */}
                    <div className="absolute inset-0 bg-black/40"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Horizontal Thumbnail Navigation - Overlay */}
            <div className="carousel-pagination absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 bg-black/60 backdrop-blur-md rounded-xl px-6 py-3">
              <div className="flex justify-center items-center gap-3">
                {banners.map((banner, index) => (
                  <img
                    key={index}
                    src={banner}
                    alt={`Thumbnail ${index + 1}`}
                    className={`h-12 w-16 md:h-14 md:w-20 object-cover rounded-lg cursor-pointer transition-all duration-300 ${
                      index === currentBanner 
                        ? 'opacity-100 ring-2 ring-white scale-110 shadow-lg' 
                        : 'opacity-50 hover:opacity-80'
                    }`}
                    onClick={() => setCurrentBanner(index)}
                  />
                ))}
              </div>
            </div>

            {/* Navigation Arrows */}
            <button
              type="button"
              className="carousel-prev absolute left-5 top-1/2 transform -translate-y-1/2 size-12 bg-white/90 hover:bg-white flex items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-20"
              onClick={() => setCurrentBanner((prev) => (prev - 1 + banners.length) % banners.length)}
            >
              <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="sr-only">Previous</span>
            </button>

            <button
              type="button"
              className="carousel-next absolute right-5 top-1/2 transform -translate-y-1/2 size-12 bg-white/90 hover:bg-white flex items-center justify-center rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-20"
              onClick={() => setCurrentBanner((prev) => (prev + 1) % banners.length)}
            >
              <svg className="w-5 h-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span className="sr-only">Next</span>
            </button>

            {/* Progress Dots */}
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
              {banners.map((_, index) => (
                <button
                  key={index}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentBanner 
                      ? 'bg-white scale-125' 
                      : 'bg-white/50 hover:bg-white/75'
                  }`}
                  onClick={() => setCurrentBanner(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Hero Content Section - Below Banner */}
      <section className="bg-gradient-to-r from-purple-600 via-blue-600 to-purple-700 text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              <BlurText
                text="Hệ thống quản lý thi cử thông minh"
                delay={100}
                animateBy="words"
                direction="top"
                className="text-white"
              />
            </h1>
            <ScrollReveal baseOpacity={0.3}>
              <p className="text-lg md:text-xl mb-10 leading-relaxed opacity-90">
                Phát triển một phần mềm web quản lý thi cử toàn diện cho học sinh cấp 1, 2, 3. 
                Hỗ trợ giáo viên và nhà trường tổ chức thi, phân tích kết quả, cá nhân hóa bài tập 
                và giám sát chống gian lận một cách hiệu quả.
              </p>
            </ScrollReveal>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <button 
                className="bg-white text-purple-600 px-10 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition transform hover:scale-105 shadow-lg"
                onClick={() => handleNavigation(isAuthenticated ? '/dashboard' : '/login')}
              >
                {isAuthenticated ? 'Vào Dashboard' : 'Tìm hiểu thêm'}
              </button>
              <button 
                className="border-2 border-white text-white px-10 py-4 rounded-lg font-semibold text-lg hover:bg-white hover:text-purple-600 transition transform hover:scale-105"
                onClick={() => handleNavigation(isAuthenticated ? '/dashboard' : '/register')}
              >
                {isAuthenticated ? 'Quản lý' : 'Xem demo'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="animate-on-scroll">
              <ScrollReveal>
                <h2 className="text-4xl font-bold text-gray-800 mb-4">Các tính năng chính</h2>
              </ScrollReveal>
            </div>
            <div className="animate-on-scroll">
              <ScrollReveal>
                <p className="text-xl text-gray-600">
                  Giải pháp toàn diện cho việc quản lý thi cử hiện đại
                </p>
              </ScrollReveal>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className={`feature-card bg-gray-50 p-8 rounded-xl animate-on-scroll animate-delay-${(index + 1) * 100}`}>
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-4">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>      </section>

      {/* About Section */}
      <section id="about" className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">            <div className="animate-on-scroll">
              <ScrollReveal>
                <h2 className="text-4xl font-bold text-gray-800 mb-4">Về Thionl</h2>
              </ScrollReveal>
            </div>
            <div className="animate-on-scroll">
              <ScrollReveal>
                <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                  Thionl được phát triển với mục tiêu hiện đại hóa hệ thống giáo dục Việt Nam, 
                  mang đến giải pháp công nghệ tiên tiến cho việc quản lý và tổ chức thi cử.
                </p>
              </ScrollReveal>
            </div>
          </div>
          
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="animate-on-scroll text-center">
              <div className="bg-white p-8 rounded-xl shadow-lg h-full">
                <div className="text-5xl mb-6">🎯</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Sử mệnh</h3>
                <p className="text-gray-600">
                  Cải thiện chất lượng giáo dục thông qua việc ứng dụng công nghệ hiện đại 
                  vào quản lý thi cử và đánh giá học sinh.
                </p>
              </div>
            </div>
            
            <div className="animate-on-scroll text-center">
              <div className="bg-white p-8 rounded-xl shadow-lg h-full">
                <div className="text-5xl mb-6">🔍</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Tầm nhìn</h3>
                <p className="text-gray-600">
                  Trở thành nền tảng quản lý thi cử hàng đầu Việt Nam, hỗ trợ toàn diện 
                  cho hệ thống giáo dục từ cấp tiểu học đến trung học.
                </p>
              </div>
            </div>
            
            <div className="animate-on-scroll text-center">
              <div className="bg-white p-8 rounded-xl shadow-lg h-full">
                <div className="text-5xl mb-6">💎</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Giá trị</h3>
                <p className="text-gray-600">
                  Minh bạch, công bằng và hiệu quả trong mọi hoạt động đánh giá, 
                  với sự tôn trọng cao nhất đối với tính toàn vẹn học thuật.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Product Demo Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">            <div className="animate-on-scroll">
              <h2 className="text-4xl font-bold text-gray-800 mb-4">Giao diện sản phẩm</h2>
            </div>
            <div className="animate-on-scroll">
              <p className="text-xl text-gray-600">
                Khám phá giao diện thân thiện và hiện đại của Thionl
              </p>
            </div>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Product Image 1 */}
            <div className="animate-on-scroll slide-left">
              <div className="relative">
                <img 
                  src="/pic1.png" 
                  alt="Giao diện quản lý đề thi" 
                  className="product-image w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 to-transparent rounded-xl"></div>
              </div>
            </div>
            
            <div className="animate-on-scroll slide-right">
              <h3 className="text-3xl font-bold text-gray-800 mb-6">
                Quản lý đề thi thông minh
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Giao diện trực quan giúp giáo viên dễ dàng tạo và quản lý ngân hàng đề thi. 
                Hệ thống phân loại thông minh theo môn học, cấp độ và độ khó.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Tạo đề thi nhanh chóng với trình soạn thảo WYSIWYG
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Import hàng loạt câu hỏi từ Excel, Word
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Phân loại và gắn thẻ tự động
                </li>
              </ul>
            </div>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center mt-20">
            <div className="animate-on-scroll slide-left lg:order-2">
              <div className="relative">
                <img 
                  src="/pic2.png" 
                  alt="Giao diện thi online" 
                  className="product-image w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-tl from-blue-500/20 to-transparent rounded-xl"></div>
              </div>
            </div>
            
            <div className="animate-on-scroll slide-right lg:order-1">
              <h3 className="text-3xl font-bold text-gray-800 mb-6">
                Thi online an toàn và hiệu quả
              </h3>
              <p className="text-lg text-gray-600 mb-6">
                Môi trường thi trực tuyến với bảo mật cao, giám sát thông minh và trải nghiệm 
                người dùng mượt mà cho cả học sinh và giáo viên.
              </p>
              <ul className="space-y-3 text-gray-600">
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Giao diện thi thân thiện, dễ sử dụng
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Hệ thống giám sát chống gian lận
                </li>
                <li className="flex items-center">
                  <span className="text-green-500 mr-3">✓</span>
                  Tự động lưu bài và backup dữ liệu
                </li>
              </ul>
            </div>
          </div>        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 hero-gradient text-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="animate-on-scroll">
              <h2 className="text-4xl font-bold mb-4">Con số ấn tượng</h2>
            </div>
            <div className="animate-on-scroll">
              <p className="text-xl opacity-90">
                Những thành tựu chúng tôi đã đạt được
              </p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="animate-on-scroll">
              <div className="text-4xl font-bold mb-2">10+</div>
              <div className="text-lg opacity-90">Trường học tin dùng</div>
            </div>
            <div className="animate-on-scroll">
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-lg opacity-90">Học sinh sử dụng</div>
            </div>
            <div className="animate-on-scroll">
              <div className="text-4xl font-bold mb-2">100+</div>
              <div className="text-lg opacity-90">Bài thi đã tổ chức</div>
            </div>
            <div className="animate-on-scroll">
              <div className="text-4xl font-bold mb-2">99.9%</div>
              <div className="text-lg opacity-90">Độ tin cậy hệ thống</div>
            </div>
          </div>
        </div>
      </section>

      {/* Detailed Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="space-y-20">
            {/* Feature 1 */}
            <div className="flex flex-col lg:flex-row items-center space-y-8 lg:space-y-0 lg:space-x-12">
              <div className="lg:w-1/2 animate-on-scroll slide-left">
                <ScrollReveal>
                  <h3 className="text-3xl font-bold text-gray-800 mb-6">
                    Quản lý ngân hàng đề thi thông minh
                  </h3>
                </ScrollReveal>
                <ScrollReveal>
                  <p className="text-lg text-gray-600 mb-6">
                    Hệ thống cho phép tạo và quản lý ngân hàng đề thi phong phú với khả năng 
                    phân loại theo môn học, cấp lớp và độ khó. Hỗ trợ import hàng loạt câu hỏi 
                    từ nhiều định dạng file khác nhau.
                  </p>
                </ScrollReveal>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Phân loại theo môn học và cấp lớp</li>
                  <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Import hàng loạt từ Excel, Word</li>
                  <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Tạo ma trận đề thi tự động</li>
                </ul>
              </div>
              <div className="lg:w-1/2 animate-on-scroll slide-right">
                <div className="bg-gray-50 p-8 rounded-xl shadow-lg">
                  <div className="h-64 bg-gradient-to-br from-purple-100 to-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-6xl">📚</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="flex flex-col lg:flex-row-reverse items-center space-y-8 lg:space-y-0 lg:space-x-reverse lg:space-x-12">
              <div className="lg:w-1/2 animate-on-scroll slide-right">
                <ScrollReveal>
                  <h3 className="text-3xl font-bold text-gray-800 mb-6">
                    Hệ thống thi online an toàn
                  </h3>
                </ScrollReveal>
                <ScrollReveal>
                  <p className="text-lg text-gray-600 mb-6">
                    Tổ chức các kỳ thi trực tuyến với hệ thống bảo mật cao, thông báo tự động 
                    và khả năng giám sát toàn diện để đảm bảo tính công bằng của kỳ thi.
                  </p>
                </ScrollReveal>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Lịch thi và thông báo tự động</li>
                  <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Bảo mật đa lớp</li>
                  <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Giám sát thời gian thực</li>
                </ul>
              </div>
              <div className="lg:w-1/2 animate-on-scroll slide-left">
                <div className="bg-gray-50 p-8 rounded-xl shadow-lg">
                  <div className="h-64 bg-gradient-to-br from-green-100 to-teal-100 rounded-lg flex items-center justify-center">
                    <span className="text-6xl">🛡️</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="flex flex-col lg:flex-row items-center space-y-8 lg:space-y-0 lg:space-x-12">
              <div className="lg:w-1/2 animate-on-scroll slide-left">
                <ScrollReveal>
                  <h3 className="text-3xl font-bold text-gray-800 mb-6">
                    Phân tích và cá nhân hóa học tập
                  </h3>
                </ScrollReveal>
                <ScrollReveal>
                  <p className="text-lg text-gray-600 mb-6">
                    Sử dụng AI để phân tích kết quả thi, xác định điểm yếu của từng học sinh 
                    và đề xuất bài tập cá nhân hóa phù hợp để cải thiện kết quả học tập.
                  </p>
                </ScrollReveal>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Phân tích dữ liệu thông minh</li>
                  <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Bài tập cá nhân hóa</li>
                  <li className="flex items-center"><span className="text-green-500 mr-2">✓</span>Báo cáo chi tiết</li>
                </ul>
              </div>
              <div className="lg:w-1/2 animate-on-scroll slide-right">
                <div className="bg-gray-50 p-8 rounded-xl shadow-lg">
                  <div className="h-64 bg-gradient-to-br from-orange-100 to-red-100 rounded-lg flex items-center justify-center">
                    <span className="text-6xl">📊</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 hero-gradient text-white">
        <div className="container mx-auto px-6 text-center">
          <div className="animate-on-scroll">
            <ScrollReveal>
              <h2 className="text-4xl font-bold mb-6">
                Sẵn sàng cải thiện hệ thống giáo dục của bạn?
              </h2>
            </ScrollReveal>
          </div>            <div className="animate-on-scroll">
              <ScrollReveal>
                <p className="text-xl mb-8 opacity-90">
                  Tham gia cùng hàng nghìn trường học đã tin tưởng sử dụng Thionl
                </p>
              </ScrollReveal>
            </div><div className="animate-on-scroll">
            <button 
              className="bg-white text-purple-600 px-10 py-4 rounded-lg font-semibold text-lg hover:bg-gray-100 transition"
              onClick={() => handleNavigation(isAuthenticated ? '/dashboard' : '/register')}
            >
              {isAuthenticated ? 'Vào Dashboard' : 'Đăng ký dùng thử miễn phí'}
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-8">            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img src="/logo2.png" alt="Thionl Logo" className="h-8 w-auto" />
                <h3 className="text-xl font-bold">Thionl</h3>
              </div>
              <p className="text-gray-400">
                Hệ thống quản lý thi cử thông minh, hiện đại và an toàn cho giáo dục Việt Nam.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Sản phẩm</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Quản lý đề thi</a></li>
                <li><a href="#" className="hover:text-white transition">Tổ chức thi online</a></li>
                <li><a href="#" className="hover:text-white transition">Phân tích kết quả</a></li>
                <li><a href="#" className="hover:text-white transition">Chống gian lận</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Hỗ trợ</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition">Tài liệu hướng dẫn</a></li>
                <li><a href="#" className="hover:text-white transition">Video hướng dẫn</a></li>
                <li><a href="#" className="hover:text-white transition">Hỗ trợ kỹ thuật</a></li>
                <li><a href="#" className="hover:text-white transition">Liên hệ</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Liên hệ</h4>
              <div className="space-y-2 text-gray-400">                <p>Email: info@thionl.vn</p>
                <p>Hotline: (+84) 886-286-998</p>
                <p>Địa chỉ: Hà Nội, Việt Nam</p>
              </div>
            </div>
          </div>            <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Thionl. Tất cả quyền được bảo lưu.</p>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}

export default Home;
