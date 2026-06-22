import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { services } from '../data/site'
import { getSlots, createBooking } from '../lib/api'
import { slotButtonClass } from '../lib/slotStyles'

const STEPS = [
  { id: 1, label: 'Usluga' },
  { id: 2, label: 'Datum' },
  { id: 3, label: 'Vreme' },
  { id: 4, label: 'Podaci' },
  { id: 5, label: 'Potvrda' },
]

function tomorrowISO() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

function formatDateSr(dateStr) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('sr-RS', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function serviceTitle(id) {
  return services.find((s) => s.id === id)?.title ?? id
}

export default function BookingForm() {
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    service: '',
    booking_date: '',
    booking_time: '',
    notes: '',
  })
  const [slots, setSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [closed, setClosed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [slotsRefresh, setSlotsRefresh] = useState(0)

  const maxReachedStep = form.service
    ? form.booking_date
      ? form.booking_time
        ? form.name && form.email && form.phone
          ? 5
          : 4
        : 3
      : 2
    : 1

  const loadSlots = useCallback((date) => {
    if (!date) return
    setLoadingSlots(true)
    setError('')
    getSlots(date)
      .then((data) => {
        setClosed(data.closed)
        const list = data.slots || []
        setSlots(list)
        const firstFree = list.find((s) => s.available)?.time
        setForm((f) => ({
          ...f,
          booking_time:
            list.find((s) => s.time === f.booking_time && s.available)?.time || firstFree || '',
        }))
      })
      .catch((err) => setError(err.message || 'Nije moguće učitati termine.'))
      .finally(() => setLoadingSlots(false))
  }, [])

  useEffect(() => {
    if (form.booking_date && step >= 3) {
      loadSlots(form.booking_date)
    }
  }, [form.booking_date, slotsRefresh, loadSlots, step])

  const hasFreeSlot = slots.some((s) => s.available)

  const selectService = (serviceId) => {
    setError('')
    setForm((f) => ({ ...f, service: serviceId }))
    setStep(2)
  }

  const selectDate = (date) => {
    setError('')
    setForm((f) => ({ ...f, booking_date: date, booking_time: '' }))
    setStep(3)
  }

  const selectTime = (time) => {
    setError('')
    setForm((f) => ({ ...f, booking_time: time }))
    setStep(4)
  }

  const handleSlotClick = (slot) => {
    if (slot.occupied) return
    if (!slot.available) {
      setError('Termin se preklapa sa postojećom rezervacijom. Izaberite drugo vreme.')
      return
    }
    selectTime(slot.time)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await createBooking(form)
      setStep(5)
      setSlotsRefresh((n) => n + 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const goToStep = (target) => {
    if (target <= maxReachedStep || target < step) {
      setError('')
      setStep(target)
    }
  }

  return (
    <div className="bg-white p-6 shadow-[0_8px_48px_rgba(44,36,32,0.07)] sm:p-8 lg:p-10">
      {/* Progress */}
      <nav className="mb-8" aria-label="Koraci zakazivanja">
        <ol className="flex items-center justify-between gap-1">
          {STEPS.map((s) => {
            const done = s.id < step || (s.id === 5 && step === 5)
            const active = s.id === step
            const reachable = s.id <= maxReachedStep || s.id <= step
            return (
              <li key={s.id} className="flex flex-1 flex-col items-center">
                <button
                  type="button"
                  disabled={!reachable && s.id !== step}
                  onClick={() => reachable && goToStep(s.id)}
                  className={`mb-1.5 flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    active
                      ? 'bg-brown text-white'
                      : done
                        ? 'bg-brown/15 text-brown'
                        : reachable
                          ? 'bg-cream text-ink-muted hover:bg-cream-dark'
                          : 'bg-cream text-ink-muted/40'
                  }`}
                >
                  {done && s.id < step ? '✓' : s.id}
                </button>
                <span
                  className={`hidden text-[9px] font-medium tracking-[0.08em] sm:block ${
                    active ? 'text-brown' : 'text-ink-muted'
                  }`}
                >
                  {s.label}
                </span>
              </li>
            )
          })}
        </ol>
      </nav>

      <AnimatePresence mode="wait">
        {error && (
          <motion.p
            key="error"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0 }}
            className="mb-4 text-sm text-red-700"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {/* Step 1 — Service */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
          >
            <h2 className="mb-2 font-serif text-xl text-ink">1. Izaberite uslugu</h2>
            <p className="mb-6 text-sm text-ink-muted">Koji tretman želite da zakažete?</p>
            <div className="space-y-3">
              {services.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => selectService(s.id)}
                  className={`w-full border px-5 py-4 text-left transition-colors ${
                    form.service === s.id
                      ? 'border-brown bg-brown/5'
                      : 'border-brown/20 hover:border-brown/40'
                  }`}
                >
                  <span className="block font-serif text-lg text-ink">{s.title}</span>
                  <span className="mt-1 block text-sm text-ink-muted">{s.description}</span>
                  <span className="mt-2 block text-[10px] font-semibold tracking-[0.12em] text-brown-light">
                    {s.price.toUpperCase()}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Step 2 — Date */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
          >
            <button
              type="button"
              onClick={() => goToStep(1)}
              className="mb-4 text-xs text-brown hover:underline"
            >
              ← Promeni uslugu ({serviceTitle(form.service)})
            </button>
            <h2 className="mb-2 font-serif text-xl text-ink">2. Izaberite datum</h2>
            <p className="mb-6 text-sm text-ink-muted">Kada želite da dođete u salon?</p>
            <input
              type="date"
              required
              min={new Date().toISOString().slice(0, 10)}
              value={form.booking_date}
              onChange={(e) => selectDate(e.target.value)}
              className="w-full border border-brown/20 bg-white px-4 py-3.5 text-sm outline-none focus:border-brown"
            />
          </motion.div>
        )}

        {/* Step 3 — Time */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
          >
            <button
              type="button"
              onClick={() => goToStep(2)}
              className="mb-4 text-xs text-brown hover:underline"
            >
              ← Promeni datum ({formatDateSr(form.booking_date)})
            </button>
            <h2 className="mb-2 font-serif text-xl text-ink">3. Izaberite vreme</h2>
            <p className="mb-6 text-sm text-ink-muted">Slobodni termini za izabrani dan.</p>
            {loadingSlots ? (
              <p className="text-sm text-ink-muted">Učitavanje termina...</p>
            ) : closed ? (
              <p className="text-sm text-ink-muted">Salon ne radi izabrani dan.</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-ink-muted">Nema termina za ovaj dan.</p>
            ) : !hasFreeSlot ? (
              <p className="text-sm text-ink-muted">Svi termini su zauzeti za ovaj dan.</p>
            ) : (
              <div className="grid grid-cols-4 gap-1.5 sm:grid-cols-6 sm:gap-2">
                {slots.map((slot) => (
                  <button
                    key={slot.time}
                    type="button"
                    disabled={slot.occupied}
                    onClick={() => handleSlotClick(slot)}
                    className={`relative py-2 text-[11px] font-medium transition-all sm:py-2.5 sm:text-xs ${slotButtonClass({
                      occupied: slot.occupied,
                      selected: form.booking_time === slot.time,
                    })}`}
                  >
                    {slot.time}
                    {slot.occupied && (
                      <span className="absolute -right-1 -top-1 text-[8px] text-red-400">✕</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Step 4 — Personal info */}
        {step === 4 && (
          <motion.form
            key="step4"
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            onSubmit={handleSubmit}
          >
            <button
              type="button"
              onClick={() => goToStep(3)}
              className="mb-4 text-xs text-brown hover:underline"
            >
              ← Promeni vreme ({form.booking_time})
            </button>
            <h2 className="mb-2 font-serif text-xl text-ink">4. Vaši podaci</h2>
            <p className="mb-6 text-sm text-ink-muted">Unesite kontakt podatke za potvrdu termina.</p>

            <div className="mb-4 rounded-sm border border-brown/10 bg-cream/50 px-4 py-3 text-sm text-ink-muted">
              <p>
                <strong className="text-ink">{serviceTitle(form.service)}</strong>
              </p>
              <p className="mt-1">
                {formatDateSr(form.booking_date)} u {form.booking_time}
              </p>
            </div>

            {[
              { id: 'name', label: 'Ime i Prezime', type: 'text' },
              { id: 'email', label: 'Email Adresa', type: 'email' },
              { id: 'phone', label: 'Telefon', type: 'tel', placeholder: '+381 6X XXX XXXX' },
            ].map((field) => (
              <div key={field.id} className="mb-5">
                <label htmlFor={field.id} className="mb-2 block text-xs font-medium text-ink-muted">
                  {field.label}
                </label>
                <input
                  id={field.id}
                  type={field.type}
                  required
                  placeholder={field.placeholder}
                  value={form[field.id]}
                  onChange={(e) => setForm({ ...form, [field.id]: e.target.value })}
                  className="w-full border border-brown/20 bg-white px-4 py-3.5 text-sm outline-none transition-colors focus:border-brown"
                />
              </div>
            ))}

            <div className="mb-6">
              <label htmlFor="notes" className="mb-2 block text-xs font-medium text-ink-muted">
                Napomena (opciono)
              </label>
              <textarea
                id="notes"
                rows={3}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full resize-none border border-brown/20 bg-white px-4 py-3.5 text-sm outline-none focus:border-brown"
                placeholder="Alergije, posebni zahtevi..."
              />
            </div>

            <motion.button
              whileHover={{ scale: submitting ? 1 : 1.01 }}
              whileTap={{ scale: submitting ? 1 : 0.99 }}
              type="submit"
              disabled={submitting}
              className="w-full bg-brown py-4 text-[11px] font-semibold tracking-[0.15em] text-white transition-colors hover:bg-brown-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? 'ŠALJE SE...' : 'POŠALJI ZAHTEV'}
            </motion.button>
          </motion.form>
        )}

        {/* Step 5 — Confirmation */}
        {step === 5 && (
          <motion.div
            key="step5"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brown/10 text-2xl">
              ✓
            </div>
            <h2 className="mb-3 font-serif text-2xl text-ink">Zahtev poslat!</h2>
            <p className="mb-4 text-sm leading-relaxed text-ink-muted">
              Hvala, {form.name}! Potvrdu termina ćete dobiti na <strong>{form.email}</strong> čim
              salon pregleda rezervaciju.
            </p>

            <div className="mb-6 rounded-sm border border-brown/10 bg-cream/50 px-4 py-4 text-left text-sm text-ink-muted">
              <p className="font-medium text-ink">{serviceTitle(form.service)}</p>
              <p className="mt-1">
                {formatDateSr(form.booking_date)} u {form.booking_time}
              </p>
              <p className="mt-2">{form.phone}</p>
            </div>

            <p className="mb-6 border border-brown/10 bg-cream-dark px-4 py-3 text-sm leading-relaxed text-ink-muted">
              Ako bude potrebno da otkažete termin, u emailu ćete naći dugme{' '}
              <strong className="text-brown">OTKAŽI TERMIN</strong> — termin se odmah oslobađa u sistemu.
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => {
                  setStep(1)
                  setForm({
                    name: '',
                    email: '',
                    phone: '',
                    service: '',
                    booking_date: '',
                    booking_time: '',
                    notes: '',
                  })
                  setError('')
                }}
                className="bg-brown px-6 py-3 text-[11px] font-semibold tracking-[0.12em] text-white hover:bg-brown-dark"
              >
                ZAKAZI NOVI TERMIN
              </button>
              <Link
                to="/"
                className="border border-brown/20 px-6 py-3 text-[11px] font-semibold tracking-[0.12em] text-ink-muted hover:border-brown/40"
              >
                NAZAD NA SAJT
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
