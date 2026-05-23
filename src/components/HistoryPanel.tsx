import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStatsStore, useGameStore } from '../store'
import { formatEquation } from '../engine'
import DifficultyGauge from './DifficultyGauge'
import type { HistoryEntry, Difficulty } from '../types'

// ── Group entries by exerciseId, preserving insertion order ──────────────────
interface ExerciseGroup {
  exerciseId: string
  label: string
  entries: HistoryEntry[]
}

function groupByExercise(entries: HistoryEntry[]): ExerciseGroup[] {
  const order: string[] = []
  const map = new Map<string, HistoryEntry[]>()
  entries.forEach(e => {
    const id = e.exerciseId ?? 'legacy'
    if (!map.has(id)) { map.set(id, []); order.push(id) }
    map.get(id)!.push(e)
  })
  // Most recent exercise first; assign numbers top-to-bottom
  const total = order.length
  return order.map((id, i) => ({
    exerciseId: id,
    label: `Exercise ${total - i}`,
    entries: map.get(id)!,
  }))
}

type Filter = 'all' | Difficulty | 'errors' | 'skipped'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all',     label: 'All' },
  { id: 'easy',    label: 'Easy' },
  { id: 'medium',  label: 'Medium' },
  { id: 'hard',    label: 'Hard' },
  { id: 'errors',  label: '❌ Errors' },
  { id: 'skipped', label: '⏭ Skipped' },
]

