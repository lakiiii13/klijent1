import nodemailer from 'nodemailer'
import { formatDateSr, serviceLabels } from './schedule.js'

const salonEmail = process.env.SALON_EMAIL || 'majstorovic9@gmail.com'
const salonName = process.env.SALON_NAME || 'La Vie Spray Tan Salon'

function getSiteUrl() {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return 'http://localhost:5173'
}

export function getEmailProvider() {
  if (process.env.RESEND_API_KEY) return 'resend'
  if (process.env.BREVO_API_KEY) return 'brevo'
  // Gmail SMTP ne radi sa Rendera — u produkciji samo HTTP API
  if (process.env.NODE_ENV === 'production') return null
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) return 'smtp'
  return null
}

export function isEmailConfigured() {
  return Boolean(getEmailProvider())
}

/** @deprecated use isEmailConfigured */
export function isSmtpConfigured() {
  return isEmailConfigured()
}

let cachedTransporter = null

function getTransporter() {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null

  if (cachedTransporter) return cachedTransporter

  const pass = SMTP_PASS.replace(/\s/g, '')
  const isGmail = SMTP_HOST.includes('gmail')

  cachedTransporter = isGmail
    ? nodemailer.createTransport({
        service: 'gmail',
        auth: { user: SMTP_USER, pass },
      })
    : nodemailer.createTransport({
        host: SMTP_HOST,
        port: Number(SMTP_PORT || 587),
        secure: SMTP_PORT === '465',
        auth: { user: SMTP_USER, pass },
        connectionTimeout: 15_000,
        greetingTimeout: 15_000,
        socketTimeout: 20_000,
      })

  return cachedTransporter
}

async function sendViaResend({ to, subject, html }) {
  const from = process.env.EMAIL_FROM || `${salonName} <onboarding@resend.dev>`
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(body || `Resend HTTP ${res.status}`)
  }
}

async function sendViaBrevo({ to, subject, html }) {
  const senderEmail =
    process.env.BREVO_SENDER_EMAIL || process.env.SMTP_USER || salonEmail

  const res = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sender: { name: salonName, email: senderEmail },
      to: [{ email: to }],
      subject,
      htmlContent: html,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    throw new Error(body || `Brevo HTTP ${res.status}`)
  }
}

