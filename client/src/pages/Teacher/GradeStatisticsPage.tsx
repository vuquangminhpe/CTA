/* eslint-disable @typescript-eslint/no-explicit-any */
// client/src/pages/Teacher/GradeStatisticsPage.tsx
import React, { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Book, Save, TrendingUp, Users, FileSpreadsheet, Filter, RefreshCw } from 'lucide-react'
import GradeTable from '../../components/Teacher/GradeTable'
import GradeFilters from '../../components/Teacher/GradeFilters'
import gradesApi from '../../apis/grades.api'

interface GradeFilters {
  className: string
  subjectId: string
  semester: number
  schoolYear: string
}

const GradeStatisticsPage: React.FC = () => {
  const queryClient = useQueryClient()

  // State cho filters
  const [filters, setFilters] = useState<GradeFilters>({
    className: '',
    subjectId: '',
    semester: 1,
    schoolYear: '2024-2025'
  })

  // State cho dữ liệu bảng điểm
  const [gradeData, setGradeData] = useState<any>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Query lấy danh sách môn học
  const { data: subjectsData } = useQuery({
    queryKey: ['subjects'],
    queryFn: () => gradesApi.getSubjects(),
    staleTime: 30 * 60 * 1000 // 30 phút
  })

  // Query lấy dữ liệu bảng điểm
  const {
    data: classGradesData,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['classGrades', filters],
    queryFn: () => gradesApi.getClassGrades(filters),
    enabled: !!(filters.className && filters.subjectId && filters.semester && filters.schoolYear),
    staleTime: 5 * 60 * 1000 // 5 phút
  })

  // Mutation cập nhật hàng loạt
  const bulkUpdateMutation = useMutation({
    mutationFn: gradesApi.updateBulkGrades,
    onSuccess: () => {
      toast.success('Cập nhật điểm và nhận xét thành công!')
      setHasUnsavedChanges(false)
      queryClient.invalidateQueries({ queryKey: ['classGrades'] })
    },
    onError: (error: any) => {
      toast.error(`Lỗi khi cập nhật: ${error?.response?.data?.message || 'Vui lòng thử lại'}`)
    }
  })

  // Cập nhật gradeData khi có dữ liệu mới
  useEffect(() => {
    if (classGradesData?.data?.result) {
      setGradeData(classGradesData.data.result)
      setHasUnsavedChanges(false)
    }
  }, [classGradesData])

  // Xử lý khi thay đổi filters
  const handleFiltersChange = (newFilters: Partial<GradeFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
    setGradeData(null) // Reset dữ liệu khi thay đổi filter
  }

  // Xử lý khi có thay đổi điểm hoặc nhận xét
  const handleDataChange = (updatedData: any) => {
    setGradeData(updatedData)
    setHasUnsavedChanges(true)
  }

  // Xử lý lưu dữ liệu
  const handleSave = async () => {
    if (!gradeData || !hasUnsavedChanges) return

    try {
      // Chuẩn bị dữ liệu để gửi
      const gradesData = []
      const commentsData = []

      for (const student of gradeData.students) {
        // Thu thập điểm
        if (student.scores.TX) {
          student.scores.TX.forEach((score: number, index: number) => {
            if (score !== null && score !== undefined) {
              gradesData.push({
                student_id: student.student_id,
                exam_type: 'TX',
                exam_sequence: index + 1,
                score: score
              })
            }
          })
        }

        if (student.scores.GK !== null && student.scores.GK !== undefined) {
          gradesData.push({
            student_id: student.student_id,
            exam_type: 'GK',
            score: student.scores.GK
          })
        }

        if (student.scores.CK !== null && student.scores.CK !== undefined) {
          gradesData.push({
            student_id: student.student_id,
            exam_type: 'CK',
            score: student.scores.CK
          })
        }

        // Thu thập nhận xét
        if (student.comments) {
          commentsData.push({
            student_id: student.student_id,
            strengths: student.comments.strengths || [],
            weaknesses: student.comments.weaknesses || [],
            progress: student.comments.progress || '',
            average_score: student.average_score
          })
        }
      }

      await bulkUpdateMutation.mutateAsync({
        grades: gradesData as any,
        comments: commentsData,
        class_name: filters.className,
        subject_id: filters.subjectId,
        semester: filters.semester,
        school_year: filters.schoolYear
      })
    } catch (error) {
      console.error('Error saving data:', error)
    }
  }

  // Tính toán thống kê
  const getStatistics = () => {
    if (!gradeData?.students) return null

    const students = gradeData.students
    const totalStudents = students.length
    const studentsWithGrades = students.filter((s: any) => s.average_score !== null)

    const excellent = studentsWithGrades.filter((s: any) => s.average_score >= 9.0).length
    const good = studentsWithGrades.filter((s: any) => s.average_score >= 8.0 && s.average_score < 9.0).length
    const averageHigh = studentsWithGrades.filter((s: any) => s.average_score >= 7.0 && s.average_score < 8.0).length
    const average = studentsWithGrades.filter((s: any) => s.average_score >= 5.0 && s.average_score < 7.0).length
    const belowAverage = studentsWithGrades.filter((s: any) => s.average_score < 5.0).length

    const totalScore = studentsWithGrades.reduce((sum: number, s: any) => sum + s.average_score, 0)
    const classAverage = studentsWithGrades.length > 0 ? (totalScore / studentsWithGrades.length).toFixed(2) : 'N/A'

    return {
      totalStudents,
      studentsWithGrades: studentsWithGrades.length,
      excellent,
      good,
      averageHigh,
      average,
      belowAverage,
      classAverage
    }
  }

  const statistics = getStatistics()

  return (
    <div className='min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/50 to-indigo-50/30'>
      {/* Animated Background */}
      <div className='fixed inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse'></div>
        <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000'></div>
      </div>

      <div className='relative z-10 max-w-[1920px] mx-auto py-8 px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-8 shadow-2xl shadow-blue-500/10 mb-8'>
          <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between'>
            <div className='flex items-center mb-6 lg:mb-0'>
              <div className='w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg'>
                <Book className='w-6 h-6 text-white' />
              </div>
              <div>
                <h1 className='text-4xl font-black bg-gradient-to-r from-gray-900 via-blue-800 to-purple-800 bg-clip-text text-transparent'>
                  Thống kê điểm theo lớp
                </h1>
                <p className='text-xl text-gray-600 font-medium mt-1'>
                  Nhập điểm và nhận xét học sinh theo chuẩn Bộ GD&ĐT
                </p>
              </div>
            </div>

            <div className='flex items-center gap-4'>
              <button
                onClick={() => refetch()}
                disabled={isLoading}
                className='inline-flex items-center px-6 py-3 bg-white/80 text-gray-700 border border-gray-200/50 rounded-2xl hover:bg-white hover:shadow-lg transition-all duration-300 font-semibold disabled:opacity-50'
              >
                <RefreshCw className={`w-5 h-5 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Làm mới
              </button>

              {hasUnsavedChanges && (
                <button
                  onClick={handleSave}
                  disabled={bulkUpdateMutation.isPending}
                  className='inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-2xl hover:from-green-600 hover:to-emerald-600 transition-all duration-300 shadow-lg hover:shadow-green-500/25 hover:scale-105 font-semibold disabled:opacity-50'
                >
                  <Save className='w-5 h-5 mr-2' />
                  {bulkUpdateMutation.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-6 shadow-xl shadow-blue-500/5 mb-8'>
          <div className='flex items-center mb-4'>
            <Filter className='w-5 h-5 text-blue-600 mr-2' />
            <h2 className='text-xl font-bold text-gray-900'>Bộ lọc</h2>
          </div>

          <GradeFilters filters={filters} subjects={subjectsData?.data?.result || []} onChange={handleFiltersChange} />
        </div>

        {/* Statistics */}
        {statistics && (
          <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-6 shadow-xl shadow-blue-500/5 mb-8'>
            <div className='flex items-center mb-4'>
              <TrendingUp className='w-5 h-5 text-green-600 mr-2' />
              <h2 className='text-xl font-bold text-gray-900'>Thống kê tổng quan</h2>
            </div>

            <div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4'>
              <div className='bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200/50'>
                <div className='text-sm text-blue-600 font-medium'>Tổng số HS</div>
                <div className='text-2xl font-bold text-blue-900'>{statistics.totalStudents}</div>
              </div>

              <div className='bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 border border-purple-200/50'>
                <div className='text-sm text-purple-600 font-medium'>Xuất sắc (≥9.0)</div>
                <div className='text-2xl font-bold text-purple-900'>{statistics.excellent}</div>
              </div>

              <div className='bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 border border-green-200/50'>
                <div className='text-sm text-green-600 font-medium'>Giỏi (8.0-8.9)</div>
                <div className='text-2xl font-bold text-green-900'>{statistics.good}</div>
              </div>

              <div className='bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-4 border border-yellow-200/50'>
                <div className='text-sm text-yellow-600 font-medium'>Khá (7.0-7.9)</div>
                <div className='text-2xl font-bold text-yellow-900'>{statistics.averageHigh}</div>
              </div>

              <div className='bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-4 border border-orange-200/50'>
                <div className='text-sm text-orange-600 font-medium'>TB (5.0-6.9)</div>
                <div className='text-2xl font-bold text-orange-900'>{statistics.average}</div>
              </div>

              <div className='bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-4 border border-red-200/50'>
                <div className='text-sm text-red-600 font-medium'>{`Yếu (< 5.0)`}</div>
                <div className='text-2xl font-bold text-red-900'>{statistics.belowAverage}</div>
              </div>

              <div className='bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-4 border border-indigo-200/50'>
                <div className='text-sm text-indigo-600 font-medium'>ĐTB lớp</div>
                <div className='text-2xl font-bold text-indigo-900'>{statistics.classAverage}</div>
              </div>
            </div>
          </div>
        )}

        {/* Grade Table */}
        {isLoading ? (
          <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-16 shadow-xl shadow-blue-500/5'>
            <div className='flex flex-col items-center justify-center'>
              <div className='inline-block relative'>
                <div className='w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin'></div>
                <div className='absolute inset-0 w-12 h-12 border-4 border-transparent border-t-purple-600 rounded-full animate-spin animation-delay-150'></div>
              </div>
              <p className='mt-4 text-lg text-gray-600 font-medium'>Đang tải dữ liệu...</p>
            </div>
          </div>
        ) : gradeData ? (
          <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl shadow-xl shadow-blue-500/5 overflow-hidden'>
            <div className='p-6 border-b border-gray-200/50'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center'>
                  <FileSpreadsheet className='w-5 h-5 text-blue-600 mr-2' />
                  <h2 className='text-xl font-bold text-gray-900'>
                    Bảng điểm - {gradeData.subject?.name} - Lớp {filters.className}
                  </h2>
                </div>

                <div className='flex items-center text-sm text-gray-600'>
                  <Users className='w-4 h-4 mr-1' />
                  <span>{gradeData.students?.length || 0} học sinh</span>
                </div>
              </div>
            </div>

            <GradeTable data={gradeData} onChange={handleDataChange} filters={filters} />
          </div>
        ) : (
          <div className='backdrop-blur-xl bg-white/70 border border-white/20 rounded-3xl p-16 shadow-xl shadow-blue-500/5'>
            <div className='text-center'>
              <div className='w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto mb-6'>
                <Book className='w-10 h-10 text-gray-400' />
              </div>
              <h3 className='text-2xl font-bold text-gray-900 mb-3'>Chọn bộ lọc để xem dữ liệu</h3>
              <p className='text-lg text-gray-600 max-w-md mx-auto'>
                Vui lòng chọn đầy đủ thông tin lớp học, môn học và học kỳ để hiển thị bảng điểm.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default GradeStatisticsPage
