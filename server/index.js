import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import {
  createBooking,
  getBookingById,
  getBookingsByDate,
  getAllBookings,
  updateBookingStatus,
  createAdminSession,
  getAdminSession,
  getBookingByCancelToken,
  cancelBookingByToken,
  getSalonSettings,
  saveSalonSettings,
  databasePath,
} from './db.js'
import {
  getAllSlotsWithAvailability,
  isDateBookable,
  isTimeSlotAvailableOnDate,
  serviceLabels,
  formatDateSr,
  validateScheduleInput,
  DAY_LABELS,
  APPOINTMENT_DURATION_OPTIONS,
} from './schedule.js'
import { sendNewBookingEmails, sendStatusEmail, sendClientSelfCancelEmails, isEmailConfigured, getEmailProvider, verifyEmailConnection } from './email.js'
import {
  authMiddleware,
  checkAdminPassword,
  SESSION_COOKIE,
  logoutSession,
} from './auth.js'

const app = express()
const PORT = process.env.PORT || 3001
const SESSION_DAYS = 7
const isProd = process.env.NODE_ENV === 'production'

function sendEmailsInBackground(task, label) {
  Promise.resolve()
    .then(task)
    .catch((err) => console.error(`Email nije poslat (${label}):`, err.message))
}

if (isProd) {
  app.set('trust proxy', 1)
}

