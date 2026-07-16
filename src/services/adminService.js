import api from './api'

function formatDate(date) {
  if (!date) return ''
  return date.slice(0, 10)
}

function formatName(firstName, lastName) {
  const name = [firstName, lastName].filter(Boolean).join(' ').trim()
  return name || '—'
}

function mapAcademicYear(item) {
  return {
    id: item.academic_year_id,
    yearName: item.year_name,
    startDate: formatDate(item.start_date),
    endDate: formatDate(item.end_date),
    status: item.status || 'Active',
    semesters: item.Semesters || [],
  }
}

function mapSemester(item) {
  return {
    id: item.semester_id,
    academicYearId: item.academic_year_id,
    academicYearName: item.AcademicYear?.year_name || '—',
    semesterName: item.semester_name,
    startDate: formatDate(item.start_date),
    endDate: formatDate(item.end_date),
  }
}

function mapClass(item) {
  const teacher = item.HomeroomTeacher || {}
  return {
    id: item.class_id,
    className: item.class_name,
    academicYearId: item.academic_year_id,
    academicYearName: item.AcademicYear?.year_name || '—',
    semesterId: item.semester_id,
    semesterName: item.Semester?.semester_name || '—',
    roomNumber: item.room_number || '—',
    maxCapacity: item.max_capacity || '',
    homeroomTeacherId: item.homeroom_teacher_id || '',
    homeroomTeacherName: formatName(teacher.first_name, teacher.last_name),
  }
}

export const getAcademicYears = async () => {
  const { data } = await api.get('/academic-year/data')
  return (data.data || []).map(mapAcademicYear)
}

export const createAcademicYear = async (year) => {
  const { data } = await api.post('/academic-year/create', {
    year_name: year.yearName,
    start_date: year.startDate,
    end_date: year.endDate,
    status: year.status,
  })
  return mapAcademicYear(data.data)
}

export const updateAcademicYear = async (year) => {
  const { data } = await api.put(`/academic-year/update/${year.id}`, {
    year_name: year.yearName,
    start_date: year.startDate,
    end_date: year.endDate,
    status: year.status,
  })
  return mapAcademicYear(data.data)
}

export const deleteAcademicYear = async (id) => {
  await api.delete(`/academic-year/delete/${id}`)
}

export const getSemesters = async () => {
  const { data } = await api.get('/semester/data')
  return (data.data || []).map(mapSemester)
}

export const createSemester = async (semester) => {
  const { data } = await api.post('/semester/create', {
    academic_year_id: semester.academicYearId,
    semester_name: semester.semesterName,
    start_date: semester.startDate,
    end_date: semester.endDate,
  })
  return mapSemester(data.data)
}

export const updateSemester = async (semester) => {
  const { data } = await api.put(`/semester/update/${semester.id}`, {
    academic_year_id: semester.academicYearId,
    semester_name: semester.semesterName,
    start_date: semester.startDate,
    end_date: semester.endDate,
  })
  return mapSemester(data.data)
}

export const deleteSemester = async (id) => {
  await api.delete(`/semester/delete/${id}`)
}

export const getClassesAdmin = async () => {
  const { data } = await api.get('/class/data')
  return (data.data || []).map(mapClass)
}

export const createClass = async (cls) => {
  const { data } = await api.post('/class/create', {
    class_name: cls.className,
    academic_year_id: cls.academicYearId,
    semester_id: cls.semesterId,
    room_number: cls.roomNumber || undefined,
    max_capacity: cls.maxCapacity ? Number(cls.maxCapacity) : undefined,
    homeroom_teacher_id: cls.homeroomTeacherId || undefined,
  })
  return mapClass(data.data)
}

export const updateClass = async (cls) => {
  const payload = {
    class_name: cls.className,
    academic_year_id: cls.academicYearId,
    semester_id: cls.semesterId,
  }
  if (cls.roomNumber !== undefined) payload.room_number = cls.roomNumber || undefined
  if (cls.maxCapacity !== undefined) payload.max_capacity = cls.maxCapacity ? Number(cls.maxCapacity) : undefined
  if (cls.homeroomTeacherId !== undefined) payload.homeroom_teacher_id = cls.homeroomTeacherId || undefined

  const { data } = await api.put(`/class/update/${cls.id}`, payload)
  return mapClass(data.data)
}

export const deleteClass = async (id) => {
  await api.delete(`/class/delete/${id}`)
}

function mapFeeStructure(item) {
  return {
    id: item.fee_id,
    classId: item.class_id || '',
    className: item.Class?.class_name || 'All classes',
    semesterId: item.semester_id,
    semesterName: item.Semester?.semester_name || '—',
    feeName: item.fee_name,
    amount: item.amount,
    dueDate: formatDate(item.due_date),
  }
}

