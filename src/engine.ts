import type { Equation, OperationType, Difficulty, Settings } from './types'

// ── Difficulty weight bands ───────────────────────────────────────────────────
// After N consecutive wrong → easier; after streak → harder

export function adaptDifficulty(
  current: Difficulty,
  consecutiveWrong: number,
  streak: number
): Difficulty {
  if (consecutiveWrong >= 3) return 'easy'
  if (streak >= 5) return 'hard'
  if (streak >= 3) return 'medium'
  return current
}

/** Pick a difficulty band for the next equation using weighted random. */
export function pickDifficulty(adapted: Difficulty): Difficulty {
  // Base weights: easy 40%, medium 35%, hard 25%
  // But bias heavily towards adapted level
  const roll = Math.random()
  if (adapted === 'easy') {
    if (roll < 0.70) return 'easy'
    if (roll < 0.90) return 'medium'
    return 'hard'
  }
  if (adapted === 'medium') {
    if (roll < 0.35) return 'easy'
    if (roll < 0.75) return 'medium'
    return 'hard'
  }
  // hard
  if (roll < 0.20) return 'easy'
  if (roll < 0.45) return 'medium'
  return 'hard'
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function maxForDifficulty(difficulty: Difficulty, maxNumber: number): number {
  // Always use a range from 2 up to the capped max — never just the max itself
  if (difficulty === 'easy') return Math.min(10, maxNumber)
  if (difficulty === 'medium') return Math.min(50, maxNumber)
  return maxNumber
}

function minForDifficulty(difficulty: Difficulty): number {
  if (difficulty === 'easy') return 1
  if (difficulty === 'medium') return 5
  return 10
}

function generateNumbers(
  operation: OperationType,
  difficulty: Difficulty,
  settings: Settings
): { numbers: number[]; answer: number; displayAnswer?: string } {
  const max = maxForDifficulty(difficulty, settings.maxNumber)
  // min ensures we use a real range (2..max), not always max
  const min = Math.min(minForDifficulty(difficulty), Math.max(1, Math.floor(max / 3)))
  // numbersPerEquation is a MAX — actual count varies between 2 and that max
  const count = settings.numbersPerEquation <= 2
    ? 2
    : 2 + Math.floor(Math.random() * (settings.numbersPerEquation - 1))

  if (operation === 'addition') {
    const nums = Array.from({ length: count }, () => randInt(min, max))
    return { numbers: nums, answer: nums.reduce((a, b) => a + b, 0) }
  }

  if (operation === 'subtraction') {
    const a = randInt(Math.max(min, count), max)
    const rest: number[] = []
    let running = a
    for (let i = 1; i < count; i++) {
      const b = randInt(1, Math.max(1, running - 1))
      rest.push(b)
      running -= b
    }
    return { numbers: [a, ...rest], answer: running }
  }

  if (operation === 'multiplication') {
    // Keep numbers small to avoid huge products; use min/max within reason
    const mulMin = Math.max(2, min)
    const mulMax = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : 12
    const nums = Array.from({ length: count }, () => randInt(mulMin, mulMax))
    return { numbers: nums, answer: nums.reduce((a, b) => a * b, 1) }
  }

  if (operation === 'division') {
    if (settings.simpleFractions) {
      const fractions = [0.5, 0.25]
      const useFraction = Math.random() < 0.3
      if (useFraction && count === 2) {
        const frac = fractions[Math.floor(Math.random() * fractions.length)]
        const divisor = frac === 0.5 ? 2 : 4
        const answer = randInt(Math.max(1, min), Math.floor(max / divisor))
        const dividend = answer * divisor
        return {
          numbers: [dividend, divisor],
          answer: dividend / divisor,
          displayAnswer: frac === 0.5 && answer % 1 !== 0 ? `${Math.floor(answer)}½` : String(answer),
        }
      }
    }
    const divisorMax = difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : 12
    const divisor = randInt(2, divisorMax)
    const answer = randInt(Math.max(1, min), Math.floor(max / divisor))
    const dividend = answer * divisor
    return { numbers: [dividend, divisor], answer }
  }

  if (operation === 'negatives') {
    const a = randInt(min, max)
    const b = randInt(min, max)
    const neg = Math.random() < 0.5
    const nums = neg ? [-a, b] : [a, -b]
    return { numbers: nums, answer: nums[0] + nums[1] }
  }

  // fallback addition
  const nums = Array.from({ length: count }, () => randInt(min, max))
  return { numbers: nums, answer: nums.reduce((a, b) => a + b, 0) }
}

export function generateEquation(
  settings: Settings,
  difficulty: Difficulty
): Equation {
  const { selectedTypes } = settings
  const types = selectedTypes.length > 0 ? selectedTypes : ['addition' as OperationType]
  const operation = types[Math.floor(Math.random() * types.length)]
  const { numbers, answer, displayAnswer } = generateNumbers(operation, difficulty, settings)

  return {
    numbers,
    operation,
    correctAnswer: answer,
    difficulty,
    displayAnswer,
  }
}

export function formatEquation(eq: Equation): string {
  const opSymbol: Record<OperationType, string> = {
    addition: '+',
    subtraction: '−',
    multiplication: '×',
    division: '÷',
    negatives: '+',
  }
  return eq.numbers.join(` ${opSymbol[eq.operation]} `) + ' = ?'
}

export function checkAnswer(input: string, eq: Equation): boolean {
  const trimmed = input.trim()
  // Support fraction display answers
  if (eq.displayAnswer) {
    if (trimmed === eq.displayAnswer) return true
  }
  const parsed = parseFloat(trimmed)
  if (isNaN(parsed)) return false
  // Allow small floating point tolerance
  return Math.abs(parsed - eq.correctAnswer) < 0.001
}

export function getOperatorEmoji(op: OperationType): string {
  const map: Record<OperationType, string> = {
    addition: '➕',
    subtraction: '➖',
    multiplication: '✖️',
    division: '➗',
    negatives: '±',
  }
  return map[op]
}

export function getBlockColors(op: OperationType): string[] {
  const palettes: Record<OperationType, string[]> = {
    addition: ['#6c5ce7', '#a29bfe', '#fd79a8', '#00b894', '#fdcb6e', '#e17055'],
    subtraction: ['#e17055', '#fd79a8', '#a29bfe', '#6c5ce7'],
    multiplication: ['#6c5ce7', '#fd79a8'],
    division: ['#00b894', '#55efc4'],
    negatives: ['#636e72', '#b2bec3', '#6c5ce7'],
  }
  return palettes[op] || palettes.addition
}
