const API = import.meta.env.VITE_API_URL || '/api'

const base = {
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
}

async function request(path, options = {}) {
  let res
  try {
    res = await fetch(`${API}${path}`, { ...base, ...options })
  } catch {
    throw new Error('Server nije dostupan. Restartuj: Ctrl+C pa npm run dev')
  }
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data.error || 'Greška na serveru.')
  return data
}

export function getSlots(date) {
  return request(`/slots?date=${date}`)
}

export function createBooking(payload) {
  return request('/bookings', { method: 'POST', body: JSON.stringify(payload) })
}

export function checkAdminSession() {
  return request('/admin/me')
}

export function adminLogin(password) {
  return request('/admin/login', { method: 'POST', body: JSON.stringify({ password }) })
}

export function adminLogout() {
  return request('/admin/logout', { method: 'POST' })
}

export function getAdminBookings() {
  return request('/admin/bookings')
}

export function createAdminBooking(payload) {
  return request('/admin/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export function patchBookingStatus(id, status) {
  return request(`/admin/bookings/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

export function getAdminSettings() {
  return request('/admin/settings')
}

export function updateAdminSettings(payload) {
  return request('/admin/settings', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
}

export function getCancelInfo(token) {
  return request(`/bookings/cancel/${token}`)
}

export function cancelBooking(token) {
  return request(`/bookings/cancel/${token}`, { method: 'POST' })
}
