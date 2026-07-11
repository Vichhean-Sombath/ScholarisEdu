import { useAuth } from '../../context/AuthContext'

export default function AdminDashboard() {
  const { user, logout } = useAuth()

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="brand">
          <div className="brand-logo">S</div>
          <div className="brand-name">Scholaris Admin</div>
        </div>
        <div className="user-info">
          <span>{user?.name} <span className="badge">{user?.role}</span></span>
          <button onClick={logout} className="btn btn-primary" style={{ width: 'auto' }}>Log out</button>
        </div>
      </header>

      <main className="dashboard-main">
        <h2>Admin Dashboard</h2>
        <p>Manage teachers, students, and system settings from here.</p>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <h3>Users</h3>
            <p>Create and manage teacher and student accounts.</p>
          </div>
          <div className="dashboard-card">
            <h3>Classes</h3>
            <p>Assign teachers and organize student rosters.</p>
          </div>
          <div className="dashboard-card">
            <h3>Settings</h3>
            <p>Configure terms, grading scales, and permissions.</p>
          </div>
        </div>
      </main>
    </div>
  )
}
