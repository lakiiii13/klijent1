import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { testimonials } from '../data/site'
import { fadeUp, viewport } from '../lib/motion'

function Arrow({ direction, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/20 text-white/70 transition-colors hover:border-white/40 hover:bg-white/10 hover:text-white"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="h-5 w-5"
        aria-hidden
      >
        {direction === 'left' ? (
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  )
}

export default function Testimonial() {
  const [index, setIndex] = useState(0)
  const total = testimonials.length
  const current = testimonials[index]

  const prev = () => setIndex((i) => (i - 1 + total) % total)
  const next = () => setIndex((i) => (i + 1) % total)

  return (
    <section id="utisci" className="relative overflow-hidden bg-brown-dark py-28 lg:py-32">
      <div className="pointer-events-none absolute -left-20 top-1/2 -translate-y-1/2 font-serif text-[20rem] leading-none text-white/[0.03]">
        "
      </div>

      <div className="relative mx-auto max-w-5xl px-6 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="mb-14 text-center"
        >
          <span className="mb-4 block text-[11px] font-medium tracking-[0.28em] text-white/40">
            ISKUSTVA
          </span>
          <h2 className="font-serif text-[clamp(2rem,3.5vw,2.6rem)] font-medium text-white">
            Utisci klijenata
          </h2>
        </motion.div>

        <div className="flex items-center gap-4 md:gap-8">
          <Arrow direction="left" onClick={prev} label="Prethodni utisak" />

          <div className="min-h-[220px] flex-1 overflow-hidden md:min-h-[200px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="text-center"
              >
                <span className="mb-5 block font-serif text-4xl text-white/25 md:text-5xl">
                  "
                </span>
                <blockquote className="font-serif text-[clamp(1.1rem,2.2vw,1.65rem)] italic leading-[1.65] text-white/90">
                  {current.quote}
                </blockquote>
                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.15, duration: 0.6 }}
                  className="mx-auto my-7 h-px w-12 origin-center bg-white/30"
                />
                <cite className="text-[11px] font-medium not-italic tracking-[0.22em] text-white/50">
                  — {current.name.toUpperCase()}
                </cite>
              </motion.div>
            </AnimatePresence>
          </div>

          <Arrow direction="right" onClick={next} label="Sledeći utisak" />
        </div>

        <div className="mt-10 flex items-center justify-center gap-2">
          {testimonials.map((item, i) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Utisak ${i + 1}`}
              className={`h-1.5 transition-all duration-300 ${
                i === index ? 'w-8 bg-white/70' : 'w-1.5 bg-white/25 hover:bg-white/40'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
