import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { applicationsAPI } from '../utils/api'
import { formatCurrency, formatDateTime, getStatusBadge, getErrorMessage } from '../utils/helpers'
import { Search, Filter, Eye, CheckCircle, XCircle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const STATUSES = ['', 'pending', 'under_review', 'approved', 'rejected', 'disbursed', 'closed']

export default function AllApplications() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [reviewModal, setReviewModal] = useState(null)

  const fetchApps = async () => {
    setLoading(true)
    try {
      const { data } = await applicationsAPI.getAll({ status: statusFilter || undefined, limit: 100 })
      setApps(data)
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchApps() }, [statusFilter])

  const filtered = apps.filter(a =>
    !search ||
    a.application_number.toLowerCase().includes(search.toLowerCase()) ||
    a.customer?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    a.customer?.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="page">
      <div className="section-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>Loan Applications</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.88rem' }}>{filtered.length} applications found</p>
        </div>
        <button onClick={fetchApps} className="btn btn-ghost btn-sm"><RefreshCw size={14} /></button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
          <input className="form-input" style={{ paddingLeft: 36 }} placeholder="Search by name, email, app number..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-select" style={{ width: 'auto', minWidth: 160 }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {STATUSES.map(s => <option key={s} value={s}>{s || 'All Status'}</option>)}
        </select>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>App Number</th><th>Customer</th><th>Loan Type</th><th>Amount</th>
              <th>Tenure</th><th>Status</th><th>Applied</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40 }}><span className="spinner" /></td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8}><div className="empty-state"><p>No applications found</p></div></td></tr>
            ) : filtered.map(app => (
              <tr key={app.id}>
                <td><span style={{ fontFamily: 'var(--mono)', fontSize: '0.8rem', color: 'var(--primary)' }}>{app.application_number}</span></td>
                <td>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{app.customer?.full_name}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{app.customer?.email}</div>
                </td>
                <td style={{ fontSize: '0.85rem' }}>{app.loan_type?.name}</td>
                <td>
                  <div style={{ fontWeight: 600 }}>{formatCurrency(app.requested_amount)}</div>
                  {app.approved_amount && <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>Approved: {formatCurrency(app.approved_amount)}</div>}
                </td>
                <td style={{ fontSize: '0.85rem' }}>{app.tenure_months}m</td>
                <td><span className={`badge ${getStatusBadge(app.status)}`}>{app.status.replace('_', ' ')}</span></td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text3)' }}>{formatDateTime(app.created_at)}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Link to={`/applications/${app.id}`} className="btn btn-ghost btn-sm"><Eye size={14} /></Link>
                    {['pending', 'under_review'].includes(app.status) && (
                      <button className="btn btn-primary btn-sm" onClick={() => setReviewModal(app)}>Review</button>
                    )}
                    {app.status === 'approved' && (
                      <button className="btn btn-success btn-sm" onClick={async () => {
                        if (!confirm('Disburse this loan?')) return
                        try {
                          await applicationsAPI.disburse(app.id)
                          toast.success('Loan disbursed! EMI schedule generated.')
                          fetchApps()
                        } catch (err) { toast.error(getErrorMessage(err)) }
                      }}>Disburse</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {reviewModal && (
        <ReviewModal
          app={reviewModal}
          onClose={() => setReviewModal(null)}
          onSuccess={() => { setReviewModal(null); fetchApps() }}
        />
      )}
    </div>
  )
}

function ReviewModal({ app, onClose, onSuccess }) {
  const [form, setForm] = useState({ action: 'approve', approved_amount: app.requested_amount, review_notes: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await applicationsAPI.review(app.id, {
        action: form.action,
        approved_amount: form.action === 'approve' ? Number(form.approved_amount) : undefined,
        review_notes: form.review_notes
      })
      toast.success(`Application ${form.action}d!`)
      onSuccess()
    } catch (err) { toast.error(getErrorMessage(err)) } finally { setLoading(false) }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-title">Review Application</div>
        <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: 14, marginBottom: 20, fontSize: '0.85rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div><span style={{ color: 'var(--text3)' }}>Customer: </span><strong>{app.customer?.full_name}</strong></div>
            <div><span style={{ color: 'var(--text3)' }}>Amount: </span><strong>{formatCurrency(app.requested_amount)}</strong></div>
            <div><span style={{ color: 'var(--text3)' }}>Loan Type: </span><strong>{app.loan_type?.name}</strong></div>
            <div><span style={{ color: 'var(--text3)' }}>Tenure: </span><strong>{app.tenure_months} months</strong></div>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Action *</label>
            <select className="form-select" value={form.action} onChange={e => setForm(p => ({ ...p, action: e.target.value }))}>
              <option value="under_review">Mark Under Review</option>
              <option value="approve">Approve</option>
              <option value="reject">Reject</option>
            </select>
          </div>
          {form.action === 'approve' && (
            <div className="form-group">
              <label className="form-label">Approved Amount (₹)</label>
              <input className="form-input" type="number" value={form.approved_amount}
                onChange={e => setForm(p => ({ ...p, approved_amount: e.target.value }))} />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Review Notes</label>
            <textarea className="form-textarea" placeholder="Add notes for the customer..."
              value={form.review_notes} onChange={e => setForm(p => ({ ...p, review_notes: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className={`btn ${form.action === 'reject' ? 'btn-danger' : 'btn-primary'}`} disabled={loading}>
              {loading ? <span className="spinner" /> : null}
              {form.action === 'approve' ? '✓ Approve' : form.action === 'reject' ? '✗ Reject' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}