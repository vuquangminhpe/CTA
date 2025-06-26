/* eslint-disable @typescript-eslint/no-explicit-any */
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useMemo,
  useContext
} from 'react'
import {
  ChevronDown,
  BookOpen,
  Users,
  Award,
  TrendingUp,
  Play,
  Star,
  ArrowRight,
  Menu,
  X,
  Globe,
  Shield,
  Zap,
  Brain,
  Heart,
  CheckCircle,
  Camera,
  Monitor,
  BarChart3,
  Target,
  Gamepad2,
  Sparkles
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import path from '@/constants/path'
import { getAccessTokenFromLS } from '@/utils/auth'
import { AppContext } from '@/Contexts/app.context'
import { UserRole } from '@/constants/enum'
import { usePackages } from '@/hooks/usePayment'
import { PackageType } from '@/apis/payment.api'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import VideoHLSPlayer from '@/components/Custom/VideoHLSPlayer'
// Utility function
function cn(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

// Enhanced RotatingText Component with smooth animations
const RotatingText = forwardRef((props, ref) => {
  const {
    texts,
    rotationInterval = 3000,
    staggerDuration = 0.1,
    staggerFrom = 'first',
    loop = true,
    auto = true,
    splitBy = 'characters',
    onNext,
    mainClassName,
    splitLevelClassName,
    elementLevelClassName,
    style,
    ...rest
  } = props

  const [currentTextIndex, setCurrentTextIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)

  const splitIntoCharacters = (text: Iterable<unknown> | ArrayLike<unknown>) => {
    if (typeof Intl !== 'undefined' && Intl.Segmenter) {
      const segmenter = new Intl.Segmenter('en', { granularity: 'grapheme' })
      return Array.from(segmenter.segment(text), (segment) => segment.segment)
    }
    return Array.from(text)
  }

  const elements = useMemo(() => {
    const currentText = texts[currentTextIndex]
    if (splitBy === 'characters') {
      const words = currentText.split(' ')
      return words.map((word: any, i: number) => ({
        characters: splitIntoCharacters(word),
        needsSpace: i !== words.length - 1
      }))
    }
    if (splitBy === 'words') {
      return currentText.split(' ').map((word: any, i: number, arr: string | any[]) => ({
        characters: [word],
        needsSpace: i !== arr.length - 1
      }))
    }
    if (splitBy === 'lines') {
      return currentText.split('\n').map((line: any, i: number, arr: string | any[]) => ({
        characters: [line],
        needsSpace: i !== arr.length - 1
      }))
    }

    return currentText.split(splitBy).map((part: any, i: number, arr: string | any[]) => ({
      characters: [part],
      needsSpace: i !== arr.length - 1
    }))
  }, [texts, currentTextIndex, splitBy])

  const getStaggerDelay = useCallback(
    (index: number, totalChars: any) => {
      const total = totalChars
      if (staggerFrom === 'first') return index * staggerDuration
      if (staggerFrom === 'last') return (total - 1 - index) * staggerDuration
      if (staggerFrom === 'center') {
        const center = Math.floor(total / 2)
        return Math.abs(center - index) * staggerDuration
      }
      if (staggerFrom === 'random') {
        const randomIndex = Math.floor(Math.random() * total)
        return Math.abs(randomIndex - index) * staggerDuration
      }
      return Math.abs(staggerFrom - index) * staggerDuration
    },
    [staggerFrom, staggerDuration]
  )

  const handleIndexChange = useCallback(
    (newIndex: React.SetStateAction<number>) => {
      setIsAnimating(true)
      setTimeout(() => {
        setCurrentTextIndex(newIndex)
        setTimeout(() => setIsAnimating(false), 800)
      }, 400)
      if (onNext) onNext(newIndex)
    },
    [onNext]
  )

  const next = useCallback(() => {
    const nextIndex = currentTextIndex === texts.length - 1 ? (loop ? 0 : currentTextIndex) : currentTextIndex + 1
    if (nextIndex !== currentTextIndex) {
      handleIndexChange(nextIndex)
    }
  }, [currentTextIndex, texts.length, loop, handleIndexChange])

  const previous = useCallback(() => {
    const prevIndex = currentTextIndex === 0 ? (loop ? texts.length - 1 : currentTextIndex) : currentTextIndex - 1
    if (prevIndex !== currentTextIndex) {
      handleIndexChange(prevIndex)
    }
  }, [currentTextIndex, texts.length, loop, handleIndexChange])

  const jumpTo = useCallback(
    (index: number) => {
      const validIndex = Math.max(0, Math.min(index, texts.length - 1))
      if (validIndex !== currentTextIndex) {
        handleIndexChange(validIndex)
      }
    },
    [texts.length, currentTextIndex, handleIndexChange]
  )

  const reset = useCallback(() => {
    if (currentTextIndex !== 0) {
      handleIndexChange(0)
    }
  }, [currentTextIndex, handleIndexChange])

  useImperativeHandle(
    ref,
    () => ({
      next,
      previous,
      jumpTo,
      reset
    }),
    [next, previous, jumpTo, reset]
  )

  useEffect(() => {
    if (!auto) return
    const intervalId = setInterval(next, rotationInterval)
    return () => clearInterval(intervalId)
  }, [next, rotationInterval, auto])

  return (
    <span
      className={cn('flex flex-wrap whitespace-pre-wrap relative overflow-hidden', mainClassName)}
      style={style}
      {...rest}
    >
      <span className='sr-only'>{texts[currentTextIndex]}</span>
      <div
        className={cn(
          splitBy === 'lines' ? 'flex flex-col w-full' : 'flex flex-wrap whitespace-pre-wrap relative',
          isAnimating ? 'rotating-text-animating' : 'rotating-text-stable'
        )}
        aria-hidden='true'
      >
        {elements.map((wordObj: { characters: any[]; needsSpace: any }, wordIndex: any, array: any[]) => {
          const previousCharsCount = array
            .slice(0, wordIndex)
            .reduce((sum: any, word: { characters: string | any[] }) => sum + word.characters.length, 0)
          return (
            <span key={`${currentTextIndex}-${wordIndex}`} className={cn('inline-flex', splitLevelClassName)}>
              {wordObj.characters.map(
                (
                  char:
                    | string
                    | number
                    | boolean
                    | React.ReactElement<any, string | React.JSXElementConstructor<any>>
                    | Iterable<React.ReactNode>
                    | React.ReactPortal
                    | null
                    | undefined,
                  charIndex: any
                ) => (
                  <span
                    key={`${currentTextIndex}-${wordIndex}-${charIndex}`}
                    className={cn('inline-block rotating-char', elementLevelClassName)}
                    style={{
                      animationDelay: `${getStaggerDelay(
                        previousCharsCount + charIndex,
                        array.reduce(
                          (sum: any, word: { characters: string | any[] }) => sum + word.characters.length,
                          0
                        )
                      )}s`
                    }}
                  >
                    {char}
                  </span>
                )
              )}
              {wordObj.needsSpace && <span className='whitespace-pre'> </span>}
            </span>
          )
        })}
      </div>
    </span>
  )
})

RotatingText.displayName = 'RotatingText'

// Mouse Animation Component
const COLORS: string[] = ['#8B5CF6', '#EC4899', '#06B6D4', '#F59E0B', '#10B981', '#EF4444']
const NUM_POINTS: number = 60
const MAX_DISTANCE: number = 120

interface Point {
  x: number
  y: number
  vx: number
  vy: number
  color: string
}

interface MousePosition {
  x: number
  y: number
}

interface MouseAnimateProps {
  className?: string
}

const MouseAnimate: React.FC<MouseAnimateProps> = ({ className }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [, setPoints] = useState<Point[]>([])
  const mousePosRef = useRef<MousePosition>({ x: 0, y: 0 })
  const animationRef = useRef<number>()
  const navigate = useNavigate()
  const initializePoints = useCallback((width: number, height: number): Point[] => {
    return Array.from({ length: NUM_POINTS }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 1.5,
      vy: (Math.random() - 0.5) * 1.5,
      color: COLORS[Math.floor(Math.random() * COLORS.length)]
    }))
  }, [])
  const updatePoints = useCallback((width: number, height: number, currentPoints: Point[]): Point[] => {
    return currentPoints.map((point) => {
      const newX = point.x + point.vx
      const newY = point.y + point.vy

      if (newX < 0 || newX > width) point.vx *= -1
      if (newY < 0 || newY > height) point.vy *= -1

      return {
        ...point,
        x: Math.max(0, Math.min(newX, width)),
        y: Math.max(0, Math.min(newY, height))
      }
    })
  }, [])

  const drawCanvas = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number, currentPoints: Point[]) => {
      ctx.clearRect(0, 0, width, height)

      currentPoints.forEach((point, i) => {
        ctx.beginPath()
        ctx.arc(point.x, point.y, 2, 0, Math.PI * 2)
        ctx.fillStyle = point.color + '80'
        ctx.fill()

        for (let j = i + 1; j < currentPoints.length; j++) {
          const otherPoint = currentPoints[j]
          const dx = point.x - otherPoint.x
          const dy = point.y - otherPoint.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < MAX_DISTANCE) {
            ctx.beginPath()
            ctx.moveTo(point.x, point.y)
            ctx.lineTo(otherPoint.x, otherPoint.y)
            ctx.strokeStyle = `rgba(${parseInt(point.color.slice(1, 3), 16)}, ${parseInt(point.color.slice(3, 5), 16)}, ${parseInt(point.color.slice(5, 7), 16)}, ${0.3 * (1 - distance / MAX_DISTANCE)})`
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }
      })

      currentPoints.forEach((point) => {
        const dx = point.x - mousePosRef.current.x
        const dy = point.y - mousePosRef.current.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < MAX_DISTANCE) {
          ctx.beginPath()
          ctx.moveTo(point.x, point.y)
          ctx.lineTo(mousePosRef.current.x, mousePosRef.current.y)
          ctx.strokeStyle = `rgba(139, 92, 246, ${0.5 * (1 - distance / MAX_DISTANCE)})`
          ctx.lineWidth = 2
          ctx.stroke()
        }
      })
    },
    []
  )

  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    setPoints((prevPoints) => {
      const updatedPoints = updatePoints(canvas.width, canvas.height, prevPoints)
      drawCanvas(ctx, canvas.width, canvas.height, updatedPoints)
      return updatedPoints
    })

    animationRef.current = requestAnimationFrame(animate)
  }, [updatePoints, drawCanvas])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const handleResize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
      setPoints(initializePoints(canvas.width, canvas.height))
    }

    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mousePosRef.current = {
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    canvas.addEventListener('mousemove', handleMouseMove)

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', handleResize)
      canvas.removeEventListener('mousemove', handleMouseMove)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [animate, initializePoints])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none'
      }}
    />
  )
}

