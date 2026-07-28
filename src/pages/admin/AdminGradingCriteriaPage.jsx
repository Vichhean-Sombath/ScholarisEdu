import { useEffect, useState } from 'react'
import {
  createGradingCriteria,
  deleteGradingCriteria,
  getClasses,
  getGradingCriteria,
  getSubjects,
  updateGradingCriteria,
} from '../../services/teacherService'
import { toastSuccess, toastError, confirmDelete } from '../../utils/sweetAlert'

export default function AdminGradingCriteriaPage() {
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [criteria, setCriteria] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({
    name: '',
    subjectId: '',
    classId: '',
    weight: '',
    attemptCount: 1,
  })

  useEffect(() => {
    Promise.all([getClasses(), getSubjects(), getGradingCriteria()])
      .then(([classesData, subjectsData, criteriaData]) => {
        setClasses(classesData)
        setSubjects(subjectsData)
        setCriteria(criteriaData)
      })
      .catch(() => setError('Could not load grading criteria. Please make sure the server is running and try again.'))
      .finally(() => setLoading(false))
  }, [])

  const resetForm = () => {
    setForm({ name: '', subjectId: '', classId: '', weight: '', attemptCount: 1 })
    setEditingId(null)
  }

  const openNew = () => {
    resetForm()
    setShowForm(true)
  }

  const openEdit = (item) => {
    setForm({
      name: item.name,
      subjectId: item.subjectId ? String(item.subjectId) : '',
      classId: item.classId ? String(item.classId) : '',
      weight: String(item.weight),
      attemptCount: Number(item.attemptCount) || 1,
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const hasSubject = form.subjectId !== ''
    const hasClass = form.classId !== ''

    if (!form.name.trim() || form.weight === '') {
      toastError('Please fill in all required fields.')
      return
    }

    if (!hasSubject && !hasClass) {
      toastError('Please select at least a subject or a class.')
      return
    }

    const weight = Number(form.weight)
    if (Number.isNaN(weight) || weight <= 0 || weight > 100) {
      toastError('Weight must be between 1 and 100.')
      return
    }

    const attemptCount = Number(form.attemptCount)
    if (Number.isNaN(attemptCount) || attemptCount <= 0 || !Number.isInteger(attemptCount)) {
      toastError('Attempt count must be a positive whole number.')
      return
    }

    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        subjectId: hasSubject ? Number(form.subjectId) : null,
        classId: hasClass ? Number(form.classId) : null,
        weight,
        attemptCount,
      }

      if (editingId) {
        const updated = await updateGradingCriteria({ id: editingId, ...payload })
        setCriteria((prev) => prev.map((c) => (c.id === editingId ? updated : c)))
        toastSuccess('Grading criteria updated successfully.')
      } else {
        const created = await createGradingCriteria(payload)
        setCriteria((prev) => [...prev, created])
        toastSuccess('Grading criteria created successfully.')
      }
      resetForm()
      setShowForm(false)
    } catch {
      toastError('Failed to save grading criteria.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = await confirmDelete('grading criteria')
    if (!confirmed) return
    try {
      await deleteGradingCriteria(id)
      setCriteria((prev) => prev.filter((c) => c.id !== id))
      toastSuccess('Grading criteria deleted successfully.')
    } catch {
      toastError('Failed to delete grading criteria.')
    }
  }

  return (
    <div className="page-section">
      <div className="section-header">
        <h3>Grading Criteria</h3>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => (showForm ? setShowForm(false) : openNew())}>
          {showForm ? 'Cancel' : 'New Criteria'}
        </button>
      </div>

      {showForm && (
        <form className="panel-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Criteria Name</label>
              <input
                id="name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Homework"
              />
            </div>
            <div className="form-group">
              <label htmlFor="subjectId">Subject</label>
              <select
                id="subjectId"
                value={form.subjectId}
                onChange={(e) => setForm((f) => ({ ...f, subjectId: e.target.value }))}
              >
                <option value="">All subjects</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="classId">Class (optional)</label>
              <select
                id="classId"
                value={form.classId}
                onChange={(e) => setForm((f) => ({ ...f, classId: e.target.value }))}
              >
                <option value="">All classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="weight">Weight (%)</label>
              <input
                id="weight"
                type="number"
                min="1"
                max="100"
                value={form.weight}
                onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))}
                placeholder="e.g. 20"
              />
            </div>
            <div className="form-group">
              <label htmlFor="attemptCount">Attempts per Semester</label>
              <input
                id="attemptCount"
                type="number"
                min="1"
                step="1"
                value={form.attemptCount}
                onChange={(e) => setForm((f) => ({ ...f, attemptCount: e.target.value }))}
                placeholder="e.g. 2"
              />
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: 'auto' }} disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update Criteria' : 'Save Criteria'}
          </button>
        </form>
      )}

      {loading && <p className="status-text">Loading grading criteria...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && criteria.length === 0 && (
        <p className="status-text">No grading criteria yet. Create your first one above.</p>
      )}

      {!loading && !error && criteria.length > 0 && (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Subject</th>
                <th>Class</th>
                <th>Weight</th>
                <th>Attempts</th>
                <th style={{ width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {criteria.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.subjectName}</td>
                  <td>{c.className}</td>
                  <td>{c.weight}%</td>
                  <td>{c.attemptCount}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-sm btn-secondary" onClick={() => openEdit(c)}>
                        Edit
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}>
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
