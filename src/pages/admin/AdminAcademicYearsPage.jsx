import { useEffect, useState } from 'react'
import { AlertIcon, EmptyIcon } from '../../components/Icons'
import {
  createAcademicYear,
  deleteAcademicYear,
  getAcademicYears,
  updateAcademicYear,
} from '../../services/adminService'

const emptyForm = {
  yearName: '',
  startDate: '',
  endDate: '',
  status: 'Active',
}

function EmptyState({ message = 'No academic years found.' }) {
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

export default function AdminAcademicYearsPage() {
  const [items, setItems] = useState([])
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
    getAcademicYears()
      .then((data) => setItems(data))
      .catch((err) => setError(err.message || 'Could not load academic years. Please make sure the server is running and try again.'))
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
      yearName: item.yearName,
      startDate: item.startDate,
      endDate: item.endDate,
      status: item.status,
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const validate = () => {
    if (!form.yearName.trim()) return 'Year name is required.'
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
        yearName: form.yearName.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        status: form.status,
      }

      if (editingId) {
        const updated = await updateAcademicYear({ id: editingId, ...payload })
        setItems((prev) => prev.map((i) => (i.id === editingId ? updated : i)))
      } else {
        const created = await createAcademicYear(payload)
        setItems((prev) => [...prev, created])
      }
      resetForm()
      setShowForm(false)
    } catch (err) {
      setFormError(err.message || 'Failed to save academic year.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this academic year?')) return
    setError('')
    try {
      await deleteAcademicYear(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch (err) {
      setError(err.message || 'Failed to delete academic year.')
    }
  }

  return (
    <div className="page-section">
      <div className="section-header">
        <h3>Academic Years</h3>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => (showForm ? setShowForm(false) : openNew())}>
          {showForm ? 'Cancel' : 'New Academic Year'}
        </button>
      </div>

      {showForm && (
        <form className="panel-form" onSubmit={handleSubmit}>
          {formError && <p className="error-text">{formError}</p>}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="yearName">Year name *</label>
              <input
                id="yearName"
                value={form.yearName}
                onChange={(e) => updateField('yearName', e.target.value)}
                placeholder="e.g. 2025-2026"
              />
            </div>
            <div className="form-group">
              <label htmlFor="status">Status</label>
              <select id="status" value={form.status} onChange={(e) => updateField('status', e.target.value)}>
                <option value="Active">Active</option>
                <option value="Closed">Closed</option>
              </select>
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
            {saving ? 'Saving...' : editingId ? 'Update Academic Year' : 'Save Academic Year'}
          </button>
        </form>
      )}

      {error && <ErrorPanel message={error} onRetry={loadItems} />}
      {loading && <p className="status-text">Loading academic years...</p>}
      {!loading && !error && items.length === 0 && <EmptyState />}

      {!loading && !error && items.length > 0 && (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Year name</th>
                <th>Start date</th>
                <th>End date</th>
                <th>Status</th>
                <th>Semesters</th>
                <th style={{ width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.yearName}</td>
                  <td>{item.startDate}</td>
                  <td>{item.endDate}</td>
                  <td>
                    <span className={`pill ${item.status === 'Active' ? 'active' : 'draft'}`}>{item.status}</span>
                  </td>
                  <td>{item.semesters.length}</td>
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
