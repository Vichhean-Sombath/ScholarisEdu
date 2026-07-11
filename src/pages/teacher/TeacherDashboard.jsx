import { useAuth } from '../../context/AuthContext'

export default function TeacherDashboard() {
  const { user, logout } = useAuth()

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="brand">
          <div className="brand-logo">S</div>
          <div className="brand-name">Scholaris Teacher</div>
        </div>
        <div className="user-info">
          <span>{user?.name} <span className="badge">{user?.role}</span></span>
          <button onClick={logout} className="btn btn-primary" style={{ width: 'auto' }}>Log out</button>
        </div>
      </header>

      <main className="dashboard-main">
        <h2>Teacher Dashboard</h2>
        <p>Manage your classes, assignments, and student progress.</p>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>My Classes</h3>
            <p>View and manage the classes you teach.</p>
          </div>
          <div className="dashboard-card">
            <h3>Assignments</h3>
            <p>Create, grade, and return student work.</p>
          </div>
          <div className="dashboard-card">
            <h3>Gradebook</h3>
            <p>Track scores and feedback for each student.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
