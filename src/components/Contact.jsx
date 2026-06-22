import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { site } from '../data/site'
import { slideInLeft, viewport } from '../lib/motion'

function Icon({ children }) {
  return (
    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center text-brown">
      {children}
    </span>
  )
}

export default function Contact() {
  return (
    <section id="kontakt" className="relative overflow-hidden bg-cream-dark py-28 lg:py-36">
      <div className="pointer-events-none absolute -right-10 top-1/2 -translate-y-1/2 select-none font-serif text-[38vw] font-semibold leading-none text-brown/[0.04]">
        L
      </div>

      <div className="relative mx-auto max-w-6xl px-6 lg:px-8">
        <motion.div
          variants={slideInLeft}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="mx-auto max-w-2xl text-center"
        >
          <h2 className="mb-6 font-serif text-[clamp(2rem,3.5vw,2.8rem)] font-medium text-ink">
            Vreme je da zablistate.
          </h2>
          <p className="mb-10 text-[17px] leading-[1.75] text-ink-muted lg:text-[18px]">
            Zakažite termin online ili nas kontaktirajte direktno — potvrdu ćete dobiti na email čim
            salon pregleda rezervaciju.
          </p>

          <Link
            to="/booking"
            className="mb-14 inline-block bg-brown px-10 py-4 text-[11px] font-semibold tracking-[0.15em] text-white transition-colors hover:bg-brown-dark"
          >
            ZAKAZI TERMIN ONLINE
          </Link>

          <ul className="mb-10 space-y-6 text-left sm:mx-auto sm:max-w-md">
            <li className="flex items-start gap-4 text-[16px] leading-relaxed text-ink lg:text-[17px]">
              <Icon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
                </svg>
              </Icon>
              <a href={site.phoneHref} className="transition-colors hover:text-brown">{site.phone}</a>
            </li>
            <li className="flex items-start gap-4 text-[16px] leading-relaxed text-ink lg:text-[17px]">
              <Icon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </Icon>
              <a href={site.mapsUrl} target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-brown">
                {site.address}
              </a>
            </li>
            <li className="flex items-start gap-4 text-[16px] leading-relaxed text-ink lg:text-[17px]">
              <Icon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </Icon>
              <span>{site.hours}</span>
            </li>
            <li className="flex items-start gap-4 text-[16px] leading-relaxed text-ink lg:text-[17px]">
              <Icon>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 7l-10 7L2 7" />
                </svg>
              </Icon>
              <a href={`mailto:${site.email}`} className="transition-colors hover:text-brown">{site.email}</a>
            </li>
          </ul>

          <a
            href={site.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-3 text-[16px] font-medium text-brown transition-opacity hover:opacity-70 lg:text-[17px]"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-6 w-6">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="5" />
              <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
            </svg>
            {site.instagramHandle}
          </a>
        </motion.div>
      </div>
    </section>
  )
}
