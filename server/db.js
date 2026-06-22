import { randomUUID } from 'crypto'
import { supabase, isSupabaseConfigured } from './supabase.js'
import { normalizeSchedule } from './schedule-normalize.js'

export const databasePath = 'supabase'

export const DEFAULT_SALON_SETTINGS = {
  appointmentDuration: 20,
  schedule: {
    0: null,
    1: [{ start: '08:00', end: '20:00' }],
    2: [{ start: '08:00', end: '20:00' }],
    3: [{ start: '08:00', end: '20:00' }],
    4: [{ start: '08:00', end: '20:00' }],
    5: [{ start: '08:00', end: '20:00' }],
    6: [{ start: '08:00', end: '17:00' }],
  },
}

function assertDb() {
  if (!supabase) throw new Error('Supabase nije podešen. Dodaj SUPABASE_URL i SUPABASE_SERVICE_ROLE_KEY.')
}

// ─── Bookings ───

export async function createBooking(data, status = 'pending') {
  assertDb()
  const cancel_token = randomUUID()
  const { data: row, error } = await supabase
    .from('bookings')
    .insert({
      name: data.name,
      email: data.email,
      phone: data.phone,
      service: data.service,
      booking_date: data.booking_date,
      booking_time: data.booking_time,
      notes: data.notes || '',
      cancel_token,
      status,
    })
    .select()
    .single()

  if (error) throw error
  return row
}

export async function getBookingById(id) {
  assertDb()
  const { data, error } = await supabase.from('bookings').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  return data
}

export async function getBookingByCancelToken(token) {
  if (!token) return null
  assertDb()
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('cancel_token', token)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function cancelBookingByToken(token) {
  const booking = await getBookingByCancelToken(token)
  if (!booking) return null
  if (booking.status === 'cancelled') return booking

  const { error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('cancel_token', token)
  if (error) throw error
  return getBookingByCancelToken(token)
}

export async function getBookingsByDate(date) {
  assertDb()
  const { data, error } = await supabase
    .from('bookings')
    .select('booking_time, status')
    .eq('booking_date', date)
    .neq('status', 'cancelled')
  if (error) throw error
  return data || []
}

export async function getAllBookings() {
  assertDb()
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('booking_date', { ascending: false })
    .order('booking_time', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function updateBookingStatus(id, status) {
  assertDb()
  const { error } = await supabase.from('bookings').update({ status }).eq('id', id)
  if (error) throw error
  return getBookingById(id)
}

// ─── Admin sessions ───

const SESSION_DAYS = 7

export async function createAdminSession() {
  assertDb()
  const id = randomUUID()
  const expires_at = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const { error } = await supabase.from('admin_sessions').insert({ id, expires_at })
  if (error) throw error
  return id
}

export async function getAdminSession(id) {
  if (!id) return null
  assertDb()

  await supabase.from('admin_sessions').delete().lt('expires_at', new Date().toISOString())

  const { data, error } = await supabase.from('admin_sessions').select('*').eq('id', id).maybeSingle()
  if (error) throw error
  if (!data) return null
  if (new Date(data.expires_at) < new Date()) {
    await supabase.from('admin_sessions').delete().eq('id', id)
    return null
  }
  return data
}

export async function deleteAdminSession(id) {
  if (!id) return
  assertDb()
  await supabase.from('admin_sessions').delete().eq('id', id)
}

// ─── Salon settings ───

export async function getSalonSettings() {
  if (!supabase) return { ...DEFAULT_SALON_SETTINGS, schedule: normalizeSchedule(DEFAULT_SALON_SETTINGS.schedule) }

  const { data, error } = await supabase
    .from('settings')
    .select('key, value')
    .in('key', ['schedule', 'appointment_duration'])
  if (error) throw error

  const map = Object.fromEntries((data || []).map((r) => [r.key, r.value]))

  let schedule = { ...DEFAULT_SALON_SETTINGS.schedule }
  if (map.schedule) {
    try {
      schedule = normalizeSchedule(JSON.parse(map.schedule))
    } catch {
      schedule = normalizeSchedule({ ...DEFAULT_SALON_SETTINGS.schedule })
    }
  } else {
    schedule = normalizeSchedule(schedule)
  }

  const duration = Number(map.appointment_duration)
  const allowedDurations = [10, 20, 30, 40, 50, 60, 90, 120]
  return {
    appointmentDuration: allowedDurations.includes(duration)
      ? duration
      : DEFAULT_SALON_SETTINGS.appointmentDuration,
    schedule,
  }
}

export async function saveSalonSettings({ schedule, appointmentDuration }) {
  assertDb()
  const { error: e1 } = await supabase
    .from('settings')
    .upsert({ key: 'schedule', value: JSON.stringify(schedule) })
  const { error: e2 } = await supabase
    .from('settings')
    .upsert({ key: 'appointment_duration', value: String(appointmentDuration) })
  if (e1) throw e1
  if (e2) throw e2
  return getSalonSettings()
}

export { isSupabaseConfigured }
