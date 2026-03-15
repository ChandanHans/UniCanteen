import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../services/api'

const STATUS_COLORS = { PLACED: 'bg-yellow-100 text-yellow-700', CONFIRMED: 'bg-green-100 text-green-700', PICKED_UP: 'bg-gray-100 text-gray-700', CANCELLED: 'bg-red-100 text-red-700' }

export default function OrderHistory() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    setLoading(true)
    api.get(`/orders?page=${page}&limit=10`).then(({ data }) => {
      setOrders(data.data.orders)
      setTotalPages(data.data.totalPages)
    }).catch(() => {}).finally(() => setLoading(false))
  }, [page])

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <span className="text-5xl block mb-4">📦</span>
          <p className="text-gray-500 mb-4">No orders yet</p>
          <Link to="/" className="btn-primary inline-block">Browse Canteens</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link key={order.id} to={`/order/${order.id}`} className="card p-4 block hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="font-semibold text-gray-900">{order.orderNumber}</span>
                  <span className="text-sm text-gray-400 ml-2">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[order.status]}`}>
                  {order.status.replace('_', ' ')}
                </span>
              </div>
              <p className="text-sm text-gray-500">{order.canteen?.name}</p>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-gray-400">{order.items.length} item(s)</span>
                <span className="font-semibold text-gray-900">₹{Number(order.totalAmount)}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="btn-secondary text-sm disabled:opacity-50">Previous</button>
          <span className="flex items-center text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="btn-secondary text-sm disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  )
}
