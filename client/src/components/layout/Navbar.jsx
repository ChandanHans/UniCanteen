import { Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { FiShoppingCart, FiMenu, FiX, FiBell, FiLogOut, FiUser, FiSettings } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'
import { useSocket } from '../../context/SocketContext'
import api from '../../services/api'
import suLogo from '../../assets/images/suniv_logo.png'

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
    <nav className="bg-gradient-to-r from-primary-900 via-primary-800 to-accent-700 shadow-lg sticky top-0 z-50 border-b border-primary-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex justify-between items-center h-16">
          <Link to={getDashboardLink()} className="flex items-center gap-3">
            <div className="rounded-full bg-gradient-to-br from-accent-400 to-primary-500 p-[3px] shadow-md">
              <div className="rounded-full bg-primary-700 p-[3px]">
                <img src={suLogo} alt="SU Logo" className="h-9 w-9 rounded-full object-contain" style={{filter:'brightness(0) invert(1)'}} />
              </div>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-bold text-lg text-white tracking-wide">SU-Canteen</span>
              <span className="text-xs text-accent-300 font-medium">Sambalpur University</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {user ? (
              <>
                {user.role === 'STUDENT' && (
                  <>
                    <Link to="/" className="text-primary-100 hover:text-white transition-colors">Canteens</Link>
                    <Link to="/orders" className="text-primary-100 hover:text-white transition-colors">My Orders</Link>
                    <Link to="/cart" className="relative text-primary-100 hover:text-white transition-colors">
                      <FiShoppingCart size={22} />
                      {itemCount > 0 && (
                        <span className="absolute -top-2 -right-2 bg-primary-400 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                          {itemCount}
                        </span>
                      )}
                    </Link>
                  </>
                )}
                {user.role === 'CANTEEN_ADMIN' && (
                  <>
                    <Link to="/admin" className="text-primary-100 hover:text-white transition-colors">Dashboard</Link>
                    <Link to="/admin/orders" className="text-primary-100 hover:text-white transition-colors">Orders</Link>
                    <Link to="/admin/menu" className="text-primary-100 hover:text-white transition-colors">Menu</Link>
                    <Link to="/admin/settings" className="text-primary-100 hover:text-white transition-colors" title="Settings">
                      <FiSettings size={20} />
                    </Link>
                  </>
                )}
                {user.role === 'SUPER_ADMIN' && (
                  <>
                    <Link to="/super-admin" className="text-primary-100 hover:text-white transition-colors">Dashboard</Link>
                    <Link to="/super-admin/canteens" className="text-primary-100 hover:text-white transition-colors">Canteens</Link>
                    <Link to="/super-admin/users" className="text-primary-100 hover:text-white transition-colors">Users</Link>
                  </>
                )}
                <Link to="/notifications" className="relative text-primary-100 hover:text-white transition-colors">
                  <FiBell size={20} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Link>
                <Link to="/profile" className="text-primary-100 hover:text-white transition-colors">
                  <FiUser size={20} />
                </Link>
                <button onClick={handleLogout} className="text-primary-100 hover:text-red-400 transition-colors">
                  <FiLogOut size={20} />
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-primary-100 hover:text-white transition-colors">Login</Link>
                <Link to="/register" className="bg-white text-primary-800 hover:bg-primary-50 font-semibold text-sm py-2 px-4 rounded-lg transition-colors">Register</Link>
              </>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden text-white" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {menuOpen && (
          <div className="md:hidden pb-4 space-y-2 border-t border-primary-700 pt-3">
            {user ? (
              <>
                {user.role === 'STUDENT' && (
                  <>
                    <Link to="/" className="block py-2 text-primary-100 hover:text-white" onClick={() => setMenuOpen(false)}>Canteens</Link>
                    <Link to="/orders" className="block py-2 text-primary-100 hover:text-white" onClick={() => setMenuOpen(false)}>My Orders</Link>
                    <Link to="/cart" className="block py-2 text-primary-100 hover:text-white" onClick={() => setMenuOpen(false)}>Cart ({itemCount})</Link>
                  </>
                )}
                {user.role === 'CANTEEN_ADMIN' && (
                  <>
                    <Link to="/admin" className="block py-2 text-primary-100 hover:text-white" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                    <Link to="/admin/orders" className="block py-2 text-primary-100 hover:text-white" onClick={() => setMenuOpen(false)}>Orders</Link>
                    <Link to="/admin/menu" className="block py-2 text-primary-100 hover:text-white" onClick={() => setMenuOpen(false)}>Menu</Link>
                    <Link to="/admin/settings" className="block py-2 text-primary-100 hover:text-white" onClick={() => setMenuOpen(false)}>Settings</Link>
                  </>
                )}
                {user.role === 'SUPER_ADMIN' && (
                  <>
                    <Link to="/super-admin" className="block py-2 text-primary-100 hover:text-white" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                    <Link to="/super-admin/canteens" className="block py-2 text-primary-100 hover:text-white" onClick={() => setMenuOpen(false)}>Canteens</Link>
                    <Link to="/super-admin/users" className="block py-2 text-primary-100 hover:text-white" onClick={() => setMenuOpen(false)}>Users</Link>
                  </>
                )}
                <Link to="/profile" className="block py-2 text-primary-100 hover:text-white" onClick={() => setMenuOpen(false)}>Profile</Link>
                <button onClick={handleLogout} className="block py-2 text-red-400 hover:text-red-300">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block py-2 text-primary-100 hover:text-white" onClick={() => setMenuOpen(false)}>Login</Link>
                <Link to="/register" className="block py-2 text-primary-100 hover:text-white" onClick={() => setMenuOpen(false)}>Register</Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  )
}
