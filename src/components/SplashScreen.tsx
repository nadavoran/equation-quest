import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  onDone: () => void
}

export default function SplashScreen({ onDone }: Props) {
  const [phase, setPhase] = useState<'logo' | 'title' | 'tagline' | 'done'>('logo')

  useEffect(() => {
    // Logo bounces in → 0.6s
    const t1 = setTimeout(() => setPhase('title'),   700)
    // Title slides in → 1.0s
    const t2 = setTimeout(() => setPhase('tagline'), 1200)
    // Tagline fades in → 1.6s, then whole thing fades out
    const t3 = setTimeout(() => setPhase('done'),    2600)
    // Tell parent we're done
    const t4 = setTimeout(onDone, 3100)
    return () => [t1, t2, t3, t4].forEach(clearTimeout)
  }, [])

  return (
    <AnimatePresence>
      {phase !== 'done' && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.5, ease: 'easeInOut' }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: 16,
            background: 'linear-gradient(160deg, #6c5ce7 0%, #a29bfe 50%, #fd79a8 100%)',
          }}
        >
          {/* Animated background blobs */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], rotate: [0, 15, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
            style={{
              position: 'absolute', width: 280, height: 280,
              borderRadius: '60% 40% 70% 30% / 50% 60% 40% 50%',
              background: 'rgba(255,255,255,0.08)',
              top: '10%', left: '-10%',
              pointerEvents: 'none',
            }}
          />
          <motion.div
            animate={{ scale: [1, 1.2, 1], rotate: [0, -20, 0] }}
            transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut', delay: 1 }}
            style={{
              position: 'absolute', width: 220, height: 220,
              borderRadius: '40% 60% 30% 70% / 60% 40% 60% 40%',
              background: 'rgba(255,255,255,0.07)',
              bottom: '8%', right: '-5%',
              pointerEvents: 'none',
            }}
          />

          {/* Logo / icon */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 280, damping: 18, delay: 0.1 }}
            style={{
              width: 100, height: 100,
              borderRadius: 28,
              background: 'white',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 56,
              boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
            }}
          >
            🧮
          </motion.div>

          {/* App name */}
          <AnimatePresence>
            {(phase === 'title' || phase === 'tagline') && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                style={{ textAlign: 'center' }}
              >
                <h1 style={{
                  color: 'white',
                  fontSize: 36,
                  fontWeight: 900,
                  letterSpacing: -0.5,
                  margin: 0,
                  textShadow: '0 2px 12px rgba(0,0,0,0.2)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                }}>
                  Equation<span style={{ color: '#fdcb6e' }}>Quest</span>
                </h1>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tagline */}
          <AnimatePresence>
            {phase === 'tagline' && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                style={{
                  color: 'rgba(255,255,255,0.9)',
                  fontSize: 16,
                  fontWeight: 600,
                  margin: 0,
                  textShadow: '0 1px 4px rgba(0,0,0,0.15)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
                }}
              >
                Math adventures for curious kids 🌟
              </motion.p>
            )}
          </AnimatePresence>

          {/* Loading dots */}
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 1, 0.3], y: [0, -6, 0] }}
                transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.2 }}
                style={{
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.7)',
                }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
