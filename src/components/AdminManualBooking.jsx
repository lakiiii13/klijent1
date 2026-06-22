import { useState, useEffect } from 'react'
import { services } from '../data/site'
import { getSlots, createAdminBooking } from '../lib/api'
import { slotButtonClass } from '../lib/slotStyles'

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

export default function AdminManualBooking({ onCreated }) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    service: services[0].id,
    booking_date: todayISO(),
    booking_time: '',
    notes: '',
  })
  const [slots, setSlots] = useState([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [closed, setClosed] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !form.booking_date) return
    setLoadingSlots(true)
    getSlots(form.booking_date)
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
  }, [open, form.booking_date])

  const resetForm = () => {
    setForm({
      name: '',
      email: '',
      phone: '',
      service: services[0].id,
      booking_date: todayISO(),
      booking_time: '',
      notes: '',
    })
    setError('')
  }

  const close = () => {
    setOpen(false)
    setError('')
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
      await createAdminBooking({ ...form, status: 'confirmed' })
      resetForm()
      close()
      onCreated?.()
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const hasFreeSlot = slots.some((s) => s.available)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="bg-brown px-4 py-2 text-[10px] font-semibold tracking-[0.12em] text-white hover:bg-brown-dark"
      >
        + NOVI TERMIN
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-4 sm:items-center">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-sm bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-brown/10 px-6 py-4">
              <div>
                <h2 className="font-serif text-xl text-ink">Ručno zakazivanje</h2>
                <p className="text-xs text-ink-muted">Telefonski poziv — odmah potvrđeno</p>
              </div>
              <button
                type="button"
                onClick={close}
                className="flex h-8 w-8 items-center justify-center text-ink-muted hover:text-ink"
                aria-label="Zatvori"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-medium text-ink-muted">Ime i prezime *</label>
                  <input
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-brown/20 px-3 py-2.5 text-sm outline-none focus:border-brown"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-muted">Telefon *</label>
                  <input
                    required
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full border border-brown/20 px-3 py-2.5 text-sm outline-none focus:border-brown"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-muted">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="Opciono"
                    className="w-full border border-brown/20 px-3 py-2.5 text-sm outline-none focus:border-brown"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-muted">Usluga</label>
                  <select
                    value={form.service}
                    onChange={(e) => setForm({ ...form, service: e.target.value })}
                    className="w-full border border-brown/20 bg-white px-3 py-2.5 text-sm outline-none focus:border-brown"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>{s.title}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-ink-muted">Datum</label>
                  <input
                    type="date"
                    required
                    min={todayISO()}
                    value={form.booking_date}
                    onChange={(e) =>
                      setForm({ ...form, booking_date: e.target.value, booking_time: '' })
                    }
                    className="w-full border border-brown/20 px-3 py-2.5 text-sm outline-none focus:border-brown"
                  />
                </div>
              </div>

              <div className="mt-4">
                <span className="mb-2 block text-xs font-medium text-ink-muted">Vreme</span>
                {loadingSlots ? (
                  <p className="text-sm text-ink-muted">Učitavanje...</p>
                ) : closed ? (
                  <p className="text-sm text-ink-muted">Salon ne radi taj dan.</p>
                ) : !hasFreeSlot ? (
                  <p className="text-sm text-ink-muted">Nema slobodnih termina.</p>
                ) : (
                  <div className="grid max-h-36 grid-cols-4 gap-1.5 overflow-y-auto sm:grid-cols-5">
                    {slots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={slot.occupied}
                        onClick={() => {
                          if (slot.occupied) return
                          if (!slot.available) {
                            setError('Termin se preklapa sa postojećom rezervacijom.')
                            return
                          }
                          setError('')
                          setForm({ ...form, booking_time: slot.time })
                        }}
                        className={`py-2 text-[11px] font-medium ${slotButtonClass({
                          occupied: slot.occupied,
                          selected: form.booking_time === slot.time,
                        })}`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-4">
                <label className="mb-1.5 block text-xs font-medium text-ink-muted">Napomena</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full resize-none border border-brown/20 px-3 py-2.5 text-sm outline-none focus:border-brown"
                />
              </div>

              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

              <div className="mt-5 flex gap-2">
                <button
                  type="submit"
                  disabled={submitting || !form.booking_time}
                  className="flex-1 bg-emerald-700 py-3 text-[10px] font-semibold tracking-[0.12em] text-white hover:bg-emerald-800 disabled:opacity-50"
                >
                  {submitting ? 'ČUVANJE...' : 'ZAKAŽI I POTVRDI'}
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="border border-brown/20 px-4 py-3 text-[10px] font-semibold tracking-[0.12em] text-ink-muted"
                >
                  OTKAŽI
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
