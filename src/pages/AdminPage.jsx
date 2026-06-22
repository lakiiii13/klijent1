import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  adminLogin,
  adminLogout,
  checkAdminSession,
  getAdminBookings,
  patchBookingStatus,
} from '../lib/api'
import AdminSchedule from '../components/AdminSchedule'
import AdminLayout from '../components/admin/AdminLayout'
import AdminBookingsPanel from '../components/admin/AdminBookingsPanel'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function tomorrowISO() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

function isThisWeek(dateStr) {
  const date = new Date(`${dateStr}T12:00:00`)
  const now = new Date()
  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const day = start.getDay()
  const mondayOffset = day === 0 ? -6 : 1 - day
  start.setDate(start.getDate() + mondayOffset)
  const end = new Date(start)
  end.setDate(start.getDate() + 6)
  end.setHours(23, 59, 59, 999)
  return date >= start && date <= end
}

function matchesDateFilter(bookingDate, dateFilter) {
  if (dateFilter === 'today') return bookingDate === todayISO()
  if (dateFilter === 'tomorrow') return bookingDate === tomorrowISO()
  if (dateFilter === 'week') return isThisWeek(bookingDate)
  return true
}

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(null)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [actionError, setActionError] = useState('')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('today')
  const [actionId, setActionId] = useState(null)
  const [tab, setTab] = useState('bookings')

  useEffect(() => {
    checkAdminSession()
      .then((data) => setLoggedIn(data.loggedIn))
      .catch(() => setLoggedIn(false))
  }, [])

  const loadBookings = useCallback(async () => {
    setLoading(true)
    setActionError('')
    try {
      const data = await getAdminBookings()
      setBookings(data)
    } catch (err) {
      setLoggedIn(false)
      setActionError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (loggedIn) loadBookings()
  }, [loggedIn, loadBookings])

  useEffect(() => {
    if (!loggedIn) return undefined
    const interval = setInterval(loadBookings, 30000)
    return () => clearInterval(interval)
  }, [loggedIn, loadBookings])

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginError('')
    try {
      await adminLogin(password)
      setLoggedIn(true)
      setPassword('')
    } catch (err) {
      setLoginError(err.message)
    }
  }

  const handleStatus = async (id, status) => {
    setActionId(id)
    setActionError('')
    try {
      await patchBookingStatus(id, status)
      await loadBookings()
    } catch (err) {
      setActionError(err.message)
    } finally {
      setActionId(null)
    }
  }

  const logout = async () => {
    try {
      await adminLogout()
    } catch {
      /* ignore */
    }
    setLoggedIn(false)
    setBookings([])
  }

  const filtered = bookings
    .filter((b) => (filter === 'all' || b.status === filter) && matchesDateFilter(b.booking_date, dateFilter))
    .sort((a, b) => {
      if (dateFilter === 'all') {
        return b.booking_date.localeCompare(a.booking_date) || b.booking_time.localeCompare(a.booking_time)
      }
      return a.booking_date.localeCompare(b.booking_date) || a.booking_time.localeCompare(b.booking_time)
    })

  const countForDate = (df) =>
    bookings.filter((b) => matchesDateFilter(b.booking_date, df) && b.status !== 'cancelled').length

  if (loggedIn === null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <p className="text-sm text-ink-muted">Učitavanje...</p>
      </div>
    )
  }

  if (!loggedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream px-6">
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleLogin}
          className="w-full max-w-sm bg-white p-10 shadow-[0_8px_48px_rgba(44,36,32,0.08)]"
        >
          <span className="mb-2 block font-serif text-2xl tracking-[0.1em] text-brown-dark">LA VIE</span>
          <p className="mb-8 text-xs tracking-[0.15em] text-ink-muted">ADMIN PANEL</p>
          <label htmlFor="password" className="mb-2 block text-xs font-medium text-ink-muted">
            Lozinka
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mb-4 w-full border border-brown/20 px-4 py-3 text-sm outline-none focus:border-brown"
          />
          {loginError && <p className="mb-4 text-sm text-red-600">{loginError}</p>}
          <button
            type="submit"
            className="w-full bg-brown py-3.5 text-[11px] font-semibold tracking-[0.15em] text-white hover:bg-brown-dark"
          >
            PRIJAVI SE
          </button>
          <a href="/" className="mt-6 block text-center text-xs text-ink-muted hover:text-brown">
            ← Nazad na sajt
          </a>
        </motion.form>
      </div>
    )
  }

  return (
    <AdminLayout
      tab={tab}
      onTabChange={setTab}
      onRefresh={loadBookings}
      onLogout={logout}
    >
      {tab === 'schedule' ? (
        <AdminSchedule />
      ) : (
        <AdminBookingsPanel
          bookings={bookings}
          filtered={filtered}
          loading={loading}
          filter={filter}
          dateFilter={dateFilter}
          actionError={actionError}
          actionId={actionId}
          countForDate={countForDate}
          matchesDateFilter={matchesDateFilter}
          onFilterChange={setFilter}
          onDateFilterChange={setDateFilter}
          onStatusChange={handleStatus}
          onCreated={loadBookings}
        />
      )}
    </AdminLayout>
  )
}
