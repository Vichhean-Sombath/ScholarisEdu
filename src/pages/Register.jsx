import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
)

const MailIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
)

const LockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
)

const EyeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
)

const EyeOffIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
)

const CalendarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/></svg>
)

const PhoneIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
)

const MapPinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
)

const GraduationCapIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6"/><path d="M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
)

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
)

function passwordStrength(password) {
  if (!password) return { score: 0, label: '' }
  let score = 0
  if (password.length >= 8) score += 1
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1
  if (/\d/.test(password)) score += 1
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1
  const labels = ['Weak', 'Fair', 'Good', 'Strong']
  const colors = ['#ef4444', '#f59e0b', '#4a90d9', '#16a34a']
  return { score, label: labels[score - 1] || 'Weak', color: colors[score - 1] || '#ef4444' }
}

function todayInputValue() {
  return new Date().toISOString().split('T')[0]
}

const Field = ({ id, label, children, error, required }) => (
  <div className={`form-group ${error ? 'has-error' : ''}`}>
    <label htmlFor={id}>
      {label}
      {required && <span className="required-mark">*</span>}
    </label>
    {children}
    {error && <span className="error-text">{error}</span>}
  </div>
)

const Section = ({ title, icon: Icon }) => (
  <div className="form-section">
    {Icon && <Icon />}
    <span>{title}</span>
  </div>
)

