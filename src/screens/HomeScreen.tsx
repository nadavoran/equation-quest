import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSettingsStore, useStatsStore, useGameStore } from '../store'
import { formatEquation } from '../engine'
import DifficultyGauge from '../components/DifficultyGauge'
import type { OperationType, HistoryEntry } from '../types'

const TYPE_OPTIONS: { id: OperationType; emoji: string; label: string }[] = [
  { id: 'addition',       emoji: '➕', label: 'Add' },
  { id: 'subtraction',    emoji: '➖', label: 'Subtract' },
  { id: 'multiplication', emoji: '✖️', label: 'Multiply' },
  { id: 'division',       emoji: '➗', label: 'Divide' },
  { id: 'negatives',      emoji: '±',  label: 'Negatives' },
]

function HistoryItem({ entry, onRetry }: { entry: HistoryEntry; onRetry: (e: HistoryEntry) => void }) {
  const [expanded, setExpanded] = useState(false)
  const hasAttempts = entry.attempts.length > 0

  return (
    <div
      className="card"
      style={{ padding: '8px 12px', cursor: hasAttempts ? 'pointer' : 'default' }}
      onClick={() => hasAttempts && setExpanded(e => !e)}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-bold" style={{ color: '#333', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {formatEquation(entry.equation).replace(' = ?', ` = ${entry.equation.displayAnswer ?? entry.equation.correctAnswer}`)}
        </span>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <DifficultyGauge difficulty={entry.equation.difficulty} size="sm" />
          {entry.skipped ? (
            <span className="text-xs font-semibold" style={{ color: '#999' }}>⏭</span>
          ) : entry.solvedOnFirstTry ? (
            <span className="text-xs font-bold" style={{ color: '#00b894' }}>✓</span>
          ) : (
            <span className="text-xs font-semibold" style={{ color: '#fdcb6e' }}>{entry.attempts.length}×</span>
          )}
          <button
            onClick={e => { e.stopPropagation(); onRetry(entry) }}
            style={{
              fontSize: 10, fontWeight: 700, padding: '2px 7px',
              borderRadius: 10, background: '#f0efff', color: '#6c5ce7',
              border: '1px solid #a29bfe', cursor: 'pointer',
            }}
          >↻</button>
          {hasAttempts && (
            <span style={{ color: '#bbb', fontSize: 10 }}>{expanded ? '▲' : '▼'}</span>
          )}
        </div>
      </div>

      <AnimatePresence>
        {expanded && hasAttempts && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="mt-2 pt-2 space-y-0.5" style={{ borderTop: '1px dashed #e0e0e0' }}>
              {entry.attempts.map((attempt, i) => (
                <div key={i} className="text-xs font-semibold" style={{ color: attempt.correct ? '#00b894' : '#e17055' }}>
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

export default function HomeScreen() {
  const navigate = useNavigate()
  const { settings, updateSettings } = useSettingsStore()
  const { stats, history } = useStatsStore()
  const { setEquation, setDifficulty, resetGame } = useGameStore()

  const accuracy = stats.totalSolved > 0
    ? Math.round((stats.firstTryCount / stats.totalSolved) * 100)
    : 0

  function toggleType(id: OperationType) {
    const current = settings.selectedTypes
    if (current.includes(id)) {
      if (current.length === 1) return
      updateSettings({ selectedTypes: current.filter(t => t !== id) })
    } else {
      updateSettings({ selectedTypes: [...current, id] })
    }
  }

  function handleRetry(entry: HistoryEntry) {
    resetGame()
    setEquation(entry.equation)
    setDifficulty(entry.equation.difficulty)
    navigate('/game')
  }

  const recentHistory = history.slice(0, 20)

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#f8f9fa', overflow: 'hidden' }}>
      {/* Header — fixed */}
      <div className="theme-gradient px-5 pt-12 pb-8 flex-shrink-0">
        <div className="flex items-center gap-3">
          <motion.div
            style={{ width: 48, height: 48, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ repeat: Infinity, duration: 3, repeatDelay: 2 }}
          >
            {settings.avatar}
          </motion.div>
          <div>
            <p className="text-white font-bold text-xl leading-tight">
              {settings.kidName ? `Hey, ${settings.kidName}! 👋` : 'Hey there! 👋'}
            </p>
            <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>Ready for your math adventure? 🧮</p>
          </div>
        </div>
      </div>

      {/* Stats Card — fixed below header */}
      <div className="px-4 flex-shrink-0" style={{ marginTop: -16 }}>
        <div className="card grid grid-cols-2 gap-2">
          {[
            { value: stats.totalSolved, label: 'Total Solved' },
            { value: `${accuracy}%`,    label: 'Accuracy' },
            { value: `🔥 ${stats.bestStreak}`, label: 'Best Streak' },
            { value: stats.todayCount,  label: 'Today' },
          ].map(({ value, label }) => (
            <div key={label} className="rounded-xl p-2 text-center" style={{ background: '#f0efff' }}>
              <div className="text-xl font-black" style={{ color: '#6c5ce7' }}>{value}</div>
              <div className="text-xs mt-0.5" style={{ color: '#999' }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Type selector — fixed below stats */}
      <div className="px-4 pt-3 pb-2 flex-shrink-0">
        <p className="font-bold text-sm mb-2" style={{ color: '#333' }}>Practice:</p>
        <div className="flex gap-2 flex-wrap">
          {TYPE_OPTIONS.map(({ id, emoji, label }) => {
            const active = settings.selectedTypes.includes(id)
            return (
              <motion.button
                key={id}
                whileTap={{ scale: 0.93 }}
                onClick={() => toggleType(id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-sm border-2"
                style={{
                  borderColor: active ? '#6c5ce7' : '#e0e0e0',
                  background: active ? '#f0efff' : 'white',
                  color: active ? '#6c5ce7' : '#666',
                  transition: 'all 0.15s',
                }}
              >
                <span>{emoji}</span>
                <span>{label}</span>
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Scrollable history */}
      <div style={{ flex: 1, overflowY: 'auto', paddingLeft: 16, paddingRight: 16, paddingBottom: 8 }}>
        {recentHistory.length > 0 ? (
          <div>
            <p className="font-bold text-sm mb-2" style={{ color: '#333' }}>Recent:</p>
            <div className="space-y-1.5">
              {recentHistory.map(entry => (
                <HistoryItem key={entry.id} entry={entry} onRetry={handleRetry} />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center" style={{ opacity: 0.4 }}>
            <div style={{ fontSize: 40 }}>🎮</div>
            <p className="text-sm font-semibold mt-2" style={{ color: '#666' }}>Play some equations to see history!</p>
          </div>
        )}
      </div>

      {/* Play button — fixed above nav */}
      <div className="px-4 pt-2 pb-1 flex-shrink-0" style={{ background: '#f8f9fa' }}>
        <motion.button
          className="btn-primary"
          whileTap={{ scale: 0.97 }}
          animate={{ boxShadow: ['0 4px 20px #6c5ce740', '0 8px 30px #6c5ce770', '0 4px 20px #6c5ce740'] }}
          transition={{ repeat: Infinity, duration: 2 }}
          onClick={() => navigate('/game')}
        >
          🚀 Start Quest!
        </motion.button>
      </div>

      {/* Bottom nav — always at bottom */}
      <nav className="flex-shrink-0 flex" style={{ borderTop: '1px solid #e0e0e0', background: 'white' }}>
        {[
          { icon: '🏠', label: 'Home',     path: '/',         active: true },
          { icon: '⚙️', label: 'Settings', path: '/settings', active: false },
        ].map(({ icon, label, path, active }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className="flex-1 flex flex-col items-center py-3 gap-0.5 text-xs font-semibold"
            style={{ color: active ? '#6c5ce7' : '#999', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <span className="text-xl">{icon}</span>
            {label}
          </button>
        ))}
      </nav>
    </div>
  )
}
