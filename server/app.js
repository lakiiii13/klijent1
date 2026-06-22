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
  isSupabaseConfigured,
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
import {
  sendNewBookingEmails,
  sendStatusEmail,
  sendClientSelfCancelEmails,
  sendTestEmail,
  isEmailConfigured,
  getEmailProvider,
  verifyEmailConnection,
} from './email.js'
import {
  authMiddleware,
  checkAdminPassword,
  SESSION_COOKIE,
  logoutSession,
} from './auth.js'

const app = express()
const SESSION_DAYS = 7
const isProd = process.env.NODE_ENV === 'production'
const isVercel = Boolean(process.env.VERCEL)

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

app.get('/api/health', async (_req, res) => {
  try {
    const bookings = isSupabaseConfigured() ? await getAllBookings() : []
    const settings = await getSalonSettings()
    res.json({
      ok: true,
      database: 'supabase',
      databaseConfigured: isSupabaseConfigured(),
      bookingCount: bookings.length,
      appointmentDurationMinutes: settings.appointmentDuration,
      slotIntervalMinutes: 10,
      emailConfigured: isEmailConfigured(),
      emailProvider: getEmailProvider(),
      siteUrl:
        process.env.SITE_URL ||
        (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null),
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ ok: false, error: err.message })
  }
})

app.get('/api/slots', async (req, res) => {
  try {
    const { date } = req.query
    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: 'Neispravan datum.' })
    }
    if (!(await isDateBookable(date))) {
      return res.json({ date, slots: [], closed: true })
    }
    const booked = await getBookingsByDate(date)
    const slots = await getAllSlotsWithAvailability(date, booked)
    res.json({ date, slots, closed: false })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Greška pri učitavanju termina.' })
  }
})

