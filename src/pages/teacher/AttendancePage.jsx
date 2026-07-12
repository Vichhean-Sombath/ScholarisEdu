import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getAttendance, getClasses, getSchedules, saveAttendance } from '../../services/teacherService'

const STATUS_OPTIONS = ['Present', 'Absent', 'Late']

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

export default function AttendancePage() {
  const [searchParams] = useSearchParams()
  const [classes, setClasses] = useState([])
  const [schedules, setSchedules] = useState([])
  const [attendance, setAttendance] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedScheduleId, setSelectedScheduleId] = useState('')
  const [search, setSearch] = useState('')
  const date = todayString()
  const paramClassId = searchParams.get('classId')

  useEffect(() => {
    Promise.all([getClasses(), getSchedules()])
      .then(([classesData, schedulesData]) => {
        setClasses(classesData)
        setSchedules(schedulesData)
        const initialId = paramClassId && classesData.some((c) => c.id === Number(paramClassId))
          ? String(paramClassId)
          : classesData.length > 0
          ? String(classesData[0].id)
          : ''
        setSelectedClassId(initialId)
      })
      .catch(() => setError('Could not load attendance data. Please make sure the server is running and try again.'))
      .finally(() => setLoading(false))
  }, [paramClassId])

  const selectedClass = useMemo(() => {
    return classes.find((c) => c.id === Number(selectedClassId))
  }, [classes, selectedClassId])

  const classSchedules = useMemo(() => {
    if (!selectedClassId) return []
    return schedules.filter((s) => s.classId === Number(selectedClassId))
  }, [schedules, selectedClassId])

  useEffect(() => {
    setSaveError('')
    setSaveSuccess('')
    setSelectedScheduleId('')
    setAttendance([])
  }, [selectedClassId])

  useEffect(() => {
    const first = classSchedules[0]
    setSelectedScheduleId(first ? String(first.id) : '')
  }, [classSchedules])

  const isToday = useMemo(() => date === todayString(), [])

  const classStudents = useMemo(() => {
    if (!selectedClassId) return []
    const cls = classes.find((c) => c.id === Number(selectedClassId))
    if (!cls) return []

    return classes
      .filter((c) => c.id === Number(selectedClassId))
      .flatMap((c) => {
        return (c.enrollments || []).map((enrollment) => {
          const student = enrollment.Student || {}
          const user = student.User || {}
          return {
            id: student.student_id,
            studentIdLabel: String(student.student_id).padStart(4, '0'),
            name: formatName(student.first_name, student.last_name, user.email),
            email: user.email || '—',
          }
        })
      })
  }, [classes, selectedClassId])

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return classStudents
    return classStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.studentIdLabel.toLowerCase().includes(term) ||
        String(s.id).includes(term)
    )
  }, [classStudents, search])

  useEffect(() => {
    setSaveError('')
    setSaveSuccess('')
    if (!selectedScheduleId || !date) {
      setAttendance([])
      return
    }
    getAttendance(selectedScheduleId, date)
      .then(setAttendance)
      .catch(() => setAttendance([]))
  }, [selectedScheduleId, date])

  const statusFor = (studentId) => {
    const record = attendance.find((a) => a.studentId === studentId)
    return record?.status || ''
  }

  const recordIdFor = (studentId) => {
    const record = attendance.find((a) => a.studentId === studentId)
    return record?.id
  }

  const handleStatusChange = (studentId, status) => {
    setAttendance((prev) => {
      const existing = prev.find((a) => a.studentId === studentId)
      if (existing) {
        return prev.map((a) => (a.studentId === studentId ? { ...a, status } : a))
      }
      return [
        ...prev,
        {
          scheduleId: Number(selectedScheduleId),
          studentId,
          date,
          status,
        },
      ]
    })
    setSaveSuccess('')
  }

  const handleSave = async () => {
    setSaveError('')
    setSaveSuccess('')
    if (!isToday) {
      setSaveError('Attendance can only be marked for today.')
      return
    }
    if (!selectedScheduleId) {
      setSaveError('Please select a schedule.')
      return
    }

    const records = filteredStudents
      .map((student) => {
        const status = statusFor(student.id)
        if (!status) return null
        return {
          id: recordIdFor(student.id),
          scheduleId: Number(selectedScheduleId),
          studentId: student.id,
          date,
          status,
        }
      })
      .filter(Boolean)

    if (records.length === 0) {
      setSaveError('No attendance statuses selected.')
      return
    }

    setSaving(true)
    try {
      const updated = await Promise.all(records.map((record) => saveAttendance(record)))
      setAttendance((prev) => {
        const map = new Map(prev.map((a) => [a.studentId, a]))
        updated.forEach((item) => {
          if (item) map.set(item.studentId, item)
        })
        return Array.from(map.values())
      })
      setSaveSuccess('Attendance saved successfully.')
    } catch {
      setSaveError('Failed to save attendance. Please make sure the server is running and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-section">
      <div className="section-header">
        <div>
          <Link to="/teacher/classes" className="back-link">← Back to classes</Link>
          <h3>Daily Attendance</h3>
        </div>
        <button
          className="btn btn-primary"
          style={{ width: 'auto' }}
          onClick={handleSave}
          disabled={saving || !selectedScheduleId || !isToday}
        >
          {saving ? 'Saving...' : 'Save Attendance'}
        </button>
      </div>

      {saveSuccess && <p className="status-text" style={{ color: 'var(--success)', marginBottom: 12 }}>{saveSuccess}</p>}
      {saveError && <p className="error-text" style={{ marginBottom: 12 }}>{saveError}</p>}

      <div className="panel-form" style={{ marginBottom: 24 }}>
        <div className="form-row three-col">
          <div className="form-group">
            <label htmlFor="classId">Class</label>
            <select
              id="classId"
              value={selectedClassId}
              onChange={(e) => {
                setSelectedClassId(e.target.value)
                setSearch('')
              }}
            >
              <option value="">Select a class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="scheduleId">Schedule</label>
            <select
              id="scheduleId"
              value={selectedScheduleId}
              onChange={(e) => setSelectedScheduleId(e.target.value)}
              disabled={classSchedules.length === 0}
            >
              <option value="">{classSchedules.length === 0 ? 'No schedules' : 'Select a schedule'}</option>
              {classSchedules.map((s) => (
                <option key={s.id} value={s.id}>{s.schedule} • {s.subjectName}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Date</label>
            <div className="readonly-field">{date}</div>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="studentSearch">Search student</label>
            <div className="search-row">
              <input
                id="studentSearch"
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or student ID"
              />
              {search && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setSearch('')}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {loading && <p className="status-text">Loading attendance...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && classes.length === 0 && (
        <p className="status-text">You are not assigned to any classes yet.</p>
      )}

      {!loading && !error && selectedClassId && classSchedules.length === 0 && (
        <p className="status-text">No schedules found for this class.</p>
      )}

      {!loading && !error && selectedClassId && classSchedules.length > 0 && !selectedScheduleId && (
        <p className="status-text">Please select a schedule.</p>
      )}

      {!loading && !error && selectedScheduleId && classStudents.length === 0 && (
        <p className="status-text">No students are enrolled in this class.</p>
      )}

      {!loading && !error && selectedScheduleId && classStudents.length > 0 && filteredStudents.length === 0 && search && (
        <p className="status-text">No students match your search.</p>
      )}

      {!loading && !error && selectedScheduleId && filteredStudents.length > 0 && (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student ID</th>
                <th>Student</th>
                <th>Email</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((student) => (
                <tr key={student.id}>
                  <td>{student.studentIdLabel}</td>
                  <td>{student.name}</td>
                  <td>{student.email}</td>
                  <td>
                    <div className="status-options">
                      {STATUS_OPTIONS.map((status) => (
                        <button
                          key={status}
                          type="button"
                          disabled={!isToday}
                          className={`status-option ${status.toLowerCase()} ${statusFor(student.id) === status ? 'active' : ''}`}
                          onClick={() => handleStatusChange(student.id, status)}
                        >
                          {status}
                        </button>
                      ))}
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

function formatName(firstName, lastName, fallback) {
  const name = [firstName, lastName].filter(Boolean).join(' ').trim()
  return name || fallback || 'Unknown student'
}
