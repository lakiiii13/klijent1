import Database from 'better-sqlite3'
import { randomUUID } from 'crypto'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { mkdirSync, existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = process.env.DATA_DIR || join(__dirname, '..', 'data')
if (!existsSync(dataDir)) mkdirSync(dataDir, { recursive: true })

const dbPath = join(dataDir, 'bookings.db')
const db = new Database(dbPath)

export const databasePath = dbPath

db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    service TEXT NOT NULL,
    booking_date TEXT NOT NULL,
    booking_time TEXT NOT NULL,
    notes TEXT DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS admin_sessions (
    id TEXT PRIMARY KEY,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(booking_date);
  CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
`)

const columns = db.prepare(`PRAGMA table_info(bookings)`).all()
const hasCancelToken = columns.some((c) => c.name === 'cancel_token')

if (!hasCancelToken) {
  db.exec(`ALTER TABLE bookings ADD COLUMN cancel_token TEXT`)
}

const missingTokens = db.prepare(`SELECT id FROM bookings WHERE cancel_token IS NULL`).all()
for (const row of missingTokens) {
  db.prepare(`UPDATE bookings SET cancel_token = ? WHERE id = ?`).run(randomUUID(), row.id)
}

db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_cancel_token ON bookings(cancel_token)`)

db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`)

db.prepare(`DELETE FROM admin_sessions WHERE expires_at < datetime('now')`).run()

// ─── Bookings ───

export function createBooking(data, status = 'pending') {
  const cancel_token = randomUUID()
  const stmt = db.prepare(`
    INSERT INTO bookings (name, email, phone, service, booking_date, booking_time, notes, cancel_token, status)
    VALUES (@name, @email, @phone, @service, @booking_date, @booking_time, @notes, @cancel_token, @status)
  `)
  const result = stmt.run({ ...data, cancel_token, status })
  return getBookingById(result.lastInsertRowid)
}

export function getBookingById(id) {
  return db.prepare('SELECT * FROM bookings WHERE id = ?').get(id)
}

export function getBookingByCancelToken(token) {
  if (!token) return null
  return db.prepare('SELECT * FROM bookings WHERE cancel_token = ?').get(token)
}

export function cancelBookingByToken(token) {
  const booking = getBookingByCancelToken(token)
  if (!booking) return null
  if (booking.status === 'cancelled') return booking
  db.prepare(`UPDATE bookings SET status = 'cancelled' WHERE cancel_token = ?`).run(token)
  return getBookingByCancelToken(token)
}

export function getBookingsByDate(date) {
  return db
    .prepare(`SELECT booking_time, status FROM bookings WHERE booking_date = ? AND status != 'cancelled'`)
    .all(date)
}

export function getAllBookings() {
  return db
    .prepare('SELECT * FROM bookings ORDER BY booking_date DESC, booking_time DESC, created_at DESC')
    .all()
}

export function updateBookingStatus(id, status) {
  db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, id)
  return getBookingById(id)
}

// ─── Admin sessions (u bazi, ne u browseru) ───

const SESSION_DAYS = 7

export function createAdminSession() {
  const id = randomUUID()
  const expires = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000).toISOString()
  db.prepare('INSERT INTO admin_sessions (id, expires_at) VALUES (?, ?)').run(id, expires)
  return id
}

export function getAdminSession(id) {
  if (!id) return null
  const row = db.prepare('SELECT * FROM admin_sessions WHERE id = ?').get(id)
  if (!row) return null
  if (new Date(row.expires_at) < new Date()) {
    db.prepare('DELETE FROM admin_sessions WHERE id = ?').run(id)
    return null
  }
  return row
}

export function deleteAdminSession(id) {
  if (id) db.prepare('DELETE FROM admin_sessions WHERE id = ?').run(id)
}

// ─── Salon settings (radno vreme, trajanje termina) ───

import { normalizeSchedule } from './schedule-normalize.js'

export const DEFAULT_SALON_SETTINGS = {
  appointmentDuration: 60,
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

export function getSalonSettings() {
  const rows = db.prepare(`SELECT key, value FROM settings WHERE key IN ('schedule', 'appointment_duration')`).all()
  const map = Object.fromEntries(rows.map((r) => [r.key, r.value]))

  let schedule = { ...DEFAULT_SALON_SETTINGS.schedule }
  if (map.schedule) {
    try {
      schedule = normalizeSchedule(JSON.parse(map.schedule))
    } catch {
      schedule = { ...DEFAULT_SALON_SETTINGS.schedule }
    }
  } else {
    schedule = normalizeSchedule(schedule)
  }

  const duration = Number(map.appointment_duration)
  const allowedDurations = [20, 30, 40, 50, 60, 90, 120]
  return {
    appointmentDuration: allowedDurations.includes(duration)
      ? duration
      : DEFAULT_SALON_SETTINGS.appointmentDuration,
    schedule,
  }
}

export function saveSalonSettings({ schedule, appointmentDuration }) {
  const upsert = db.prepare(`
    INSERT INTO settings (key, value) VALUES (@key, @value)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value
  `)
  upsert.run({ key: 'schedule', value: JSON.stringify(schedule) })
  upsert.run({ key: 'appointment_duration', value: String(appointmentDuration) })
  return getSalonSettings()
}

export default db
