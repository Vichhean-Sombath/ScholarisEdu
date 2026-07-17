import { useEffect, useState } from 'react'
import { AlertIcon, EmptyIcon } from '../../components/Icons'
import {
  createClassEnrollment,
  deleteClassEnrollment,
  getClassEnrollments,
  getClassesAdmin,
  updateClassEnrollment,
} from '../../services/adminService'
import { getStudents } from '../../services/userService'

const STATUSES = ['Active', 'Transferred', 'Withdrawn']

const emptyForm = {
  studentId: '',
  classId: '',
  enrollmentDate: '',
  status: 'Active',
}

function EmptyState({ message = 'No class enrollments found.' }) {
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

function displayName(firstName, lastName) {
  return [firstName, lastName].filter(Boolean).join(' ').trim() || '—'
}

export default function AdminClassEnrollmentsPage() {
  const [items, setItems] = useState([])
  const [students, setStudents] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = () => {
    setLoading(true)
    setError('')
    Promise.all([getClassEnrollments(), getStudents(), getClassesAdmin()])
      .then(([enrollmentsData, studentsData, classesData]) => {
        setItems(enrollmentsData)
        setStudents(studentsData)
        setClasses(classesData)
      })
      .catch((err) => setError(err.message || 'Could not load class enrollments. Please make sure the server is running and try again.'))
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

  const openEdit = (item) => {
    setForm({
      studentId: String(item.studentId),
      classId: String(item.classId),
      enrollmentDate: item.enrollmentDate,
      status: item.status,
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const validate = () => {
    if (!form.studentId) return 'Student is required.'
    if (!form.classId) return 'Class is required.'
    if (!form.enrollmentDate) return 'Enrollment date is required.'
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
        studentId: Number(form.studentId),
        classId: Number(form.classId),
        enrollmentDate: form.enrollmentDate,
        status: form.status,
      }

      if (editingId) {
        const updated = await updateClassEnrollment({ id: editingId, ...payload })
        setItems((prev) => prev.map((i) => (i.id === editingId ? updated : i)))
      } else {
        const created = await createClassEnrollment(payload)
        setItems((prev) => [...prev, created])
      }
      resetForm()
      setShowForm(false)
    } catch (err) {
      setFormError(err.message || 'Failed to save class enrollment.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this class enrollment?')) return
    setError('')
    try {
      await deleteClassEnrollment(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch (err) {
      setError(err.message || 'Failed to delete class enrollment.')
    }
  }

  return (
    <div className="page-section">
      <div className="section-header">
        <h3>Class Enrollments</h3>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => (showForm ? setShowForm(false) : openNew())}>
          {showForm ? 'Cancel' : 'New Enrollment'}
        </button>
      </div>

      {showForm && (
        <form className="panel-form" onSubmit={handleSubmit}>
          {formError && <p className="error-text">{formError}</p>}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="studentId">Student *</label>
              <select
                id="studentId"
                value={form.studentId}
                onChange={(e) => updateField('studentId', e.target.value)}
              >
                <option value="">Select a student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {displayName(student.firstName, student.lastName)} ({student.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="classId">Class *</label>
              <select
                id="classId"
                value={form.classId}
                onChange={(e) => updateField('classId', e.target.value)}
              >
                <option value="">Select a class</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.className}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="enrollmentDate">Enrollment date *</label>
              <input
                id="enrollmentDate"
                type="date"
                value={form.enrollmentDate}
                onChange={(e) => updateField('enrollmentDate', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select id="status" value={form.status} onChange={(e) => updateField('status', e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: 'auto' }} disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update Enrollment' : 'Save Enrollment'}
          </button>
        </form>
      )}

      {error && <ErrorPanel message={error} onRetry={loadItems} />}
      {loading && <p className="status-text">Loading class enrollments...</p>}
      {!loading && !error && items.length === 0 && <EmptyState />}

      {!loading && !error && items.length > 0 && (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Class</th>
                <th>Enrollment date</th>
                <th>Status</th>
                <th style={{ width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.studentName}</td>
                  <td>{item.className}</td>
                  <td>{item.enrollmentDate}</td>
                  <td>
                    <span className={`pill ${item.status === 'Active' ? 'active' : 'draft'}`}>{item.status}</span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-sm btn-secondary" onClick={() => openEdit(item)}>
                        Edit
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.id)}>
                        Delete
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
  )
}
