import { motion } from 'framer-motion'

function FloatingOrb({ className, duration, delay }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl ${className}`}
      animate={{
        y: [0, -24, 0],
        scale: [1, 1.06, 1],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  )
}

export default function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="absolute inset-0 bg-cream" />
      <div className="absolute inset-0 bg-gradient-to-br from-cream via-cream to-cream-dark" />

      {/* LA VIE — jedan red, veće, bliže centru */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 select-none whitespace-nowrap font-serif text-[clamp(6.5rem,42vw,28rem)] font-semibold leading-none tracking-[0.14em] text-brown/[0.045]"
        aria-hidden
      >
        LA VIE
      </motion.div>

      <FloatingOrb
        className="right-[15%] top-[20%] h-64 w-64 bg-brown/8"
        duration={16}
        delay={0}
      />
      <FloatingOrb
        className="bottom-[25%] left-[8%] h-48 w-48 bg-brown-light/8"
        duration={20}
        delay={3}
      />

      <motion.div
        className="absolute -left-1/4 top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent"
        animate={{ x: ['-20%', '120%'] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', repeatDelay: 5 }}
      />
    </div>
  )
}
