// Defaulters Report Page
import { useState, useEffect } from 'react'
import { reportsAPI, adminAPI } from '../utils/api'
import { formatCurrency, formatDate } from '../utils/helpers'
import { AlertTriangle, TrendingUp, Activity, Users, CreditCard, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

export function DefaultersPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    reportsAPI.defaulters().then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  return (
    <div className="page">
      <div className="section-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <AlertTriangle size={22} color="var(--danger)" /> Defaulter Report
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.88rem' }}>Customers with overdue EMI payments</p>
        </div>
        <div className="badge badge-rejected" style={{ fontSize: '0.9rem', padding: '6px 14px' }}>
          {data.length} defaulters
        </div>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 60 }}><span className="spinner" style={{ width: 28, height: 28 }} /></div> : (
        data.length === 0 ? (
          <div className="card empty-state">
            <AlertTriangle size={36} />
            <p style={{ marginTop: 8, color: 'var(--success)' }}>No defaulters found! All EMIs are up to date.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Customer</th><th>Application</th><th>Loan Amount</th>
                  <th>Overdue EMIs</th><th>Total Due</th><th>Days Overdue</th><th>Credit Score</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{d.full_name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{d.email}</div>
                      {d.phone && <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{d.phone}</div>}
                    </td>
                    <td style={{ fontFamily: 'var(--mono)', fontSize: '0.78rem', color: 'var(--primary)' }}>{d.application_number}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(d.approved_amount)}</td>
                    <td>
                      <span style={{ background: 'var(--danger-bg)', color: 'var(--danger)', padding: '2px 10px', borderRadius: 12, fontWeight: 700, fontSize: '0.88rem' }}>
                        {d.overdue_count}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--danger)' }}>{formatCurrency(d.total_overdue_amount)}</td>
                    <td>
                      <span style={{ color: d.days_overdue > 90 ? 'var(--danger)' : d.days_overdue > 30 ? 'var(--warning)' : 'var(--text2)', fontWeight: 600 }}>
                        {d.days_overdue} days
                      </span>
                    </td>
                    <td>
                      <span style={{ color: d.credit_score < 600 ? 'var(--danger)' : d.credit_score < 700 ? 'var(--warning)' : 'var(--success)', fontWeight: 700 }}>
                        {d.credit_score}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}

