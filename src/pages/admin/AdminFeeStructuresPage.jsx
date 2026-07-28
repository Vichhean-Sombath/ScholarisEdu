import { useEffect, useState } from 'react'
import { AlertIcon, EmptyIcon } from '../../components/Icons'
import {
  createFeeStructure,
  deleteFeeStructure,
  getClassesAdmin,
  getFeeStructures,
  getSemesters,
  updateFeeStructure,
} from '../../services/adminService'
import { toastSuccess, toastError, confirmDelete } from '../../utils/sweetAlert'

const emptyForm = {
  feeName: '',
  amount: '',
  dueDate: '',
  semesterId: '',
  classId: '',
}

function EmptyState({ message = 'No fee structures found.' }) {
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

export default function AdminFeeStructuresPage() {
  const [items, setItems] = useState([])
  const [semesters, setSemesters] = useState([])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)

  useEffect(() => {
    loadItems()
  }, [])

  const loadItems = () => {
    setLoading(true)
    setError('')
    Promise.all([getFeeStructures(), getSemesters(), getClassesAdmin()])
      .then(([feesData, semestersData, classesData]) => {
        setItems(feesData)
        setSemesters(semestersData)
        setClasses(classesData)
      })
      .catch((err) => setError(err.message || 'Could not load fee structures. Please make sure the server is running and try again.'))
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
      feeName: item.feeName,
      amount: String(item.amount),
      dueDate: item.dueDate,
      semesterId: String(item.semesterId),
      classId: item.classId ? String(item.classId) : '',
    })
    setEditingId(item.id)
    setShowForm(true)
  }

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const validate = () => {
    if (!form.feeName.trim()) return 'Fee name is required.'
    if (!form.semesterId) return 'Semester is required.'
    if (form.amount === '' || Number.isNaN(Number(form.amount)) || Number(form.amount) < 0) {
      return 'Amount must be a non-negative number.'
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
        feeName: form.feeName.trim(),
        amount: form.amount,
        dueDate: form.dueDate,
        semesterId: Number(form.semesterId),
        classId: form.classId ? Number(form.classId) : '',
      }

      if (editingId) {
        await updateFeeStructure({ id: editingId, ...payload })
        toastSuccess('Fee structure updated successfully.')
      } else {
        await createFeeStructure(payload)
        toastSuccess('Fee structure created successfully.')
      }
      await loadItems()
      resetForm()
      setShowForm(false)
    } catch (err) {
      toastError(err.message || 'Failed to save fee structure.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    const confirmed = await confirmDelete('fee structure')
    if (!confirmed) return
    try {
      await deleteFeeStructure(id)
      setItems((prev) => prev.filter((i) => i.id !== id))
      toastSuccess('Fee structure deleted successfully.')
    } catch (err) {
      toastError(err.message || 'Failed to delete fee structure.')
    }
  }

  return (
    <div className="page-section">
      <div className="section-header">
        <h3>Fee Structures</h3>
        <button className="btn btn-primary" style={{ width: 'auto' }} onClick={() => (showForm ? setShowForm(false) : openNew())}>
          {showForm ? 'Cancel' : 'New Fee Structure'}
        </button>
      </div>

      {showForm && (
        <form className="panel-form" onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="feeName">Fee name *</label>
              <input
                id="feeName"
                value={form.feeName}
                onChange={(e) => updateField('feeName', e.target.value)}
                placeholder="e.g. Tuition Fee"
              />
            </div>
            <div className="form-group">
              <label htmlFor="semesterId">Semester *</label>
              <select
                id="semesterId"
                value={form.semesterId}
                onChange={(e) => updateField('semesterId', e.target.value)}
              >
                <option value="">Select a semester</option>
                {semesters.map((semester) => (
                  <option key={semester.id} value={semester.id}>
                    {semester.semesterName} ({semester.academicYearName})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="classId">Class (optional)</label>
              <select
                id="classId"
                value={form.classId}
                onChange={(e) => updateField('classId', e.target.value)}
              >
                <option value="">All classes</option>
                {classes.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.className}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="amount">Amount *</label>
              <input
                id="amount"
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => updateField('amount', e.target.value)}
                placeholder="e.g. 150.00"
              />
            </div>
            <div className="form-group">
              <label htmlFor="dueDate">Due date</label>
              <input id="dueDate" type="date" value={form.dueDate} onChange={(e) => updateField('dueDate', e.target.value)} />
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: 'auto' }} disabled={saving}>
            {saving ? 'Saving...' : editingId ? 'Update Fee Structure' : 'Save Fee Structure'}
          </button>
        </form>
      )}

      {error && <ErrorPanel message={error} onRetry={loadItems} />}
      {loading && <p className="status-text">Loading fee structures...</p>}
      {!loading && !error && items.length === 0 && <EmptyState />}

      {!loading && !error && items.length > 0 && (
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fee name</th>
                <th>Semester</th>
                <th>Class</th>
                <th>Amount</th>
                <th>Due date</th>
                <th style={{ width: 140 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.feeName}</td>
                  <td>{item.semesterName}</td>
                  <td>{item.className}</td>
                  <td>${Number(item.amount).toFixed(2)}</td>
                  <td>{item.dueDate || '—'}</td>
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
