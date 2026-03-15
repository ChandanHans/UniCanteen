import { useState, useEffect } from 'react'
import { FiPlus, FiEdit2 } from 'react-icons/fi'
import api from '../../services/api'
import toast from 'react-hot-toast'

const DEFAULT_FORM = { name: '', hostelId: '', description: '', lunchStart: '12:00', lunchEnd: '14:30', dinnerStart: '19:00', dinnerEnd: '21:30' }

export default function ManageCanteens() {
  const [canteens, setCanteens] = useState([])
  const [hostels, setHostels] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(DEFAULT_FORM)
  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    api.get('/canteens').then(({ data }) => setCanteens(data.data)).catch(() => {})
    api.get('/super-admin/hostels').then(({ data }) => setHostels(data.data)).catch(() => {})
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      if (editingId) {
        await api.put(`/canteens/${editingId}`, form)
        toast.success('Canteen updated')
      } else {
        await api.post('/canteens', form)
        toast.success('Canteen created')
      }
      const { data } = await api.get('/canteens')
      setCanteens(data.data)
      setShowForm(false)
      setEditingId(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  function startEdit(c) {
    setForm({ name: c.name, hostelId: c.hostelId, description: c.description || '', lunchStart: c.lunchStart, lunchEnd: c.lunchEnd, dinnerStart: c.dinnerStart, dinnerEnd: c.dinnerEnd })
    setEditingId(c.id)
    setShowForm(true)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Canteens</h1>
        <button onClick={() => { setShowForm(true); setEditingId(null); setForm(DEFAULT_FORM) }}
          className="btn-primary text-sm"><FiPlus className="inline mr-1" /> Add Canteen</button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="card p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-4">{editingId ? 'Edit' : 'Add'} Canteen</h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field" placeholder="Canteen name" required />
              <select value={form.hostelId} onChange={(e) => setForm({ ...form, hostelId: e.target.value })}
                className="input-field" required disabled={!!editingId}>
                <option value="">Select hostel</option>
                {hostels.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input-field" placeholder="Description" rows={2} />
              <div>
                <label className="text-xs text-gray-500 font-medium">Lunch Timing</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <input type="time" value={form.lunchStart} onChange={(e) => setForm({ ...form, lunchStart: e.target.value })} className="input-field" />
                  <input type="time" value={form.lunchEnd} onChange={(e) => setForm({ ...form, lunchEnd: e.target.value })} className="input-field" />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium">Dinner Timing</label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <input type="time" value={form.dinnerStart} onChange={(e) => setForm({ ...form, dinnerStart: e.target.value })} className="input-field" />
                  <input type="time" value={form.dinnerEnd} onChange={(e) => setForm({ ...form, dinnerEnd: e.target.value })} className="input-field" />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn-primary text-sm">Save</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {canteens.map((c) => (
          <div key={c.id} className="card p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{c.name}</h3>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.isOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {c.isOpen ? 'Open' : 'Closed'}
                </span>
                <button onClick={() => startEdit(c)} className="text-gray-400 hover:text-gray-600"><FiEdit2 size={16} /></button>
              </div>
            </div>
            <p className="text-sm text-gray-500">{c.hostel?.name}</p>
            <p className="text-sm text-gray-400 mt-1">Lunch: {c.lunchStart} - {c.lunchEnd}</p>
            <p className="text-sm text-gray-400">Dinner: {c.dinnerStart} - {c.dinnerEnd}</p>
            {c.description && <p className="text-sm text-gray-400 mt-1">{c.description}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
