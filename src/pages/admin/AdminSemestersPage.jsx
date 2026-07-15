import { useEffect, useState } from 'react'
import { AlertIcon, EmptyIcon } from '../../components/Icons'
import {
  createSemester,
  deleteSemester,
  getAcademicYears,
  getSemesters,
  updateSemester,
} from '../../services/adminService'

const emptyForm = {
  academicYearId: '',
  semesterName: '',
  startDate: '',
  endDate: '',
}

function EmptyState({ message = 'No semesters found.' }) {
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

export default function AdminSemestersPage() {
  const [items, setItems] = useState([])
  const [academicYears, setAcademicYears] = useState([])
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
    Promise.all([getSemesters(), getAcademicYears()])
      .then(([semestersData, yearsData]) => {
        setItems(semestersData)
        setAcademicYears(yearsData)
      })
      .catch((err) => setError(err.message || 'Could not load semesters. Please make sure the server is running and try again.'))
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
      academicYearId: String(item.academicYearId),
      semesterName: item.semesterName,
      startDate: item.startDate,
      endDate: item.endDate,
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const validate = () => {
    if (!form.academicYearId) return 'Academic year is required.'
    if (!form.semesterName.trim()) return 'Semester name is required.'
    if (!form.startDate) return 'Start date is required.'
    if (!form.endDate) return 'End date is required.'
    if (new Date(form.startDate) >= new Date(form.endDate)) return 'Start date must be earlier than end date.'
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
        academicYearId: Number(form.academicYearId),
        semesterName: form.semesterName.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
      }

      if (editingId) {
        const updated = await updateSemester({ id: editingId, ...payload })
        setItems((prev) => prev.map((i) => (i.id === editingId ? updated : i)))
      } else {
        const created = await createSemester(payload)
        setItems((prev) => [...prev, created])
      }
      resetForm()
      setShowForm(false)
    } catch (err) {
      setFormError(err.message || 'Failed to save semester.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this semester?')) return
    setError('')
    try {
      await deleteSemester(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch (err) {
      setError(err.message || 'Failed to delete semester.')
    }
  }

  return (
    <div className="page-section">
      <div className="section-header">
        <h3>Semesters</h3>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => (showForm ? setShowForm(false) : openNew())}>
          {showForm ? 'Cancel' : 'New Semester'}
        </button>
      </div>

      {showForm && (
        <form className="panel-form" onSubmit={handleSubmit}>
          {formError && <p className="error-text">{formError}</p>}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="academicYearId">Academic year *</label>
              <select
                id="academicYearId"
                value={form.academicYearId}
                onChange={(e) => updateField('academicYearId', e.target.value)}
              >
                <option value="">Select an academic year</option>
                {academicYears.map((year) => (
                  <option key={year.id} value={year.id}>
                    {year.yearName}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="semesterName">Semester name *</label>
              <input
                id="semesterName"
                value={form.semesterName}
                onChange={(e) => updateField('semesterName', e.target.value)}
                placeholder="e.g. Fall"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="startDate">Start date *</label>
              <input id="startDate" type="date" value={form.startDate} onChange={(e) => updateField('startDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="endDate">End date *</label>
              <input id="endDate" type="date" value={form.endDate} onChange={(e) => updateField('endDate', e.target.value)} />
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: 'auto' }} disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update Semester' : 'Save Semester'}
          </button>
        </form>
      )}

      {error && <ErrorPanel message={error} onRetry={loadItems} />}
      {loading && <p className="status-text">Loading semesters...</p>}
      {!loading && !error && items.length === 0 && <EmptyState />}

      {!loading && !error && items.length > 0 && (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Semester name</th>
                <th>Academic year</th>
                <th>Start date</th>
                <th>End date</th>
                <th style={{ width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.semesterName}</td>
                  <td>{item.academicYearName}</td>
                  <td>{item.startDate}</td>
                  <td>{item.endDate}</td>
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