// ── Single history entry row ──────────────────────────────────────────────────
function EntryRow({ entry, onRetry }: { entry: HistoryEntry; onRetry: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      style={{ background: 'white', border: '1.5px solid #e8e8e8', borderRadius: 14, padding: '9px 12px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)', cursor: 'pointer' }}
      onClick={() => entry.attempts.length > 0 && setOpen(o => !o)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: '#333', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {formatEquation(entry.equation).replace(' = ?', ` = ${entry.equation.displayAnswer ?? entry.equation.correctAnswer}`)}
        </span>
        <DifficultyGauge difficulty={entry.equation.difficulty} size="sm" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
        {entry.skipped ? (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#f1f3f5', color: '#666' }}>⏭ Skipped</span>
        ) : entry.solvedOnFirstTry ? (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'rgba(0,184,148,0.12)', color: '#00b894' }}>✓ 1st try</span>
        ) : (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'rgba(253,203,110,0.2)', color: '#b8860b' }}>
            {entry.attempts.length} tries
          </span>
        )}
        <button
          onClick={e => { e.stopPropagation(); onRetry() }}
          style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: '#f0efff', color: '#6c5ce7', border: '1.5px solid #a29bfe', cursor: 'pointer' }}
        >↻ Retry</button>
        {entry.attempts.length > 0 && (
          <span style={{ color: '#ccc', fontSize: 10 }}>{open ? '▲' : '▼'}</span>
        )}
      </div>

      <AnimatePresence>
        {open && entry.attempts.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ borderTop: '1px dashed #e0e0e0', marginTop: 8, paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
              {entry.attempts.map((attempt, i) => (
                <div key={i} style={{ fontSize: 11, fontWeight: 700, color: attempt.correct ? '#00b894' : '#e17055' }}>
                  {attempt.correct ? '✓' : '✗'} Tried: {attempt.value}{attempt.correct ? ' — correct!' : ''}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Exercise group row ────────────────────────────────────────────────────────
function ExerciseGroupRow({ group, defaultOpen, onRetry }: {
  group: ExerciseGroup
  defaultOpen: boolean
  onRetry: (entry: HistoryEntry) => void
}) {
  const [open, setOpen] = useState(defaultOpen)
  const solved   = group.entries.filter(e => !e.skipped).length
  const firstTry = group.entries.filter(e => e.solvedOnFirstTry).length
  const acc      = solved > 0 ? Math.round((firstTry / solved) * 100) : 0

  return (
    <div>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '7px 10px', borderRadius: 10, border: 'none', cursor: 'pointer',
          background: '#f0efff', marginBottom: open ? 6 : 0,
        }}
      >
        <span style={{ fontWeight: 800, fontSize: 13, color: '#6c5ce7' }}>{group.label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#666', fontWeight: 600 }}>
            {solved}/{group.entries.length} · {acc}% 1st try
          </span>
          <span style={{ color: '#a29bfe', fontSize: 11 }}>{open ? '▲' : '▼'}</span>
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, paddingBottom: 4 }}>
              {group.entries.map(entry => (
                <EntryRow key={entry.id} entry={entry} onRetry={() => onRetry(entry)} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Main panel ────────────────────────────────────────────────────────────────
interface Props { onClose: () => void }

export default function HistoryPanel({ onClose }: Props) {
  const navigate = useNavigate()
  const { history } = useStatsStore()
  const { sessionHistory, setEquation, setDifficulty, resetGame } = useGameStore()
  const [filter, setFilter] = useState<Filter>('all')

  const allHistory: HistoryEntry[] = [
    ...sessionHistory,
    ...history.filter(h => !sessionHistory.find(s => s.id === h.id)),
  ]

  const filtered = allHistory.filter(entry => {
    if (filter === 'all') return true
    if (filter === 'easy' || filter === 'medium' || filter === 'hard') return entry.equation.difficulty === filter
    if (filter === 'errors') return !entry.skipped && entry.attempts.some(a => !a.correct)
    if (filter === 'skipped') return entry.skipped
    return true
  })

  const groups = groupByExercise(filtered)
  const totalCount  = allHistory.length
  const firstTryCount = allHistory.filter(h => h.solvedOnFirstTry).length
  const skippedCount  = allHistory.filter(h => h.skipped).length

  function handleRetry(entry: HistoryEntry) {
    resetGame()
    setEquation(entry.equation)
    setDifficulty(entry.equation.difficulty)
    onClose()
    navigate('/game')
  }

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      style={{ position: 'fixed', inset: '0 0 0 auto', width: 300, maxWidth: '90vw', background: 'white', boxShadow: '-4px 0 24px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column', zIndex: 50 }}
    >
      {/* Header */}
      <div className="theme-gradient" style={{ padding: '44px 16px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ color: 'white', fontWeight: 800, fontSize: 16, margin: 0 }}>📋 History</h2>
        <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', border: 'none', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
      </div>

      {/* Mini stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '8px 12px', background: '#f8f9fa', borderBottom: '1px solid #e0e0e0' }}>
        {[{ value: totalCount, label: 'Total' }, { value: firstTryCount, label: '1st Try' }, { value: skippedCount, label: 'Skipped' }].map(({ value, label }) => (
          <div key={label} style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 900, fontSize: 17, color: '#333' }}>{value}</div>
            <div style={{ fontSize: 10, color: '#999', fontWeight: 600 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 6, padding: '8px 12px', overflowX: 'auto', borderBottom: '1px solid #e0e0e0' }}>
        {FILTERS.map(({ id, label }) => (
          <button key={id} onClick={() => setFilter(id)} style={{
            whiteSpace: 'nowrap', borderRadius: 20, padding: '4px 10px', fontSize: 12, fontWeight: 700,
            border: filter === id ? 'none' : '1.5px solid #e0e0e0',
            background: filter === id ? '#6c5ce7' : 'white',
            color: filter === id ? 'white' : '#666', cursor: 'pointer', flexShrink: 0,
          }}>{label}</button>
        ))}
      </div>

      {/* Grouped list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        {groups.length === 0 && (
          <p style={{ textAlign: 'center', color: '#999', fontSize: 13, marginTop: 32 }}>No entries yet!</p>
        )}
        {groups.map((group, i) => (
          <ExerciseGroupRow
            key={group.exerciseId}
            group={group}
            defaultOpen={i === 0}   // latest exercise expanded by default
            onRetry={handleRetry}
          />
        ))}
      </div>
    </motion.div>
  )
}
