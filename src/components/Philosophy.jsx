import { motion } from 'framer-motion'
import { images, site } from '../data/site'
import { fadeUp, slideInLeft, slideInRight, viewport } from '../lib/motion'

function DecoCircle() {
  return (
    <svg viewBox="0 0 120 120" fill="none" className="h-full w-full text-brown">
      {[50, 35, 20].map((r) => (
        <circle key={r} cx="60" cy="60" r={r} stroke="currentColor" strokeWidth="0.5" />
      ))}
      <line x1="60" y1="10" x2="60" y2="110" stroke="currentColor" strokeWidth="0.5" />
      <line x1="10" y1="60" x2="110" y2="60" stroke="currentColor" strokeWidth="0.5" />
    </svg>
  )
}

export default function Philosophy() {
  return (
    <section id="filozofija" className="bg-cream">
      <div className="mx-auto max-w-6xl px-6 py-24 lg:px-8 lg:py-32">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <motion.div
            variants={slideInLeft}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
          >
            <span className="mb-4 block text-[11px] font-medium tracking-[0.28em] text-ink-muted">
              NAŠA FILOZOFIJA
            </span>
            <h2 className="font-serif text-[clamp(2rem,3.5vw,2.8rem)] font-medium leading-tight text-ink">
              Lepota koja diše kroz tišinu i svetlost.
            </h2>
          </motion.div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            custom={0.2}
            className="hidden h-28 w-28 opacity-50 lg:block lg:justify-self-end"
          >
            <DecoCircle />
          </motion.div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-6 pb-28 lg:px-8 lg:pb-36">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-20">
          <motion.div
            variants={slideInLeft}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="order-2 lg:order-1"
          >
            <span className="mb-4 block text-[11px] font-medium tracking-[0.28em] text-ink-muted">
              NAŠA PRIČA
            </span>
            <p className="text-[15px] leading-[1.85] text-ink-muted">{site.description}</p>
            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={viewport}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="my-8 h-px w-12 origin-left bg-ink"
            />
            <blockquote className="font-serif text-xl italic leading-relaxed text-brown-light">
              {site.quote}
            </blockquote>

            <div className="mt-10 flex items-center gap-6">
              <div className="text-center">
                <span className="block font-serif text-4xl font-medium text-brown">{site.years}+</span>
                <span className="text-[10px] tracking-[0.2em] text-ink-muted">GODINA</span>
              </div>
              <div className="h-12 w-px bg-brown/20" />
              <p className="text-sm text-ink-muted">
                Glow naturally.
                <br />
                Shine confidently.
              </p>
            </div>
          </motion.div>

          <motion.div
            variants={slideInRight}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            className="relative order-1 lg:order-2"
          >
            <div className="relative overflow-hidden">
              <motion.img
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                src={images.shimmer.src}
                alt={images.shimmer.alt}
                className="h-[420px] w-full object-cover lg:h-[520px]"
                style={{
                  objectPosition: images.shimmer.position,
                  clipPath: 'polygon(6% 0, 100% 0, 100% 100%, 0 100%)',
                }}
              />
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={viewport}
                transition={{ delay: 0.5, duration: 0.6 }}
                className="absolute -bottom-4 -left-2 bg-cream-dark px-7 py-5 shadow-[0_12px_40px_rgba(44,36,32,0.08)] lg:-left-6"
              >
                <span className="text-[10px] font-semibold tracking-[0.22em] text-ink">
                  UTEMELJENI U PRIRODI
                </span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
