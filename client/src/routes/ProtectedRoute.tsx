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
    return <Navigate to='/' />
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
  const { isAuthenticated, role } = useContext(AuthContext)

  if (!isAuthenticated) {
    return <Outlet />
  }

  // If authenticated, redirect to appropriate dashboard
  if (role === UserRole.Teacher) {
    return <Navigate to='/teacher' replace />
  } else if (role === UserRole.Student) {
    return <Navigate to='/student' replace />
  } else if (role === UserRole.Admin) {
    return <Navigate to='/admin' replace />
  } else {
    return <Navigate to='/' replace />
  }
}
