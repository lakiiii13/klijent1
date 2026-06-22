import { getSalonSettings } from './db.js'
import { normalizeDayPeriods, normalizeSchedule, suggestNextPeriod } from './schedule-normalize.js'

export { normalizeDayPeriods, normalizeSchedule, suggestNextPeriod }

export const serviceLabels = {
  'spray-tan': 'Spray Tan',
  'natural-glow': 'Natural Glow',
  'deep-bronze': 'Deep Bronze',
}

export const DAY_LABELS = [
  'Nedelja',
  'Ponedeljak',
  'Utorak',
  'Sreda',
  'Četvrtak',
  'Petak',
  'Subota',
]

export const SLOT_INTERVAL = 10

export const APPOINTMENT_DURATION_OPTIONS = [10, 20, 30, 40, 50, 60, 90, 120]

const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d$/

function loadConfig() {
  return getSalonSettings()
}

function getDayPeriods(schedule, day) {
  return normalizeDayPeriods(schedule[day] ?? schedule[String(day)])
}

export function parseTime(time) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function formatTime(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function rangesOverlap(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && bStart < aEnd
}

function bookingWindow(booking, appointmentDuration) {
  const start = parseTime(booking.booking_time)
  return { start, end: start + appointmentDuration }
}

/** Da li 10-min slot [slotStart, slotStart+interval) pada u zauzet termin */
function isSlotOccupied(slotStart, bookedSlots, appointmentDuration) {
  const slotEnd = slotStart + SLOT_INTERVAL
  for (const b of bookedSlots) {
    const { start, end } = bookingWindow(b, appointmentDuration)
    if (rangesOverlap(slotStart, slotEnd, start, end)) return true
  }
  return false
}

/** Da li može da počne novi termin u slotStart (puna dužina tretmana) */
function canStartAt(slotStart, periodEnd, bookedSlots, appointmentDuration) {
  if (slotStart + appointmentDuration > periodEnd) return false
  const rangeEnd = slotStart + appointmentDuration
  for (const b of bookedSlots) {
    const { start, end } = bookingWindow(b, appointmentDuration)
    if (rangesOverlap(slotStart, rangeEnd, start, end)) return false
  }
  return true
}

function findPeriodContaining(periods, timeStr, appointmentDuration) {
  const t = parseTime(timeStr)
  return periods.find((p) => {
    const start = parseTime(p.start)
    const end = parseTime(p.end)
    return t >= start && t + appointmentDuration <= end
  })
}

export function getAllSlotsWithAvailability(dateStr, bookedSlots = []) {
  const { schedule, appointmentDuration } = loadConfig()
  const date = new Date(`${dateStr}T12:00:00`)
  const periods = getDayPeriods(schedule, date.getDay())

  if (!periods?.length) return []

  const slots = []
  const seen = new Set()

  for (const period of periods) {
    const start = parseTime(period.start)
    const end = parseTime(period.end)

    for (let t = start; t + SLOT_INTERVAL <= end; t += SLOT_INTERVAL) {
      const time = formatTime(t)
      if (seen.has(time)) continue
      seen.add(time)

      const fitsInPeriod = t + appointmentDuration <= end
      const occupied = isSlotOccupied(t, bookedSlots, appointmentDuration)
      const available = fitsInPeriod && canStartAt(t, end, bookedSlots, appointmentDuration)
      slots.push({
        time,
        available,
        occupied,
      })
    }
  }

  return slots.sort((a, b) => parseTime(a.time) - parseTime(b.time))
}

export function getAvailableSlots(dateStr, bookedSlots = []) {
  return getAllSlotsWithAvailability(dateStr, bookedSlots)
    .filter((s) => s.available)
    .map((s) => s.time)
}

export function isDateBookable(dateStr) {
  const { schedule } = loadConfig()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const date = new Date(`${dateStr}T12:00:00`)
  if (date < today) return false
  const periods = getDayPeriods(schedule, date.getDay())
  return Boolean(periods?.length)
}

export function isTimeSlotAvailableOnDate(dateStr, timeStr, bookedSlots = []) {
  const { schedule, appointmentDuration } = loadConfig()
  const date = new Date(`${dateStr}T12:00:00`)
  const periods = getDayPeriods(schedule, date.getDay())
  if (!periods?.length) return false

  if (!findPeriodContaining(periods, timeStr, appointmentDuration)) return false

  const start = parseTime(timeStr)
  const period = findPeriodContaining(periods, timeStr, appointmentDuration)
  return canStartAt(start, parseTime(period.end), bookedSlots, appointmentDuration)
}

export function formatDateSr(dateStr) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('sr-RS', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function validateScheduleInput(schedule, appointmentDuration) {
  if (!APPOINTMENT_DURATION_OPTIONS.includes(appointmentDuration)) {
    return 'Trajanje termina mora biti 10, 20, 30, 40, 50, 60, 90 ili 120 minuta.'
  }

  if (!schedule || typeof schedule !== 'object') {
    return 'Neispravno radno vreme.'
  }

  let hasOpenDay = false

  for (let day = 0; day <= 6; day += 1) {
    const raw = schedule[day] ?? schedule[String(day)]
    const periods = normalizeDayPeriods(raw)

    if (!periods?.length) {
      schedule[day] = null
      continue
    }

    const normalized = []

    for (let i = 0; i < periods.length; i += 1) {
      const p = periods[i]
      if (!p.start || !p.end || !TIME_RE.test(p.start) || !TIME_RE.test(p.end)) {
        return `Neispravno vreme za ${DAY_LABELS[day]} (period ${i + 1}).`
      }

      const start = parseTime(p.start)
      const end = parseTime(p.end)

      if (start >= end) {
        return `${DAY_LABELS[day]}, period ${i + 1}: kraj mora biti posle početka.`
      }

      if (end - start < appointmentDuration) {
        return `${DAY_LABELS[day]}, period ${i + 1}: prekratko za trajanje termina (${appointmentDuration} min).`
      }

      if (i > 0 && start < parseTime(normalized[i - 1].end)) {
        return `${DAY_LABELS[day]}: periodi se ne smeju preklapati.`
      }

      normalized.push({ start: p.start, end: p.end })
    }

    schedule[day] = normalized
    hasOpenDay = true
  }

  if (!hasOpenDay) {
    return 'Salon mora imati bar jedan radni dan.'
  }

  return null
}
