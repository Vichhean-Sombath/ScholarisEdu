import { useEffect, useState } from 'react'
import { getStudentProfile } from '../../services/studentService'
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

  return (
    <div className="page-section">
      <PageHeader title="My Profile" subtitle="Your personal information and emergency contacts." />

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
