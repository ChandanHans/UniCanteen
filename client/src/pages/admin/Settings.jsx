import { useState, useEffect } from 'react'
import { FiSave } from 'react-icons/fi'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function AdminSettings() {
  const [canteen, setCanteen] = useState(null)
  const [upiId, setUpiId] = useState('')
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/canteens/me')
      .then(({ data }) => {
        setCanteen(data.data)
        setUpiId(data.data.upiId || '')
      })
      .catch(() => toast.error('Failed to load canteen info'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/canteens/${canteen.id}`, { upiId: upiId.trim() || null })
      toast.success('UPI ID saved!')
      setCanteen((c) => ({ ...c, upiId: upiId.trim() || null }))
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Canteen Settings</h1>
      <p className="text-gray-500 mb-8">{canteen?.name}</p>

      <div className="card p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">UPI Payment ID</h2>
        <p className="text-sm text-gray-500 mb-4">
          Students will use this UPI ID to pay for orders. Leave blank to disable UPI payments.
        </p>

        <form onSubmit={handleSave}>
          <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
          <input
            type="text"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
            className="input-field mb-1"
            placeholder="e.g. canteen@okaxis"
          />
          <p className="text-xs text-gray-400 mb-4">
            Format: username@bankname (e.g. 9876543210@paytm, name@okicici)
          </p>

          {canteen?.upiId && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 mb-4 text-sm text-green-800">
              Current UPI ID: <span className="font-mono font-medium">{canteen.upiId}</span>
            </div>
          )}

          {!canteen?.upiId && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3 mb-4 text-sm text-yellow-800">
              No UPI ID set. Students will be asked to pay at the counter.
            </div>
          )}

          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            <FiSave size={16} />
            {saving ? 'Saving...' : 'Save UPI ID'}
          </button>
        </form>
      </div>
    </div>
  )
}
