import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FiArrowLeft } from 'react-icons/fi'
import api from '../../services/api'
import { useSocket } from '../../context/SocketContext'

const STATUS_STEPS = ['PLACED', 'CONFIRMED', 'PICKED_UP']
const STATUS_LABELS = { PLACED: 'Order Placed', CONFIRMED: 'Confirmed & Ready', PICKED_UP: 'Picked Up', CANCELLED: 'Cancelled' }
const STATUS_ICONS = { PLACED: '📝', CONFIRMED: '✅', PICKED_UP: '🎉', CANCELLED: '❌' }
const STATUS_COLORS = { PLACED: 'bg-yellow-500', CONFIRMED: 'bg-green-500', PICKED_UP: 'bg-gray-500', CANCELLED: 'bg-red-500' }

export default function OrderTracking() {
  const { id } = useParams()
  const socket = useSocket()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/orders/${id}`).then(({ data }) => setOrder(data.data))
      .catch(() => {}).finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    if (!socket || !id) return
    socket.emit('join:order', id)
    socket.on('order:statusUpdate', (data) => {
      if (data.orderId === id) {
        setOrder((prev) => prev ? { ...prev, status: data.status } : prev)
      }
    })
    return () => {
      socket.emit('leave:order', id)
      socket.off('order:statusUpdate')
    }
  }, [socket, id])

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>
  if (!order) return <div className="text-center py-20 text-gray-400">Order not found</div>

  const currentStep = STATUS_STEPS.indexOf(order.status)
  const isCancelled = order.status === 'CANCELLED'

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link to="/orders" className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4">
        <FiArrowLeft /> Back to orders
      </Link>

      <div className="card p-6 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Order {order.orderNumber}</h1>
            <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleString()}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-sm font-medium text-white ${STATUS_COLORS[order.status]}`}>
            {STATUS_LABELS[order.status]}
          </span>
        </div>

        {order.meal && (
          <p className="text-sm text-primary-600 font-medium mb-4">
            {order.meal === 'LUNCH' ? '🌞 Lunch' : '🌙 Dinner'} order
          </p>
        )}

        {/* Simplified Status Stepper */}
        {!isCancelled && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              {STATUS_STEPS.map((step, i) => (
                <div key={step} className="flex flex-col items-center flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg ${
                    i <= currentStep ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>
                    {i <= currentStep ? STATUS_ICONS[step] : i + 1}
                  </div>
                  <span className={`text-xs mt-2 text-center font-medium ${
                    i <= currentStep ? 'text-primary-600' : 'text-gray-400'
                  }`}>{STATUS_LABELS[step]}</span>
                </div>
              ))}
            </div>
            <div className="flex px-6 mt-1">
              {STATUS_STEPS.slice(0, -1).map((_, i) => (
                <div key={i} className={`flex-1 h-1 mx-1 rounded ${i < currentStep ? 'bg-primary-500' : 'bg-gray-200'}`} />
              ))}
            </div>

            {order.status === 'CONFIRMED' && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4 text-center">
                <p className="text-green-800 font-medium">Your food is ready! Go pick it up.</p>
                <p className="text-green-600 text-sm mt-1">From: {order.canteen?.name}</p>
              </div>
            )}
          </div>
        )}

        {isCancelled && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-700 text-sm">
            This order has been cancelled.
          </div>
        )}

        <p className="text-sm text-gray-500">From: <strong>{order.canteen?.name}</strong></p>
      </div>

      {/* Order Items */}
      <div className="card p-5 mb-4">
        <h3 className="font-semibold text-gray-900 mb-3">Items</h3>
        <div className="space-y-2">
          {order.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-600">{item.itemName} x {item.quantity}</span>
              <span className="font-medium">₹{Number(item.unitPrice) * item.quantity}</span>
            </div>
          ))}
          {order.specialInstructions && (
            <div className="border-t pt-2">
              <p className="text-xs text-gray-400">Special Instructions:</p>
              <p className="text-sm text-gray-600">{order.specialInstructions}</p>
            </div>
          )}
          <div className="border-t pt-2 flex justify-between font-semibold">
            <span>Total</span>
            <span>₹{Number(order.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Payment Info */}
      {order.payment && (
        <div className="card p-5">
          <h3 className="font-semibold text-gray-900 mb-2">Payment</h3>
          <p className="text-sm text-gray-500">Status: <span className={`font-medium ${
            order.payment.status === 'SUCCESS' ? 'text-green-600' : 'text-red-600'
          }`}>{order.payment.status}</span></p>
        </div>
      )}
    </div>
  )
}
