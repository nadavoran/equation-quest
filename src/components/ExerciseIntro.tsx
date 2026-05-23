import { motion } from 'framer-motion'
import type { OperationType } from '../types'

const EXERCISE_INTROS = [
  "Let's warm up those math muscles! 💪",
  "Time to level up your brain! 🧠",
  "Your quest continues… stay focused! 🎯",
  "Another adventure awaits! ⚔️",
  "Push your limits, math hero! 🦸",
  "Five equations stand between you and glory! ✨",
  "The numbers are ready — are you? 🔢",
]

const OP_LABELS: Record<OperationType, string> = {
  addition: 'Addition ➕',
  subtraction: 'Subtraction ➖',
  multiplication: 'Multiplication ✖️',
  division: 'Division ➗',
  negatives: 'Negatives ±',
}

interface Props {
  exerciseNumber: number
  exerciseSize: number
  selectedTypes: OperationType[]
  onStart: () => void
}

export default function ExerciseIntro({ exerciseNumber, exerciseSize, selectedTypes, onStart }: Props) {
  const tagline = EXERCISE_INTROS[(exerciseNumber - 1) % EXERCISE_INTROS.length]

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg, #6c5ce7 0%, #a29bfe 60%, #fd79a8 100%)',
      padding: 24,
    }}>
      {/* Animated background blob */}
      <motion.div
        animate={{ scale: [1, 1.1, 1], rotate: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 5 }}
        style={{
          position: 'absolute', width: 300, height: 300,
          borderRadius: '60% 40% 70% 30% / 50% 60% 40% 50%',
          background: 'rgba(255,255,255,0.07)',
          top: '-5%', right: '-10%', pointerEvents: 'none',
        }}
      />

      {/* Exercise badge */}
      <motion.div
        initial={{ scale: 0, rotate: -15 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 18 }}
        style={{
          background: 'rgba(255,255,255,0.2)',
          borderRadius: 20, padding: '8px 20px',
          marginBottom: 16,
        }}
      >
        <span style={{ color: 'white', fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>
          Exercise {exerciseNumber}
        </span>
      </motion.div>

      {/* Main heading */}
      <motion.h1
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, type: 'spring' }}
        style={{
          color: 'white', fontSize: 42, fontWeight: 900,
          margin: 0, textAlign: 'center', lineHeight: 1.1,
          textShadow: '0 2px 12px rgba(0,0,0,0.15)',
        }}
      >
        Ready for<br />
        <span style={{ color: '#fdcb6e' }}>{exerciseSize} equations</span>?
      </motion.h1>

      {/* Tagline */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        style={{
          color: 'rgba(255,255,255,0.85)', fontSize: 16,
          fontWeight: 600, margin: '16px 0 0', textAlign: 'center',
        }}
      >
        {tagline}
      </motion.p>

      {/* Operation types */}
      {selectedTypes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            display: 'flex', gap: 8, flexWrap: 'wrap',
            justifyContent: 'center', marginTop: 20,
          }}
        >
          {selectedTypes.map(t => (
            <span key={t} style={{
              background: 'rgba(255,255,255,0.2)',
              borderRadius: 20, padding: '4px 12px',
              color: 'white', fontSize: 13, fontWeight: 700,
            }}>
              {OP_LABELS[t]}
            </span>
          ))}
        </motion.div>
      )}

      {/* Start button */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, type: 'spring' }}
        whileTap={{ scale: 0.95 }}
        onClick={onStart}
        style={{
          marginTop: 36,
          background: 'white',
          color: '#6c5ce7',
          border: 'none',
          borderRadius: 16,
          padding: '16px 48px',
          fontSize: 20,
          fontWeight: 900,
          cursor: 'pointer',
          boxShadow: '0 6px 24px rgba(0,0,0,0.2)',
          letterSpacing: 0.3,
        }}
      >
        Let's go! 🚀
      </motion.button>
    </div>
  )
}
