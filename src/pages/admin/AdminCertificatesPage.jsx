import { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { AlertIcon, EmptyIcon } from '../../components/Icons'
import { createCertificate, deleteCertificate, getCertificates } from '../../services/adminService'
import { getStudents } from '../../services/userService'

const CERTIFICATE_TYPES = ['Completion', 'Transcript', 'Recommendation']

const emptyForm = {
  studentId: '',
  certificateType: 'Completion',
  templateUsed: '',
  issueDate: '',
  generatedFileUrl: '',
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
  const [formError, setFormError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    loadItems()
  }, [])

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
    setFormError('')
  }

  const openNew = () => {
    resetForm()
    setShowForm(true)
  }

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
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
    setFormError('')

    const validationError = validate()
    if (validationError) {
      setFormError(validationError)
      return
    }

    setSaving(true)
    try {
      const created = await createCertificate({
        studentId: Number(form.studentId),
        certificateType: form.certificateType,
        templateUsed: form.templateUsed.trim(),
        issueDate: form.issueDate,
        generatedFileUrl: form.generatedFileUrl.trim(),
        issuedBy: user?.user_id,
      })
      setItems((prev) => [created, ...prev])
      resetForm()
      setShowForm(false)
    } catch (err) {
      setFormError(err.message || 'Failed to create certificate.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this certificate?')) return
    setError('')
    try {
      await deleteCertificate(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch (err) {
      setError(err.message || 'Failed to delete certificate.')
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
          {formError && <p className="error-text">{formError}</p>}
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
                  <option key={student.id} value={student.id}>
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
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="generatedFileUrl">Generated file URL</label>
              <input
                id="generatedFileUrl"
                type="url"
                value={form.generatedFileUrl}
                onChange={(e) => updateField('generatedFileUrl', e.target.value)}
                placeholder="https://example.com/certificates/file.pdf"
              />
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: 'auto' }} disabled={saving}>
            {saving ? 'Saving...' : 'Issue Certificate'}
          </button>
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
