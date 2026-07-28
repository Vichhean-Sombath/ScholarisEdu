import { useEffect, useRef, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { AlertIcon, EmptyIcon } from '../../components/Icons'
import { createCertificate, deleteCertificate, getCertificates } from '../../services/adminService'
import { getStudents } from '../../services/userService'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'
import CertificateTemplate from '../../components/CertificateTemplate'
import { toastSuccess, toastError, confirmDelete } from '../../utils/sweetAlert'

const CERTIFICATE_TYPES = ['Completion', 'Transcript', 'Recommendation']

const emptyForm = {
  studentId: '',
  certificateType: 'Completion',
  templateUsed: 'Scholaris Default',
  issueDate: '',
  generatedFileUrl: '',
  schoolName: 'Scholaris School',
  signature: 'School Principal',
}

function EmptyState({ message = 'No certificates found.' }) {
  return (
    <div className="empty-state">
      <EmptyIcon />
      <p>{message}</p>
    </div>
  )
}

function ErrorPanel({ message, onRetry }) {
  return (
    <div className="error-panel" style={{ marginBottom: 24 }}>
      <AlertIcon size={24} />
      <div className="error-panel__body">
        <p>{message}</p>
      </div>
      <button className="btn btn-primary" style={{ width: 'auto' }} onClick={onRetry}>
        Retry
      </button>
    </div>
  )
}

function displayName(firstName, lastName) {
  return [firstName, lastName].filter(Boolean).join(' ').trim() || '—'
}

export default function AdminCertificatesPage() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [generating, setGenerating] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const previewRef = useRef(null)

  useEffect(() => {
    loadItems()
  }, [])

  useEffect(() => {
    if (showForm && !form.issueDate) {
      setForm((prev) => ({ ...prev, issueDate: new Date().toISOString().slice(0, 10) }))
    }
  }, [showForm])

  const loadItems = () => {
    setLoading(true)
    setError('')
    Promise.all([getCertificates(), getStudents()])
      .then(([certificatesData, studentsData]) => {
        setItems(certificatesData)
        setStudents(studentsData)
      })
      .catch((err) => setError(err.message || 'Could not load certificates. Please make sure the server is running and try again.'))
      .finally(() => setLoading(false))
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
  }

  const openNew = () => {
    resetForm()
    setShowForm(true)
  }

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const selectedStudent = students.find((s) => String(s.profileId) === form.studentId)
  const studentDisplayName = selectedStudent
    ? displayName(selectedStudent.firstName, selectedStudent.lastName)
    : 'Student Name'

  const generatePDF = async () => {
    const validationError = validate()
    if (validationError) {
      toastError(validationError)
      return null
    }

    const element = previewRef.current
    if (!element) return null

    setGenerating(true)
    try {
      const canvas = await html2canvas(element, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL('image/png')

      const pdf = new jsPDF('landscape', 'px', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      return pdf
    } catch (err) {
      toastError(err.message || 'Failed to generate certificate PDF.')
      return null
    } finally {
      setGenerating(false)
    }
  }

  const handleDownload = async () => {
    const pdf = await generatePDF()
    if (!pdf) return
    const fileName = `${studentDisplayName.replace(/\s+/g, '_')}_${form.certificateType}_certificate.pdf`
    pdf.save(fileName)
  }

  const validate = () => {
    if (!form.studentId) return 'Student is required.'
    if (!form.certificateType) return 'Certificate type is required.'
    if (!form.issueDate) return 'Issue date is required.'
    if (form.generatedFileUrl) {
      try {
        const parsed = new URL(form.generatedFileUrl)
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          return 'Generated file URL must use http:// or https://.'
        }
      } catch {
        return 'Generated file URL format is invalid.'
      }
    }
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (editingId) {
      toastError('Certificate records cannot be edited. Delete and recreate if needed.')
      return
    }

    const validationError = validate()
    if (validationError) {
      toastError(validationError)
      return
    }

    setSaving(true)
    try {
      await createCertificate({
        studentId: Number(form.studentId),
        certificateType: form.certificateType,
        templateUsed: form.templateUsed.trim(),
        issueDate: form.issueDate,
        generatedFileUrl: form.generatedFileUrl.trim() || undefined,
        issuedBy: user?.user_id,
      })
      await loadItems()
      toastSuccess('Certificate issued successfully.')
      resetForm()
      setShowForm(false)
    } catch (err) {
      toastError(err.message || 'Failed to create certificate.')
    } finally {
      setSaving(false)
    }
  }

  const handleView = (item) => {
    setForm({
      studentId: String(item.studentId),
      certificateType: item.certificateType,
      templateUsed: item.templateUsed,
      issueDate: item.issueDate,
      generatedFileUrl: item.generatedFileUrl || '',
      schoolName: emptyForm.schoolName,
      signature: emptyForm.signature,
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  const handleDownloadFromRow = async (item) => {
    const student = students.find((s) => String(s.profileId) === String(item.studentId))
    const name = student ? displayName(student.firstName, student.lastName) : item.studentName || 'Student'

    setEditingId(item.id)
    setForm({
      studentId: String(item.studentId),
      certificateType: item.certificateType,
      templateUsed: item.templateUsed,
      issueDate: item.issueDate,
      generatedFileUrl: item.generatedFileUrl || '',
      schoolName: emptyForm.schoolName,
      signature: emptyForm.signature,
    })

    // Let the preview render, then generate PDF.
    setShowForm(true)
    setTimeout(async () => {
      const pdf = await generatePDF()
      if (pdf) {
        const fileName = `${name.replace(/\s+/g, '_')}_${item.certificateType}_certificate.pdf`
        pdf.save(fileName)
      }
      setShowForm(false)
      resetForm()
    }, 100)
  }

  const handleDelete = async (id) => {
    const confirmed = await confirmDelete('certificate')
    if (!confirmed) return
    try {
      await deleteCertificate(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
      toastSuccess('Certificate deleted successfully.')
    } catch (err) {
      toastError(err.message || 'Failed to delete certificate.')
    }
  }

  return (
    <div className="page-section">
      <div className="section-header">
        <h3>Certificates</h3>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => (showForm ? setShowForm(false) : openNew())}>
          {showForm ? 'Cancel' : 'New Certificate'}
        </button>
      </div>

      {showForm && (
        <form className="panel-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="studentId">Student *</label>
              <select
                id="studentId"
                value={form.studentId}
                onChange={(e) => updateField('studentId', e.target.value)}
              >
                <option value="">Select a student</option>
                {students.map((student) => (
                  <option key={student.profileId} value={student.profileId}>
                    {displayName(student.firstName, student.lastName)} ({student.email})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="certificateType">Certificate type *</label>
              <select
                id="certificateType"
                value={form.certificateType}
                onChange={(e) => updateField('certificateType', e.target.value)}
              >
                {CERTIFICATE_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="issueDate">Issue date *</label>
              <input id="issueDate" type="date" value={form.issueDate} onChange={(e) => updateField('issueDate', e.target.value)} />
            </div>
            <div className="form-group">
              <label htmlFor="templateUsed">Template used</label>
              <input
                id="templateUsed"
                value={form.templateUsed}
                onChange={(e) => updateField('templateUsed', e.target.value)}
                placeholder="e.g. Standard Completion"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="schoolName">School name</label>
              <input
                id="schoolName"
                value={form.schoolName}
                onChange={(e) => updateField('schoolName', e.target.value)}
                placeholder="Scholaris School"
              />
            </div>
            <div className="form-group">
              <label htmlFor="signature">Authorized signature</label>
              <input
                id="signature"
                value={form.signature}
                onChange={(e) => updateField('signature', e.target.value)}
                placeholder="School Principal"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="generatedFileUrl">Generated file URL (optional)</label>
              <input
                id="generatedFileUrl"
                type="url"
                value={form.generatedFileUrl}
                onChange={(e) => updateField('generatedFileUrl', e.target.value)}
                placeholder="External PDF URL only; leave blank if downloading locally"
              />
            </div>
          </div>

          <div className="certificate-preview-wrapper" style={{ marginTop: 24, marginBottom: 24 }}>
            <p className="status-text" style={{ marginBottom: 12 }}>Preview</p>
            <div ref={previewRef}>
              <CertificateTemplate
                studentName={studentDisplayName}
                certificateType={form.certificateType}
                issueDate={form.issueDate}
                schoolName={form.schoolName}
                signature={form.signature}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" style={{ width: 'auto' }} type="button" onClick={handleDownload} disabled={generating}>
              {generating ? 'Generating...' : editingId ? 'Download PDF' : 'Preview & Download'}
            </button>
            {!editingId && (
              <button className="btn btn-primary" style={{ width: 'auto' }} disabled={saving}>
                {saving ? 'Saving...' : 'Issue Certificate'}
              </button>
            )}
          </div>
        </form>
      )}

      {error && <ErrorPanel message={error} onRetry={loadItems} />}
      {loading && <p className="status-text">Loading certificates...</p>}
      {!loading && !error && items.length === 0 && <EmptyState />}

      {!loading && !error && items.length > 0 && (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Type</th>
                <th>Template</th>
                <th>Issue date</th>
                <th>Issued by</th>
                <th>File</th>
                <th style={{ width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.studentName}</td>
                  <td>{item.certificateType}</td>
                  <td>{item.templateUsed}</td>
                  <td>{item.issueDate}</td>
                  <td>{item.issuedByName}</td>
                  <td>
                    {item.generatedFileUrl ? (
                      <a href={item.generatedFileUrl} target="_blank" rel="noreferrer">
                        View file
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-sm btn-secondary" onClick={() => handleView(item)}>
                        View
                      </button>
                      <button className="btn btn-sm btn-secondary" onClick={() => handleDownloadFromRow(item)}>
                        Download
                      </button>
                      <button className="btn btn-sm btn-danger" onClick={() => handleDelete(item.id)}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
