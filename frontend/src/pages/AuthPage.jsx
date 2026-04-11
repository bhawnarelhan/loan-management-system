import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { getErrorMessage } from '../utils/helpers'
import { Building2, Eye, EyeOff, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

function LoginForm({ onSwitch }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.email, form.password)
      toast.success(`Welcome back, ${user.full_name}!`)
      navigate('/dashboard')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>Sign In</h2>
      <p style={{ color: 'var(--text2)', fontSize: '0.9rem', marginBottom: 28 }}>
        Access your loan management dashboard
      </p>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="demo-creds">
        <p style={{ fontSize: '0.78rem', color: 'var(--text3)', marginBottom: 8, fontWeight: 600 }}>DEMO CREDENTIALS</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'Admin', email: 'admin@loanpro.com' },
            { label: 'Manager', email: 'manager@loanpro.com' },
          ].map(d => (
            <button key={d.email} type="button" className="btn btn-ghost btn-sm"
              onClick={() => setForm({ email: d.email, password: 'Admin@123' })}>
              {d.label}
            </button>
          ))}
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Email Address</label>
        <input className="form-input" type="email" placeholder="you@example.com"
          value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} required />
      </div>

      <div className="form-group">
        <label className="form-label">Password</label>
        <div style={{ position: 'relative' }}>
          <input className="form-input" type={showPw ? 'text' : 'password'}
            placeholder="••••••••" style={{ paddingRight: 42 }}
            value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))} required />
          <button type="button" onClick={() => setShowPw(p => !p)}
            style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text3)', cursor: 'pointer' }}>
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
        {loading ? <><span className="spinner" />Signing In…</> : 'Sign In'}
      </button>

      <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text2)', fontSize: '0.88rem' }}>
        Don't have an account?{' '}
        <button type="button" onClick={onSwitch} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
          Register
        </button>
      </p>
    </form>
  )
}

function RegisterForm({ onSwitch }) {
  const [form, setForm] = useState({
    full_name: '', email: '', password: '',
    phone: '', annual_income: '', date_of_birth: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const payload = { ...form, annual_income: form.annual_income ? Number(form.annual_income) : null }
      const user = await register(payload)
      toast.success(`Welcome, ${user.full_name}! Account created.`)
      navigate('/dashboard')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <form onSubmit={handleSubmit}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 8 }}>Create Account</h2>
      <p style={{ color: 'var(--text2)', fontSize: '0.9rem', marginBottom: 28 }}>
        Apply for loans and track your repayments
      </p>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Full Name *</label>
          <input className="form-input" placeholder="John Doe" value={form.full_name} onChange={set('full_name')} required />
        </div>
        <div className="form-group">
          <label className="form-label">Phone</label>
          <input className="form-input" placeholder="9876543210" value={form.phone} onChange={set('phone')} />
        </div>
      </div>

      <div className="form-group">
        <label className="form-label">Email Address *</label>
        <input className="form-input" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
      </div>

      <div className="form-group">
        <label className="form-label">Password *</label>
        <input className="form-input" type="password" placeholder="Min 8 characters" value={form.password} onChange={set('password')} required minLength={8} />
      </div>

      <div className="form-grid">
        <div className="form-group">
          <label className="form-label">Annual Income (₹)</label>
          <input className="form-input" type="number" placeholder="500000" value={form.annual_income} onChange={set('annual_income')} />
        </div>
        <div className="form-group">
          <label className="form-label">Date of Birth</label>
          <input className="form-input" type="date" value={form.date_of_birth} onChange={set('date_of_birth')} />
        </div>
      </div>

      <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }} disabled={loading}>
        {loading ? <><span className="spinner" />Creating Account…</> : 'Create Account'}
      </button>

      <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--text2)', fontSize: '0.88rem' }}>
        Already have an account?{' '}
        <button type="button" onClick={onSwitch} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600 }}>
          Sign In
        </button>
      </p>
    </form>
  )
}

export default function AuthPage() {
  const [mode, setMode] = useState('login')

  return (
    <div className="auth-page">
      <div className="auth-left">
        <div className="auth-brand">
          <div className="logo-icon" style={{ width: 56, height: 56, borderRadius: 16, marginBottom: 20 }}>
            <Building2 size={28} color="#3b82f6" />
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: 1.2, marginBottom: 16 }}>
            Smart Loan<br />Management
          </h1>
          <p style={{ color: 'var(--text2)', lineHeight: 1.7, maxWidth: 360 }}>
            Complete banking platform for loan applications, approvals, EMI tracking, and credit management.
          </p>
          <div style={{ marginTop: 40, display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              '✓ Instant loan eligibility check',
              '✓ Automated EMI schedule generation',
              '✓ Real-time payment tracking',
              '✓ Credit score monitoring',
            ].map(f => (
              <p key={f} style={{ color: 'var(--text2)', fontSize: '0.9rem' }}>{f}</p>
            ))}
          </div>
        </div>
      </div>

      <div className="auth-right">
        <div className="auth-card">
          {mode === 'login'
            ? <LoginForm onSwitch={() => setMode('register')} />
            : <RegisterForm onSwitch={() => setMode('login')} />
          }
        </div>
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: var(--bg);
        }
        .auth-left {
          background: var(--bg2);
          border-right: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px;
        }
        .auth-brand { max-width: 420px; }
        .auth-right {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 48px 32px;
          overflow-y: auto;
        }
        .auth-card {
          width: 100%;
          max-width: 420px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 36px;
        }
        .demo-creds {
          background: var(--bg3);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          padding: 12px 14px;
          margin-bottom: 20px;
        }
        .logo-icon {
          background: var(--primary-glow);
          border: 1px solid rgba(59,130,246,0.3);
          display: flex; align-items: center; justify-content: center;
        }
        @media (max-width: 768px) {
          .auth-page { grid-template-columns: 1fr; }
          .auth-left { display: none; }
        }
      `}</style>
    </div>
  )
}