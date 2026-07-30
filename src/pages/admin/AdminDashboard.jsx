import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/admin', end: true, label: 'Dashboard' },
  { to: '/admin/teachers', label: 'Teachers' },
  { to: '/admin/students', label: 'Students' },
  { to: '/admin/academic-years', label: 'Academic Years' },
  { to: '/admin/semesters', label: 'Semesters' },
  { to: '/admin/subjects', label: 'Subjects' },
  { to: '/admin/classes', label: 'Classes' },
  { to: '/admin/time-slots', label: 'Time Slots' },
  { to: '/admin/schedules', label: 'Schedules' },
  { to: '/admin/class-enrollments', label: 'Class Enrollments' },
  { to: '/admin/lesson-resources', label: 'Lesson Resources' },
  { to: '/admin/grading-criteria', label: 'Grading Criteria' },
  { to: '/admin/fee-structures', label: 'Fee Structures' },
  { to: '/admin/invoices', label: 'Invoices' },
  { to: '/admin/payments', label: 'Payments' },
  { to: '/admin/certificates', label: 'Certificates' },
  { to: '/admin/reports', label: 'Reports' },
]

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleSidebar = () => {
    if (window.innerWidth <= 640) {
      setMobileOpen((s) => !s)
    } else {
      setOpen((s) => !s)
    }
  }

  const closeMobileSidebar = () => setMobileOpen(false)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 640) {
        setMobileOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className={`dashboard dashboard-with-sidebar ${open ? 'sidebar-open' : 'sidebar-closed'} ${mobileOpen ? 'sidebar-mobile-open' : ''}`}>
      <button
        type="button"
        className="sidebar-toggle"
        onClick={toggleSidebar}
        aria-label={open || mobileOpen ? 'Close sidebar' : 'Open sidebar'}
        aria-expanded={open || mobileOpen}
      >
        <span className="burger-line"></span>
        <span className="burger-line"></span>
        <span className="burger-line"></span>
      </button>

      {mobileOpen && <div className="sidebar-backdrop" onClick={closeMobileSidebar} aria-hidden="true" />}

      <aside className="sidebar">
        <div className="sidebar-brand">
          <img className="brand-logo" src="/logo.webp" alt="Scholaris" />
          <div className="brand-name">
            Scholaris<span>Admin Portal</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'active nav-link' : 'nav-link')}
              title={item.label}
              onClick={closeMobileSidebar}
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
