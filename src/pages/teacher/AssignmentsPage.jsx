import { useEffect, useState } from 'react'
import { createAssignment, getAssignments, getClasses } from '../../services/teacherService'

export default function AssignmentsPage() {
  const [classes, setClasses] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', classId: '', dueDate: '', status: 'Active' })

  useEffect(() => {
    Promise.all([getClasses(), getAssignments()])
      .then(([classesData, assignmentsData]) => {
        setClasses(classesData)
        setAssignments(assignmentsData)
      })
      .catch(() => setError('Could not load assignments. Please make sure the server is running and try again.'))
      .finally(() => setLoading(false))
  }, [])

  const className = (id) => classes.find((c) => c.id === Number(id))?.name || 'Unknown class'

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    if (!form.title.trim() || !form.classId || !form.dueDate) {
      setFormError('Please fill in all fields.')
      return
    }

    setSaving(true)
    try {
      const created = await createAssignment({ ...form, classId: Number(form.classId) })
      setAssignments((prev) => [...prev, created])
      setForm({ title: '', classId: '', dueDate: '', status: 'Active' })
      setShowForm(false)
    } catch {
      setFormError('Failed to save assignment.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-section">
      <div className="section-header">
        <h3>Assignments</h3>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : 'New Assignment'}
        </button>
      </div>

      {showForm && (
        <form className="panel-form" onSubmit={handleSubmit}>
          {formError && <p className="error-text">{formError}</p>}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="title">Title</label>
              <input
                id="title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Algebra Quiz 1"
              />
            </div>
            <div className="form-group">
              <label htmlFor="classId">Class</label>
              <select
                id="classId"
                value={form.classId}
                onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))}
              >
                <option value="">Select a class</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="dueDate">Due Date</label>
              <input
                id="dueDate"
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm((f) => ({ ...f, dueDate: e.target.value }))}
              />
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: 'auto' }} disabled={saving}>
            {saving ? 'Saving...' : 'Save Assignment'}
          </button>
        </form>
      )}

      {loading && <p className="status-text">Loading assignments...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && assignments.length === 0 && (
        <p className="status-text">No assignments yet. Create your first one above.</p>
      )}

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Class</th>
              <th>Due Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.id}>
                <td>{a.title}</td>
                <td>{className(a.classId)}</td>
                <td>{a.dueDate}</td>
                <td>
                  <span className={`pill ${a.status.toLowerCase()}`}>{a.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
