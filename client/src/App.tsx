import './App.css'
import { ToastContainer } from 'react-toastify'
import { useContext, useEffect } from 'react'
import { HelmetProvider } from 'react-helmet-async'
import { AppContext } from './Contexts/app.context'
import { getProfileFormLS, localStorageEventTarget } from './utils/auth'
import { Toaster } from 'sonner'
import socket from './utils/socket'
import AppRouter from './routes'

function App() {
  const { reset } = useContext(AppContext)

  useEffect(() => {
    localStorageEventTarget.addEventListener('clearLocalStorage', () => reset())

    return () => localStorageEventTarget.removeEventListener('clearLocalStorage', () => reset())
  }, [reset])
  useEffect(() => {
    if (getProfileFormLS()) {
      socket.connect()
      socket.auth = {
        Authorization: `Bearer ${localStorage.getItem('access_token')}`,
        _id: getProfileFormLS()._id
      }
    }
  }, [])

  return (
    <HelmetProvider>
      <AppRouter />
      <ToastContainer />
      <Toaster />
    </HelmetProvider>
  )
}

export default App
