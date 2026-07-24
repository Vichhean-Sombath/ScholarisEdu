import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/student', end: true, label: 'Dashboard' },
  { to: '/student/classes', label: 'My Classes' },
  { to: '/student/schedule', label: 'Schedule' },
  { to: '/student/grades', label: 'Grades' },
  { to: '/student/attendance', label: 'Attendance' },
  { to: '/student/invoices', label: 'Invoices' },
  { to: '/student/certificates', label: 'Certificates' },
  { to: '/student/resources', label: 'Resources' },
  { to: '/student/profile', label: 'Profile' },
]

export default function StudentDashboard() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(true)

  return (
    <div className={`dashboard dashboard-with-sidebar ${open ? 'sidebar-open' : 'sidebar-closed'}`}>
      <button
        type="button"
        className="sidebar-toggle"
        onClick={() => setOpen((s) => !s)}
        aria-label={open ? 'Close sidebar' : 'Open sidebar'}
        aria-expanded={open}
      >
        <span className="burger-line"></span>
        <span className="burger-line"></span>
        <span className="burger-line"></span>
      </button>

      <aside className="sidebar">
        <div className="sidebar-brand">
          <img className="brand-logo" src="/logo.webp" alt="Scholaris" />
          <div className="brand-name">Scholaris<span>Student Portal</span></div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'active' : '')}
              title={item.label}
            >
              <span className="nav-full">{item.label}</span>
              <span className="nav-short">{item.label[0]}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <span className="user-name">{user?.name}</span>
            <span className="badge">{user?.role}</span>
          </div>
          <button onClick={logout} className="btn btn-primary">Log out</button>
        </div>
      </aside>

      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  )
}