app.use(cors({ origin: true, credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.get('/api/health', (_req, res) => {
  const bookings = getAllBookings()
  res.json({
    ok: true,
    database: 'sqlite',
    databasePath,
    bookingCount: bookings.length,
    appointmentDurationMinutes: getSalonSettings().appointmentDuration,
    slotIntervalMinutes: 10,
    smtpConfigured: isEmailConfigured(),
    emailProvider: getEmailProvider(),
    siteUrl: process.env.SITE_URL || null,
  })
})

app.get('/api/slots', (req, res) => {
  const { date } = req.query
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Neispravan datum.' })
  }
  if (!isDateBookable(date)) {
    return res.json({ date, slots: [], closed: true })
  }
  const booked = getBookingsByDate(date)
  const slots = getAllSlotsWithAvailability(date, booked)
  res.json({ date, slots, closed: false })
})

app.post('/api/bookings', async (req, res) => {
  try {
    const { name, email, phone, service, booking_date, booking_time, notes } = req.body

    if (!name?.trim() || !email?.trim() || !phone?.trim() || !service || !booking_date || !booking_time) {
      return res.status(400).json({ error: 'Popunite sva obavezna polja.' })
    }

    if (!isDateBookable(booking_date)) {
      return res.status(400).json({ error: 'Salon ne radi tog dana.' })
    }

    const booked = getBookingsByDate(booking_date)
    if (!isTimeSlotAvailableOnDate(booking_date, booking_time, booked)) {
      return res.status(409).json({ error: 'Termin više nije dostupan.' })
    }

    const booking = createBooking({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      service,
      booking_date,
      booking_time,
      notes: notes?.trim() || '',
    })

    sendEmailsInBackground(() => sendNewBookingEmails(booking), 'nova rezervacija')

    res.status(201).json({
      message: 'Rezervacija je poslata! Potvrdu ćete dobiti na email.',
      booking: { id: booking.id, status: booking.status },
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Greška pri rezervaciji.' })
  }
})

app.get('/api/bookings/cancel/:token', (req, res) => {
  const booking = getBookingByCancelToken(req.params.token)
  if (!booking) return res.status(404).json({ error: 'Link nije validan ili je istekao.' })

  res.json({
    name: booking.name,
    service: serviceLabels[booking.service] || booking.service,
    booking_date: booking.booking_date,
    booking_date_formatted: formatDateSr(booking.booking_date),
    booking_time: booking.booking_time,
    status: booking.status,
    can_cancel: booking.status !== 'cancelled',
  })
})

app.post('/api/bookings/cancel/:token', async (req, res) => {
  try {
    const existing = getBookingByCancelToken(req.params.token)
    if (!existing) return res.status(404).json({ error: 'Link nije validan.' })
    if (existing.status === 'cancelled') {
      return res.json({ message: 'Termin je već otkazan.', alreadyCancelled: true })
    }

    const booking = cancelBookingByToken(req.params.token)

    sendEmailsInBackground(() => sendClientSelfCancelEmails(booking), 'otkazivanje')

    res.json({ message: 'Termin je uspešno otkazan.', booking: { id: booking.id, status: booking.status } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Greška pri otkazivanju.' })
  }
})

app.get('/api/admin/me', (req, res) => {
  const session = getAdminSession(req.cookies?.[SESSION_COOKIE])
  if (!session) return res.json({ loggedIn: false })
  res.json({ loggedIn: true })
})

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body
  if (!checkAdminPassword(password)) {
    return res.status(401).json({ error: 'Pogrešna lozinka.' })
  }

  const sessionId = createAdminSession()
  res.cookie(SESSION_COOKIE, sessionId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
    path: '/',
  })
  res.json({ ok: true, message: 'Uspješna prijava.' })
})

app.post('/api/admin/logout', (req, res) => {
  logoutSession(req, res)
  res.json({ ok: true })
})

app.get('/api/admin/bookings', authMiddleware, (_req, res) => {
  res.json(getAllBookings())
})

app.post('/api/admin/bookings', authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, service, booking_date, booking_time, notes, status } = req.body

    if (!name?.trim() || !phone?.trim() || !service || !booking_date || !booking_time) {
      return res.status(400).json({ error: 'Ime, telefon, usluga, datum i vreme su obavezni.' })
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(booking_date)) {
      return res.status(400).json({ error: 'Neispravan datum.' })
    }

    if (!isDateBookable(booking_date)) {
      return res.status(400).json({ error: 'Salon ne radi tog dana.' })
    }

    const booked = getBookingsByDate(booking_date)
    if (!isTimeSlotAvailableOnDate(booking_date, booking_time, booked)) {
      return res.status(409).json({ error: 'Termin više nije dostupan.' })
    }

    const bookingStatus = status === 'pending' ? 'pending' : 'confirmed'
    const booking = createBooking(
      {
        name: name.trim(),
        email: email?.trim() || '',
        phone: phone.trim(),
        service,
        booking_date,
        booking_time,
        notes: notes?.trim() || '',
      },
      bookingStatus
    )

    if (booking.email) {
      sendEmailsInBackground(() => sendStatusEmail(booking, bookingStatus), 'admin rezervacija')
    }

    res.status(201).json({
      message: bookingStatus === 'confirmed' ? 'Termin je zakazan i potvrđen.' : 'Termin je dodat.',
      booking,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Greška pri zakazivanju.' })
  }
})

app.get('/api/admin/settings', authMiddleware, (_req, res) => {
  const settings = getSalonSettings()
  res.json({
    schedule: settings.schedule,
    appointmentDuration: settings.appointmentDuration,
    dayLabels: DAY_LABELS,
    durationOptions: APPOINTMENT_DURATION_OPTIONS,
    slotInterval: 10,
  })
})

app.patch('/api/admin/settings', authMiddleware, (req, res) => {
  try {
    const { schedule, appointmentDuration } = req.body
    const duration = Number(appointmentDuration)
    const scheduleCopy = JSON.parse(JSON.stringify(schedule ?? {}))
    const error = validateScheduleInput(scheduleCopy, duration)
    if (error) return res.status(400).json({ error })

    const saved = saveSalonSettings({ schedule: scheduleCopy, appointmentDuration: duration })
    res.json({
      message: 'Podešavanja sačuvana.',
      schedule: saved.schedule,
      appointmentDuration: saved.appointmentDuration,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Greška pri čuvanju podešavanja.' })
  }
})

app.patch('/api/admin/bookings/:id', authMiddleware, async (req, res) => {
  try {
    const id = Number(req.params.id)
    const status = req.body?.status

    if (!status || !['confirmed', 'cancelled', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'Neispravan status.' })
    }

    const existing = getBookingById(id)
    if (!existing) return res.status(404).json({ error: 'Rezervacija nije pronađena.' })

    if (status === 'confirmed') {
      const others = getAllBookings().filter(
        (b) =>
          b.id !== id &&
          b.booking_date === existing.booking_date &&
          b.status === 'confirmed'
      )
      if (!isTimeSlotAvailableOnDate(existing.booking_date, existing.booking_time, others)) {
        return res.status(409).json({ error: 'Termin se preklapa sa drugom potvrđenom rezervacijom.' })
      }
    }

    const booking = updateBookingStatus(id, status)

    if (status === 'confirmed' || status === 'cancelled') {
      sendEmailsInBackground(() => sendStatusEmail(booking, status), `status ${status}`)
    }

    res.json({ message: 'Status ažuriran.', booking })
  } catch (err) {
    console.error('Greška pri ažuriranju:', err)
    res.status(500).json({ error: 'Greška pri ažuriranju. Pokušajte ponovo.' })
  }
})

const __dirname = dirname(fileURLToPath(import.meta.url))
const distPath = join(__dirname, '..', 'dist')

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(distPath))
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(join(distPath, 'index.html'))
  })
}

const server = app.listen(PORT, async () => {
  console.log(`\n🌸 La Vie API → port ${PORT}`)
  console.log(`   Baza: ${databasePath}`)
  console.log(`   SITE_URL: ${process.env.SITE_URL || '(nije podešen)'}`)
  console.log(`   SALON_EMAIL: ${process.env.SALON_EMAIL || '(nije podešen)'}`)

  if (!isEmailConfigured()) {
    if (process.env.NODE_ENV === 'production') {
      console.error('   ❌ MEJLOVI NE RADE — dodaj BREVO_API_KEY na Renderu (Settings → SMTP & API → API Keys)')
      console.error('      Obriši SMTP_USER i SMTP_PASS sa Rendera — Gmail ne radi u cloudu.')
    } else {
      console.warn('   ⚠️  Email nije podešen — dodaj BREVO_API_KEY ili SMTP u .env')
    }
  } else {
    const email = await verifyEmailConnection()
    if (email.ok) {
      console.log(`   ✅ Email spreman [${email.provider}]`)
    } else {
      console.error(`   ❌ Email greška: ${email.error}`)
    }
  }
  console.log('')
})

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Port ${PORT} je zauzet! Pokreni ponovo: npm run dev\n`)
  } else {
    console.error(err)
  }
  process.exit(1)
})
