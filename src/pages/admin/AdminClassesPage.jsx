import { useEffect, useMemo, useState } from 'react'
import { AlertIcon, EmptyIcon } from '../../components/Icons'
import {
  createClass,
  deleteClass,
  getAcademicYears,
  getClassesAdmin,
  getSemesters,
  updateClass,
} from '../../services/adminService'
import { getTeachers } from '../../services/userService'
import { toastSuccess, toastError, confirmDelete } from '../../utils/sweetAlert'

const emptyForm = {
  className: '',
  academicYearId: '',
  semesterId: '',
  roomNumber: '',
  maxCapacity: '',
  homeroomTeacherId: '',
}

function EmptyState({ message = 'No classes found.' }) {
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

export default function AdminClassesPage() {
  const [items, setItems] = useState([])
  const [academicYears, setAcademicYears] = useState([])
  const [semesters, setSemesters] = useState([])
  const [teachers, setTeachers] = useState([])
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
    Promise.all([getClassesAdmin(), getAcademicYears(), getSemesters(), getTeachers()])
      .then(([classesData, yearsData, semestersData, teachersData]) => {
        setItems(classesData)
        setAcademicYears(yearsData)
        setSemesters(semestersData)
        setTeachers(teachersData)
      })
      .catch((err) => setError(err.message || 'Could not load classes. Please make sure the server is running and try again.'))
      .finally(() => setLoading(false))
  }

  const filteredSemesters = useMemo(() => {
    if (!form.academicYearId) return semesters
    return semesters.filter((s) => String(s.academicYearId) === String(form.academicYearId))
  }, [semesters, form.academicYearId])

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
      className: item.className,
      academicYearId: String(item.academicYearId),
      semesterId: String(item.semesterId),
      roomNumber: item.roomNumber === '—' ? '' : item.roomNumber,
      maxCapacity: item.maxCapacity ? String(item.maxCapacity) : '',
      homeroomTeacherId: item.homeroomTeacherId ? String(item.homeroomTeacherId) : '',
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  const updateField = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (field === 'academicYearId' && prev.semesterId) {
        const stillValid = semesters.some(
          (s) => String(s.id) === String(prev.semesterId) && String(s.academicYearId) === String(value)
        )
        if (!stillValid) next.semesterId = ''
      }
      return next
    })
  }

  const validate = () => {
    if (!form.className.trim()) return 'Class name is required.'
    if (!form.academicYearId) return 'Academic year is required.'
    if (!form.semesterId) return 'Semester is required.'
    if (form.maxCapacity && (Number.isNaN(Number(form.maxCapacity)) || Number(form.maxCapacity) < 1)) {
      return 'Max capacity must be a positive number.'
    }
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
        className: form.className.trim(),
        academicYearId: Number(form.academicYearId),
        semesterId: Number(form.semesterId),
        roomNumber: form.roomNumber.trim(),
        maxCapacity: form.maxCapacity ? Number(form.maxCapacity) : '',
        homeroomTeacherId: form.homeroomTeacherId ? Number(form.homeroomTeacherId) : '',
      }

      if (editingId) {
        const updated = await updateClass({ id: editingId, ...payload })
        setItems((prev) => prev.map((i) => (i.id === editingId ? updated : i)))
        toastSuccess('Class updated successfully.')
      } else {
        const created = await createClass(payload)
        setItems((prev) => [...prev, created])
        toastSuccess('Class created successfully.')
      }
      resetForm()
      setShowForm(false)
    } catch (err) {
      setFormError(err.message || 'Failed to save class.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = await confirmDelete('class')
    if (!confirmed) return
    try {
      await deleteClass(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
      toastSuccess('Class deleted successfully.')
    } catch (err) {
      toastError(err.message || 'Failed to delete class.')
    }
  }

  return (
    <div className="page-section">
      <div className="section-header">
        <h3>Classes</h3>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => (showForm ? setShowForm(false) : openNew())}>
          {showForm ? 'Cancel' : 'New Class'}
        </button>
      </div>

      {showForm && (
        <form className="panel-form" onSubmit={handleSubmit}>
          {formError && <p className="error-text">{formError}</p>}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="className">Class name *</label>
              <input
                id="className"
                value={form.className}
                onChange={(e) => updateField('className', e.target.value)}
                placeholder="e.g. Grade 10A"
              />
            </div>
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
              <label htmlFor="semesterId">Semester *</label>
              <select
                id="semesterId"
                value={form.semesterId}
                onChange={(e) => updateField('semesterId', e.target.value)}
                disabled={!form.academicYearId}
              >
                <option value="">{form.academicYearId ? 'Select a semester' : 'Select an academic year first'}</option>
                {filteredSemesters.map((semester) => (
                  <option key={semester.id} value={semester.id}>
                    {semester.semesterName}
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
            <div className="form-group">
              <label htmlFor="maxCapacity">Max capacity</label>
              <input
                id="maxCapacity"
                type="number"
                min="1"
                value={form.maxCapacity}
                onChange={(e) => updateField('maxCapacity', e.target.value)}
                placeholder="e.g. 30"
              />
            </div>
            <div className="form-group">
              <label htmlFor="homeroomTeacherId">Homeroom teacher</label>
              <select
                id="homeroomTeacherId"
                value={form.homeroomTeacherId}
                onChange={(e) => updateField('homeroomTeacherId', e.target.value)}
              >
                <option value="">None</option>
                {teachers.map((teacher) => (
                  <option key={teacher.profileId} value={teacher.profileId}>
                    {displayName(teacher.firstName, teacher.lastName)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: 'auto' }} disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update Class' : 'Save Class'}
          </button>
        </form>
      )}

      {error && <ErrorPanel message={error} onRetry={loadItems} />}
      {loading && <p className="status-text">Loading classes...</p>}
      {!loading && !error && items.length === 0 && <EmptyState />}

      {!loading && !error && items.length > 0 && (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Class name</th>
                <th>Academic year</th>
                <th>Semester</th>
                <th>Room</th>
                <th>Max capacity</th>
                <th>Homeroom teacher</th>
                <th style={{ width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.className}</td>
                  <td>{item.academicYearName}</td>
                  <td>{item.semesterName}</td>
                  <td>{item.roomNumber}</td>
                  <td>{item.maxCapacity || '—'}</td>
                  <td>{item.homeroomTeacherName}</td>
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
