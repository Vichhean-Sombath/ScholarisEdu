import api from './api'

function mapClass(item) {
  return {
    id: item.class_id,
    name: item.class_name,
    subject: item.Subject?.subject_name || '—',
    schedule: item.Schedule?.schedule || '—',
    students: item.students || 0,
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
