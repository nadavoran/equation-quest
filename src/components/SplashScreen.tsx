import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Props {
  onDone: () => void
}

export default function SplashScreen({ onDone }: Props) {
  const [done, setDone] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setDone(true), 2000)
    const t2 = setTimeout(onDone, 2500)
    return () => [t1, t2].forEach(clearTimeout)
  }, [])

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="splash"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
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

          {/* App name — shown immediately with the icon */}
          <div style={{ textAlign: 'center' }}>
            <h1 style={{
              color: 'white', fontSize: 36, fontWeight: 900,
              letterSpacing: -0.5, margin: 0,
              textShadow: '0 2px 12px rgba(0,0,0,0.15)',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            }}>
              Equation<span style={{ color: '#fdcb6e' }}>Quest</span>
            </h1>
          </div>

          {/* Tagline */}
          <p style={{
            color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: 600,
            margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.12)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}>
            Math adventures for curious kids 🌟
          </p>

          {/* Loading dots */}
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1.4, delay: i * 0.22 }}
                style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.65)' }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
