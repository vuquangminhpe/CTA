import { useContext } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { UserRole } from '../types/User.type'
import { AuthContext } from '../Contexts/auth.context'

// Route that requires authentication
export const ProtectedRoute = () => {
  const { isAuthenticated } = useContext(AuthContext)
  return isAuthenticated ? <Outlet /> : <Navigate to='/login' />
}

// Route that requires teacher role
export const TeacherRoute = () => {
  const { isAuthenticated, role } = useContext(AuthContext)

  if (!isAuthenticated) {
    return <Navigate to='/login' />
  }

  if (role !== UserRole.Teacher && role !== UserRole.Admin) {
    return <Navigate to='/unauthorized' />
  }

  return <Outlet />
}

// Route that requires student role
export const StudentRoute = () => {
  const { isAuthenticated } = useContext(AuthContext)

  if (!isAuthenticated) {
    return <Navigate to='/login' />
  }

  // Students, teachers, and admins can access student routes
  return <Outlet />
}

// Route that requires admin role
export const AdminRoute = () => {
  const { isAuthenticated, role } = useContext(AuthContext)

  if (!isAuthenticated) {
    return <Navigate to='/login' />
  }

  if (role !== UserRole.Admin) {
    return <Navigate to='/unauthorized' />
  }

  return <Outlet />
}

// Route for guest users only (logged out)
export const GuestRoute = () => {
  const { isAuthenticated } = useContext(AuthContext)
  return !isAuthenticated ? <Outlet /> : <Navigate to='/' />
}
