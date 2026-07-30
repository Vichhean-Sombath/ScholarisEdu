import { useEffect, useState } from 'react'
import { getClasses, getStudents } from '../../services/teacherService'

export default function StudentsPage() {
  const [classes, setClasses] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedClass, setSelectedClass] = useState('all')

  useEffect(() => {
    Promise.all([getClasses(), getStudents()])
      .then(([classesData, studentsData]) => {
        setClasses(classesData)
        setStudents(studentsData)
      })
      .catch(() => setError('Could not load students. Please make sure the server is running and try again.'))
      .finally(() => setLoading(false))
  }, [])

  const filteredStudents =
    selectedClass === 'all'
      ? students
      : students.filter((s) => s.classId === Number(selectedClass))

  const groupedByClass = filteredStudents.reduce((acc, student) => {
    const cls = classes.find((c) => c.id === student.classId)
    const name = cls?.name || student.className || 'Unassigned'
    if (!acc[name]) acc[name] = []
    acc[name].push(student)
    return acc
  }, {})

  return (
    <div className="page-section">
      <div className="section-header">
        <h3>Students</h3>
        <div className="form-group" style={{ marginBottom: 0, minWidth: 220 }}>
          <select
            id="classFilter"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="all">All classes</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading && <p className="status-text">Loading students...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && students.length === 0 && (
        <p className="status-text">No students are enrolled in your classes yet.</p>
      )}

      {!loading && !error && filteredStudents.length === 0 && students.length > 0 && (
        <p className="status-text">No students found for the selected class.</p>
      )}

      {!loading && !error && filteredStudents.length > 0 && (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Class</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedByClass).flatMap(([className, group]) =>
                group.map((student) => (
                  <tr key={`${student.id}-${student.classId}`}>
                    <td>{student.name}</td>
                    <td>{student.email}</td>
                    <td>{className}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