// Repayment Ranking Page
export function RepaymentRankingPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    reportsAPI.repaymentRanking().then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  return (
    <div className="page">
      <div className="section-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <TrendingUp size={22} color="var(--primary)" /> Repayment Ranking
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.88rem' }}>Customers ranked by repayment performance (Window Function)</p>
        </div>
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 60 }}><span className="spinner" style={{ width: 28, height: 28 }} /></div> : (
        data.length === 0 ? <div className="card empty-state"><p>No ranking data available</p></div> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Rank</th><th>Customer</th><th>Repayment Score</th>
                  <th>Paid EMIs</th><th>Overdue EMIs</th><th>Credit Score</th><th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {data.map((d, i) => {
                  const score = Number(d.repayment_score) || 0
                  const rating = score >= 90 ? { label: 'Excellent', color: 'var(--success)' }
                    : score >= 70 ? { label: 'Good', color: 'var(--primary)' }
                    : score >= 50 ? { label: 'Fair', color: 'var(--warning)' }
                    : { label: 'Poor', color: 'var(--danger)' }
                  return (
                    <tr key={i}>
                      <td>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 32, height: 32, borderRadius: '50%', fontWeight: 800, fontSize: '0.85rem',
                          background: i < 3 ? ['rgba(255,215,0,0.2)', 'rgba(192,192,192,0.2)', 'rgba(205,127,50,0.2)'][i] : 'var(--bg3)',
                          color: i < 3 ? ['#ffd700', '#c0c0c0', '#cd7f32'][i] : 'var(--text2)'
                        }}>#{d.repayment_rank}</span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{d.full_name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{d.email}</div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div className="progress-bar" style={{ width: 80 }}>
                            <div className="progress-fill" style={{ width: `${score}%`, background: rating.color }} />
                          </div>
                          <span style={{ fontWeight: 700, color: rating.color }}>{score.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--success)', fontWeight: 600 }}>{d.paid_emis}</td>
                      <td style={{ color: d.overdue_emis > 0 ? 'var(--danger)' : 'var(--text3)', fontWeight: 600 }}>{d.overdue_emis}</td>
                      <td style={{ fontWeight: 700 }}>{d.credit_score}</td>
                      <td><span className="badge" style={{ background: `${rating.color}20`, color: rating.color }}>{rating.label}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  )
}

// Active Loans Page
export function ActiveLoansPage() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    reportsAPI.activeLoans().then(r => setData(r.data)).finally(() => setLoading(false))
  }, [])

  return (
    <div className="page">
      <div className="section-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
            <CreditCard size={22} color="var(--primary)" /> Active Loans
          </h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.88rem' }}>All disbursed loans via SQL View</p>
        </div>
        <div style={{ fontWeight: 700 }}>{data.length} loans</div>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 60 }}><span className="spinner" style={{ width: 28, height: 28 }} /></div> : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Customer</th><th>Loan Type</th><th>Amount</th><th>Rate</th>
                <th>EMIs Paid</th><th>EMIs Pending</th><th>Overdue</th><th>Outstanding</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr><td colSpan={9}><div className="empty-state"><p>No active loans</p></div></td></tr>
              ) : data.map((d, i) => (
                <tr key={i}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{d.customer_name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text3)' }}>{d.customer_email}</div>
                  </td>
                  <td style={{ fontSize: '0.85rem' }}>{d.loan_type}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(d.approved_amount)}</td>
                  <td style={{ fontSize: '0.85rem' }}>{d.interest_rate}%</td>
                  <td style={{ color: 'var(--success)', fontWeight: 600 }}>{d.emis_paid}</td>
                  <td style={{ color: 'var(--text2)' }}>{d.emis_pending}</td>
                  <td style={{ color: d.emis_overdue > 0 ? 'var(--danger)' : 'var(--text3)', fontWeight: d.emis_overdue > 0 ? 700 : 400 }}>{d.emis_overdue}</td>
                  <td style={{ fontWeight: 700, color: 'var(--warning)' }}>{formatCurrency(d.outstanding_amount)}</td>
                  <td><span className={`badge badge-${d.status}`}>{d.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// Customers Page
export function CustomersPage() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [editScore, setEditScore] = useState(null)

  const fetchCustomers = () => {
    setLoading(true)
    adminAPI.listUsers({ role: 'customer', limit: 100 }).then(r => setCustomers(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { fetchCustomers() }, [])

  const handleToggle = async (id) => {
    try { await adminAPI.toggleActive(id); fetchCustomers(); toast.success('User status updated') }
    catch { toast.error('Failed to update user') }
  }

  return (
    <div className="page">
      <div className="section-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}><Users size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />Customers</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.88rem' }}>{customers.length} registered customers</p>
        </div>
        <button onClick={fetchCustomers} className="btn btn-ghost btn-sm"><RefreshCw size={14} /></button>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 60 }}><span className="spinner" style={{ width: 28, height: 28 }} /></div> : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Customer</th><th>Phone</th><th>Annual Income</th><th>Credit Score</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {customers.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{c.full_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{c.email}</div>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>{c.phone || '—'}</td>
                  <td style={{ fontWeight: 600 }}>{formatCurrency(c.annual_income)}</td>
                  <td>
                    <span style={{ fontWeight: 700, color: c.credit_score >= 750 ? 'var(--success)' : c.credit_score >= 700 ? 'var(--primary)' : 'var(--warning)' }}>
                      {c.credit_score}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${c.is_active ? 'badge-approved' : 'badge-rejected'}`}>
                      {c.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>{formatDate(c.created_at)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditScore({ id: c.id, name: c.full_name, score: c.credit_score })}>
                        Edit Score
                      </button>
                      <button className={`btn btn-sm ${c.is_active ? 'btn-danger' : 'btn-success'}`} onClick={() => handleToggle(c.id)}>
                        {c.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {editScore && (
        <EditCreditScoreModal data={editScore} onClose={() => setEditScore(null)} onSuccess={() => { setEditScore(null); fetchCustomers() }} />
      )}
    </div>
  )
}

function EditCreditScoreModal({ data, onClose, onSuccess }) {
  const [score, setScore] = useState(data.score)
  const [loading, setLoading] = useState(false)
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try { await adminAPI.updateCreditScore(data.id, Number(score)); toast.success('Credit score updated'); onSuccess() }
    catch { toast.error('Failed to update') } finally { setLoading(false) }
  }
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 360 }}>
        <div className="modal-title">Update Credit Score</div>
        <p style={{ color: 'var(--text2)', fontSize: '0.88rem', marginBottom: 20 }}>Customer: <strong>{data.name}</strong></p>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Credit Score (300–900)</label>
            <input className="form-input" type="number" min={300} max={900} value={score} onChange={e => setScore(e.target.value)} required />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? <span className="spinner" /> : null} Update</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Payment Logs Page
export function PaymentLogsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    reportsAPI.paymentLogs(100).then(r => setLogs(r.data)).finally(() => setLoading(false))
  }, [])

  return (
    <div className="page">
      <div className="section-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}><Activity size={20} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8 }} />Payment Logs</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.88rem' }}>Auto-generated by database trigger on every payment</p>
        </div>
      </div>
      {loading ? <div style={{ textAlign: 'center', padding: 60 }}><span className="spinner" style={{ width: 28, height: 28 }} /></div> : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr><th>Timestamp</th><th>Customer</th><th>Action</th><th>Amount</th><th>Details</th></tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr><td colSpan={5}><div className="empty-state"><p>No payment logs yet</p></div></td></tr>
              ) : logs.map(l => (
                <tr key={l.id}>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text3)', fontFamily: 'var(--mono)' }}>
                    {new Date(l.log_timestamp).toLocaleString('en-IN')}
                  </td>
                  <td style={{ fontWeight: 600, fontSize: '0.88rem' }}>{l.full_name}</td>
                  <td><span className="badge badge-paid">{l.action}</span></td>
                  <td style={{ fontWeight: 700, color: 'var(--success)' }}>{formatCurrency(l.amount)}</td>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text2)', maxWidth: 300 }}>{l.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}