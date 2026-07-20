import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { getAttendance, getClasses, getSchedules, saveAttendance } from '../../services/teacherService'

const STATUS_OPTIONS = ['Present', 'Absent', 'Late']
const ATTENDANCE_TOKEN = 'scholaris-attendance-token'

const ICONS = {
  search: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  checkCircle: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  alert: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  calendar: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
}

function todayString() {
  return new Date().toISOString().slice(0, 10)
}

function formatDateLabel(dateStr) {
  if (!dateStr) return '—'
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr
  return date.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
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

    const records = classStudents
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

  const qrPayload = useMemo(() => {
    if (!selectedScheduleId || !isToday) return ''
    return JSON.stringify({
      scheduleId: Number(selectedScheduleId),
      date,
      token: ATTENDANCE_TOKEN,
    })
  }, [selectedScheduleId, isToday, date])

  const selectedSchedule = useMemo(() => {
    return classSchedules.find((s) => s.id === Number(selectedScheduleId))
  }, [classSchedules, selectedScheduleId])

  return (
    <div className="page-section attendance-page">
      <div className="attendance-page-header">
        <div>
          <Link to="/teacher/classes" className="back-link">← Back to classes</Link>
          <h2>Daily Attendance</h2>
          <p className="subtitle">Mark attendance for your scheduled class sessions. Students can also check in by scanning the QR code.</p>
        </div>
        <div className="attendance-header-actions">
          <button
            className="btn btn-primary attendance-save-btn"
            onClick={handleSave}
            disabled={saving || !selectedScheduleId || !isToday}
          >
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="attendance-alert attendance-alert-success">
          {ICONS.checkCircle}
          <span>{saveSuccess}</span>
        </div>
      )}
      {saveError && (
        <div className="attendance-alert attendance-alert-error">
          {ICONS.alert}
          <span>{saveError}</span>
        </div>
      )}

      <div className="attendance-top">
        <div className="panel-form attendance-controls">
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
              <label htmlFor="studentSearch">Search students</label>
              <div className="search-row">
                <span className="search-icon">{ICONS.search}</span>
                <input
                  id="studentSearch"
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Name or student ID"
                />
                {search && (
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setSearch('')}
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
          <div className="form-row two-col attendance-meta-row">
            <div className="form-group">
              <label>Date</label>
              <div className="readonly-field">{formatDateLabel(date)}</div>
            </div>
            <div className="form-group">
              <label>Selected session</label>
              <div className="readonly-field">
                {selectedClass?.name || '—'}
                {selectedSchedule && ` • ${selectedSchedule.schedule}`}
              </div>
            </div>
          </div>
        </div>

        {isToday && selectedScheduleId && (
          <div className="attendance-qr-top">
            <div className="qr-card">
              <div className="qr-frame">
                <QRCodeSVG value={qrPayload} size={128} />
              </div>
              <div className="qr-info">
                <p className="qr-title">Scan to check in</p>
                <p className="qr-count">{attendance.filter((a) => a.status === 'Present').length} of {classStudents.length} checked in</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {loading && <p className="status-text">Loading attendance...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && classes.length === 0 && (
        <div className="attendance-empty">
          <span className="attendance-empty-icon">{ICONS.users}</span>
          <p>You are not assigned to any classes yet.</p>
        </div>
      )}

      {!loading && !error && selectedClassId && classSchedules.length === 0 && (
        <div className="attendance-empty">
          <span className="attendance-empty-icon">{ICONS.calendar}</span>
          <p>No schedules found for this class.</p>
        </div>
      )}

      {!loading && !error && selectedClassId && classSchedules.length > 0 && !selectedScheduleId && (
        <div className="attendance-empty">
          <span className="attendance-empty-icon">{ICONS.calendar}</span>
          <p>Please select a schedule to start marking attendance.</p>
        </div>
      )}

      {!loading && !error && selectedScheduleId && classStudents.length === 0 && (
        <div className="attendance-empty">
          <span className="attendance-empty-icon">{ICONS.users}</span>
          <p>No students are enrolled in this class.</p>
        </div>
      )}

      {!loading && !error && selectedScheduleId && classStudents.length > 0 && filteredStudents.length === 0 && search && (
        <div className="attendance-empty">
          <span className="attendance-empty-icon">{ICONS.search}</span>
          <p>No students match your search.</p>
        </div>
      )}

      {!loading && !error && selectedScheduleId && filteredStudents.length > 0 && (
        <div className="data-table-wrapper attendance-table">
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
                  <td className="attendance-student-id">{student.studentIdLabel}</td>
                  <td className="attendance-student-name">{student.name}</td>
                  <td>{student.email}</td>
                  <td>
                    <div className="attendance-status-simple" role="group" aria-label={`Attendance status for ${student.name}`}>
                      {STATUS_OPTIONS.map((status) => {
                        const active = statusFor(student.id) === status
                        return (
                          <button
                            key={status}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            disabled={!isToday}
                            className={`attendance-status-simple-btn ${status.toLowerCase()} ${active ? 'active' : ''}`}
                            onClick={() => handleStatusChange(student.id, status)}
                          >
                            {status}
                          </button>
                        )
                      })}
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
