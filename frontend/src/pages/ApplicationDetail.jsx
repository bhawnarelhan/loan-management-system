import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { applicationsAPI, paymentsAPI } from '../utils/api'
import { formatCurrency, formatDate, formatDateTime, getStatusBadge, getErrorMessage } from '../utils/helpers'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { ArrowLeft, Calendar, DollarSign, User, CreditCard, CheckCircle, AlertCircle } from 'lucide-react'

export default function ApplicationDetail() {
  const { id } = useParams()
  const { isManager } = useAuth()
  const [app, setApp] = useState(null)
  const [emiSchedule, setEmiSchedule] = useState([])
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview')
  const [payModal, setPayModal] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [a, e, p] = await Promise.all([
        applicationsAPI.getOne(id),
        applicationsAPI.getEMISchedule(id).catch(() => ({ data: [] })),
        applicationsAPI.getPayments(id).catch(() => ({ data: [] }))
      ])
      setApp(a.data); setEmiSchedule(e.data); setPayments(p.data)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [id])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><span className="spinner" style={{ width: 32, height: 32 }} /></div>
  if (!app) return <div className="empty-state"><p>Application not found</p></div>

  const paidEMIs = emiSchedule.filter(e => e.status === 'paid').length
  const progress = emiSchedule.length > 0 ? (paidEMIs / emiSchedule.length) * 100 : 0

  return (
    <div className="page">
      <div style={{ marginBottom: 20 }}>
        <Link to={isManager ? '/applications' : '/my-applications'} className="btn btn-ghost btn-sm">
          <ArrowLeft size={14} /> Back
        </Link>
      </div>

      {/* Header */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
              <h1 style={{ fontSize: '1.3rem', fontWeight: 800 }}>{app.loan_type?.name}</h1>
              <span className={`badge ${getStatusBadge(app.status)}`} style={{ fontSize: '0.82rem' }}>{app.status.replace('_', ' ')}</span>
            </div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: '0.85rem', color: 'var(--text3)', marginBottom: 8 }}>{app.application_number}</div>
            <div style={{ color: 'var(--text2)', fontSize: '0.88rem' }}>Applied: {formatDateTime(app.created_at)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.78rem', color: 'var(--text3)', marginBottom: 4 }}>Requested Amount</div>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>{formatCurrency(app.requested_amount)}</div>
            {app.approved_amount && <div style={{ fontSize: '0.85rem', color: 'var(--success)', marginTop: 4 }}>Approved: {formatCurrency(app.approved_amount)}</div>}
          </div>
        </div>

        {/* Progress for disbursed loans */}
        {app.status === 'disbursed' && emiSchedule.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.82rem', color: 'var(--text2)' }}>
              <span>Repayment Progress</span>
              <span>{paidEMIs}/{emiSchedule.length} EMIs paid</span>
            </div>
            <div className="progress-bar"><div className="progress-fill" style={{ width: `${progress}%` }} /></div>
          </div>
        )}
      </div>

      <div className="tabs">
        {['overview', 'emi-schedule', 'payments'].map(t => (
          <button key={t} className={`tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'emi-schedule' ? 'EMI Schedule' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div className="card">
            <div className="card-title"><User size={16} /> Customer Information</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Full Name', value: app.customer?.full_name },
                { label: 'Email', value: app.customer?.email },
                { label: 'Credit Score', value: app.customer?.credit_score },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text2)' }}>{r.label}</span>
                  <span style={{ fontWeight: 600 }}>{r.value || '—'}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-title"><CreditCard size={16} /> Loan Details</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { label: 'Loan Type', value: app.loan_type?.name },
                { label: 'Interest Rate', value: app.interest_rate ? `${app.interest_rate}% p.a.` : '—' },
                { label: 'Tenure', value: `${app.tenure_months} months` },
                { label: 'Processing Fee', value: formatCurrency(app.processing_fee) },
                { label: 'Disbursed', value: formatDateTime(app.disbursed_at) },
              ].map(r => (
                <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text2)' }}>{r.label}</span>
                  <span style={{ fontWeight: 600 }}>{r.value || '—'}</span>
                </div>
              ))}
            </div>
          </div>

          {app.review_notes && (
            <div className="card" style={{ gridColumn: '1/-1' }}>
              <div className="card-title">Review Notes</div>
              <p style={{ color: 'var(--text2)', fontSize: '0.88rem', lineHeight: 1.7 }}>{app.review_notes}</p>
              {app.reviewed_at && <p style={{ color: 'var(--text3)', fontSize: '0.78rem', marginTop: 8 }}>Reviewed: {formatDateTime(app.reviewed_at)}</p>}
            </div>
          )}

          {app.purpose && (
            <div className="card" style={{ gridColumn: '1/-1' }}>
              <div className="card-title">Loan Purpose</div>
              <p style={{ color: 'var(--text2)', fontSize: '0.88rem', lineHeight: 1.7 }}>{app.purpose}</p>
            </div>
          )}
        </div>
      )}

      {tab === 'emi-schedule' && (
        <div>
          {isManager && app.status === 'disbursed' && (
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
              <button className="btn btn-primary" onClick={() => setPayModal(true)}>
                <DollarSign size={15} /> Record Payment
              </button>
            </div>
          )}
          {emiSchedule.length === 0 ? (
            <div className="card empty-state"><p>No EMI schedule generated yet. Loan must be disbursed first.</p></div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Due Date</th><th>EMI</th><th>Principal</th>
                    <th>Interest</th><th>Outstanding</th><th>Status</th><th>Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {emiSchedule.map(e => (
                    <tr key={e.id} style={{ opacity: e.status === 'paid' ? 0.7 : 1 }}>
                      <td style={{ fontFamily: 'var(--mono)', color: 'var(--text3)', fontSize: '0.82rem' }}>{e.installment_number}</td>
                      <td style={{ fontSize: '0.85rem' }}>{formatDate(e.due_date)}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(e.emi_amount)}</td>
                      <td style={{ fontSize: '0.85rem' }}>{formatCurrency(e.principal_component)}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text2)' }}>{formatCurrency(e.interest_component)}</td>
                      <td style={{ fontSize: '0.85rem' }}>{formatCurrency(e.outstanding_balance)}</td>
                      <td>
                        <span className={`badge ${getStatusBadge(e.status)}`}>{e.status}</span>
                        {e.penalty_amount > 0 && <div style={{ fontSize: '0.7rem', color: 'var(--danger)', marginTop: 2 }}>Penalty: {formatCurrency(e.penalty_amount)}</div>}
                      </td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>
                        {e.paid_date ? formatDate(e.paid_date) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'payments' && (
        <div>
          {payments.length === 0 ? (
            <div className="card empty-state"><p>No payments recorded yet.</p></div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr><th>Date</th><th>Amount</th><th>Mode</th><th>Reference</th><th>Notes</th></tr>
                </thead>
                <tbody>
                  {payments.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontSize: '0.85rem' }}>{formatDateTime(p.payment_date)}</td>
                      <td style={{ fontWeight: 600, color: 'var(--success)' }}>{formatCurrency(p.amount)}</td>
                      <td><span className="badge badge-paid">{p.payment_mode}</span></td>
                      <td style={{ fontFamily: 'var(--mono)', fontSize: '0.78rem', color: 'var(--text3)' }}>{p.transaction_reference || '—'}</td>
                      <td style={{ fontSize: '0.82rem', color: 'var(--text2)' }}>{p.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {payModal && <PaymentModal applicationId={app.id} onClose={() => setPayModal(false)} onSuccess={() => { setPayModal(false); fetchAll(); toast.success('Payment recorded!') }} />}
    </div>
  )
}

function PaymentModal({ applicationId, onClose, onSuccess }) {
  const [form, setForm] = useState({ amount: '', payment_mode: 'online', transaction_reference: '', notes: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true)
    try {
      await paymentsAPI.record({ ...form, application_id: applicationId, amount: Number(form.amount) })
      onSuccess()
    } catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title"><DollarSign size={18} /> Record Payment</div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Amount (₹) *</label>
            <input className="form-input" type="number" placeholder="15000" value={form.amount} onChange={set('amount')} required />
          </div>
          <div className="form-group">
            <label className="form-label">Payment Mode *</label>
            <select className="form-select" value={form.payment_mode} onChange={set('payment_mode')}>
              {['online', 'bank_transfer', 'cash', 'cheque'].map(m => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Transaction Reference</label>
            <input className="form-input" placeholder="TXN12345..." value={form.transaction_reference} onChange={set('transaction_reference')} />
          </div>
          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea className="form-textarea" style={{ minHeight: 60 }} value={form.notes} onChange={set('notes')} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <span className="spinner" /> : <CheckCircle size={15} />} Record Payment
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}