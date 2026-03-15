import { Link, useNavigate } from 'react-router-dom'
import { FiArrowLeft, FiMinus, FiPlus, FiTrash2 } from 'react-icons/fi'
import { useCart } from '../../context/CartContext'

export default function Cart() {
  const { cart, updateQuantity, removeItem, clearCart } = useCart()
  const navigate = useNavigate()

  if (cart.items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <span className="text-6xl block mb-4">🛒</span>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-6">Browse canteens and add delicious food to your cart</p>
        <Link to="/" className="btn-primary inline-block">Explore Canteens</Link>
      </div>
    )
  }

  const canteenName = cart.items[0]?.menuItem?.category?.canteen?.name

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Link to="/" className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4">
        <FiArrowLeft /> Continue browsing
      </Link>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Cart</h1>
          {canteenName && <p className="text-gray-500 text-sm">From {canteenName}</p>}
        </div>
        <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-700">Clear Cart</button>
      </div>

      <div className="space-y-3 mb-6">
        {cart.items.map((item) => (
          <div key={item.id} className="card p-4 flex items-center gap-4">
            <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
              {item.menuItem.imageUrl ? (
                <img src={item.menuItem.imageUrl} alt={item.menuItem.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl">{item.menuItem.isVeg ? '🥬' : '🍗'}</span>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{item.menuItem.name}</h3>
              <p className="text-sm text-gray-500">₹{Number(item.menuItem.price)} each</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                <FiMinus size={14} />
              </button>
              <span className="w-8 text-center font-medium">{item.quantity}</span>
              <button onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200">
                <FiPlus size={14} />
              </button>
            </div>
            <div className="text-right">
              <p className="font-semibold">₹{Number(item.menuItem.price) * item.quantity}</p>
              <button onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 mt-1">
                <FiTrash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Order Summary */}
      <div className="card p-5">
        <h3 className="font-semibold text-gray-900 mb-3">Order Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600">
            <span>Subtotal ({cart.items.reduce((s, i) => s + i.quantity, 0)} items)</span>
            <span>₹{cart.total.toFixed(2)}</span>
          </div>
          <div className="border-t pt-2 flex justify-between font-semibold text-gray-900 text-base">
            <span>Total</span>
            <span>₹{cart.total.toFixed(2)}</span>
          </div>
        </div>
        <button onClick={() => navigate('/checkout')} className="btn-primary w-full mt-4">
          Proceed to Checkout
        </button>
      </div>
    </div>
  )
}
