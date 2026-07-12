import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import ProtectedRoute from '../components/ProtectedRoute'
import RoleRoute from '../components/RoleRoute'
import Login from '../pages/Login'
import Register from '../pages/Register'
import AdminDashboard from '../pages/admin/AdminDashboard'
import TeacherDashboard from '../pages/teacher/TeacherDashboard'
import TeacherHome from '../pages/teacher/TeacherHome'
import ClassesPage from '../pages/teacher/ClassesPage'
import ClassDetailPage from '../pages/teacher/ClassDetailPage'
import AssignmentsPage from '../pages/teacher/AssignmentsPage'
import StudentsPage from '../pages/teacher/StudentsPage'
import GradebookPage from '../pages/teacher/GradebookPage'
import AttendancePage from '../pages/teacher/AttendancePage'
import AdminGradingCriteriaPage from '../pages/admin/AdminGradingCriteriaPage'
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
          <Route path="grading-criteria" element={<AdminGradingCriteriaPage />} />
        </Route>
      </Route>

      <Route path="/teacher" element={<ProtectedRoute />}>
        <Route element={<RoleRoute allowedRoles={['Teacher']} />}>
          <Route element={<TeacherDashboard />}>
            <Route index element={<TeacherHome />} />
            <Route path="classes" element={<ClassesPage />} />
            <Route path="classes/:id" element={<ClassDetailPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="assignments" element={<AssignmentsPage />} />
            <Route path="gradebook" element={<GradebookPage />} />
            <Route path="attendance" element={<AttendancePage />} />
          </Route>
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
  return <Navigate to={`/${role.toLowerCase()}`} replace />
}
