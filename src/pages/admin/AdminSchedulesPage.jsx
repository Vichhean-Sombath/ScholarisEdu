import { useEffect, useState } from 'react'
import { AlertIcon, EmptyIcon } from '../../components/Icons'
import {
  createSchedule,
  deleteSchedule,
  getClassesAdmin,
  getSchedules,
  getSubjects,
  getTimeSlots,
  updateSchedule,
} from '../../services/adminService'
import { getTeachers } from '../../services/userService'

const emptyForm = {
  classId: '',
  subjectId: '',
  teacherId: '',
  timeSlotId: '',
  roomNumber: '',
}

function EmptyState({ message = 'No schedules found.' }) {
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

export default function AdminSchedulesPage() {
  const [items, setItems] = useState([])
  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [teachers, setTeachers] = useState([])
  const [timeSlots, setTimeSlots] = useState([])
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
    Promise.all([getSchedules(), getClassesAdmin(), getSubjects(), getTeachers(), getTimeSlots()])
      .then(([schedulesData, classesData, subjectsData, teachersData, timeSlotsData]) => {
        setItems(schedulesData)
        setClasses(classesData)
        setSubjects(subjectsData)
        setTeachers(teachersData)
        setTimeSlots(timeSlotsData)
      })
      .catch((err) => setError(err.message || 'Could not load schedules. Please make sure the server is running and try again.'))
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
      classId: String(item.classId),
      subjectId: String(item.subjectId),
      teacherId: String(item.teacherId),
      timeSlotId: String(item.timeSlotId),
      roomNumber: item.roomNumber === '—' ? '' : item.roomNumber,
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const validate = () => {
    if (!form.classId) return 'Class is required.'
    if (!form.subjectId) return 'Subject is required.'
    if (!form.teacherId) return 'Teacher is required.'
    if (!form.timeSlotId) return 'Time slot is required.'
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
        classId: Number(form.classId),
        subjectId: Number(form.subjectId),
        teacherId: Number(form.teacherId),
        timeSlotId: Number(form.timeSlotId),
        roomNumber: form.roomNumber.trim(),
      }

      if (editingId) {
        const updated = await updateSchedule({ id: editingId, ...payload })
        setItems((prev) => prev.map((i) => (i.id === editingId ? updated : i)))
      } else {
        const created = await createSchedule(payload)
        setItems((prev) => [...prev, created])
      }
      resetForm()
      setShowForm(false)
    } catch (err) {
      setFormError(err.message || 'Failed to save schedule.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return
    setError('')
    try {
      await deleteSchedule(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch (err) {
      setError(err.message || 'Failed to delete schedule.')
    }
  }

  return (
    <div className="page-section">
      <div className="section-header">
        <h3>Schedules</h3>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => (showForm ? setShowForm(false) : openNew())}>
          {showForm ? 'Cancel' : 'New Schedule'}
        </button>
      </div>

      {showForm && (
        <form className="panel-form" onSubmit={handleSubmit}>
          {formError && <p className="error-text">{formError}</p>}
          <div className="form-row">
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
            <div className="form-group">
              <label htmlFor="subjectId">Subject *</label>
              <select
                id="subjectId"
                value={form.subjectId}
                onChange={(e) => updateField('subjectId', e.target.value)}
              >
                <option value="">Select a subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
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
              <label htmlFor="timeSlotId">Time slot *</label>
              <select
                id="timeSlotId"
                value={form.timeSlotId}
                onChange={(e) => updateField('timeSlotId', e.target.value)}
              >
                <option value="">Select a time slot</option>
                {timeSlots.map((slot) => (
                  <option key={slot.id} value={slot.id}>
                    {slot.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="roomNumber">Room number</label>
              <input
                id="roomNumber"
                value={form.roomNumber}
                onChange={(e) => updateField('roomNumber', e.target.value)}
                placeholder="e.g. 101"
              />
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: 'auto' }} disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update Schedule' : 'Save Schedule'}
          </button>
        </form>
      )}

      {error && <ErrorPanel message={error} onRetry={loadItems} />}
      {loading && <p className="status-text">Loading schedules...</p>}
      {!loading && !error && items.length === 0 && <EmptyState />}

      {!loading && !error && items.length > 0 && (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Class</th>
                <th>Subject</th>
                <th>Teacher</th>
                <th>Time slot</th>
                <th>Room</th>
                <th style={{ width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.className}</td>
                  <td>{item.subjectName}</td>
                  <td>{item.teacherName}</td>
                  <td>{item.timeSlotLabel}</td>
                  <td>{item.roomNumber}</td>
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
