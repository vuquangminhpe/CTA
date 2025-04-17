const configBase = {
  baseURL:
    import.meta.env.VITE_PROCESS !== 'development' ? 'http://localhost:5000' : 'https://server-aql1.onrender.com/'
}

export default configBase
