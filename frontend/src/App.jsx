import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Sidebar from './components/Sidebar'

import Login           from './pages/Login'
import AdminDashboard  from './pages/AdminDashboard'
import RFQPage         from './pages/RFQPage'
import VendorsPage     from './pages/VendorsPage'
import ProductsPage    from './pages/ProductsPage'
import QuotesPage      from './pages/QuotesPage'
import AIReviewPage    from './pages/AIReviewPage'
import POPage          from './pages/POPage'
import DeliveryPage    from './pages/DeliveryPage'
import FinancePage     from './pages/FinancePage'
import VendorDashboard from './pages/VendorDashboard'

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-center"><div className="spinner"/><span>Loading…</span></div>
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) return <Navigate to={user.role === 'admin' ? '/dashboard' : '/vendor-dashboard'} replace />
  return children
}

const AppLayout = ({ children }) => (
  <div className="app-layout">
    <Sidebar />
    <main className="main-content">{children}</main>
  </div>
)

function AppRoutes() {
  const { user } = useAuth()
  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to={user.role === 'admin' ? '/dashboard' : '/vendor-dashboard'} /> : <Login />} />

      {/* Admin Routes */}
      <Route path="/dashboard"  element={<ProtectedRoute role="admin"><AppLayout><AdminDashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/rfq"        element={<ProtectedRoute role="admin"><AppLayout><RFQPage /></AppLayout></ProtectedRoute>} />
      <Route path="/vendors"    element={<ProtectedRoute role="admin"><AppLayout><VendorsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/products"   element={<ProtectedRoute role="admin"><AppLayout><ProductsPage /></AppLayout></ProtectedRoute>} />
      <Route path="/quotes"     element={<ProtectedRoute role="admin"><AppLayout><QuotesPage /></AppLayout></ProtectedRoute>} />
      <Route path="/ai-review"  element={<ProtectedRoute role="admin"><AppLayout><AIReviewPage /></AppLayout></ProtectedRoute>} />
      <Route path="/po"         element={<ProtectedRoute role="admin"><AppLayout><POPage /></AppLayout></ProtectedRoute>} />
      <Route path="/delivery"   element={<ProtectedRoute role="admin"><AppLayout><DeliveryPage /></AppLayout></ProtectedRoute>} />
      <Route path="/finance"    element={<ProtectedRoute role="admin"><AppLayout><FinancePage /></AppLayout></ProtectedRoute>} />

      {/* Vendor Routes */}
      <Route path="/vendor-dashboard" element={<ProtectedRoute role="vendor"><AppLayout><VendorDashboard /></AppLayout></ProtectedRoute>} />
      <Route path="/my-rfqs"          element={<ProtectedRoute role="vendor"><AppLayout><RFQPage /></AppLayout></ProtectedRoute>} />
      <Route path="/submit-quote"     element={<ProtectedRoute role="vendor"><AppLayout><QuotesPage /></AppLayout></ProtectedRoute>} />
      <Route path="/my-quotes"        element={<ProtectedRoute role="vendor"><AppLayout><QuotesPage /></AppLayout></ProtectedRoute>} />

      <Route path="*" element={<Navigate to={user ? (user.role === 'admin' ? '/dashboard' : '/vendor-dashboard') : '/login'} replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
