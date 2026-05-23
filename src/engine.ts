import type { Equation, OperationType, Difficulty, Settings } from './types'

// ── Difficulty definitions ────────────────────────────────────────────────────
//
// easy   — addition/subtraction only, numbers 1–10, no carrying needed
// medium — addition/subtraction with larger numbers (up to 50), simple ×÷ (2–5 tables)
// hard   — all operations, numbers up to 100, ×÷ up to 10 tables
// expert — all operations including negatives, full number range, ×÷ up to 12 tables
//
// Rules:
//  • multiplication/division → never easy (medium minimum)
//  • negatives               → never easy or medium (hard minimum)

export function adaptDifficulty(
  current: Difficulty,
  consecutiveWrong: number,
  streak: number
): Difficulty {
  if (consecutiveWrong >= 3) return 'easy'
  if (streak >= 7) return 'expert'
  if (streak >= 5) return 'hard'
  if (streak >= 3) return 'medium'
  return current
}

/** Pick a difficulty constrained to the allowed set, weighted towards adapted. */
export function pickDifficulty(
  adapted: Difficulty,
  allowed: Difficulty[] = ['easy', 'medium', 'hard', 'expert']
): Difficulty {
  // If only one allowed, always return it
  if (allowed.length === 1) return allowed[0]

  const has = (d: Difficulty) => allowed.includes(d)
  const roll = Math.random()

  // Bias weights towards adapted difficulty
  const weights: Record<Difficulty, number[]> = {
    //               easy  medium  hard  expert
    easy:           [0.70,  0.20,  0.08,  0.02],
    medium:         [0.20,  0.45,  0.25,  0.10],
    hard:           [0.05,  0.20,  0.45,  0.30],
    expert:         [0.02,  0.08,  0.25,  0.65],
  }

  const order: Difficulty[] = ['easy', 'medium', 'hard', 'expert']
  const w = weights[adapted]
  let cumulative = 0
  for (let i = 0; i < order.length; i++) {
    if (!has(order[i])) continue
    cumulative += w[i]
    if (roll < cumulative) return order[i]
  }
  // Fallback: return random from allowed
  return allowed[Math.floor(Math.random() * allowed.length)]
}

// ── Enforce operation constraints per difficulty ───────────────────────────────
// Returns the effective difficulty for a given operation
// (bumps up if the operation can't be easy/medium)
function effectiveDifficulty(op: OperationType, difficulty: Difficulty): Difficulty {
  if (op === 'multiplication' || op === 'division') {
    if (difficulty === 'easy') return 'medium'
  }
  if (op === 'negatives') {
    if (difficulty === 'easy' || difficulty === 'medium') return 'hard'
  }
  return difficulty
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function maxForDifficulty(difficulty: Difficulty, maxNumber: number): number {
  if (difficulty === 'easy')   return Math.min(10, maxNumber)
  if (difficulty === 'medium') return Math.min(50, maxNumber)
  if (difficulty === 'hard')   return Math.min(100, maxNumber)
  return maxNumber  // expert: full range
}

function minForDifficulty(difficulty: Difficulty): number {
  if (difficulty === 'easy')   return 1
  if (difficulty === 'medium') return 5
  if (difficulty === 'hard')   return 10
  return 20  // expert
}

function generateNumbers(
  operation: OperationType,
  difficulty: Difficulty,
  settings: Settings
): { numbers: number[]; answer: number; displayAnswer?: string } {
  // Apply operation-specific difficulty floor
  const eff = effectiveDifficulty(operation, difficulty)
  const max = maxForDifficulty(eff, settings.maxNumber)
  const min = Math.min(minForDifficulty(eff), Math.max(1, Math.floor(max / 3)))
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
    // medium: 2–5 tables, hard: 2–10, expert: 2–12
    const mulMax = eff === 'medium' ? 5 : eff === 'hard' ? 10 : 12
    const mulMin = 2
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
    const divisorMax = eff === 'medium' ? 5 : eff === 'hard' ? 10 : 12
    const divisor = randInt(2, divisorMax)
    const answer = randInt(Math.max(1, min), Math.floor(max / divisor))
    const dividend = answer * divisor
    return { numbers: [dividend, divisor], answer }
  }

  if (operation === 'negatives') {
    // hard: one negative up to 20, expert: larger negatives, mix of both
    const negMax = eff === 'expert' ? max : Math.min(20, max)
    const a = randInt(min, negMax)
    const b = randInt(min, negMax)
    const bothNeg = eff === 'expert' && Math.random() < 0.3
    const nums = bothNeg ? [-a, -b] : (Math.random() < 0.5 ? [-a, b] : [a, -b])
    return { numbers: nums, answer: nums[0] + nums[1] }
  }

  // fallback
  const nums = Array.from({ length: count }, () => randInt(min, max))
  return { numbers: nums, answer: nums.reduce((a, b) => a + b, 0) }
}

export function generateEquation(settings: Settings, difficulty: Difficulty): Equation {
  const { selectedTypes } = settings
  const types = selectedTypes.length > 0 ? selectedTypes : ['addition' as OperationType]
  const operation = types[Math.floor(Math.random() * types.length)]
  const { numbers, answer, displayAnswer } = generateNumbers(operation, difficulty, settings)
  return { numbers, operation, correctAnswer: answer, difficulty, displayAnswer }
}

export function formatEquation(eq: Equation): string {
  const opSymbol: Record<OperationType, string> = {
    addition: '+', subtraction: '−', multiplication: '×', division: '÷', negatives: '+',
  }
  return eq.numbers.join(` ${opSymbol[eq.operation]} `) + ' = ?'
}

export function checkAnswer(input: string, eq: Equation): boolean {
  const trimmed = input.trim()
  if (eq.displayAnswer && trimmed === eq.displayAnswer) return true
  const parsed = parseFloat(trimmed)
  if (isNaN(parsed)) return false
  return Math.abs(parsed - eq.correctAnswer) < 0.001
}

export function getOperatorEmoji(op: OperationType): string {
  const map: Record<OperationType, string> = {
    addition: '➕', subtraction: '➖', multiplication: '✖️', division: '➗', negatives: '±',
  }
  return map[op]
}

export function getBlockColors(op: OperationType): string[] {
  const palettes: Record<OperationType, string[]> = {
    addition:       ['#6c5ce7', '#a29bfe', '#fd79a8', '#00b894', '#fdcb6e', '#e17055'],
    subtraction:    ['#e17055', '#fd79a8', '#a29bfe', '#6c5ce7'],
    multiplication: ['#6c5ce7', '#fd79a8'],
    division:       ['#00b894', '#55efc4'],
    negatives:      ['#636e72', '#b2bec3', '#6c5ce7'],
  }
  return palettes[op] || palettes.addition
}
