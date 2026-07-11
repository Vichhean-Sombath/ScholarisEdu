import api from './api'

const SESSION_KEY = 'scholaris_user'
const TOKEN_KEY = 'scholaris_token'

export const loginUser = async (email, password) => {
  const { data } = await api.post('/user/login', { email, password })
  const sessionUser = {
    user_id: data.user.user_id,
    name: data.user.username,
    username: data.user.username,
    email: data.user.email,
    role: data.user.role,
    status: data.user.status,
  }
  localStorage.setItem(TOKEN_KEY, data.token)
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser))
  return { user: sessionUser }
}

export const registerUser = async (userData) => {
  const { data } = await api.post('/user/register', userData)
  const sessionUser = {
    user_id: data.user.user_id,
    name: data.user.username,
    username: data.user.username,
    email: data.user.email,
    role: data.user.role,
    status: data.user.status,
  }
  localStorage.setItem(TOKEN_KEY, data.token)
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser))
  return { user: sessionUser }
}

export const logoutUser = async () => {
  try {
    await api.post('/user/logout')
  } catch {
    // ignore network errors on logout
  } finally {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(SESSION_KEY)
  }
}

export const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY))
  } catch {
    return null
  }
}

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY)
}
