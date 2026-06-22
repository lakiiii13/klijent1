import { motion } from 'framer-motion'
import { navLinks, site } from '../data/site'
import { fadeUp, staggerContainer, viewport } from '../lib/motion'

export default function Footer() {
  return (
    <footer className="bg-brown-darker text-white/75">
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-2 lg:grid-cols-4 lg:gap-12 lg:px-8"
      >
        <motion.div variants={fadeUp} className="lg:col-span-1">
          <span className="mb-4 block font-serif text-2xl font-semibold tracking-[0.12em] text-white">
            {site.name.toUpperCase()}
          </span>
          <p className="max-w-xs text-sm leading-relaxed">
            Ekskluzivno utočište lepote fokusirano na mir, luksuz i prirodni sjaj vaše kože.
            Glow naturally. Shine confidently.
          </p>
        </motion.div>

        <motion.div variants={fadeUp}>
          <h4 className="mb-5 text-[10px] font-semibold tracking-[0.22em] text-white/45">
            NAVIGACIJA
          </h4>
          <ul className="space-y-3 text-sm">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a href={link.href} className="transition-colors hover:text-white">
                  {link.label.charAt(0) + link.label.slice(1).toLowerCase()}
                </a>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div variants={fadeUp}>
          <h4 className="mb-5 text-[10px] font-semibold tracking-[0.22em] text-white/45">
            DODATNO
          </h4>
          <ul className="space-y-3 text-sm">
            <li><a href="#filozofija" className="transition-colors hover:text-white">O nama</a></li>
            <li><a href="#kontakt" className="transition-colors hover:text-white">Radno vreme</a></li>
            <li><a href="#kontakt" className="transition-colors hover:text-white">Kontakt</a></li>
          </ul>
        </motion.div>

        <motion.div variants={fadeUp}>
          <h4 className="mb-5 text-[10px] font-semibold tracking-[0.22em] text-white/45">
            PRATITE NAS
          </h4>
          <a
            href={site.instagram}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 transition-all hover:border-white/50 hover:bg-white/10"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5">
              <rect x="2" y="2" width="20" height="20" rx="5" />
              <circle cx="12" cy="12" r="5" />
              <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
            </svg>
          </a>
        </motion.div>
      </motion.div>

      <div className="border-t border-white/10 py-6 text-center">
        <p className="text-xs text-white/35">
          © {new Date().getFullYear()} {site.name} Spray Tan Salon. Sva prava zadržana.
        </p>
      </div>
    </footer>
  )
}