export default function Register() {
  const navigate = useNavigate()
  const { register } = useAuth()
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    gender: '',
    dob: '',
    contact_number: '',
    address: '',
    enrollment_date: todayInputValue(),
    role: 'Student',
  })

  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const strength = useMemo(() => passwordStrength(form.password), [form.password])

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const validate = () => {
    const next = {}
    const { username, email, password, confirmPassword, first_name, last_name, enrollment_date } = form

    if (!username.trim()) next.username = 'Username is required'
    else if (username.length > 50) next.username = 'Username must not exceed 50 characters'

    if (!email.trim()) next.email = 'Email is required'
    else if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Enter a valid email'

    if (!password) next.password = 'Password is required'
    else if (password.length < 8) next.password = 'Password must be at least 8 characters'
    else if (!/[A-Z]/.test(password)) next.password = 'Password needs an uppercase letter'
    else if (!/[a-z]/.test(password)) next.password = 'Password needs a lowercase letter'
    else if (!/\d/.test(password)) next.password = 'Password needs a number'
    else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) next.password = 'Password needs a special character'

    if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match'

    if (!first_name.trim()) next.first_name = 'First name is required'
    if (!last_name.trim()) next.last_name = 'Last name is required'
    if (!enrollment_date) next.enrollment_date = 'Enrollment date is required'

    const phoneDigits = form.contact_number.toString().replace(/\D/g, '')
    if (form.contact_number && !/^\d{9,10}$/.test(phoneDigits)) {
      next.contact_number = 'Phone number must be 9–10 digits'
    }

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    if (!validate()) return

    if (form.confirmPassword !== form.password) {
      setErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match' }))
      return
    }

    const { confirmPassword, role, ...payload } = form

    setSubmitting(true)
    try {
      await register({ ...payload, role: 'Student' })
      navigate('/')
    } catch (err) {
      const errorsList = err.response?.data?.errors
      const message = err.response?.data?.message || err.message || 'Registration failed. Please try again.'
      setApiError(errorsList && errorsList.length ? errorsList.join('\n') : message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page register-page">
      <div className="auth-card">
        <div className="brand">
          <div className="brand-logo">S</div>
          <div className="brand-name">Scholaris</div>
        </div>

        <h1>Create account</h1>
        <p className="subtitle">Join Scholaris to manage your academic journey.</p>

        {apiError && (
          <div className="error-box">
            {apiError.split('\n').map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <Section title="Account information" icon={LockIcon} />

          <div className="form-row">
            <Field id="username" label="Username" error={errors.username} required>
              <div className="input-with-icon">
                <span className="input-icon"><UserIcon /></span>
                <input
                  id="username"
                  type="text"
                  value={form.username}
                  onChange={(e) => update('username', e.target.value)}
                  placeholder="jane_doe"
                  autoFocus
                />
              </div>
            </Field>

            <Field id="email" label="Email" error={errors.email} required>
              <div className="input-with-icon">
                <span className="input-icon"><MailIcon /></span>
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  placeholder="you@school.edu"
                />
              </div>
            </Field>
          </div>

          <div className="form-row">
            <Field id="password" label="Password" error={errors.password} required>
              <div className="input-with-icon input-with-action">
                <span className="input-icon"><LockIcon /></span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => update('password', e.target.value)}
                  placeholder="At least 8 chars, A-Z, a-z, 0-9, special"
                />
                <button
                  type="button"
                  className="input-action"
                  onClick={() => setShowPassword((s) => !s)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
              {form.password && !errors.password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    {[1, 2, 3, 4].map((i) => (
                      <span
                        key={i}
                        className={`strength-segment ${strength.score >= i ? 'filled' : ''}`}
                        style={{ '--strength-color': strength.color }}
                      />
                    ))}
                  </div>
                  <span className="strength-label" style={{ color: strength.color }}>
                    {strength.label}
                  </span>
                </div>
              )}
            </Field>

            <Field id="confirmPassword" label="Confirm password" error={errors.confirmPassword} required>
              <div className="input-with-icon input-with-action">
                <span className="input-icon"><LockIcon /></span>
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => update('confirmPassword', e.target.value)}
                  placeholder="Re-enter password"
                />
                <button
                  type="button"
                  className="input-action"
                  onClick={() => setShowConfirm((s) => !s)}
                  tabIndex={-1}
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </Field>
          </div>

          <Section title="Personal details" icon={UsersIcon} />

          <div className="form-row">
            <Field id="first_name" label="First name" error={errors.first_name} required>
              <div className="input-with-icon">
                <span className="input-icon"><UserIcon /></span>
                <input
                  id="first_name"
                  type="text"
                  value={form.first_name}
                  onChange={(e) => update('first_name', e.target.value)}
                  placeholder="Jane"
                />
              </div>
            </Field>

            <Field id="last_name" label="Last name" error={errors.last_name} required>
              <div className="input-with-icon">
                <span className="input-icon"><UserIcon /></span>
                <input
                  id="last_name"
                  type="text"
                  value={form.last_name}
                  onChange={(e) => update('last_name', e.target.value)}
                  placeholder="Doe"
                />
              </div>
            </Field>
          </div>

          <div className="form-row">
            <Field id="gender" label="Gender">
              <div className="select-wrapper">
                <select id="gender" value={form.gender} onChange={(e) => update('gender', e.target.value)}>
                  <option value="">Select…</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </Field>

            <Field id="dob" label="Date of birth">
              <div className="input-with-icon">
                <span className="input-icon"><CalendarIcon /></span>
                <input
                  id="dob"
                  type="date"
                  value={form.dob}
                  onChange={(e) => update('dob', e.target.value)}
                />
              </div>
            </Field>
          </div>

          <div className="form-row">
            <Field id="contact_number" label="Contact number" error={errors.contact_number}>
              <div className="input-with-icon">
                <span className="input-icon"><PhoneIcon /></span>
                <input
                  id="contact_number"
                  type="tel"
                  value={form.contact_number}
                  onChange={(e) => update('contact_number', e.target.value)}
                  placeholder="012345678"
                />
              </div>
            </Field>

            <Field id="address" label="Address">
              <div className="input-with-icon">
                <span className="input-icon"><MapPinIcon /></span>
                <input
                  id="address"
                  type="text"
                  value={form.address}
                  onChange={(e) => update('address', e.target.value)}
                  placeholder="Your address"
                />
              </div>
            </Field>
          </div>

          <Section title="Enrollment details" icon={GraduationCapIcon} />

          <div className="form-row full-width-row">
            <Field id="enrollment_date" label="Enrollment date" error={errors.enrollment_date} required>
              <div className="input-with-icon">
                <span className="input-icon"><CalendarIcon /></span>
                <input
                  id="enrollment_date"
                  type="date"
                  value={form.enrollment_date}
                  onChange={(e) => update('enrollment_date', e.target.value)}
                />
              </div>
            </Field>
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <p className="switch-auth">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
