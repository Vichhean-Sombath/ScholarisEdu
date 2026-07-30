import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const validate = () => {
    const next = {}
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
      next.form = 'Please enter a valid email and password.'
    }
    if (!password) {
      next.form = 'Please enter a valid email and password.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setApiError('')
    setErrors({})
    if (!validate()) return

    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      const message = err.response?.data?.message || err.message || 'Login failed. Please try again.'
      setApiError(normalizeLoginError(message))
    } finally {
      setSubmitting(false)
    }
  }

  const normalizeLoginError = (message) => {
    const lower = String(message || '').toLowerCase()
    if (lower.includes('email') || lower.includes('password') || lower.includes('invalid') || lower.includes('credentials')) {
      return 'Invalid email or password.'
    }
    return message
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="brand">
          <img className="brand-logo" src="/logo.webp" alt="Scholaris" />
          <div className="brand-name">Scholaris</div>
        </div>

        <h1>Sign in</h1>
        <p className="subtitle">Enter your credentials to access your account.</p>

        {apiError && <div className="error-box">{apiError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@school.edu"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {errors.form && <div className="error-box">{errors.form}</div>}

          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="switch-auth">
          Don't have an account? <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  )
}
