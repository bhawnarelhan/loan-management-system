import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Handle 401
api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)

// ─── Auth ─────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (email, password) => {
    const form = new URLSearchParams()
    form.append('username', email)
    form.append('password', password)
    return api.post('/auth/login', form, { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } })
  },
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
}

// ─── Loan Types ───────────────────────────────────────────────
export const loanTypesAPI = {
  getAll: () => api.get('/loans/types'),
  getOne: (id) => api.get(`/loans/types/${id}`),
}

// ─── Applications ─────────────────────────────────────────────
export const applicationsAPI = {
  apply: (data) => api.post('/loans/apply', data),
  myApplications: (status) => api.get('/loans/my-applications', { params: status ? { status } : {} }),
  getAll: (params) => api.get('/loans/all', { params }),
  getOne: (id) => api.get(`/loans/${id}`),
  review: (id, data) => api.post(`/loans/${id}/review`, data),
  disburse: (id) => api.post(`/loans/${id}/disburse`),
  getEMISchedule: (id) => api.get(`/loans/${id}/emi-schedule`),
  getPayments: (id) => api.get(`/loans/${id}/payments`),
}

// ─── Payments ─────────────────────────────────────────────────
export const paymentsAPI = {
  record: (data) => api.post('/loans/payments/record', data),
}

// ─── Reports ─────────────────────────────────────────────────
export const reportsAPI = {
  dashboard: () => api.get('/reports/dashboard'),
  customerDashboard: () => api.get('/reports/customer-dashboard'),
  defaulters: () => api.get('/reports/defaulters'),
  repaymentRanking: () => api.get('/reports/repayment-ranking'),
  activeLoans: () => api.get('/reports/active-loans'),
  paymentLogs: (limit) => api.get('/reports/payment-logs', { params: { limit } }),
}

// ─── Admin ────────────────────────────────────────────────────
export const adminAPI = {
  listUsers: (params) => api.get('/admin/users', { params }),
  toggleActive: (id) => api.patch(`/admin/users/${id}/toggle-active`),
  updateCreditScore: (id, score) => api.patch(`/admin/users/${id}/update-credit-score`, null, { params: { score } }),
}

export default api