const UltraStunningHomepage = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [isScrolled, setIsScrolled] = useState(false)
  const [currentBanner, setCurrentBanner] = useState(0)
  const [, setIsHovered] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const heroRef = useRef(null)
  const navigate = useNavigate()
  const banners = ['/banner1.png', '/banner2.png', '/banner3.png', '/banner4.png']
  const { data: packages } = usePackages()

  // Smooth scroll function
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Advanced mouse tracking with smooth interpolation
  useEffect(() => {
    const handleMouseMove = (e: { clientX: number; clientY: number }) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1
      const y = (e.clientY / window.innerHeight) * 2 - 1
      setMousePosition({ x, y })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Scroll detection and parallax
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setIsScrolled(currentScrollY > 50)
      setScrollY(currentScrollY)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-change banner carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length)
    }, 4000)
    return () => clearInterval(timer)
  }, [banners.length])
  const [activeVideoDemo, setActiveVideoDemo] = useState(false)

  const features = [
    {
      icon: <BookOpen className='w-8 h-8' />,
      title: 'Ngân hàng đề thi AI',
      description: 'Tạo đề thi thông minh với AI, tự động phân loại theo độ khó và phân bố điểm số chuẩn',
      gradient: 'from-purple-500 via-pink-500 to-rose-500',
      delay: 'delay-100',
      bgColor: 'bg-purple-50'
    },
    {
      icon: <Monitor className='w-8 h-8' />,
      title: 'Thi online siêu bảo mật',
      description: 'Hệ thống chống gian lận đa lớp với nhận diện khuôn mặt và giám sát hành vi real-time',
      gradient: 'from-blue-500 via-cyan-500 to-teal-500',
      delay: 'delay-200',
      bgColor: 'bg-blue-50'
    },
    {
      icon: <BarChart3 className='w-8 h-8' />,
      title: 'Phân tích học tập AI',
      description: 'AI phân tích điểm yếu, điểm mạnh và tạo các nhận xét, lộ trình tập cá nhân hóa',
      gradient: 'from-emerald-500 via-green-500 to-lime-500',
      delay: 'delay-300',
      bgColor: 'bg-emerald-50'
    },
    {
      icon: <Target className='w-8 h-8' />,
      title: 'Hệ thống tạo câu hỏi thông minh',
      description: 'Hệ thống tự động tạo các câu hỏi ở tất cả các môn học giúp cho giáo viên tiết kiệm thời gian',
      gradient: 'from-orange-500 via-amber-500 to-yellow-500',
      delay: 'delay-400',
      bgColor: 'bg-orange-50'
    },
    {
      icon: <Shield className='w-8 h-8' />,
      title: ' Bảo mật',
      description: 'Bảo mật cấp độ  đảm bảo tính toàn vẹn dữ liệu và chống giả mạo kết quả',
      gradient: 'from-violet-500 via-purple-500 to-indigo-500',
      delay: 'delay-500',
      bgColor: 'bg-violet-50'
    },
    {
      icon: <Sparkles className='w-8 h-8' />,
      title: 'Kết nối, thống kê với các nền tảng giáo dục hiện có',
      description:
        'Thiết kế lớp, phân tích điểm, tự động đưa ra nhận xét chuẩn format và theo luật hiện hành của Bộ Giáo Dục ban hành (Chuẩn format như smas,...)',
      gradient: 'from-pink-500 via-rose-500 to-red-500',
      delay: 'delay-600',
      bgColor: 'bg-pink-50'
    }
  ]
  const profile = useContext(AppContext).profile
  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50  text-gray-900 overflow-x-hidden relative'>
      {/* Interactive Mouse Animation Background */}
      <div className='fixed inset-0 z-0 pointer-events-none'>
        <MouseAnimate className='w-full h-full' />
      </div>

      {/* Advanced Floating Shapes */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none z-0'>
        <div
          className='absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-cyan-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse'
          style={{
            transform: `translate(${mousePosition.x * 30}px, ${mousePosition.y * 30}px) translate(0, ${scrollY * -0.5}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        />
        <div
          className='absolute bottom-32 right-32 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-teal-400/10 rounded-full blur-3xl animate-pulse delay-1000'
          style={{
            transform: `translate(${mousePosition.x * -25}px, ${mousePosition.y * -25}px) translate(0, ${scrollY * -0.3}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        />
        <div
          className='absolute top-1/2 left-1/3 w-64 h-64 bg-gradient-to-r from-teal-400/10 to-cyan-400/10 rounded-full blur-2xl animate-bounce'
          style={{
            transform: `translate(${mousePosition.x * 15}px, ${mousePosition.y * 15}px) translate(0, ${scrollY * -0.2}px)`,
            animationDuration: '4s'
          }}
        />
      </div>

      {/* Ultra Transparent Glassmorphism Navigation */}
      <nav
        className={`fixed top-0 w-full z-50 transition-all duration-700 ${
          isScrolled
            ? 'bg-white/20 backdrop-blur-2xl border-b border-white/20 shadow-lg shadow-white/10'
            : 'bg-white/10 backdrop-blur-xl border-b border-white/10'
        }`}
        style={{
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          background: isScrolled
            ? 'linear-gradient(135deg, rgba(255,255,255,0.15), rgba(255,255,255,0.05))'
            : 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))'
        }}
      >
        <div className='max-w-7xl mx-auto px-6 py-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center space-x-4'>
              <div className='relative group cursor-pointer'>
                <div className='w-14 h-14 bg-gradient-to-r from-cyan-500/80 via-blue-500/80 to-teal-500/80 backdrop-blur-sm rounded-2xl flex items-center justify-center transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 shadow-lg shadow-cyan-200/50 border border-white/20'>
                  <img
                    src={'https://twitter-clone-minh-ap-southeast-1.s3.ap-southeast-1.amazonaws.com/MD.jpg'}
                    alt=''
                    className='size-full rounded-2xl text-white'
                  />
                </div>
                <div className='absolute inset-0 bg-gradient-to-r from-cyan-500/50 via-blue-500/50 to-teal-500/50 rounded-2xl blur-xl opacity-50 group-hover:opacity-75 transition-opacity duration-500' />
              </div>
              <div>
                <span className='text-3xl font-black bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 bg-clip-text text-transparent drop-shadow-sm'>
                  Thionl
                </span>
                <div className='text-sm text-cyan-600/80 font-semibold drop-shadow-sm'>Giáo dục thông minh 4.0</div>
              </div>
            </div>

            <div className='hidden md:flex items-center space-x-8'>
              {[
                { name: 'Tính năng', id: 'features' },
                { name: 'Bảng giá', id: 'pricing' },
                { name: 'Giới thiệu', id: 'hero' },
                { name: 'Liên hệ', id: 'contact' }
              ].map((item, index) => (
                <button
                  key={index}
                  onClick={() => scrollToSection(item.id)}
                  className='relative z-10 group px-4 py-2 text-gray-700/90 hover:text-cyan-600 backdrop-blur-sm transition-all duration-300 font-medium drop-shadow-sm'
                >
                  {item.name}
                  <div className='absolute bottom-0 translate-y-1 left-0 w-0 h-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 group-hover:w-full transition-all duration-300' />
                  <div className=' bg-white/0 group-hover:bg-white/20 rounded-lg transition-all duration-300 backdrop-blur-sm' />
                </button>
              ))}
            </div>

            <div className='flex items-center space-x-4'>
              {!getAccessTokenFromLS() && (
                <button className='hidden md:block relative px-6 py-3 border-2 border-cyan-300/60 text-cyan-700 rounded-2xl hover:bg-white/20 hover:border-cyan-400/80 transition-all duration-300 group overflow-hidden font-semibold backdrop-blur-sm'>
                  <span onClick={() => navigate(path.login)} className='relative z-10'>
                    Đăng nhập
                  </span>
                  <div className='absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/10 to-cyan-500/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700' />
                </button>
              )}

              <button className='relative px-8 py-3 bg-gradient-to-r from-cyan-500/90 via-blue-500/90 to-teal-500/90 backdrop-blur-sm text-white rounded-2xl font-bold hover:shadow-2xl hover:shadow-cyan-300/50 transform hover:-translate-y-1 hover:scale-105 transition-all duration-500 group overflow-hidden border border-white/20'>
                <span className='relative z-10 flex items-center space-x-2'>
                  {!getAccessTokenFromLS() && (
                    <span onClick={() => navigate(path.register)}>Đăng ký dùng ngay bây giờ</span>
                  )}
                  {getAccessTokenFromLS() && (
                    <span onClick={() => navigate(profile?.role === UserRole.Teacher ? '/teacher' : '/student')}>
                      Quay lại bảng điều khiển
                    </span>
                  )}
                  <ArrowRight className='w-5 h-5 group-hover:translate-x-1 transition-transform' />
                </span>
                <div className='absolute inset-0 bg-gradient-to-r from-teal-500/90 via-blue-500/90 to-cyan-500/90 opacity-0 group-hover:opacity-100 transition-opacity duration-500' />
              </button>

              <button
                className='md:hidden p-3 hover:bg-white/20 rounded-xl transition-colors backdrop-blur-sm border border-white/10'
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className='text-cyan-600' /> : <Menu className='text-cyan-600' />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-500 ${
          isMenuOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        <div
          className='absolute inset-0 backdrop-blur-2xl'
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.1))',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)'
          }}
        />
        <div className='relative flex flex-col items-center justify-center h-full space-y-8 text-2xl'>
          {[
            { name: 'Tính năng', id: 'features' },
            { name: 'Bảng giá', id: 'pricing' },
            { name: 'Giới thiệu', id: 'hero' },
            { name: 'Liên hệ', id: 'contact' }
          ].map((item, index) => (
            <button
              key={index}
              onClick={() => {
                scrollToSection(item.id)
                setIsMenuOpen(false)
              }}
              className='text-gray-700 hover:text-cyan-600 transition-colors font-semibold drop-shadow-sm'
            >
              {item.name}
            </button>
          ))}
        </div>
      </div>

      {/* Revolutionary Hero Section */}
      <section
        id='hero'
        ref={heroRef}
        className='relative min-h-screen flex items-center justify-center overflow-hidden'
      >
        {/* Hero Background with 3D Parallax Images */}
        <div className='absolute inset-0 perspective-1000'>
          <div className='relative w-full h-full preserve-3d'>
            {banners.map((banner, index) => {
              const rotation = (index - currentBanner) * 45
              const isActive = index === currentBanner
              return (
                <div
                  key={index}
                  className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
                    isActive ? 'opacity-20 z-10' : 'opacity-5 z-0'
                  }`}
                  style={{
                    transform: `rotateY(${rotation}deg) translateZ(${isActive ? '0px' : '-300px'}) scale(${isActive ? 1.1 : 0.7})`,
                    filter: `blur(${isActive ? '0px' : '8px'}) brightness(${isActive ? 1.2 : 0.8})`
                  }}
                >
                  <img src={banner} alt={`Banner ${index + 1}`} className='w-full h-full object-cover opacity-40' />
                  <div className='absolute inset-0 bg-gradient-to-br from-cyan-100/60 via-blue-100/40 to-teal-100/60' />
                </div>
              )
            })}
          </div>
        </div>

        {/* Hero Content */}
        <div className='relative z-20 max-w-7xl mx-auto px-6 text-center'>
          <div className='space-y-12'>
            {/* Floating Achievement Badge */}
            <div
              className='inline-flex items-center space-x-4 bg-white/80 backdrop-blur-2xl border border-cyan-200 rounded-full px-8 py-4 shadow-xl shadow-cyan-100/50 animate-float'
              style={{
                transform: `translateY(${Math.sin(Date.now() * 0.001) * 10}px)`
              }}
            >
              <div className='flex -space-x-2'>
                {[...Array(3)].map((_, i) => (
                  <Star
                    key={i}
                    className='w-5 h-5 text-yellow-500 fill-current animate-pulse'
                    style={{ animationDelay: `${i * 200}ms` }}
                  />
                ))}
              </div>
              <span className='text-lg font-bold text-gray-700'>Được 50,000+ giáo viên tin dùng</span>
              <div className='w-3 h-3 bg-green-500 rounded-full animate-ping' />
            </div>

            {/* Revolutionary Title with Enhanced RotatingText */}
            <div className='space-y-6'>
              <h1 className='text-6xl md:text-7xl lg:text-8xl font-black leading-tight'>
                <div className='relative'>
                  <RotatingText
                    texts={['Cách mạng', 'Tương lai', 'Đột phá', 'Sáng tạo', 'Tiên phong']}
                    mainClassName='inline-block gradient-text-1 p-5'
                    staggerFrom='center'
                    staggerDuration={0.08}
                    splitLevelClassName='overflow-hidden'
                    rotationInterval={4000}
                  />
                  <div className='absolute inset-0 bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 bg-clip-text text-transparent blur-3xl opacity-30' />
                </div>

                <div className='relative mb-4'>
                  <RotatingText
                    texts={['Giáo dục', 'Học tập', 'Tri thức', 'Đào tạo']}
                    mainClassName='inline-block gradient-text-2 p-5'
                    staggerFrom='first'
                    staggerDuration={0.06}
                    splitLevelClassName='overflow-hidden'
                    rotationInterval={3500}
                  />
                  <div className='absolute inset-0 bg-gradient-to-r from-blue-600 via-cyan-600 to-teal-600 bg-clip-text text-transparent blur-3xl opacity-30' />
                </div>

                <div className='relative'>
                  <RotatingText
                    texts={['Việt Nam', 'Thế giới', 'Toàn cầu', 'Quốc tế']}
                    mainClassName='inline-block gradient-text-3 p-5'
                    staggerFrom='last'
                    staggerDuration={0.1}
                    splitLevelClassName='overflow-hidden'
                    rotationInterval={4500}
                  />
                  <div className='absolute inset-0 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent blur-3xl opacity-30' />
                </div>
              </h1>
            </div>

            {/* Revolutionary Subtitle */}
            <p className='text-2xl md:text-3xl text-gray-600 max-w-5xl mx-auto leading-relaxed font-light'>
              Trải nghiệm
              <span className='font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent'>
                {' '}
                AI thế hệ mới{' '}
              </span>
              trong giáo dục,
              <span className='font-bold bg-gradient-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent'>
                {' '}
                cá nhân hóa 100%{' '}
              </span>
              lộ trình học tập và
              <span className='font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent'>
                {' '}
                nâng tầm tri thức{' '}
              </span>
              cho thế hệ tương lai.
            </p>

            {/* Powerful CTAs with 3D Effects */}
            <div className='flex flex-col sm:flex-row gap-8 justify-center items-center pt-8'>
              <button
                className='group relative px-12 py-6 bg-gradient-to-r from-cyan-500 via-blue-500 to-teal-500 text-white rounded-3xl text-xl font-bold hover:shadow-2xl hover:shadow-cyan-300/50 transform hover:-translate-y-3 hover:scale-105 transition-all duration-500 overflow-hidden'
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <span className='relative z-10 flex items-center space-x-3'>
                  <Sparkles className='w-6 h-6 group-hover:rotate-12 transition-transform duration-300' />
                  <span>Khám phá ngay</span>
                  <ArrowRight className='w-6 h-6 group-hover:translate-x-2 transition-transform duration-300' />
                </span>
                <div className='absolute inset-0 bg-gradient-to-r from-teal-500 via-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500' />
                <div className='absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700' />
              </button>

              <button className='group flex items-center space-x-4 px-12 py-6 bg-white/80 backdrop-blur-xl border-2 border-cyan-200 rounded-3xl hover:border-blue-400 hover:bg-white/90 hover:shadow-xl hover:shadow-cyan-200/50 transition-all duration-500 text-xl font-bold text-gray-700'>
                <div className='w-16 h-16 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:rotate-6 transition-all duration-300 shadow-lg'>
                  <Play className='w-8 h-8 text-white ml-1' />
                </div>
                <span onClick={() => setActiveVideoDemo(true)}>Xem Demo</span>
              </button>
            </div>

            {/* Animated Live Stats */}
            <div className='grid grid-cols-2 md:grid-cols-4 gap-8 pt-16'>
              {[
                {
                  number: '100+',
                  label: 'Học sinh',
                  icon: <Users className='w-6 h-6' />,
                  color: 'text-cyan-600',
                  bg: 'bg-cyan-100'
                },
                {
                  number: '40+',
                  label: 'Giáo viên',
                  icon: <Award className='w-6 h-6' />,
                  color: 'text-blue-600',
                  bg: 'bg-blue-100'
                },
                {
                  number: '99.2%',
                  label: 'Độ chính xác AI',
                  icon: <Brain className='w-6 h-6' />,
                  color: 'text-teal-600',
                  bg: 'bg-teal-100'
                },
                {
                  number: '24/7',
                  label: 'AI Support',
                  icon: <Shield className='w-6 h-6' />,
                  color: 'text-indigo-600',
                  bg: 'bg-indigo-100'
                }
              ].map((stat, index) => (
                <div
                  key={index}
                  className='group relative p-8 bg-white/80 backdrop-blur-2xl border border-cyan-100 rounded-3xl hover:border-blue-300 hover:-translate-y-4 hover:shadow-xl hover:shadow-cyan-200/50 transition-all duration-500'
                  style={{
                    animationDelay: `${index * 200}ms`
                  }}
                >
                  <div
                    className={`flex items-center justify-center mb-4 ${stat.color} ${stat.bg} w-14 h-14 rounded-2xl mx-auto group-hover:scale-110 group-hover:rotate-12 transition-all duration-300`}
                  >
                    {stat.icon}
                  </div>
                  <div className='text-3xl md:text-4xl font-black text-gray-800 mb-2 group-hover:scale-110 transition-transform duration-300'>
                    {stat.number}
                  </div>
                  <div className='text-gray-600 font-semibold'>{stat.label}</div>
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${stat.bg.replace('100', '50')} rounded-3xl opacity-0 group-hover:opacity-50 transition-opacity duration-500`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interactive Scroll Indicator */}
        <div className='absolute bottom-8 left-1/2 transform -translate-x-1/2 flex flex-col items-center space-y-4 animate-bounce'>
          <div className='text-cyan-600 text-sm font-bold'>Khám phá thêm</div>
          <div className='w-10 h-10 border-2 border-cyan-400 rounded-full flex items-center justify-center'>
            <ChevronDown className='w-6 h-6 text-cyan-600' />
          </div>
        </div>

        {/* Floating Carousel Thumbnails */}
        <div className='absolute bottom-8 right-8 flex space-x-3'>
          {banners.map((banner, index) => (
            <button
              key={index}
              onClick={() => setCurrentBanner(index)}
              className={`w-20 h-20 rounded-2xl overflow-hidden border-3 transition-all duration-500 hover:scale-110 shadow-lg ${
                index === currentBanner ? 'border-cyan-500 shadow-cyan-300' : 'border-white/50 hover:border-cyan-300'
              }`}
            >
              <img src={banner} alt={`Thumbnail ${index + 1}`} className='w-full h-full object-cover' />
            </button>
          ))}
        </div>
      </section>

      {/* Next-Gen Features Section */}
      <section id='features' className='relative py-32 bg-gradient-to-b from-blue-50 via-white to-cyan-50'>
        <div className='max-w-7xl mx-auto px-6'>
          <div className='text-center mb-20'>
            <div className='inline-block mb-8'>
              <div className='text-cyan-600 text-lg font-bold mb-2 flex items-center justify-center space-x-2'>
                <Sparkles className='w-5 h-5' />
                <span>Công nghệ đột phá</span>
                <Sparkles className='w-5 h-5' />
              </div>
              <h2 className='text-5xl md:text-7xl font-black leading-tight'>
                <span className='bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 bg-clip-text text-transparent'>
                  AI thế hệ mới
                </span>
                <br />
                <span className='text-gray-800'>cho giáo dục</span>
              </h2>
            </div>
            <p className='text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed'>
              Khám phá những công nghệ AI tiên tiến nhất đang định hình lại tương lai giáo dục Việt Nam
            </p>
          </div>

          <div className='grid lg:grid-cols-3 gap-10'>
            {features.map((feature, index) => (
              <div
                key={index}
                className={`group relative p-10 ${feature.bgColor} border-2 border-gray-100 rounded-3xl hover:border-purple-300 hover:-translate-y-8 hover:rotate-2 hover:shadow-2xl hover:shadow-purple-200/50 transition-all duration-700 ${feature.delay} animate-fade-in-up overflow-hidden cursor-pointer`}
              >
                {/* Gradient Background Effect */}
                <div
                  className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-700 rounded-3xl`}
                />

                {/* Icon with Advanced 3D Effect */}
                <div
                  className={`relative w-20 h-20 bg-gradient-to-r ${feature.gradient} rounded-3xl flex items-center justify-center mb-8 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-lg mx-auto`}
                >
                  <div className='text-white transform group-hover:scale-110 transition-transform duration-300'>
                    {feature.icon}
                  </div>
                  <div
                    className={`absolute inset-0 bg-gradient-to-r ${feature.gradient} rounded-3xl blur-xl opacity-50 group-hover:opacity-80 transition-opacity duration-500`}
                  />
                </div>

                <h3 className='text-2xl font-black text-gray-800 mb-6 text-center group-hover:text-purple-700 transition-colors duration-300'>
                  {feature.title}
                </h3>

                <p className='text-gray-600 text-lg leading-relaxed text-center group-hover:text-gray-700 transition-colors duration-300'>
                  {feature.description}
                </p>

                {/* Interactive Hover Lines */}
                <div className='absolute top-0 left-0 w-0 h-2 bg-gradient-to-r from-purple-500 to-pink-500 group-hover:w-full transition-all duration-700 rounded-t-3xl' />
                <div className='absolute bottom-0 right-0 w-0 h-2 bg-gradient-to-r from-cyan-500 to-blue-500 group-hover:w-full transition-all duration-700 delay-200 rounded-b-3xl' />

                {/* Floating Elements */}
                <div className='absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full opacity-0 group-hover:opacity-100 animate-ping transition-opacity duration-500' />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ultra Product Showcase */}
      <section className='relative py-32 bg-gradient-to-b from-blue-50 via-white to-cyan-50'>
        <div className='max-w-7xl mx-auto px-6'>
          <div className='text-center mb-20'>
            <h2 className='text-5xl md:text-6xl font-black mb-6'>
              <span className='bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent'>
                Giao diện
              </span>
              <span className='text-gray-800'> tương lai</span>
            </h2>
            <p className='text-2xl text-gray-600 max-w-3xl mx-auto'>
              Thiết kế UI/UX đẹp, mang lại trải nghiệm tốt cho người dùng
            </p>
          </div>

          <div className='space-y-32'>
            {/* Showcase 1 - Enhanced */}
            <div className='grid lg:grid-cols-2 gap-20 items-center'>
              <div className='group relative'>
                <div className='relative transform group-hover:scale-105 group-hover:-rotate-3 transition-all duration-700'>
                  <div className='absolute inset-0 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-3xl blur-2xl'></div>
                  <img
                    src='https://twitter-clone-minh-ap-southeast-1.s3.ap-southeast-1.amazonaws.com/Screenshot+2025-06-20+031327.png'
                    alt='Giao diện AI tạo đề thi'
                    className='relative w-full h-auto rounded-3xl shadow-2xl shadow-purple-300/50 border-4 border-white'
                  />
                  <img
                    src='https://twitter-clone-minh-ap-southeast-1.s3.ap-southeast-1.amazonaws.com/Screenshot+2025-06-20+031342.png'
                    alt='Giao diện AI tạo đề thi'
                    className='relative w-full h-auto mt-5 rounded-3xl shadow-2xl shadow-purple-300/50 border-4 border-white'
                  />
                  <div className='absolute inset-0 bg-gradient-to-tr from-purple-500/10 via-transparent to-pink-500/10 rounded-3xl group-hover:opacity-0 transition-opacity duration-700' />
                </div>

                {/* Advanced Floating UI Elements */}
                <div className='absolute -top-6 -right-6 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-4 rounded-2xl font-black text-lg animate-pulse shadow-xl shadow-green-200'>
                  🤖 AI 99.9% chính xác
                </div>
                <div className='absolute -bottom-8 -left-8 bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-8 py-4 rounded-2xl font-black text-lg animate-pulse delay-500 shadow-xl shadow-blue-200'>
                  ⚡ Tạo đề trong 10 giây
                </div>
              </div>

              <div className='space-y-10'>
                <div>
                  <div className='text-purple-600 text-xl font-black mb-4 flex items-center space-x-2'>
                    <Brain className='w-6 h-6' />
                    <span>AI Tạo câu hỏi</span>
                  </div>
                  <h3 className='text-4xl md:text-5xl font-black text-gray-800 mb-8 leading-tight'>
                    Tạo đề thi bằng
                    <span className='bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent'>
                      {' '}
                      AI trong 10 giây
                    </span>
                  </h3>
                  <p className='text-xl text-gray-600 leading-relaxed mb-10'>
                    Công nghệ tiên tiến phân tích hàng triệu dữ liệu giáo dục, tự động tạo đề thi chuẩn ma trận với độ
                    chính xác 99.9%. Giáo viên chỉ cần click một nút và đề thi hoàn hảo đã sẵn sàng!
                  </p>
                </div>

                <div className='grid grid-cols-1 gap-6'>
                  {[
                    { icon: '⚡', title: '', desc: 'Tạo đề trong 10 giây, chuẩn 100%' },
                    { icon: '🎨', title: '', desc: 'Đa dạng hóa câu hỏi tự động' }
                  ].map((item, i) => (
                    <div
                      key={i}
                      className='flex items-center space-x-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-100 hover:border-purple-300 hover:bg-white/90 hover:shadow-lg hover:shadow-purple-200/50 hover:-translate-y-1 transition-all duration-300 group'
                    >
                      <div className='text-3xl group-hover:scale-110 transition-transform duration-300'>
                        {item.icon}
                      </div>
                      <div>
                        <div className='font-bold text-gray-800 text-lg'>{item.title}</div>
                        <div className='text-gray-600'>{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Showcase 2 - Enhanced */}
            <div className='grid lg:grid-cols-2 gap-20 items-center'>
              <div className='order-2 lg:order-1 space-y-10'>
                <div>
                  <div className='text-cyan-600 text-xl font-black mb-4 flex items-center space-x-2'>
                    <Shield className='w-6 h-6' />
                    <span>Hệ thống bảo mật và chống gian lận trong quá trình thi</span>
                  </div>

                  <p className='text-xl text-gray-600 leading-relaxed mb-10'>
                    Hệ thống bảo mật đa lớp với AI giám sát 24/7, verification. Chống gian lận 100% với công nghệ nhận
                    diện khuôn mặt và thống kê liên tục trong quá trình thi.
                  </p>
                </div>

                <div className='grid grid-cols-1 gap-6'>
                  {[
                    { icon: '👁️', title: '', desc: 'Nhận diện khuôn mặt + đặc điểm + giới tính + màu da' },
                    { icon: '🛡️', title: ' ', desc: 'Xác thực tính toàn vẹn dữ liệu' },
                    { icon: '🚫', title: '', desc: 'Phát hiện gian lận ngay lập tức' }
                  ].map((item, i) => (
                    <div
                      key={i}
                      className='flex items-center space-x-4 p-6 bg-white/80 backdrop-blur-sm rounded-2xl border border-cyan-100 hover:border-cyan-300 hover:bg-white/90 hover:shadow-lg hover:shadow-cyan-200/50 hover:-translate-y-1 transition-all duration-300 group'
                    >
                      <div className='text-3xl group-hover:scale-110 transition-transform duration-300'>
                        {item.icon}
                      </div>
                      <div>
                        <div className='font-bold text-gray-800 text-lg'>{item.title}</div>
                        <div className='text-gray-600'>{item.desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className='order-1 lg:order-2 group relative'>
                <div className='relative transform group-hover:scale-105 group-hover:rotate-3 transition-all duration-700'>
                  <div className='absolute inset-0 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-3xl blur-2xl'></div>
                  <img
                    src='https://twitter-clone-minh-ap-southeast-1.s3.ap-southeast-1.amazonaws.com/Screenshot+2025-06-20+031922.png'
                    alt='Giao diện bảo mật AI'
                    className='relative w-full h-auto rounded-3xl shadow-2xl shadow-cyan-300/50 border-4 border-white'
                  />

                  <img
                    src='https://twitter-clone-minh-ap-southeast-1.s3.ap-southeast-1.amazonaws.com/Screenshot+2025-06-20+032458.png'
                    alt='Giao diện bảo mật AI'
                    className='relative w-full h-auto rounded-3xl shadow-2xl shadow-cyan-300/50 border-4 border-white mt-5'
                  />
                  <div className='absolute inset-0 bg-gradient-to-tl from-cyan-500/10 via-transparent to-blue-500/10 rounded-3xl group-hover:opacity-0 transition-opacity duration-700' />
                </div>

                {/* Enhanced Floating UI Elements */}
                <div className='absolute -top-6 -left-6 bg-gradient-to-r from-red-500 to-pink-500 text-white px-8 py-4 rounded-2xl font-black text-lg animate-pulse shadow-xl shadow-red-200'>
                  🔒 100% bảo mật
                </div>
                <div className='absolute -bottom-8 -right-8 bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-8 py-4 rounded-2xl font-black text-lg animate-pulse delay-700 shadow-xl shadow-purple-200'>
                  🤖 AI thống kê
                </div>
                <div className='absolute top-1/3 -right-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white px-6 py-3 rounded-2xl font-bold animate-bounce delay-1000 shadow-xl'>
                  ✅ xác thực khuôn mặt
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mega CTA Section */}
      <section
        id='contact'
        className='relative py-32 bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50 overflow-hidden'
      >
        <div className='absolute inset-0 bg-white/30' />

        {/* Animated Background Elements */}
        <div className='absolute inset-0 overflow-hidden'>
          <div
            className='absolute top-20 left-20 w-40 h-40 border-2 border-cyan-300/50 rounded-full animate-spin'
            style={{ animationDuration: '20s' }}
          />
          <div className='absolute bottom-20 right-20 w-32 h-32 border-2 border-blue-300/50 rotate-45 animate-pulse' />
          <div
            className='absolute top-1/2 left-1/4 w-24 h-24 bg-teal-300/20 rounded-full animate-bounce'
            style={{ animationDuration: '3s' }}
          />
          <div className='absolute bottom-1/3 left-1/3 w-16 h-16 bg-cyan-300/20 rounded-full animate-ping' />
        </div>

        <div className='relative max-w-6xl mx-auto px-6 text-center'>
          <div className='space-y-12'>
            <div className='inline-block'>
              <div className='text-gray-600 text-xl font-bold mb-6 flex items-center justify-center space-x-2'>
                <Sparkles className='w-6 h-6 animate-spin text-cyan-600' />
                <span>Sẵn sàng cho cuộc cách mạng?</span>
                <Sparkles className='w-6 h-6 animate-spin text-blue-600' />
              </div>
              <h2 className='text-5xl md:text-7xl font-black leading-tight'>
                <span className='block mb-4 bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 bg-clip-text text-transparent'>
                  Hãy là người tiên phong
                </span>
                <span className='block bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent'>
                  trong giáo dục 4.0
                </span>
              </h2>
            </div>

            <p className='text-2xl text-gray-700 leading-relaxed max-w-4xl mx-auto font-medium'>
              Tham gia cùng
              <span className='font-black text-cyan-600'> 40+ giáo viên </span>
              đã chọn Thionl để đưa giáo dục Việt Nam vươn tầm quốc tế. Bắt đầu hành trình đổi mới ngay hôm nay với
            </p>

            <div className='flex flex-col sm:flex-row gap-8 justify-center pt-8'>
              <button className='group relative px-16 py-8 bg-gradient-to-r from-cyan-500 via-blue-500 to-teal-500 text-white rounded-3xl text-2xl font-black hover:shadow-2xl hover:shadow-cyan-300/50 transform hover:-translate-y-3 hover:scale-110 transition-all duration-500 overflow-hidden'>
                <span className='relative z-10 flex items-center justify-center space-x-4'>
                  <Sparkles className='w-8 h-8 group-hover:rotate-180 transition-transform duration-500' />
                  <span onClick={() => navigate('/register')}>Đăng ký ngay</span>
                  <ArrowRight className='w-8 h-8 group-hover:translate-x-3 transition-transform duration-300' />
                </span>
                <div className='absolute inset-0 bg-gradient-to-r from-teal-500 via-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500' />
              </button>

              <button
                onClick={() => window.open('https://www.facebook.com/profile.php?id=61577453490643', '_blank')}
                className='px-16 py-8 border-4 border-cyan-400 text-cyan-700 rounded-3xl hover:bg-cyan-50 hover:border-cyan-500 transition-all duration-500 text-2xl font-black'
              >
                📞 Tư vấn 1-1 miễn phí
              </button>
            </div>

            {/* Trust Indicators */}
            <div className='flex flex-wrap justify-center items-center gap-12 pt-16 text-gray-600'>
              <div className='flex items-center space-x-3 group cursor-pointer'>
                <div className='w-12 h-12 bg-cyan-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
                  <Shield className='w-6 h-6 text-cyan-600' />
                </div>
                <span className='font-bold text-lg'>Bảo mật tuyệt đối</span>
              </div>
              <div className='flex items-center space-x-3 group cursor-pointer'>
                <div className='w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
                  <CheckCircle className='w-6 h-6 text-blue-600' />
                </div>
                <span className='font-bold text-lg'>Hỗ trợ 24/7</span>
              </div>
              <div className='flex items-center space-x-3 group cursor-pointer'>
                <div className='w-12 h-12 bg-teal-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300'>
                  <Heart className='w-6 h-6 text-teal-600' />
                </div>
                <span className='font-bold text-lg'>Rất nhiều giáo viên tin dùng</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Premium Pricing Section */}
      <section
        id='pricing'
        className='relative py-32 bg-gradient-to-b from-white via-blue-50 to-cyan-50 overflow-hidden'
      >
        {/* Background Animation */}
        <div className='absolute inset-0 overflow-hidden'>
          <div className='absolute top-20 left-20 w-72 h-72 bg-gradient-to-r from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse' />
          <div className='absolute bottom-32 right-32 w-96 h-96 bg-gradient-to-r from-blue-400/10 to-teal-400/10 rounded-full blur-3xl animate-pulse delay-1000' />
        </div>

        <div className='relative max-w-7xl mx-auto px-6'>
          <div className='text-center mb-20'>
            <div className='inline-block mb-8'>
              <div className='text-cyan-600 text-lg font-bold mb-2 flex items-center justify-center space-x-2'>
                <Sparkles className='w-5 h-5' />
                <span>Bảng giá linh hoạt</span>
                <Sparkles className='w-5 h-5' />
              </div>
              <h2 className='text-5xl md:text-7xl font-black leading-tight'>
                <span className='bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 bg-clip-text text-transparent'>
                  Lựa chọn gói
                </span>
                <br />
                <span className='text-gray-800'>phù hợp với bạn</span>
              </h2>
            </div>
            <p className='text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed'>
              Từ cá nhân đến doanh nghiệp, chúng tôi có gói dịch vụ phù hợp cho mọi nhu cầu giáo dục
            </p>
          </div>

          {packages && packages.length > 0 ? (
            <div className='grid lg:grid-cols-3 gap-10'>
              {packages
                .filter((pkg) => pkg.active)
                .sort((a, b) => a.price - b.price)
                .map((pkg, index) => {
                  const isPopular = pkg.type === PackageType.TEAM_3
                  const gradients = [
                    'from-cyan-500 to-blue-500',
                    'from-purple-500 to-pink-500',
                    'from-emerald-500 to-teal-500'
                  ]
                  const bgColors = ['bg-cyan-50', 'bg-purple-50', 'bg-emerald-50']
                  const textColors = ['text-cyan-600', 'text-purple-600', 'text-emerald-600']

                  return (
                    <div
                      key={pkg._id}
                      className={`group relative p-10 ${bgColors[index % 3]} border-2 ${
                        isPopular ? 'border-purple-300 scale-105' : 'border-gray-200'
                      } rounded-3xl hover:border-purple-400 hover:-translate-y-4 hover:shadow-2xl hover:shadow-purple-200/50 transition-all duration-700 overflow-hidden`}
                    >
                      {/* Popular Badge */}
                      {isPopular && (
                        <div className='absolute top-3 w-52 left-1/2 transform -translate-x-1/2'>
                          <div className='bg-gradient-to-r w-full from-purple-500 to-pink-500 text-white px-8 py-2 rounded-full font-bold text-sm shadow-lg animate-pulse'>
                            🔥 PHỔ BIẾN NHẤT
                          </div>
                        </div>
                      )}

                      {/* Background Gradient Effect */}
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${gradients[index % 3]} opacity-0 group-hover:opacity-10 transition-opacity duration-700 rounded-3xl`}
                      />

                      {/* Package Type Icon */}
                      <div className='text-center mb-8'>
                        <div
                          className={`w-20 h-20 mx-auto bg-gradient-to-r ${gradients[index % 3]} rounded-3xl flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-12 transition-all duration-500 shadow-lg`}
                        >
                          {pkg.type === PackageType.SINGLE && <Users className='w-8 h-8 text-white' />}
                          {pkg.type === PackageType.TEAM_3 && <Award className='w-8 h-8 text-white' />}
                          {pkg.type === PackageType.TEAM_7 && <TrendingUp className='w-8 h-8 text-white' />}
                        </div>
                        <h3 className={`text-2xl font-black ${textColors[index % 3]} mb-2`}>{pkg.name}</h3>
                        <p className='text-gray-600'>
                          {pkg.type === PackageType.SINGLE && 'Dành cho giáo viên cá nhân'}
                          {pkg.type === PackageType.TEAM_3 && 'Dành cho nhóm nhỏ 3 giáo viên'}
                          {pkg.type === PackageType.TEAM_7 && 'Dành cho nhóm lớn 7 giáo viên'}
                        </p>
                      </div>

                      {/* Price */}
                      <div className='text-center mb-8'>
                        <div className='flex items-center justify-center space-x-2 mb-2'>
                          <span className='text-5xl font-black text-gray-800'>{pkg.price.toLocaleString('vi-VN')}</span>
                          <div className='text-left'>
                            <div className='text-lg font-bold text-gray-800'>VNĐ</div>
                            <div className='text-sm text-gray-500'>/{pkg.duration_months} tháng</div>
                          </div>
                        </div>
                        <div className='text-gray-500'>
                          ~{Math.round(pkg.price / pkg.duration_months).toLocaleString('vi-VN')} VNĐ/tháng
                        </div>
                      </div>

                      {/* Features */}
                      <div className='space-y-4 mb-10'>
                        <div className='flex items-center space-x-3'>
                          <CheckCircle className={`w-5 h-5 ${textColors[index % 3]}`} />
                          <span className='text-gray-700 font-medium'>Tối đa {pkg.max_teachers} giáo viên</span>
                        </div>

                        {pkg.features.map((feature, featureIndex) => (
                          <div key={featureIndex} className='flex items-center space-x-3'>
                            <CheckCircle className={`w-5 h-5 ${textColors[index % 3]}`} />
                            <span className='text-gray-700 font-medium'>{feature}</span>
                          </div>
                        ))}
                      </div>

                      {/* CTA Button */}
                      <button
                        className={`w-full py-4 bg-gradient-to-r ${gradients[index % 3]} text-white rounded-2xl font-bold text-lg hover:shadow-xl hover:shadow-purple-300/50 transform hover:-translate-y-1 hover:scale-105 transition-all duration-500 group-hover:scale-110`}
                        onClick={() =>
                          navigate(
                            getAccessTokenFromLS()
                              ? profile?.role === UserRole.Teacher
                                ? '/teacher'
                                : '/student'
                              : '/register'
                          )
                        }
                      >
                        {getAccessTokenFromLS() ? 'Chọn gói này' : 'Đăng ký ngay'}
                      </button>

                      {/* Hover Lines */}
                      <div
                        className={`absolute top-0 left-0 w-0 h-2 bg-gradient-to-r ${gradients[index % 3]} group-hover:w-full transition-all duration-700 rounded-t-3xl`}
                      />
                      <div
                        className={`absolute bottom-0 right-0 w-0 h-2 bg-gradient-to-r ${gradients[index % 3]} group-hover:w-full transition-all duration-700 delay-200 rounded-b-3xl`}
                      />

                      {/* Floating Badge */}
                      <div
                        className={`absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r ${gradients[index % 3]} rounded-full opacity-0 group-hover:opacity-100 animate-ping transition-opacity duration-500`}
                      />
                    </div>
                  )
                })}
            </div>
          ) : (
            <div className='text-center py-20'>
              <div className='text-gray-500 text-xl'>Đang tải bảng giá...</div>
            </div>
          )}

          {/* Bottom CTA */}
          <div className='text-center mt-20'>
            <p className='text-gray-600 text-lg mb-8'>Cần tư vấn thêm? Chúng tôi luôn sẵn sàng hỗ trợ bạn!</p>
            <button
              onClick={() => window.open('https://www.facebook.com/profile.php?id=61577453490643', '_blank')}
              className='px-8 py-4 border-2 border-cyan-400 text-cyan-700 rounded-2xl hover:bg-cyan-50 hover:border-cyan-500 transition-all duration-300 font-bold text-lg'
            >
              💬 Chat với chúng tôi
            </button>
          </div>
        </div>
      </section>

      {/* Premium Footer */}
      <footer className='relative bg-gray-50 border-t border-gray-200 py-20'>
        <div className='max-w-7xl mx-auto px-6'>
          <div className='grid lg:grid-cols-4 gap-12'>
            <div className='lg:col-span-2'>
              <div className='flex items-center space-x-4 mb-8'>
                <div className='relative'>
                  <div className='w-16 h-16 bg-gradient-to-r from-cyan-500 via-blue-500 to-teal-500 rounded-2xl flex items-center justify-center shadow-lg'>
                    <BookOpen className='w-8 h-8 text-white' />
                  </div>
                  <div className='absolute inset-0 bg-gradient-to-r from-cyan-500 via-blue-500 to-teal-500 rounded-2xl blur-xl opacity-50 animate-pulse' />
                </div>
                <div>
                  <span className='text-3xl font-black bg-gradient-to-r from-cyan-600 via-blue-600 to-teal-600 bg-clip-text text-transparent'>
                    Thionl
                  </span>
                  <div className='text-cyan-600 font-bold'>Giáo dục thông minh cho tương lai</div>
                </div>
              </div>

              <p className='text-gray-600 mb-8 text-lg leading-relaxed max-w-lg'>
                Chúng tôi tin rằng AI có thể biến đổi giáo dục Việt Nam, mang lại cơ hội học tập tốt nhất cho mọi học
                sinh trên khắp đất nước.
                <span className='font-bold text-cyan-600'> Hãy cùng chúng tôi tạo nên tương lai!</span>
              </p>

              <div className='flex space-x-4'>
                {[
                  { icon: Heart, color: 'hover:bg-red-500' },
                  { icon: Globe, color: 'hover:bg-cyan-500' },
                  { icon: Zap, color: 'hover:bg-blue-500' },
                  { icon: Brain, color: 'hover:bg-teal-500' }
                ].map((item, index) => (
                  <div
                    key={index}
                    className={`w-14 h-14 bg-gray-200 ${item.color} hover:text-white rounded-2xl flex items-center justify-center transition-all duration-300 cursor-pointer group hover:scale-110 hover:-translate-y-1 shadow-lg`}
                  >
                    <item.icon className='w-6 h-6 text-gray-600 group-hover:text-white' />
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className='text-gray-800 font-black text-xl mb-8'>Sản phẩm</h3>
              <ul className='space-y-4 text-gray-600'>
                {['Tính năng AI', 'Bảng giá linh hoạt', 'Bảo mật enterprise', 'Tích hợp API'].map((item, index) => (
                  <li key={index}>
                    <a
                      href='#'
                      className='hover:text-cyan-600 transition-colors duration-300 text-lg font-medium hover:font-bold'
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className='text-gray-800 font-black text-xl mb-8'>Hỗ trợ</h3>
              <ul className='space-y-4 text-gray-600'>
                {['Tài liệu đầy đủ', 'Video hướng dẫn', 'Live chat 24/7', 'Cộng đồng'].map((item, index) => (
                  <li key={index}>
                    <a
                      href='#'
                      className='hover:text-cyan-600 transition-colors duration-300 text-lg font-medium hover:font-bold'
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className='border-t border-gray-200 mt-16 pt-8'>
            <div className='flex flex-col md:flex-row justify-between items-center'>
              <div className='text-gray-500 mb-4 md:mb-0 text-lg'>© 2025 Thionl. Tất cả quyền được bảo lưu.</div>
              <div className='flex space-x-8 text-gray-500'>
                {['Điều khoản', 'Bảo mật', 'Cookie'].map((item, index) => (
                  <a key={index} href='#' className='hover:text-cyan-600 transition-colors font-medium'>
                    {item}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>
      <Dialog open={activeVideoDemo} onOpenChange={setActiveVideoDemo}>
        <DialogContent className='sm:max-w-[1080px]'>
          <div className='w-full max-h-[70vh]'>
            <VideoHLSPlayer
              src={
                'https://twitter-clone-minh-ap-southeast-1.s3.ap-southeast-1.amazonaws.com/videos-hls/%5CPd-5QNwShO_z_JTAjLRse/master.m3u8'
              }
              classNames='w-full h-full'
            />
          </div>
        </DialogContent>
      </Dialog>
      {/* Custom Styles */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(50px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shine {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        
        @keyframes fadeOut {
          0% { 
            opacity: 1; 
            transform: translateY(0) scale(1) rotateX(0deg);
            filter: blur(0px);
          }
          100% { 
            opacity: 0; 
            transform: translateY(-30px) scale(0.8) rotateX(-15deg);
            filter: blur(4px);
          }
        }
        
        @keyframes fadeIn {
          0% { 
            opacity: 0; 
            transform: translateY(30px) scale(1.2) rotateX(15deg);
            filter: blur(4px);
          }
          100% { 
            opacity: 1; 
            transform: translateY(0) scale(1) rotateX(0deg);
            filter: blur(0px);
          }
        }
        
        @keyframes charSlideIn {
          0% { 
            opacity: 0; 
            transform: translateY(100%) rotateY(-15deg) scale(0.5);
          }
          50% {
            opacity: 0.7;
            transform: translateY(-10%) rotateY(5deg) scale(1.1);
          }
          100% { 
            opacity: 1; 
            transform: translateY(0) rotateY(0deg) scale(1);
          }
        }
        
        @keyframes charSlideOut {
          0% { 
            opacity: 1; 
            transform: translateY(0) rotateY(0deg) scale(1);
          }
          50% {
            opacity: 0.3;
            transform: translateY(-20%) rotateY(-10deg) scale(0.9);
          }
          100% { 
            opacity: 0; 
            transform: translateY(-100%) rotateY(15deg) scale(0.5);
          }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        
        .animate-shine {
          animation: shine 3s linear infinite;
        }
        
        /* Enhanced RotatingText Animations */
        .rotating-text-animating {
          animation: fadeOut 0.4s ease-in-out forwards;
        }
        
        .rotating-text-stable {
          animation: fadeIn 0.8s ease-out forwards;
        }
        
        .rotating-char {
          display: inline-block;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .rotating-text-animating .rotating-char {
          animation: charSlideOut 0.4s ease-in-out forwards;
        }
        
        .rotating-text-stable .rotating-char {
          animation: charSlideIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        
        /* Soft pastel colors that match blue-white theme */
        .gradient-text-1 {
          color: #38bdf8; /* Sky blue - soft and elegant */
          display: inline-block;
          font-weight: 900;
        }
        
        .gradient-text-2 {
          color: #06b6d4; /* Cyan 500 - fresh and modern */
          display: inline-block;
          font-weight: 900;
        }
        
        .gradient-text-3 {
          color: #0ea5e9; /* Blue 500 - harmonious with theme */
          display: inline-block;
          font-weight: 900;
        }
        
        /* Try gradient effect only if fully supported */
        @media screen and (-webkit-min-device-pixel-ratio: 0) {
          @supports (-webkit-background-clip: text) and (background-clip: text) {
            .gradient-text-1:hover {
              background: linear-gradient(120deg, #0891b2 30%, #1e40af 50%, #0f766e 70%);
              background-size: 200% 100%;
              -webkit-background-clip: text;
              background-clip: text;
              color: transparent;
            }
            
            .gradient-text-2:hover {
              background: linear-gradient(120deg, #1e40af 30%, #0891b2 50%, #0f766e 70%);
              background-size: 200% 100%;
              -webkit-background-clip: text;
              background-clip: text;
              color: transparent;
            }
            
            .gradient-text-3:hover {
              background: linear-gradient(120deg, #0f766e 30%, #0891b2 50%, #1e40af 70%);
              background-size: 200% 100%;
              -webkit-background-clip: text;
              background-clip: text;
              color: transparent;
            }
          }
        }
        
        .perspective-1000 {
          perspective: 1000px;
        }
        
        .preserve-3d {
          transform-style: preserve-3d;
        }
        
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-600 { animation-delay: 0.6s; }
      `}</style>
    </div>
  )
}

export default UltraStunningHomepage
