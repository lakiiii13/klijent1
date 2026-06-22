import { useState } from 'react'
import { motion } from 'framer-motion'
import { services } from '../data/site'
import { fadeUp, staggerContainer, viewport } from '../lib/motion'

function ServiceCard({ service, className = '' }) {
  return (
    <article className={`group ${className}`}>
      <div className="relative mb-5 aspect-[4/5] overflow-hidden bg-cream-muted/40 md:mb-6">
        <img
          src={service.image.src}
          alt={service.image.alt}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          style={{ objectPosition: service.image.position || 'center center' }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-brown-darker/55 via-brown-darker/10 to-brown/5" />
        <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-brown/10" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-5">
          <span className="text-[10px] font-semibold tracking-[0.2em] text-white/90">
            {service.price.toUpperCase()}
          </span>
        </div>
      </div>

      <h3 className="mb-2 font-serif text-2xl font-medium text-ink md:mb-3">{service.title}</h3>
      <p className="mb-3 text-sm leading-relaxed text-ink-muted md:mb-4">{service.description}</p>
      <span className="text-xs font-semibold tracking-[0.12em] text-brown-light">
        {service.price.toUpperCase()}
      </span>
    </article>
  )
}

export default function Services() {
  const [activeSlide, setActiveSlide] = useState(0)

  return (
    <section id="usluge" className="bg-cream py-28 lg:py-36">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="mb-10 text-center md:mb-16"
        >
          <span className="mb-4 block text-[11px] font-medium tracking-[0.28em] text-brown-light">
            SIGNATURE RITUALS
          </span>
          <h2 className="font-serif text-[clamp(2rem,3.5vw,2.8rem)] font-medium text-ink">
            Naše Ekskluzivne Usluge
          </h2>
        </motion.div>

        <div className="md:hidden">
          <div
            className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            onScroll={(e) => {
              const el = e.currentTarget
              const index = Math.round(el.scrollLeft / (el.offsetWidth * 0.88))
              setActiveSlide(Math.min(index, services.length - 1))
            }}
          >
            {services.map((service) => (
              <div key={service.id} className="w-[88vw] max-w-md shrink-0 snap-center">
                <ServiceCard service={service} />
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-[10px] tracking-[0.2em] text-ink-muted">
            PREVUCITE ZA VIŠE USLUGA
          </p>
          <div className="mt-3 flex justify-center gap-2">
            {services.map((service, i) => (
              <span
                key={service.id}
                className={`h-1.5 rounded-full transition-all ${
                  i === activeSlide ? 'w-6 bg-brown' : 'w-1.5 bg-brown/25'
                }`}
              />
            ))}
          </div>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          className="hidden gap-8 md:grid md:grid-cols-3"
        >
          {services.map((service, i) => (
            <motion.div key={service.id} variants={fadeUp} custom={i * 0.1}>
              <ServiceCard service={service} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
