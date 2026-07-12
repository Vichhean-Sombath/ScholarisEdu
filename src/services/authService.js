import api from './api'

const SESSION_KEY = 'scholaris_user'
const TOKEN_KEY = 'scholaris_token'
const MOCK_USERS_KEY = 'scholaris_mock_users'

function getMockUsers() {
  try {
    return JSON.parse(localStorage.getItem(MOCK_USERS_KEY)) || []
  } catch {
    return []
  }
}

function setMockUsers(users) {
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users))
}

function seedDemoTeacher() {
  const users = getMockUsers()
  if (!users.some((u) => u.email === 'teacher@school.edu')) {
    users.push({
      user_id: 'demo-teacher-1',
      username: 'mr_smith',
      email: 'teacher@school.edu',
      password: 'Teacher123!',
      role: 'Teacher',
      status: 'Active',
      first_name: 'John',
      last_name: 'Smith',
    })
    setMockUsers(users)
  }
}

seedDemoTeacher()

function createSession(user) {
  const sessionUser = {
    user_id: user.user_id,
    name: user.username,
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status,
  }
  const token = `mock-token-${Date.now()}`
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser))
  return { user: sessionUser, token }
}

export const loginUser = async (email, password) => {
  try {
    const { data } = await api.post('/user/login', { email, password })
    const sessionUser = {
      user_id: data.user.user_id,
      name: data.user.username,
      username: data.user.username,
      email: data.user.email,
      role: data.user.role,
      status: data.user.status,
      teacherId: data.user.teacher_id || null,
      studentId: data.user.student_id || null,
    }
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser))
    return { user: sessionUser }
  } catch (err) {
    if (!err.response) {
      const user = getMockUsers().find((u) => u.email === email && u.password === password)
      if (!user) throw new Error('Invalid email or password.')
      const session = createSession(user)
      return { user: session.user }
    }
    throw err
  }
}

export const registerUser = async (userData) => {
  try {
    const { data } = await api.post('/user/register', userData)
    const sessionUser = {
      user_id: data.user.user_id,
      name: data.user.username,
      username: data.user.username,
      email: data.user.email,
      role: data.user.role,
      status: data.user.status,
      teacherId: data.user.teacher_id || null,
      studentId: data.user.student_id || null,
    }
    localStorage.setItem(TOKEN_KEY, data.token)
    localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser))
    return { user: sessionUser }
  } catch (err) {
    if (!err.response) {
      const users = getMockUsers()
      if (users.some((u) => u.email === userData.email)) {
        throw new Error('An account with this email already exists.')
      }
      const newUser = {
        user_id: `mock-${Date.now()}`,
        username: userData.username,
        email: userData.email,
        password: userData.password,
        role: userData.role || 'Student',
        status: 'Active',
        first_name: userData.first_name,
        last_name: userData.last_name,
      }
      setMockUsers([...users, newUser])
      const session = createSession(newUser)
      return { user: session.user }
    }
    throw err
  }
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
