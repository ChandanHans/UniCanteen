import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../../context/CartContext'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import toast from 'react-hot-toast'
import { load } from '@cashfreepayments/cashfree-js'

export default function Checkout() {
  const { cart, fetchCart } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [meal, setMeal] = useState(() => {
    const hour = new Date().getHours()
    return hour < 16 ? 'LUNCH' : 'DINNER'
  })
  const [loading, setLoading] = useState(false)
  const [orderData, setOrderData] = useState(null)
  const [verifying, setVerifying] = useState(false)

  async function openCashfree(od) {
    const cashfree = await load({ mode: import.meta.env.PROD ? 'production' : 'sandbox' })
    const result = await cashfree.checkout({
      paymentSessionId: od.paymentSessionId,
      redirectTarget: '_modal',
    })

    if (result.error) {
      toast.error(result.error.message || 'Payment failed')
      return
    }

    if (result.paymentDetails) {
      setVerifying(true)
      try {
        await api.post(`/orders/${od.order.id}/verify-payment`, {
          cf_order_id: od.cfOrderId,
        })
        toast.success('Payment successful! Order confirmed.')
        fetchCart()
        navigate(`/order/${od.order.id}`)
      } catch (err) {
        toast.error(err.response?.data?.message || 'Payment verification failed')
        setVerifying(false)
      }
    }
  }

  async function handlePlaceOrder() {
    setLoading(true)
    try {
      const { data } = await api.post('/orders', { specialInstructions, meal })
      const od = data.data
      setOrderData(od)
      fetchCart()
      openCashfree(od)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create order')
      fetchCart()
    } finally {
      setLoading(false)
    }
  }

  if (cart.items.length === 0 && !orderData) {
    navigate('/cart')
    return null
  }

  const canteenName = cart.items[0]?.menuItem?.category?.canteen?.name || orderData?.canteenName

  // ─── STEP 2: Payment Screen (after order placed) ──────
  if (orderData) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Complete Payment</h1>
        <p className="text-gray-500 mb-6">Order {orderData.order.orderNumber}</p>

        <div className="card p-5 mb-4 text-center">
          <p className="text-gray-500 text-sm">Amount to Pay</p>
          <p className="text-4xl font-bold text-gray-900 mt-1">₹{Number(orderData.order.totalAmount)}</p>
          <p className="text-sm text-gray-400 mt-1">to {canteenName}</p>
        </div>

        <div className="card p-5 mb-4">
          {verifying ? (
            <div className="flex flex-col items-center py-4 gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500" />
              <p className="text-gray-600 text-sm">Verifying payment...</p>
            </div>
          ) : (
            <>
              <button onClick={() => openCashfree(orderData)}
                className="btn-primary w-full text-lg py-3 mb-3">
                Pay ₹{Number(orderData.order.totalAmount)} via UPI
              </button>
              <p className="text-xs text-gray-400 text-center">
                Pay via GPay, PhonePe, Paytm or any UPI app. Powered by Cashfree.
              </p>
            </>
          )}
        </div>

        <button onClick={() => navigate(`/order/${orderData.order.id}`)}
          className="text-sm text-gray-500 hover:text-gray-700 w-full text-center block mt-2">
          View order status
        </button>
      </div>
    )
  }

  // ─── STEP 1: Order Summary ────────────────────────────
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Checkout</h1>

      <div className="card p-5 mb-4">
        <h3 className="font-semibold text-gray-900 mb-3">Order from {canteenName}</h3>
        <div className="space-y-2">
          {cart.items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span className="text-gray-600">{item.menuItem.name} x {item.quantity}</span>
              <span className="font-medium">₹{Number(item.menuItem.price) * item.quantity}</span>
            </div>
          ))}
          <div className="border-t pt-2 flex justify-between font-semibold text-base">
            <span>Total</span>
            <span>₹{cart.total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="card p-5 mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">This order is for</label>
        <div className="flex gap-3">
          <button onClick={() => setMeal('LUNCH')}
            className={`flex-1 py-3 rounded-lg font-medium text-center transition-colors ${
              meal === 'LUNCH' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            🌞 Lunch
          </button>
          <button onClick={() => setMeal('DINNER')}
            className={`flex-1 py-3 rounded-lg font-medium text-center transition-colors ${
              meal === 'DINNER' ? 'bg-primary-500 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            🌙 Dinner
          </button>
        </div>
      </div>

      <div className="card p-5 mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions (Optional)</label>
        <textarea value={specialInstructions} onChange={(e) => setSpecialInstructions(e.target.value)}
          className="input-field" rows={2} placeholder="e.g., Extra roti, less spicy..." maxLength={500} />
      </div>

      <button onClick={handlePlaceOrder} disabled={loading} className="btn-primary w-full text-lg py-3">
        {loading ? 'Placing Order...' : `Place Order — ₹${cart.total.toFixed(2)}`}
      </button>
    </div>
  )
}
