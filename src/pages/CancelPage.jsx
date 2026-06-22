import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getCancelInfo, cancelBooking } from '../lib/api'

export default function CancelPage() {
  const { token } = useParams()
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getCancelInfo(token)
      .then(setInfo)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [token])

  const handleCancel = async () => {
    setSubmitting(true)
    setError('')
    try {
      await cancelBooking(token)
      setDone(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <p className="text-sm text-ink-muted">Učitavanje...</p>
      </div>
    )
  }

  if (error && !info) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream px-6">
        <div className="max-w-md bg-white p-10 text-center shadow-lg">
          <span className="font-serif text-2xl tracking-[0.1em] text-brown-dark">LA VIE</span>
          <p className="mt-6 text-sm text-red-600">{error}</p>
          <Link to="/" className="mt-8 inline-block text-xs tracking-[0.12em] text-brown hover:underline">
            NAZAD NA SAJT
          </Link>
        </div>
      </div>
    )
  }

  if (done || info?.status === 'cancelled') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md bg-white p-10 text-center shadow-lg"
        >
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-brown/10 text-xl">
            ✓
          </div>
          <span className="font-serif text-2xl tracking-[0.1em] text-brown-dark">LA VIE</span>
          <h1 className="mt-4 font-serif text-xl text-ink">Termin otkazan</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            {done
              ? 'Vaš termin je uspešno otkazan. Potvrda stiže na email.'
              : 'Ovaj termin je već ranije otkazan.'}
          </p>
          <Link
            to="/#kontakt"
            className="mt-8 inline-block bg-brown px-8 py-3.5 text-[11px] font-semibold tracking-[0.15em] text-white hover:bg-brown-dark"
          >
            ZAKAZI NOVI TERMIN
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-cream px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white p-10 shadow-lg"
      >
        <span className="font-serif text-2xl tracking-[0.1em] text-brown-dark">LA VIE</span>
        <p className="mt-2 text-[10px] tracking-[0.2em] text-ink-muted">OTKAZIVANJE TERMINA</p>

        <h1 className="mt-8 font-serif text-xl text-ink">Da li ste sigurni?</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Otkazujete termin za <strong>{info.name}</strong>
        </p>

        <div className="mt-6 space-y-2 border border-brown/10 bg-cream-dark p-5 text-sm">
          <div className="flex justify-between">
            <span className="text-ink-muted">Usluga</span>
            <span>{info.service}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-muted">Datum</span>
            <span>{info.booking_date_formatted}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-muted">Vreme</span>
            <span className="font-medium">{info.booking_time}</span>
          </div>
        </div>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        <button
          type="button"
          onClick={handleCancel}
          disabled={submitting}
          className="mt-8 w-full border-2 border-red-600 py-4 text-[11px] font-semibold tracking-[0.15em] text-red-600 transition-colors hover:bg-red-600 hover:text-white disabled:opacity-50"
        >
          {submitting ? 'OTKAZUJE SE...' : 'OTKAŽI TERMIN'}
        </button>

        <Link
          to="/"
          className="mt-4 block text-center text-xs tracking-[0.12em] text-ink-muted hover:text-brown"
        >
          Nazad — zadržavam termin
        </Link>
      </motion.div>
    </div>
  )
}
