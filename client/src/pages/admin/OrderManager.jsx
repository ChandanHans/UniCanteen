import { useState, useEffect } from 'react'
import { FiPhone } from 'react-icons/fi'
import api from '../../services/api'
import { useSocket } from '../../context/SocketContext'
import toast from 'react-hot-toast'

const TABS = ['CONFIRMED', 'PICKED_UP']

export default function OrderManager() {
  const [activeTab, setActiveTab] = useState('CONFIRMED')
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const socket = useSocket()

  function fetchOrders() {
    setLoading(true)
    api.get(`/orders/admin?status=${activeTab}&limit=50`)
      .then(({ data }) => setOrders(data.data.orders))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchOrders() }, [activeTab])

  useEffect(() => {
    if (!socket) return
    socket.on('order:new', () => {
      if (activeTab === 'CONFIRMED') fetchOrders()
      toast.success('New order received!')
    })
    return () => { socket.off('order:new') }
  }, [socket, activeTab])

  async function markPickedUp(orderId) {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: 'PICKED_UP' })
      toast.success('Marked as picked up')
      fetchOrders()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Order Management</h1>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {TABS.map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {tab === 'CONFIRMED' ? 'Ready to Pick Up' : 'Completed'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-gray-400">No orders here</div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-bold text-gray-900 text-lg">{order.orderNumber}</span>
                  <span className="text-sm text-gray-400 ml-2">{new Date(order.createdAt).toLocaleTimeString()}</span>
                  {order.meal && (
                    <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                      {order.meal === 'LUNCH' ? '🌞 Lunch' : '🌙 Dinner'}
                    </span>
                  )}
                </div>
                <span className="font-semibold text-lg">₹{Number(order.totalAmount)}</span>
              </div>

              <div className="flex items-center gap-2 mb-3 text-sm text-gray-600">
                <span className="font-medium">{order.user?.name}</span>
                {order.user?.phone && (
                  <a href={`tel:${order.user.phone}`} className="flex items-center gap-1 text-primary-600">
                    <FiPhone size={14} /> {order.user.phone}
                  </a>
                )}
              </div>

              <div className="space-y-1 mb-3">
                {order.items.map((item) => (
                  <div key={item.id} className="text-sm text-gray-600">
                    {item.itemName} x {item.quantity} — ₹{Number(item.unitPrice) * item.quantity}
                  </div>
                ))}
              </div>

              {order.specialInstructions && (
                <p className="text-sm text-orange-600 bg-orange-50 px-3 py-1.5 rounded mb-3">
                  Note: {order.specialInstructions}
                </p>
              )}

              {order.status === 'CONFIRMED' && (
                <button onClick={() => markPickedUp(order.id)} className="btn-primary text-sm">
                  Mark Picked Up
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
