import { useEffect, useState } from 'react'
import { changePassword, getStudentProfile } from '../../services/studentService'
import {
  PageHeader,
  DashboardSkeleton,
  ErrorPanel,
  TablePanel,
  DataTable,
  formatShortDate,
} from './studentUtils'

function InfoItem({ label, value }) {
  return (
    <div className="profile-info-item">
      <span className="profile-info-label">{label}</span>
      <span className="profile-info-value">{value || '—'}</span>
    </div>
  )
}

export default function StudentProfilePage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  const loadProfile = () => {
    setLoading(true)
    setError('')
    getStudentProfile()
      .then((data) => setProfile(data))
      .catch(() => setError('Could not load profile. Please make sure the server is running and try again.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadProfile()
  }, [])

  const handlePasswordChange = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (password.newPassword !== password.confirmPassword) {
      setError('New password and confirmation do not match.')
      return
    }

    const minLength = password.newPassword.length >= 8
    const hasUpper = /[A-Z]/.test(password.newPassword)
    const hasLower = /[a-z]/.test(password.newPassword)
    const hasDigit = /\d/.test(password.newPassword)
    const hasSpecial = /[!@#$%^&*(),.?\":{}|<>]/.test(password.newPassword)
    if (!minLength || !hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      setError('Password must be at least 8 characters with uppercase, lowercase, number, and special character.')
      return
    }

    setSaving(true)
    try {
      await changePassword({ currentPassword: password.currentPassword, newPassword: password.newPassword })
      setSuccess('Password changed successfully.')
      setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setShowPasswordForm(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-section">
      <PageHeader title="My Profile" subtitle="Your personal information and emergency contacts." />

      {success && !loading && <p className="success-text" style={{ marginBottom: 16 }}>{success}</p>}
      {error && !loading && <p className="error-text" style={{ marginBottom: 16 }}>{error}</p>}

      <div className="page-header" style={{ marginTop: 16 }}>
        <div />
        <button
          className="btn btn-secondary"
          style={{ width: 'auto' }}
          onClick={() => setShowPasswordForm((s) => !s)}
        >
          {showPasswordForm ? 'Cancel' : 'Change Password'}
        </button>
      </div>

      {showPasswordForm && (
        <form className="panel-form" onSubmit={handlePasswordChange}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                id="currentPassword"
                type="password"
                value={password.currentPassword}
                onChange={(e) => setPassword((p) => ({ ...p, currentPassword: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                id="newPassword"
                type="password"
                value={password.newPassword}
                onChange={(e) => setPassword((p) => ({ ...p, newPassword: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={password.confirmPassword}
                onChange={(e) => setPassword((p) => ({ ...p, confirmPassword: e.target.value }))}
                required
              />
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: 'auto' }} disabled={saving}>
            {saving ? 'Saving...' : 'Update Password'}
          </button>
        </form>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <ErrorPanel message={error} onRetry={loadProfile} />
      ) : (
        <>
          <div className="profile-card">
            <div className="profile-header">
              <div className="profile-avatar">{profile.fullName?.[0] || 'S'}</div>
              <div className="profile-intro">
                <h3>{profile.fullName}</h3>
                <p>{profile.user?.email}</p>
                <span className={`pill ${String(profile.status).toLowerCase() === 'active' ? 'paid' : ''}`}>{profile.status}</span>
              </div>
            </div>

            <div className="profile-section">
              <h4>Personal Information</h4>
              <div className="profile-info-grid">
                <InfoItem label="Student ID" value={profile.studentId} />
                <InfoItem label="Username" value={profile.user?.username} />
                <InfoItem label="Date of Birth" value={formatShortDate(profile.dob)} />
                <InfoItem label="Gender" value={profile.gender} />
                <InfoItem label="Contact Number" value={profile.contactNumber} />
                <InfoItem label="Enrollment Date" value={formatShortDate(profile.enrollmentDate)} />
                <InfoItem label="Last Login" value={formatShortDate(profile.user?.lastLoginAt)} />
              </div>
            </div>

            <div className="profile-section">
              <h4>Address</h4>
              <p className="profile-address">{profile.address || '—'}</p>
            </div>
          </div>

          <div className="dashboard-row" style={{ flexDirection: 'column' }}>
            <TablePanel title="Emergency Contacts">
              <DataTable
                headers={['Name', 'Relationship', 'Phone', 'Email']}
                rows={profile.emergencyContacts || []}
                emptyMessage="No emergency contacts on file."
                renderRow={(row) => (
                  <tr key={row.contactId}>
                    <td>{row.contactName}</td>
                    <td>{row.relationship || '—'}</td>
                    <td>{row.phoneNumber}</td>
                    <td>{row.email || '—'}</td>
                  </tr>
                )}
              />
            </TablePanel>
          </div>
        </>
      )}
    </div>
  )
}
