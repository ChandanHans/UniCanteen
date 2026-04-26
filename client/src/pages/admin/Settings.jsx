import { useState, useEffect } from 'react'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function AdminSettings() {
  const [canteen, setCanteen] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/canteens/me')
      .then(({ data }) => setCanteen(data.data))
      .catch(() => toast.error('Failed to load canteen info'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Canteen Settings</h1>
      <p className="text-gray-500 mb-8">{canteen?.name}</p>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Payment</h2>
        <p className="text-sm text-gray-500">
          Payments are handled securely via the integrated payment gateway.
        </p>
      </div>
    </div>
  )
}
