import { Link } from 'react-router-dom'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { site } from '../data/site'
import { fadeUp } from '../lib/motion'
import HeroBackground from './HeroBackground'

export default function Hero() {
  const [logoError, setLogoError] = useState(false)

  return (
    <section id="pocetna" className="relative min-h-screen overflow-hidden">
      <HeroBackground />

      <div className="relative z-10 mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-6 pb-16 pt-28 lg:grid-cols-2 lg:gap-20 lg:px-8 lg:pb-20 lg:pt-24">
        {/* Tekst */}
        <div className="flex flex-col justify-center">
          <motion.span
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.1}
            className="mb-5 text-[11px] font-medium tracking-[0.28em] text-ink-muted"
          >
            {site.tagline.toUpperCase()} · {site.city.toUpperCase()}
          </motion.span>

          <motion.h1
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.2}
            className="font-serif text-[clamp(2.4rem,5.5vw,4.2rem)] font-medium leading-[1.08] text-ink"
          >
            Umetnost <em className="font-normal italic text-brown">Ivory Glow</em> Efekta
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.35}
            className="mt-6 max-w-md text-[16px] leading-relaxed text-ink-muted lg:text-[17px]"
          >
            Otkrijte utočište gde se minimalizam susreće sa vrhunskom negom. Vaša koža
            zaslužuje čistoću, svetlost i neprevaziđeni luksuz.
          </motion.p>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.5}
            className="mt-10 flex flex-nowrap gap-2 sm:gap-4"
          >
            <a
              href="#usluge"
              className="flex-1 bg-brown px-3 py-3.5 text-center text-[9px] font-semibold tracking-[0.1em] text-white transition-colors hover:bg-brown-dark sm:flex-none sm:px-8 sm:py-4 sm:text-[11px] sm:tracking-[0.15em]"
            >
              OTKRIJTE USLUGE
            </a>
            <Link
              to="/booking"
              className="flex-1 border border-brown px-3 py-3.5 text-center text-[9px] font-semibold tracking-[0.1em] text-ink transition-all hover:bg-brown hover:text-white sm:flex-none sm:px-8 sm:py-4 sm:text-[11px] sm:tracking-[0.15em]"
            >
              ZAKAZIVANJE
            </Link>
          </motion.div>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            custom={0.65}
            className="mt-12 font-serif text-sm italic text-brown-light"
          >
            Glow naturally. Shine confidently.
          </motion.p>
        </div>

        {/* Logo */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          custom={0.3}
          className="flex items-center justify-center"
        >
          <motion.div
            className="relative will-change-transform"
            animate={{ y: -7 }}
            transition={{
              duration: 5.5,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: [0.37, 0, 0.63, 1],
            }}
          >
            <motion.div
              className="absolute inset-0 m-auto h-4/5 w-4/5 rounded-full bg-brown/10 blur-3xl"
              animate={{ opacity: [0.55, 0.85, 0.55], scale: [0.98, 1.04, 0.98] }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: [0.45, 0, 0.55, 1],
              }}
            />

            {!logoError ? (
              <img
                src={site.logo}
                alt={`${site.name} logo`}
                onError={() => setLogoError(true)}
                className="relative w-[min(320px,75vw)] object-contain lg:w-[min(420px,40vw)]"
              />
            ) : (
              <span className="relative font-serif text-4xl tracking-[0.15em] text-brown-dark lg:text-5xl">
                LA VIE
              </span>
            )}
          </motion.div>
        </motion.div>
      </div>

      <div className="pointer-events-none absolute inset-x-0 bottom-8 z-10 flex justify-center">
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 1, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col items-center"
        >
          <motion.div
            className="flex flex-col items-center gap-2 will-change-transform"
            animate={{ y: 4 }}
            transition={{
              duration: 3.2,
              repeat: Infinity,
              repeatType: 'reverse',
              ease: [0.37, 0, 0.63, 1],
            }}
          >
            <motion.span
              className="block text-center text-[9px] tracking-[0.3em] text-ink-muted/80 pl-[0.15em]"
              animate={{ opacity: [0.45, 0.85, 0.45] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
            >
              SKROLUJ
            </motion.span>
            <motion.div
              className="mx-auto h-10 w-px origin-top bg-gradient-to-b from-brown/50 to-transparent"
              animate={{ scaleY: [0.65, 1, 0.65], opacity: [0.35, 0.75, 0.35] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: [0.45, 0, 0.55, 1] }}
            />
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
