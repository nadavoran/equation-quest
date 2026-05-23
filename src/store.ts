import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Settings, Stats, HistoryEntry, GameState, Difficulty, Equation, Attempt } from './types'

// ── Defaults ──────────────────────────────────────────────────────────────────

const defaultSettings: Settings = {
  kidName: '',
  avatar: '🦊',
  selectedTypes: ['addition', 'subtraction', 'multiplication', 'division', 'negatives'],
  selectedDifficulties: ['easy', 'medium', 'hard'],
  numbersPerEquation: 2,
  maxNumber: 100,
  simpleFractions: false,
  funBackground: true,
  theme: 'rainbow',
  soundEnabled: true,
  showBlocks: false,
}

const defaultStats: Stats = {
  totalSolved: 0,
  firstTryCount: 0,
  bestStreak: 0,
  todayCount: 0,
  lastPlayDate: '',
}

const defaultGameState: GameState = {
  currentEquation: null,
  currentAttempts: [],
  streak: 0,
  consecutiveWrong: 0,
  difficulty: 'easy',
  sessionHistory: [],
  showHint: false,
  feedbackState: 'idle',
}

// ── Settings Store (persisted) ────────────────────────────────────────────────

interface SettingsStore {
  settings: Settings
  updateSettings: (patch: Partial<Settings>) => void
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      updateSettings: (patch) =>
        set((s) => ({ settings: { ...s.settings, ...patch } })),
    }),
    { name: 'mathquest-settings' }
  )
)

// ── Stats Store (persisted) ───────────────────────────────────────────────────

interface StatsStore {
  stats: Stats
  history: HistoryEntry[]
  recordSolved: (firstTry: boolean) => void
  recordSkipped: () => void
  addHistoryEntry: (entry: HistoryEntry) => void
  resetStats: () => void
}

export const useStatsStore = create<StatsStore>()(
  persist(
    (set) => ({
      stats: defaultStats,
      history: [],

      recordSolved: (firstTry) =>
        set((s) => {
          const today = new Date().toDateString()
          const isNewDay = s.stats.lastPlayDate !== today
          return {
            stats: {
              ...s.stats,
              totalSolved: s.stats.totalSolved + 1,
              firstTryCount: firstTry ? s.stats.firstTryCount + 1 : s.stats.firstTryCount,
              todayCount: isNewDay ? 1 : s.stats.todayCount + 1,
              lastPlayDate: today,
            },
          }
        }),

      recordSkipped: () => set((s) => ({
        stats: { ...s.stats, totalSolved: s.stats.totalSolved + 1 }
      })),

      addHistoryEntry: (entry) =>
        set((s) => ({ history: [entry, ...s.history].slice(0, 200) })),

      resetStats: () => set({ stats: defaultStats, history: [] }),
    }),
    { name: 'mathquest-stats' }
  )
)

// ── Game Store (session only, not persisted) ──────────────────────────────────

interface GameStore extends GameState {
  setEquation: (eq: Equation) => void
  addAttempt: (attempt: Attempt) => void
  setFeedbackState: (state: GameState['feedbackState']) => void
  setShowHint: (show: boolean) => void
  incrementStreak: () => void
  resetStreak: () => void
  incrementConsecutiveWrong: () => void
  resetConsecutiveWrong: () => void
  setDifficulty: (d: Difficulty) => void
  addSessionHistory: (entry: HistoryEntry) => void
  resetGame: () => void
  updateBestStreak: (streak: number) => void
}

export const useGameStore = create<GameStore>()((set) => ({
  ...defaultGameState,

  setEquation: (eq) => set({ currentEquation: eq, currentAttempts: [], showHint: false, feedbackState: 'idle' }),
  addAttempt: (attempt) => set((s) => ({ currentAttempts: [...s.currentAttempts, attempt] })),
  setFeedbackState: (feedbackState) => set({ feedbackState }),
  setShowHint: (showHint) => set({ showHint }),
  incrementStreak: () => set((s) => ({ streak: s.streak + 1 })),
  resetStreak: () => set({ streak: 0 }),
  incrementConsecutiveWrong: () => set((s) => ({ consecutiveWrong: s.consecutiveWrong + 1 })),
  resetConsecutiveWrong: () => set({ consecutiveWrong: 0 }),
  setDifficulty: (difficulty) => set({ difficulty }),
  addSessionHistory: (entry) => set((s) => ({ sessionHistory: [entry, ...s.sessionHistory] })),
  resetGame: () => set(defaultGameState),
  updateBestStreak: (streak) => {
    useStatsStore.setState((s) => ({
      stats: { ...s.stats, bestStreak: Math.max(s.stats.bestStreak, streak) }
    }))
  },
}))
