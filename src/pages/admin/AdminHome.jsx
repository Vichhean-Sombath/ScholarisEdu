import { useEffect, useState } from 'react'
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
import { getDashboardSummary } from '../../services/dashboardService'
import {
  MoneyIcon,
  UsersIcon,
  TeacherIcon,
  ClassIcon,
  AlertIcon,
  EmptyIcon,
} from '../../components/Icons'

const BLUE_PALETTE = ['#1e3a5f', '#2c5282', '#4a90d9', '#7ab8e8', '#a5d1f5']

const formatCurrency = (value) =>
  `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const formatShortDate = (dateString) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

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
      <p className="error-panel__title">Failed to load dashboard</p>
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
    <div className="dashboard-row">
      {[...Array(2)].map((_, i) => (
        <div key={i} className="panel skeleton-panel" />
      ))}
    </div>
  </div>
)

const KpiCard = ({ icon, value, label, color, comparison }) => (
  <div className="stat-card">
    <div className="stat-card__icon" style={{ background: color }}>
      {icon}
    </div>
    <span className="stat-value">{value}</span>
    <span className="stat-label">{label}</span>
    {comparison && (
      <span className={`stat-comparison ${comparison.direction}`}>
        {comparison.direction === 'up' ? '↑' : '↓'} {comparison.percent}% from last month
      </span>
    )}
  </div>
)

const RANGE_OPTIONS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
]

const RANGE_TITLES = {
  weekly: 'Revenue Trend (Last 7 Days)',
  monthly: 'Revenue Trend (This Month)',
  yearly: 'Revenue Trend (Last 5 Years)',
}

export default function AdminHome() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [range, setRange] = useState('monthly')

  const loadSummary = (selectedRange = range) => {
    setLoading(true)
    setError('')
    getDashboardSummary(selectedRange)
      .then((data) => setSummary(data))
      .catch(() => setError('Could not load dashboard summary. Please make sure the server is running and try again.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadSummary()
  }, [])

  useEffect(() => {
    if (!loading) loadSummary(range)
  }, [range])

  const trendData =
    summary?.revenueTrend?.labels.map((label, index) => ({
      name: label,
      revenue: summary.revenueTrend.data[index] || 0,
    })) || []

  const newStudentsData =
    summary?.newStudentsTrend?.labels.map((label, index) => ({
      name: label,
      students: summary.newStudentsTrend.data[index] || 0,
    })) || []

  const hasTrendData = trendData.some((d) => d.revenue > 0)
  const hasNewStudents = newStudentsData.some((d) => d.students > 0)
  const hasInvoiceStatus = (summary?.invoiceStatus || []).length > 0

  const paletteColorFor = (index) => BLUE_PALETTE[index % BLUE_PALETTE.length]

  return (
    <div className="page-section">
      <div className="page-header">
        <div>
          <h2>Admin Dashboard</h2>
          <p className="subtitle">Overview of revenue, students, teachers, and classes.</p>
        </div>
      </div>

      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <ErrorPanel message={error} onRetry={() => loadSummary()} />
      ) : (
        <>
          <div className="stats-grid">
            <KpiCard
              icon={<MoneyIcon size={22} />}
              value={summary?.monthlyComparison?.currentFormatted || '$0.00'}
              label="Revenue This Month"
              color="#1e3a5f"
              comparison={summary?.monthlyComparison}
            />
            <KpiCard
              icon={<MoneyIcon size={22} />}
              value={summary?.kpis?.totalRevenueFormatted || '$0.00'}
              label="Total Revenue"
              color="#2c5282"
            />
            <KpiCard
              icon={<UsersIcon size={22} />}
              value={summary?.kpis?.totalStudents ?? 0}
              label="Students"
              color="#4a90d9"
            />
            <KpiCard
              icon={<ClassIcon size={22} />}
              value={summary?.kpis?.totalClasses ?? 0}
              label="Classes"
              color="#7ab8e8"
            />
          </div>

          <div className="dashboard-row">
            <div className="panel">
              <div className="panel-header">
                <h3>{RANGE_TITLES[range]}</h3>
                <div className="filter-tabs">
                  {RANGE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      className={`filter-tab ${range === option.value ? 'active' : ''}`}
                      onClick={() => setRange(option.value)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              {hasTrendData ? (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                </div>
              ) : (
                <EmptyState message="No revenue recorded for the selected period." />
              )}
            </div>

            <div className="panel">
              <div className="panel-header">
                <h3>New Students (Last 6 Months)</h3>
              </div>
              {hasNewStudents ? (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={newStudentsData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2c5282" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#2c5282" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                      <Tooltip />
                      <Area type="monotone" dataKey="students" stroke="#2c5282" strokeWidth={2} fillOpacity={1} fill="url(#colorStudents)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState message="No new students recorded in the last 6 months." />
              )}
            </div>

            <div className="panel">
              <div className="panel-header">
                <h3>Invoice Status</h3>
              </div>
              {hasInvoiceStatus ? (
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={summary.invoiceStatus}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                      >
                        {summary.invoiceStatus.map((_, index) => (
                          <Cell key={`cell-status-${index}`} fill={paletteColorFor(index)} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value, name) => [`${value} invoices`, name]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState message="No invoices found." />
              )}
            </div>
          </div>

        </>
      )}
    </div>
  )
}
