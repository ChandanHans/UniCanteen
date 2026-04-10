import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import api from '../../services/api'
import toast from 'react-hot-toast'
import suLogo from '../../assets/images/suniv_logo.png'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', hostelId: '' })
  const [hostels, setHostels] = useState([])
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()

  useEffect(() => {
    api.get('/super-admin/hostels').catch(() =>
      api.get('/canteens').then(({ data }) => {
        const uniqueHostels = data.data.map((c) => c.hostel).filter(Boolean)
        setHostels(uniqueHostels)
      }).catch(() => {})
    ).then((res) => {
      if (res?.data) setHostels(res.data.data)
    }).catch(() => {})
  }, [])

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    try {
      const payload = { ...form }
      if (!payload.hostelId) delete payload.hostelId
      await register(payload)
      toast.success('Account created!')
      // PublicRoute automatically redirects once user state is set
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-900 via-primary-800 to-accent-700 px-4 py-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-gradient-to-br from-accent-400 to-primary-500 p-1 shadow-2xl">
              <div className="rounded-full bg-primary-700 p-2">
                <img src={suLogo} alt="Sambalpur University" className="h-20 w-20 rounded-full object-contain" style={{filter:'brightness(0) invert(1)'}} />
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-wide">SU-Canteen</h1>
          <p className="text-accent-300 text-sm font-medium mt-1">Sambalpur University</p>
          <p className="text-white/60 mt-2 text-sm">Create your account</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" name="name" value={form.name} onChange={handleChange}
                className="input-field" placeholder="John Doe" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" name="email" value={form.email} onChange={handleChange}
                className="input-field" placeholder="you@university.edu" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" name="phone" value={form.phone} onChange={handleChange}
                className="input-field" placeholder="9876543210" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Hostel (Optional)</label>
              <select name="hostelId" value={form.hostelId} onChange={handleChange} className="input-field">
                <option value="">Select hostel</option>
                {hostels.map((h) => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input type="password" name="password" value={form.password} onChange={handleChange}
                className="input-field" placeholder="Min 6 characters" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
