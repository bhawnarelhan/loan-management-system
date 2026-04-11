import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import Sidebar from './Sidebar'

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="app-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="mobile-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      <Sidebar onClose={() => setSidebarOpen(false)} />

      <main className="main-content">
        <div className="mobile-header">
          <button onClick={() => setSidebarOpen(true)} className="btn btn-ghost btn-sm">
            <Menu size={20} />
          </button>
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>LoanPro</span>
          <div style={{ width: 40 }} />
        </div>

        <div className="content-inner">
          {children}
        </div>
      </main>

      <style>{`
        .app-layout {
          display: flex;
          min-height: 100vh;
        }
        .sidebar {
          width: 240px;
          min-height: 100vh;
          background: var(--bg2);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          padding: 20px 12px;
          position: sticky;
          top: 0;
          height: 100vh;
          overflow-y: auto;
          flex-shrink: 0;
        }
        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 4px 8px;
          margin-bottom: 20px;
        }
        .logo-icon {
          width: 38px; height: 38px;
          background: var(--primary-glow);
          border: 1px solid rgba(59,130,246,0.3);
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .logo-text { font-size: 1rem; font-weight: 800; color: var(--text); }
        .logo-sub { font-size: 0.7rem; color: var(--text3); font-weight: 400; }
        .sidebar-user {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          background: var(--card);
          border: 1px solid var(--border);
          border-radius: var(--radius-sm);
          margin-bottom: 20px;
        }
        .user-avatar {
          width: 34px; height: 34px;
          background: var(--primary);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 0.95rem;
          flex-shrink: 0;
        }
        .user-name { font-size: 0.85rem; font-weight: 600; color: var(--text); }
        .user-role { font-size: 0.72rem; color: var(--text3); text-transform: capitalize; }
        .sidebar-nav { flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .nav-section-label {
          font-size: 0.7rem; font-weight: 600;
          color: var(--text3); text-transform: uppercase; letter-spacing: 0.08em;
          padding: 4px 8px; margin-bottom: 4px;
        }
        .nav-item {
          display: flex; align-items: center; gap: 10px;
          padding: 9px 12px; border-radius: var(--radius-sm);
          color: var(--text2); text-decoration: none;
          font-size: 0.88rem; font-weight: 500;
          transition: all 0.2s;
        }
        .nav-item:hover { background: var(--card); color: var(--text); }
        .nav-item.active { background: var(--primary-glow); color: var(--primary); border: 1px solid rgba(59,130,246,0.2); }
        .sidebar-footer { margin-top: 16px; display: flex; flex-direction: column; gap: 10px; }
        .credit-score-badge {
          display: flex; justify-content: space-between; align-items: center;
          padding: 10px 14px;
          background: var(--card); border: 1px solid var(--border);
          border-radius: var(--radius-sm);
        }
        .main-content {
          flex: 1;
          min-width: 0;
          overflow-y: auto;
        }
        .content-inner { padding: 28px; max-width: 1400px; }
        .mobile-header {
          display: none;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          background: var(--bg2);
          border-bottom: 1px solid var(--border);
          position: sticky; top: 0; z-index: 10;
        }
        .mobile-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.5);
          z-index: 99;
        }
        @media (max-width: 768px) {
          .sidebar {
            position: fixed; left: 0; top: 0;
            z-index: 100;
            transform: translateX(${sidebarOpen ? '0' : '-100%'});
            transition: transform 0.3s;
          }
          .mobile-header { display: flex; }
          .content-inner { padding: 16px; }
        }
      `}</style>
    </div>
  )
}