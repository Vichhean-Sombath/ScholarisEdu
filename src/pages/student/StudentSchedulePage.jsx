import { useEffect, useMemo, useState } from 'react'
import { getStudentSchedule } from '../../services/studentService'
import {
  PageHeader,
  DashboardSkeleton,
  ErrorPanel,
  TablePanel,
  DataTable,
  EmptyState,
} from './studentUtils'

const DAY_ORDER = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function StudentSchedulePage() {
  const [schedule, setSchedule] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadSchedule = () => {
    setLoading(true)
    setError('')
    getStudentSchedule()
      .then((data) => setSchedule(data))
      .catch(() => setError('Could not load schedule. Please make sure the server is running and try again.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadSchedule()
  }, [])

  const scheduleByDay = useMemo(() => {
    const grouped = {}
    DAY_ORDER.forEach((day) => (grouped[day] = []))
    schedule.forEach((item) => {
      if (!grouped[item.dayOfWeek]) grouped[item.dayOfWeek] = []
      grouped[item.dayOfWeek].push(item)
    })
    return grouped
  }, [schedule])

  return (
    <div className="page-section">
      <PageHeader title="My Schedule" subtitle="Your weekly class timetable." />

      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <ErrorPanel message={error} onRetry={loadSchedule} />
      ) : schedule.length === 0 ? (
        <EmptyState message="No scheduled sessions found." />
      ) : (
        <div className="dashboard-row" style={{ flexDirection: 'column' }}>
          {DAY_ORDER.filter((day) => scheduleByDay[day].length > 0).map((day) => (
            <TablePanel key={day} title={day}>
              <DataTable
                headers={['Time', 'Subject', 'Class', 'Teacher', 'Room']}
                rows={scheduleByDay[day]}
                emptyMessage="No sessions on this day."
                renderRow={(row) => (
                  <tr key={row.scheduleId}>
                    <td>{row.startTime?.slice(0, 5)} - {row.endTime?.slice(0, 5)}</td>
                    <td>{row.subjectName}</td>
                    <td>{row.className}</td>
                    <td>{row.teacherName}</td>
                    <td>{row.roomNumber || '—'}</td>
                  </tr>
                )}
              />
            </TablePanel>
          ))}
        </div>
      )}
    </div>
  )
}
