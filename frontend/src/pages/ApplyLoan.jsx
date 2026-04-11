import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { loanTypesAPI, applicationsAPI } from '../utils/api'
import { formatCurrency, calculateEMI, getErrorMessage } from '../utils/helpers'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import { Calculator, CheckCircle, AlertCircle, Info } from 'lucide-react'

export default function ApplyLoan() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loanTypes, setLoanTypes] = useState([])
  const [selectedType, setSelectedType] = useState(null)
  const [form, setForm] = useState({ loan_type_id: '', requested_amount: '', tenure_months: '', purpose: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { loanTypesAPI.getAll().then(r => setLoanTypes(r.data)) }, [])

  useEffect(() => {
    if (form.loan_type_id) {
      const lt = loanTypes.find(t => t.id === Number(form.loan_type_id))
      setSelectedType(lt)
      if (lt) {
        setForm(p => ({
          ...p,
          requested_amount: p.requested_amount || lt.min_amount,
          tenure_months: p.tenure_months || lt.min_tenure_months
        }))
      }
    }
  }, [form.loan_type_id, loanTypes])

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }))

  const estimatedEMI = (form.requested_amount && form.tenure_months && selectedType)
    ? calculateEMI(Number(form.requested_amount), selectedType.base_interest_rate, Number(form.tenure_months))
    : 0

  const totalPayable = estimatedEMI * Number(form.tenure_months)
  const totalInterest = totalPayable - Number(form.requested_amount)

  const eligibilityChecks = selectedType ? [
    { label: 'Credit Score', ok: user?.credit_score >= selectedType.min_credit_score, value: `${user?.credit_score} / Min ${selectedType.min_credit_score}` },
    { label: 'Annual Income', ok: !selectedType.min_annual_income || (user?.annual_income >= selectedType.min_annual_income), value: selectedType.min_annual_income > 0 ? `Min ${formatCurrency(selectedType.min_annual_income)}` : 'No minimum' },
  ] : []

  const isEligible = eligibilityChecks.every(c => c.ok)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isEligible) { toast.error('You do not meet the eligibility criteria'); return }
    setError(''); setLoading(true)
    try {
      await applicationsAPI.apply({ ...form, loan_type_id: Number(form.loan_type_id), requested_amount: Number(form.requested_amount), tenure_months: Number(form.tenure_months) })
      toast.success('Loan application submitted successfully!')
      navigate('/my-applications')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally { setLoading(false) }
  }

  return (
    <div className="page">
      <div className="section-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>Apply for Loan</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.88rem' }}>Fill in the details to submit your loan application</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>
        <div className="card">
          {error && <div className="alert alert-error"><AlertCircle size={16} />{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Loan Type *</label>
              <select className="form-select" value={form.loan_type_id} onChange={set('loan_type_id')} required>
                <option value="">Select loan type...</option>
                {loanTypes.map(lt => (
                  <option key={lt.id} value={lt.id}>{lt.name} — {lt.base_interest_rate}% p.a.</option>
                ))}
              </select>
            </div>

            {selectedType && (
              <div className="alert alert-info" style={{ marginBottom: 20 }}>
                <Info size={15} />
                <div style={{ fontSize: '0.82rem' }}>
                  Amount: {formatCurrency(selectedType.min_amount)} – {formatCurrency(selectedType.max_amount)} | 
                  Tenure: {selectedType.min_tenure_months}–{selectedType.max_tenure_months} months | 
                  Processing fee: {selectedType.processing_fee_percent}%
                </div>
              </div>
            )}

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Loan Amount (₹) *</label>
                <input className="form-input" type="number" placeholder="500000"
                  min={selectedType?.min_amount} max={selectedType?.max_amount} step="1000"
                  value={form.requested_amount} onChange={set('requested_amount')} required />
                {selectedType && <p className="form-error" style={{ color: 'var(--text3)' }}>
                  {formatCurrency(selectedType.min_amount)} to {formatCurrency(selectedType.max_amount)}
                </p>}
              </div>

              <div className="form-group">
                <label className="form-label">Tenure (Months) *</label>
                <input className="form-input" type="number" placeholder="24"
                  min={selectedType?.min_tenure_months} max={selectedType?.max_tenure_months}
                  value={form.tenure_months} onChange={set('tenure_months')} required />
                {selectedType && <p className="form-error" style={{ color: 'var(--text3)' }}>
                  {selectedType.min_tenure_months} to {selectedType.max_tenure_months} months
                </p>}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Loan Purpose</label>
              <textarea className="form-textarea" placeholder="Describe the purpose of this loan..."
                value={form.purpose} onChange={set('purpose')} />
            </div>

            <button className="btn btn-primary btn-lg" style={{ width: '100%', justifyContent: 'center' }}
              disabled={loading || !isEligible || !form.loan_type_id}>
              {loading ? <><span className="spinner" />Submitting…</> : 'Submit Application'}
            </button>
          </form>
        </div>

        {/* Right Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* EMI Calculator */}
          {estimatedEMI > 0 && (
            <div className="card" style={{ border: '1px solid rgba(59,130,246,0.3)' }}>
              <div className="card-title"><Calculator size={16} color="var(--primary)" /> EMI Estimate</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)', marginBottom: 16 }}>
                {formatCurrency(estimatedEMI)}<span style={{ fontSize: '0.9rem', fontWeight: 400, color: 'var(--text2)' }}>/mo</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Principal', value: formatCurrency(form.requested_amount) },
                  { label: 'Total Interest', value: formatCurrency(totalInterest) },
                  { label: 'Total Payable', value: formatCurrency(totalPayable) },
                  { label: 'Processing Fee', value: formatCurrency(form.requested_amount * (selectedType?.processing_fee_percent || 0) / 100) },
                  { label: 'Interest Rate', value: `${selectedType?.base_interest_rate}% p.a.` },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text2)' }}>{r.label}</span>
                    <span style={{ fontWeight: 600 }}>{r.value}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: '0.72rem', color: 'var(--text3)', marginTop: 12 }}>
                * Final rate depends on your credit score. Actual EMI may vary.
              </p>
            </div>
          )}

          {/* Eligibility */}
          {selectedType && (
            <div className="card">
              <div className="card-title">Eligibility Check</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {eligibilityChecks.map(c => (
                  <div key={c.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {c.ok
                        ? <CheckCircle size={16} color="var(--success)" />
                        : <AlertCircle size={16} color="var(--danger)" />}
                      <span style={{ fontSize: '0.85rem' }}>{c.label}</span>
                    </div>
                    <span style={{ fontSize: '0.8rem', color: c.ok ? 'var(--success)' : 'var(--danger)' }}>{c.value}</span>
                  </div>
                ))}
                {!isEligible && (
                  <div className="alert alert-error" style={{ marginTop: 4 }}>
                    <AlertCircle size={14} />
                    <span style={{ fontSize: '0.82rem' }}>You don't meet all eligibility criteria for this loan type.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}