import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/teacher', end: true, label: 'Dashboard' },
  { to: '/teacher/classes', label: 'My Classes' },
  { to: '/teacher/students', label: 'Students' },
  { to: '/teacher/assignments', label: 'Assignments' },
  { to: '/teacher/gradebook', label: 'Gradebook' },
  { to: '/teacher/attendance', label: 'Attendance' },
  { to: '/teacher/resources', label: 'Resources' },
  { to: '/teacher/profile', label: 'Profile' },
]

export default function TeacherDashboard() {
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
          <div className="brand-logo">S</div>
          <div className="brand-name">Scholaris<span>Teacher Portal</span></div>
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
