import { useState, useEffect } from 'react'
import { FiPlus, FiEdit2, FiTrash2, FiCheck, FiX, FiChevronRight, FiChevronLeft } from 'react-icons/fi'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import toast from 'react-hot-toast'

export default function MenuManager() {
  const { user } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('daily') // 'daily' or 'manage'

  // Daily menu state
  const [saving, setSaving] = useState(false)

  // Forms
  const [showCatForm, setShowCatForm] = useState(false)
  const [showItemForm, setShowItemForm] = useState(false)
  const [catName, setCatName] = useState('')
  const [editingCat, setEditingCat] = useState(null)
  const [itemForm, setItemForm] = useState({ name: '', price: '', description: '', categoryId: '', isVeg: true })
  const [editingItem, setEditingItem] = useState(null)

  const canteenId = user?.managedCanteen?.id

  function fetchMenu() {
    if (!canteenId) return
    api.get(`/menu/canteen/${canteenId}/full`)
      .then(({ data }) => setCategories(data.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchMenu() }, [canteenId])

  // ─── Daily Menu Toggle ─────────────────────────────────

  function toggleItem(itemId) {
    setCategories((cats) =>
      cats.map((cat) => ({
        ...cat,
        items: cat.items.map((item) =>
          item.id === itemId ? { ...item, isAvailable: !item.isAvailable } : item
        ),
      }))
    )
  }

  async function saveDailyMenu() {
    setSaving(true)
    const availableItemIds = categories
      .flatMap((c) => c.items)
      .filter((item) => item.isAvailable)
      .map((item) => item.id)

    try {
      await api.put('/menu/daily', { availableItemIds })
      toast.success("Today's menu updated!")
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // ─── Category CRUD ─────────────────────────────────────

  async function handleCategorySubmit(e) {
    e.preventDefault()
    try {
      if (editingCat) {
        await api.put(`/menu/categories/${editingCat}`, { name: catName })
        toast.success('Category updated')
      } else {
        await api.post(`/menu/canteen/${canteenId}/categories`, { name: catName })
        toast.success('Category created')
      }
      setCatName(''); setEditingCat(null); setShowCatForm(false)
      fetchMenu()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  async function deleteCategory(id) {
    if (!confirm('Delete this category and all its items?')) return
    try {
      await api.delete(`/menu/categories/${id}`)
      toast.success('Category deleted')
      fetchMenu()
    } catch { toast.error('Failed to delete') }
  }

  // ─── Item CRUD ─────────────────────────────────────────

  async function handleItemSubmit(e) {
    e.preventDefault()
    const payload = { ...itemForm, price: parseFloat(itemForm.price) }
    try {
      if (editingItem) {
        await api.put(`/menu/items/${editingItem}`, payload)
        toast.success('Item updated')
      } else {
        await api.post('/menu/items', payload)
        toast.success('Item created')
      }
      setItemForm({ name: '', price: '', description: '', categoryId: '', isVeg: true })
      setEditingItem(null); setShowItemForm(false)
      fetchMenu()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  async function deleteItem(id) {
    if (!confirm('Delete this item?')) return
    try {
      await api.delete(`/menu/items/${id}`)
      toast.success('Item deleted')
      fetchMenu()
    } catch { toast.error('Failed') }
  }

  function startEditItem(item) {
    setItemForm({ name: item.name, price: String(Number(item.price)), description: item.description || '', categoryId: item.categoryId, isVeg: item.isVeg })
    setEditingItem(item.id)
    setShowItemForm(true)
  }

  if (!canteenId) return <div className="text-center py-20 text-gray-400">No canteen assigned to your account</div>
  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>

  const todayItemCount = categories.flatMap((c) => c.items).filter((i) => i.isAvailable).length
  const totalItems = categories.flatMap((c) => c.items).length

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Tab Toggle */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button onClick={() => setTab('daily')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'daily' ? 'bg-white shadow text-primary-600' : 'text-gray-500'}`}>
            Today's Menu
          </button>
          <button onClick={() => setTab('manage')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === 'manage' ? 'bg-white shadow text-primary-600' : 'text-gray-500'}`}>
            All Items
          </button>
        </div>
      </div>

      {/* ─── DAILY MENU TAB ─────────────────────────────── */}
      {tab === 'daily' && (
        <>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-blue-800 text-sm font-medium">
              Click items to toggle them in/out of today's menu. Green = serving today. Then hit Save.
            </p>
            <p className="text-blue-600 text-sm mt-1">
              {todayItemCount} of {totalItems} items selected for today
            </p>
          </div>

          {categories.map((cat) => (
            <div key={cat.id} className="mb-6">
              <h3 className="font-semibold text-gray-700 mb-3 text-lg">{cat.name}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {cat.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`flex items-center gap-3 p-3 rounded-lg border-2 text-left transition-all ${
                      item.isAvailable
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      item.isAvailable ? 'bg-green-500 text-white' : 'bg-gray-200'
                    }`}>
                      {item.isAvailable && <FiCheck size={14} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-3 h-3 border rounded-sm flex items-center justify-center ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`}></span>
                        </span>
                        <span className="font-medium text-sm truncate">{item.name}</span>
                      </div>
                      <span className="text-xs text-gray-500">₹{Number(item.price)}</span>
                    </div>
                  </button>
                ))}
              </div>
              {cat.items.length === 0 && (
                <p className="text-sm text-gray-400">No items in this category. Add some in "All Items" tab.</p>
              )}
            </div>
          ))}

          <div className="sticky bottom-4 flex justify-center">
            <button onClick={saveDailyMenu} disabled={saving}
              className="btn-primary text-lg px-10 py-3 shadow-lg">
              {saving ? 'Saving...' : `Save Today's Menu (${todayItemCount} items)`}
            </button>
          </div>
        </>
      )}

      {/* ─── MANAGE ALL ITEMS TAB ───────────────────────── */}
      {tab === 'manage' && (
        <>
          <div className="flex gap-2 mb-6">
            <button onClick={() => { setShowCatForm(true); setEditingCat(null); setCatName('') }}
              className="btn-secondary text-sm"><FiPlus className="inline mr-1" /> Category</button>
            <button onClick={() => { setShowItemForm(true); setEditingItem(null); setItemForm({ name: '', price: '', description: '', categoryId: '', isVeg: true }) }}
              className="btn-primary text-sm"><FiPlus className="inline mr-1" /> Item</button>
          </div>

          {/* Category Form Modal */}
          {showCatForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCatForm(false)}>
              <div className="card p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="font-semibold mb-4">{editingCat ? 'Edit' : 'Add'} Category</h3>
                <form onSubmit={handleCategorySubmit}>
                  <input type="text" value={catName} onChange={(e) => setCatName(e.target.value)}
                    className="input-field mb-4" placeholder="e.g. Lunch, Dinner" required />
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary text-sm">Save</button>
                    <button type="button" onClick={() => setShowCatForm(false)} className="btn-secondary text-sm">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Item Form Modal */}
          {showItemForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowItemForm(false)}>
              <div className="card p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
                <h3 className="font-semibold mb-4">{editingItem ? 'Edit' : 'Add'} Menu Item</h3>
                <form onSubmit={handleItemSubmit} className="space-y-3">
                  <input type="text" value={itemForm.name} onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                    className="input-field" placeholder="Item name" required />
                  <input type="number" value={itemForm.price} onChange={(e) => setItemForm({ ...itemForm, price: e.target.value })}
                    className="input-field" placeholder="Price (₹)" step="0.01" required />
                  <textarea value={itemForm.description} onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
                    className="input-field" placeholder="Description (optional)" rows={2} />
                  <select value={itemForm.categoryId} onChange={(e) => setItemForm({ ...itemForm, categoryId: e.target.value })}
                    className="input-field" required>
                    <option value="">Select category (Lunch / Dinner)</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={itemForm.isVeg} onChange={(e) => setItemForm({ ...itemForm, isVeg: e.target.checked })} className="rounded" />
                    <span className="text-sm">Vegetarian</span>
                  </label>
                  <div className="flex gap-2">
                    <button type="submit" className="btn-primary text-sm">Save</button>
                    <button type="button" onClick={() => setShowItemForm(false)} className="btn-secondary text-sm">Cancel</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Item list by category */}
          {categories.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No categories yet. Add "Lunch" and "Dinner" to get started!</div>
          ) : (
            <div className="space-y-6">
              {categories.map((cat) => (
                <div key={cat.id} className="card">
                  <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
                    <h3 className="font-semibold text-gray-900">{cat.name} ({cat.items.length} items)</h3>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingCat(cat.id); setCatName(cat.name); setShowCatForm(true) }}
                        className="text-gray-400 hover:text-gray-600"><FiEdit2 size={16} /></button>
                      <button onClick={() => deleteCategory(cat.id)}
                        className="text-red-400 hover:text-red-600"><FiTrash2 size={16} /></button>
                    </div>
                  </div>
                  <div className="divide-y">
                    {cat.items.map((item) => (
                      <div key={item.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className={`w-4 h-4 border-2 rounded-sm flex items-center justify-center ${item.isVeg ? 'border-green-600' : 'border-red-600'}`}>
                            <span className={`w-2 h-2 rounded-full ${item.isVeg ? 'bg-green-600' : 'bg-red-600'}`}></span>
                          </span>
                          <div>
                            <span className="font-medium text-gray-900">{item.name}</span>
                            <span className="text-sm text-gray-500 ml-2">₹{Number(item.price)}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button onClick={() => startEditItem(item)} className="text-gray-400 hover:text-gray-600"><FiEdit2 size={16} /></button>
                          <button onClick={() => deleteItem(item.id)} className="text-red-400 hover:text-red-600"><FiTrash2 size={16} /></button>
                        </div>
                      </div>
                    ))}
                    {cat.items.length === 0 && (
                      <div className="p-4 text-sm text-gray-400 text-center">No items yet</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
