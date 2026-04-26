import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiShoppingBag, FiDollarSign, FiClock, FiTrendingUp } from 'react-icons/fi'
import api from '../../services/api'
import { useSocket } from '../../context/SocketContext'
import toast from 'react-hot-toast'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const socket = useSocket()

  function fetchStats() {
    api.get('/orders/admin/stats').then(({ data }) => setStats(data.data)).catch(() => {})
  }

  useEffect(() => { fetchStats() }, [])

  useEffect(() => {
    if (!socket) return
    socket.on('order:new', (data) => {
      toast.success(`New order: ${data.orderNumber}`)
      fetchStats()
    })
    return () => { socket.off('order:new') }
  }, [socket])

  if (!stats) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>

  const cards = [
    { label: "Today's Orders", value: stats.todayOrders, icon: FiShoppingBag, color: 'bg-blue-500' },
    { label: "Today's Revenue", value: `₹${Number(stats.todayRevenue)}`, icon: FiDollarSign, color: 'bg-green-500' },
    { label: 'Active Orders', value: stats.activeOrders, icon: FiClock, color: 'bg-orange-500' },
    { label: 'Total Orders', value: stats.totalOrders, icon: FiTrendingUp, color: 'bg-purple-500' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Canteen Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => (
          <div key={card.label} className="card p-5">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${card.color} text-white`}>
                <card.icon size={24} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <Link to="/admin/orders" className="btn-primary">Manage Orders</Link>
        <Link to="/admin/menu" className="btn-secondary">Manage Menu</Link>
      </div>
    </div>
  )
}
