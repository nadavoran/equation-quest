import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useStatsStore, useGameStore } from '../store'
import { formatEquation } from '../engine'
import DifficultyGauge from './DifficultyGauge'
import type { HistoryEntry, Difficulty } from '../types'

// ── Group entries by exerciseId ───────────────────────────────────────────────
interface ExerciseGroup {
  exerciseId: string
  entries: HistoryEntry[]
  label: string
}

function groupByExercise(entries: HistoryEntry[]): ExerciseGroup[] {
  const map = new Map<string, HistoryEntry[]>()
  entries.forEach(e => {
    const id = e.exerciseId ?? 'legacy'
    if (!map.has(id)) map.set(id, [])
    map.get(id)!.push(e)
  })
  let exNum = map.size
  return Array.from(map.entries()).map(([id, items]) => ({
    exerciseId: id,
    entries: items,
    label: `Exercise ${exNum--}`,
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

interface Props {
  onClose: () => void
}

export default function HistoryPanel({ onClose }: Props) {
  const navigate = useNavigate()
  const { history } = useStatsStore()
  const { sessionHistory, setEquation, setDifficulty, resetGame } = useGameStore()
  const [filter, setFilter] = useState<Filter>('all')
  const [expanded, setExpanded] = useState<string | null>(null)

  // Merge session + persisted history, deduplicate by id
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

  const totalCount = allHistory.length
  const firstTryCount = allHistory.filter(h => h.solvedOnFirstTry).length
  const skippedCount = allHistory.filter(h => h.skipped).length

  function handleRetry(entry: HistoryEntry) {
    // Load this equation back into the game store and navigate to game screen
    resetGame()
    setEquation(entry.equation)
    setDifficulty(entry.equation.difficulty)
    onClose()
    navigate('/game')
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="fixed inset-y-0 right-0 w-80 max-w-full bg-white shadow-2xl flex flex-col z-50"
    >
      {/* Header */}
      <div className="theme-gradient px-4 py-4 flex items-center justify-between">
        <h2 className="text-white font-bold text-base">📋 History</h2>
        <button
          onClick={onClose}
          style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(255,255,255,0.25)',
            color: 'white', border: 'none', fontSize: 16,
            fontWeight: 'bold', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center',
          }}
        >✕</button>
      </div>

      {/* Mini stats */}
      <div className="grid grid-cols-3 gap-2 px-3 py-2 border-b" style={{ borderColor: '#e0e0e0', background: '#f8f9fa' }}>
        {[
          { value: totalCount, label: 'Total' },
          { value: firstTryCount, label: '1st Try ✓' },
          { value: skippedCount, label: 'Skipped' },
        ].map(({ value, label }) => (
          <div key={label} className="text-center">
            <div className="font-black text-lg" style={{ color: '#333' }}>{value}</div>
            <div className="text-xs" style={{ color: '#999' }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5 px-3 py-2 overflow-x-auto border-b" style={{ borderColor: '#e0e0e0' }}>
        {FILTERS.map(({ id, label }) => {
          const active = filter === id
          return (
            <button
              key={id}
              onClick={() => setFilter(id)}
              style={{
                whiteSpace: 'nowrap',
                borderRadius: 20,
                padding: '5px 10px',
                fontSize: 12,
                fontWeight: 700,
                border: active ? 'none' : '1.5px solid #e0e0e0',
                background: active ? '#6c5ce7' : 'white',
                color: active ? 'white' : '#666',
                cursor: 'pointer',
                flexShrink: 0,
                transition: 'all 0.15s',
              }}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* History list — grouped by exercise */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
        {filtered.length === 0 && (
          <p className="text-center text-sm mt-8" style={{ color: '#999' }}>No entries yet!</p>
        )}
        {groupByExercise(filtered).map(group => {
          const solved   = group.entries.filter(e => !e.skipped).length
          const firstTry = group.entries.filter(e => e.solvedOnFirstTry).length
          const acc      = solved > 0 ? Math.round((firstTry / solved) * 100) : 0
          const isGroupOpen = expanded === group.exerciseId || expanded === null

          return (
            <div key={group.exerciseId}>
              {/* Exercise group header — collapsible */}
              <button
                onClick={() => setExpanded(expanded === group.exerciseId ? null : group.exerciseId)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '6px 10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  background: '#f0efff', marginBottom: 6,
                }}
              >
                <span style={{ fontWeight: 800, fontSize: 13, color: '#6c5ce7' }}>{group.label}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: '#666', fontWeight: 600 }}>
                    {solved}/{group.entries.length} · {acc}% 1st try
                  </span>
                  <span style={{ color: '#a29bfe', fontSize: 12 }}>{isGroupOpen ? '▲' : '▼'}</span>
                </div>
              </button>

              <AnimatePresence>
                {isGroupOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {group.entries.map(entry => (
                        <div
                          key={entry.id}
                          style={{ background: 'white', border: '1.5px solid #e8e8e8', borderRadius: 16, padding: '10px 12px', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}
                          onClick={() => setExpanded(expanded === entry.id ? group.exerciseId : entry.id)}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                            <span style={{ fontWeight: 700, fontSize: 13, color: '#333', flex: 1, minWidth: 0 }}>
                              {formatEquation(entry.equation).replace(' = ?', ` = ${entry.equation.displayAnswer ?? entry.equation.correctAnswer}`)}
                            </span>
                            <DifficultyGauge difficulty={entry.equation.difficulty} size="sm" />
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                            {entry.skipped ? (
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: '#f1f3f5', color: '#666' }}>⏭ Skipped</span>
                            ) : entry.solvedOnFirstTry ? (
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'rgba(0,184,148,0.12)', color: '#00b894' }}>✓ 1st try</span>
                            ) : (
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 10, background: 'rgba(253,203,110,0.2)', color: '#b8860b' }}>{entry.attempts.length} tries</span>
                            )}
                            <button
                              onClick={e => { e.stopPropagation(); handleRetry(entry) }}
                              style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 10, background: '#f0efff', color: '#6c5ce7', border: '1.5px solid #a29bfe', cursor: 'pointer' }}
                            >↻ Retry</button>
                          </div>

                          <AnimatePresence>
                            {expanded === entry.id && entry.attempts.length > 0 && (
                              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                                <div style={{ borderTop: '1px dashed #e0e0e0', marginTop: 8, paddingTop: 8 }}>
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
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}
