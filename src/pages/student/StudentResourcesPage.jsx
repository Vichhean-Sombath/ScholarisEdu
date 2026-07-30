import { useEffect, useState } from 'react'
import { getStudentResources } from '../../services/studentService'
import {
  PageHeader,
  DashboardSkeleton,
  ErrorPanel,
  TablePanel,
  DataTable,
  EmptyState,
  formatShortDate,
} from './studentUtils'

export default function StudentResourcesPage() {
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadResources = () => {
    setLoading(true)
    setError('')
    getStudentResources()
      .then((data) => setResources(data))
      .catch(() => setError('Could not load resources. Please make sure the server is running and try again.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadResources()
  }, [])

  return (
    <div className="page-section">
      <PageHeader title="Lesson Resources" subtitle="Learning materials shared for your classes." />

      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <ErrorPanel message={error} onRetry={loadResources} />
      ) : resources.length === 0 ? (
        <EmptyState message="No lesson resources available." />
      ) : (
        <div className="dashboard-row" style={{ flexDirection: 'column' }}>
          <TablePanel title="Resources">
            <DataTable
              headers={['Title', 'Type', 'Subject', 'Class', 'Teacher', 'Upload Date', 'File']}
              rows={resources}
              emptyMessage="No lesson resources."
              renderRow={(row) => (
                <tr key={row.resourceId}>
                  <td>{row.title}</td>
                  <td>{row.resourceType}</td>
                  <td>{row.subjectName}</td>
                  <td>{row.className}</td>
                  <td>{row.teacherName}</td>
                  <td>{formatShortDate(row.uploadDate)}</td>
                  <td>
                    {row.fileUrl ? (
                      <a href={row.fileUrl} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              )}
            />
          </TablePanel>
        </div>
      )}
    </div>
  )
}
