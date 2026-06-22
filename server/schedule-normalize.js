function parseTime(time) {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function formatTime(minutes) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Stari format { start, end } → novi [{ start, end }, ...] */
export function normalizeDayPeriods(dayHours) {
  if (dayHours === null || dayHours === undefined) return null
  if (Array.isArray(dayHours)) {
    return dayHours.length
      ? dayHours.map((p) => ({ start: p.start, end: p.end }))
      : null
  }
  if (dayHours.start && dayHours.end) {
    return [{ start: dayHours.start, end: dayHours.end }]
  }
  return null
}

export function normalizeSchedule(schedule) {
  const out = {}
  for (let day = 0; day <= 6; day += 1) {
    const raw = schedule?.[day] ?? schedule?.[String(day)]
    out[day] = normalizeDayPeriods(raw)
  }
  return out
}

export function suggestNextPeriod(periods) {
  if (!periods?.length) return { start: '09:00', end: '17:00' }

  const last = periods[periods.length - 1]
  const gapStart = parseTime(last.end) + 60
  const startMins = Math.min(gapStart, 19 * 60)
  const endMins = Math.min(startMins + 120, 20 * 60)

  if (endMins <= startMins) {
    return { start: '18:00', end: '20:00' }
  }

  return { start: formatTime(startMins), end: formatTime(endMins) }
}
