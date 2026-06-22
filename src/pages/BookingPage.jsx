import { Link } from 'react-router-dom'
import { site } from '../data/site'
import BookingForm from '../components/BookingForm'

export default function BookingPage() {
  return (
    <div className="min-h-screen bg-cream-dark">
      <header className="border-b border-brown/10 bg-cream/90 backdrop-blur-md">
        <div className="mx-auto flex h-[72px] max-w-3xl items-center justify-between px-6">
          <Link
            to="/"
            className="font-serif text-xl font-semibold tracking-[0.12em] text-brown-dark"
          >
            {site.name.toUpperCase()}
          </Link>
          <Link
            to="/"
            className="text-[11px] font-medium tracking-[0.12em] text-ink-muted transition-colors hover:text-brown"
          >
            ← NAZAD NA SAJT
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 lg:py-14">
        <div className="mb-8 text-center">
          <p className="mb-2 text-[11px] font-medium tracking-[0.22em] text-brown-light">
            ONLINE ZAKAZIVANJE
          </p>
          <h1 className="font-serif text-[clamp(1.75rem,4vw,2.5rem)] font-medium text-ink">
            Zakažite termin
          </h1>
          <p className="mt-3 text-sm text-ink-muted">
            Pratite korake ispod — potvrdu ćete dobiti na email čim salon pregleda rezervaciju.
          </p>
        </div>

        <BookingForm />
      </main>
    </div>
  )
}
