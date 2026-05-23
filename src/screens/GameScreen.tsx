import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'
import { useStatsStore, useGameStore, useSettingsStore } from '../store'
import { generateEquation, checkAnswer, formatEquation, adaptDifficulty, pickDifficulty } from '../engine'
import { getHints } from '../hints'
import { playCorrect, playWrong, playStreakFanfare, startMusic, stopMusic, setMusicEnabled } from '../utils/sounds'
import VisualBlocks from '../components/VisualBlocks'
import HistoryPanel from '../components/HistoryPanel'
import DifficultyGauge from '../components/DifficultyGauge'
import StreakCelebration from '../components/StreakCelebration'
import ExerciseIntro from '../components/ExerciseIntro'
import ExerciseComplete from '../components/ExerciseComplete'
import type { HistoryEntry, Difficulty, OperationType } from '../types'

const EXERCISE_SIZE = 5 // equations per exercise

const CORRECT_MESSAGES = [
  'Amazing! 🌟', 'Brilliant! 🎉', 'You got it! 🏆', 'Superstar! ⭐', 'Fantastic! 🎊', 'Nailed it! 💪',
]
const WRONG_MESSAGES = [
  'Not quite! Try again 💪', 'Almost there! 🤔', 'Keep going! You can do it! 💫', 'So close! Try once more 🎯',
]