async function sendViaSmtp({ to, subject, html }) {
  const transporter = getTransporter()
  if (!transporter) throw new Error('SMTP nije podešen')

  await transporter.sendMail({
    from: `"${salonName}" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  })
}

export async function verifyEmailConnection() {
  const provider = getEmailProvider()
  if (!provider) {
    return { ok: false, error: 'Email nije podešen (dodaj BREVO_API_KEY ili RESEND_API_KEY na Renderu)' }
  }

  if (provider === 'resend' || provider === 'brevo') {
    return { ok: true, provider }
  }

  const transporter = getTransporter()
  if (!transporter) {
    return { ok: false, error: 'SMTP nije podešen' }
  }

  try {
    await transporter.verify()
    return { ok: true, provider: 'smtp' }
  } catch (err) {
    return { ok: false, error: err.message, provider: 'smtp' }
  }
}

/** @deprecated */
export async function verifySmtpConnection() {
  return verifyEmailConnection()
}

function baseTemplate(title, body) {
  return `
<!DOCTYPE html>
<html lang="sr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#FDFBF9;font-family:Georgia,serif;">
  <div style="max-width:560px;margin:40px auto;background:#fff;border:1px solid #EDE6DF;">
    <div style="background:#6B5646;padding:28px 32px;">
      <h1 style="margin:0;color:#FDFBF9;font-size:22px;letter-spacing:0.12em;font-weight:600;">LA VIE</h1>
      <p style="margin:8px 0 0;color:rgba(253,251,249,0.7);font-size:12px;font-family:sans-serif;">Spray Tan Salon · Čačak</p>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 20px;color:#2C2420;font-size:20px;font-weight:500;">${title}</h2>
      ${body}
    </div>
    <div style="padding:20px 32px;background:#F5F0EB;border-top:1px solid #EDE6DF;">
      <p style="margin:0;font-size:11px;color:#6B5E58;font-family:sans-serif;">
        ${salonName} · Bulevar vojvode Putnika, Čačak · +381 69 190 9009
      </p>
    </div>
  </div>
</body>
</html>`
}

function bookingDetails(booking) {
  const service = serviceLabels[booking.service] || booking.service
  return `
    <table style="width:100%;font-family:sans-serif;font-size:14px;color:#2C2420;border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#6B5E58;">Ime</td><td style="padding:8px 0;text-align:right;">${booking.name}</td></tr>
      <tr><td style="padding:8px 0;color:#6B5E58;">Email</td><td style="padding:8px 0;text-align:right;">${booking.email}</td></tr>
      <tr><td style="padding:8px 0;color:#6B5E58;">Telefon</td><td style="padding:8px 0;text-align:right;">${booking.phone}</td></tr>
      <tr><td style="padding:8px 0;color:#6B5E58;">Usluga</td><td style="padding:8px 0;text-align:right;">${service}</td></tr>
      <tr><td style="padding:8px 0;color:#6B5E58;">Datum</td><td style="padding:8px 0;text-align:right;">${formatDateSr(booking.booking_date)}</td></tr>
      <tr><td style="padding:8px 0;color:#6B5E58;">Vreme</td><td style="padding:8px 0;text-align:right;font-weight:600;">${booking.booking_time}</td></tr>
      ${booking.notes ? `<tr><td style="padding:8px 0;color:#6B5E58;">Napomena</td><td style="padding:8px 0;text-align:right;">${booking.notes}</td></tr>` : ''}
    </table>`
}

function cancelButton(booking) {
  if (!booking.cancel_token || booking.status === 'cancelled') return ''
  const url = `${getSiteUrl()}/otkazi/${booking.cancel_token}`
  return `
    <div style="margin-top:28px;padding:20px;border:1px solid #EDE6DF;background:#FDFBF9;text-align:center;">
      <p style="margin:0 0 14px;font-family:sans-serif;font-size:13px;color:#6B5E58;">
        Ne možete doći na termin?
      </p>
      <a href="${url}"
         style="display:inline-block;padding:14px 32px;background:#8B5E4A;color:#FFFFFF;text-decoration:none;font-family:sans-serif;font-size:12px;font-weight:600;letter-spacing:0.14em;">
        OTKAŽI TERMIN
      </a>
      <p style="margin:12px 0 0;font-family:sans-serif;font-size:11px;color:#A0715A;">
        Termin će biti oslobođen odmah nakon otkazivanja.
      </p>
    </div>`
}

async function sendMail({ to, subject, html }) {
  const provider = getEmailProvider()
  if (!provider) {
    console.warn(`📧 EMAIL preskočen (nije podešen) → To: ${to}, Subject: ${subject}`)
    return { sent: false, logged: true }
  }

  const senders = {
    resend: sendViaResend,
    brevo: sendViaBrevo,
    smtp: sendViaSmtp,
  }

  try {
    await senders[provider]({ to, subject, html })
    console.log(`📧 Email poslat [${provider}] → ${to}: ${subject}`)
    return { sent: true, provider }
  } catch (err) {
    console.error(`📧 Email GREŠKA [${provider}] → ${to}: ${err.message}`)
    throw err
  }
}

export async function sendTestEmail(to) {
  await sendMail({
    to,
    subject: 'La Vie — test mejl',
    html: baseTemplate(
      'Test mejl uspešan',
      `<p style="font-family:sans-serif;font-size:14px;color:#6B5E58;">
         Email sistem radi. Ovo je probni mejl sa La Vie sajta.
       </p>`
    ),
  })
}

export async function sendNewBookingEmails(booking) {
  const service = serviceLabels[booking.service] || booking.service

  await sendMail({
    to: salonEmail,
    subject: `🆕 Nova rezervacija — ${booking.name} · ${booking.booking_date} ${booking.booking_time}`,
    html: baseTemplate(
      'Nova rezervacija termina',
      `${bookingDetails(booking)}
       <p style="margin:24px 0 0;font-family:sans-serif;font-size:13px;color:#6B5E58;">
         Prijavite se u <strong>admin panel</strong> da potvrdite ili otkažete termin.
       </p>
       <p style="margin:16px 0 0;font-family:sans-serif;font-size:12px;color:#A0715A;">
         Status: <strong>Na čekanju</strong>
       </p>`
    ),
  })

  await sendMail({
    to: booking.email,
    subject: `La Vie — Vaš zahtev za termin (${service})`,
    html: baseTemplate(
      'Primili smo vaš zahtev',
      `<p style="font-family:sans-serif;font-size:14px;color:#6B5E58;line-height:1.7;">
         Hvala, ${booking.name}! Vaš zahtev za termin je uspešno poslat.
         Potvrdu ćete dobiti na email čim salon pregleda rezervaciju.
       </p>
       ${bookingDetails(booking)}
       <p style="margin:24px 0 0;padding:16px;background:#F5F0EB;font-family:sans-serif;font-size:13px;color:#8B5E4A;">
         ⏳ Status: <strong>Na čekanju potvrde</strong>
       </p>
       ${cancelButton(booking)}`
    ),
  })
}

export async function sendStatusEmail(booking, status) {
  const service = serviceLabels[booking.service] || booking.service

  if (status === 'confirmed') {
    await sendMail({
      to: booking.email,
      subject: `✅ La Vie — Termin potvrđen (${service})`,
      html: baseTemplate(
        'Vaš termin je potvrđen!',
        `<p style="font-family:sans-serif;font-size:14px;color:#6B5E58;line-height:1.7;">
           Draga ${booking.name}, sa zadovoljstvom potvrđujemo vaš termin u La Vie salonu.
           Vidimo se uskoro!
         </p>
         ${bookingDetails(booking)}
         <p style="margin:24px 0 0;padding:16px;background:#F5F0EB;font-family:sans-serif;font-size:13px;color:#6B5646;">
           ✅ Status: <strong>Potvrđeno</strong>
         </p>
         <p style="margin:16px 0 0;font-family:sans-serif;font-size:12px;color:#6B5E58;">
           Adresa: Bulevar vojvode Putnika, Čačak
         </p>
         ${cancelButton(booking)}`
      ),
    })
  }

  if (status === 'cancelled') {
    await sendMail({
      to: booking.email,
      subject: `La Vie — Termin otkazan (${service})`,
      html: baseTemplate(
        'Termin je otkazan',
        `<p style="font-family:sans-serif;font-size:14px;color:#6B5E58;line-height:1.7;">
           Poštovana ${booking.name}, vaš termin u La Vie salonu je otkazan.
           Za novi termin kontaktirajte nas ili zakažite ponovo na sajtu.
         </p>
         ${bookingDetails(booking)}
         <p style="margin:24px 0 0;font-family:sans-serif;font-size:13px;color:#6B5E58;">
           Telefon: +381 69 190 9009 · ${salonEmail}
         </p>`
      ),
    })
  }
}

export async function sendClientSelfCancelEmails(booking) {
  const service = serviceLabels[booking.service] || booking.service

  await sendMail({
    to: salonEmail,
    subject: `❌ Klijent otkazao — ${booking.name} · ${booking.booking_date} ${booking.booking_time}`,
    html: baseTemplate(
      'Klijent je otkazao termin',
      `<p style="font-family:sans-serif;font-size:14px;color:#6B5E58;line-height:1.7;">
         ${booking.name} je samostalno otkazao/la termin preko linka u emailu.
         Termin je oslobođen u sistemu.
       </p>
       ${bookingDetails(booking)}`
    ),
  })

  await sendMail({
    to: booking.email,
    subject: `La Vie — Termin otkazan (${service})`,
    html: baseTemplate(
      'Uspešno ste otkazali termin',
      `<p style="font-family:sans-serif;font-size:14px;color:#6B5E58;line-height:1.7;">
         ${booking.name}, vaš termin u La Vie salonu je uspešno otkazan.
         Nadam se da se vidimo uskoro!
       </p>
       ${bookingDetails(booking)}
       <p style="margin:24px 0 0;font-family:sans-serif;font-size:13px;color:#6B5E58;">
         Za novi termin posetite naš sajt ili nas pozovite: +381 69 190 9009
       </p>`
    ),
  })
}
