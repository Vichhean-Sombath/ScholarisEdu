import api from './api'

export const getStudentSummary = async () => {
  const { data } = await api.get('/student/me/summary')
  return data.data
}

export const getStudentClasses = async () => {
  const { data } = await api.get('/student/me/classes')
  return data.data
}

export const getStudentSchedule = async () => {
  const { data } = await api.get('/student/me/schedule')
  return data.data
}

export const getStudentGrades = async () => {
  const { data } = await api.get('/student/me/grades')
  return data.data
}

export const getStudentAttendance = async () => {
  const { data } = await api.get('/student/me/attendance')
  return data.data
}

export const getStudentInvoices = async () => {
  const { data } = await api.get('/student/me/invoices')
  return data.data
}

export const getStudentCertificates = async () => {
  const { data } = await api.get('/student/me/certificates')
  return data.data
}

export const getStudentResources = async () => {
  const { data } = await api.get('/student/me/resources')
  return data.data
}

export const getStudentProfile = async () => {
  const { data } = await api.get('/student/me/profile')
  return data.data
}

export const changePassword = async ({ currentPassword, newPassword }) => {
  const { data } = await api.put('/user/change-password', {
    currentPassword,
    newPassword,
  })
  return data.data
}

export const payInvoiceWithStripe = async (invoiceId, { successUrl, cancelUrl } = {}) => {
  const { data } = await api.post('/payment/stripe/checkout', {
    invoice_id: invoiceId,
    success_url: successUrl,
    cancel_url: cancelUrl,
  })
  return data.data
}

export const verifyStripePayment = async (sessionId) => {
  const { data } = await api.post('/payment/stripe/verify', { session_id: sessionId })
  return data.data
}

export const payInvoiceWithBakong = async (invoiceId) => {
  const { data } = await api.post('/payment/bakong/qr', { invoice_id: invoiceId })
  return data.data
}

export const verifyBakongPayment = async (md5) => {
  const { data } = await api.post('/payment/bakong/verify', { md5 })
  return data.data
}

export const recordStudentPayment = async (invoiceId) => {
  const { data } = await api.post('/payment/stripe/record', { invoice_id: invoiceId })
  return data.data
}
