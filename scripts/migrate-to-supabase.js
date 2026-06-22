import 'dotenv/config'
import Database from 'better-sqlite3'
import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

const BATCH_SIZE = 50

function findSqliteDb() {
  const candidates = [
    process.env.SQLITE_DB_PATH,
    join(root, 'data', 'bookings.db'),
    join(root, 'bookings.db'),
  ].filter(Boolean)

  for (const path of candidates) {
    if (existsSync(path)) return path
  }

  throw new Error(`SQLite database not found. Tried:\n  ${candidates.join('\n  ')}`)
}

function toIsoTimestamp(value) {
  if (!value) return new Date().toISOString()
  const normalized = String(value).includes('T') ? value : String(value).replace(' ', 'T') + 'Z'
  const date = new Date(normalized)
  if (Number.isNaN(date.getTime())) return new Date().toISOString()
  return date.toISOString()
}

function tableExists(db, name) {
  const row = db
    .prepare(`SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?`)
    .get(name)
  return Boolean(row)
}

function readTable(db, name) {
  if (!tableExists(db, name)) {
    console.log(`  SQLite: table "${name}" not found — skipping`)
    return []
  }
  return db.prepare(`SELECT * FROM ${name}`).all()
}

async function upsertBatches(supabase, table, rows, onConflict, label) {
  if (!rows.length) {
    console.log(`  ${label}: 0 rows`)
    return { migrated: 0, failed: 0 }
  }

  let migrated = 0
  let failed = 0

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error } = await supabase.from(table).upsert(batch, { onConflict })

    if (error) {
      console.error(`  ERROR ${label} [rows ${i + 1}-${i + batch.length}]: ${error.message}`)
      failed += batch.length
      continue
    }

    migrated += batch.length
    console.log(`  ${label}: ${migrated}/${rows.length} rows`)
  }

  return { migrated, failed }
}

function mapBookings(rows) {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    service: row.service,
    booking_date: row.booking_date,
    booking_time: row.booking_time,
    notes: row.notes ?? '',
    status: row.status ?? 'pending',
    cancel_token: row.cancel_token,
    created_at: toIsoTimestamp(row.created_at),
  }))
}

function mapSettings(rows) {
  return rows.map((row) => ({
    key: row.key,
    value: row.value,
  }))
}

function mapAdminSessions(rows) {
  return rows.map((row) => ({
    id: row.id,
    expires_at: toIsoTimestamp(row.expires_at),
    created_at: toIsoTimestamp(row.created_at),
  }))
}

function printSequenceNote(maxId) {
  if (!maxId) return
  console.log(
    `\n  Tip: if new bookings fail on duplicate id, run in Supabase SQL Editor:\n` +
      `  SELECT setval(pg_get_serial_sequence('bookings', 'id'), ${maxId});`
  )
}

async function main() {
  console.log('=== SQLite → Supabase migration ===\n')

  const dbPath = findSqliteDb()
  console.log(`SQLite database: ${dbPath}`)

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env')
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const sqlite = new Database(dbPath, { readonly: true })

  const rawBookings = readTable(sqlite, 'bookings')
  const rawSettings = readTable(sqlite, 'settings')
  const rawSessions = readTable(sqlite, 'admin_sessions')

  console.log(
    `\nRead from SQLite: ${rawBookings.length} bookings, ${rawSettings.length} settings, ${rawSessions.length} admin_sessions\n`
  )

  const summary = {}

  console.log('Migrating bookings...')
  summary.bookings = await upsertBatches(
    supabase,
    'bookings',
    mapBookings(rawBookings),
    'id',
    'bookings'
  )

  console.log('Migrating settings...')
  summary.settings = await upsertBatches(
    supabase,
    'settings',
    mapSettings(rawSettings),
    'key',
    'settings'
  )

  console.log('Migrating admin_sessions...')
  summary.admin_sessions = await upsertBatches(
    supabase,
    'admin_sessions',
    mapAdminSessions(rawSessions),
    'id',
    'admin_sessions'
  )

  const maxBookingId = rawBookings.length ? Math.max(...rawBookings.map((r) => r.id)) : 0
  if (maxBookingId > 0 && summary.bookings.failed === 0) {
    printSequenceNote(maxBookingId)
  }

  sqlite.close()

  console.log('\n=== Migration summary ===')
  for (const [table, result] of Object.entries(summary)) {
    const status = result.failed ? ' (with errors)' : ''
    console.log(`  ${table}: ${result.migrated} migrated, ${result.failed} failed${status}`)
  }

  const totalFailed = Object.values(summary).reduce((n, r) => n + r.failed, 0)
  if (totalFailed > 0) {
    process.exitCode = 1
    console.log('\nMigration finished with errors.')
  } else {
    console.log('\nMigration completed successfully.')
  }
}

main().catch((err) => {
  console.error('\nFatal error:', err.message)
  process.exit(1)
})
