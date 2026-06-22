import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { lookbook } from '../data/site'
import { fadeUp, viewport } from '../lib/motion'

export default function Lookbook() {
  const [active, setActive] = useState(null)

  return (
    <section id="lookbook" className="bg-cream py-28 lg:py-36">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="mb-12 flex items-end gap-8"
        >
          <div>
            <span className="mb-4 block text-[11px] font-medium tracking-[0.28em] text-ink-muted">
              ESTETIKA
            </span>
            <h2 className="font-serif text-[clamp(2rem,3.5vw,2.8rem)] font-medium text-ink">
              Naš Lookbook
            </h2>
          </div>
          <div className="mb-3 hidden flex-1 h-px bg-brown/20 lg:block" />
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:gap-5">
          {lookbook.map((item, i) => (
            <motion.button
              key={`${item.src}-${i}`}
              type="button"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={viewport}
              custom={i * 0.08}
              onClick={() => setActive(item)}
              className="group relative aspect-[4/5] overflow-hidden text-left sm:aspect-[3/4]"
            >
              <img
                src={item.src}
                alt={item.alt}
                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                style={{ objectPosition: item.position }}
              />
              <div className="absolute inset-0 bg-brown-darker/0 transition-colors duration-500 group-hover:bg-brown-darker/15" />
              <div className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-brown-darker/75 to-transparent px-5 py-4 transition-transform duration-500 group-hover:translate-y-0">
                <span className="text-[10px] font-medium tracking-[0.2em] text-white/90">
                  {item.alt}
                </span>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {active && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActive(null)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/90 p-6 backdrop-blur-sm"
          >
            <motion.button
              type="button"
              aria-label="Zatvori"
              onClick={() => setActive(null)}
              className="absolute right-6 top-6 text-white/70 hover:text-white"
            >
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </motion.button>
            <motion.img
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              src={active.src}
              alt={active.alt}
              onClick={(e) => e.stopPropagation()}
              className="max-h-[85vh] max-w-full object-contain shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
