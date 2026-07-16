import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { AcademicYearIcon, ClassIcon, DashboardIcon, FeeIcon, InvoiceIcon, PaymentIcon, SemesterIcon, StudentIcon, TeacherIcon } from '../../components/Icons'

const navItems = [
  { to: '/admin', end: true, label: 'Dashboard', icon: DashboardIcon },
  { to: '/admin/academic-years', label: 'Academic Years', icon: AcademicYearIcon },
  { to: '/admin/semesters', label: 'Semesters', icon: SemesterIcon },
  { to: '/admin/classes', label: 'Classes', icon: ClassIcon },
  { to: '/admin/fee-structures', label: 'Fee Structures', icon: FeeIcon },
  { to: '/admin/invoices', label: 'Invoices', icon: InvoiceIcon },
  { to: '/admin/payments', label: 'Payments', icon: PaymentIcon },
  { to: '/admin/teachers', label: 'Teachers', icon: TeacherIcon },
  { to: '/admin/students', label: 'Students', icon: StudentIcon },
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
          <div className="brand-logo">S</div>
          <div className="brand-name">
            Scholaris<span>Admin Portal</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => (isActive ? 'active nav-link' : 'nav-link')}
                title={item.label}
                onClick={closeMobileSidebar}
              >
                <Icon size={18} />
                <span className="nav-full">{item.label}</span>
                <span className="nav-short">{item.label[0]}</span>
              </NavLink>
            )
          })}
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
