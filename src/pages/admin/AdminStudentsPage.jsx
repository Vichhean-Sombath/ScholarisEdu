import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { AlertIcon, EmptyIcon } from '../../components/Icons'
import { createUser, disableUser, enableUser, getStudents, updateStudent } from '../../services/userService'

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
  address: '',
  enrollmentDate: '',
}

function EmptyState({ message = 'No students found.' }) {
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
          <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
          <path d="M6 12v5c3 3 9 3 12 0v-5" />
        </svg>
      </div>
      <div className="stat-card__body">
        <div className="stat-value">{value}</div>
        <div className="stat-label">{label}</div>
      </div>
    </div>
  )
}

export default function AdminStudentsPage() {
  const { user: currentUser } = useAuth()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  useEffect(() => {
    loadStudents()
  }, [])

  const loadStudents = () => {
    setLoading(true)
    setError('')
    getStudents()
      .then((data) => setStudents(data))
      .catch(() => setError('Could not load students. Please make sure the server is running and try again.'))
      .finally(() => setLoading(false))
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setFormError('')
  }

  const openNew = () => {
    resetForm()
    setShowForm(true)
  }

  const openEdit = (student) => {
    setForm({
      username: student.username,
      email: student.email,
      password: '',
      firstName: student.firstName,
      lastName: student.lastName,
      status: student.status,
      gender: student.gender,
      dob: student.dob,
      contactNumber: student.contactNumber,
      address: student.address,
      enrollmentDate: student.enrollmentDate,
    })
    setEditingId(student.id)
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
    if (!editingId && !form.enrollmentDate) return 'Enrollment date is required'
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    const validationError = validate()
    if (validationError) {
      setFormError(validationError)
      return
    }

    setSaving(true)
    try {
      const payload = {
        username: form.username.trim(),
        email: form.email.trim(),
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        role: 'Student',
        status: form.status,
        gender: form.gender || undefined,
        dob: form.dob || undefined,
        contactNumber: form.contactNumber.trim(),
        address: form.address.trim(),
        enrollmentDate: form.enrollmentDate,
      }

      if (editingId) {
        const target = students.find((s) => s.id === editingId)
        const updated = await updateStudent({
          id: editingId,
          profileId: target?.profileId,
          ...payload,
          password: form.password || undefined,
        })
        setStudents((prev) => prev.map((s) => (s.id === editingId ? updated : s)))
      } else {
        const created = await createUser({ ...payload, password: form.password })
        setStudents((prev) => [...prev, created])
      }
      resetForm()
      setShowForm(false)
    } catch (err) {
      const backendErrors = err.response?.data?.errors
      const message =
        (Array.isArray(backendErrors) && backendErrors.join(', ')) ||
        err.response?.data?.message ||
        err.message ||
        'Failed to save student.'
      setFormError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleToggleStatus = async (student) => {
    setError('')
    if (String(student.id) === String(currentUser?.user_id)) {
      setError('You cannot change your own account status.')
      return
    }
    try {
      if (student.status === 'Active') {
        await disableUser(student.id)
      } else {
        await enableUser(student.id)
      }
      setStudents((prev) =>
        prev.map((s) => (s.id === student.id ? { ...s, status: s.status === 'Active' ? 'Inactive' : 'Active' } : s))
      )
    } catch (err) {
      setError(err.message || 'Failed to update student status.')
    }
  }

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch = `${s.firstName} ${s.lastName} ${s.username} ${s.email}`
        .toLowerCase()
        .includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'All' || s.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [students, search, statusFilter])

  const stats = useMemo(() => {
    const total = students.length
    const active = students.filter((s) => s.status === 'Active').length
    const inactive = students.filter((s) => s.status === 'Inactive').length
    return { total, active, inactive }
  }, [students])

  const displayName = (s) => {
    const name = [s.firstName, s.lastName].filter(Boolean).join(' ').trim()
    return name || s.username || 'Unknown'
  }

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <h3>Students</h3>
          <p className="meta">Manage student accounts and enrollment</p>
        </div>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => (showForm ? setShowForm(false) : openNew())}>
          {showForm ? 'Cancel' : 'New Student'}
        </button>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        <StatCard label="Total Students" value={stats.total} variant="primary" />
        <StatCard label="Active" value={stats.active} variant="success" />
        <StatCard label="Inactive" value={stats.inactive} variant="muted" />
      </div>

      {showForm && (
        <form className="panel-form" onSubmit={handleSubmit}>
          {formError && <p className="error-text">{formError}</p>}
          <h4 style={{ marginTop: 0, marginBottom: 16 }}>{editingId ? 'Edit Student' : 'New Student'}</h4>

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
              <label htmlFor="enrollmentDate">Enrollment date {editingId ? '' : '*'}</label>
              <input
                id="enrollmentDate"
                type="date"
                value={form.enrollmentDate}
                onChange={(e) => updateField('enrollmentDate', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="address">Address</label>
              <input id="address" value={form.address} onChange={(e) => updateField('address', e.target.value)} />
            </div>
          </div>

          <button className="btn btn-primary" style={{ width: 'auto' }} disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update Student' : 'Save Student'}
          </button>
        </form>
      )}

      <div className="panel" style={{ padding: 20 }}>
        <div className="section-header" style={{ marginBottom: 16 }}>
          <div className="form-group" style={{ marginBottom: 0, flex: 1, minWidth: 220, maxWidth: 360 }}>
            <input
              type="text"
              placeholder="Search by name, username, or email"
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

        {loading && <p className="status-text">Loading students...</p>}
        {error && <ErrorPanel message={error} onRetry={loadStudents} />}

        {!loading && !error && students.length === 0 && <EmptyState message="No students found. Add your first student above." />}

        {!loading && !error && filteredStudents.length === 0 && students.length > 0 && (
          <EmptyState message="No students match the current filters." />
        )}

        {!loading && !error && filteredStudents.length > 0 && (
          <div className="data-table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Email</th>
                  <th>Enrollment Date</th>
                  <th>Status</th>
                  <th style={{ width: 150 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr key={s.id}>
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
                          {displayName(s)
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{displayName(s)}</div>
                          <div className="meta">@{s.username}</div>
                        </div>
                      </div>
                    </td>
                    <td>{s.email}</td>
                    <td>{s.enrollmentDate || '—'}</td>
                    <td>
                      <span className={`pill ${s.status === 'Active' ? 'active' : 'draft'}`}>{s.status}</span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn btn-sm btn-secondary" onClick={() => openEdit(s)}>
                          Edit
                        </button>
                        <button
                          className={`btn btn-sm ${s.status === 'Active' ? 'btn-danger' : 'btn-primary'}`}
                          onClick={() => handleToggleStatus(s)}
                          disabled={String(s.id) === String(currentUser?.user_id)}
                        >
                          {s.status === 'Active' ? 'Disable' : 'Enable'}
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
