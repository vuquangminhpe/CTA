const configBase = {
  baseURL: import.meta.env.VITE_PROCESS !== 'development' ? 'http://localhost:5000' : 'https://cta-iota.vercel.app'
}

export default configBase