app.post('/api/bookings', async (req, res) => {
  try {
    const { name, email, phone, service, booking_date, booking_time, notes } = req.body

    if (!name?.trim() || !email?.trim() || !phone?.trim() || !service || !booking_date || !booking_time) {
      return res.status(400).json({ error: 'Popunite sva obavezna polja.' })
    }

    if (!(await isDateBookable(booking_date))) {
      return res.status(400).json({ error: 'Salon ne radi tog dana.' })
    }

    const booked = await getBookingsByDate(booking_date)
    if (!(await isTimeSlotAvailableOnDate(booking_date, booking_time, booked))) {
      return res.status(409).json({ error: 'Termin više nije dostupan.' })
    }

    const booking = await createBooking({
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

app.get('/api/bookings/cancel/:token', async (req, res) => {
  try {
    const booking = await getBookingByCancelToken(req.params.token)
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
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Greška na serveru.' })
  }
})

app.post('/api/bookings/cancel/:token', async (req, res) => {
  try {
    const existing = await getBookingByCancelToken(req.params.token)
    if (!existing) return res.status(404).json({ error: 'Link nije validan.' })
    if (existing.status === 'cancelled') {
      return res.json({ message: 'Termin je već otkazan.', alreadyCancelled: true })
    }

    const booking = await cancelBookingByToken(req.params.token)

    sendEmailsInBackground(() => sendClientSelfCancelEmails(booking), 'otkazivanje')

    res.json({ message: 'Termin je uspešno otkazan.', booking: { id: booking.id, status: booking.status } })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Greška pri otkazivanju.' })
  }
})

app.get('/api/admin/me', async (req, res) => {
  try {
    const session = await getAdminSession(req.cookies?.[SESSION_COOKIE])
    if (!session) return res.json({ loggedIn: false })
    res.json({ loggedIn: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Greška na serveru.' })
  }
})

app.post('/api/admin/login', async (req, res) => {
  try {
    const { password } = req.body
    if (!checkAdminPassword(password)) {
      return res.status(401).json({ error: 'Pogrešna lozinka.' })
    }

    const sessionId = await createAdminSession()
    res.cookie(SESSION_COOKIE, sessionId, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000,
      path: '/',
    })
    res.json({ ok: true, message: 'Uspješna prijava.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Greška pri prijavi.' })
  }
})

app.post('/api/admin/logout', async (req, res) => {
  try {
    await logoutSession(req, res)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Greška pri odjavi.' })
  }
})

app.get('/api/admin/bookings', authMiddleware, async (_req, res) => {
  try {
    res.json(await getAllBookings())
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Greška pri učitavanju rezervacija.' })
  }
})

app.post('/api/admin/test-email', authMiddleware, async (req, res) => {
  try {
    const to = req.body?.email?.trim() || process.env.SALON_EMAIL
    if (!to) return res.status(400).json({ error: 'Nema email adrese za test.' })
    if (!isEmailConfigured()) {
      return res.status(503).json({
        error: 'Email nije podešen. Dodaj BREVO_API_KEY u Environment.',
        emailProvider: null,
      })
    }
    await sendTestEmail(to)
    res.json({ ok: true, message: `Test mejl poslat na ${to}`, provider: getEmailProvider() })
  } catch (err) {
    console.error('Test email greška:', err.message)
    res.status(500).json({ error: err.message, provider: getEmailProvider() })
  }
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

    if (!(await isDateBookable(booking_date))) {
      return res.status(400).json({ error: 'Salon ne radi tog dana.' })
    }

    const booked = await getBookingsByDate(booking_date)
    if (!(await isTimeSlotAvailableOnDate(booking_date, booking_time, booked))) {
      return res.status(409).json({ error: 'Termin više nije dostupan.' })
    }

    const bookingStatus = status === 'pending' ? 'pending' : 'confirmed'
    const booking = await createBooking(
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

app.get('/api/admin/settings', authMiddleware, async (_req, res) => {
  try {
    const settings = await getSalonSettings()
    res.json({
      schedule: settings.schedule,
      appointmentDuration: settings.appointmentDuration,
      dayLabels: DAY_LABELS,
      durationOptions: APPOINTMENT_DURATION_OPTIONS,
      slotInterval: 10,
    })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Greška pri učitavanju podešavanja.' })
  }
})

app.patch('/api/admin/settings', authMiddleware, async (req, res) => {
  try {
    const { schedule, appointmentDuration } = req.body
    const duration = Number(appointmentDuration)
    const scheduleCopy = JSON.parse(JSON.stringify(schedule ?? {}))
    const error = validateScheduleInput(scheduleCopy, duration)
    if (error) return res.status(400).json({ error })

    const saved = await saveSalonSettings({ schedule: scheduleCopy, appointmentDuration: duration })
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

    const existing = await getBookingById(id)
    if (!existing) return res.status(404).json({ error: 'Rezervacija nije pronađena.' })

    if (status === 'confirmed') {
      const others = (await getAllBookings()).filter(
        (b) =>
          b.id !== id &&
          b.booking_date === existing.booking_date &&
          b.status === 'confirmed'
      )
      if (!(await isTimeSlotAvailableOnDate(existing.booking_date, existing.booking_time, others))) {
        return res.status(409).json({ error: 'Termin se preklapa sa drugom potvrđenom rezervacijom.' })
      }
    }

    const booking = await updateBookingStatus(id, status)

    if (status === 'confirmed' || status === 'cancelled') {
      sendEmailsInBackground(() => sendStatusEmail(booking, status), `status ${status}`)
    }

    res.json({ message: 'Status ažuriran.', booking })
  } catch (err) {
    console.error('Greška pri ažuriranju:', err)
    res.status(500).json({ error: 'Greška pri ažuriranju. Pokušajte ponovo.' })
  }
})

// Lokalni production server (Render) — na Vercelu statiku servira CDN
if (isProd && !isVercel) {
  const __dirname = dirname(fileURLToPath(import.meta.url))
  const distPath = join(__dirname, '..', 'dist')
  app.use(express.static(distPath))
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(join(distPath, 'index.html'))
  })
}

export default app
