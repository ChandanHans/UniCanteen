import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { FiSearch, FiClock, FiMapPin } from 'react-icons/fi'
import api from '../../services/api'

export default function Home() {
  const [canteens, setCanteens] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/canteens').then(({ data }) => setCanteens(data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = canteens.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.hostel?.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Explore Canteens</h1>
        <p className="text-gray-500 mt-1">Order lunch or dinner from any hostel canteen across campus</p>
      </div>

      <div className="relative mb-6">
        <FiSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input type="text" placeholder="Search canteens..." value={search}
          onChange={(e) => setSearch(e.target.value)} className="input-field pl-12" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((canteen) => (
          <Link key={canteen.id} to={`/canteen/${canteen.id}`} className="card hover:shadow-md transition-shadow">
            <div className="h-40 bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
              {canteen.imageUrl ? (
                <img src={canteen.imageUrl} alt={canteen.name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-6xl">🏪</span>
              )}
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-lg text-gray-900">{canteen.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  canteen.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {canteen.isOpen ? 'Open' : 'Closed'}
                </span>
              </div>
              {canteen.hostel && (
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <FiMapPin size={14} /> {canteen.hostel.name}
                </p>
              )}
              <div className="text-sm text-gray-500 mt-1 space-y-0.5">
                <p className="flex items-center gap-1">
                  <FiClock size={14} /> Lunch: {canteen.lunchStart} - {canteen.lunchEnd}
                </p>
                <p className="flex items-center gap-1">
                  <FiClock size={14} /> Dinner: {canteen.dinnerStart} - {canteen.dinnerEnd}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-xl">No canteens found</p>
        </div>
      )}
    </div>
  )
}
