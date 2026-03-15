import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FiArrowLeft, FiPlus, FiSearch } from 'react-icons/fi'
import api from '../../services/api'
import { useAuth } from '../../context/AuthContext'
import { useCart } from '../../context/CartContext'

export default function CanteenMenu() {
  const { id } = useParams()
  const { user } = useAuth()
  const { addToCart } = useCart()
  const [canteen, setCanteen] = useState(null)
  const [activeCategory, setActiveCategory] = useState(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get(`/canteens/${id}`).then(({ data }) => {
      setCanteen(data.data)
      if (data.data.categories.length > 0) {
        setActiveCategory(data.data.categories[0].id)
      }
    }).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>
  if (!canteen) return <div className="text-center py-20 text-gray-400">Canteen not found</div>

  const allItems = canteen.categories.flatMap((c) => c.items.map((item) => ({ ...item, categoryName: c.name })))
  const filteredItems = search
    ? allItems.filter((item) => item.name.toLowerCase().includes(search.toLowerCase()))
    : canteen.categories.find((c) => c.id === activeCategory)?.items || []

  const hasItems = allItems.length > 0

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <Link to="/" className="inline-flex items-center gap-1 text-gray-500 hover:text-gray-700 mb-4">
        <FiArrowLeft /> Back to canteens
      </Link>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{canteen.name}</h1>
          <p className="text-gray-500">{canteen.hostel?.name}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          canteen.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {canteen.isOpen ? 'Open' : 'Closed'}
        </span>
      </div>

      {/* Meal Timings */}
      <div className="flex gap-4 mb-6 text-sm text-gray-500">
        <span>Lunch: {canteen.lunchStart} - {canteen.lunchEnd}</span>
        <span>Dinner: {canteen.dinnerStart} - {canteen.dinnerEnd}</span>
      </div>

      {!hasItems ? (
        <div className="text-center py-16 text-gray-400">
          <span className="text-5xl block mb-4">🍽️</span>
          <p className="text-lg">Today's menu hasn't been set yet</p>
          <p className="text-sm mt-1">Check back later!</p>
        </div>
      ) : (
        <>
          {/* Search */}
          <div className="relative mb-4">
            <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Search today's menu..." value={search}
              onChange={(e) => setSearch(e.target.value)} className="input-field pl-11" />
          </div>

          {/* Category Tabs (Lunch / Dinner) */}
          {!search && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
              {canteen.categories.map((cat) => (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    activeCategory === cat.id
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>
                  {cat.name} ({cat.items.length})
                </button>
              ))}
            </div>
          )}

          {/* Menu Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div key={item.id} className="card p-4 flex gap-4">
                <div className="w-20 h-20 rounded-lg bg-gray-100 flex-shrink-0 flex items-center justify-center overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl">{item.isVeg ? '🥬' : '🍗'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center ${
                      item.isVeg ? 'border-green-600' : 'border-red-600'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`}></span>
                    </span>
                    <h3 className="font-medium text-gray-900">{item.name}</h3>
                  </div>
                  {item.description && (
                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{item.description}</p>
                  )}
                  {search && item.categoryName && (
                    <p className="text-xs text-primary-500 mt-0.5">{item.categoryName}</p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-semibold text-gray-900">₹{Number(item.price)}</span>
                    {user?.role === 'STUDENT' && canteen.isOpen && (
                      <button onClick={() => addToCart(item.id)}
                        className="flex items-center gap-1 text-sm font-medium text-primary-600 border border-primary-500 rounded-lg px-3 py-1 hover:bg-primary-50 transition-colors">
                        <FiPlus size={14} /> ADD
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredItems.length === 0 && search && (
            <div className="text-center py-12 text-gray-400">
              <p>No items match "{search}"</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
