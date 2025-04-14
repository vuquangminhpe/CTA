import { Outlet } from 'react-router-dom'
import Navbar from '../../components/Layout/Navbar'
import { Toaster } from 'sonner'

const MainLayout = () => {
  return (
    <div className='min-h-screen bg-gray-100'>
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Toaster position='top-right' closeButton />
    </div>
  )
}

export default MainLayout