function mapInvoice(item) {
  const student = item.Student || {}
  const fee = item.FeeStructure || {}
  return {
    id: item.invoice_id,
    invoiceNumber: item.invoice_number,
    studentId: item.student_id,
    studentName: formatName(student.first_name, student.last_name),
    feeId: item.fee_id,
    feeName: fee.fee_name || '—',
    semesterId: item.semester_id,
    semesterName: item.Semester?.semester_name || '—',
    issueDate: formatDate(item.issue_date),
    dueDate: formatDate(item.due_date),
    totalAmount: parseFloat(item.total_amount) || 0,
    amountPaid: parseFloat(item.amount_paid) || 0,
    status: item.status || 'Unpaid',
  }
}

function mapPayment(item) {
  const invoice = item.Invoice || {}
  const user = item.User || {}
  return {
    id: item.payment_id,
    invoiceId: item.invoice_id,
    invoiceNumber: invoice.invoice_number || '—',
    paymentDate: formatDate(item.payment_date),
    amount: parseFloat(item.amount) || 0,
    paymentMethod: item.payment_method || '—',
    transactionReference: item.transaction_reference || '—',
    receiptUrl: item.receipt_url || '',
    recordedBy: item.recorded_by,
    recordedByName: user.username || '—',
    notes: item.notes || '',
  }
}

export const getFeeStructures = async () => {
  const { data } = await api.get('/fee_structure/data')
  return (data.data || []).map(mapFeeStructure)
}

export const createFeeStructure = async (fee) => {
  const { data } = await api.post('/fee_structure/create', {
    class_id: fee.classId || undefined,
    semester_id: fee.semesterId,
    fee_name: fee.feeName,
    amount: Number(fee.amount),
    due_date: fee.dueDate || undefined,
  })
  return mapFeeStructure(data.data)
}

export const updateFeeStructure = async (fee) => {
  const { data } = await api.put(`/fee_structure/update/${fee.id}`, {
    class_id: fee.classId || undefined,
    semester_id: fee.semesterId,
    fee_name: fee.feeName,
    amount: Number(fee.amount),
    due_date: fee.dueDate || undefined,
  })
  return mapFeeStructure(data.data)
}

export const deleteFeeStructure = async (id) => {
  await api.delete(`/fee_structure/delete/${id}`)
}

export const getInvoices = async () => {
  const { data } = await api.get('/invoice/data')
  return (data.data || []).map(mapInvoice)
}

export const createInvoice = async (invoice) => {
  const { data } = await api.post('/invoice/create', {
    invoice_number: invoice.invoiceNumber,
    student_id: invoice.studentId,
    fee_id: invoice.feeId,
    semester_id: invoice.semesterId,
    issue_date: invoice.issueDate,
    due_date: invoice.dueDate,
    total_amount: Number(invoice.totalAmount),
    amount_paid: invoice.amountPaid !== '' ? Number(invoice.amountPaid) : 0,
    status: invoice.status || undefined,
  })
  return mapInvoice(data.data)
}

export const updateInvoice = async (invoice) => {
  const { data } = await api.put(`/invoice/update/${invoice.id}`, {
    invoice_number: invoice.invoiceNumber,
    student_id: invoice.studentId,
    fee_id: invoice.feeId,
    semester_id: invoice.semesterId,
    issue_date: invoice.issueDate,
    due_date: invoice.dueDate,
    total_amount: Number(invoice.totalAmount),
    amount_paid: invoice.amountPaid !== '' ? Number(invoice.amountPaid) : 0,
    status: invoice.status || undefined,
  })
  return mapInvoice(data.data)
}

export const deleteInvoice = async (id) => {
  await api.delete(`/invoice/delete/${id}`)
}

export const getPayments = async () => {
  const { data } = await api.get('/payment/data')
  return (data.data || []).map(mapPayment)
}

export const createPayment = async (payment) => {
  const { data } = await api.post('/payment/create', {
    invoice_id: payment.invoiceId,
    payment_date: payment.paymentDate,
    amount: Number(payment.amount),
    payment_method: payment.paymentMethod,
    transaction_reference: payment.transactionReference || undefined,
    receipt_url: payment.receiptUrl || undefined,
    recorded_by: payment.recordedBy,
    notes: payment.notes || undefined,
  })
  return mapPayment(data.data)
}

export const updatePayment = async (payment) => {
  const { data } = await api.put(`/payment/update/${payment.id}`, {
    invoice_id: payment.invoiceId,
    payment_date: payment.paymentDate,
    amount: Number(payment.amount),
    payment_method: payment.paymentMethod,
    transaction_reference: payment.transactionReference || undefined,
    receipt_url: payment.receiptUrl || undefined,
    recorded_by: payment.recordedBy,
    notes: payment.notes || undefined,
  })
  return mapPayment(data.data)
}

export const deletePayment = async (id) => {
  await api.delete(`/payment/delete/${id}`)
}
