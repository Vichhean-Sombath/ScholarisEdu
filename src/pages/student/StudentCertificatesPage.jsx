import { useEffect, useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import CertificateTemplate from '../../components/CertificateTemplate'
import { getStudentCertificates, getStudentProfile } from '../../services/studentService'
import { toastError } from '../../utils/sweetAlert'
import {
  PageHeader,
  DashboardSkeleton,
  ErrorPanel,
  TablePanel,
  DataTable,
  EmptyState,
  formatShortDate,
} from './studentUtils'

function CertificateDownloadButton({ certificate, studentName }) {
  const previewRef = useRef(null)
  const [generating, setGenerating] = useState(false)

  const handleDownload = async () => {
    if (!previewRef.current) return
    setGenerating(true)
    try {
      const canvas = await html2canvas(previewRef.current, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('landscape', 'px', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      const fileName = `${studentName.replace(/\s+/g, '_')}_${certificate.certificateType}_certificate.pdf`
      pdf.save(fileName)
    } catch (err) {
      toastError(err.message || 'Failed to download certificate PDF.')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <>
      <button
        className="btn btn-sm btn-secondary"
        style={{ width: 'auto' }}
        onClick={handleDownload}
        disabled={generating}
      >
        {generating ? 'Generating...' : 'Download'}
      </button>
      <div style={{ position: 'fixed', left: -9999, top: -9999, pointerEvents: 'none' }}>
        <div ref={previewRef}>
          <CertificateTemplate
            studentName={studentName}
            certificateType={certificate.certificateType}
            issueDate={certificate.issueDate}
            schoolName="Scholaris School"
            signature="School Principal"
          />
        </div>
      </div>
    </>
  )
}

export default function StudentCertificatesPage() {
  const [certificates, setCertificates] = useState([])
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const studentName = profile?.fullName || 'Student'

  const loadData = () => {
    setLoading(true)
    setError('')
    Promise.all([getStudentCertificates(), getStudentProfile()])
      .then(([certificatesData, profileData]) => {
        setCertificates(certificatesData)
        setProfile(profileData)
      })
      .catch(() => setError('Could not load certificates. Please make sure the server is running and try again.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="page-section">
      <PageHeader title="My Certificates" subtitle="Certificates issued to you." />

      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <ErrorPanel message={error} onRetry={loadData} />
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
                    <CertificateDownloadButton certificate={row} studentName={studentName} />
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
