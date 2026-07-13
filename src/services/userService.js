import api from './api'
import { getMockUsers, setMockUsers } from './authService'

function mapUser(item) {
  return {
    id: item.user_id,
    username: item.username,
    email: item.email,
    role: item.role,
    status: item.status || 'Active',
    firstName: item.first_name || '',
    lastName: item.last_name || '',
    gender: item.gender || '',
    dob: item.dob || '',
    contactNumber: item.contact_number || '',
    address: item.address || '',
    enrollmentDate: item.enrollment_date || '',
  }
}

function mapTeacher(item) {
  const user = item.User || {}
  return {
    id: user.user_id || item.user_id,
    username: user.username || '',
    email: user.email || '',
    role: user.role || 'Teacher',
    status: user.status || 'Active',
    firstName: item.first_name || '',
    lastName: item.last_name || '',
    gender: item.gender || '',
    dob: item.dob || '',
    contactNumber: item.contact_number || '',
    profileId: item.teacher_id,
    specialization: item.specialization || '',
    bio: item.bio || '',
    hireDate: item.hire_date || '',
  }
}

function mapStudent(item) {
  const user = item.User || {}
  return {
    id: user.user_id || item.user_id,
    username: user.username || '',
    email: user.email || '',
    role: user.role || 'Student',
    status: user.status || 'Active',
    firstName: item.first_name || '',
    lastName: item.last_name || '',
    gender: item.gender || '',
    dob: item.dob || '',
    contactNumber: item.contact_number || '',
    profileId: item.student_id,
    address: item.address || '',
    enrollmentDate: item.enrollment_date || '',
  }
}

export const getTeachers = async () => {
  try {
    const { data } = await api.get('/teacher/data')
    return (data.data || []).map(mapTeacher)
  } catch (err) {
    if (!err.response) {
      return getMockUsers()
        .filter((u) => u.role === 'Teacher')
        .map(mapUser)
    }
    throw err
  }
}

export const getStudents = async () => {
  try {
    const { data } = await api.get('/student/data')
    return (data.data || []).map(mapStudent)
  } catch (err) {
    if (!err.response) {
      return getMockUsers()
        .filter((u) => u.role === 'Student')
        .map(mapUser)
    }
    throw err
  }
}

export const createUser = async (user) => {
  try {
    const payload = {
      username: user.username,
      email: user.email,
      password: user.password,
      role: user.role,
      first_name: user.firstName,
      last_name: user.lastName,
      gender: user.gender || undefined,
      dob: user.dob || undefined,
      contact_number: user.contactNumber || undefined,
      specialization: user.specialization || undefined,
      bio: user.bio || undefined,
      hire_date: user.hireDate || undefined,
      address: user.address || undefined,
      enrollment_date: user.enrollmentDate || undefined,
    }
    const { data } = await api.post('/user/create', payload)
    const result = data.data
    return {
      id: result.user_id,
      username: result.username,
      email: result.email,
      role: result.role,
      status: result.status || 'Active',
      firstName: user.firstName,
      lastName: user.lastName,
      gender: user.gender,
      dob: user.dob,
      contactNumber: user.contactNumber,
      specialization: user.specialization,
      bio: user.bio,
      hireDate: user.hireDate,
      address: user.address,
      enrollmentDate: user.enrollmentDate,
    }
  } catch (err) {
    if (!err.response) {
      const users = getMockUsers()
      if (users.some((u) => u.email === user.email)) {
        throw new Error('An account with this email already exists.')
      }
      if (users.some((u) => u.username === user.username)) {
        throw new Error('An account with this username already exists.')
      }
      const newUser = {
        user_id: `mock-${Date.now()}`,
        username: user.username,
        email: user.email,
        password: user.password,
        role: user.role,
        status: 'Active',
        first_name: user.firstName,
        last_name: user.lastName,
        gender: user.gender,
        dob: user.dob,
        contact_number: user.contactNumber,
        address: user.address,
        enrollment_date: user.enrollmentDate,
      }
      setMockUsers([...users, newUser])
      return mapUser(newUser)
    }
    throw err
  }
}

async function updateCoreUser(user, id) {
  const payload = {
    username: user.username,
    email: user.email,
    status: user.status,
    gender: user.gender || undefined,
    dob: user.dob || undefined,
  }
  if (user.password) {
    payload.password = user.password
  }
  const { data } = await api.put(`/user/update/${id}`, payload)
  return data.data
}

export const updateTeacher = async (user) => {
  try {
    await updateCoreUser(user, user.id)
    if (user.profileId) {
      await api.put(`/teacher/update/${user.profileId}`, {
        first_name: user.firstName,
        last_name: user.lastName,
        gender: user.gender || undefined,
        dob: user.dob || undefined,
        contact_number: user.contactNumber || undefined,
        specialization: user.specialization || undefined,
        bio: user.bio || undefined,
        hire_date: user.hireDate || undefined,
        status: user.status,
      })
    }
    return { ...user }
  } catch (err) {
    if (!err.response) {
      return updateMockUser(user)
    }
    throw err
  }
}

export const updateStudent = async (user) => {
  try {
    await updateCoreUser(user, user.id)
    if (user.profileId) {
      await api.put(`/student/update/${user.profileId}`, {
        first_name: user.firstName,
        last_name: user.lastName,
        dob: user.dob || undefined,
        gender: user.gender || undefined,
        enrollment_date: user.enrollmentDate || undefined,
        status: user.status,
      })
    }
    return { ...user }
  } catch (err) {
    if (!err.response) {
      return updateMockUser(user)
    }
    throw err
  }
}

function updateMockUser(user) {
  const users = getMockUsers()
  const id = typeof user.id === 'string' ? user.id : String(user.id)
  const index = users.findIndex((u) => String(u.user_id) === id)
  if (index === -1) {
    throw new Error('User not found.')
  }
  const updated = {
    ...users[index],
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status,
    first_name: user.firstName,
    last_name: user.lastName,
    gender: user.gender || users[index].gender,
    dob: user.dob || users[index].dob,
    contact_number: user.contactNumber || users[index].contact_number,
    address: user.address || users[index].address,
    enrollment_date: user.enrollmentDate || users[index].enrollment_date,
  }
  if (user.password) {
    updated.password = user.password
  }
  const next = [...users]
  next[index] = updated
  setMockUsers(next)
  return mapUser(updated)
}

export const disableUser = async (id) => {
  try {
    await api.delete(`/user/disable/${id}`)
  } catch (err) {
    if (!err.response) {
      const users = getMockUsers()
      const target = users.find((u) => String(u.user_id) === String(id))
      if (!target) throw new Error('User not found.')
      if (target.role === 'Admin') throw new Error('Cannot disable admin account.')
      target.status = 'Inactive'
      setMockUsers([...users])
      return
    }
    throw err
  }
}

export const enableUser = async (id) => {
  try {
    await api.post(`/user/enable/${id}`)
  } catch (err) {
    if (!err.response) {
      const users = getMockUsers()
      const target = users.find((u) => String(u.user_id) === String(id))
      if (!target) throw new Error('User not found.')
      target.status = 'Active'
      setMockUsers([...users])
      return
    }
    throw err
  }
}
