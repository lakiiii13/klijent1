import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { services } from '../data/site'
import { getSlots, createBooking } from '../lib/api'
import { slotButtonClass } from '../lib/slotStyles'

function tomorrowISO() {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

export default function BookingForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    service: services[0].id,
    booking_date: tomorrowISO(),
    booking_time: '',
    notes: '',
  })
  const [slots, setSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [closed, setClosed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [slotsRefresh, setSlotsRefresh] = useState(0)

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
    loadSlots(form.booking_date)
  }, [form.booking_date, slotsRefresh, loadSlots])

  const handleSlotClick = (slot) => {
    if (slot.occupied) return
    if (!slot.available) {
      setError('Termin se preklapa sa postojećom rezervacijom. Izaberite drugo vreme.')
      return
    }
    setError('')
    setForm({ ...form, booking_time: slot.time })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.booking_time) {
      setError('Izaberite slobodan termin.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await createBooking(form)
      setSuccess(true)
      setSlotsRefresh((n) => n + 1)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const hasFreeSlot = slots.some((s) => s.available)

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 text-center shadow-[0_8px_48px_rgba(44,36,32,0.07)] lg:p-10"
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brown/10 text-2xl">
          ✓
        </div>
        <h3 className="mb-3 font-serif text-2xl text-ink">Zahtev poslat!</h3>
        <p className="mb-4 text-sm leading-relaxed text-ink-muted">
          Hvala, {form.name}! Potvrdu termina ćete dobiti na <strong>{form.email}</strong> čim
          salon pregleda rezervaciju.
        </p>
        <p className="mb-6 border border-brown/10 bg-cream-dark px-4 py-3 text-sm leading-relaxed text-ink-muted">
          Ako bude potrebno da otkažete termin, u emailu ćete naći dugme{' '}
          <strong className="text-brown">OTKAŽI TERMIN</strong> — termin se odmah oslobađa u sistemu.
        </p>
        <button
          type="button"
          onClick={() => {
            setSuccess(false)
            setForm({
              name: '',
              email: '',
              phone: '',
              service: services[0].id,
              booking_date: tomorrowISO(),
              booking_time: '',
              notes: '',
            })
          }}
          className="text-xs font-semibold tracking-[0.12em] text-brown hover:underline"
        >
          ZAKAZI NOVI TERMIN
        </button>
      </motion.div>
    )
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="bg-white p-8 shadow-[0_8px_48px_rgba(44,36,32,0.07)] lg:p-10"
    >
      <p className="mb-6 text-[11px] font-medium tracking-[0.2em] text-brown-light">
        ONLINE ZAKAZIVANJE
      </p>

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

      <div className="mb-5">
        <label htmlFor="service" className="mb-2 block text-xs font-medium text-ink-muted">
          Usluga
        </label>
        <select
          id="service"
          value={form.service}
          onChange={(e) => setForm({ ...form, service: e.target.value })}
          className="w-full appearance-none border border-brown/20 bg-white bg-[length:12px] bg-[position:right_16px_center] bg-no-repeat px-4 py-3.5 text-sm outline-none focus:border-brown"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B5E58' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
          }}
        >
          {services.map((s) => (
            <option key={s.id} value={s.id}>{s.title}</option>
          ))}
        </select>
      </div>

      <div className="mb-5">
        <label htmlFor="booking_date" className="mb-2 block text-xs font-medium text-ink-muted">
          Datum
        </label>
        <input
          id="booking_date"
          type="date"
          required
          min={new Date().toISOString().slice(0, 10)}
          value={form.booking_date}
          onChange={(e) => setForm({ ...form, booking_date: e.target.value, booking_time: '' })}
          className="w-full border border-brown/20 bg-white px-4 py-3.5 text-sm outline-none focus:border-brown"
        />
      </div>

      <div className="mb-5">
        <span className="mb-2 block text-xs font-medium text-ink-muted">Vreme</span>
        {loadingSlots ? (
          <p className="text-sm text-ink-muted">Učitavanje termina...</p>
        ) : closed ? (
          <p className="text-sm text-ink-muted">Salon ne radi izabrani dan.</p>
        ) : slots.length === 0 ? (
          <p className="text-sm text-ink-muted">Nema termina za ovaj dan.</p>
        ) : !hasFreeSlot ? (
          <p className="text-sm text-ink-muted">Svi termini su zauzeti za ovaj dan.</p>
        ) : (
          <div className="grid max-h-64 grid-cols-4 gap-1.5 overflow-y-auto sm:grid-cols-6 sm:max-h-none sm:gap-2">
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
      </div>

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

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0 }}
            className="mb-4 text-sm text-red-700"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: submitting ? 1 : 1.01 }}
        whileTap={{ scale: submitting ? 1 : 0.99 }}
        type="submit"
        disabled={submitting || !form.booking_time}
        className="w-full bg-brown py-4 text-[11px] font-semibold tracking-[0.15em] text-white transition-colors hover:bg-brown-dark disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? 'ŠALJE SE...' : 'ZAKAZI TERMIN'}
      </motion.button>
    </motion.form>
  )
}
