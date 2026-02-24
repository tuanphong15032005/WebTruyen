import axios from 'axios'

export const axiosClient = axios.create({
  baseURL: 'http://localhost:8081',
  headers: {
    'Content-Type': 'application/json',
  },
})

axiosClient.interceptors.request.use((config) => {
  try {
    let token = localStorage.getItem('accessToken')
    let tokenType = 'Bearer'

    const raw = localStorage.getItem('user')
    if (raw) {
      const user = JSON.parse(raw)
      token = token || user?.token || user?.accessToken
      tokenType = user?.tokenType || user?.type || tokenType

    }

    if (token) {
      config.headers = config.headers || {}
      config.headers.Authorization = `${tokenType} ${token}`
    }
  } catch {
    // ignore
  }

  return config
})

axiosClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status
    if (status === 401) {
      try {
        localStorage.removeItem('user')
      } catch {
        // ignore
      }
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  },
)
