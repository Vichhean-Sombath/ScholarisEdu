import api from './api'

function mapClass(item) {
  return {
    id: item.class_id,
    name: item.class_name,
    subject: item.Subject?.subject_name || '—',
    schedule: item.Schedule?.schedule || '—',
    students: item.ClassEnrollments?.length || 0,
  }
}

function mapAssessment(item) {
  return {
    id: item.assessment_id,
    classId: item.class_id,
    title: item.assessment_name,
    dueDate: item.assessment_date ? item.assessment_date.slice(0, 10) : '—',
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
    criteria_id: assignment.criteriaId || 1,
    class_id: assignment.classId,
    subject_id: assignment.subjectId || 1,
    assessment_name: assignment.title,
    max_score: assignment.maxScore || 100,
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
      const firstName = student.first_name || ''
      const lastName = student.last_name || ''
      const name = [firstName, lastName].filter(Boolean).join(' ').trim() || user.email || 'Unknown student'
      return {
        id: user.user_id || student.student_id || enrollment.student_id || enrollment.enrollment_id,
        name,
        email: user.email || '—',
        classId,
        className,
      }
    })
  })
}

export const getScores = async (assessmentId) => {
  const { data } = await api.get(`/score/data?assessment_id=${assessmentId}`)
  return (data.data || []).map((item) => ({
    id: item.score_id,
    assessmentId: item.assessment_id,
    studentId: item.user_id,
    score: item.score ?? '',
  }))
}

export const saveScore = async (score) => {
  const payload = {
    assessment_id: score.assessmentId,
    user_id: score.studentId,
    score: Number(score.score),
  }
  const endpoint = score.id ? `/score/update/${score.id}` : '/score/create'
  const { data } = await api.post(endpoint, payload)
  return {
    id: data.data?.score_id,
    assessmentId: payload.assessment_id,
    studentId: payload.user_id,
    score: payload.score,
  }
}
