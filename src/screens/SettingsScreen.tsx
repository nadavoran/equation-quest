import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSettingsStore } from '../store'
import { THEMES, applyTheme } from '../themes'
import { setMusicEnabled } from '../utils/sounds'
import type { ThemeId } from '../types'

const AVATARS = ['🦊','🐼','🦁','🐨','🐸','🦉','🐙','🦋','🐢','🦄','🐳','🦎']
const MAX_NUMBER_OPTIONS = [10, 20, 50, 100, 200, 500, 1000]

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      style={{
        position: 'relative',
        width: 48,
        height: 26,
        borderRadius: 13,
        background: on ? '#6c5ce7' : '#d0d0d0',
        border: 'none',
        cursor: 'pointer',
        transition: 'background 0.2s',
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: on ? 25 : 3,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
          transition: 'left 0.2s',
          display: 'block',
        }}
      />
    </button>
  )
}

export default function SettingsScreen() {
  const navigate = useNavigate()
  const { settings, updateSettings } = useSettingsStore()
  const [local, setLocal] = useState({ ...settings })

  function save() {
    updateSettings(local)
    applyTheme(local.theme)
    navigate('/')
  }

  function stepMaxNumber(dir: 1 | -1) {
    const idx = MAX_NUMBER_OPTIONS.indexOf(local.maxNumber)
    const next = MAX_NUMBER_OPTIONS[Math.max(0, Math.min(MAX_NUMBER_OPTIONS.length - 1, idx + dir))]
    setLocal(s => ({ ...s, maxNumber: next }))
  }

  // Live-preview theme when selecting
  function selectTheme(id: ThemeId) {
    setLocal(s => ({ ...s, theme: id }))
    applyTheme(id) // instant preview
  }

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#f8f9fa', overflow: 'hidden' }}>
      {/* Header — sticky at top */}
      <div className="theme-gradient px-5 pt-12 pb-5 flex items-center gap-3 flex-shrink-0">
        <button
          onClick={() => { applyTheme(settings.theme); navigate('/') }}
          className="text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full"
          style={{ background: 'rgba(255,255,255,0.2)' }}
        >←</button>
        <h1 className="text-white font-bold text-xl">⚙️ EquationQuest Settings</h1>
      </div>

      {/* Scrollable content — fills remaining space */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px' }} className="space-y-4">

        {/* Player Profile */}
        <div className="card space-y-4">
          <h2 className="font-bold text-base" style={{ color: '#333' }}>Player Profile</h2>
          <input
            type="text"
            placeholder="Your name…"
            value={local.kidName}
            onChange={e => setLocal(s => ({ ...s, kidName: e.target.value }))}
            style={{
              width: '100%',
              border: '2px solid #e0e0e0',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 16,
              outline: 'none',
              boxSizing: 'border-box',
            }}
            onFocus={e => (e.target.style.borderColor = '#6c5ce7')}
            onBlur={e => (e.target.style.borderColor = '#e0e0e0')}
          />
          <div>
            <p className="text-sm mb-2" style={{ color: '#666' }}>Choose your avatar</p>
            <div className="grid grid-cols-6 gap-2">
              {AVATARS.map(av => {
                const selected = local.avatar === av
                return (
                  <motion.button
                    key={av}
                    whileTap={{ scale: 0.88 }}
                    onClick={() => setLocal(s => ({ ...s, avatar: av }))}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      fontSize: 22,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: selected ? '3px solid #6c5ce7' : '2px solid #e0e0e0',
                      background: selected ? '#f0efff' : 'white',
                      boxShadow: selected ? '0 0 0 3px rgba(108,92,231,0.25)' : 'none',
                      transition: 'all 0.15s',
                      cursor: 'pointer',
                    }}
                  >
                    {av}
                  </motion.button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Equation Settings */}
        <div className="card space-y-4">
          <h2 className="font-bold text-base" style={{ color: '#333' }}>Equation Settings</h2>

          {/* Numbers per equation */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm" style={{ color: '#333' }}>Numbers per equation</p>
              <p className="text-xs" style={{ color: '#999' }}>
                Max {local.numbersPerEquation} — varies 2 to {local.numbersPerEquation}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setLocal(s => ({ ...s, numbersPerEquation: Math.max(2, s.numbersPerEquation - 1) }))}
                style={{ width: 36, height: 36, borderRadius: '50%', background: '#f0efff', color: '#6c5ce7', border: 'none', fontSize: 20, fontWeight: 'bold', cursor: 'pointer' }}
              >−</button>
              <span className="font-black text-lg w-5 text-center" style={{ color: '#333' }}>{local.numbersPerEquation}</span>
              <button
                onClick={() => setLocal(s => ({ ...s, numbersPerEquation: Math.min(5, s.numbersPerEquation + 1) }))}
                style={{ width: 36, height: 36, borderRadius: '50%', background: '#f0efff', color: '#6c5ce7', border: 'none', fontSize: 20, fontWeight: 'bold', cursor: 'pointer' }}
              >+</button>
            </div>
          </div>

          {/* Max number */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm" style={{ color: '#333' }}>Max number</p>
              <p className="text-xs" style={{ color: '#999' }}>Upper bound for equations</p>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => stepMaxNumber(-1)}
                style={{ width: 36, height: 36, borderRadius: '50%', background: '#f0efff', color: '#6c5ce7', border: 'none', fontSize: 20, fontWeight: 'bold', cursor: 'pointer' }}
              >−</button>
              <span className="font-black text-lg w-12 text-center" style={{ color: '#333' }}>{local.maxNumber}</span>
              <button onClick={() => stepMaxNumber(1)}
                style={{ width: 36, height: 36, borderRadius: '50%', background: '#f0efff', color: '#6c5ce7', border: 'none', fontSize: 20, fontWeight: 'bold', cursor: 'pointer' }}
              >+</button>
            </div>
          </div>

          {/* Simple fractions */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm" style={{ color: '#333' }}>Simple fractions</p>
              <p className="text-xs" style={{ color: '#999' }}>Allow ½ and ¼ in answers</p>
            </div>
            <Toggle on={local.simpleFractions} onToggle={() => setLocal(s => ({ ...s, simpleFractions: !s.simpleFractions }))} />
          </div>

          {/* Show visual blocks */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm" style={{ color: '#333' }}>Visual blocks 🧱</p>
              <p className="text-xs" style={{ color: '#999' }}>Show Numberblocks animations</p>
            </div>
            <Toggle
              on={local.showBlocks}
              onToggle={() => setLocal(s => ({ ...s, showBlocks: !s.showBlocks }))}
            />
          </div>

          {/* Sound effects */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-sm" style={{ color: '#333' }}>Sound effects 🔊</p>
              <p className="text-xs" style={{ color: '#999' }}>Music, chimes and buzz</p>
            </div>
            <Toggle
              on={local.soundEnabled}
              onToggle={() => {
                const next = !local.soundEnabled
                setLocal(s => ({ ...s, soundEnabled: next }))
                setMusicEnabled(next) // live preview
              }}
            />
          </div>
        </div>

        {/* Appearance */}
        <div className="card space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-base" style={{ color: '#333' }}>Fun Background</h2>
            <Toggle on={local.funBackground} onToggle={() => setLocal(s => ({ ...s, funBackground: !s.funBackground }))} />
          </div>

          <AnimatePresence>
            {local.funBackground && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <p className="text-sm mb-3" style={{ color: '#666' }}>Choose theme — tap to preview live!</p>
                {/* Extra padding around grid so the selection ring isn't clipped */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, padding: '6px 6px 8px' }}>
                  {THEMES.map(theme => {
                    const selected = local.theme === theme.id
                    return (
                      <motion.button
                        key={theme.id}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => selectTheme(theme.id as ThemeId)}
                        style={{
                          position: 'relative',
                          height: 68,
                          borderRadius: 14,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 4,
                          background: `linear-gradient(135deg, ${theme.from}, ${theme.to})`,
                          // Use outline instead of box-shadow so it's never clipped by overflow
                          outline: selected ? `3px solid ${theme.primary}` : '3px solid transparent',
                          outlineOffset: 2,
                          border: 'none',
                          boxShadow: selected
                            ? '0 4px 14px rgba(0,0,0,0.22)'
                            : '0 2px 6px rgba(0,0,0,0.1)',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                        }}
                      >
                        <span style={{ fontSize: 22 }}>{theme.emoji}</span>
                        <span style={{ color: 'white', fontSize: 11, fontWeight: 700, textShadow: '0 1px 2px rgba(0,0,0,0.4)' }}>
                          {theme.name}
                        </span>
                        {selected && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            style={{
                              position: 'absolute',
                              top: -8,
                              right: -8,
                              width: 20,
                              height: 20,
                              borderRadius: '50%',
                              background: 'white',
                              color: theme.primary,
                              fontSize: 11,
                              fontWeight: 900,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                            }}
                          >✓</motion.span>
                        )}
                      </motion.button>
                    )
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Static Save button at bottom */}
      <div
        className="px-4 py-4"
        style={{
          position: 'sticky',
          bottom: 0,
          background: 'white',
          borderTop: '1px solid #e0e0e0',
        }}
      >
        <motion.button whileTap={{ scale: 0.97 }} onClick={save} className="btn-primary">
          ✓ Save Settings
        </motion.button>
      </div>
    </div>
  )
}
