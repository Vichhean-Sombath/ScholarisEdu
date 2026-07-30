import { EmptyIcon, AlertIcon, MoneyIcon, UsersIcon, ClassIcon, TeacherIcon } from '../../components/Icons'

export const BLUE_PALETTE = ['#1e3a5f', '#2c5282', '#4a90d9', '#7ab8e8', '#a5d1f5']
export const ACCENT_PALETTE = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1']

export const formatCurrency = (value) =>
  `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export const formatShortDate = (dateString) => {
  if (!dateString) return '—'
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export const paletteColorFor = (index, palette = BLUE_PALETTE) => palette[index % palette.length]

export const statusPillClass = (status) => {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'paid') return 'pill paid'
  if (['unpaid', 'overdue'].includes(normalized)) return 'pill overdue'
  if (normalized === 'partial') return 'pill partial'
  if (normalized === 'present') return 'pill present'
  if (normalized === 'absent') return 'pill absent'
  if (normalized === 'late') return 'pill late'
  if (normalized === 'excused') return 'pill excused'
  return 'pill'
}

export const EmptyState = ({ message = 'No data available.' }) => (
  <div className="empty-state">
    <EmptyIcon />
    <p>{message}</p>
  </div>
)

export const ErrorPanel = ({ message, onRetry }) => (
  <div className="error-panel">
    <AlertIcon size={24} />
    <div className="error-panel__body">
      <p className="error-panel__title">Failed to load data</p>
      <p className="error-panel__message">{message}</p>
    </div>
    {onRetry && (
      <button className="btn btn-primary" style={{ width: 'auto' }} onClick={onRetry}>
        Retry
      </button>
    )}
  </div>
)

export const DashboardSkeleton = () => (
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

export const KpiCard = ({ icon, value, label, color }) => (
  <div className="stat-card">
    <div className="stat-card__icon" style={{ background: color }}>{icon}</div>
    <span className="stat-value">{value}</span>
    <span className="stat-label">{label}</span>
  </div>
)

export const ChartPanel = ({ title, children, empty, emptyMessage }) => (
  <div className="panel">
    <div className="panel-header">
      <h3>{title}</h3>
    </div>
    {empty ? <EmptyState message={emptyMessage} /> : <div className="chart-container">{children}</div>}
  </div>
)

export const TablePanel = ({ title, children }) => (
  <div className="panel" style={{ gridColumn: '1 / -1' }}>
    <div className="panel-header">
      <h3>{title}</h3>
    </div>
    {children}
  </div>
)

export const DataTable = ({ headers, rows, renderRow, emptyMessage }) => {
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

export const PageHeader = ({ title, subtitle }) => (
  <div className="page-header">
    <div>
      <h2>{title}</h2>
      {subtitle && <p className="subtitle">{subtitle}</p>}
    </div>
  </div>
)

export const Icon = {
  money: (size = 22) => <MoneyIcon size={size} />,
  users: (size = 22) => <UsersIcon size={size} />,
  class: (size = 22) => <ClassIcon size={size} />,
  teacher: (size = 22) => <TeacherIcon size={size} />,
}
