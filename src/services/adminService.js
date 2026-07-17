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

function mapCertificate(item) {
  const student = item.Student || {}
  const issuer = item.User || {}
  return {
    id: item.certificate_id,
    studentId: item.student_id,
    studentName: formatName(student.first_name, student.last_name),
    certificateType: item.certificate_type,
    templateUsed: item.template_used || '—',
    issueDate: formatDate(item.issue_date),
    generatedFileUrl: item.generated_file_url || '',
    issuedBy: item.issued_by,
    issuedByName: issuer.username || '—',
  }
}

export const getCertificates = async () => {
  const { data } = await api.get('/certificate/data')
  return (data.data || []).map(mapCertificate)
}

export const createCertificate = async (certificate) => {
  const { data } = await api.post('/certificate/create', {
    student_id: Number(certificate.studentId),
    certificate_type: certificate.certificateType,
    template_used: certificate.templateUsed || undefined,
    issue_date: certificate.issueDate,
    generated_file_url: certificate.generatedFileUrl || undefined,
    issued_by: Number(certificate.issuedBy),
  })
  return mapCertificate(data.data)
}

export const deleteCertificate = async (id) => {
  await api.delete(`/certificate/delete/${id}`)
}

function mapSubject(item) {
  const prerequisite = item.Prerequisite || {}
  return {
    id: item.subject_id,
    code: item.subject_code,
    name: item.subject_name,
    description: item.description || '',
    prerequisiteSubjectId: item.prerequisite_subject_id || '',
    prerequisiteSubjectName: prerequisite.subject_name || '—',
  }
}

export const getSubjects = async () => {
  const { data } = await api.get('/subject/data')
  return (data.data || []).map(mapSubject)
}

export const createSubject = async (subject) => {
  const { data } = await api.post('/subject/create', {
    subject_code: subject.code,
    subject_name: subject.name,
    description: subject.description || undefined,
    prerequisite_subject_id: subject.prerequisiteSubjectId ? Number(subject.prerequisiteSubjectId) : undefined,
  })
  return mapSubject(data.data)
}

export const updateSubject = async (subject) => {
  const { data } = await api.put(`/subject/update/${subject.id}`, {
    subject_code: subject.code,
    subject_name: subject.name,
    description: subject.description || undefined,
    prerequisite_subject_id: subject.prerequisiteSubjectId ? Number(subject.prerequisiteSubjectId) : undefined,
  })
  return mapSubject(data.data)
}

export const deleteSubject = async (id) => {
  await api.delete(`/subject/delete/${id}`)
}

function mapTimeSlot(item) {
  return {
    id: item.time_slot_id,
    dayOfWeek: item.day_of_week,
    startTime: item.start_time ? item.start_time.slice(0, 5) : '',
    endTime: item.end_time ? item.end_time.slice(0, 5) : '',
    label: `${item.day_of_week} ${item.start_time?.slice(0, 5)}-${item.end_time?.slice(0, 5)}`,
  }
}

export const getTimeSlots = async () => {
  const { data } = await api.get('/time-slot/data')
  return (data.data || []).map(mapTimeSlot)
}

export const createTimeSlot = async (timeSlot) => {
  const { data } = await api.post('/time-slot/create', {
    day_of_week: timeSlot.dayOfWeek,
    start_time: timeSlot.startTime,
    end_time: timeSlot.endTime,
  })
  return mapTimeSlot(data.data)
}

export const updateTimeSlot = async (timeSlot) => {
  const { data } = await api.put(`/time-slot/update/${timeSlot.id}`, {
    day_of_week: timeSlot.dayOfWeek,
    start_time: timeSlot.startTime,
    end_time: timeSlot.endTime,
  })
  return mapTimeSlot(data.data)
}

export const deleteTimeSlot = async (id) => {
  await api.delete(`/time-slot/delete/${id}`)
}

function mapSchedule(item) {
  const cls = item.Class || {}
  const subject = item.Subject || {}
  const teacher = item.Teacher || {}
  const timeSlot = item.TimeSlot || {}
  return {
    id: item.schedule_id,
    classId: item.class_id,
    className: cls.class_name || '—',
    subjectId: item.subject_id,
    subjectName: subject.subject_name || '—',
    teacherId: item.teacher_id,
    teacherName: formatName(teacher.first_name, teacher.last_name),
    timeSlotId: item.time_slot_id,
    timeSlotLabel: timeSlot.day_of_week
      ? `${timeSlot.day_of_week} ${timeSlot.start_time?.slice(0, 5)}-${timeSlot.end_time?.slice(0, 5)}`
      : '—',
    roomNumber: item.room_number || '—',
  }
}

