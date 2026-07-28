import { useEffect, useState } from 'react'
import { AlertIcon, EmptyIcon } from '../../components/Icons'
import {
  createLessonResource,
  deleteLessonResource,
  getLessonResources,
  getSchedules,
  RESOURCE_TYPES,
  updateLessonResource,
} from '../../services/adminService'
import { getTeachers } from '../../services/userService'
import { toastSuccess, toastError, confirmDelete } from '../../utils/sweetAlert'

const emptyForm = {
  teacherId: '',
  scheduleId: '',
  title: '',
  description: '',
  resourceType: 'LessonPlan',
  fileUrl: '',
  uploadDate: '',
}

function EmptyState({ message = 'No lesson resources found.' }) {
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

export default function AdminLessonResourcesPage() {
  const [items, setItems] = useState([])
  const [teachers, setTeachers] = useState([])
  const [schedules, setSchedules] = useState([])
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
    Promise.all([getLessonResources(), getTeachers(), getSchedules()])
      .then(([resourcesData, teachersData, schedulesData]) => {
        setItems(resourcesData)
        setTeachers(teachersData)
        setSchedules(schedulesData)
      })
      .catch((err) => setError(err.message || 'Could not load lesson resources. Please make sure the server is running and try again.'))
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
      teacherId: String(item.teacherId),
      scheduleId: item.scheduleId ? String(item.scheduleId) : '',
      title: item.title,
      description: item.description,
      resourceType: item.resourceType,
      fileUrl: item.fileUrl,
      uploadDate: item.uploadDate,
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const validate = () => {
    if (!form.teacherId) return 'Teacher is required.'
    if (!form.title.trim()) return 'Title is required.'
    if (form.title.length > 150) return 'Title must not exceed 150 characters.'
    if (!form.resourceType) return 'Resource type is required.'
    if (form.fileUrl) {
      try {
        const parsed = new URL(form.fileUrl)
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          return 'File URL must use http:// or https://.'
        }
      } catch {
        return 'File URL format is invalid.'
      }
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
        teacherId: Number(form.teacherId),
        scheduleId: form.scheduleId,
        title: form.title.trim(),
        description: form.description.trim(),
        resourceType: form.resourceType,
        fileUrl: form.fileUrl.trim(),
        uploadDate: form.uploadDate,
      }

      if (editingId) {
        const updated = await updateLessonResource({ id: editingId, ...payload })
        setItems((prev) => prev.map((i) => (i.id === editingId ? updated : i)))
        toastSuccess('Lesson resource updated successfully.')
      } else {
        const created = await createLessonResource(payload)
        setItems((prev) => [...prev, created])
        toastSuccess('Lesson resource created successfully.')
      }
      resetForm()
      setShowForm(false)
    } catch (err) {
      const backendErrors = err.response?.data?.errors
      const message =
        (Array.isArray(backendErrors) && backendErrors.join(', ')) ||
        err.response?.data?.message ||
        err.message ||
        'Failed to save lesson resource.'
      toastError(message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = await confirmDelete('lesson resource')
    if (!confirmed) return
    try {
      await deleteLessonResource(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
      toastSuccess('Lesson resource deleted successfully.')
    } catch (err) {
      const backendErrors = err.response?.data?.errors
      const message =
        (Array.isArray(backendErrors) && backendErrors.join(', ')) ||
        err.response?.data?.message ||
        err.message ||
        'Failed to delete lesson resource.'
      toastError(message)
    }
  }

  return (
    <div className="page-section">
      <div className="section-header">
        <h3>Lesson Resources</h3>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => (showForm ? setShowForm(false) : openNew())}>
          {showForm ? 'Cancel' : 'New Resource'}
        </button>
      </div>

      {showForm && (
        <form className="panel-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="teacherId">Teacher *</label>
              <select
                id="teacherId"
                value={form.teacherId}
                onChange={(e) => updateField('teacherId', e.target.value)}
              >
                <option value="">Select a teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.profileId} value={teacher.profileId}>
                    {displayName(teacher.firstName, teacher.lastName)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="resourceType">Resource type *</label>
              <select
                id="resourceType"
                value={form.resourceType}
                onChange={(e) => updateField('resourceType', e.target.value)}
              >
                {RESOURCE_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="scheduleId">Schedule (optional)</label>
              <select
                id="scheduleId"
                value={form.scheduleId}
                onChange={(e) => updateField('scheduleId', e.target.value)}
              >
                <option value="">None</option>
                {schedules.map((schedule) => (
                  <option key={schedule.id} value={schedule.id}>
                    {schedule.className} · {schedule.subjectName} · {schedule.timeSlotLabel}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="uploadDate">Upload date</label>
              <input
                id="uploadDate"
                type="date"
                value={form.uploadDate}
                onChange={(e) => updateField('uploadDate', e.target.value)}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="title">Title *</label>
              <input
                id="title"
                value={form.title}
                onChange={(e) => updateField('title', e.target.value)}
                placeholder="e.g. Week 3 Algebra Notes"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="description">Description</label>
              <input
                id="description"
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Optional description"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="fileUrl">File URL</label>
              <input
                id="fileUrl"
                type="url"
                value={form.fileUrl}
                onChange={(e) => updateField('fileUrl', e.target.value)}
                placeholder="https://example.com/resource.pdf"
              />
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: 'auto' }} disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update Resource' : 'Save Resource'}
          </button>
        </form>
      )}

      {error && <ErrorPanel message={error} onRetry={loadItems} />}
      {loading && <p className="status-text">Loading lesson resources...</p>}
      {!loading && !error && items.length === 0 && <EmptyState />}

      {!loading && !error && items.length > 0 && (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Teacher</th>
                <th>Type</th>
                <th>Schedule</th>
                <th>Upload date</th>
                <th>File</th>
                <th style={{ width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.teacherName}</td>
                  <td>{item.resourceType}</td>
                  <td>{item.scheduleLabel}</td>
                  <td>{item.uploadDate || '—'}</td>
                  <td>
                    {item.fileUrl ? (
                      <a href={item.fileUrl} target="_blank" rel="noreferrer">View file</a>
                    ) : (
                      '—'
                    )}
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
