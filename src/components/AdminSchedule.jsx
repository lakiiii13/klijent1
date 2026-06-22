import { useState, useEffect } from 'react'
import { getAdminSettings, updateAdminSettings } from '../lib/api'

const DEFAULT_PERIOD = { start: '09:00', end: '17:00' }

function normalizeSchedule(schedule) {
  const out = {}
  for (let day = 0; day <= 6; day += 1) {
    const raw = schedule?.[day] ?? schedule?.[String(day)]
    if (!raw) {
      out[day] = null
    } else if (Array.isArray(raw)) {
      out[day] = raw.map((p) => ({ start: p.start, end: p.end }))
    } else {
      out[day] = [{ start: raw.start, end: raw.end }]
    }
  }
  return out
}

function suggestNextPeriod(periods) {
  if (!periods?.length) return { ...DEFAULT_PERIOD }
  const last = periods[periods.length - 1]
  const [lh, lm] = last.end.split(':').map(Number)
  const gapMins = lh * 60 + lm + 60
  const fmt = (m) =>
    `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
  const startMins = Math.min(gapMins, 19 * 60)
  const endMins = Math.min(startMins + 120, 20 * 60)
  if (endMins <= startMins) return { start: '18:00', end: '20:00' }
  return { start: fmt(startMins), end: fmt(endMins) }
}

function formatGap(beforeEnd, afterStart) {
  const [eh, em] = beforeEnd.split(':').map(Number)
  const [sh, sm] = afterStart.split(':').map(Number)
  const mins = sh * 60 + sm - (eh * 60 + em)
  if (mins <= 0) return null
  const h = Math.floor(mins / 60)
  const m = mins % 60
  if (h && m) return `${h}h ${m}min pauza`
  if (h) return `${h}h pauza`
  return `${m} min pauza`
}

export default function AdminSchedule() {
  const [appointmentDuration, setAppointmentDuration] = useState(20)
  const [durationOptions, setDurationOptions] = useState([10, 20, 30, 40, 50, 60, 90, 120])
  const [schedule, setSchedule] = useState(normalizeSchedule({}))
  const [dayLabels, setDayLabels] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    getAdminSettings()
      .then((data) => {
        setAppointmentDuration(data.appointmentDuration ?? 20)
        setDurationOptions(data.durationOptions || [10, 20, 30, 40, 50, 60, 90, 120])
        setSchedule(normalizeSchedule(data.schedule))
        setDayLabels(data.dayLabels || [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  const toggleDay = (day) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: prev[day] ? null : [{ ...DEFAULT_PERIOD }],
    }))
  }

  const updatePeriod = (day, index, field, value) => {
    setSchedule((prev) => {
      const periods = [...prev[day]]
      periods[index] = { ...periods[index], [field]: value }
      return { ...prev, [day]: periods }
    })
  }

  const addPeriod = (day) => {
    setSchedule((prev) => ({
      ...prev,
      [day]: [...prev[day], suggestNextPeriod(prev[day])],
    }))
  }

  const removePeriod = (day, index) => {
    setSchedule((prev) => {
      const periods = prev[day].filter((_, i) => i !== index)
      return { ...prev, [day]: periods.length ? periods : null }
    })
  }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      const data = await updateAdminSettings({ schedule, appointmentDuration })
      setAppointmentDuration(data.appointmentDuration)
      setSchedule(normalizeSchedule(data.schedule))
      setSuccess('Podešavanja su sačuvana.')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-ink-muted">Učitavanje podešavanja...</p>
  }

  const labels =
    dayLabels.length > 0
      ? dayLabels
      : ['Nedelja', 'Ponedeljak', 'Utorak', 'Sreda', 'Četvrtak', 'Petak', 'Subota']

  return (
    <form onSubmit={handleSave} className="space-y-8">
      {error && (
        <div className="border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div className="border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {success}
        </div>
      )}

      <section className="bg-white p-6 shadow-sm">
        <h2 className="mb-1 font-serif text-xl text-ink">Trajanje termina</h2>
        <p className="mb-5 text-sm text-ink-muted">
          <strong>Trajanje tretmana</strong> — koliko minuta jedan klijent zauzima u salonu.
          Slotovi na sajtu idu na svakih <strong>10 minuta</strong> (08:00, 08:10, 08:20…), ali to
          nije trajanje — ako je tretman 20 min, rezervacija u 11:00 zauzima 11:00 i 11:10.
        </p>
        <div className="flex flex-wrap gap-2">
          {durationOptions.map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => setAppointmentDuration(mins)}
              className={`px-5 py-2.5 text-[11px] font-semibold tracking-[0.1em] transition-colors ${
                appointmentDuration === mins
                  ? 'bg-brown text-white'
                  : 'border border-brown/20 text-ink-muted hover:border-brown/40 hover:text-ink'
              }`}
            >
              {mins} MIN
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white p-6 shadow-sm">
        <h2 className="mb-1 font-serif text-xl text-ink">Radno vreme i pauze</h2>
        <p className="mb-6 text-sm leading-relaxed text-ink-muted">
          Za svaki dan dodaj jedan ili više radnih perioda. Između perioda je automatski pauza —
          npr. radiš 09:30–12:00, pauza, pa opet 13:00–20:00. Klikni „Dodaj još jedan period“ za
          pauzu usred dana.
        </p>

        <div className="space-y-4">
          {labels.map((label, day) => {
            const open = Boolean(schedule[day]?.length)
            return (
              <div
                key={day}
                className={`border transition-colors ${
                  open ? 'border-brown/15 bg-cream/30' : 'border-brown/10 bg-white'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brown/10 px-4 py-3">
                  <label className="flex cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={open}
                      onChange={() => toggleDay(day)}
                      className="h-4 w-4 accent-brown"
                    />
                    <span className="text-sm font-medium text-ink">{label}</span>
                  </label>
                  {open && (
                    <button
                      type="button"
                      onClick={() => addPeriod(day)}
                      className="text-[10px] font-semibold tracking-[0.12em] text-brown hover:underline"
                    >
                      + DODAJ JOŠ JEDAN PERIOD
                    </button>
                  )}
                </div>

                {open ? (
                  <div className="space-y-0 px-4 py-3">
                    {schedule[day].map((period, index) => (
                      <div key={index}>
                        {index > 0 && (
                          <div className="my-3 flex items-center gap-3">
                            <div className="h-px flex-1 bg-brown/15" />
                            <span className="text-[10px] font-medium tracking-[0.1em] text-ink-muted">
                              {formatGap(schedule[day][index - 1].end, period.start) || 'PAUZA'}
                            </span>
                            <div className="h-px flex-1 bg-brown/15" />
                          </div>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="w-20 text-[10px] tracking-[0.1em] text-ink-muted">
                            PERIOD {index + 1}
                          </span>
                          <input
                            type="time"
                            required
                            value={period.start}
                            onChange={(e) => updatePeriod(day, index, 'start', e.target.value)}
                            className="border border-brown/20 px-3 py-2 text-sm outline-none focus:border-brown"
                          />
                          <span className="text-ink-muted">—</span>
                          <input
                            type="time"
                            required
                            value={period.end}
                            onChange={(e) => updatePeriod(day, index, 'end', e.target.value)}
                            className="border border-brown/20 px-3 py-2 text-sm outline-none focus:border-brown"
                          />
                          {schedule[day].length > 1 && (
                            <button
                              type="button"
                              onClick={() => removePeriod(day, index)}
                              className="ml-auto text-[10px] tracking-[0.1em] text-red-600 hover:underline"
                            >
                              UKLONI
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="px-4 py-3 text-sm italic text-ink-muted">Zatvoreno</p>
                )}
              </div>
            )
          })}
        </div>
      </section>

      <button
        type="submit"
        disabled={saving}
        className="bg-brown px-8 py-3.5 text-[11px] font-semibold tracking-[0.15em] text-white hover:bg-brown-dark disabled:opacity-50"
      >
        {saving ? 'ČUVANJE...' : 'SAČUVAJ PODEŠAVANJA'}
      </button>
    </form>
  )
}
