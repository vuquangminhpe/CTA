/* eslint-disable @typescript-eslint/no-explicit-any */
import { useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute, TeacherRoute, StudentRoute, AdminRoute, GuestRoute } from './ProtectedRoute'
import { UserRole } from '../types/User.type'

// Pages
import Login from '../pages/Auth/Login'
import Register from '../pages/Auth/Register'
import TeacherDashboard from '../pages/Teacher/TeacherDashboard'
import StudentDashboard from '../pages/Student/StudentDashboard'
import ExamPage from '../pages/Student/ExamPage'
import NotFound from '../pages/NotFound'
import Unauthorized from '../pages/Unauthorized'
import { AuthContext, AuthProvider } from '../Contexts/auth.context'
import MainLayout from '../layouts/layouts/MainLayout'
import AdminDashboard from '../pages/Admin/AdminDashboard'

// Layouts

const AppRoutes = () => {
  const { role } = useContext(AuthContext)

  // Helper function to redirect to the appropriate dashboard based on role
  const redirectBasedOnRole = () => {
    switch (role) {
      case UserRole.Teacher as any:
        return <Navigate to='/teacher' />
      case UserRole.Student as any:
        return <Navigate to='/student' />
      case UserRole.Admin as any:
        return <Navigate to='/admin' />
      default:
        return <Navigate to='/login' />
    }
  }

  return (
    <Routes>
      {/* Index route - redirect based on role */}
      <Route path='/' element={redirectBasedOnRole()} />

      {/* Auth routes - accessible to guests */}
      <Route element={<GuestRoute />}>
        <Route path='/login' element={<Login />} />
        <Route path='/register' element={<Register />} />
      </Route>

      {/* Protected routes - requires authentication */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          {/* Teacher routes */}
          <Route element={<TeacherRoute />}>
            <Route path='/teacher' element={<TeacherDashboard />} />
          </Route>

          {/* Student routes */}
          <Route element={<StudentRoute />}>
            <Route path='/student' element={<StudentDashboard />} />
            <Route path='/exam/:examCode' element={<ExamPage />} />
          </Route>

          {/* Admin routes */}
          <Route element={<AdminRoute />}>
            <Route path='/admin' element={<AdminDashboard />} />
          </Route>
        </Route>
      </Route>

      {/* Error and utility routes */}
      <Route path='/unauthorized' element={<Unauthorized />} />
      <Route path='*' element={<NotFound />} />
    </Routes>
  )
}

const AppRouter = () => {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  )
}

export default AppRouter
