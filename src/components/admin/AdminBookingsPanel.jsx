import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { services } from '../../data/site'
import AdminManualBooking from '../AdminManualBooking'

const STATUS = {
  pending: { label: 'Na čekanju', class: 'bg-amber-50 text-amber-800 ring-amber-200' },
  confirmed: { label: 'Potvrđeno', class: 'bg-emerald-50 text-emerald-800 ring-emerald-200' },
  cancelled: { label: 'Otkazano', class: 'bg-red-50 text-red-700 ring-red-200' },
}

function serviceTitle(id) {
  return services.find((s) => s.id === id)?.title ?? id
}

function formatDate(dateStr) {
  return new Date(`${dateStr}T12:00:00`).toLocaleDateString('sr-RS', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function StatCard({ label, value, accent }) {
  return (
    <div className="rounded-sm border border-brown/10 bg-white px-5 py-4">
      <p className="text-[10px] font-medium tracking-[0.15em] text-ink-muted">{label}</p>
      <p className={`mt-1 font-serif text-3xl ${accent || 'text-ink'}`}>{value}</p>
    </div>
  )
}

function CancelConfirmModal({ booking, loading, onConfirm, onCancel }) {
  if (!booking) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Zatvori"
        className="absolute inset-0 bg-ink/40"
        onClick={onCancel}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="relative w-full max-w-md bg-white p-6 shadow-xl sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cancel-modal-title"
      >
        <h2 id="cancel-modal-title" className="mb-3 font-serif text-xl text-ink">
          Otkaži rezervaciju?
        </h2>
        <p className="mb-2 text-sm text-ink-muted">
          Da li ste sigurni da želite da otkažete ovu rezervaciju?
        </p>
        <p className="mb-6 rounded-sm bg-cream px-3 py-2 text-sm text-ink">
          <strong>{booking.name}</strong> — {formatDate(booking.booking_date)} u {booking.booking_time}
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="border border-brown/20 px-5 py-2.5 text-xs font-semibold tracking-[0.1em] text-ink-muted hover:bg-cream disabled:opacity-50"
          >
            Ne, nazad
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 px-5 py-2.5 text-xs font-semibold tracking-[0.1em] text-white hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Otkazuje se...' : 'Da, otkaži'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}

export default function AdminBookingsPanel({
  bookings,
  filtered,
  loading,
  filter,
  dateFilter,
  actionError,
  actionId,
  countForDate,
  matchesDateFilter,
  onFilterChange,
  onDateFilterChange,
  onStatusChange,
  onCreated,
}) {
  const [cancelTarget, setCancelTarget] = useState(null)

  const pendingCount = bookings.filter(
    (b) => b.status === 'pending' && matchesDateFilter(b.booking_date, dateFilter)
  ).length
  const confirmedCount = bookings.filter(
    (b) => b.status === 'confirmed' && matchesDateFilter(b.booking_date, dateFilter)
  ).length

  const requestCancel = (booking) => setCancelTarget(booking)

  const confirmCancel = async () => {
    if (!cancelTarget) return
    await onStatusChange(cancelTarget.id, 'cancelled')
    setCancelTarget(null)
  }

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {cancelTarget && (
          <CancelConfirmModal
            booking={cancelTarget}
            loading={actionId === cancelTarget.id}
            onConfirm={confirmCancel}
            onCancel={() => !actionId && setCancelTarget(null)}
          />
        )}
      </AnimatePresence>

      {actionError && (
        <div className="rounded-sm border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="AKTIVNI TERMINI" value={countForDate(dateFilter)} accent="text-brown" />
        <StatCard label="NA ČEKANJU" value={pendingCount} accent="text-amber-700" />
        <StatCard label="POTVRĐENO" value={confirmedCount} accent="text-emerald-700" />
        <StatCard label="UKUPNO U BAZI" value={bookings.length} />
      </div>

      <div className="rounded-sm border border-brown/10 bg-white p-4 lg:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-ink">Filteri</p>
          <AdminManualBooking onCreated={onCreated} />
        </div>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-[10px] font-medium tracking-[0.12em] text-ink-muted">Datum</p>
            <div className="flex flex-wrap gap-1.5">
              {[
                { id: 'today', label: 'Danas' },
                { id: 'tomorrow', label: 'Sutra' },
                { id: 'week', label: 'Nedelja' },
                { id: 'all', label: 'Sve' },
              ].map((df) => (
                <button
                  key={df.id}
                  type="button"
                  onClick={() => onDateFilterChange(df.id)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                    dateFilter === df.id
                      ? 'bg-brown text-white'
                      : 'bg-cream text-ink-muted hover:bg-cream-dark'
                  }`}
                >
                  {df.label}
                  {df.id !== 'all' && (
                    <span className="ml-1 opacity-75">({countForDate(df.id)})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-[10px] font-medium tracking-[0.12em] text-ink-muted">Status</p>
            <div className="flex flex-wrap gap-1.5">
              {['all', 'pending', 'confirmed', 'cancelled'].map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => onFilterChange(f)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                    filter === f
                      ? 'bg-ink text-white'
                      : 'bg-cream text-ink-muted hover:bg-cream-dark'
                  }`}
                >
                  {f === 'all' ? 'Sve' : STATUS[f].label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {loading && bookings.length === 0 ? (
        <p className="text-sm text-ink-muted">Učitavanje...</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-sm border border-brown/10 bg-white px-6 py-16 text-center">
          <p className="font-serif text-xl text-ink-muted">Nema rezervacija</p>
          <p className="mt-2 text-sm text-ink-muted/70">Probaj drugi filter ili dodaj ručno zakazivanje.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <motion.article
              key={b.id}
              layout
              className="overflow-hidden rounded-sm border border-brown/10 bg-white"
            >
              <div className="flex flex-col sm:flex-row">
                <div className="flex shrink-0 items-center justify-center border-b border-brown/10 bg-cream/50 px-6 py-4 sm:w-28 sm:border-b-0 sm:border-r">
                  <div className="text-center">
                    <p className="font-serif text-2xl text-brown">{b.booking_time}</p>
                    <p className="mt-0.5 text-[10px] uppercase tracking-wider text-ink-muted">
                      {formatDate(b.booking_date)}
                    </p>
                  </div>
                </div>

                <div className="flex flex-1 flex-wrap items-start justify-between gap-4 p-5">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <h3 className="font-serif text-lg text-ink">{b.name}</h3>
                      <span
                        className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${STATUS[b.status].class}`}
                      >
                        {STATUS[b.status].label}
                      </span>
                    </div>
                    <p className="text-sm text-brown">{serviceTitle(b.service)}</p>
                    <p className="mt-2 text-sm text-ink-muted">{b.phone}</p>
                    {b.email && <p className="text-sm text-ink-muted">{b.email}</p>}
                    {b.notes && (
                      <p className="mt-2 rounded-sm bg-cream px-3 py-2 text-sm italic text-ink-muted">
                        {b.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    {b.status === 'pending' && (
                      <>
                        <button
                          type="button"
                          disabled={actionId === b.id}
                          onClick={() => onStatusChange(b.id, 'confirmed')}
                          className="bg-emerald-700 px-4 py-2 text-[10px] font-semibold tracking-[0.1em] text-white hover:bg-emerald-800 disabled:opacity-50"
                        >
                          {actionId === b.id ? '...' : 'POTVRDI'}
                        </button>
                        <button
                          type="button"
                          disabled={actionId === b.id}
                          onClick={() => requestCancel(b)}
                          className="border border-red-200 px-4 py-2 text-[10px] font-semibold tracking-[0.1em] text-red-600 hover:bg-red-50 disabled:opacity-50"
                        >
                          OTKAŽI
                        </button>
                      </>
                    )}
                    {b.status === 'confirmed' && (
                      <button
                        type="button"
                        disabled={actionId === b.id}
                        onClick={() => requestCancel(b)}
                        className="border border-red-200 px-4 py-2 text-[10px] font-semibold tracking-[0.1em] text-red-600 hover:bg-red-50"
                      >
                        OTKAŽI
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </div>
  )
}
