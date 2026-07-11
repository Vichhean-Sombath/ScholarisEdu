import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProtectedRoute from '../components/ProtectedRoute'
import RoleRoute from '../components/RoleRoute'
import Login from '../pages/Login'
import Register from '../pages/Register'
import AdminDashboard from '../pages/admin/AdminDashboard'
import TeacherDashboard from '../pages/teacher/TeacherDashboard'
import StudentDashboard from '../pages/student/StudentDashboard'

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<GuestOnly />}>
        <Route index element={<Login />} />
      </Route>

      <Route path="/register" element={<GuestOnly />}>
        <Route index element={<Register />} />
      </Route>

      <Route path="/" element={<ProtectedRoute />}>
        <Route index element={<RoleRedirect />} />
      </Route>

      <Route path="/admin" element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={['Admin']} />}>
          <Route index element={<AdminDashboard />} />
        </Route>
      </Route>

      <Route path="/teacher" element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={['Teacher']} />}>
          <Route index element={<TeacherDashboard />} />
        </Route>
      </Route>

      <Route path="/student" element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={['Student']} />}>
          <Route index element={<StudentDashboard />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

function GuestOnly() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) return <Navigate to="/" replace />
  return <Outlet />
}

function RoleRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  const role = user?.role || 'Student'
  return <Navigate to={`/${role}`} replace />
}
