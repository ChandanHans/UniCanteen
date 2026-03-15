import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiUsers, FiShoppingBag, FiDollarSign, FiCalendar } from 'react-icons/fi'
import api from '../../services/api'

export default function SuperAdminDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/super-admin/dashboard')
      .then(({ data }) => setStats(data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>
  if (!stats) return null

  const cards = [
    { label: 'Total Users', value: stats.totalUsers, icon: FiUsers, color: 'bg-blue-500' },
    { label: 'Total Orders', value: stats.totalOrders, icon: FiShoppingBag, color: 'bg-green-500' },
    { label: "Today's Orders", value: stats.todayOrders, icon: FiCalendar, color: 'bg-orange-500' },
    { label: 'Total Revenue', value: `₹${Number(stats.totalRevenue)}`, icon: FiDollarSign, color: 'bg-purple-500' },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>

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

      {/* Canteen Stats */}
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Canteens</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.canteenStats.map((canteen) => (
          <div key={canteen.id} className="card p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">{canteen.name}</h3>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                canteen.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {canteen.isOpen ? 'Open' : 'Closed'}
              </span>
            </div>
            <p className="text-sm text-gray-500">{canteen._count.orders} total orders</p>
          </div>
        ))}
      </div>

      <div className="flex gap-4">
        <Link to="/super-admin/canteens" className="btn-primary">Manage Canteens</Link>
        <Link to="/super-admin/users" className="btn-secondary">Manage Users</Link>
      </div>
    </div>
  )
}
