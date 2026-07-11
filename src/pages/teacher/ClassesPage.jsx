import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getClasses } from '../../services/teacherService'

export default function ClassesPage() {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    getClasses()
      .then(setClasses)
      .catch(() => setError('Failed to load classes. Please try again.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="page-section">
      <div className="section-header">
        <h3>My Classes</h3>
      </div>

      {loading && <p className="status-text">Loading classes...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && classes.length === 0 && (
        <p className="status-text">You are not assigned to any classes yet.</p>
      )}

      <div className="classes-grid">
        {classes.map((cls) => (
          <Link to={`/teacher/classes/${cls.id}`} key={cls.id} className="class-card">
            <div className="class-card-main">
              <h4>{cls.name}</h4>
              <span className="meta">{cls.subject} • {cls.schedule}</span>
            </div>
            <div className="class-card-stat">
              <span>{cls.students}</span>
              <small>students</small>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
