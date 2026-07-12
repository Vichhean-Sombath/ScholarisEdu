import { useEffect, useMemo, useState } from 'react'
import { getAssignments, getClasses, getScores, getStudents, saveScore } from '../../services/teacherService'

export default function GradebookPage() {
  const [classes, setClasses] = useState([])
  const [assignments, setAssignments] = useState([])
  const [students, setStudents] = useState([])
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')
  const [selectedClassId, setSelectedClassId] = useState('')
  const [selectedAssignmentId, setSelectedAssignmentId] = useState('')

  useEffect(() => {
    Promise.all([getClasses(), getAssignments(), getStudents()])
      .then(([classesData, assignmentsData, studentsData]) => {
        setClasses(classesData)
        setAssignments(assignmentsData)
        setStudents(studentsData)
        if (classesData.length > 0) {
          setSelectedClassId(String(classesData[0].id))
        }
      })
      .catch(() => setError('Could not load gradebook data. Please make sure the server is running and try again.'))
      .finally(() => setLoading(false))
  }, [])

  const classAssignments = useMemo(() => {
    if (!selectedClassId) return []
    return assignments.filter((a) => a.classId === Number(selectedClassId))
  }, [assignments, selectedClassId])

  const classStudents = useMemo(() => {
    if (!selectedClassId) return []
    return students.filter((s) => s.classId === Number(selectedClassId))
  }, [students, selectedClassId])

  useEffect(() => {
    setSaveError('')
    setSaveSuccess('')
    if (!selectedAssignmentId) {
      setScores([])
      return
    }
    getScores(selectedAssignmentId)
      .then(setScores)
      .catch(() => setScores([]))
  }, [selectedAssignmentId])

  useEffect(() => {
    setSaveError('')
    setSaveSuccess('')
    const first = classAssignments[0]
    setSelectedAssignmentId(first ? String(first.id) : '')
  }, [selectedClassId, classAssignments])

  const scoreFor = (studentId) => {
    const record = scores.find((s) => s.studentId === studentId)
    return record?.score ?? ''
  }

  const scoreIdFor = (studentId) => {
    const record = scores.find((s) => s.studentId === studentId)
    return record?.id
  }

  const handleScoreChange = (studentId, value) => {
    setScores((prev) => {
      const existing = prev.find((s) => s.studentId === studentId)
      if (existing) {
        return prev.map((s) => (s.studentId === studentId ? { ...s, score: value } : s))
      }
      return [
        ...prev,
        {
          assessmentId: Number(selectedAssignmentId),
          studentId,
          score: value,
        },
      ]
    })
    setSaveSuccess('')
  }

  const handleSave = async () => {
    setSaveError('')
    setSaveSuccess('')
    if (!selectedAssignmentId) {
      setSaveError('Please select an assignment.')
      return
    }

    setSaving(true)
    try {
      const updated = await Promise.all(
        classStudents.map(async (student) => {
          const value = scoreFor(student.id)
          if (value === '') return null
          const id = scoreIdFor(student.id)
          return saveScore({
            id,
            assessmentId: Number(selectedAssignmentId),
            studentId: student.id,
            score: value,
          })
        })
      )
      setScores((prev) => {
        const map = new Map(prev.map((s) => [s.studentId, s]))
        updated.forEach((item) => {
          if (item) map.set(item.studentId, item)
        })
        return Array.from(map.values())
      })
      setSaveSuccess('Scores saved successfully.')
    } catch {
      setSaveError('Failed to save scores. Please make sure the server is running and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-section">
      <div className="section-header">
        <h3>Gradebook</h3>
        <button
          className="btn btn-primary"
          style={{ width: 'auto' }}
          onClick={handleSave}
          disabled={saving || !selectedAssignmentId}
        >
          {saving ? 'Saving...' : 'Save Scores'}
        </button>
      </div>

      {saveSuccess && <p className="status-text" style={{ color: 'var(--success)', marginBottom: 12 }}>{saveSuccess}</p>}
      {saveError && <p className="error-text" style={{ marginBottom: 12 }}>{saveError}</p>}

      <div className="panel-form" style={{ marginBottom: 24 }}>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="classId">Class</label>
            <select
              id="classId"
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
            >
              <option value="">Select a class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="assignmentId">Assignment</label>
            <select
              id="assignmentId"
              value={selectedAssignmentId}
              onChange={(e) => setSelectedAssignmentId(e.target.value)}
              disabled={classAssignments.length === 0}
            >
              <option value="">{classAssignments.length === 0 ? 'No assignments' : 'Select an assignment'}</option>
              {classAssignments.map((a) => (
                <option key={a.id} value={a.id}>{a.title}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {loading && <p className="status-text">Loading gradebook...</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && classes.length === 0 && (
        <p className="status-text">You are not assigned to any classes yet.</p>
      )}

      {!loading && !error && selectedClassId && classStudents.length === 0 && (
        <p className="status-text">No students are enrolled in this class.</p>
      )}

      {!loading && !error && selectedClassId && classStudents.length > 0 && (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Email</th>
                <th style={{ width: 160 }}>Score</th>
              </tr>
            </thead>
            <tbody>
              {classStudents.map((student) => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>{student.email}</td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={scoreFor(student.id)}
                      onChange={(e) => handleScoreChange(student.id, e.target.value)}
                      placeholder="—"
                      className="score-input"
                    />
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
