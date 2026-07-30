import { useEffect, useState } from 'react'
import { getStudentSummary } from '../../services/studentService'
import {
  PageHeader,
  DashboardSkeleton,
  ErrorPanel,
  KpiCard,
  TablePanel,
  DataTable,
  formatCurrency,
  formatShortDate,
  statusPillClass,
  Icon,
} from './studentUtils'

export default function StudentHome() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadSummary = () => {
    setLoading(true)
    setError('')
    getStudentSummary()
      .then((data) => setSummary(data))
      .catch(() => setError('Could not load dashboard data. Please make sure the server is running and try again.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadSummary()
  }, [])

  return (
    <div className="page-section">
      <PageHeader
        title="Student Dashboard"
        subtitle={summary?.profile?.fullName ? `Welcome back, ${summary.profile.fullName}` : 'Overview of your academic activity.'}
      />

      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <ErrorPanel message={error} onRetry={loadSummary} />
      ) : (
        <>
          <div className="stats-grid">
            <KpiCard icon={Icon.class()} value={summary?.kpis?.classCount ?? 0} label="My Classes" color="#1e3a5f" />
            <KpiCard icon={Icon.teacher()} value={summary?.kpis?.scheduleCount ?? 0} label="Weekly Sessions" color="#2c5282" />
            <KpiCard
              icon={Icon.money()}
              value={summary?.kpis?.outstandingBalanceFormatted || '$0.00'}
              label="Outstanding Balance"
              color="#ef4444"
            />
            <KpiCard
              icon={Icon.users()}
              value={`${summary?.kpis?.attendancePresentRate ?? 0}%`}
              label="Attendance Present Rate"
              color="#10b981"
            />
          </div>

          <div className="dashboard-row">
            <TablePanel title="Recent Grades">
              <DataTable
                headers={['Assessment', 'Subject', 'Score', 'Date']}
                rows={summary?.recentGrades || []}
                emptyMessage="No recent grades."
                renderRow={(row) => (
                  <tr key={row.gradeId}>
                    <td>{row.assessmentName}</td>
                    <td>{row.subjectName}</td>
                    <td>{row.score} / {row.maxScore}</td>
                    <td>{formatShortDate(row.assessmentDate)}</td>
                  </tr>
                )}
              />
            </TablePanel>
          </div>

          <div className="dashboard-row">
            <TablePanel title="Upcoming Schedule">
              <DataTable
                headers={['Day', 'Time', 'Subject', 'Class', 'Room']}
                rows={summary?.upcomingSchedule || []}
                emptyMessage="No upcoming sessions."
                renderRow={(row) => (
                  <tr key={row.scheduleId}>
                    <td>{row.dayOfWeek}</td>
                    <td>{row.startTime?.slice(0, 5)} - {row.endTime?.slice(0, 5)}</td>
                    <td>{row.subjectName}</td>
                    <td>{row.className}</td>
                    <td>{row.roomNumber || '—'}</td>
                  </tr>
                )}
              />
            </TablePanel>

            <TablePanel title="Recent Attendance">
              <DataTable
                headers={['Date', 'Subject', 'Status']}
                rows={summary?.recentAttendance || []}
                emptyMessage="No attendance records."
                renderRow={(row) => (
                  <tr key={row.attendanceId}>
                    <td>{formatShortDate(row.attendanceDate)}</td>
                    <td>{row.subjectName}</td>
                    <td>
                      <span className={statusPillClass(row.status)}>{row.status}</span>
                    </td>
                  </tr>
                )}
              />
            </TablePanel>
          </div>

          <div className="dashboard-row">
            <TablePanel title="Recent Invoices">
              <DataTable
                headers={['Invoice', 'Due Date', 'Balance', 'Status']}
                rows={summary?.recentInvoices || []}
                emptyMessage="No recent invoices."
                renderRow={(row) => (
                  <tr key={row.invoiceId}>
                    <td>{row.invoiceNumber}</td>
                    <td>{formatShortDate(row.dueDate)}</td>
                    <td>{formatCurrency(row.balanceDue)}</td>
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
