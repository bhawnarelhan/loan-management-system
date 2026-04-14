import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  LayoutDashboard, FileText, CreditCard, Users,
  BarChart2, LogOut, Building2, Clock, AlertTriangle,
  TrendingUp, Activity, ChevronRight
} from 'lucide-react'

const NavItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
  >
    <Icon size={18} />
    <span>{label}</span>
  </NavLink>
)

export default function Sidebar({ onClose }) {
  const { user, logout, isManager } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Building2 size={22} color="#3b82f6" />
        </div>
        <div>
          <div className="logo-text">LoanPro</div>
          <div className="logo-sub">Banking System</div>
        </div>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">{user?.full_name?.[0]?.toUpperCase()}</div>
        <div className="user-info">
          <div className="user-name">{user?.full_name}</div>
          <div className="user-role">{user?.role}</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Main</div>

        {isManager ? (
          <>
            <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
            <NavItem to="/applications" icon={FileText} label="All Applications" />
            <NavItem to="/active-loans" icon={CreditCard} label="Active Loans" />
            <NavItem to="/customers" icon={Users} label="Customers" />
          </>
        ) : (
          <>
            <NavItem to="/dashboard" icon={LayoutDashboard} label="My Dashboard" />
            <NavItem to="/my-applications" icon={FileText} label="My Applications" />
            <NavItem to="/apply" icon={CreditCard} label="Apply for Loan" />
          </>
        )}

        {isManager && (
          <>
            <div className="nav-section-label" style={{ marginTop: 16 }}>Reports</div>
            <NavItem to="/defaulters" icon={AlertTriangle} label="Defaulters" />
            <NavItem to="/repayment-ranking" icon={TrendingUp} label="Repayment Ranking" />
            <NavItem to="/payment-logs" icon={Activity} label="Payment Logs" />
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="credit-score-badge">
          <span style={{ fontSize: '0.75rem', color: 'var(--text2)' }}>Credit Score</span>
          <span style={{
            fontSize: '1.1rem', fontWeight: 700,
            color: user?.credit_score >= 750 ? 'var(--success)' :
              user?.credit_score >= 700 ? 'var(--primary)' : 'var(--warning)'
          }}>
            {user?.credit_score}
          </span>
        </div>
        <button onClick={handleLogout} className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'center' }}>
          <LogOut size={15} /> Logout
        </button>
      </div>
    </aside>
  )
}