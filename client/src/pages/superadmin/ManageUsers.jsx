import { useState, useEffect } from 'react'
import { FiSearch } from 'react-icons/fi'
import api from '../../services/api'
import toast from 'react-hot-toast'

const ROLES = ['STUDENT', 'CANTEEN_ADMIN', 'SUPER_ADMIN']

export default function ManageUsers() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  function fetchUsers() {
    setLoading(true)
    const params = new URLSearchParams({ page, limit: 20 })
    if (search) params.set('search', search)
    if (roleFilter) params.set('role', roleFilter)

    api.get(`/super-admin/users?${params}`)
      .then(({ data }) => { setUsers(data.data.users); setTotalPages(data.data.totalPages) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [page, roleFilter])

  async function changeRole(userId, role) {
    try {
      await api.patch(`/super-admin/users/${userId}/role`, { role })
      toast.success('Role updated')
      fetchUsers()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed')
    }
  }

  async function toggleStatus(userId) {
    try {
      await api.patch(`/super-admin/users/${userId}/status`)
      toast.success('Status updated')
      fetchUsers()
    } catch {
      toast.error('Failed to update')
    }
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Users</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
            className="input-field pl-10" placeholder="Search users..." />
        </div>
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }} className="input-field w-auto">
          <option value="">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-3 text-sm font-medium text-gray-500">Name</th>
                <th className="text-left p-3 text-sm font-medium text-gray-500">Email</th>
                <th className="text-left p-3 text-sm font-medium text-gray-500">Phone</th>
                <th className="text-left p-3 text-sm font-medium text-gray-500">Role</th>
                <th className="text-left p-3 text-sm font-medium text-gray-500">Status</th>
                <th className="text-left p-3 text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="p-3 text-sm font-medium text-gray-900">{u.name}</td>
                  <td className="p-3 text-sm text-gray-600">{u.email}</td>
                  <td className="p-3 text-sm text-gray-600">{u.phone}</td>
                  <td className="p-3">
                    <select value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}
                      className="text-xs border rounded px-2 py-1">
                      {ROLES.map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                    </select>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-3">
                    <button onClick={() => toggleStatus(u.id)}
                      className={`text-xs font-medium ${u.isActive ? 'text-red-600' : 'text-green-600'}`}>
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
            className="btn-secondary text-sm disabled:opacity-50">Previous</button>
          <span className="flex items-center text-sm text-gray-500">Page {page} of {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
            className="btn-secondary text-sm disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  )
}