export default function GameScreen() {
  const navigate = useNavigate()
  const { recordSolved, recordSkipped, addHistoryEntry } = useStatsStore()
  const game = useGameStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [inputValue, setInputValue] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [feedbackMsg, setFeedbackMsg] = useState('')
  const [hintIndex, setHintIndex] = useState(0)
  const [currentHints, setCurrentHints] = useState<{ text: string; emoji: string }[]>([])
  const COUNTDOWN_SECS = 4
  const [countdown, setCountdown] = useState(COUNTDOWN_SECS)
  const [paused, setPaused] = useState(false)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [showStreakCelebration, setShowStreakCelebration] = useState(false)
  const [muted, setMuted] = useState(!useSettingsStore.getState().settings.soundEnabled)

  // ── Exercise state ────────────────────────────────────────────────────────
  const [exerciseNumber, setExerciseNumber] = useState(1)
  const [exercisePhase, setExercisePhase] = useState<'intro' | 'playing' | 'complete'>('intro')
  const [exerciseEntries, setExerciseEntries] = useState<HistoryEntry[]>([])
  const [exerciseQuestionIdx, setExerciseQuestionIdx] = useState(0)
  const exerciseIdRef = useRef(`ex-${Date.now()}`)
  // Per-exercise overrides (set at intro, reset each exercise)
  const [exerciseTypes, setExerciseTypes] = useState<OperationType[]>([])
  const [exerciseDiffs, setExerciseDiffs] = useState<Difficulty[]>([])

  const settings = useSettingsStore(s => s.settings)

  const nextEquation = useCallback((difficulty: Difficulty) => {
    const state = useGameStore.getState()
    // Use per-exercise difficulties if set, else fall back to settings
    const allowedDiffs: Difficulty[] = exerciseDiffs.length > 0
      ? exerciseDiffs
      : useSettingsStore.getState().settings.selectedDifficulties
    // Only adapt within the allowed set — never go outside what user selected
    const adapted = adaptDifficulty(difficulty, state.consecutiveWrong, state.streak)
    // Clamp adapted to nearest allowed difficulty if outside allowed set
    const clampedAdapted: Difficulty = allowedDiffs.includes(adapted)
      ? adapted
      : allowedDiffs[Math.floor(allowedDiffs.length / 2)] // pick middle of allowed
    const picked = pickDifficulty(clampedAdapted, allowedDiffs)
    // Build effective settings with per-exercise types override
    const baseSettings = useSettingsStore.getState().settings
    const effectiveSettings = exerciseTypes.length > 0
      ? { ...baseSettings, selectedTypes: exerciseTypes }
      : baseSettings
    const eq = generateEquation(effectiveSettings, picked)
    game.setEquation(eq)
    game.setDifficulty(picked)
    setInputValue('')
    setFeedbackMsg('')
    setHintIndex(0)
    game.setShowHint(false)
    setCurrentHints(getHints(eq))
  }, [exerciseTypes, exerciseDiffs])

  function startExercise(types: OperationType[], diffs: Difficulty[]) {
    exerciseIdRef.current = `ex-${Date.now()}`
    setExerciseEntries([])
    setExerciseQuestionIdx(0)
    setExerciseTypes(types)
    setExerciseDiffs(diffs)
    setExercisePhase('playing')
    // Pick starting difficulty from allowed set
    const startDiff = diffs.includes('easy') ? 'easy' : diffs[0]
    nextEquation(startDiff)
  }

  useEffect(() => {
    const { soundEnabled } = useSettingsStore.getState().settings
    if (soundEnabled) startMusic()
    return () => { game.resetGame(); stopMusic() }
  }, []) // eslint-disable-line

  useEffect(() => {
    if (game.currentEquation && game.feedbackState === 'idle') {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [game.currentEquation, game.feedbackState])

  // Countdown auto-advance
  useEffect(() => {
    if (game.feedbackState !== 'correct') return
    if (paused) { if (countdownRef.current) clearInterval(countdownRef.current); return }
    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(countdownRef.current!)
          advanceAfterCorrect()
          return COUNTDOWN_SECS
        }
        return c - 1
      })
    }, 1000)
    return () => { if (countdownRef.current) clearInterval(countdownRef.current) }
  }, [game.feedbackState, paused])

  function advanceAfterCorrect() {
    const nextIdx = exerciseQuestionIdx + 1
    if (nextIdx >= EXERCISE_SIZE) {
      setExercisePhase('complete')
    } else {
      setExerciseQuestionIdx(nextIdx)
      const newDiff = adaptDifficulty(useGameStore.getState().difficulty, 0, useGameStore.getState().streak)
      nextEquation(newDiff)
    }
  }

  function handleCheck() {
    if (!game.currentEquation || game.feedbackState !== 'idle') return
    const input = inputValue.trim()
    if (!input) return

    const correct = checkAnswer(input, game.currentEquation)
    const attempt = { value: input, correct }
    game.addAttempt(attempt)

    if (correct) {
      const isFirstTry = game.currentAttempts.length === 0
      game.setFeedbackState('correct')
      game.incrementStreak()
      game.resetConsecutiveWrong()
      game.updateBestStreak(game.streak + 1)
      recordSolved(isFirstTry)
      setFeedbackMsg(CORRECT_MESSAGES[Math.floor(Math.random() * CORRECT_MESSAGES.length)])

      const { soundEnabled } = useSettingsStore.getState().settings
      const newStreak = game.streak + 1
      if (soundEnabled) {
        if (newStreak === 5 || newStreak === 10 || newStreak === 20 || (newStreak > 20 && newStreak % 10 === 0)) {
          playStreakFanfare(newStreak >= 20 ? 'epic' : newStreak >= 10 ? 'high' : 'medium')
        } else {
          playCorrect()
        }
      }
      if (newStreak === 5 || newStreak === 10 || newStreak === 20 || (newStreak > 20 && newStreak % 10 === 0)) {
        setShowStreakCelebration(true)
      }

      confetti({ particleCount: 120, spread: 75, origin: { y: 0.6 }, colors: ['#6c5ce7', '#fd79a8', '#00b894', '#fdcb6e'] })

      const entry: HistoryEntry = {
        id: `${Date.now()}-${Math.random()}`,
        equation: game.currentEquation,
        attempts: [...game.currentAttempts, attempt],
        skipped: false,
        solvedOnFirstTry: isFirstTry,
        timestamp: Date.now(),
        exerciseId: exerciseIdRef.current,
      }
      game.addSessionHistory(entry)
      addHistoryEntry(entry)
      setExerciseEntries(prev => [...prev, entry])
      setCountdown(COUNTDOWN_SECS)
      setPaused(false)

    } else {
      game.setFeedbackState('wrong')
      game.resetStreak()
      game.incrementConsecutiveWrong()
      setFeedbackMsg(WRONG_MESSAGES[Math.floor(Math.random() * WRONG_MESSAGES.length)])
      if (useSettingsStore.getState().settings.soundEnabled) playWrong()
      if (game.currentAttempts.length >= 1) game.setShowHint(true)
      setTimeout(() => {
        game.setFeedbackState('idle')
        setInputValue('')
        setTimeout(() => inputRef.current?.focus(), 50)
      }, 1200)
    }
  }

  function handleHint() {
    game.setShowHint(true)
    if (currentHints.length > 1) setHintIndex(i => (i + 1) % currentHints.length)
  }

  function handleSkip() {
    if (!game.currentEquation) return
    const entry: HistoryEntry = {
      id: `${Date.now()}-${Math.random()}`,
      equation: game.currentEquation,
      attempts: game.currentAttempts,
      skipped: true,
      solvedOnFirstTry: false,
      timestamp: Date.now(),
      exerciseId: exerciseIdRef.current,
    }
    game.addSessionHistory(entry)
    addHistoryEntry(entry)
    recordSkipped()
    game.resetStreak()
    game.resetConsecutiveWrong()
    setExerciseEntries(prev => [...prev, entry])
    const nextIdx = exerciseQuestionIdx + 1
    if (nextIdx >= EXERCISE_SIZE) {
      setExercisePhase('complete')
    } else {
      setExerciseQuestionIdx(nextIdx)
      nextEquation(game.difficulty)
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleCheck()
  }

  function handleOneMore() {
    setExerciseNumber(n => n + 1)
    setExerciseTypes([])   // reset to home settings for next intro
    setExerciseDiffs([])
    setExercisePhase('intro')
    game.resetGame()
  }

  function handleDone() {
    navigate('/')
  }

  // ── Render exercise overlays first ──
  if (exercisePhase === 'intro') {
    return <ExerciseIntro
      exerciseNumber={exerciseNumber}
      exerciseSize={EXERCISE_SIZE}
      selectedTypes={settings.selectedTypes}
      selectedDifficulties={settings.selectedDifficulties}
      onStart={startExercise}
      onHome={() => navigate('/')}
    />
  }

  if (exercisePhase === 'complete') {
    return <ExerciseComplete
      exerciseNumber={exerciseNumber}
      entries={exerciseEntries}
      onDone={handleDone}
      onOneMore={handleOneMore}
    />
  }

  if (!game.currentEquation) return null

  const eq = game.currentEquation
  const isCorrect = game.feedbackState === 'correct'
  const isWrong = game.feedbackState === 'wrong'
  const activeHint = currentHints[hintIndex]
  const progressPct = ((exerciseQuestionIdx) / EXERCISE_SIZE) * 100

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: '#f8f9fa', position: 'relative', overflow: 'hidden' }}>
      {/* History backdrop */}
      <AnimatePresence>
        {showHistory && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }}
            onClick={() => setShowHistory(false)}
          />
        )}
      </AnimatePresence>

      {/* ── Compact header — stays visible even with keyboard open ── */}
      <div className="theme-gradient flex-shrink-0" style={{ padding: '44px 12px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Back — uses flex+center so identical on all platforms */}
        <button
          onClick={() => navigate('/')}
          style={{
            width: 36, height: 36, borderRadius: '50%', border: 'none',
            background: 'rgba(255,255,255,0.2)', color: 'white',
            fontSize: 18, cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1,
          }}
        >←</button>

        {/* Exercise + progress bar */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: 700 }}>
              Exercise {exerciseNumber} · {exerciseQuestionIdx + 1}/{EXERCISE_SIZE}
            </span>
            <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12, fontWeight: 700 }}>
              🔥 {game.streak}
            </span>
          </div>
          {/* Progress bar */}
          <div style={{ height: 5, background: 'rgba(255,255,255,0.25)', borderRadius: 3, overflow: 'hidden' }}>
            <motion.div
              animate={{ width: `${progressPct}%` }}
              transition={{ type: 'spring', stiffness: 200 }}
              style={{ height: '100%', background: 'white', borderRadius: 3 }}
            />
          </div>
        </div>

        {/* Mute */}
        <motion.button
          whileTap={{ scale: 0.88 }}
          onClick={() => {
            const next = !muted
            setMuted(next)
            setMusicEnabled(!next)
            useSettingsStore.getState().updateSettings({ soundEnabled: !next })
          }}
          style={{
            width: 34, height: 34, borderRadius: '50%', border: 'none',
            background: muted ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.15)',
            color: 'white', fontSize: 16, cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >{muted ? '🔇' : '🔊'}</motion.button>
      </div>

      {/* Difficulty gauge — compact */}
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 4, flexShrink: 0 }}>
        <DifficultyGauge difficulty={eq.difficulty} />
      </div>

      {/* ── Scrollable main content ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 16px', gap: 10, overflowY: 'auto' }}>

        {/* Visual blocks — only shown when setting is on */}
        {settings.showBlocks && (
          <motion.div
            style={{ width: '100%', display: 'flex', justifyContent: 'center', minHeight: 80 }}
            animate={isWrong ? { x: [-8, 8, -6, 6, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <VisualBlocks
              equation={eq}
              showHint={game.showHint}
              feedbackState={game.feedbackState}
              blockSize={eq.numbers.some(n => Math.abs(n) > 12) ? 18 : 22}
            />
          </motion.div>
        )}

        {/* Equation text */}
        <p style={{ fontSize: 36, fontWeight: 900, color: '#333', margin: 0, textAlign: 'center', letterSpacing: 1 }}>
          {(() => {
            const full = formatEquation(eq)
            if (isCorrect) return full.replace('?', `${eq.displayAnswer ?? eq.correctAnswer}`)
            if (inputValue.trim()) {
              const parts = full.split('?')
              return <>
                {parts[0]}
                <span style={{ color: '#6c5ce7', background: '#f0efff', borderRadius: 6, padding: '0 4px' }}>
                  {inputValue}
                </span>
                {parts[1]}
              </>
            }
            return full
          })()}
        </p>

        {/* Success box */}
        <AnimatePresence>
          {isCorrect && (
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}
              style={{ background: 'rgba(0,184,148,0.1)', border: '2px solid #00b894', borderRadius: 20, padding: '12px 16px', textAlign: 'center', width: '100%' }}
            >
              <p style={{ fontWeight: 900, fontSize: 18, color: '#00b894', margin: '0 0 10px' }}>{feedbackMsg}</p>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center' }}>
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setPaused(p => !p)}
                  style={{ width: 40, height: 40, borderRadius: '50%', background: paused ? '#fdcb6e' : '#e0e0e0', border: 'none', fontSize: 16, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >{paused ? '▶' : '⏸'}</motion.button>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => { if (countdownRef.current) clearInterval(countdownRef.current); advanceAfterCorrect() }}
                  style={{ position: 'relative', overflow: 'hidden', borderRadius: 12, padding: '10px 24px', fontSize: 15, fontWeight: 900, color: 'white', border: 'none', background: '#00b894', cursor: 'pointer', minWidth: 130, boxShadow: '0 3px 12px rgba(0,184,148,0.4)' }}
                >
                  <motion.div
                    animate={{ width: `${(countdown / COUNTDOWN_SECS) * 100}%` }}
                    transition={{ duration: paused ? 0 : 0.9, ease: 'linear' }}
                    style={{ position: 'absolute', left: 0, top: 0, bottom: 0, background: 'rgba(0,0,0,0.15)', borderRadius: 12, pointerEvents: 'none' }}
                  />
                  <span style={{ position: 'relative', zIndex: 1 }}>
                    {exerciseQuestionIdx + 1 >= EXERCISE_SIZE ? 'Finish! 🏁' : `Next ➜`} {paused ? '' : `(${countdown})`}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input area */}
        {!isCorrect && (
          <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <AnimatePresence>
              {isWrong && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ color: '#e17055', fontWeight: 700, fontSize: 14, margin: 0 }}>
                  {feedbackMsg}
                </motion.p>
              )}
            </AnimatePresence>

            <input
              ref={inputRef}
              type="number"
              inputMode="numeric"
              placeholder="?"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{
                width: 110, height: 56, textAlign: 'center', fontSize: 28,
                fontWeight: 900, borderRadius: 14, outline: 'none', background: 'white',
                border: `3px solid ${isWrong ? '#e17055' : '#6c5ce7'}`,
                color: '#333', transition: 'border-color 0.2s',
              }}
            />

            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleSkip}
                style={{ flex: 1, padding: '12px 0', borderRadius: 10, background: '#f1f3f5', color: '#666', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
                ⏭ Skip
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleCheck} disabled={!inputValue.trim()}
                style={{ flex: 2, padding: '12px 0', borderRadius: 10, background: inputValue.trim() ? '#00b894' : '#ccc', color: 'white', border: 'none', fontWeight: 900, fontSize: 15, cursor: 'pointer', transition: 'background 0.2s' }}>
                ✓ Check
              </motion.button>
              <motion.button whileTap={{ scale: 0.95 }} onClick={handleHint}
                animate={game.currentAttempts.length >= 2 ? { scale: [1, 1.06, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.2 }}
                style={{ flex: 1, padding: '12px 0', borderRadius: 10, background: '#fdcb6e', color: '#333', border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', position: 'relative' }}>
                💡
                {currentHints.length > 1 && game.showHint && (
                  <span style={{ position: 'absolute', top: -4, right: -4, width: 16, height: 16, borderRadius: '50%', background: '#e17055', color: 'white', fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {hintIndex + 1}
                  </span>
                )}
              </motion.button>
            </div>
          </div>
        )}

        {/* Hint display */}
        <AnimatePresence mode="wait">
          {game.showHint && activeHint && (
            <motion.div
              key={hintIndex}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              style={{ width: '100%', borderRadius: 16, padding: '10px 14px', background: 'rgba(253,203,110,0.25)', border: '1.5px solid #fdcb6e' }}
            >
              <p style={{ fontSize: 13, fontWeight: 600, color: '#7d5a00', margin: 0 }}>
                {activeHint.emoji} {activeHint.text}
              </p>
              {currentHints.length > 1 && (
                <p style={{ fontSize: 11, color: '#b8860b', margin: '4px 0 0' }}>
                  Tap 💡 for another hint ({hintIndex + 1}/{currentHints.length})
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* History tab */}
      <button
        onClick={() => setShowHistory(true)}
        style={{
          position: 'fixed', right: 0, top: '50%', transform: 'translateY(-50%)',
          writingMode: 'vertical-rl', textOrientation: 'mixed',
          background: 'linear-gradient(var(--theme-from), var(--theme-to))',
          color: 'white', fontSize: 11, fontWeight: 700,
          padding: '12px 4px', borderRadius: '10px 0 0 10px',
          border: 'none', cursor: 'pointer', zIndex: 30,
        }}
      >📋 History</button>

      <AnimatePresence>
        {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}
      </AnimatePresence>

      {showStreakCelebration && (
        <StreakCelebration streak={game.streak} onDone={() => setShowStreakCelebration(false)} />
      )}
    </div>
  )
}
