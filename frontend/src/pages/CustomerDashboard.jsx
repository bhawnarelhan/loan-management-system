import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { reportsAPI, applicationsAPI } from '../utils/api'
import { formatCurrency, formatDate, getStatusBadge } from '../utils/helpers'
import { useAuth } from '../hooks/useAuth'
import { CreditCard, Clock, CheckCircle, TrendingUp, AlertTriangle, Plus } from 'lucide-react'

export default function CustomerDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState(null)
  const [myApps, setMyApps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      reportsAPI.customerDashboard(),
      applicationsAPI.myApplications()
    ]).then(([s, a]) => {
      setStats(s.data)
      setMyApps(a.data.slice(0, 5))
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <span className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  )

  const creditColor = user?.credit_score >= 750 ? 'var(--success)'
    : user?.credit_score >= 700 ? 'var(--primary)' : 'var(--warning)'

  return (
    <div className="page">
      <div className="section-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>
            Welcome, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.88rem' }}>Manage your loans and track repayments</p>
        </div>
        <Link to="/apply" className="btn btn-primary">
          <Plus size={16} /> Apply for Loan
        </Link>
      </div>

      {/* Credit Score Banner */}
      <div className="card" style={{ marginBottom: 24, background: 'linear-gradient(135deg, var(--card), var(--bg3))', border: `1px solid ${creditColor}33` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text3)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Credit Score</div>
            <div style={{ fontSize: '3rem', fontWeight: 900, color: creditColor, lineHeight: 1 }}>{user?.credit_score}</div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text2)', marginTop: 6 }}>
              {user?.credit_score >= 750 ? '🟢 Excellent — Best loan rates available'
                : user?.credit_score >= 700 ? '🔵 Good — Most loans accessible'
                : user?.credit_score >= 650 ? '🟡 Fair — Some loans available'
                : '🔴 Poor — Limited loan options'}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div className="progress-bar" style={{ width: 200, height: 10, marginBottom: 8 }}>
              <div className="progress-fill" style={{ width: `${(user?.credit_score - 300) / 6}%`, background: creditColor }} />
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>300 — 900</div>
          </div>
        </div>
      </div>

      <div className="stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Applications', value: stats?.total_applications, icon: FileText2, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
          { label: 'Active Loans', value: stats?.active_loans, icon: CreditCard, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
          { label: 'Pending', value: stats?.pending_applications, icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
          { label: 'Overdue EMIs', value: stats?.overdue_emis, icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>
              <s.icon size={18} color={s.color} />
            </div>
            <div className="stat-value" style={{ color: s.color }}>{s.value ?? 0}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: stats?.upcoming_emi ? '1fr 1fr' : '1fr', gap: 20 }}>
        {stats?.upcoming_emi && (
          <div className="card" style={{ border: '1px solid rgba(59,130,246,0.3)', background: 'linear-gradient(135deg, rgba(59,130,246,0.08), transparent)' }}>
            <div className="card-title"><Clock size={16} color="var(--primary)" /> Next EMI Due</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: 6 }}>
              {formatCurrency(stats.upcoming_emi.amount)}
            </div>
            <div style={{ color: 'var(--text2)', fontSize: '0.88rem' }}>
              Due: <strong>{formatDate(stats.upcoming_emi.due_date)}</strong>
            </div>
            <div style={{ color: 'var(--text3)', fontSize: '0.8rem', marginTop: 4 }}>
              Installment #{stats.upcoming_emi.installment}
            </div>
          </div>
        )}

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div className="card-title" style={{ marginBottom: 0 }}>Recent Applications</div>
            <Link to="/my-applications" style={{ fontSize: '0.8rem', color: 'var(--primary)' }}>View All</Link>
          </div>
          {myApps.length === 0 ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <CreditCard size={32} />
              <p style={{ marginTop: 8 }}>No applications yet</p>
              <Link to="/apply" className="btn btn-primary btn-sm" style={{ marginTop: 12 }}>Apply Now</Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {myApps.map(app => (
                <Link key={app.id} to={`/my-applications/${app.id}`} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'var(--bg3)', borderRadius: 8 }}>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{app.loan_type?.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{app.application_number}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{formatCurrency(app.requested_amount)}</div>
                      <span className={`badge ${getStatusBadge(app.status)}`}>{app.status}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FileText2({ size, color }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" />
    </svg>
  )
}