import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  onDone: () => void
}

export default function SplashScreen({ onDone }: Props) {
  const [phase, setPhase] = useState<'logo' | 'title' | 'tagline' | 'done'>('logo')

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('title'),   500)
    const t2 = setTimeout(() => setPhase('tagline'), 900)
    const t3 = setTimeout(() => setPhase('done'),    2200)
    const t4 = setTimeout(onDone, 2700)
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
            gap: 12,
            background: 'linear-gradient(160deg, #6c5ce7 0%, #8b7cf8 60%, #a29bfe 100%)',
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

          {/* Logo — matches icon: white bg, 5 + 3 = 8 */}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 20, delay: 0.05 }}
            style={{
              width: 120, height: 120,
              borderRadius: 32,
              background: 'white',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              gap: 3,
              padding: '0 12px',
            }}
          >
            {/* 5 + 3 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ fontSize: 36, fontWeight: 900, color: '#2d2d3a', lineHeight: 1 }}>5</span>
              <span style={{ fontSize: 24, fontWeight: 700, color: '#2d2d3a', opacity: 0.35, lineHeight: 1 }}>+</span>
              <span style={{ fontSize: 36, fontWeight: 900, color: '#2d2d3a', lineHeight: 1 }}>3</span>
            </div>
            {/* = divider */}
            <div style={{ width: 64, height: 2.5, background: '#e0e0e0', borderRadius: 2 }} />
            {/* = 8 answer */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#2d2d3a', opacity: 0.4 }}>=</span>
              <span style={{ fontSize: 36, fontWeight: 900, color: '#6c5ce7', lineHeight: 1 }}>8</span>
            </div>
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
