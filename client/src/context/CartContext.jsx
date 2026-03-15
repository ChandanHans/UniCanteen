import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const { user } = useAuth()
  const [cart, setCart] = useState({ items: [], total: 0 })
  const [loading, setLoading] = useState(false)

  const fetchCart = useCallback(async () => {
    if (!user || user.role !== 'STUDENT') return
    try {
      setLoading(true)
      const { data } = await api.get('/cart')
      setCart(data.data)
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchCart()
  }, [fetchCart])

  async function addToCart(menuItemId, quantity = 1) {
    try {
      await api.post('/cart', { menuItemId, quantity })
      await fetchCart()
      toast.success('Added to cart')
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add to cart'
      toast.error(msg)
      throw err
    }
  }

  async function updateQuantity(cartItemId, quantity) {
    try {
      await api.put(`/cart/${cartItemId}`, { quantity })
      await fetchCart()
    } catch {
      toast.error('Failed to update cart')
    }
  }

  async function removeItem(cartItemId) {
    try {
      await api.delete(`/cart/${cartItemId}`)
      await fetchCart()
      toast.success('Removed from cart')
    } catch {
      toast.error('Failed to remove item')
    }
  }

  async function clearCart() {
    try {
      await api.delete('/cart/clear')
      setCart({ items: [], total: 0 })
    } catch {
      toast.error('Failed to clear cart')
    }
  }

  const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0)

  return (
    <CartContext.Provider value={{ cart, loading, addToCart, updateQuantity, removeItem, clearCart, fetchCart, itemCount }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used within CartProvider')
  return context
}
