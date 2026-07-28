import { useEffect, useState } from 'react'
import { AlertIcon, EmptyIcon } from '../../components/Icons'
import { createSubject, deleteSubject, getSubjects, updateSubject } from '../../services/adminService'
import { toastSuccess, toastError, confirmDelete } from '../../utils/sweetAlert'

const emptyForm = {
  code: '',
  name: '',
  description: '',
  prerequisiteSubjectId: '',
}

function EmptyState({ message = 'No subjects found.' }) {
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

export default function AdminSubjectsPage() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = () => {
    setLoading(true)
    setError('')
    getSubjects()
      .then((data) => setItems(data))
      .catch((err) => setError(err.message || 'Could not load subjects. Please make sure the server is running and try again.'))
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

  const openEdit = (item) => {
    setForm({
      code: item.code,
      name: item.name,
      description: item.description,
      prerequisiteSubjectId: item.prerequisiteSubjectId ? String(item.prerequisiteSubjectId) : '',
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const validate = () => {
    if (!form.code.trim()) return 'Subject code is required.'
    if (!form.name.trim()) return 'Subject name is required.'
    if (form.prerequisiteSubjectId && String(form.prerequisiteSubjectId) === String(editingId)) {
      return 'A subject cannot be its own prerequisite.'
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
        code: form.code.trim(),
        name: form.name.trim(),
        description: form.description.trim(),
        prerequisiteSubjectId: form.prerequisiteSubjectId,
      }

      if (editingId) {
        await updateSubject({ id: editingId, ...payload })
        toastSuccess('Subject updated successfully.')
      } else {
        await createSubject(payload)
        toastSuccess('Subject created successfully.')
      }
      await loadItems()
      resetForm()
      setShowForm(false)
    } catch (err) {
      toastError(err.message || 'Failed to save subject.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = await confirmDelete('subject')
    if (!confirmed) return
    try {
      await deleteSubject(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
      toastSuccess('Subject deleted successfully.')
    } catch (err) {
      toastError(err.message || 'Failed to delete subject.')
    }
  }

  const availablePrerequisites = items.filter((i) => String(i.id) !== String(editingId))

  return (
    <div className="page-section">
      <div className="section-header">
        <h3>Subjects</h3>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => (showForm ? setShowForm(false) : openNew())}>
          {showForm ? 'Cancel' : 'New Subject'}
        </button>
      </div>

      {showForm && (
        <form className="panel-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="code">Subject code *</label>
              <input
                id="code"
                value={form.code}
                onChange={(e) => updateField('code', e.target.value)}
                placeholder="e.g. MATH101"
              />
            </div>
            <div className="form-group">
              <label htmlFor="name">Subject name *</label>
              <input
                id="name"
                value={form.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g. Mathematics"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="prerequisiteSubjectId">Prerequisite subject</label>
              <select
                id="prerequisiteSubjectId"
                value={form.prerequisiteSubjectId}
                onChange={(e) => updateField('prerequisiteSubjectId', e.target.value)}
              >
                <option value="">None</option>
                {availablePrerequisites.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="description">Description</label>
              <input
                id="description"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Optional subject description"
              />
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: 'auto' }} disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update Subject' : 'Save Subject'}
          </button>
        </form>
      )}

      {error && <ErrorPanel message={error} onRetry={loadItems} />}
      {loading && <p className="status-text">Loading subjects...</p>}
      {!loading && !error && items.length === 0 && <EmptyState />}

      {!loading && !error && items.length > 0 && (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Name</th>
                <th>Prerequisite</th>
                <th>Description</th>
                <th style={{ width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.code}</td>
                  <td>{item.name}</td>
                  <td>{item.prerequisiteSubjectName}</td>
                  <td>{item.description || '—'}</td>
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
