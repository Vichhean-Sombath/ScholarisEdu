import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

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
    enrollment_date: '',
    role: 'Student',
  })
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const update = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const validate = () => {
    const next = {}
    const { username, email, password, confirmPassword, first_name, last_name, enrollment_date, role } = form

    if (!username.trim()) next.username = 'Username is required'
    else if (username.length > 50) next.username = 'Username must not exceed 50 characters'

    if (!email.trim()) next.email = 'Email is required'
    else if (!/^\S+@\S+\.\S+$/.test(email)) next.email = 'Enter a valid email'

    if (!password) next.password = 'Password is required'
    else if (password.length < 8) next.password = 'Password must be at least 8 characters'
    else if (!/[A-Z]/.test(password)) next.password = 'Password needs an uppercase letter'
    else if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) next.password = 'Password needs a special character'

    if (password !== confirmPassword) next.confirmPassword = 'Passwords do not match'

    if (!first_name.trim()) next.first_name = 'First name is required'
    if (!last_name.trim()) next.last_name = 'Last name is required'
    if (!enrollment_date) next.enrollment_date = 'Enrollment date is required'
    if (!role) next.role = 'Role is required'

    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    if (!validate()) return

    const { confirmPassword, ...payload } = form

    setSubmitting(true)
    try {
      await register(payload)
      navigate('/')
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Registration failed. Please try again.'
      setApiError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand">
          <div className="brand-logo">S</div>
          <div className="brand-name">Scholaris</div>
        </div>

        <h1>Create account</h1>
        <p className="subtitle">Join Scholaris to manage your academic journey.</p>

        {apiError && <div className="error-box">{apiError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                id="username"
                type="text"
                value={form.username}
                onChange={(e) => update('username', e.target.value)}
                placeholder="jane_doe"
                autoFocus
              />
              {errors.username && <span className="error-text">{errors.username}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="you@school.edu"
              />
              {errors.email && <span className="error-text">{errors.email}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="first_name">First name</label>
              <input
                id="first_name"
                type="text"
                value={form.first_name}
                onChange={(e) => update('first_name', e.target.value)}
                placeholder="Jane"
              />
              {errors.first_name && <span className="error-text">{errors.first_name}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="last_name">Last name</label>
              <input
                id="last_name"
                type="text"
                value={form.last_name}
                onChange={(e) => update('last_name', e.target.value)}
                placeholder="Doe"
              />
              {errors.last_name && <span className="error-text">{errors.last_name}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="At least 8 chars, A-Z, special"
              />
              {errors.password && <span className="error-text">{errors.password}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm password</label>
              <input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={(e) => update('confirmPassword', e.target.value)}
                placeholder="Re-enter password"
              />
              {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="role">Role *</label>
              <select id="role" value={form.role} onChange={(e) => update('role', e.target.value)}>
                <option value="Student">Student</option>
                <option value="Teacher">Teacher</option>
                <option value="Admin">Admin</option>
              </select>
              {errors.role && <span className="error-text">{errors.role}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="gender">Gender</label>
              <select id="gender" value={form.gender} onChange={(e) => update('gender', e.target.value)}>
                <option value="">Select…</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dob">Date of birth</label>
              <input
                id="dob"
                type="date"
                value={form.dob}
                onChange={(e) => update('dob', e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="contact_number">Contact number</label>
              <input
                id="contact_number"
                type="tel"
                value={form.contact_number}
                onChange={(e) => update('contact_number', e.target.value)}
                placeholder="+855 12 345 678"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="enrollment_date">Enrollment date *</label>
              <input
                id="enrollment_date"
                type="date"
                value={form.enrollment_date}
                onChange={(e) => update('enrollment_date', e.target.value)}
              />
              {errors.enrollment_date && <span className="error-text">{errors.enrollment_date}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="address">Address</label>
              <input
                id="address"
                type="text"
                value={form.address}
                onChange={(e) => update('address', e.target.value)}
                placeholder="Your address"
              />
            </div>
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
