import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { FiShoppingCart, FiMenu, FiX, FiBell, FiLogOut, FiUser, FiSettings } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useSocket } from '../../context/SocketContext'
import api from '../../services/api'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { itemCount } = useCart()
  const socket = useSocket()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (user) {
      api.get('/notifications').then(({ data }) => setUnreadCount(data.data.unreadCount)).catch(() => {})
    }
  }, [user])

  useEffect(() => {
    if (!socket) return
    socket.on('notification:new', () => setUnreadCount((c) => c + 1))
    socket.on('order:statusUpdate', () => setUnreadCount((c) => c + 1))
    return () => {
      socket.off('notification:new')
      socket.off('order:statusUpdate')
    }
  }, [socket])

  function handleLogout() {
    logout()
    navigate('/login')
  }

  function getDashboardLink() {
    if (user?.role === 'SUPER_ADMIN') return '/super-admin'
    if (user?.role === 'CANTEEN_ADMIN') return '/admin'
    return '/'
  }

  return (
    <nav className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          <Link to={getDashboardLink()} className="flex items-center gap-2">
            <span className="text-2xl">🍽️</span>
            <span className="font-bold text-xl text-gray-900">UniCanteen</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                {user.role === 'STUDENT' && (
                  <>
                    <Link to="/" className="text-gray-600 hover:text-gray-900">Canteens</Link>
                    <Link to="/orders" className="text-gray-600 hover:text-gray-900">My Orders</Link>
                    <Link to="/cart" className="relative text-gray-600 hover:text-gray-900">
                      <FiShoppingCart size={22} />
                      {itemCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-primary-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {itemCount}
                        </span>
                      )}
                    </Link>
                  </>
                )}
                {user.role === 'CANTEEN_ADMIN' && (
                  <>
                    <Link to="/admin" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
                    <Link to="/admin/orders" className="text-gray-600 hover:text-gray-900">Orders</Link>
                    <Link to="/admin/menu" className="text-gray-600 hover:text-gray-900">Menu</Link>
                    <Link to="/admin/settings" className="text-gray-600 hover:text-gray-900" title="Settings">
                      <FiSettings size={20} />
                    </Link>
                  </>
                )}
                {user.role === 'SUPER_ADMIN' && (
                  <>
                    <Link to="/super-admin" className="text-gray-600 hover:text-gray-900">Dashboard</Link>
                    <Link to="/super-admin/canteens" className="text-gray-600 hover:text-gray-900">Canteens</Link>
                    <Link to="/super-admin/users" className="text-gray-600 hover:text-gray-900">Users</Link>
                  </>
                )}
                <Link to="/notifications" className="relative text-gray-600 hover:text-gray-900">
                  <FiBell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link to="/profile" className="text-gray-600 hover:text-gray-900">
                  <FiUser size={20} />
                </Link>
                <button onClick={handleLogout} className="text-gray-600 hover:text-red-600">
                  <FiLogOut size={20} />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-gray-600 hover:text-gray-900">Login</Link>
                <Link to="/register" className="btn-primary text-sm">Register</Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2">
            {user ? (
              <>
                {user.role === 'STUDENT' && (
                  <>
                    <Link to="/" className="block py-2 text-gray-600" onClick={() => setMenuOpen(false)}>Canteens</Link>
                    <Link to="/orders" className="block py-2 text-gray-600" onClick={() => setMenuOpen(false)}>My Orders</Link>
                    <Link to="/cart" className="block py-2 text-gray-600" onClick={() => setMenuOpen(false)}>Cart ({itemCount})</Link>
                  </>
                )}
                {user.role === 'CANTEEN_ADMIN' && (
                  <>
                    <Link to="/admin" className="block py-2 text-gray-600" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                    <Link to="/admin/orders" className="block py-2 text-gray-600" onClick={() => setMenuOpen(false)}>Orders</Link>
                    <Link to="/admin/menu" className="block py-2 text-gray-600" onClick={() => setMenuOpen(false)}>Menu</Link>
                    <Link to="/admin/settings" className="block py-2 text-gray-600" onClick={() => setMenuOpen(false)}>Settings</Link>
                  </>
                )}
                {user.role === 'SUPER_ADMIN' && (
                  <>
                    <Link to="/super-admin" className="block py-2 text-gray-600" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                    <Link to="/super-admin/canteens" className="block py-2 text-gray-600" onClick={() => setMenuOpen(false)}>Canteens</Link>
                    <Link to="/super-admin/users" className="block py-2 text-gray-600" onClick={() => setMenuOpen(false)}>Users</Link>
                  </>
                )}
                <Link to="/profile" className="block py-2 text-gray-600" onClick={() => setMenuOpen(false)}>Profile</Link>
                <button onClick={handleLogout} className="block py-2 text-red-600">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block py-2 text-gray-600" onClick={() => setMenuOpen(false)}>Login</Link>
                <Link to="/register" className="block py-2 text-gray-600" onClick={() => setMenuOpen(false)}>Register</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
