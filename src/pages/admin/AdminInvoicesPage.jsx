import { useEffect, useState } from 'react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { AlertIcon, EmptyIcon } from '../../components/Icons'
import {
  createInvoice,
  deleteInvoice,
  getFeeStructures,
  getInvoices,
  getSemesters,
  updateInvoice,
} from '../../services/adminService'
import { getStudents } from '../../services/userService'
import { toastSuccess, toastError, confirmDelete } from '../../utils/sweetAlert'

const emptyForm = {
  invoiceNumber: '',
  studentId: '',
  feeId: '',
  semesterId: '',
  issueDate: '',
  dueDate: '',
  totalAmount: '',
  amountPaid: '',
  status: '',
}

function EmptyState({ message = 'No invoices found.' }) {
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

function formatCurrency(value) {
  return `$${Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function InvoicePrintView({ invoice, onClose, onDownload }) {
  return (
    <div className="invoice-print-overlay">
      <div className="invoice-print-modal">
        <div className="invoice-print-actions no-print">
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={onDownload}>
            Download PDF
          </button>
          <button className="btn btn-secondary" style={{ width: 'auto' }} onClick={onClose}>
            Close
          </button>
        </div>

        <div id="invoice-print-content" className="invoice-print-content">
          <header className="invoice-print-header">
            <div>
              <h2>INVOICE</h2>
              <p className="invoice-print-meta">{invoice.invoiceNumber}</p>
            </div>
            <div className="invoice-print-brand">
              <img className="brand-logo" src="/logo.webp" alt="Scholaris" />
              <div>
                <strong>Scholaris</strong>
                <br />
                <span className="invoice-print-meta">School Management System</span>
              </div>
            </div>
          </header>

          <section className="invoice-print-info">
            <div className="invoice-print-block">
              <strong>Bill To</strong>
              <p>{invoice.studentName}</p>
            </div>
            <div className="invoice-print-block invoice-print-dates">
              <div>
                <span className="invoice-print-label">Issue Date:</span> {invoice.issueDate}
              </div>
              <div>
                <span className="invoice-print-label">Due Date:</span> {invoice.dueDate}
              </div>
              <div>
                <span className="invoice-print-label">Semester:</span> {invoice.semesterName}
              </div>
            </div>
          </section>

          <table className="invoice-print-table">
            <thead>
              <tr>
                <th>Description</th>
                <th style={{ textAlign: 'right' }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{invoice.feeName}</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(invoice.totalAmount)}</td>
              </tr>
            </tbody>
          </table>

          <div className="invoice-print-totals">
            <div className="invoice-print-total-row">
              <span>Total</span>
              <strong>{formatCurrency(invoice.totalAmount)}</strong>
            </div>
            <div className="invoice-print-total-row">
              <span>Amount Paid</span>
              <strong>{formatCurrency(invoice.amountPaid)}</strong>
            </div>
            <div className="invoice-print-total-row invoice-print-balance">
              <span>Balance Due</span>
              <strong>{formatCurrency(invoice.totalAmount - invoice.amountPaid)}</strong>
            </div>
            <div className="invoice-print-status">
              Status: <strong>{invoice.status}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AdminInvoicesPage() {
  const [items, setItems] = useState([])
  const [students, setStudents] = useState([])
  const [fees, setFees] = useState([])
  const [semesters, setSemesters] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [printInvoice, setPrintInvoice] = useState(null)

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = () => {
    setLoading(true)
    setError('')
    Promise.all([getInvoices(), getStudents(), getFeeStructures(), getSemesters()])
      .then(([invoicesData, studentsData, feesData, semestersData]) => {
        setItems(invoicesData)
        setStudents(studentsData)
        setFees(feesData)
        setSemesters(semestersData)
      })
      .catch((err) => setError(err.message || 'Could not load invoices. Please make sure the server is running and try again.'))
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

  const openEdit = (item) => {
    setForm({
      invoiceNumber: item.invoiceNumber,
      studentId: String(item.studentId),
      feeId: String(item.feeId),
      semesterId: String(item.semesterId),
      issueDate: item.issueDate,
      dueDate: item.dueDate,
      totalAmount: String(item.totalAmount),
      amountPaid: String(item.amountPaid),
      status: item.status,
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const validate = () => {
    if (!form.invoiceNumber.trim()) return 'Invoice number is required.'
    if (!form.studentId) return 'Student is required.'
    if (!form.feeId) return 'Fee structure is required.'
    if (!form.semesterId) return 'Semester is required.'
    if (!form.issueDate) return 'Issue date is required.'
    if (!form.dueDate) return 'Due date is required.'
    if (form.totalAmount === '' || Number.isNaN(Number(form.totalAmount)) || Number(form.totalAmount) < 0) {
      return 'Total amount must be a non-negative number.'
    }
    if (form.amountPaid !== '' && (Number.isNaN(Number(form.amountPaid)) || Number(form.amountPaid) < 0)) {
      return 'Amount paid must be a non-negative number.'
    }
    return ''
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const validationError = validate()
    if (validationError) {
      toastError(validationError)
      return
    }

    setSaving(true)
    try {
      const payload = {
        invoiceNumber: form.invoiceNumber.trim(),
        studentId: Number(form.studentId),
        feeId: Number(form.feeId),
        semesterId: Number(form.semesterId),
        issueDate: form.issueDate,
        dueDate: form.dueDate,
        totalAmount: form.totalAmount,
        amountPaid: form.amountPaid,
        status: form.status || undefined,
      }

      if (editingId) {
        const updated = await updateInvoice({ id: editingId, ...payload })
        setItems((prev) => prev.map((i) => (i.id === editingId ? updated : i)))
        toastSuccess('Invoice updated successfully.')
      } else {
        const created = await createInvoice(payload)
        setItems((prev) => [...prev, created])
        toastSuccess('Invoice created successfully.')
      }
      resetForm()
      setShowForm(false)
    } catch (err) {
      toastError(err.message || 'Failed to save invoice.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = await confirmDelete('invoice')
    if (!confirmed) return
    try {
      await deleteInvoice(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
      toastSuccess('Invoice deleted successfully.')
    } catch (err) {
      toastError(err.message || 'Failed to delete invoice.')
    }
  }

  const handleDownloadInvoicePdf = async (invoice) => {
    const element = document.getElementById('invoice-print-content')
    if (!element) return
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
    })
    const imgData = canvas.toDataURL('image/png')
    const pdf = new jsPDF('p', 'mm', 'a4')
    const pageWidth = pdf.internal.pageSize.getWidth()
    const margin = 14
    const imgWidth = pageWidth - margin * 2
    const imgHeight = (canvas.height * imgWidth) / canvas.width
    pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight)
    pdf.save(`${invoice.invoiceNumber || 'invoice'}.pdf`)
  }

  return (
    <div className="page-section">
      <div className="section-header">
        <h3>Invoices</h3>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => (showForm ? setShowForm(false) : openNew())}>
          {showForm ? 'Cancel' : 'New Invoice'}
        </button>
      </div>

      {showForm && (
        <form className="panel-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="invoiceNumber">Invoice number *</label>
              <input
                id="invoiceNumber"
                value={form.invoiceNumber}
                onChange={(e) => updateField('invoiceNumber', e.target.value)}
                placeholder="e.g. INV-0001"
              />
            </div>
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
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="feeId">Fee structure *</label>
              <select id="feeId" value={form.feeId} onChange={(e) => updateField('feeId', e.target.value)}>
                <option value="">Select a fee structure</option>
                {fees.map((fee) => (
                  <option key={fee.id} value={fee.id}>
                    {fee.feeName} - ${Number(fee.amount).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="semesterId">Semester *</label>
              <select id="semesterId" value={form.semesterId} onChange={(e) => updateField('semesterId', e.target.value)}>
                <option value="">Select a semester</option>
                {semesters.map((semester) => (
                  <option key={semester.id} value={semester.id}>
                    {semester.semesterName} ({semester.academicYearName})
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
              <label htmlFor="dueDate">Due date *</label>
              <input id="dueDate" type="date" value={form.dueDate} onChange={(e) => updateField('dueDate', e.target.value)} />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="totalAmount">Total amount *</label>
              <input
                id="totalAmount"
                type="number"
                min="0"
                step="0.01"
                value={form.totalAmount}
                onChange={(e) => updateField('totalAmount', e.target.value)}
                placeholder="e.g. 150.00"
              />
            </div>
            <div className="form-group">
              <label htmlFor="amountPaid">Amount paid</label>
              <input
                id="amountPaid"
                type="number"
                min="0"
                step="0.01"
                value={form.amountPaid}
                onChange={(e) => updateField('amountPaid', e.target.value)}
                placeholder="e.g. 0.00"
              />
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: 'auto' }} disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update Invoice' : 'Save Invoice'}
          </button>
        </form>
      )}

      {error && <ErrorPanel message={error} onRetry={loadItems} />}
      {loading && <p className="status-text">Loading invoices...</p>}
      {!loading && !error && items.length === 0 && <EmptyState />}

      {!loading && !error && items.length > 0 && (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice #</th>
                <th>Student</th>
                <th>Fee</th>
                <th>Semester</th>
                <th>Issue date</th>
                <th>Due date</th>
                <th>Total</th>
                <th>Paid</th>
                <th>Status</th>
                <th style={{ width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.invoiceNumber}</td>
                  <td>{item.studentName}</td>
                  <td>{item.feeName}</td>
                  <td>{item.semesterName}</td>
                  <td>{item.issueDate}</td>
                  <td>{item.dueDate}</td>
                  <td>${item.totalAmount.toFixed(2)}</td>
                  <td>${item.amountPaid.toFixed(2)}</td>
                  <td>
                    <span className={`pill ${item.status === 'Paid' ? 'active' : item.status === 'Partial' ? 'draft' : ''}`}>
                      {item.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-sm btn-secondary" onClick={() => openEdit(item)}>
                        Edit
                      </button>
                      <button className="btn btn-sm btn-secondary" onClick={() => setPrintInvoice(item)}>
                        Print
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

      {printInvoice && (
        <InvoicePrintView
          invoice={printInvoice}
          onClose={() => setPrintInvoice(null)}
          onDownload={() => handleDownloadInvoicePdf(printInvoice)}
        />
      )}
    </div>
  )
}
