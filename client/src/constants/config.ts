const configBase = {
  baseURL: import.meta.env.VITE_PROCESS !== 'development' ? 'http://localhost:5000' : 'http://139.59.250.30'
}

export default configBase
