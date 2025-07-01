import { Outlet } from 'react-router-dom'
import Navbar from '../../components/Layout/Navbar'
import { Toaster } from 'sonner'
interface MainLayoutProps {
  children?: React.ReactNode
}
const MainLayout = ({ children }: MainLayoutProps) => {
  return (
    <div className='min-h-screen bg-gray-100'>
      <Navbar />
      <main>{children || <Outlet />}</main>
      <Toaster position='top-right' />
    </div>
  )
}

export default MainLayout
