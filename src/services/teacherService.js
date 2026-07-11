import api from './api'

const CLASSES_KEY = 'scholaris_teacher_classes'
const ASSIGNMENTS_KEY = 'scholaris_teacher_assignments'

function seedData() {
  if (!localStorage.getItem(CLASSES_KEY)) {
    localStorage.setItem(CLASSES_KEY, JSON.stringify([
      { id: 1, name: 'Grade 10 Mathematics', subject: 'Mathematics', students: 28, schedule: 'Mon/Wed 9:00 AM' },
      { id: 2, name: 'Grade 11 Physics', subject: 'Physics', students: 24, schedule: 'Tue/Thu 11:00 AM' },
      { id: 3, name: 'Grade 9 Computer Science', subject: 'Computer Science', students: 32, schedule: 'Fri 1:00 PM' },
    ]))
  }

  if (!localStorage.getItem(ASSIGNMENTS_KEY)) {
    localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify([
      { id: 1, classId: 1, title: 'Algebra Quiz 1', dueDate: '2026-07-18', status: 'Active' },
      { id: 2, classId: 1, title: 'Linear Equations Worksheet', dueDate: '2026-07-22', status: 'Active' },
      { id: 3, classId: 2, title: 'Kinematics Lab Report', dueDate: '2026-07-25', status: 'Draft' },
    ]))
  }
}

seedData()

export const getClasses = async () => {
  // Replace with: return api.get('/teacher/classes')
  return JSON.parse(localStorage.getItem(CLASSES_KEY))
}

export const getClassById = async (id) => {
  const classes = await getClasses()
  return classes.find((c) => c.id === Number(id))
}

export const getAssignments = async () => {
  // Replace with: return api.get('/teacher/assignments')
  return JSON.parse(localStorage.getItem(ASSIGNMENTS_KEY))
}

export const createAssignment = async (assignment) => {
  const assignments = await getAssignments()
  const newAssignment = {
    id: assignments.length ? Math.max(...assignments.map((a) => a.id)) + 1 : 1,
    ...assignment,
    status: assignment.status || 'Active',
  }
  const updated = [...assignments, newAssignment]
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(updated))
  return newAssignment
}
