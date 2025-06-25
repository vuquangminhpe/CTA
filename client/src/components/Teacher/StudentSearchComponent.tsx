/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useRef } from 'react'
import { Search, Camera, Upload, X, User, Eye, AlertCircle, Filter, SortAsc } from 'lucide-react'
import { toast } from 'sonner'

interface StudentResult {
  _id: string
  name: string
  username: string
  avatar?: string
  class: string
  age?: number
  gender?: 'nam' | 'nữ'
  similarity?: number
  confidence?: 'high' | 'medium' | 'low'
  match_reason?: string
  created_at: string
}

interface SearchFilters {
  age_range?: [number, number]
  gender?: 'nam' | 'nữ' | ''
  class_filter?: string
  confidence_filter?: 'high' | 'medium' | 'low' | ''
}

const StudentSearchComponent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'text' | 'image'>('text')
  const [searchText, setSearchText] = useState('')
  const [searchImage, setSearchImage] = useState<File | null>(null)
  const [searchImagePreview, setSearchImagePreview] = useState<string>('')
  const [searchResults, setSearchResults] = useState<StudentResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({})
  const [sortBy, setSortBy] = useState<'similarity' | 'name' | 'class' | 'age'>('similarity')

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleTextSearch = async () => {
    if (!searchText.trim()) {
      toast.error('Vui lòng nhập từ khóa tìm kiếm')
      return
    }

    setIsSearching(true)

    try {
      const response = await fetch('https://dsf-32wz.onrender.com/api/search/students/text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        },
        body: JSON.stringify({
          search_text: searchText,
          limit: 20,
          ...filters
        })
      })

      if (!response.ok) {
        throw new Error('Tìm kiếm thất bại')
      }

      const result = await response.json()
      setSearchResults(result.result.students || [])

      if (result.result.students.length === 0) {
        toast.info('Không tìm thấy học sinh nào phù hợp')
      } else {
        toast.success(`Tìm thấy ${result.result.students.length} học sinh`)
      }
    } catch (error: any) {
      console.error('Text search error:', error)
      toast.error(error.message || 'Có lỗi xảy ra khi tìm kiếm')
    } finally {
      setIsSearching(false)
    }
  }

  const handleImageSearch = async () => {
    if (!searchImage) {
      toast.error('Vui lòng chọn ảnh để tìm kiếm')
      return
    }

    setIsSearching(true)

    try {
      const formData = new FormData()
      formData.append('search_image', searchImage)
      formData.append('limit', '20')

      // Add filters to FormData
      if (filters.age_range) {
        formData.append('age_range', JSON.stringify(filters.age_range))
      }
      if (filters.gender) {
        formData.append('gender', filters.gender)
      }
      if (filters.class_filter) {
        formData.append('class_filter', filters.class_filter)
      }

      const response = await fetch('https://dsf-32wz.onrender.com/api/search/students/image', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${localStorage.getItem('access_token')}`
        },
        body: formData
      })

      if (!response.ok) {
        throw new Error('Tìm kiếm bằng ảnh thất bại')
      }

      const result = await response.json()
      setSearchResults(result.result.students || [])

      if (result.result.students.length === 0) {
        toast.info('Không tìm thấy học sinh nào có khuôn mặt tương tự')
      } else {
        toast.success(`Tìm thấy ${result.result.students.length} học sinh có khuôn mặt tương tự`)
      }
    } catch (error: any) {
      console.error('Image search error:', error)
      toast.error(error.message || 'Có lỗi xảy ra khi tìm kiếm bằng ảnh')
    } finally {
      setIsSearching(false)
    }
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Vui lòng chọn file ảnh')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Kích thước ảnh không được vượt quá 5MB')
      return
    }

    setSearchImage(file)

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setSearchImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const clearSearchImage = () => {
    setSearchImage(null)
    setSearchImagePreview('')
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  const clearSearchResults = () => {
    setSearchResults([])
    setSearchText('')
    clearSearchImage()
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return 'text-green-600 bg-green-100'
      case 'medium':
        return 'text-yellow-600 bg-yellow-100'
      case 'low':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getSimilarityColor = (similarity: number) => {
    if (similarity >= 0.8) return 'text-green-600'
    if (similarity >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const sortedResults = [...searchResults].sort((a, b) => {
    switch (sortBy) {
      case 'similarity':
        return (b.similarity || 0) - (a.similarity || 0)
      case 'name':
        return a.name.localeCompare(b.name)
      case 'class':
        return a.class.localeCompare(b.class)
      case 'age':
        return (a.age || 0) - (b.age || 0)
      default:
        return 0
    }
  })

  return (
    <div className='max-w-6xl mx-auto p-6'>
      <div className='bg-white rounded-lg shadow-lg'>
        {/* Header */}
        <div className='border-b border-gray-200 p-6'>
          <h2 className='text-xl font-semibold text-gray-900'>Tìm kiếm học sinh</h2>
          <p className='text-sm text-gray-600 mt-1'>Tìm kiếm học sinh bằng tên, thông tin hoặc khuôn mặt</p>
        </div>

        {/* Search Tabs */}
        <div className='border-b border-gray-200'>
          <nav className='flex space-x-8 px-6'>
            <button
              onClick={() => setActiveTab('text')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'text'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Search className='w-4 h-4 inline mr-2' />
              Tìm kiếm bằng tên
            </button>
            <button
              onClick={() => setActiveTab('image')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'image'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Camera className='w-4 h-4 inline mr-2' />
              Tìm kiếm bằng ảnh
            </button>
          </nav>
        </div>

        {/* Search Content */}
        <div className='p-6'>
          {activeTab === 'text' && (
            <div className='space-y-4'>
              <div className='flex gap-4'>
                <div className='flex-1'>
                  <input
                    type='text'
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    placeholder='Nhập tên học sinh, lớp, hoặc thông tin khác...'
                    className='w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500'
                    onKeyPress={(e) => e.key === 'Enter' && handleTextSearch()}
                  />
                </div>
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center'
                >
                  <Filter className='w-4 h-4 mr-2' />
                  Bộ lọc
                </button>
                <button
                  onClick={handleTextSearch}
                  disabled={isSearching}
                  className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center'
                >
                  {isSearching ? (
                    <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2' />
                  ) : (
                    <Search className='w-4 h-4 mr-2' />
                  )}
                  Tìm kiếm
                </button>
              </div>
            </div>
          )}

          {activeTab === 'image' && (
            <div className='space-y-4'>
              <div className='border-2 border-dashed border-gray-300 rounded-lg p-6'>
                {searchImagePreview ? (
                  <div className='relative'>
                    <img src={searchImagePreview} alt='Search preview' className='max-w-xs mx-auto rounded-lg' />
                    <button
                      onClick={clearSearchImage}
                      className='absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600'
                    >
                      <X className='w-4 h-4' />
                    </button>
                  </div>
                ) : (
                  <div className='text-center'>
                    <Camera className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                    <p className='text-gray-600 mb-4'>Chọn ảnh để tìm kiếm học sinh có khuôn mặt tương tự</p>
                    <div className='flex justify-center gap-4'>
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className='px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center'
                      >
                        <Upload className='w-4 h-4 mr-2' />
                        Chọn từ thư viện
                      </button>
                      <button
                        onClick={() => cameraInputRef.current?.click()}
                        className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center'
                      >
                        <Camera className='w-4 h-4 mr-2' />
                        Chụp ảnh
                      </button>
                    </div>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type='file'
                  accept='image/*'
                  onChange={handleImageUpload}
                  className='hidden'
                />
                <input
                  ref={cameraInputRef}
                  type='file'
                  accept='image/*'
                  capture='user'
                  onChange={handleImageUpload}
                  className='hidden'
                />
              </div>

              {searchImage && (
                <div className='flex justify-center gap-4'>
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className='px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center'
                  >
                    <Filter className='w-4 h-4 mr-2' />
                    Bộ lọc
                  </button>
                  <button
                    onClick={handleImageSearch}
                    disabled={isSearching}
                    className='px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center'
                  >
                    {isSearching ? (
                      <div className='w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2' />
                    ) : (
                      <Search className='w-4 h-4 mr-2' />
                    )}
                    Tìm kiếm bằng ảnh
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Filters */}
          {showFilters && (
            <div className='mt-4 p-4 bg-gray-50 rounded-lg'>
              <h4 className='font-medium text-gray-900 mb-3'>Bộ lọc tìm kiếm</h4>
              <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Giới tính</label>
                  <select
                    value={filters.gender || ''}
                    onChange={(e) => setFilters({ ...filters, gender: e.target.value as any })}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm'
                  >
                    <option value=''>Tất cả</option>
                    <option value='nam'>Nam</option>
                    <option value='nữ'>Nữ</option>
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Lớp</label>
                  <input
                    type='text'
                    value={filters.class_filter || ''}
                    onChange={(e) => setFilters({ ...filters, class_filter: e.target.value })}
                    placeholder='Ví dụ: 8A'
                    className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm'
                  />
                </div>

                <div>
                  <label className='block text-sm font-medium text-gray-700 mb-1'>Độ tin cậy (chỉ ảnh)</label>
                  <select
                    value={filters.confidence_filter || ''}
                    onChange={(e) => setFilters({ ...filters, confidence_filter: e.target.value as any })}
                    className='w-full px-3 py-2 border border-gray-300 rounded-md text-sm'
                    disabled={activeTab !== 'image'}
                  >
                    <option value=''>Tất cả</option>
                    <option value='high'>Cao</option>
                    <option value='medium'>Trung bình</option>
                    <option value='low'>Thấp</option>
                  </select>
                </div>

                <div className='flex items-end'>
                  <button
                    onClick={() => setFilters({})}
                    className='px-4 py-2 text-sm text-gray-600 hover:text-gray-800'
                  >
                    Xóa bộ lọc
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Results */}
          {searchResults.length > 0 && (
            <div className='mt-6'>
              <div className='flex justify-between items-center mb-4'>
                <h3 className='text-lg font-medium text-gray-900'>Kết quả tìm kiếm ({searchResults.length})</h3>
                <div className='flex items-center gap-4'>
                  <div className='flex items-center'>
                    <SortAsc className='w-4 h-4 mr-2 text-gray-500' />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className='text-sm border border-gray-300 rounded px-2 py-1'
                    >
                      <option value='similarity'>Độ tương tự</option>
                      <option value='name'>Tên</option>
                      <option value='class'>Lớp</option>
                      <option value='age'>Tuổi</option>
                    </select>
                  </div>
                  <button
                    onClick={clearSearchResults}
                    className='px-3 py-1 text-sm text-gray-600 hover:text-gray-800 border border-gray-300 rounded'
                  >
                    Xóa kết quả
                  </button>
                </div>
              </div>

              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
                {sortedResults.map((student) => (
                  <div
                    key={student._id}
                    className='border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow'
                  >
                    <div className='flex items-start justify-between mb-3'>
                      <div className='flex items-center'>
                        {student.avatar ? (
                          <img
                            src={student.avatar}
                            alt={student.name}
                            className='w-10 h-10 rounded-full object-cover'
                          />
                        ) : (
                          <div className='w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center'>
                            <User className='w-5 h-5 text-gray-500' />
                          </div>
                        )}
                        <div className='ml-3'>
                          <h4 className='font-medium text-gray-900'>{student.name}</h4>
                          <p className='text-sm text-gray-600'>@{student.username}</p>
                        </div>
                      </div>

                      {student.similarity && (
                        <div className='text-right'>
                          <div className={`text-sm font-medium ${getSimilarityColor(student.similarity)}`}>
                            {(student.similarity * 100).toFixed(1)}%
                          </div>
                          {student.confidence && (
                            <span
                              className={`text-xs px-2 py-1 rounded-full ${getConfidenceColor(student.confidence)}`}
                            >
                              {student.confidence}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className='space-y-1 text-sm text-gray-600'>
                      <div className='flex justify-between'>
                        <span>Lớp:</span>
                        <span className='font-medium'>{student.class}</span>
                      </div>
                      {student.age && (
                        <div className='flex justify-between'>
                          <span>Tuổi:</span>
                          <span className='font-medium'>{student.age}</span>
                        </div>
                      )}
                      {student.gender && (
                        <div className='flex justify-between'>
                          <span>Giới tính:</span>
                          <span className='font-medium'>{student.gender}</span>
                        </div>
                      )}
                    </div>

                    {student.match_reason && (
                      <div className='mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700'>
                        <div className='flex items-start'>
                          <Eye className='w-3 h-3 mr-1 mt-0.5 flex-shrink-0' />
                          <span>{student.match_reason}</span>
                        </div>
                      </div>
                    )}

                    <div className='mt-3 text-xs text-gray-500'>
                      Đăng ký: {new Date(student.created_at).toLocaleDateString('vi-VN')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchResults.length === 0 && !isSearching && (activeTab === 'text' ? searchText : searchImage) && (
            <div className='mt-6 text-center py-8'>
              <AlertCircle className='w-12 h-12 text-gray-400 mx-auto mb-4' />
              <h3 className='text-lg font-medium text-gray-900 mb-2'>Không tìm thấy kết quả</h3>
              <p className='text-gray-600'>
                {activeTab === 'text'
                  ? 'Không tìm thấy học sinh nào phù hợp với từ khóa của bạn'
                  : 'Không tìm thấy học sinh nào có khuôn mặt tương tự'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default StudentSearchComponent
