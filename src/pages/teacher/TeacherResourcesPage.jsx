import { useEffect, useMemo, useState } from 'react'
import {
  getTeacherResources,
  createTeacherResource,
  updateTeacherResource,
  deleteTeacherResource,
  getSchedules,
} from '../../services/teacherService'

const RESOURCE_TYPES = ['LessonPlan', 'Homework', 'Syllabus', 'Other']

function formatShortDate(dateString) {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function TeacherResourcesPage() {
  const [resources, setResources] = useState([])
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    title: '',
    description: '',
    resourceType: 'LessonPlan',
    fileUrl: '',
    scheduleId: '',
  })

  const loadData = () => {
    setLoading(true)
    setError('')
    Promise.all([getTeacherResources(), getSchedules()])
      .then(([resourcesData, schedulesData]) => {
        setResources(resourcesData)
        setSchedules(schedulesData)
      })
      .catch(() => setError('Could not load resources. Please make sure the server is running and try again.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  const scheduleOptions = useMemo(() => {
    return schedules.map((s) => ({ id: s.id, label: `${s.className} • ${s.subjectName} • ${s.schedule}` }))
  }, [schedules])

  const resetForm = () => {
    setForm({ title: '', description: '', resourceType: 'LessonPlan', fileUrl: '', scheduleId: '' })
    setEditingId(null)
    setShowForm(false)
  }

  const handleEdit = (resource) => {
    setForm({
      title: resource.title,
      description: resource.description || '',
      resourceType: resource.resourceType,
      fileUrl: resource.fileUrl || '',
      scheduleId: resource.scheduleId || '',
    })
    setEditingId(resource.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this resource?')) return
    try {
      await deleteTeacherResource(id)
      setResources((prev) => prev.filter((r) => r.id !== id))
      setSuccess('Resource deleted.')
    } catch {
      setError('Failed to delete resource.')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.title.trim() || !form.resourceType) {
      setError('Please provide a title and resource type.')
      return
    }
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      if (editingId) {
        const updated = await updateTeacherResource(editingId, form)
        setResources((prev) => prev.map((r) => (r.id === editingId ? updated : r)))
        setSuccess('Resource updated successfully.')
      } else {
        const created = await createTeacherResource(form)
        setResources((prev) => [created, ...prev])
        setSuccess('Resource created successfully.')
      }
      resetForm()
    } catch {
      setError(editingId ? 'Failed to update resource.' : 'Failed to create resource.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-section">
      <div className="page-header">
        <div>
          <h2>My Resources</h2>
          <p className="subtitle">Manage lesson plans, homework, and materials for your classes.</p>
        </div>
        <button
          className="btn btn-primary"
          style={{ width: 'auto' }}
          onClick={() => (showForm ? resetForm() : setShowForm(true))}
        >
          {showForm ? 'Cancel' : 'New Resource'}
        </button>
      </div>

      {success && <p className="success-text" style={{ marginBottom: 16 }}>{success}</p>}
      {error && <p className="error-text" style={{ marginBottom: 16 }}>{error}</p>}

      {showForm && (
        <form className="panel-form" style={{ marginBottom: 24 }} onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Algebra Week 1"
              />
            </div>
            <div className="form-group">
              <label htmlFor="resourceType">Type</label>
              <select
                id="resourceType"
                value={form.resourceType}
                onChange={(e) => setForm((f) => ({ ...f, resourceType: e.target.value }))}
              >
                {RESOURCE_TYPES.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="scheduleId">Schedule (optional)</label>
              <select
                id="scheduleId"
                value={form.scheduleId}
                onChange={(e) => setForm((f) => ({ ...f, scheduleId: e.target.value }))}
              >
                <option value="">None</option>
                {scheduleOptions.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="fileUrl">File URL</label>
              <input
                id="fileUrl"
                value={form.fileUrl}
                onChange={(e) => setForm((f) => ({ ...f, fileUrl: e.target.value }))}
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                rows="3"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short description of the resource"
              />
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: 'auto' }} disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update Resource' : 'Save Resource'}
          </button>
        </form>
      )}

      {loading ? (
        <p className="status-text">Loading resources...</p>
      ) : resources.length === 0 ? (
        <p className="status-text">No resources yet. Create your first one above.</p>
      ) : (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Schedule</th>
                <th>Upload Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {resources.map((r) => (
                <tr key={r.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{r.title}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{r.description || 'No description'}</div>
                  </td>
                  <td>
                    <span className="pill">{r.resourceType}</span>
                  </td>
                  <td>{r.schedule}</td>
                  <td>{formatShortDate(r.uploadDate)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      {r.fileUrl && (
                        <a href={r.fileUrl} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}>
                          Open
                        </a>
                      )}
                      <button
                        className="btn btn-secondary"
                        style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
                        onClick={() => handleEdit(r)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
                        onClick={() => handleDelete(r.id)}
                      >
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