export const getSchedules = async () => {
  const { data } = await api.get('/schedule/data')
  return (data.data || []).map(mapSchedule)
}

export const createSchedule = async (schedule) => {
  const { data } = await api.post('/schedule/create', {
    class_id: Number(schedule.classId),
    subject_id: Number(schedule.subjectId),
    teacher_id: Number(schedule.teacherId),
    time_slot_id: Number(schedule.timeSlotId),
    room_number: schedule.roomNumber || undefined,
  })
  return mapSchedule(data.data)
}

export const updateSchedule = async (schedule) => {
  const { data } = await api.put(`/schedule/update/${schedule.id}`, {
    class_id: Number(schedule.classId),
    subject_id: Number(schedule.subjectId),
    teacher_id: Number(schedule.teacherId),
    time_slot_id: Number(schedule.timeSlotId),
    room_number: schedule.roomNumber || undefined,
  })
  return mapSchedule(data.data)
}

export const deleteSchedule = async (id) => {
  await api.delete(`/schedule/delete/${id}`)
}

function mapClassEnrollment(item) {
  const student = item.Student || {}
  const cls = item.Class || {}
  return {
    id: item.enrollment_id,
    studentId: item.student_id,
    studentName: formatName(student.first_name, student.last_name),
    classId: item.class_id,
    className: cls.class_name || '—',
    enrollmentDate: formatDate(item.enrollment_date),
    status: item.status || 'Active',
  }
}

export const getClassEnrollments = async () => {
  const { data } = await api.get('/class-enrollment/data')
  return (data.data || []).map(mapClassEnrollment)
}

export const createClassEnrollment = async (enrollment) => {
  const { data } = await api.post('/class-enrollment/create', {
    student_id: Number(enrollment.studentId),
    class_id: Number(enrollment.classId),
    enrollment_date: enrollment.enrollmentDate,
    status: enrollment.status || 'Active',
  })
  return mapClassEnrollment(data.data)
}

export const updateClassEnrollment = async (enrollment) => {
  const { data } = await api.put(`/class-enrollment/update/${enrollment.id}`, {
    student_id: Number(enrollment.studentId),
    class_id: Number(enrollment.classId),
    enrollment_date: enrollment.enrollmentDate,
    status: enrollment.status || 'Active',
  })
  return mapClassEnrollment(data.data)
}

export const deleteClassEnrollment = async (id) => {
  await api.delete(`/class-enrollment/delete/${id}`)
}

const RESOURCE_TYPES = ['LessonPlan', 'Homework', 'Syllabus', 'Other']

function mapLessonResource(item) {
  const schedule = item.Schedule || {}
  const teacher = item.Teacher || {}
  return {
    id: item.resource_id,
    teacherId: item.teacher_id,
    teacherName: formatName(teacher.first_name, teacher.last_name),
    scheduleId: item.schedule_id || '',
    scheduleLabel: schedule.schedule_id ? `Schedule #${schedule.schedule_id}` : '—',
    title: item.title,
    description: item.description || '',
    resourceType: item.resource_type,
    fileUrl: item.file_url || '',
    uploadDate: formatDate(item.upload_date),
  }
}

export const getLessonResources = async () => {
  const { data } = await api.get('/lesson_resource/data')
  return (data.data || []).map(mapLessonResource)
}

export const createLessonResource = async (resource) => {
  const { data } = await api.post('/lesson_resource/create', {
    teacher_id: Number(resource.teacherId),
    schedule_id: resource.scheduleId ? Number(resource.scheduleId) : undefined,
    title: resource.title,
    description: resource.description || undefined,
    resource_type: resource.resourceType,
    file_url: resource.fileUrl || undefined,
    upload_date: resource.uploadDate || undefined,
  })
  return mapLessonResource(data.data)
}

export const updateLessonResource = async (resource) => {
  const { data } = await api.put(`/lesson_resource/update/${resource.id}`, {
    teacher_id: Number(resource.teacherId),
    schedule_id: resource.scheduleId ? Number(resource.scheduleId) : undefined,
    title: resource.title,
    description: resource.description || undefined,
    resource_type: resource.resourceType,
    file_url: resource.fileUrl || undefined,
    upload_date: resource.uploadDate || undefined,
  })
  return mapLessonResource(data.data)
}

export const deleteLessonResource = async (id) => {
  await api.delete(`/lesson_resource/delete/${id}`)
}

export { RESOURCE_TYPES }
