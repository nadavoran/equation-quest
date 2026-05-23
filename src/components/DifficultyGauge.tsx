import { motion } from 'framer-motion'
import type { Difficulty } from '../types'

interface Props {
  difficulty: Difficulty
  size?: 'sm' | 'md'
}

// Three distinct segmented bars — much more readable than gradient bars
// Each segment has a unique shape + icon so colorblind users can also tell them apart
export default function DifficultyGauge({ difficulty, size = 'md' }: Props) {
  const isSm = size === 'sm'

  const segments: {
    id: Difficulty
    color: string
    dimColor: string
    icon: string
    label: string
  }[] = [
    { id: 'easy',   color: '#27ae60', dimColor: '#c8e6c9', icon: '🌱', label: 'Easy'   },
    { id: 'medium', color: '#e67e22', dimColor: '#ffe0b2', icon: '⚡', label: 'Medium' },
    { id: 'hard',   color: '#c0392b', dimColor: '#ffcdd2', icon: '🔥', label: 'Hard'   },
  ]

  const baseH   = isSm ? 7  : 11
  const activeH = isSm ? 16 : 26
  const baseW   = isSm ? 18 : 28
  const activeW = isSm ? 26 : 40

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isSm ? 2 : 4 }}>
      <div style={{ display: 'flex', gap: isSm ? 4 : 6, alignItems: 'flex-end' }}>
        {segments.map(seg => {
          const active = difficulty === seg.id
          return (
            <div key={seg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              {/* Icon only shown on active segment in md size */}
              {!isSm && (
                <motion.span
                  animate={{ opacity: active ? 1 : 0, scale: active ? 1 : 0.5 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  style={{ fontSize: 12, lineHeight: 1 }}
                >
                  {seg.icon}
                </motion.span>
              )}
              <motion.div
                animate={{
                  height: active ? activeH : baseH,
                  width:  active ? activeW : baseW,
                  backgroundColor: active ? seg.color : seg.dimColor,
                  borderRadius: active ? (isSm ? 4 : 6) : (isSm ? 2 : 3),
                }}
                transition={{ type: 'spring', stiffness: 340, damping: 24 }}
                style={{
                  border: active ? `2px solid ${seg.color}` : `1.5px solid ${seg.dimColor}`,
                  boxShadow: active ? `0 2px 8px ${seg.color}55` : 'none',
                }}
              />
            </div>
          )
        })}
      </div>
      {/* Label */}
      {!isSm && (
        <span style={{
          fontSize: 11, fontWeight: 800, letterSpacing: 0.4,
          color: segments.find(s => s.id === difficulty)!.color,
        }}>
          {segments.find(s => s.id === difficulty)!.icon}{' '}
          {segments.find(s => s.id === difficulty)!.label}
        </span>
      )}
      {/* Small size: just icon */}
      {isSm && (
        <span style={{ fontSize: 8, fontWeight: 800, color: segments.find(s => s.id === difficulty)!.color }}>
          {segments.find(s => s.id === difficulty)!.label}
        </span>
      )}
    </div>
  )
}
