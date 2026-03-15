import { useState, useEffect } from 'react'
import { FiBell, FiCheck } from 'react-icons/fi'
import api from '../services/api'

export default function Notifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/notifications')
      .then(({ data }) => setNotifications(data.data.notifications))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function markAsRead(id) {
    await api.patch(`/notifications/${id}/read`).catch(() => {})
    setNotifications((n) => n.map((notif) => notif.id === id ? { ...notif, isRead: true } : notif))
  }

  async function markAllAsRead() {
    await api.patch('/notifications/read-all').catch(() => {})
    setNotifications((n) => n.map((notif) => ({ ...notif, isRead: true })))
  }

  if (loading) return <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div></div>

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        {notifications.some((n) => !n.isRead) && (
          <button onClick={markAllAsRead} className="text-sm text-primary-600 hover:text-primary-700">
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-12">
          <FiBell className="mx-auto text-gray-300" size={48} />
          <p className="text-gray-400 mt-4">No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div key={n.id} className={`card p-4 flex items-start gap-3 cursor-pointer ${!n.isRead ? 'bg-primary-50 border-primary-200' : ''}`}
              onClick={() => !n.isRead && markAsRead(n.id)}>
              <div className={`w-2 h-2 rounded-full mt-2 ${!n.isRead ? 'bg-primary-500' : 'bg-gray-300'}`} />
              <div className="flex-1">
                <p className="font-medium text-gray-900 text-sm">{n.title}</p>
                <p className="text-sm text-gray-600">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
