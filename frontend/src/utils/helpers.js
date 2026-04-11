export const formatCurrency = (amount) => {
  if (amount == null) return '—'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount)
}

export const formatDate = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric'
  })
}

export const formatDateTime = (dateStr) => {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

export const getStatusBadge = (status) => {
  const map = {
    pending: 'badge-pending',
    under_review: 'badge-under_review',
    approved: 'badge-approved',
    rejected: 'badge-rejected',
    disbursed: 'badge-disbursed',
    closed: 'badge-closed',
    paid: 'badge-paid',
    overdue: 'badge-overdue',
  }
  return map[status] || 'badge-pending'
}

export const getErrorMessage = (err) => {
  const detail = err?.response?.data?.detail
  if (!detail) return err?.message || 'An error occurred'
  if (typeof detail === 'string') return detail
  if (detail?.errors) return detail.errors.join(', ')
  return JSON.stringify(detail)
}

export const calculateEMI = (principal, annualRate, tenureMonths) => {
  const r = annualRate / 100 / 12
  const emi = principal * r * Math.pow(1 + r, tenureMonths) / (Math.pow(1 + r, tenureMonths) - 1)
  return Math.round(emi)
}