import api from './api'

function formatName(firstName, lastName, fallback) {
  const name = [firstName, lastName].filter(Boolean).join(' ').trim()
  return name || fallback || 'Unknown student'
}

function formatTimeSlot(slot) {
  if (!slot) return ''
  const start = slot.start_time ? slot.start_time.slice(0, 5) : ''
  const end = slot.end_time ? slot.end_time.slice(0, 5) : ''
  return `${slot.day_of_week} ${start}-${end}`
}

function mapClass(item) {
  const schedule = item.Schedules?.[0]
  const subject = schedule?.Subject
  const timeSlot = schedule?.TimeSlot
  return {
    id: item.class_id,
    name: item.class_name,
    subject: subject?.subject_name || '—',
    subjectId: subject?.subject_id,
    schedule: formatTimeSlot(timeSlot),
    room: schedule?.room_number || item.room_number || '—',
    students: item.ClassEnrollments?.length || 0,
    academicYear: item.AcademicYear?.year_name || '—',
    semester: item.Semester?.semester_name || '—',
    enrollments: item.ClassEnrollments || [],
  }
}

function mapAssessment(item) {
  const schedule = item.Schedule
  return {
    id: item.assessment_id,
    scheduleId: item.schedule_id,
    classId: schedule?.class_id,
    className: schedule?.Class?.class_name || '—',
    subjectId: schedule?.subject_id,
    subjectName: schedule?.Subject?.subject_name || '—',
    criteriaId: item.criteria_id,
    title: item.assessment_name,
    dueDate: item.assessment_date ? item.assessment_date.slice(0, 10) : '—',
    maxScore: Number(item.max_score) || 100,
    status: 'Active',
  }
}

export const getClasses = async () => {
  const { data } = await api.get('/class/data')
  return data.data.map(mapClass)
}

export const getClassById = async (id) => {
  const { data } = await api.get(`/class/data/${id}`)
  return mapClass(data.data)
}

export const getAssignments = async () => {
  const { data } = await api.get('/assessment/data')
  return data.data.map(mapAssessment)
}

export const createAssignment = async (assignment) => {
  const { data } = await api.post('/assessment/create', {
    schedule_id: assignment.scheduleId,
    criteria_id: assignment.criteriaId,
    assessment_name: assignment.title,
    max_score: Number(assignment.maxScore),
    assessment_date: assignment.dueDate,
  })
  return mapAssessment(data.data)
}

export const getStudents = async () => {
  const { data } = await api.get('/class/data')
  return data.data.flatMap((item) => {
    const classId = item.class_id
    const className = item.class_name
    return (item.ClassEnrollments || []).map((enrollment) => {
      const student = enrollment.Student || {}
      const user = student.User || {}
      return {
        id: student.student_id,
        userId: user.user_id,
        name: formatName(student.first_name, student.last_name, user.email),
        email: user.email || '—',
        classId,
        className,
      }
    })
  })
}

export const getScores = async (assessmentId) => {
  const { data } = await api.get(`/grade/data?assessment_id=${assessmentId}`)
  return (data.data || []).map((item) => ({
    id: item.grade_id,
    assessmentId: item.assessment_id,
    studentId: item.student_id,
    score: item.score ?? '',
  }))
}

export const saveScore = async (score) => {
  const payload = {
    assessment_id: score.assessmentId,
    student_id: score.studentId,
    score: Number(score.score),
  }

  if (score.id) {
    const { data } = await api.put(`/grade/update/${score.id}`, payload)
    return {
      id: data.data?.grade_id,
      assessmentId: payload.assessment_id,
      studentId: payload.student_id,
      score: payload.score,
    }
  }

  const { data } = await api.post('/grade/create', payload)
  return {
    id: data.data?.grade_id,
    assessmentId: payload.assessment_id,
    studentId: payload.student_id,
    score: payload.score,
  }
}

export const getSubjects = async () => {
  const { data } = await api.get('/subject/data')
  return (data.data || []).map((item) => ({
    id: item.subject_id,
    code: item.subject_code,
    name: item.subject_name,
  }))
}

export const getGradingCriteria = async () => {
  const { data } = await api.get('/grading-criteria/data')
  return (data.data || []).map((item) => ({
    id: item.criteria_id,
    subjectId: item.subject_id,
    classId: item.class_id,
    name: item.component_name,
    weight: item.weight_percentage,
    attemptCount: item.attempt_count,
    subjectName: item.Subject?.subject_name || 'All subjects',
    className: item.Class?.class_name || 'All classes',
  }))
}

export const createGradingCriteria = async (criteria) => {
  const { data } = await api.post('/grading-criteria/create', {
    subject_id: criteria.subjectId,
    class_id: criteria.classId || null,
    component_name: criteria.name,
    weight_percentage: Number(criteria.weight),
    attempt_count: Number(criteria.attemptCount),
  })
  return {
    id: data.data?.criteria_id,
    subjectId: data.data?.subject_id,
    classId: data.data?.class_id,
    name: data.data?.component_name,
    weight: data.data?.weight_percentage,
    attemptCount: data.data?.attempt_count,
  }
}

export const updateGradingCriteria = async (criteria) => {
  const { data } = await api.put(`/grading-criteria/update/${criteria.id}`, {
    subject_id: criteria.subjectId,
    class_id: criteria.classId || null,
    component_name: criteria.name,
    weight_percentage: Number(criteria.weight),
    attempt_count: Number(criteria.attemptCount),
  })
  return {
    id: data.data?.criteria_id,
    subjectId: data.data?.subject_id,
    classId: data.data?.class_id,
    name: data.data?.component_name,
    weight: data.data?.weight_percentage,
    attemptCount: data.data?.attempt_count,
  }
}

