import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import AuthPage from './pages/AuthPage'
import ManagerDashboard from './pages/ManagerDashboard'
import CustomerDashboard from './pages/CustomerDashboard'
import AllApplications from './pages/AllApplications'
import MyApplications from './pages/MyApplications'
import ApplicationDetail from './pages/ApplicationDetail'
import ApplyLoan from './pages/ApplyLoan'
import {
  DefaultersPage, RepaymentRankingPage,
  ActiveLoansPage, CustomersPage, PaymentLogsPage
} from './pages/ReportPages'

function ProtectedRoute({ children, requireManager = false }) {
  const { user, isManager } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  if (requireManager && !isManager) return <Navigate to="/dashboard" replace />
  return children
}

function DashboardRouter() {
  const { isManager } = useAuth()
  return isManager ? <ManagerDashboard /> : <CustomerDashboard />
}

function AppRoutes() {
  const { user } = useAuth()

  return (
    <Routes>
      <Route path="/login" element={!user ? <AuthPage /> : <Navigate to="/dashboard" replace />} />

      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardRouter />} />

        {/* Customer routes */}
        <Route path="apply" element={<ApplyLoan />} />
        <Route path="my-applications" element={<MyApplications />} />
        <Route path="my-applications/:id" element={<ApplicationDetail />} />

        {/* Manager routes */}
        <Route path="applications" element={<ProtectedRoute requireManager><AllApplications /></ProtectedRoute>} />
        <Route path="applications/:id" element={<ProtectedRoute requireManager><ApplicationDetail /></ProtectedRoute>} />
        <Route path="active-loans" element={<ProtectedRoute requireManager><ActiveLoansPage /></ProtectedRoute>} />
        <Route path="customers" element={<ProtectedRoute requireManager><CustomersPage /></ProtectedRoute>} />
        <Route path="defaulters" element={<ProtectedRoute requireManager><DefaultersPage /></ProtectedRoute>} />
        <Route path="repayment-ranking" element={<ProtectedRoute requireManager><RepaymentRankingPage /></ProtectedRoute>} />
        <Route path="payment-logs" element={<ProtectedRoute requireManager><PaymentLogsPage /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

// Layout needs to render children as outlet
import { Outlet } from 'react-router-dom'
function LayoutWrapper() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: 'var(--card)',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              fontFamily: 'var(--font)',
              fontSize: '0.88rem',
            },
            success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
            error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
          }}
        />
        <Routes>
          <Route path="/login" element={<AuthPageWrapper />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

function AuthPageWrapper() {
  const { user } = useAuth()
  return user ? <Navigate to="/dashboard" replace /> : <AuthPage />
}

function ProtectedLayout() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return (
    <Layout>
      <Routes>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardRouter />} />
        <Route path="apply" element={<ApplyLoan />} />
        <Route path="my-applications" element={<MyApplications />} />
        <Route path="my-applications/:id" element={<ApplicationDetail />} />
        <Route path="applications" element={<ManagerOnly><AllApplications /></ManagerOnly>} />
        <Route path="applications/:id" element={<ManagerOnly><ApplicationDetail /></ManagerOnly>} />
        <Route path="active-loans" element={<ManagerOnly><ActiveLoansPage /></ManagerOnly>} />
        <Route path="customers" element={<ManagerOnly><CustomersPage /></ManagerOnly>} />
        <Route path="defaulters" element={<ManagerOnly><DefaultersPage /></ManagerOnly>} />
        <Route path="repayment-ranking" element={<ManagerOnly><RepaymentRankingPage /></ManagerOnly>} />
        <Route path="payment-logs" element={<ManagerOnly><PaymentLogsPage /></ManagerOnly>} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Layout>
  )
}

function ManagerOnly({ children }) {
  const { isManager } = useAuth()
  return isManager ? children : <Navigate to="/dashboard" replace />
}