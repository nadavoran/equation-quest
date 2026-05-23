import { useEffect } from 'react'
import { motion } from 'framer-motion'
import confetti from 'canvas-confetti'
import type { HistoryEntry } from '../types'

interface Props {
  exerciseNumber: number
  entries: HistoryEntry[]
  onDone: () => void
  onOneMore: () => void
}

export default function ExerciseComplete({ exerciseNumber, entries, onDone, onOneMore }: Props) {
  const total    = entries.length
  const solved   = entries.filter(e => !e.skipped).length
  const firstTry = entries.filter(e => e.solvedOnFirstTry).length
  const skipped  = entries.filter(e => e.skipped).length
  const accuracy = solved > 0 ? Math.round((firstTry / solved) * 100) : 0

  // Star rating: 3 stars = all first try, 2 = >60% first try, 1 = completed
  const stars = firstTry === total ? 3 : accuracy >= 60 ? 2 : 1

  useEffect(() => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.5 }, colors: ['#6c5ce7', '#fdcb6e', '#fd79a8', '#00b894'] })
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg, #00b894 0%, #55efc4 100%)',
      padding: 24,
    }}>
      {/* Trophy */}
      <motion.div
        initial={{ scale: 0, rotate: -20 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 280, damping: 16 }}
        style={{ fontSize: 72, lineHeight: 1, marginBottom: 8 }}
      >
        {stars === 3 ? '🏆' : stars === 2 ? '🥈' : '🎖️'}
      </motion.div>

      {/* Stars */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2, type: 'spring' }}
        style={{ display: 'flex', gap: 6, marginBottom: 12 }}
      >
        {[1, 2, 3].map(s => (
          <motion.span
            key={s}
            initial={{ scale: 0 }}
            animate={{ scale: s <= stars ? 1 : 0.4, opacity: s <= stars ? 1 : 0.3 }}
            transition={{ delay: 0.2 + s * 0.1, type: 'spring', stiffness: 400 }}
            style={{ fontSize: 32 }}
          >
            ⭐
          </motion.span>
        ))}
      </motion.div>

      {/* Title */}
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        style={{ color: 'white', fontSize: 28, fontWeight: 900, margin: '0 0 4px', textAlign: 'center' }}
      >
        Exercise {exerciseNumber} Complete!
      </motion.h2>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 10, marginTop: 20, width: '100%', maxWidth: 280,
        }}
      >
        {[
          { value: `${solved}/${total}`, label: 'Solved' },
          { value: `${accuracy}%`,       label: '1st Try Accuracy' },
          { value: firstTry,             label: 'First Try ✓' },
          { value: skipped > 0 ? skipped : '—', label: 'Skipped' },
        ].map(({ value, label }) => (
          <div key={label} style={{
            background: 'rgba(255,255,255,0.25)',
            borderRadius: 14, padding: '10px 12px', textAlign: 'center',
          }}>
            <div style={{ color: 'white', fontSize: 22, fontWeight: 900 }}>{value}</div>
            <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 700, marginTop: 2 }}>{label}</div>
          </div>
        ))}
      </motion.div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        style={{ display: 'flex', gap: 12, marginTop: 28, width: '100%', maxWidth: 300 }}
      >
        <button
          onClick={onDone}
          style={{
            flex: 1, padding: '14px 0',
            borderRadius: 14, border: '2.5px solid rgba(255,255,255,0.6)',
            background: 'transparent', color: 'white',
            fontSize: 15, fontWeight: 800, cursor: 'pointer',
          }}
        >
          🏠 Done
        </button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onOneMore}
          style={{
            flex: 2, padding: '14px 0',
            borderRadius: 14, border: 'none',
            background: 'white', color: '#00b894',
            fontSize: 15, fontWeight: 900, cursor: 'pointer',
            boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          }}
        >
          One More! ➜
        </motion.button>
      </motion.div>
    </div>
  )
}
