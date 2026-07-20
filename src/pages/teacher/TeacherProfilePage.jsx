import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { changePassword, getTeacherById, updateTeacherProfile } from '../../services/teacherService'

function InfoItem({ label, value }) {
  return (
    <div className="profile-info-item">
      <span className="profile-info-label">{label}</span>
      <span className="profile-info-value">{value || '—'}</span>
    </div>
  )
}

export default function TeacherProfilePage() {
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [password, setPassword] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })

  const teacherId = user?.teacherId || user?.profileId

  const loadProfile = () => {
    setLoading(true)
    setError('')
    if (!teacherId) {
      setError('Teacher ID not found.')
      setLoading(false)
      return
    }
    getTeacherById(teacherId)
      .then((data) => setProfile(data))
      .catch(() => setError('Could not load profile. Please make sure the server is running and try again.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadProfile()
  }, [teacherId])

  const handleChange = (field, value) => {
    setProfile((p) => ({ ...p, [field]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await updateTeacherProfile(teacherId, profile)
      setSuccess('Profile updated successfully.')
      setIsEditing(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

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

  if (loading) return <div className="page-section"><p className="status-text">Loading profile...</p></div>
  if (error) return <div className="page-section"><p className="error-text">{error}</p></div>
  if (!profile) return null

  return (
    <div className="page-section">
      <div className="page-header">
        <div>
          <h2>My Profile</h2>
          <p className="subtitle">Your personal and professional information.</p>
        </div>
        <button
          className="btn btn-primary"
          style={{ width: 'auto' }}
          onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
          disabled={saving}
        >
          {saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Edit Profile'}
        </button>
      </div>

      {success && <p className="success-text" style={{ marginBottom: 16 }}>{success}</p>}
      {isEditing && error && <p className="error-text" style={{ marginBottom: 16 }}>{error}</p>}

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

      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">{profile.fullName?.[0] || 'T'}</div>
          <div className="profile-intro">
            <h3>{profile.fullName}</h3>
            <p>{profile.email}</p>
            <span className="pill active">{profile.role}</span>
          </div>
        </div>

        <div className="profile-section">
          <h4>Personal Information</h4>
          <div className="profile-info-grid">
            {isEditing ? (
              <>
                <div className="form-group">
                  <label>First Name</label>
                  <input value={profile.firstName || ''} onChange={(e) => handleChange('firstName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input value={profile.lastName || ''} onChange={(e) => handleChange('lastName', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select value={profile.gender || ''} onChange={(e) => handleChange('gender', e.target.value)}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input type="date" value={profile.dob ? profile.dob.slice(0, 10) : ''} onChange={(e) => handleChange('dob', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Contact Number</label>
                  <input value={profile.contactNumber || ''} onChange={(e) => handleChange('contactNumber', e.target.value)} />
                </div>
              </>
            ) : (
              <>
                <InfoItem label="Teacher ID" value={profile.id} />
                <InfoItem label="Username" value={profile.username} />
                <InfoItem label="First Name" value={profile.firstName} />
                <InfoItem label="Last Name" value={profile.lastName} />
                <InfoItem label="Gender" value={profile.gender} />
                <InfoItem label="Date of Birth" value={profile.dob ? profile.dob.slice(0, 10) : null} />
                <InfoItem label="Contact Number" value={profile.contactNumber} />
              </>
            )}
          </div>
        </div>

        <div className="profile-section">
          <h4>Professional Information</h4>
          <div className="profile-info-grid">
            {isEditing ? (
              <>
                <div className="form-group">
                  <label>Specialization</label>
                  <input value={profile.specialization || ''} onChange={(e) => handleChange('specialization', e.target.value)} />
                </div>
                <div className="form-group">
                  <label>Hire Date</label>
                  <input type="date" value={profile.hireDate ? profile.hireDate.slice(0, 10) : ''} onChange={(e) => handleChange('hireDate', e.target.value)} />
                </div>
              </>
            ) : (
              <>
                <InfoItem label="Specialization" value={profile.specialization} />
                <InfoItem label="Hire Date" value={profile.hireDate ? profile.hireDate.slice(0, 10) : null} />
                <InfoItem label="Status" value={profile.status} />
              </>
            )}
          </div>
        </div>

        <div className="profile-section">
          <h4>Bio</h4>
          {isEditing ? (
            <textarea
              rows="4"
              value={profile.bio || ''}
              onChange={(e) => handleChange('bio', e.target.value)}
              style={{ width: '100%', padding: 10, borderRadius: 8, border: '1px solid #cbd5e1' }}
            />
          ) : (
            <p className="profile-address">{profile.bio || '—'}</p>
          )}
        </div>
      </div>
    </div>
  )
}
