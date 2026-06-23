import { motion } from 'framer-motion'
import { fadeUp, viewport } from '../lib/motion'

export default function LocationNote() {
  return (
    <section className="border-y border-brown/10 bg-cream py-16 lg:py-20">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        className="mx-auto max-w-3xl px-6 text-center lg:px-8"
      >
        <span className="mb-5 block text-[11px] font-medium tracking-[0.28em] text-brown-light">
          NAŠA LOKACIJA
        </span>
        <p className="font-serif text-[clamp(1.25rem,2.5vw,1.65rem)] font-medium leading-[1.55] text-ink">
          Pronađite nas na Gradskom šetalištu iznad Galije —{' '}
          <em className="font-normal italic text-brown">mestu gde smo negovali vašu lepotu već 7 godina.</em>
        </p>
      </motion.div>
    </section>
  )
}
