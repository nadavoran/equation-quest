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
import type { HistoryEntry, Difficulty } from '../types'

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
  const [questionCount, setQuestionCount] = useState(1)
  const [feedbackMsg, setFeedbackMsg] = useState('')
  // Progressive hint index: cycles through all available hints for the equation
  const [hintIndex, setHintIndex] = useState(0)
  const [currentHints, setCurrentHints] = useState<{ text: string; emoji: string }[]>([])
  // Countdown auto-advance: counts down from COUNTDOWN_SECS to 0 after correct answer
  const COUNTDOWN_SECS = 4
  const [countdown, setCountdown] = useState(COUNTDOWN_SECS)
  const [paused, setPaused] = useState(false)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [showStreakCelebration, setShowStreakCelebration] = useState(false)
  const [muted, setMuted] = useState(!useSettingsStore.getState().settings.soundEnabled)

  const nextEquation = useCallback((difficulty: Difficulty) => {
    const state = useGameStore.getState()
    const adapted = adaptDifficulty(difficulty, state.consecutiveWrong, state.streak)
    const picked = pickDifficulty(adapted)
    const eq = generateEquation(useSettingsStore.getState().settings, picked)
    game.setEquation(eq)
    game.setDifficulty(picked)
    setInputValue('')
    setFeedbackMsg('')
    setHintIndex(0)
    game.setShowHint(false)
    setCurrentHints(getHints(eq))
  }, []) // reads fresh state from store — no stale closures

  useEffect(() => {
    nextEquation('easy')
    // Start background music if sound enabled
    const { soundEnabled } = useSettingsStore.getState().settings
    if (soundEnabled) startMusic()
    return () => {
      game.resetGame()
      stopMusic()
    }
  }, []) // eslint-disable-line

  useEffect(() => {
    if (game.currentEquation && game.feedbackState === 'idle') {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [game.currentEquation, game.feedbackState])

  // Countdown tick — runs when correct and not paused
  useEffect(() => {
    if (game.feedbackState !== 'correct') return
    if (paused) {
      if (countdownRef.current) clearInterval(countdownRef.current)
      return
    }
    countdownRef.current = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(countdownRef.current!)
          // auto-advance
          const newDiff = adaptDifficulty(useGameStore.getState().difficulty, 0, useGameStore.getState().streak)
          const picked = pickDifficulty(adaptDifficulty(newDiff, 0, useGameStore.getState().streak))
          const eq = generateEquation(useSettingsStore.getState().settings, picked)
          useGameStore.getState().setEquation(eq)
          useGameStore.getState().setDifficulty(picked)
          useGameStore.getState().setShowHint(false)
          setInputValue('')
          setFeedbackMsg('')
          setHintIndex(0)
          setCurrentHints(getHints(eq))
          setQuestionCount(q => q + 1)
          return COUNTDOWN_SECS
        }
        return c - 1
      })
    }, 1000)
    return () => { if (countdownRef.current) clearInterval(countdownRef.current) }
  }, [game.feedbackState, paused])

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

      // Play correct chime (or fanfare for milestone streaks)
      const { soundEnabled } = useSettingsStore.getState().settings
      const newStreak = game.streak + 1
      if (soundEnabled) {
        if (newStreak === 5 || newStreak === 10 || newStreak === 20 || (newStreak > 20 && newStreak % 10 === 0)) {
          const level = newStreak >= 20 ? 'epic' : newStreak >= 10 ? 'high' : 'medium'
          playStreakFanfare(level)
        } else {
          playCorrect()
        }
      }
      // Show milestone celebration overlay
      if (newStreak === 5 || newStreak === 10 || newStreak === 20 || (newStreak > 20 && newStreak % 10 === 0)) {
        setShowStreakCelebration(true)
      }

      confetti({
        particleCount: 140,
        spread: 80,
        origin: { y: 0.55 },
        colors: ['#6c5ce7', '#fd79a8', '#00b894', '#fdcb6e', '#74b9ff'],
      })

      const entry: HistoryEntry = {
        id: `${Date.now()}-${Math.random()}`,
        equation: game.currentEquation,
        attempts: [...game.currentAttempts, attempt],
        skipped: false,
        solvedOnFirstTry: isFirstTry,
        timestamp: Date.now(),
      }
      game.addSessionHistory(entry)
      addHistoryEntry(entry)
      // Start countdown auto-advance
      setCountdown(COUNTDOWN_SECS)
      setPaused(false)

    } else {
      game.setFeedbackState('wrong')
      game.resetStreak()
      game.incrementConsecutiveWrong()
      setFeedbackMsg(WRONG_MESSAGES[Math.floor(Math.random() * WRONG_MESSAGES.length)])

      // Play wrong buzz
      if (useSettingsStore.getState().settings.soundEnabled) playWrong()

      // Auto-show first hint after 2 wrong answers
      if (game.currentAttempts.length >= 1) {
        game.setShowHint(true)
      }

      setTimeout(() => {
        game.setFeedbackState('idle')
        setInputValue('')
        setTimeout(() => inputRef.current?.focus(), 50)
      }, 1200)
    }
  }

  function handleHint() {
    game.setShowHint(true)
    // Cycle to next hint on repeated taps
    if (currentHints.length > 1) {
      setHintIndex(i => (i + 1) % currentHints.length)
    }
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
    }
    game.addSessionHistory(entry)
    addHistoryEntry(entry)
    recordSkipped()
    game.resetStreak()
    game.resetConsecutiveWrong()
    nextEquation(game.difficulty)
    setQuestionCount(q => q + 1)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleCheck()
  }

  if (!game.currentEquation) return null

  const eq = game.currentEquation
  const isCorrect = game.feedbackState === 'correct'
  const isWrong = game.feedbackState === 'wrong'
  const activeHint = currentHints[hintIndex]

  return (
    <div className="min-h-dvh flex flex-col bg-surface relative overflow-hidden">
      {/* Backdrop for history */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40"
            onClick={() => setShowHistory(false)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="theme-gradient px-4 pt-10 pb-4 flex items-center justify-between">
        <button
          onClick={() => navigate('/')}
          className="text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full bg-white/20 active:bg-white/30"
        >←</button>
        <span className="text-white/90 text-sm font-semibold">Q {questionCount}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Mute toggle */}
          <motion.button
            whileTap={{ scale: 0.88 }}
            onClick={() => {
              const next = !muted
              setMuted(next)
              setMusicEnabled(!next)
              // Also update persisted setting
              useSettingsStore.getState().updateSettings({ soundEnabled: !next })
            }}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: muted ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.18)',
              border: 'none', cursor: 'pointer', fontSize: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'white',
            }}
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? '🔇' : '🔊'}
          </motion.button>
          {/* Streak badge */}
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 20, padding: '4px 12px' }}
            className="text-white text-sm font-bold">
            🔥 {game.streak}
          </div>
        </div>
      </div>

      {/* Difficulty gauge */}
      <div className="flex justify-center pt-2 pb-0">
        <DifficultyGauge difficulty={eq.difficulty} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 gap-3">

        {/* Visual blocks area */}
        <motion.div
          className="w-full flex justify-center min-h-[120px] items-center"
          animate={isWrong ? { x: [-8, 8, -6, 6, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <VisualBlocks
            equation={eq}
            showHint={game.showHint}
            feedbackState={game.feedbackState}
            blockSize={eq.numbers.some(n => Math.abs(n) > 12) ? 20 : 26}
          />
        </motion.div>

        {/* Equation text — shows live user input replacing the ? */}
        <p className="text-3xl font-black tracking-wide text-center" style={{ color: '#333' }}>
          {(() => {
            const full = formatEquation(eq) // e.g. "3 + 5 = ?"
            if (isCorrect) {
              // Show the correct answer in green
              return full.replace('?', `${eq.displayAnswer ?? eq.correctAnswer}`)
            }
            if (inputValue.trim()) {
              // Replace ? with the live input in a different color
              const parts = full.split('?')
              return (
                <>
                  {parts[0]}
                  <span style={{ color: '#6c5ce7', background: '#f0efff', borderRadius: 6, padding: '0 4px' }}>
                    {inputValue}
                  </span>
                  {parts[1]}
                </>
              )
            }
            return full
          })()}
        </p>

        {/* Success celebration + countdown Next button */}
        <AnimatePresence>
          {isCorrect && (
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0 }}
              className="rounded-2xl p-4 text-center w-full"
              style={{ background: 'rgba(0,184,148,0.1)', border: '2px solid #00b894' }}
            >
              <p className="font-black text-xl mb-3" style={{ color: '#00b894' }}>{feedbackMsg}</p>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', alignItems: 'center' }}>
                {/* Pause / Resume button */}
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setPaused(p => !p)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  style={{
                    width: 44, height: 44, borderRadius: '50%',
                    background: paused ? '#fdcb6e' : '#e0e0e0',
                    border: 'none', fontSize: 18, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                  title={paused ? 'Resume' : 'Pause'}
                >
                  {paused ? '▶' : '⏸'}
                </motion.button>

                {/* Next button with draining progress background */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (countdownRef.current) clearInterval(countdownRef.current)
                    const newDiff = adaptDifficulty(game.difficulty, 0, game.streak)
                    nextEquation(newDiff)
                    setQuestionCount(q => q + 1)
                  }}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  style={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: 12,
                    padding: '10px 28px',
                    fontSize: 16, fontWeight: 900,
                    color: 'white', border: 'none',
                    background: '#00b894',
                    cursor: 'pointer',
                    boxShadow: '0 3px 12px rgba(0,184,148,0.4)',
                    minWidth: 140,
                  }}
                >
                  {/* Draining fill — shrinks left-to-right as countdown ticks */}
                  <motion.div
                    animate={{ width: paused ? `${(countdown / COUNTDOWN_SECS) * 100}%` : `${(countdown / COUNTDOWN_SECS) * 100}%` }}
                    transition={{ duration: paused ? 0 : 0.9, ease: 'linear' }}
                    style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0,
                      background: 'rgba(0,0,0,0.15)',
                      borderRadius: 12,
                      pointerEvents: 'none',
                    }}
                  />
                  <span style={{ position: 'relative', zIndex: 1 }}>
                    Next ➜ {paused ? '' : `(${countdown})`}
                  </span>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input + buttons (hidden when correct) */}
        {!isCorrect && (
          <div className="w-full flex flex-col items-center gap-3">
            {/* Wrong feedback */}
            <AnimatePresence>
              {isWrong && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-bold"
                  style={{ color: '#e17055' }}
                >
                  {feedbackMsg}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Answer input */}
            <motion.input
              ref={inputRef}
              type="number"
              inputMode="numeric"
              placeholder="?"
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="text-center text-3xl font-black outline-none bg-white"
              style={{
                width: 120,
                height: 60,
                borderRadius: 16,
                border: `3px solid ${isWrong ? '#e17055' : '#6c5ce7'}`,
                color: '#333',
                transition: 'border-color 0.2s',
              }}
            />

            {/* Action buttons */}
            <div className="flex gap-2 w-full">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleSkip}
                className="flex-1 py-3 font-semibold text-sm"
                style={{ borderRadius: 10, background: '#f1f3f5', color: '#666' }}
              >
                ⏭ Skip
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleCheck}
                disabled={!inputValue.trim()}
                className="flex-[2] py-3 font-black text-base text-white"
                style={{
                  borderRadius: 10,
                  background: inputValue.trim() ? '#00b894' : '#ccc',
                  transition: 'background 0.2s',
                }}
              >
                ✓ Check
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleHint}
                animate={game.currentAttempts.length >= 2 ? { scale: [1, 1.06, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.2 }}
                className="flex-1 py-3 font-bold text-sm relative"
                style={{ borderRadius: 10, background: '#fdcb6e', color: '#333' }}
              >
                💡 Hint
                {currentHints.length > 1 && game.showHint && (
                  <span
                    className="absolute -top-1 -right-1 text-xs font-black text-white rounded-full w-4 h-4 flex items-center justify-center"
                    style={{ background: '#e17055', fontSize: 9 }}
                  >
                    {hintIndex + 1}/{currentHints.length}
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
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="w-full rounded-2xl p-3"
              style={{ background: 'rgba(253,203,110,0.25)', border: '1.5px solid #fdcb6e' }}
            >
              <p className="text-sm font-semibold" style={{ color: '#7d5a00' }}>
                {activeHint.emoji} {activeHint.text}
              </p>
              {currentHints.length > 1 && (
                <p className="text-xs mt-1" style={{ color: '#b8860b' }}>
                  Tap 💡 again for another hint ({hintIndex + 1} of {currentHints.length})
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* History tab */}
      <button
        onClick={() => setShowHistory(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 text-white text-xs font-bold py-4 px-1 rounded-l-xl shadow-lg z-30 theme-gradient"
        style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
      >
        📋 History
      </button>

      <AnimatePresence>
        {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} />}
      </AnimatePresence>

      {/* Streak milestone celebration overlay */}
      {showStreakCelebration && (
        <StreakCelebration
          streak={game.streak}
          onDone={() => setShowStreakCelebration(false)}
        />
      )}
    </div>
  )
}
