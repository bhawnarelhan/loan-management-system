import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { reportsAPI, applicationsAPI } from '../utils/api'
import { formatCurrency, formatDateTime, getStatusBadge } from '../utils/helpers'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts'
import { FileText, DollarSign, CheckCircle, XCircle, Clock, AlertTriangle, TrendingUp, Activity } from 'lucide-react'
import { Link } from 'react-router-dom'

const COLORS = ['#f59e0b', '#3b82f6', '#22c55e', '#ef4444', '#8b5cf6', '#64748b']

export default function ManagerDashboard() {
  const [stats, setStats] = useState(null)
  const [recentApps, setRecentApps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      reportsAPI.dashboard(),
      applicationsAPI.getAll({ limit: 8 })
    ]).then(([s, a]) => {
      setStats(s.data)
      setRecentApps(a.data)
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
      <span className="spinner" style={{ width: 32, height: 32 }} />
    </div>
  )

  const statCards = [
    { label: 'Total Applications', value: stats?.total_applications, icon: FileText, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)' },
    { label: 'Pending Review', value: stats?.pending_applications, icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    { label: 'Approved', value: stats?.approved_applications, icon: CheckCircle, color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
    { label: 'Rejected', value: stats?.rejected_applications, icon: XCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
    { label: 'Disbursed / Active', value: stats?.disbursed_applications, icon: TrendingUp, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)' },
    { label: 'Overdue EMIs', value: stats?.overdue_emis, icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  ]

  const pieData = [
    { name: 'Pending', value: stats?.pending_applications },
    { name: 'Approved', value: stats?.approved_applications },
    { name: 'Disbursed', value: stats?.disbursed_applications },
    { name: 'Rejected', value: stats?.rejected_applications },
  ].filter(d => d.value > 0)

  return (
    <div className="page">
      <div className="section-header">
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: 4 }}>Dashboard</h1>
          <p style={{ color: 'var(--text2)', fontSize: '0.88rem' }}>Overview of all loan operations</p>
        </div>
      </div>

      <div className="stats-grid">
        {statCards.map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>
              <s.icon size={18} color={s.color} />
            </div>
            <div className="stat-value" style={{ color: s.color }}>{s.value ?? 0}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Money Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 28 }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.1), rgba(59,130,246,0.03))' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Disbursed</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>{formatCurrency(stats?.total_disbursed_amount)}</div>
        </div>
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(34,197,94,0.03))' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Collected</div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--success)' }}>{formatCurrency(stats?.total_collected_amount)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 28 }}>
        {/* Pie Chart */}
        <div className="card">
          <div className="card-title"><Activity size={16} /> Application Status</div>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={4}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                </Pie>
                <Tooltip formatter={(v) => [v, 'Applications']} contentStyle={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="empty-state"><p>No data yet</p></div>}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
            {pieData.map((d, i) => (
              <div key={d.name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'var(--text2)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[i], display: 'inline-block' }} />
                {d.name} ({d.value})
              </div>
            ))}
          </div>
        </div>

        {/* Recent Applications */}
        <div className="card">
          <div className="card-title"><FileText size={16} /> Recent Applications</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {recentApps.slice(0, 6).map(app => (
              <Link key={app.id} to={`/applications/${app.id}`} style={{ textDecoration: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--bg3)', borderRadius: 8, transition: 'background 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--card2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'var(--bg3)'}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{app.customer?.full_name || 'Customer'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text3)' }}>{app.application_number}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>{formatCurrency(app.requested_amount)}</div>
                    <span className={`badge ${getStatusBadge(app.status)}`}>{app.status}</span>
                  </div>
                </div>
              </Link>
            ))}
            {recentApps.length === 0 && <div className="empty-state"><p>No applications yet</p></div>}
          </div>
          <Link to="/applications" className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center', marginTop: 12 }}>
            View All Applications →
          </Link>
        </div>
      </div>
    </div>
  )
}