export const deleteGradingCriteria = async (id) => {
  await api.delete(`/grading-criteria/delete/${id}`)
}

export const getSchedules = async () => {
  const { data } = await api.get('/schedule/data')
  return (data.data || []).map((item) => ({
    id: item.schedule_id,
    classId: item.class_id,
    className: item.Class?.class_name || '—',
    subjectId: item.subject_id,
    subjectName: item.Subject?.subject_name || '—',
    teacherId: item.teacher_id,
    timeSlotId: item.time_slot_id,
    schedule: formatTimeSlot(item.TimeSlot),
    room: item.room_number || '—',
  }))
}

export const getAttendance = async (scheduleId, date) => {
  const { data } = await api.get('/attendance-record/data')
  const records = data.data || []
  return records
    .filter((item) => item.schedule_id === Number(scheduleId) && item.attendance_date?.slice(0, 10) === date)
    .map((item) => ({
      id: item.attendance_id,
      scheduleId: item.schedule_id,
      studentId: item.student_id,
      date: item.attendance_date?.slice(0, 10),
      status: item.status,
    }))
}

export const saveAttendance = async (record) => {
  const payload = {
    schedule_id: record.scheduleId,
    student_id: record.studentId,
    attendance_date: record.date,
    status: record.status,
  }

  if (record.id) {
    const { data } = await api.put(`/attendance-record/update/${record.id}`, payload)
    return {
      id: data.data?.attendance_id,
      scheduleId: payload.schedule_id,
      studentId: payload.student_id,
      date: payload.attendance_date,
      status: payload.status,
    }
  }

  const { data } = await api.post('/attendance-record/create', payload)
  return {
    id: data.data?.attendance_id,
    scheduleId: payload.schedule_id,
    studentId: payload.student_id,
    date: payload.attendance_date,
    status: payload.status,
  }
}

export const getTeacherById = async (id) => {
  const { data } = await api.get(`/teacher/data/${id}`)
  const user = data.data.User || {}
  return {
    id: data.data.teacher_id,
    userId: user.user_id,
    username: user.username,
    email: user.email,
    role: user.role,
    status: user.status,
    firstName: data.data.first_name,
    lastName: data.data.last_name,
    fullName: `${data.data.first_name || ''} ${data.data.last_name || ''}`.trim(),
    gender: data.data.gender,
    dob: data.data.dob,
    contactNumber: data.data.contact_number,
    specialization: data.data.specialization,
    bio: data.data.bio,
    hireDate: data.data.hire_date,
    photoUrl: data.data.photo_url,
  }
}

export const updateTeacherProfile = async (id, profile) => {
  const { data } = await api.put(`/teacher/update/${id}`, {
    first_name: profile.firstName,
    last_name: profile.lastName,
    gender: profile.gender,
    dob: profile.dob,
    contact_number: profile.contactNumber,
    specialization: profile.specialization,
    bio: profile.bio,
    hire_date: profile.hireDate,
  })
  return data.data
}

export const changePassword = async ({ currentPassword, newPassword }) => {
  const { data } = await api.put('/user/change-password', {
    currentPassword,
    newPassword,
  })
  return data.data
}

export const getTeacherResources = async () => {
  const { data } = await api.get('/lesson_resource/data')
  return (data.data || []).map((item) => ({
    id: item.resource_id,
    scheduleId: item.schedule_id,
    title: item.title,
    description: item.description,
    resourceType: item.resource_type,
    fileUrl: item.file_url,
    uploadDate: item.upload_date?.slice(0, 10),
    schedule: item.Schedule ? formatTimeSlot(item.Schedule.TimeSlot) : '—',
    teacherName: `${item.Teacher?.first_name || ''} ${item.Teacher?.last_name || ''}`.trim(),
  }))
}

export const createTeacherResource = async (resource) => {
  const { data } = await api.post('/lesson_resource/create', {
    schedule_id: resource.scheduleId || null,
    title: resource.title,
    description: resource.description,
    resource_type: resource.resourceType,
    file_url: resource.fileUrl,
    upload_date: resource.uploadDate || new Date().toISOString().slice(0, 10),
  })
  const item = data.data
  return {
    id: item.resource_id,
    scheduleId: item.schedule_id,
    title: item.title,
    description: item.description,
    resourceType: item.resource_type,
    fileUrl: item.file_url,
    uploadDate: item.upload_date?.slice(0, 10),
    schedule: item.Schedule ? formatTimeSlot(item.Schedule.TimeSlot) : '—',
    teacherName: `${item.Teacher?.first_name || ''} ${item.Teacher?.last_name || ''}`.trim(),
  }
}

export const updateTeacherResource = async (id, resource) => {
  const { data } = await api.put(`/lesson_resource/update/${id}`, {
    schedule_id: resource.scheduleId || null,
    title: resource.title,
    description: resource.description,
    resource_type: resource.resourceType,
    file_url: resource.fileUrl,
    upload_date: resource.uploadDate,
  })
  const item = data.data
  return {
    id: item.resource_id,
    scheduleId: item.schedule_id,
    title: item.title,
    description: item.description,
    resourceType: item.resource_type,
    fileUrl: item.file_url,
    uploadDate: item.upload_date?.slice(0, 10),
    schedule: item.Schedule ? formatTimeSlot(item.Schedule.TimeSlot) : '—',
    teacherName: `${item.Teacher?.first_name || ''} ${item.Teacher?.last_name || ''}`.trim(),
  }
}

export const deleteTeacherResource = async (id) => {
  await api.delete(`/lesson_resource/delete/${id}`)
}
