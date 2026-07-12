import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getClassById } from '../../services/teacherService'

export default function ClassDetailPage() {
  const { id } = useParams()
  const [cls, setCls] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getClassById(id)
      .then(setCls)
      .catch(() => setError('Could not load class details. Please make sure the server is running and try again.'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <p className="status-text">Loading class...</p>
  if (error) return <p className="error-text">{error}</p>
  if (!cls) return <p className="status-text">Class not found.</p>

  return (
    <div className="page-section">
      <Link to="/teacher/classes" className="back-link">← Back to classes</Link>
      <h3>{cls.name}</h3>
      <p className="meta">{cls.subject} • {cls.schedule} • {cls.students} students</p>

      <div className="dashboard-grid" style={{ marginTop: 24 }}>
        <div className="dashboard-card">
          <h4>Assignments</h4>
          <p>View and create work for this class.</p>
          <Link to="/teacher/assignments">Go to assignments →</Link>
        </div>
        <div className="dashboard-card">
          <h4>Gradebook</h4>
          <p>Enter scores and feedback.</p>
          <Link to="/teacher/gradebook">Open gradebook →</Link>
        </div>
      </div>
    </div>
  )
}
