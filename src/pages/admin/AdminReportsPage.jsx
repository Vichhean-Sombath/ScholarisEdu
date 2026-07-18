import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { getReportsSummary } from '../../services/dashboardService'
import { getAcademicYears, getSemesters } from '../../services/adminService'
import {
  MoneyIcon,
  UsersIcon,
  TeacherIcon,
  ClassIcon,
  AlertIcon,
  EmptyIcon,
} from '../../components/Icons'

const BLUE_PALETTE = ['#1e3a5f', '#2c5282', '#4a90d9', '#7ab8e8', '#a5d1f5', '#cfe9fc']
const ACCENT_PALETTE = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1']

const TABS = [
  { key: 'financial', label: 'Financial' },
  { key: 'enrollment', label: 'Enrollment' },
  { key: 'academic', label: 'Academic' },
  { key: 'workload', label: 'Teacher Workload' },
]

const RANGE_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

const formatCurrency = (value) =>
  `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatShortDate = (dateString) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

const paletteColorFor = (index, palette = BLUE_PALETTE) => palette[index % palette.length]

const EmptyState = ({ message = 'No data available.' }) => (
  <div className="empty-state">
    <EmptyIcon />
    <p>{message}</p>
  </div>
)

const ErrorPanel = ({ message, onRetry }) => (
  <div className="error-panel">
    <AlertIcon size={24} />
    <div className="error-panel__body">
      <p className="error-panel__title">Failed to load reports</p>
      <p className="error-panel__message">{message}</p>
    </div>
    <button className="btn btn-primary" style={{ width: 'auto' }} onClick={onRetry}>
      Retry
    </button>
  </div>
)

const DashboardSkeleton = () => (
  <div className="skeleton-dashboard">
    <div className="stats-grid">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="stat-card skeleton-card">
          <div className="skeleton-icon" />
          <div className="skeleton-text skeleton-value" />
          <div className="skeleton-text skeleton-label" />
        </div>
      ))}
    </div>
    <div className="dashboard-row">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="panel skeleton-panel" />
      ))}
    </div>
  </div>
)

const KpiCard = ({ icon, value, label, color }) => (
  <div className="stat-card">
    <div className="stat-card__icon" style={{ background: color }}>
      {icon}
    </div>
    <span className="stat-value">{value}</span>
    <span className="stat-label">{label}</span>
  </div>
)

const ChartPanel = ({ title, children, empty, emptyMessage }) => (
  <div className="panel">
    <div className="panel-header">
      <h3>{title}</h3>
    </div>
    {empty ? <EmptyState message={emptyMessage} /> : <div className="chart-container">{children}</div>}
  </div>
)

const TablePanel = ({ title, children }) => (
  <div className="panel" style={{ gridColumn: '1 / -1' }}>
    <div className="panel-header">
      <h3>{title}</h3>
    </div>
    {children}
  </div>
)

const DataTable = ({ headers, rows, renderRow, emptyMessage }) => {
  if (!rows || rows.length === 0) return <EmptyState message={emptyMessage} />
  return (
    <div className="data-table-wrapper">
      <table className="data-table">
        <thead>
          <tr>
            {headers.map((h) => (
              <th key={h}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{rows.map(renderRow)}</tbody>
      </table>
    </div>
  )
}

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState('financial')
  const [range, setRange] = useState('monthly')
  const [academicYears, setAcademicYears] = useState([])
  const [semesters, setSemesters] = useState([])
  const [academicYearId, setAcademicYearId] = useState('')
  const [semesterId, setSemesterId] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [exporting, setExporting] = useState(false)
  const reportRef = useRef(null)

  const filteredSemesters = useMemo(() => {
    if (!academicYearId) return semesters
    return semesters.filter((s) => String(s.academicYearId) === String(academicYearId))
  }, [semesters, academicYearId])

  const loadFilters = () => {
    Promise.all([getAcademicYears(), getSemesters()])
      .then(([years, sems]) => {
        setAcademicYears(years)
        setSemesters(sems)
      })
      .catch(() => {
        // Non-fatal; filters just won't populate
      })
  }

  const loadReports = () => {
    setLoading(true)
    setError('')
    const params = { range }
    if (academicYearId) params.academicYearId = Number(academicYearId)
    if (semesterId) params.semesterId = Number(semesterId)

    getReportsSummary(params)
      .then((summary) => setData(summary))
      .catch(() => setError('Could not load reports. Please make sure the server is running and try again.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadFilters()
    loadReports()
  }, [])

  useEffect(() => {
    if (!loading) loadReports()
  }, [range, academicYearId, semesterId])

  const handleAcademicYearChange = (value) => {
    setAcademicYearId(value)
    if (semesterId && !semesters.some((s) => String(s.academicYearId) === String(value) && String(s.id) === String(semesterId))) {
      setSemesterId('')
    }
  }

  const financial = data?.financial || {}
  const enrollment = data?.enrollment || {}
  const academic = data?.academic || {}
  const workload = data?.teacherWorkload || {}

  const revenueTrendData = useMemo(() => {
    const trend = financial.revenueTrend || { labels: [], data: [] }
    return trend.labels.map((label, index) => ({ name: label, revenue: trend.data[index] || 0 }))
  }, [financial.revenueTrend])

  const paymentMethodsData = financial.paymentMethods || []
  const hasPaymentMethods = paymentMethodsData.some((d) => d.value > 0)

  const newStudentsData = useMemo(() => {
    const trend = enrollment.newStudentsTrend || { labels: [], data: [] }
    return trend.labels.map((label, index) => ({ name: label, students: trend.data[index] || 0 }))
  }, [enrollment.newStudentsTrend])
  const hasNewStudents = newStudentsData.some((d) => d.students > 0)

  const statusDistributionData = enrollment.statusDistribution || []
  const genderDistributionData = enrollment.genderDistribution || []
  const classCapacityRows = enrollment.classCapacity || []

  const attendanceByClassRows = academic.attendanceByClass || []
  const gradesRows = academic.gradesByClassSubject || []
  const finalGradeData = academic.finalGradeDistribution || []

  const workloadRows = workload.workload || []

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const handleExportPdf = async () => {
    if (!reportRef.current || exporting) return
    setExporting(true)
    // Wait for the is-exporting styles (single column, hidden filters) to be applied.
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

    try {
      const activeYear = academicYears.find((y) => String(y.id) === String(academicYearId))
      const activeSemester = semesters.find((s) => String(s.id) === String(semesterId))
      const filterLabel = [
        TABS.find((t) => t.key === activeTab)?.label,
        RANGE_OPTIONS.find((r) => r.value === range)?.label,
        activeYear?.yearName,
        activeSemester?.semesterName,
      ]
        .filter(Boolean)
        .join(' • ')

      const element = reportRef.current
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })

      const pdf = new jsPDF('p', 'mm', 'a4')
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 14
      const contentWidth = pageWidth - margin * 2
      const headerHeight = 18
      const contentY = margin + headerHeight
      const contentPageHeight = pageHeight - contentY - margin

      const scaleFactor = contentWidth / canvas.width
      const scaledContentHeight = canvas.height * scaleFactor
      const pagePixelHeight = Math.max(1, contentPageHeight / scaleFactor)

      const generatedAt = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })

      const addHeader = (pageNumber, totalPages) => {
        pdf.setFontSize(16)
        pdf.setTextColor(30, 41, 59)
        pdf.text('Scholaris Report', margin, margin + 6)
        pdf.setFontSize(10)
        pdf.setTextColor(100)
        pdf.text(filterLabel, margin, margin + 12)
        pdf.text(`Generated: ${generatedAt}`, pageWidth - margin, margin + 6, { align: 'right' })
        if (totalPages > 1) {
          pdf.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - margin, margin + 12, { align: 'right' })
        }
        pdf.setTextColor(0)
        pdf.setDrawColor(226, 232, 240)
        pdf.line(margin, margin + 15, pageWidth - margin, margin + 15)
      }

      const totalPages = Math.ceil(canvas.height / pagePixelHeight) || 1
      let pageNumber = 1
      for (let sourceY = 0; sourceY < canvas.height; sourceY += pagePixelHeight) {
        if (pageNumber > 1) pdf.addPage()
        addHeader(pageNumber, totalPages)

        const remainingPixels = canvas.height - sourceY
        const currentPagePixelHeight = Math.min(pagePixelHeight, remainingPixels)
        const pageCanvas = document.createElement('canvas')
        pageCanvas.width = canvas.width
        pageCanvas.height = currentPagePixelHeight
        const ctx = pageCanvas.getContext('2d')
        ctx.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          currentPagePixelHeight,
          0,
          0,
          canvas.width,
          currentPagePixelHeight
        )

        const pageImgData = pageCanvas.toDataURL('image/png')
        const currentPageHeight = currentPagePixelHeight * scaleFactor
        pdf.addImage(pageImgData, 'PNG', margin, contentY, contentWidth, currentPageHeight)
        pageNumber++
      }

      pdf.save(`report-${activeTab}-${new Date().toISOString().slice(0, 10)}.pdf`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="page-section">
      <div className="page-header">
        <div>
          <h2>Reports</h2>
          <p className="subtitle">Financial, enrollment, academic, and teacher workload insights.</p>
        </div>
        <button
          className="btn btn-primary"
          style={{ width: 'auto', marginTop: 4 }}
          onClick={handleExportPdf}
          disabled={loading || exporting}
        >
          {exporting ? 'Exporting...' : 'Download PDF'}
        </button>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <ErrorPanel message={error} onRetry={loadReports} />
      ) : (
        <div ref={reportRef} className={`report-export ${exporting ? 'is-exporting' : ''}`}>
          <div className="filter-tabs" style={{ marginBottom: 24 }}>
            {TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={`filter-tab ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="panel-form" style={{ marginBottom: 24 }}>
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="reportRange">Range</label>
                <select id="reportRange" value={range} onChange={(e) => setRange(e.target.value)}>
                  {RANGE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="reportAcademicYear">Academic Year</label>
                <select id="reportAcademicYear" value={academicYearId} onChange={(e) => handleAcademicYearChange(e.target.value)}>
                  <option value="">All years</option>
                  {academicYears.map((year) => (
                    <option key={year.id} value={year.id}>
                      {year.yearName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="reportSemester">Semester</label>
                <select id="reportSemester" value={semesterId} onChange={(e) => setSemesterId(e.target.value)}>
                  <option value="">All semesters</option>
                  {filteredSemesters.map((semester) => (
                    <option key={semester.id} value={semester.id}>
                      {semester.semesterName}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button className="btn btn-primary" style={{ width: 'auto' }} onClick={loadReports} disabled={loading}>
                  {loading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>
          </div>

          {activeTab === 'financial' && (
            <>
              <div className="stats-grid">
                <KpiCard
                  icon={<MoneyIcon size={22} />}
                  value={financial.totalRevenueFormatted || formatCurrency(financial.totalRevenue)}
                  label="Total Revenue"
                  color="#1e3a5f"
                />
                <KpiCard
                  icon={<MoneyIcon size={22} />}
                  value={financial.totalOutstandingFormatted || formatCurrency(financial.totalOutstanding)}
                  label="Total Outstanding"
                  color="#2c5282"
                />
                <KpiCard
                  icon={<MoneyIcon size={22} />}
                  value={`${financial.collectionRate ?? 0}%`}
                  label="Collection Rate"
                  color="#4a90d9"
                />
                <KpiCard
                  icon={<MoneyIcon size={22} />}
                  value={financial.outstandingInvoicesCount ?? 0}
                  label="Outstanding Invoices"
                  color="#7ab8e8"
                />
              </div>

              <div className="dashboard-row">
                <ChartPanel
                  title="Revenue Trend"
                  empty={!revenueTrendData.some((d) => d.revenue > 0)}
                  emptyMessage="No revenue recorded for the selected period."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                      <Area type="monotone" dataKey="revenue" stroke="#1e3a5f" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartPanel>

                <ChartPanel
                  title="Payment Methods"
                  empty={!hasPaymentMethods}
                  emptyMessage="No payment methods recorded."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentMethodsData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                      >
                        {paymentMethodsData.map((_, index) => (
                          <Cell key={`cell-payment-${index}`} fill={paletteColorFor(index)} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [formatCurrency(value), name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartPanel>
              </div>

              <TablePanel title={`Outstanding Invoices (${financial.outstandingInvoices?.totalCount ?? 0})`}>
                <DataTable
                  headers={['Invoice', 'Student', 'Issue Date', 'Due Date', 'Total', 'Paid', 'Balance', 'Status']}
                  rows={financial.outstandingInvoices?.rows || []}
                  emptyMessage="No outstanding invoices."
                  renderRow={(row) => (
                    <tr key={row.invoiceId}>
                      <td>{row.invoiceNumber}</td>
                      <td>{row.studentName}</td>
                      <td>{formatShortDate(row.issueDate)}</td>
                      <td>{formatShortDate(row.dueDate)}</td>
                      <td>{formatCurrency(row.totalAmount)}</td>
                      <td>{formatCurrency(row.amountPaid)}</td>
                      <td>{formatCurrency(row.balanceDue)}</td>
                      <td>{row.status}</td>
                    </tr>
                  )}
                />
              </TablePanel>
            </>
          )}

          {activeTab === 'enrollment' && (
            <>
              <div className="stats-grid">
                <KpiCard
                  icon={<UsersIcon size={22} />}
                  value={enrollment.totalStudents ?? 0}
                  label="Total Students"
                  color="#1e3a5f"
                />
                <KpiCard
                  icon={<UsersIcon size={22} />}
                  value={enrollment.activeStudents ?? 0}
                  label="Active Students"
                  color="#2c5282"
                />
                <KpiCard
                  icon={<UsersIcon size={22} />}
                  value={enrollment.inactiveStudents ?? 0}
                  label="Inactive Students"
                  color="#4a90d9"
                />
                <KpiCard
                  icon={<ClassIcon size={22} />}
                  value={`${enrollment.averageUtilization ?? 0}%`}
                  label="Avg. Class Utilization"
                  color="#7ab8e8"
                />
              </div>

              <div className="dashboard-row">
                <ChartPanel
                  title="New Students (Last 6 Months)"
                  empty={!hasNewStudents}
                  emptyMessage="No new students recorded in the last 6 months."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={newStudentsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorNewStudents" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2c5282" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#2c5282" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="students" stroke="#2c5282" strokeWidth={2} fillOpacity={1} fill="url(#colorNewStudents)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartPanel>

                <ChartPanel
                  title="Student Status Distribution"
                  empty={statusDistributionData.length === 0}
                  emptyMessage="No student status data."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusDistributionData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                      >
                        {statusDistributionData.map((_, index) => (
                          <Cell key={`cell-status-${index}`} fill={paletteColorFor(index, ACCENT_PALETTE)} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} students`, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartPanel>
              </div>

              <div className="dashboard-row">
                <ChartPanel
                  title="Gender Distribution"
                  empty={genderDistributionData.length === 0}
                  emptyMessage="No gender data recorded."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={genderDistributionData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                      >
                        {genderDistributionData.map((_, index) => (
                          <Cell key={`cell-gender-${index}`} fill={paletteColorFor(index, ACCENT_PALETTE)} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} students`, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartPanel>
              </div>

              <TablePanel title="Class Capacity">
                <DataTable
                  headers={['Class', 'Academic Year', 'Semester', 'Capacity', 'Enrolled', 'Available', 'Utilization']}
                  rows={classCapacityRows}
                  emptyMessage="No class capacity data."
                  renderRow={(row) => (
                    <tr key={row.classId}>
                      <td>{row.className}</td>
                      <td>{row.academicYearName}</td>
                      <td>{row.semesterName}</td>
                      <td>{row.maxCapacity}</td>
                      <td>{row.enrolled}</td>
                      <td>{row.available}</td>
                      <td>{row.utilizationPercent}%</td>
                    </tr>
                  )}
                />
              </TablePanel>
            </>
          )}

          {activeTab === 'academic' && (
            <>
              <div className="stats-grid">
                <KpiCard
                  icon={<UsersIcon size={22} />}
                  value={`${academic.attendanceSummary?.presentRate ?? 0}%`}
                  label="Present Rate"
                  color="#10b981"
                />
                <KpiCard
                  icon={<UsersIcon size={22} />}
                  value={`${academic.attendanceSummary?.absentRate ?? 0}%`}
                  label="Absent Rate"
                  color="#ef4444"
                />
                <KpiCard
                  icon={<TeacherIcon size={22} />}
                  value={academic.averageFinalScore ?? 0}
                  label="Average Final Score"
                  color="#4a90d9"
                />
                <KpiCard
                  icon={<TeacherIcon size={22} />}
                  value={academic.totalGradedRecords ?? 0}
                  label="Graded Records"
                  color="#7ab8e8"
                />
              </div>

              <div className="dashboard-row">
                <ChartPanel
                  title="Final Grade Distribution"
                  empty={finalGradeData.length === 0 || finalGradeData.every((d) => d.value === 0)}
                  emptyMessage="No final grades recorded."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={finalGradeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#1e3a5f" />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartPanel>

                <ChartPanel
                  title="Attendance Summary"
                  empty={!academic.attendanceSummary?.total}
                  emptyMessage="No attendance records found."
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Present', value: academic.attendanceSummary?.present || 0 },
                          { name: 'Absent', value: academic.attendanceSummary?.absent || 0 },
                          { name: 'Late', value: academic.attendanceSummary?.late || 0 },
                          { name: 'Excused', value: academic.attendanceSummary?.excused || 0 },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                      >
                        {['Present', 'Absent', 'Late', 'Excused'].map((_, index) => (
                          <Cell key={`cell-attendance-${index}`} fill={paletteColorFor(index, ACCENT_PALETTE)} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} records`, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartPanel>
              </div>

              <TablePanel title="Attendance by Class">
                <DataTable
                  headers={['Class', 'Present', 'Absent', 'Late', 'Excused', 'Total', 'Present Rate']}
                  rows={attendanceByClassRows}
                  emptyMessage="No attendance data by class."
                  renderRow={(row) => (
                    <tr key={row.classId}>
                      <td>{row.className}</td>
                      <td>{row.Present}</td>
                      <td>{row.Absent}</td>
                      <td>{row.Late}</td>
                      <td>{row.Excused}</td>
                      <td>{row.total}</td>
                      <td>{row.presentRate}%</td>
                    </tr>
                  )}
                />
              </TablePanel>

              <TablePanel title="Grades by Class & Subject">
                <DataTable
                  headers={['Class', 'Subject', 'Average Score', 'Students Graded']}
                  rows={gradesRows}
                  emptyMessage="No grade data available."
                  renderRow={(row) => (
                    <tr key={`${row.classId}-${row.subjectId}`}>
                      <td>{row.className}</td>
                      <td>{row.subjectName}</td>
                      <td>{row.averageScore}</td>
                      <td>{row.studentCount}</td>
                    </tr>
                  )}
                />
              </TablePanel>
            </>
          )}

          {activeTab === 'workload' && (
            <>
              <div className="stats-grid">
                <KpiCard
                  icon={<TeacherIcon size={22} />}
                  value={workload.totalTeachers ?? 0}
                  label="Total Teachers"
                  color="#1e3a5f"
                />
                <KpiCard
                  icon={<ClassIcon size={22} />}
                  value={workload.averageClassesPerTeacher ?? 0}
                  label="Avg. Classes / Teacher"
                  color="#2c5282"
                />
                <KpiCard
                  icon={<TeacherIcon size={22} />}
                  value={workload.averageScheduleSlotsPerTeacher ?? 0}
                  label="Avg. Slots / Teacher"
                  color="#4a90d9"
                />
                <KpiCard
                  icon={<TeacherIcon size={22} />}
                  value={workload.averageSubjectsPerTeacher ?? 0}
                  label="Avg. Subjects / Teacher"
                  color="#7ab8e8"
                />
              </div>

              <TablePanel title="Teacher Workload">
                <DataTable
                  headers={['Teacher', 'Homeroom Classes', 'Scheduled Classes', 'Unique Subjects', 'Weekly Slots', ...days]}
                  rows={workloadRows}
                  emptyMessage="No teacher workload data."
                  renderRow={(row) => (
                    <tr key={row.teacherId}>
                      <td>{row.teacherName}</td>
                      <td>{row.homeroomClasses}</td>
                      <td>{row.scheduledClasses}</td>
                      <td>{row.uniqueSubjects}</td>
                      <td>{row.totalWeeklySlots}</td>
                      {days.map((day) => (
                        <td key={day}>{row.dailySlotDensity?.[day] ?? 0}</td>
                      ))}
                    </tr>
                  )}
                />
              </TablePanel>
            </>
          )}
        </div>
      )}
    </div>
  )
}
