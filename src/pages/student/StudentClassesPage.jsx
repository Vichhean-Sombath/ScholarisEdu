import { useEffect, useState } from 'react'
import { getStudentClasses } from '../../services/studentService'
import {
  PageHeader,
  DashboardSkeleton,
  ErrorPanel,
  TablePanel,
  DataTable,
  EmptyState,
} from './studentUtils'

export default function StudentClassesPage() {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadClasses = () => {
    setLoading(true)
    setError('')
    getStudentClasses()
      .then((data) => setClasses(data))
      .catch(() => setError('Could not load classes. Please make sure the server is running and try again.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadClasses()
  }, [])

  return (
    <div className="page-section">
      <PageHeader title="My Classes" subtitle="Your enrolled classes and their weekly schedules." />

      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <ErrorPanel message={error} onRetry={loadClasses} />
      ) : (
        <div className="dashboard-row" style={{ flexDirection: 'column' }}>
          {classes.length === 0 ? (
            <EmptyState message="You are not enrolled in any classes yet." />
          ) : (
            classes.map((cls) => (
              <TablePanel key={cls.classId} title={cls.className}>
                <div style={{ marginBottom: 16 }}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Academic Year</label>
                      <p>{cls.academicYear}</p>
                    </div>
                    <div className="form-group">
                      <label>Semester</label>
                      <p>{cls.semester}</p>
                    </div>
                    <div className="form-group">
                      <label>Homeroom Teacher</label>
                      <p>{cls.homeroomTeacher}</p>
                    </div>
                    <div className="form-group">
                      <label>Room</label>
                      <p>{cls.roomNumber || '—'}</p>
                    </div>
                  </div>
                </div>
                <DataTable
                  headers={['Day', 'Time', 'Subject', 'Teacher', 'Room']}
                  rows={cls.schedules}
                  emptyMessage="No schedules for this class."
                  renderRow={(row) => (
                    <tr key={row.scheduleId}>
                      <td>{row.dayOfWeek}</td>
                      <td>{row.startTime?.slice(0, 5)} - {row.endTime?.slice(0, 5)}</td>
                      <td>{row.subjectName}</td>
                      <td>{row.teacherName}</td>
                      <td>{row.roomNumber || '—'}</td>
                    </tr>
                  )}
                />
              </TablePanel>
            ))
          )}
        </div>
      )}
    </div>
  )
}
