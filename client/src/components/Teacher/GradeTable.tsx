/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react'
import { Calculator, MessageCircle, TrendingUp, AlertCircle } from 'lucide-react'
import { calculateSubjectAverage } from '../../constants/comments'
import CommentSelector from './CommentSelector'

interface GradeTableProps {
  data: any
  onChange: (updatedData: any) => void
  filters: any
}

const GradeTable: React.FC<GradeTableProps> = ({ data, onChange, filters }) => {
  const [localData, setLocalData] = useState(data)

  // Sync với prop data khi có thay đổi từ bên ngoài
  useEffect(() => {
    setLocalData(data)
  }, [data])

  // Cập nhật điểm
  const updateScore = (studentIndex: number, examType: string, scoreIndex: number | null, newScore: number | null) => {
    const updatedData = { ...localData }
    const student = updatedData.students[studentIndex]

    if (examType === 'TX') {
      if (!student.scores.TX) student.scores.TX = []
      if (scoreIndex !== null) {
        student.scores.TX[scoreIndex] = newScore
      } else {
        student.scores.TX.push(newScore)
      }
    } else {
      student.scores[examType] = newScore
    }

    // Tính lại điểm trung bình
    const validTX = student.scores.TX ? student.scores.TX.filter((s: any) => s !== null && s !== undefined) : []
    if (validTX.length > 0 || student.scores.GK !== null || student.scores.CK !== null) {
      student.average_score = calculateSubjectAverage({
        tx: validTX,
        gk: student.scores.GK || 0,
        ck: student.scores.CK || 0
      })
    } else {
      student.average_score = null
    }

    setLocalData(updatedData)
    onChange(updatedData)
  }

  // Cập nhật nhận xét
  const updateComment = (studentIndex: number, commentType: 'strengths' | 'weaknesses' | 'progress', value: any) => {
    const updatedData = { ...localData }
    const student = updatedData.students[studentIndex]

    if (!student.comments) {
      student.comments = { strengths: [], weaknesses: [], progress: '' }
    }

    student.comments[commentType] = value

    setLocalData(updatedData)
    onChange(updatedData)
  }

  // Render ô điểm
  const renderScoreInput = (student: any, studentIndex: number, examType: string, scoreIndex: number | null = null) => {
    let currentScore = null

    if (examType === 'TX' && scoreIndex !== null) {
      currentScore = student.scores.TX?.[scoreIndex] || null
    } else if (examType !== 'TX') {
      currentScore = student.scores[examType] || null
    }

    return (
      <input
        type='number'
        min='0'
        max='10'
        step='0.1'
        value={currentScore || ''}
        onChange={(e) => {
          const value = e.target.value === '' ? null : parseFloat(e.target.value)
          updateScore(studentIndex, examType, scoreIndex, value)
        }}
        className='w-16 px-2 py-1 text-center border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all'
        placeholder='--'
      />
    )
  }

  // Render điểm trung bình với màu sắc
  const renderAverageScore = (score: number | null) => {
    if (score === null) return <span className='text-gray-400'>--</span>

    let colorClass = ''
    let bgClass = ''

    if (score >= 9.0) {
      colorClass = 'text-purple-700'
      bgClass = 'bg-purple-100'
    } else if (score >= 8.0) {
      colorClass = 'text-green-700'
      bgClass = 'bg-green-100'
    } else if (score >= 7.0) {
      colorClass = 'text-blue-700'
      bgClass = 'bg-blue-100'
    } else if (score >= 5.0) {
      colorClass = 'text-yellow-700'
      bgClass = 'bg-yellow-100'
    } else {
      colorClass = 'text-red-700'
      bgClass = 'bg-red-100'
    }

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-lg font-semibold text-sm ${colorClass} ${bgClass}`}>
        <Calculator className='w-3 h-3 mr-1' />
        {score.toFixed(1)}
      </span>
    )
  }

  if (!localData?.students || localData.students.length === 0) {
    return (
      <div className='p-8 text-center text-gray-500'>
        <AlertCircle className='w-12 h-12 mx-auto mb-4 text-gray-400' />
        <p className='text-lg'>Không có dữ liệu học sinh</p>
      </div>
    )
  }

  return (
    <div className='overflow-x-auto'>
      <table className='w-full min-w-[1200px]'>
        <thead>
          <tr className='bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200'>
            <th className='sticky left-0 bg-gray-50 px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200'>
              STT
            </th>
            <th className='sticky left-12 bg-gray-50 px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-r border-gray-200 min-w-[200px]'>
              Họ và tên học sinh
            </th>

            {/* Cột điểm thường xuyên */}
            <th className='px-4 py-3 text-center text-xs font-bold text-blue-700 uppercase tracking-wider border-r border-gray-200'>
              <div className='flex items-center justify-center'>
                <span>TX1</span>
              </div>
            </th>
            <th className='px-4 py-3 text-center text-xs font-bold text-blue-700 uppercase tracking-wider border-r border-gray-200'>
              <div className='flex items-center justify-center'>
                <span>TX2</span>
              </div>
            </th>
            <th className='px-4 py-3 text-center text-xs font-bold text-blue-700 uppercase tracking-wider border-r border-gray-200'>
              <div className='flex items-center justify-center'>
                <span>TX3</span>
              </div>
            </th>

            {/* Cột điểm giữa kỳ */}
            <th className='px-4 py-3 text-center text-xs font-bold text-green-700 uppercase tracking-wider border-r border-gray-200'>
              <div className='flex items-center justify-center'>
                <span>GK</span>
              </div>
            </th>

            {/* Cột điểm cuối kỳ */}
            <th className='px-4 py-3 text-center text-xs font-bold text-purple-700 uppercase tracking-wider border-r border-gray-200'>
              <div className='flex items-center justify-center'>
                <span>CK</span>
              </div>
            </th>

            {/* Cột điểm trung bình */}
            <th className='px-4 py-3 text-center text-xs font-bold text-orange-700 uppercase tracking-wider border-r border-gray-200'>
              <div className='flex items-center justify-center'>
                <Calculator className='w-3 h-3 mr-1' />
                <span>ĐTBm</span>
              </div>
            </th>

            {/* Cột nhận xét */}
            <th className='px-6 py-3 text-center text-xs font-bold text-red-700 uppercase tracking-wider border-r border-gray-200 min-w-[250px]'>
              <div className='flex items-center justify-center'>
                <MessageCircle className='w-3 h-3 mr-1' />
                <span>Ưu điểm nổi bật</span>
              </div>
            </th>
            <th className='px-6 py-3 text-center text-xs font-bold text-yellow-700 uppercase tracking-wider border-r border-gray-200 min-w-[250px]'>
              <div className='flex items-center justify-center'>
                <AlertCircle className='w-3 h-3 mr-1' />
                <span>Hạn chế cần khắc phục</span>
              </div>
            </th>
            <th className='px-6 py-3 text-center text-xs font-bold text-indigo-700 uppercase tracking-wider min-w-[250px]'>
              <div className='flex items-center justify-center'>
                <TrendingUp className='w-3 h-3 mr-1' />
                <span>Sự tiến bộ</span>
              </div>
            </th>
          </tr>
        </thead>
        <tbody className='bg-white divide-y divide-gray-200'>
          {localData.students.map((student: any, studentIndex: number) => (
            <tr key={student.student_id} className='hover:bg-gray-50 transition-colors'>
              {/* STT */}
              <td className='sticky left-0 bg-white px-4 py-4 text-sm font-medium text-gray-900 border-r border-gray-200'>
                {studentIndex + 1}
              </td>

              {/* Họ tên */}
              <td className='sticky left-12 bg-white px-6 py-4 border-r border-gray-200'>
                <div>
                  <div className='text-sm font-semibold text-gray-900'>{student.student_name}</div>
                  <div className='text-xs text-gray-500'>@{student.student_username}</div>
                </div>
              </td>

              {/* Điểm TX */}
              <td className='px-4 py-4 text-center border-r border-gray-200'>
                {renderScoreInput(student, studentIndex, 'TX', 0)}
              </td>
              <td className='px-4 py-4 text-center border-r border-gray-200'>
                {renderScoreInput(student, studentIndex, 'TX', 1)}
              </td>
              <td className='px-4 py-4 text-center border-r border-gray-200'>
                {renderScoreInput(student, studentIndex, 'TX', 2)}
              </td>

              {/* Điểm GK */}
              <td className='px-4 py-4 text-center border-r border-gray-200'>
                {renderScoreInput(student, studentIndex, 'GK')}
              </td>

              {/* Điểm CK */}
              <td className='px-4 py-4 text-center border-r border-gray-200'>
                {renderScoreInput(student, studentIndex, 'CK')}
              </td>

              {/* Điểm trung bình */}
              <td className='px-4 py-4 text-center border-r border-gray-200'>
                {renderAverageScore(student.average_score)}
              </td>

              {/* Nhận xét ưu điểm */}
              <td className='px-4 py-4 border-r border-gray-200'>
                <CommentSelector
                  studentScore={student.average_score}
                  commentType='STRENGTH'
                  selectedComments={student.comments?.strengths || []}
                  onChange={(comments) => updateComment(studentIndex, 'strengths', comments)}
                  filters={filters}
                />
              </td>

              {/* Nhận xét hạn chế */}
              <td className='px-4 py-4 border-r border-gray-200'>
                <CommentSelector
                  studentScore={student.average_score}
                  commentType='WEAKNESS'
                  selectedComments={student.comments?.weaknesses || []}
                  onChange={(comments) => updateComment(studentIndex, 'weaknesses', comments)}
                  filters={filters}
                />
              </td>

              {/* Nhận xét tiến bộ */}
              <td className='px-4 py-4'>
                <CommentSelector
                  studentScore={student.average_score}
                  commentType='PROGRESS'
                  selectedComments={student.comments?.progress ? [student.comments.progress] : []}
                  onChange={(comments) => updateComment(studentIndex, 'progress', comments[0] || '')}
                  filters={filters}
                  singleSelect={true}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default GradeTable
