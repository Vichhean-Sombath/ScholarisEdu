import { useAuth } from '../../context/AuthContext'

export default function StudentDashboard() {
  const { user, logout } = useAuth()

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="brand">
          <div className="brand-logo">S</div>
          <div className="brand-name">Scholaris Student</div>
        </div>
        <div className="user-info">
          <span>{user?.name} <span className="badge">{user?.role}</span></span>
          <button onClick={logout} className="btn btn-primary" style={{ width: 'auto' }}>Log out</button>
        </div>
      </header>

      <main className="dashboard-main">
        <h2>Student Dashboard</h2>
        <p>View your classes, assignments, and grades.</p>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>My Classes</h3>
            <p>See the courses you are enrolled in.</p>
          </div>
          <div className="dashboard-card">
            <h3>Assignments</h3>
            <p>View due work and submit your responses.</p>
          </div>
          <div className="dashboard-card">
            <h3>Grades</h3>
            <p>Check scores and feedback from your teachers.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
