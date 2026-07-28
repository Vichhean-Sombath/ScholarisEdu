import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { AlertIcon, EmptyIcon } from '../../components/Icons'
import { createUser, disableUser, enableUser, getTeachers, updateTeacher } from '../../services/userService'
import { toastSuccess, toastError } from '../../utils/sweetAlert'

const STATUSES = ['Active', 'Inactive']

const emptyForm = {
  username: '',
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  status: 'Active',
  gender: '',
  dob: '',
  contactNumber: '',
  specialization: '',
  bio: '',
  hireDate: '',
}

function EmptyState({ message = 'No teachers found.' }) {
  return (
    <div className="empty-state">
      <EmptyIcon />
      <p>{message}</p>
    </div>
  )
}

function ErrorPanel({ message, onRetry }) {
  return (
    <div className="error-panel" style={{ marginBottom: 24 }}>
      <AlertIcon size={24} />
      <div className="error-panel__body">
        <p>{message}</p>
      </div>
      <button className="btn btn-primary" style={{ width: 'auto' }} onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}

function StatCard({ label, value, variant = 'primary' }) {
  const iconColors = {
    primary: '#4a90d9',
    success: '#16a34a',
    muted: '#64748b',
  }
  return (
    <div className="stat-card">
      <div className="stat-card__icon" style={{ background: `${iconColors[variant]}15`, color: iconColors[variant] }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
      <div className="stat-card__body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  )
}

export default function AdminTeachersPage() {
  const { user: currentUser } = useAuth()
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    loadTeachers()
  }, [])

  const loadTeachers = () => {
    setLoading(true)
    setError('')
    getTeachers()
      .then((data) => setTeachers(data))
      .catch(() => setError('Could not load teachers. Please make sure the server is running and try again.'))
      .finally(() => setLoading(false))
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const openNew = () => {
    resetForm()
    setShowForm(true)
  }

  const openEdit = (teacher) => {
    setForm({
      username: teacher.username,
      email: teacher.email,
      password: '',
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      status: teacher.status,
      gender: teacher.gender,
      dob: teacher.dob,
      contactNumber: teacher.contactNumber,
      specialization: teacher.specialization,
      bio: teacher.bio,
      hireDate: teacher.hireDate,
    })
    setEditingId(teacher.id)
    setShowForm(true)
  }

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const validate = () => {
    if (!form.username.trim()) return 'Username is required'
    if (!form.email.trim()) return 'Email is required'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return 'Enter a valid email'
    if (!form.firstName.trim()) return 'First name is required'
    if (!form.lastName.trim()) return 'Last name is required'
    if (!editingId && !form.password) return 'Password is required'
    if (form.password) {
      if (form.password.length < 8) return 'Password must be at least 8 characters'
      if (!/[A-Z]/.test(form.password)) return 'Password must contain at least one uppercase letter'
      if (!/[!@#$%^&*(),.?":{}|<>]/.test(form.password)) return 'Password must contain at least one special character'
    }
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validationError = validate()
    if (validationError) {
      toastError(validationError)
      return
    }

    setSaving(true)
    try {
      const payload = {
        username: form.username.trim(),
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        role: 'Teacher',
        status: form.status,
        gender: form.gender || undefined,
        dob: form.dob || undefined,
        contactNumber: form.contactNumber.trim(),
        specialization: form.specialization.trim(),
        bio: form.bio.trim(),
        hireDate: form.hireDate,
      }

      if (editingId) {
        const target = teachers.find((t) => t.id === editingId)
        await updateTeacher({
          id: editingId,
          profileId: target?.profileId,
          ...payload,
          password: form.password || undefined,
        })
        toastSuccess('Teacher updated successfully.')
      } else {
        await createUser({ ...payload, password: form.password })
        toastSuccess('Teacher created successfully.')
      }
      await loadTeachers()
      resetForm()
      setShowForm(false)
    } catch (err) {
      const backendErrors = err.response?.data?.errors
      const message =
        (Array.isArray(backendErrors) && backendErrors.join(', ')) ||
        err.response?.data?.message ||
        err.message ||
        'Failed to save teacher.'
      toastError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (teacher) => {
    if (String(teacher.id) === String(currentUser?.user_id)) {
      toastError('You cannot change your own account status.')
      return
    }
    try {
      const wasActive = teacher.status === 'Active'
      if (wasActive) {
        await disableUser(teacher.id)
      } else {
        await enableUser(teacher.id)
      }
      setTeachers((prev) =>
        prev.map((t) => (t.id === teacher.id ? { ...t, status: t.status === 'Active' ? 'Inactive' : 'Active' } : t))
      )
      toastSuccess(`Teacher ${wasActive ? 'disabled' : 'enabled'} successfully.`)
    } catch (err) {
      toastError(err.message || 'Failed to update teacher status.')
    }
  }

  const filteredTeachers = useMemo(() => {
    return teachers.filter((t) => {
      const matchesSearch = `${t.firstName} ${t.lastName} ${t.username} ${t.email} ${t.specialization}`
        .toLowerCase()
        .includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'All' || t.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [teachers, search, statusFilter])

  const stats = useMemo(() => {
    const total = teachers.length
    const active = teachers.filter((t) => t.status === 'Active').length
    const inactive = teachers.filter((t) => t.status === 'Inactive').length
    return { total, active, inactive }
  }, [teachers])

  const displayName = (t) => {
    const name = [t.firstName, t.lastName].filter(Boolean).join(' ').trim()
    return name || t.username || 'Unknown'
  }

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h3>Teachers</h3>
          <p className="meta">Manage teacher accounts and profiles</p>
        </div>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => (showForm ? setShowForm(false) : openNew())}>
          {showForm ? 'Cancel' : 'New Teacher'}
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <StatCard label="Total Teachers" value={stats.total} variant="primary" />
        <StatCard label="Active" value={stats.active} variant="success" />
        <StatCard label="Inactive" value={stats.inactive} variant="muted" />
      </div>

      {showForm && (
        <form className="panel-form" onSubmit={handleSubmit}>
          <h4 style={{ marginTop: 0, marginBottom: 16 }}>{editingId ? 'Edit Teacher' : 'New Teacher'}</h4>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First name *</label>
              <input id="firstName" value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last name *</label>
              <input id="lastName" value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input id="email" type="email" value={form.email} onChange={(e) => updateField('email', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="username">Username *</label>
              <input id="username" value={form.username} onChange={(e) => updateField('username', e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password {editingId ? '(leave blank to keep)' : '*'}</label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder={editingId ? 'Unchanged' : 'At least 8 characters'}
              />
            </div>
            <div className="form-group">
              <label htmlFor="status">Status *</label>
              <select id="status" value={form.status} onChange={(e) => updateField('status', e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select id="gender" value={form.gender} onChange={(e) => updateField('gender', e.target.value)}>
                <option value="">Select…</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="dob">Date of birth</label>
              <input id="dob" type="date" value={form.dob} onChange={(e) => updateField('dob', e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="contactNumber">Contact number</label>
              <input id="contactNumber" value={form.contactNumber} onChange={(e) => updateField('contactNumber', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="specialization">Specialization</label>
              <input id="specialization" value={form.specialization} onChange={(e) => updateField('specialization', e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="hireDate">Hire date</label>
              <input id="hireDate" type="date" value={form.hireDate} onChange={(e) => updateField('hireDate', e.target.value)} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="bio">Bio</label>
              <input id="bio" value={form.bio} onChange={(e) => updateField('bio', e.target.value)} />
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: 'auto' }} disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update Teacher' : 'Save Teacher'}
          </button>
        </form>
      )}

      <div className="panel" style={{ padding: 20 }}>
        <div className="section-header" style={{ marginBottom: 16 }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 220, maxWidth: 360 }}>
            <input
              type="text"
              placeholder="Search by name, username, email, or specialization"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-tabs">
            {['All', ...STATUSES].map((s) => (
              <button key={s} className={`filter-tab ${statusFilter === s ? 'active' : ''}`} onClick={() => setStatusFilter(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>

        {loading && <p className="status-text">Loading teachers...</p>}
        {error && <ErrorPanel message={error} onRetry={loadTeachers} />}

        {!loading && !error && teachers.length === 0 && <EmptyState message="No teachers found. Add your first teacher above." />}

        {!loading && !error && filteredTeachers.length === 0 && teachers.length > 0 && (
          <EmptyState message="No teachers match the current filters." />
        )}

        {!loading && !error && filteredTeachers.length > 0 && (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Teacher</th>
                  <th>Email</th>
                  <th>Specialization</th>
                  <th>Status</th>
                  <th style={{ width: 150 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTeachers.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: '50%',
                            background: '#e2e8f0',
                            color: '#1e3a5f',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: '0.85rem',
                            flexShrink: 0,
                          }}
                        >
                          {displayName(t)
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{displayName(t)}</div>
                          <div className="meta">@{t.username}</div>
                        </div>
                      </div>
                    </td>
                    <td>{t.email}</td>
                    <td>{t.specialization || '—'}</td>
                    <td>
                      <span className={`pill ${t.status === 'Active' ? 'active' : 'draft'}`}>{t.status}</span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn btn-sm btn-secondary" onClick={() => openEdit(t)}>
                          Edit
                        </button>
                        <button
                          className={`btn btn-sm ${t.status === 'Active' ? 'btn-danger' : 'btn-primary'}`}
                          onClick={() => handleToggleStatus(t)}
                          disabled={String(t.id) === String(currentUser?.user_id)}
                        >
                          {t.status === 'Active' ? 'Disable' : 'Enable'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
