const configBase = {
  baseURL:
    import.meta.env.VITE_PROCESS !== 'development'
      ? 'https://thicuonlinne-production.up.railway.app/'
      : 'https://thicuonlinne-production.up.railway.app/'
}

export default configBase
