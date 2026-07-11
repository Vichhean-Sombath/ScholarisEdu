import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getClasses, getAssignments } from '../../services/teacherService'

export default function TeacherHome() {
  const { user } = useAuth()
  const [classes, setClasses] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getClasses(), getAssignments()])
      .then(([classesData, assignmentsData]) => {
        setClasses(classesData)
        setAssignments(assignmentsData)
      })
      .finally(() => setLoading(false))
  }, [])

  const totalStudents = classes.reduce((sum, c) => sum + (c.students || 0), 0)
  const activeAssignments = assignments.filter((a) => a.status === 'Active').length
  const recentAssignments = assignments.slice(0, 4)

  return (
    <div className="page-section">
      <div className="page-header">
        <div>
          <h2>Teacher Dashboard</h2>
          <p className="subtitle">Overview of your teaching activity.</p>
        </div>
      </div>

      {loading ? (
        <p className="status-text">Loading dashboard...</p>
      ) : (
        <>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-value">{classes.length}</span>
              <span className="stat-label">Classes</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{totalStudents}</span>
              <span className="stat-label">Students</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{activeAssignments}</span>
              <span className="stat-label">Active Assignments</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{assignments.length}</span>
              <span className="stat-label">Total Assignments</span>
            </div>
          </div>

          <div className="dashboard-row">
            <div className="panel">
              <div className="panel-header">
                <h3>Quick Actions</h3>
              </div>
              <div className="quick-actions">
                <Link to="/teacher/classes" className="quick-action">
                  <span className="quick-action-title">View Classes</span>
                  <span className="quick-action-desc">Manage your classes and students.</span>
                </Link>
                <Link to="/teacher/assignments" className="quick-action">
                  <span className="quick-action-title">Create Assignment</span>
                  <span className="quick-action-desc">Add new work for your classes.</span>
                </Link>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <h3>Recent Assignments</h3>
                <Link to="/teacher/assignments" className="link-sm">View all</Link>
              </div>
              {recentAssignments.length === 0 ? (
                <p className="status-text">No assignments yet.</p>
              ) : (
                <ul className="recent-list">
                  {recentAssignments.map((a) => (
                    <li key={a.id} className="recent-item">
                      <div className="recent-main">
                        <span className="recent-title">{a.title}</span>
                        <span className="recent-meta">Due {a.dueDate}</span>
                      </div>
                      <span className={`pill ${a.status.toLowerCase()}`}>{a.status}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
