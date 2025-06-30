/* eslint-disable @typescript-eslint/no-explicit-any */
import { School, BookOpen, Calendar, GraduationCap } from 'lucide-react'

interface GradeFiltersProps {
  filters: {
    className: string
    subjectId: string
    semester: number
    schoolYear: string
  }
  subjects: any[]
  onChange: (filters: any) => void
}

const GradeFilters: React.FC<GradeFiltersProps> = ({ filters, subjects, onChange }) => {
  console.log(subjects)

  const classList = [
    '1A',
    '1B',
    '1C',
    '1D',
    '2A',
    '2B',
    '2C',
    '2D',
    '3A',
    '3B',
    '3C',
    '3D',
    '4A',
    '4B',
    '4C',
    '4D',
    '5A',
    '5B',
    '5C',
    '5D',
    '6A',
    '6B',
    '6C',
    '6D',
    '7A',
    '7B',
    '7C',
    '7D',
    '8A',
    '8B',
    '8C',
    '8D',
    '9A',
    '9B',
    '9C',
    '9D',
    '10A',
    '10B',
    '10C',
    '10D',
    '11A',
    '11B',
    '11C',
    '11D',
    '12A',
    '12B',
    '12C',
    '12D'
  ]

  const currentYear = new Date().getFullYear()
  const schoolYears = [
    `${currentYear - 1}-${currentYear}`,
    `${currentYear}-${currentYear + 1}`,
    `${currentYear + 1}-${currentYear + 2}`
  ]

  return (
    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
      {/* Chọn lớp học */}
      <div className='space-y-2'>
        <label className='flex items-center text-sm font-semibold text-gray-700 mb-2'>
          <School className='w-4 h-4 mr-2 text-blue-600' />
          Lớp học
        </label>
        <select
          value={filters.className}
          onChange={(e) => onChange({ className: e.target.value })}
          className='w-full px-4 py-3 bg-white/80 backdrop-blur border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500/50 transition-all duration-300 text-gray-900 font-medium shadow-sm'
        >
          <option value=''>-- Chọn lớp --</option>
          {classList.map((className) => (
            <option key={className} value={className}>
              Lớp {className}
            </option>
          ))}
        </select>
      </div>

      {/* Chọn môn học */}
      <div className='space-y-2'>
        <label className='flex items-center text-sm font-semibold text-gray-700 mb-2'>
          <BookOpen className='w-4 h-4 mr-2 text-green-600' />
          Môn học
        </label>
        <select
          value={filters.subjectId}
          onChange={(e) => onChange({ subjectId: e.target.value })}
          className='w-full px-4 py-3 bg-white/80 backdrop-blur border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-green-500/20 focus:border-green-500/50 transition-all duration-300 text-gray-900 font-medium shadow-sm'
        >
          <option value=''>-- Chọn môn học --</option>
          {subjects.map((subject) => (
            <option key={subject._id} value={subject._id}>
              {subject.name}
            </option>
          ))}
        </select>
      </div>

      {/* Chọn học kỳ */}
      <div className='space-y-2'>
        <label className='flex items-center text-sm font-semibold text-gray-700 mb-2'>
          <Calendar className='w-4 h-4 mr-2 text-purple-600' />
          Học kỳ
        </label>
        <select
          value={filters.semester}
          onChange={(e) => onChange({ semester: parseInt(e.target.value) })}
          className='w-full px-4 py-3 bg-white/80 backdrop-blur border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all duration-300 text-gray-900 font-medium shadow-sm'
        >
          <option value={1}>Học kỳ 1</option>
          <option value={2}>Học kỳ 2</option>
        </select>
      </div>

      {/* Chọn năm học */}
      <div className='space-y-2'>
        <label className='flex items-center text-sm font-semibold text-gray-700 mb-2'>
          <GraduationCap className='w-4 h-4 mr-2 text-orange-600' />
          Năm học
        </label>
        <select
          value={filters.schoolYear}
          onChange={(e) => onChange({ schoolYear: e.target.value })}
          className='w-full px-4 py-3 bg-white/80 backdrop-blur border border-gray-200/50 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500/50 transition-all duration-300 text-gray-900 font-medium shadow-sm'
        >
          {schoolYears.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default GradeFilters
