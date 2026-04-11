import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { applicationsAPI } from '../utils/api'
import { formatCurrency, formatDateTime, getStatusBadge } from '../utils/helpers'
import { Plus, FileText } from 'lucide-react'

export default function MyApplications() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    setLoading(true)
    applicationsAPI.myApplications(statusFilter || undefined)
      .then(r => setApps(r.data))
      .finally(() => setLoading(false))
  }, [statusFilter])

  return (
    <div className="page">
      <div className="section-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>My Applications</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.88rem' }}>{apps.length} loan applications</p>
        </div>
        <Link to="/apply" className="btn btn-primary"><Plus size={16} /> New Application</Link>
      </div>

      <div style={{ marginBottom: 16 }}>
        <select className="form-select" style={{ width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {['', 'pending', 'under_review', 'approved', 'rejected', 'disbursed', 'closed'].map(s => (
            <option key={s} value={s}>{s || 'All Status'}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><span className="spinner" style={{ width: 28, height: 28 }} /></div>
      ) : apps.length === 0 ? (
        <div className="card empty-state">
          <FileText size={40} />
          <p style={{ marginTop: 8, marginBottom: 16 }}>No loan applications found</p>
          <Link to="/apply" className="btn btn-primary">Apply for Your First Loan</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {apps.map(app => (
            <Link key={app.id} to={`/my-applications/${app.id}`} style={{ textDecoration: 'none' }}>
              <div className="card" style={{ transition: 'border-color 0.2s', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>{app.loan_type?.name}</h3>
                      <span className={`badge ${getStatusBadge(app.status)}`}>{app.status.replace('_', ' ')}</span>
                    </div>
                    <div style={{ fontFamily: 'var(--mono)', fontSize: '0.78rem', color: 'var(--text3)', marginBottom: 8 }}>{app.application_number}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>
                      Tenure: {app.tenure_months} months
                      {app.interest_rate && ` · ${app.interest_rate}% p.a.`}
                    </div>
                    {app.review_notes && (
                      <div style={{ marginTop: 8, fontSize: '0.82rem', color: 'var(--text2)', background: 'var(--bg3)', padding: '6px 10px', borderRadius: 6 }}>
                        💬 {app.review_notes}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>{formatCurrency(app.requested_amount)}</div>
                    {app.approved_amount && <div style={{ fontSize: '0.82rem', color: 'var(--success)', marginTop: 2 }}>Approved: {formatCurrency(app.approved_amount)}</div>}
                    <div style={{ fontSize: '0.75rem', color: 'var(--text3)', marginTop: 6 }}>{formatDateTime(app.created_at)}</div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}