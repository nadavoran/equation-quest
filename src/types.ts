export type OperationType = 'addition' | 'subtraction' | 'multiplication' | 'division' | 'negatives'
export type Difficulty = 'easy' | 'medium' | 'hard'
export type DifficultyFilter = 'easy' | 'medium' | 'hard'
export type ThemeId = 'rainbow' | 'ocean' | 'forest' | 'sunset' | 'space' | 'candy'

export interface Equation {
  numbers: number[]
  operation: OperationType
  correctAnswer: number
  difficulty: Difficulty
  displayAnswer?: string // for fractions like "1/2"
}

export interface Attempt {
  value: number | string
  correct: boolean
}

export interface HistoryEntry {
  id: string
  equation: Equation
  attempts: Attempt[]
  skipped: boolean
  solvedOnFirstTry: boolean
  timestamp: number
  exerciseId: string  // which exercise this belongs to
}

export interface Exercise {
  id: string
  number: number      // Exercise 1, 2, 3…
  size: number        // how many equations in this exercise
  startedAt: number
  completedAt?: number
}

export interface Stats {
  totalSolved: number
  firstTryCount: number
  bestStreak: number
  todayCount: number
  lastPlayDate: string // ISO date string
}

export interface Settings {
  kidName: string
  avatar: string
  selectedTypes: OperationType[]
  selectedDifficulties: Difficulty[]  // which difficulties to include
  numbersPerEquation: number
  maxNumber: number
  simpleFractions: boolean
  funBackground: boolean
  theme: ThemeId
  soundEnabled: boolean
  showBlocks: boolean
}

export interface GameState {
  currentEquation: Equation | null
  currentAttempts: Attempt[]
  streak: number
  consecutiveWrong: number
  difficulty: Difficulty
  sessionHistory: HistoryEntry[]
  showHint: boolean
  feedbackState: 'idle' | 'correct' | 'wrong' | 'hint'
}
