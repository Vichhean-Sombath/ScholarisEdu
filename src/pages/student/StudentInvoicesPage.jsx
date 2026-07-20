import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { getStudentInvoices, payInvoiceWithStripe, payInvoiceWithBakong, verifyStripePayment } from '../../services/studentService'
import {
  PageHeader,
  DashboardSkeleton,
  ErrorPanel,
  KpiCard,
  TablePanel,
  DataTable,
  EmptyState,
  statusPillClass,
  formatCurrency,
  formatShortDate,
  Icon,
} from './studentUtils'

function BakongQrModal({ open, onClose, qrString, invoiceNumber, amount }) {
  if (!open) return null

  const handleCopy = () => {
    navigator.clipboard.writeText(qrString).then(() => alert('KHQR code copied to clipboard'))
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: 24,
          maxWidth: 400,
          width: '90%',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 8px' }}>Pay with Bakong</h3>
        <p style={{ margin: '0 0 16px', color: '#555' }}>
          Invoice {invoiceNumber} · {formatCurrency(amount)}
        </p>

        <div
          style={{
            display: 'inline-flex',
            padding: 16,
            background: '#f8fafc',
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <QRCodeSVG value={qrString} size={200} />
        </div>

        <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16 }}>
          Scan this KHQR code with your Bakong app to complete payment.
        </p>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
          <button className="btn btn-secondary" onClick={handleCopy}>
            Copy KHQR
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

export default function StudentInvoicesPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [invoiceData, setInvoiceData] = useState({ summary: {}, invoices: [] })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [payingInvoiceId, setPayingInvoiceId] = useState(null)
  const [verifyingSessionId, setVerifyingSessionId] = useState(null)
  const [bakongModal, setBakongModal] = useState({ open: false, qrString: '', invoiceNumber: '', amount: 0 })

  const loadInvoices = () => {
    setLoading(true)
    setError('')
    getStudentInvoices()
      .then((data) => setInvoiceData(data))
      .catch(() => setError('Could not load invoices. Please make sure the server is running and try again.'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadInvoices()
  }, [])

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    const stripeSuccess = searchParams.get('stripe_success')
    if (!sessionId || stripeSuccess !== 'true' || verifyingSessionId === sessionId) return

    setVerifyingSessionId(sessionId)
    setPayingInvoiceId('verifying')
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('session_id')
    nextParams.delete('stripe_success')
    setSearchParams(nextParams, { replace: true })

    verifyStripePayment(sessionId)
      .then(() => {
        loadInvoices()
      })
      .catch((err) => {
        setError(err.response?.data?.message || 'Could not verify Stripe payment.')
      })
      .finally(() => setPayingInvoiceId(null))
  }, [searchParams, setSearchParams, verifyingSessionId])

  const handleStripePay = async (invoice) => {
    setPayingInvoiceId(invoice.invoiceId)
    try {
      const returnUrl = `${window.location.origin}/student/invoices?stripe_success=true`
      const result = await payInvoiceWithStripe(invoice.invoiceId, {
        successUrl: `${returnUrl}&session_id={CHECKOUT_SESSION_ID}`,
        cancelUrl: `${window.location.origin}/student/invoices`,
      })
      if (result?.url) {
        window.location.href = result.url
      } else {
        setError('Stripe checkout did not return a payment URL.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start Stripe checkout.')
    } finally {
      setPayingInvoiceId(null)
    }
  }

  const handleBakongPay = async (invoice) => {
    setPayingInvoiceId(invoice.invoiceId)
    try {
      const result = await payInvoiceWithBakong(invoice.invoiceId)
      const qrString = result?.qrString || result?.qr_string
      if (qrString) {
        setBakongModal({
          open: true,
          qrString,
          invoiceNumber: invoice.invoiceNumber,
          amount: invoice.balanceDue || invoice.totalAmount || 0,
        })
      } else {
        setError('Bakong QR generation did not return a code.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not generate Bakong QR.')
    } finally {
      setPayingInvoiceId(null)
    }
  }

  const { summary, invoices } = invoiceData
  const unpaidInvoices = invoices.filter((inv) => String(inv.status).toLowerCase() !== 'paid')

  return (
    <div className="page-section">
      <PageHeader title="My Invoices" subtitle="Invoices, payments, and outstanding balances." />

      <BakongQrModal
        open={bakongModal.open}
        onClose={() => setBakongModal({ ...bakongModal, open: false })}
        qrString={bakongModal.qrString}
        invoiceNumber={bakongModal.invoiceNumber}
        amount={bakongModal.amount}
      />

      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <ErrorPanel message={error} onRetry={loadInvoices} />
      ) : (
        <>
          <div className="stats-grid">
            <KpiCard icon={Icon.money()} value={summary.totalBilledFormatted || '$0.00'} label="Total Billed" color="#1e3a5f" />
            <KpiCard icon={Icon.money()} value={summary.totalPaidFormatted || '$0.00'} label="Total Paid" color="#10b981" />
            <KpiCard icon={Icon.money()} value={summary.outstandingBalanceFormatted || '$0.00'} label="Outstanding" color="#ef4444" />
            <KpiCard icon={Icon.money()} value={summary.invoiceCount ?? 0} label="Invoices" color="#4a90d9" />
          </div>

          <div className="dashboard-row" style={{ flexDirection: 'column' }}>
            <TablePanel title="Invoices">
              {unpaidInvoices.length === 0 ? (
                <EmptyState message="No outstanding invoices." />
              ) : (
                <div className="data-table-wrapper">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Invoice</th>
                        <th>Fee</th>
                        <th>Semester</th>
                        <th>Issue Date</th>
                        <th>Due Date</th>
                        <th>Total</th>
                        <th>Paid</th>
                        <th>Balance</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {unpaidInvoices.map((row) => (
                        <tr key={row.invoiceId}>
                          <td>{row.invoiceNumber}</td>
                          <td>{row.feeName}</td>
                          <td>{row.semesterName}</td>
                          <td>{formatShortDate(row.issueDate)}</td>
                          <td>{formatShortDate(row.dueDate)}</td>
                          <td>{formatCurrency(row.totalAmount)}</td>
                          <td>{formatCurrency(row.amountPaid)}</td>
                          <td>{formatCurrency(row.balanceDue)}</td>
                          <td>
                            <span className={statusPillClass(row.status)}>{row.status}</span>
                          </td>
                          <td>
                            {row.balanceDue > 0 && String(row.status).toLowerCase() !== 'paid' ? (
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                  className="btn btn-primary"
                                  style={{ width: 'auto', padding: '4px 10px', fontSize: 12 }}
                                  onClick={() => handleStripePay(row)}
                                  disabled={payingInvoiceId === row.invoiceId || payingInvoiceId === 'verifying'}
                                >
                                  {payingInvoiceId === row.invoiceId ? 'Processing...' : 'Pay with Stripe'}
                                </button>
                                <button
                                  className="btn btn-secondary"
                                  style={{ width: 'auto', padding: '4px 10px', fontSize: 12 }}
                                  onClick={() => handleBakongPay(row)}
                                  disabled={payingInvoiceId === row.invoiceId || payingInvoiceId === 'verifying'}
                                >
                                  {payingInvoiceId === row.invoiceId ? 'Processing...' : 'Pay with Bakong'}
                                </button>
                              </div>
                            ) : (
                              <span style={{ fontSize: 12, color: '#10b981', fontWeight: 500 }}>Paid</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TablePanel>

            {invoices.some((inv) => inv.payments.length > 0) && (
              <TablePanel title="Payment History">
                <DataTable
                  headers={['Invoice', 'Date', 'Amount', 'Method', 'Reference']}
                  rows={invoices.flatMap((inv) =>
                    inv.payments.map((p) => ({ ...p, invoiceNumber: inv.invoiceNumber }))
                  )}
                  emptyMessage="No payments recorded."
                  renderRow={(row) => (
                    <tr key={row.paymentId}>
                      <td>{row.invoiceNumber}</td>
                      <td>{formatShortDate(row.paymentDate)}</td>
                      <td>{formatCurrency(row.amount)}</td>
                      <td>{row.method}</td>
                      <td>{row.transactionReference || '—'}</td>
                    </tr>
                  )}
                />
              </TablePanel>
            )}
          </div>
        </>
      )}
    </div>
  )
}
