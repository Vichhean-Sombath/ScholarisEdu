import { useEffect, useState } from 'react'
import { getStudentCertificates } from '../../services/studentService'
import {
  PageHeader,
  DashboardSkeleton,
  ErrorPanel,
  TablePanel,
  DataTable,
  EmptyState,
  formatShortDate,
} from './studentUtils'

export default function StudentCertificatesPage() {
  const [certificates, setCertificates] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadCertificates = () => {
    setLoading(true)
    setError('')
    getStudentCertificates()
      .then((data) => setCertificates(data))
      .catch(() => setError('Could not load certificates. Please make sure the server is running and try again.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadCertificates()
  }, [])

  return (
    <div className="page-section">
      <PageHeader title="My Certificates" subtitle="Certificates issued to you." />

      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <ErrorPanel message={error} onRetry={loadCertificates} />
      ) : certificates.length === 0 ? (
        <EmptyState message="No certificates issued yet." />
      ) : (
        <div className="dashboard-row" style={{ flexDirection: 'column' }}>
          <TablePanel title="Certificates">
            <DataTable
              headers={['Type', 'Template', 'Issue Date', 'Issued By', 'File']}
              rows={certificates}
              emptyMessage="No certificates issued."
              renderRow={(row) => (
                <tr key={row.certificateId}>
                  <td>{row.certificateType}</td>
                  <td>{row.templateUsed || '—'}</td>
                  <td>{formatShortDate(row.issueDate)}</td>
                  <td>{row.issuedBy}</td>
                  <td>
                    {row.generatedFileUrl ? (
                      <a href={row.generatedFileUrl} target="_blank" rel="noreferrer">
                        Download
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
