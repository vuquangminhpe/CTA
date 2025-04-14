import { io } from 'socket.io-client'

const socket = io('http://localhost:5000', {
  transports: ['websocket'],
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000
})

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error)
})

socket.on('disconnect', (reason) => {
  console.log('Socket disconnected:', reason)
})

socket.on('reconnect_attempt', (attemptNumber) => {
  console.log(`Socket reconnection attempt #${attemptNumber}`)
})

export default socket
