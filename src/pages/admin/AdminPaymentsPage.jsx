import { useEffect, useState } from 'react'
import { AlertIcon, EmptyIcon } from '../../components/Icons'
import { useAuth } from '../../context/AuthContext'
import {
  createPayment,
  deletePayment,
  getInvoices,
  getPayments,
  updatePayment,
} from '../../services/adminService'

const PAYMENT_METHODS = [
  { value: 'stripe', label: 'Stripe' },
  { value: 'bakongkhqr', label: 'Bakong KHQR' },
]

const emptyForm = {
  invoiceId: '',
  paymentDate: '',
  amount: '',
  paymentMethod: 'stripe',
  transactionReference: '',
  receiptUrl: '',
  notes: '',
}

function EmptyState({ message = 'No payments found.' }) {
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

export default function AdminPaymentsPage() {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [formError, setFormError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = () => {
    setLoading(true)
    setError('')
    Promise.all([getPayments(), getInvoices()])
      .then(([paymentsData, invoicesData]) => {
        setItems(paymentsData)
        setInvoices(invoicesData)
      })
      .catch((err) => setError(err.message || 'Could not load payments. Please make sure the server is running and try again.'))
      .finally(() => setLoading(false))
  }

  const resetForm = () => {
    setForm(emptyForm)
    setEditingId(null)
    setFormError('')
  }

  const openNew = () => {
    resetForm()
    setShowForm(true)
  }

  const openEdit = (item) => {
    setForm({
      invoiceId: String(item.invoiceId),
      paymentDate: item.paymentDate,
      amount: String(item.amount),
      paymentMethod: item.paymentMethod === 'Stripe' ? 'stripe' : 'bakongkhqr',
      transactionReference: item.transactionReference === '—' ? '' : item.transactionReference,
      receiptUrl: item.receiptUrl,
      notes: item.notes,
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const validate = () => {
    if (!form.invoiceId) return 'Invoice is required.'
    if (!form.paymentDate) return 'Payment date is required.'
    if (form.amount === '' || Number.isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      return 'Amount must be a positive number.'
    }
    if (!form.paymentMethod) return 'Payment method is required.'
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
      const payload = {
        invoiceId: Number(form.invoiceId),
        paymentDate: form.paymentDate,
        amount: form.amount,
        paymentMethod: form.paymentMethod,
        transactionReference: form.transactionReference.trim() || undefined,
        receiptUrl: form.receiptUrl.trim() || undefined,
        notes: form.notes.trim() || undefined,
        recordedBy: editingId ? undefined : user?.user_id,
      }

      if (editingId) {
        const updated = await updatePayment({ id: editingId, ...payload })
        setItems((prev) => prev.map((i) => (i.id === editingId ? updated : i)))
      } else {
        const created = await createPayment(payload)
        setItems((prev) => [...prev, created])
      }
      resetForm()
      setShowForm(false)
    } catch (err) {
      setFormError(err.message || 'Failed to save payment.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) return
    setError('')
    try {
      await deletePayment(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch (err) {
      setError(err.message || 'Failed to delete payment.')
    }
  }

  return (
    <div className="page-section">
      <div className="section-header">
        <h3>Payments</h3>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => (showForm ? setShowForm(false) : openNew())}>
          {showForm ? 'Cancel' : 'New Payment'}
        </button>
      </div>

      {showForm && (
        <form className="panel-form" onSubmit={handleSubmit}>
          {formError && <p className="error-text">{formError}</p>}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="invoiceId">Invoice *</label>
              <select id="invoiceId" value={form.invoiceId} onChange={(e) => updateField('invoiceId', e.target.value)}>
                <option value="">Select an invoice</option>
                {invoices.map((invoice) => (
                  <option key={invoice.id} value={invoice.id}>
                    {invoice.invoiceNumber} — {invoice.studentName} (${invoice.totalAmount.toFixed(2)})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="paymentMethod">Payment method *</label>
              <select
                id="paymentMethod"
                value={form.paymentMethod}
                onChange={(e) => updateField('paymentMethod', e.target.value)}
              >
                {PAYMENT_METHODS.map((method) => (
                  <option key={method.value} value={method.value}>
                    {method.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="paymentDate">Payment date *</label>
              <input
                id="paymentDate"
                type="date"
                value={form.paymentDate}
                onChange={(e) => updateField('paymentDate', e.target.value)}
              />
            </div>
            <div className="form-group">
              <label htmlFor="amount">Amount *</label>
              <input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={form.amount}
                onChange={(e) => updateField('amount', e.target.value)}
                placeholder="e.g. 150.00"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="transactionReference">Transaction reference</label>
              <input
                id="transactionReference"
                value={form.transactionReference}
                onChange={(e) => updateField('transactionReference', e.target.value)}
                placeholder="e.g. pi_1234567890"
              />
            </div>
            <div className="form-group">
              <label htmlFor="receiptUrl">Receipt URL</label>
              <input
                id="receiptUrl"
                value={form.receiptUrl}
                onChange={(e) => updateField('receiptUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="notes">Notes</label>
              <input
                id="notes"
                value={form.notes}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Optional notes"
              />
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: 'auto' }} disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update Payment' : 'Save Payment'}
          </button>
        </form>
      )}

      {error && <ErrorPanel message={error} onRetry={loadItems} />}
      {loading && <p className="status-text">Loading payments...</p>}
      {!loading && !error && items.length === 0 && <EmptyState />}

      {!loading && !error && items.length > 0 && (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Payment date</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Transaction reference</th>
                <th>Recorded by</th>
                <th style={{ width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.invoiceNumber}</td>
                  <td>{item.paymentDate}</td>
                  <td>${item.amount.toFixed(2)}</td>
                  <td>{item.paymentMethod}</td>
                  <td>{item.transactionReference}</td>
                  <td>{item.recordedByName}</td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn btn-sm btn-secondary" onClick={() => openEdit(item)}>
                        Edit
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
