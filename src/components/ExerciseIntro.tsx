import { motion } from 'framer-motion'
import type { OperationType, Difficulty } from '../types'

const EXERCISE_INTROS = [
  "Let's warm up those math muscles! 💪",
  "Time to level up your brain! 🧠",
  "Your quest continues… stay focused! 🎯",
  "Another adventure awaits! ⚔️",
  "Push your limits, math hero! 🦸",
  "Five equations stand between you and glory! ✨",
  "The numbers are ready — are you? 🔢",
]

const OP_OPTIONS: { id: OperationType; emoji: string; label: string }[] = [
  { id: 'addition',       emoji: '➕', label: 'Add' },
  { id: 'subtraction',    emoji: '➖', label: 'Subtract' },
  { id: 'multiplication', emoji: '✖️', label: 'Multiply' },
  { id: 'division',       emoji: '➗', label: 'Divide' },
  { id: 'negatives',      emoji: '±',  label: 'Negatives' },
]

const DIFF_OPTIONS: { id: Difficulty; emoji: string; label: string }[] = [
  { id: 'easy',   emoji: '🌱', label: 'Easy' },
  { id: 'medium', emoji: '⚡', label: 'Medium' },
  { id: 'hard',   emoji: '🔥', label: 'Hard' },
  { id: 'expert', emoji: '💀', label: 'Expert' },
]

interface Props {
  exerciseNumber: number
  exerciseSize: number
  selectedTypes: OperationType[]
  selectedDifficulties: Difficulty[]
  onStart: () => void
  onHome: () => void
  onUpdateTypes: (types: OperationType[]) => void
  onUpdateDifficulties: (diffs: Difficulty[]) => void
}

export default function ExerciseIntro({ exerciseNumber, exerciseSize, selectedTypes, selectedDifficulties, onStart, onHome, onUpdateTypes, onUpdateDifficulties }: Props) {
  const tagline = EXERCISE_INTROS[(exerciseNumber - 1) % EXERCISE_INTROS.length]

  function toggleType(id: OperationType) {
    const next = selectedTypes.includes(id)
      ? (selectedTypes.length > 1 ? selectedTypes.filter(x => x !== id) : selectedTypes)
      : [...selectedTypes, id]
    onUpdateTypes(next)
  }

  function toggleDiff(id: Difficulty) {
    const next = selectedDifficulties.includes(id)
      ? (selectedDifficulties.length > 1 ? selectedDifficulties.filter(x => x !== id) : selectedDifficulties)
      : [...selectedDifficulties, id]
    onUpdateDifficulties(next)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(160deg, #6c5ce7 0%, #a29bfe 60%, #fd79a8 100%)',
      padding: '16px 20px', overflow: 'hidden',
    }}>
      {/* Subtle blob */}
      <div style={{
        position: 'absolute', width: 280, height: 280,
        borderRadius: '60% 40% 70% 30% / 50% 60% 40% 50%',
        background: 'rgba(255,255,255,0.06)',
        top: '-5%', right: '-8%', pointerEvents: 'none',
      }} />

      {/* Home button top-left */}
      <button
        onClick={onHome}
        style={{
          position: 'absolute', top: 52, left: 16,
          width: 36, height: 36, borderRadius: '50%',
          background: 'rgba(255,255,255,0.2)', border: 'none',
          color: 'white', fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >🏠</button>

      {/* Exercise badge */}
      <motion.div
        initial={{ scale: 0.7, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '5px 16px', marginBottom: 8 }}
      >
        <span style={{ color: 'white', fontSize: 13, fontWeight: 800, letterSpacing: 1, textTransform: 'uppercase' }}>
          Exercise {exerciseNumber}
        </span>
      </motion.div>

      {/* Heading */}
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ color: 'white', fontSize: 30, fontWeight: 900, margin: 0, textAlign: 'center', lineHeight: 1.15 }}
      >
        Ready for <span style={{ color: '#fdcb6e' }}>{exerciseSize} equations</span>?
      </motion.h1>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 600, margin: '6px 0 14px', textAlign: 'center' }}
      >
        {tagline}
      </motion.p>

      {/* Practice selector */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        style={{ width: '100%', maxWidth: 340, marginBottom: 8 }}>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700, margin: '0 0 8px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Practice
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {OP_OPTIONS.map(({ id, emoji, label }) => {
            const active = selectedTypes.includes(id)
            return (
              <button
                key={id}
                onClick={() => toggleType(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 20, cursor: 'pointer',
                  border: active ? '2px solid white' : '2px solid rgba(255,255,255,0.3)',
                  background: active ? 'white' : 'rgba(255,255,255,0.12)',
                  color: active ? '#6c5ce7' : 'white',
                  fontSize: 13, fontWeight: 700, transition: 'all 0.15s',
                }}
              >
                <span>{emoji}</span><span>{label}</span>
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Difficulty selector */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        style={{ width: '100%', maxWidth: 340, marginBottom: 16 }}>
        <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700, margin: '0 0 8px', textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Difficulty
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
          {DIFF_OPTIONS.map(({ id, emoji, label }) => {
            const active = selectedDifficulties.includes(id)
            const color = id === 'easy' ? '#27ae60' : id === 'medium' ? '#e67e22' : id === 'hard' ? '#c0392b' : '#6c5ce7'
            return (
              <button
                key={id}
                onClick={() => toggleDiff(id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 14px', borderRadius: 20, cursor: 'pointer',
                  border: active ? '2px solid white' : '2px solid rgba(255,255,255,0.3)',
                  background: active ? 'white' : 'rgba(255,255,255,0.12)',
                  color: active ? color : 'rgba(255,255,255,0.8)',
                  fontSize: 13, fontWeight: 800, transition: 'all 0.15s',
                  whiteSpace: 'nowrap', boxSizing: 'border-box',
                }}
              >
                <span style={{ fontSize: 14, lineHeight: 1 }}>{emoji}</span>
                <span style={{ lineHeight: 1 }}>{label}</span>
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Start button */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => onStart()}
        style={{
          background: 'white', color: '#6c5ce7', border: 'none',
          borderRadius: 14, padding: '12px 44px',
          fontSize: 17, fontWeight: 900, cursor: 'pointer',
          boxShadow: '0 4px 18px rgba(0,0,0,0.16)',
        }}
      >
        Let's go! 🚀
      </motion.button>
    </div>
  )
}
