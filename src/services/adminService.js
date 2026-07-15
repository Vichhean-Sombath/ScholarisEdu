import api from './api'

function formatDate(date) {
  if (!date) return ''
  return date.slice(0, 10)
}

function formatName(firstName, lastName) {
  const name = [firstName, lastName].filter(Boolean).join(' ').trim()
  return name || '—'
}

function mapAcademicYear(item) {
  return {
    id: item.academic_year_id,
    yearName: item.year_name,
    startDate: formatDate(item.start_date),
    endDate: formatDate(item.end_date),
    status: item.status || 'Active',
    semesters: item.Semesters || [],
  }
}

function mapSemester(item) {
  return {
    id: item.semester_id,
    academicYearId: item.academic_year_id,
    academicYearName: item.AcademicYear?.year_name || '—',
    semesterName: item.semester_name,
    startDate: formatDate(item.start_date),
    endDate: formatDate(item.end_date),
  }
}

function mapClass(item) {
  const teacher = item.HomeroomTeacher || {}
  return {
    id: item.class_id,
    className: item.class_name,
    academicYearId: item.academic_year_id,
    academicYearName: item.AcademicYear?.year_name || '—',
    semesterId: item.semester_id,
    semesterName: item.Semester?.semester_name || '—',
    roomNumber: item.room_number || '—',
    maxCapacity: item.max_capacity || '',
    homeroomTeacherId: item.homeroom_teacher_id || '',
    homeroomTeacherName: formatName(teacher.first_name, teacher.last_name),
  }
}

export const getAcademicYears = async () => {
  const { data } = await api.get('/academic-year/data')
  return (data.data || []).map(mapAcademicYear)
}

export const createAcademicYear = async (year) => {
  const { data } = await api.post('/academic-year/create', {
    year_name: year.yearName,
    start_date: year.startDate,
    end_date: year.endDate,
    status: year.status,
  })
  return mapAcademicYear(data.data)
}

export const updateAcademicYear = async (year) => {
  const { data } = await api.put(`/academic-year/update/${year.id}`, {
    year_name: year.yearName,
    start_date: year.startDate,
    end_date: year.endDate,
    status: year.status,
  })
  return mapAcademicYear(data.data)
}

export const deleteAcademicYear = async (id) => {
  await api.delete(`/academic-year/delete/${id}`)
}

export const getSemesters = async () => {
  const { data } = await api.get('/semester/data')
  return (data.data || []).map(mapSemester)
}

export const createSemester = async (semester) => {
  const { data } = await api.post('/semester/create', {
    academic_year_id: semester.academicYearId,
    semester_name: semester.semesterName,
    start_date: semester.startDate,
    end_date: semester.endDate,
  })
  return mapSemester(data.data)
}

export const updateSemester = async (semester) => {
  const { data } = await api.put(`/semester/update/${semester.id}`, {
    academic_year_id: semester.academicYearId,
    semester_name: semester.semesterName,
    start_date: semester.startDate,
    end_date: semester.endDate,
  })
  return mapSemester(data.data)
}

export const deleteSemester = async (id) => {
  await api.delete(`/semester/delete/${id}`)
}

export const getClassesAdmin = async () => {
  const { data } = await api.get('/class/data')
  return (data.data || []).map(mapClass)
}

export const createClass = async (cls) => {
  const { data } = await api.post('/class/create', {
    class_name: cls.className,
    academic_year_id: cls.academicYearId,
    semester_id: cls.semesterId,
    room_number: cls.roomNumber || undefined,
    max_capacity: cls.maxCapacity ? Number(cls.maxCapacity) : undefined,
    homeroom_teacher_id: cls.homeroomTeacherId || undefined,
  })
  return mapClass(data.data)
}

export const updateClass = async (cls) => {
  const payload = {
    class_name: cls.className,
    academic_year_id: cls.academicYearId,
    semester_id: cls.semesterId,
  }
  if (cls.roomNumber !== undefined) payload.room_number = cls.roomNumber || undefined
  if (cls.maxCapacity !== undefined) payload.max_capacity = cls.maxCapacity ? Number(cls.maxCapacity) : undefined
  if (cls.homeroomTeacherId !== undefined) payload.homeroom_teacher_id = cls.homeroomTeacherId || undefined

  const { data } = await api.put(`/class/update/${cls.id}`, payload)
  return mapClass(data.data)
}

export const deleteClass = async (id) => {
  await api.delete(`/class/delete/${id}`)
}
