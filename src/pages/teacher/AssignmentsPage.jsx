import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createAssignment,
  getAssignments,
  getGradingCriteria,
  getSchedules,
} from '../../services/teacherService'
import { toastError } from '../../utils/sweetAlert'

export default function AssignmentsPage() {
  const [schedules, setSchedules] = useState([])
  const [criteria, setCriteria] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    title: '',
    scheduleId: '',
    criteriaId: '',
    maxScore: 100,
    dueDate: '',
  })

  useEffect(() => {
    Promise.all([getAssignments(), getSchedules(), getGradingCriteria()])
      .then(([assignmentsData, schedulesData, criteriaData]) => {
        setAssignments(assignmentsData)
        setSchedules(schedulesData)
        setCriteria(criteriaData)
      })
      .catch(() => setError('Could not load assignments. Please make sure the server is running and try again.'))
      .finally(() => setLoading(false))
  }, [])

  const selectedSchedule = useMemo(() => {
    return schedules.find((s) => s.id === Number(form.scheduleId))
  }, [schedules, form.scheduleId])

  const getCriteriaForSchedule = useCallback((schedule) => {
    if (!schedule) return []
    const usage = new Map()
    assignments.forEach((a) => {
      if (a.scheduleId !== schedule.id) return
      usage.set(a.criteriaId, (usage.get(a.criteriaId) || 0) + 1)
    })
    return criteria
      .filter(
        (c) =>
          (c.classId === schedule.classId || !c.classId) &&
          (c.subjectId === schedule.subjectId || !c.subjectId)
      )
      .map((c) => {
        const used = usage.get(c.id) || 0
        return { ...c, used, remaining: Math.max(0, Number(c.attemptCount) - used) }
      })
  }, [criteria, assignments])

  const criteriaForSchedule = useMemo(
    () => getCriteriaForSchedule(selectedSchedule),
    [getCriteriaForSchedule, selectedSchedule]
  )

  const handleScheduleChange = (scheduleId) => {
    const schedule = schedules.find((s) => s.id === Number(scheduleId))
    const available = getCriteriaForSchedule(schedule)
    const matched = available.find((c) => c.remaining > 0) || null
    setForm((f) => ({
      ...f,
      scheduleId,
      criteriaId: matched ? String(matched.id) : '',
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const selectedCriteria = criteriaForSchedule.find((c) => c.id === Number(form.criteriaId))
    if (!form.title.trim() || !form.scheduleId || !form.criteriaId || !form.dueDate) {
      toastError('Please fill in all fields.')
      return
    }
    if (!selectedCriteria) {
      toastError('Please select a valid grading criteria for this schedule.')
      return
    }
    if (selectedCriteria.remaining === 0) {
      toastError(`The selected criteria has already reached its maximum ${selectedCriteria.attemptCount} attempt(s).`)
      return
    }

    setSaving(true)
    try {
      const created = await createAssignment({
        ...form,
        scheduleId: Number(form.scheduleId),
        criteriaId: Number(form.criteriaId),
        maxScore: Number(form.maxScore),
      })
      setAssignments((prev) => [...prev, created])
      setForm({
        title: '',
        scheduleId: '',
        criteriaId: '',
        maxScore: 100,
        dueDate: '',
      })
      setShowForm(false)
    } catch (err) {
      console.error('Failed to save assignment:', err)
      toastError(err.response?.data?.message || err.message || 'Failed to save assignment.')
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
              <label htmlFor="scheduleId">Schedule</label>
              <select
                id="scheduleId"
                value={form.scheduleId}
                onChange={(e) => handleScheduleChange(e.target.value)}
              >
                <option value="">Select a schedule</option>
                {schedules.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.className} • {s.subjectName} • {s.schedule}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="criteriaId">Grading Criteria</label>
              <select
                id="criteriaId"
                value={form.criteriaId}
                onChange={(e) => setForm((f) => ({ ...f, criteriaId: e.target.value }))}
                disabled={criteriaForSchedule.length === 0}
              >
                <option value="">
                  {criteriaForSchedule.length === 0 ? 'No criteria' : 'Select criteria'}
                </option>
                {criteriaForSchedule.map((c) => (
                  <option key={c.id} value={c.id} disabled={c.remaining === 0}>
                    {c.name} ({c.weight}%) — {c.used}/{c.attemptCount} used {c.remaining === 0 && '(full)'}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="maxScore">Max Score</label>
              <input
                id="maxScore"
                type="number"
                min="1"
                value={form.maxScore}
                onChange={(e) => setForm((f) => ({ ...f, maxScore: e.target.value }))}
              />
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
              <th>Subject</th>
              <th>Schedule</th>
              <th>Max Score</th>
              <th>Due Date</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {assignments.map((a) => (
              <tr key={a.id}>
                <td>{a.title}</td>
                <td>{a.className}</td>
                <td>{a.subjectName}</td>
                <td>{a.schedule}</td>
                <td>{a.maxScore}</td>
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
