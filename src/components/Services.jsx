import { useState } from 'react'
import { motion } from 'framer-motion'
import { services } from '../data/site'
import { fadeUp, staggerContainer, viewport } from '../lib/motion'

function ServiceCard({ service, className = '' }) {
  const fillFrame = service.image.fillFrame

  return (
    <article className={`group ${className}`}>
      <div
        className={`relative mb-5 overflow-hidden bg-cream-muted/40 md:mb-6 ${
          fillFrame ? 'aspect-[3/4]' : 'md:aspect-square'
        }`}
      >
        <img
          src={service.image.src}
          alt={service.image.alt}
          className={
            fillFrame
              ? 'h-full w-full object-cover md:transition-transform md:duration-700 md:group-hover:scale-105'
              : 'mx-auto h-auto max-h-[min(72vw,480px)] w-full object-contain md:h-full md:max-h-none md:object-cover md:transition-transform md:duration-700 md:group-hover:scale-105'
          }
          style={{ objectPosition: service.image.position }}
        />
        <div className="pointer-events-none absolute inset-0 hidden bg-gradient-to-t from-brown-darker/40 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 md:block" />
        <div className="pointer-events-none absolute bottom-0 left-0 right-0 hidden translate-y-full p-5 transition-transform duration-500 group-hover:translate-y-0 md:block">
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

        {/* Mobil — swipe kroz usluge, cela slika */}
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
              <div
                key={service.id}
                className="w-[88vw] max-w-md shrink-0 snap-center"
              >
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

        {/* Desktop — grid */}
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
