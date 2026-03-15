import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/layout/Navbar'

// Auth pages
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'

// Student pages
import Home from './pages/student/Home'
import CanteenMenu from './pages/student/CanteenMenu'
import Cart from './pages/student/Cart'
import Checkout from './pages/student/Checkout'
import OrderTracking from './pages/student/OrderTracking'
import OrderHistory from './pages/student/OrderHistory'
import Profile from './pages/student/Profile'

// Admin pages
import AdminDashboard from './pages/admin/Dashboard'
import OrderManager from './pages/admin/OrderManager'
import MenuManager from './pages/admin/MenuManager'
import AdminSettings from './pages/admin/Settings'

// Super Admin pages
import SuperAdminDashboard from './pages/superadmin/Dashboard'
import ManageCanteens from './pages/superadmin/ManageCanteens'
import ManageUsers from './pages/superadmin/ManageUsers'

// Shared pages
import Notifications from './pages/Notifications'

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>
  if (!user) return <Navigate to="/login" />
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (user) {
    if (user.role === 'SUPER_ADMIN') return <Navigate to="/super-admin" />
    if (user.role === 'CANTEEN_ADMIN') return <Navigate to="/admin" />
    return <Navigate to="/" />
  }
  return children
}

export default function App() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      {user && <Navbar />}
      <Routes>
        {/* Public Auth routes */}
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        {/* Student routes */}
        <Route path="/" element={<ProtectedRoute roles={['STUDENT']}><Home /></ProtectedRoute>} />
        <Route path="/canteen/:id" element={<ProtectedRoute roles={['STUDENT']}><CanteenMenu /></ProtectedRoute>} />
        <Route path="/cart" element={<ProtectedRoute roles={['STUDENT']}><Cart /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute roles={['STUDENT']}><Checkout /></ProtectedRoute>} />
        <Route path="/order/:id" element={<ProtectedRoute roles={['STUDENT', 'CANTEEN_ADMIN']}><OrderTracking /></ProtectedRoute>} />
        <Route path="/orders" element={<ProtectedRoute roles={['STUDENT']}><OrderHistory /></ProtectedRoute>} />

        {/* Canteen Admin routes */}
        <Route path="/admin" element={<ProtectedRoute roles={['CANTEEN_ADMIN']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute roles={['CANTEEN_ADMIN']}><OrderManager /></ProtectedRoute>} />
        <Route path="/admin/menu" element={<ProtectedRoute roles={['CANTEEN_ADMIN']}><MenuManager /></ProtectedRoute>} />
        <Route path="/admin/settings" element={<ProtectedRoute roles={['CANTEEN_ADMIN']}><AdminSettings /></ProtectedRoute>} />

        {/* Super Admin routes */}
        <Route path="/super-admin" element={<ProtectedRoute roles={['SUPER_ADMIN']}><SuperAdminDashboard /></ProtectedRoute>} />
        <Route path="/super-admin/canteens" element={<ProtectedRoute roles={['SUPER_ADMIN']}><ManageCanteens /></ProtectedRoute>} />
        <Route path="/super-admin/users" element={<ProtectedRoute roles={['SUPER_ADMIN']}><ManageUsers /></ProtectedRoute>} />

        {/* Shared routes */}
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  )
}
