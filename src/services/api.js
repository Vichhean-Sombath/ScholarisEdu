import axios from 'axios'

const API_URL = import.meta.env.API_URL || 'http://localhost:3000'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('scholaris_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthPage = window.location.pathname.startsWith('/login') || window.location.pathname.startsWith('/register')
    if (error.response?.status === 401 && !isAuthPage) {
      localStorage.removeItem('scholaris_token')
      localStorage.removeItem('scholaris_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
