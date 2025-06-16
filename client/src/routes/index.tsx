/* eslint-disable @typescript-eslint/no-explicit-any */
import { useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute, TeacherRoute, StudentRoute, AdminRoute, GuestRoute } from './ProtectedRoute'
import { UserRole } from '../types/User.type'

// Pages
import Home from '../pages/Home/Home'
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
import ExamResultsPage from '../pages/Teacher/ExamResultsPage'
import ExamManagement from '../pages/Teacher/ExamManagement'
import ExamMonitor from '../pages/Teacher/ExamMonitor'
import MonitoringDashboard from '../pages/Teacher/MonitoringDashboard'
import ClassExamResults from '../pages/Teacher/ClassExamResults'
import MasterExamView from '../pages/Teacher/MasterExamView'
import MasterExamsList from '../pages/Teacher/MasterExamsList'
import ClassResultsList from '../components/Teacher/ClassResultsList'
import MasterExamMonitor from '../components/Teacher/MasterExamMonitor'
import MasterExamResults from '../components/Teacher/MasterExamResults'
import UserManagement from '@/pages/Admin/UserManagement'
import MasterExamManagement from '@/components/Admin/MasterExamManagement'
import ExamStatistics from '@/pages/Admin/ExamStatistics'
import TeacherManagement from '@/components/Admin/TeacherManagement'
import FeedbackPage from '../pages/Teacher/FeedbackPage'
import AdminFeedbackManagement from '../pages/Admin/AdminFeedbackManagement'

const AppRoutes = () => {
  const { role } = useContext(AuthContext)  // Helper function to redirect to the appropriate dashboard based on role
  const redirectBasedOnRole = () => {
    switch (role) {
      case UserRole.Teacher as any:
        return <Navigate to='/teacher' replace />
      case UserRole.Student as any:
        return <Navigate to='/student' replace />
      case UserRole.Admin as any:
        return <Navigate to='/admin' replace />
      default:
        return <Navigate to='/' replace />
    }
  }
  return (
    <Routes>
      {/* Home route - accessible to all */}
      <Route path='/' element={<Home />} />

      {/* Dashboard route - redirect based on role */}
      <Route path='/dashboard' element={redirectBasedOnRole()} />

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

            {/* Master exam routes */}
            <Route path='/teacher/master-exams' element={<MasterExamsList />} />
            <Route path='/teacher/master-exams/:masterExamId' element={<MasterExamView />} />

            <Route path='/teacher/master-exams/:masterExamId/monitor' element={<MasterExamMonitor />} />
            <Route path='/teacher/master-exams/:masterExamId/results' element={<MasterExamResults />} />

            <Route path='/teacher/master-exams/:masterExamId/classes/:className' element={<ClassResultsList />} />

            {/* Individual exam routes */}
            <Route path='/teacher/exams/:examId' element={<ExamManagement />} />
            <Route path='/teacher/exams/:examId/results' element={<ExamResultsPage />} />            
            <Route path='/teacher/exams/:examId/class-results' element={<ClassExamResults />} />
            <Route path='/teacher/exams/:examId/monitor' element={<ExamMonitor />} />
            <Route path='/teacher/monitoring' element={<MonitoringDashboard />} />
            <Route path='/teacher/feedback' element={<FeedbackPage />} />
          </Route>

          {/* Student routes */}
          <Route element={<StudentRoute />}>
            <Route path='/student' element={<StudentDashboard />} />
            <Route path='/exam/:examCode' element={<ExamPage />} />
          </Route>          {/* Admin routes */}
          <Route element={<AdminRoute />}>
            <Route path='/admin' element={<AdminDashboard />} />
            <Route path='/admin/teacher-management' element={<TeacherManagement />} />
            <Route path='/admin/admin-master-exams/:masterExamId' element={<MasterExamView />} />
            <Route path='/admin/master-exams-management' element={<MasterExamManagement />} />
            <Route path='/admin/statistics' element={<ExamStatistics />} />
            <Route path='/admin/student-management' element={<UserManagement />} />
            <Route path='/admin/feedback-management' element={<AdminFeedbackManagement />} />
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
