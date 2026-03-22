const configBase = {
  baseURL:
    import.meta.env.VITE_PROCESS !== 'development'
      ? 'http://localhost:5000'
      : 'http://localhost:5000/'
}

export default configBase
