import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { getStudentAttendance } from '../../services/studentService'
import {
  PageHeader,
  DashboardSkeleton,
  ErrorPanel,
  KpiCard,
  ChartPanel,
  TablePanel,
  DataTable,
  EmptyState,
  statusPillClass,
  paletteColorFor,
  formatShortDate,
  Icon,
} from './studentUtils'

export default function StudentAttendancePage() {
  const [attendance, setAttendance] = useState({ summary: {}, records: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadAttendance = () => {
    setLoading(true)
    setError('')
    getStudentAttendance()
      .then((data) => setAttendance(data))
      .catch(() => setError('Could not load attendance. Please make sure the server is running and try again.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadAttendance()
  }, [])

  const { summary, records } = attendance

  const attendanceChartData = [
    { name: 'Present', value: summary.present || 0 },
    { name: 'Absent', value: summary.absent || 0 },
    { name: 'Late', value: summary.late || 0 },
    { name: 'Excused', value: summary.excused || 0 },
  ].filter((d) => d.value > 0)

  return (
    <div className="page-section">
      <PageHeader title="My Attendance" subtitle="Attendance records across all scheduled classes." />

      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <ErrorPanel message={error} onRetry={loadAttendance} />
      ) : (
        <>
          <div className="stats-grid">
            <KpiCard icon={Icon.users()} value={summary.total ?? 0} label="Total Records" color="#1e3a5f" />
            <KpiCard icon={Icon.users()} value={summary.present ?? 0} label="Present" color="#10b981" />
            <KpiCard icon={Icon.users()} value={summary.absent ?? 0} label="Absent" color="#ef4444" />
            <KpiCard icon={Icon.users()} value={`${summary.presentRate ?? 0}%`} label="Present Rate" color="#4a90d9" />
          </div>

          <div className="dashboard-row" style={{ gridTemplateColumns: '1fr', minHeight: 320 }}>
            <ChartPanel
              title="Attendance Summary"
              empty={attendanceChartData.length === 0}
              emptyMessage="No attendance records found."
            >
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={attendanceChartData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                  >
                    {attendanceChartData.map((_, index) => (
                      <Cell key={`cell-attendance-${index}`} fill={paletteColorFor(index)} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [`${value} records`, name]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </ChartPanel>
          </div>

          <div className="dashboard-row" style={{ flexDirection: 'column' }}>
            <TablePanel title="Attendance Records">
              <DataTable
                headers={['Date', 'Subject', 'Class', 'Time', 'Status']}
                rows={records}
                emptyMessage="No attendance records."
                renderRow={(row) => (
                  <tr key={row.attendanceId}>
                    <td>{formatShortDate(row.attendanceDate)}</td>
                    <td>{row.subjectName}</td>
                    <td>{row.className}</td>
                    <td>{row.startTime?.slice(0, 5)} - {row.endTime?.slice(0, 5)}</td>
                    <td>
                      <span className={statusPillClass(row.status)}>{row.status}</span>
                    </td>
                  </tr>
                )}
              />
            </TablePanel>
          </div>
        </>
      )}
    </div>
  )
}
