import type { Equation } from './types'

export interface Hint {
  text: string
  emoji: string
}

function nearestTen(n: number): number {
  return Math.round(n / 10) * 10
}

function breakIntoTensAndOnes(n: number): string {
  const tens = Math.floor(Math.abs(n) / 10) * 10
  const ones = Math.abs(n) % 10
  if (tens === 0) return `${n}`
  if (ones === 0) return `${tens}`
  return `${tens} + ${ones}`
}

/** Return a list of up to 3 progressive hints for this equation */
export function getHints(eq: Equation): Hint[] {
  const hints: Hint[] = []
  const { numbers, operation, correctAnswer } = eq

  // ── ADDITION ────────────────────────────────────────────────────────────────
  if (operation === 'addition') {
    // Hint 1: Break into tens and ones
    const parts = numbers.map(n => breakIntoTensAndOnes(n))
    if (parts.some(p => p.includes('+'))) {
      hints.push({
        emoji: '🔟',
        text: `Break it up! ${parts.join(' and ')} — add the tens first, then the ones!`,
      })
    }

    // Hint 2: Nearest "Hero with Zero" (round number strategy)
    const firstNum = numbers[0]
    const hero = nearestTen(firstNum)
    if (hero !== firstNum && hero > 0) {
      const diff = firstNum - hero
      const restSum = numbers.slice(1).reduce((a, b) => a + b, 0)
      hints.push({
        emoji: '🦸',
        text: `Make ${firstNum} a "Hero with Zero"! Round to ${hero}, then add ${restSum}${diff !== 0 ? `, and ${diff > 0 ? 'add' : 'take away'} ${Math.abs(diff)}` : ''}.`,
      })
    }

    // Hint 3: The answer is close to…
    const rounded = nearestTen(correctAnswer)
    hints.push({
      emoji: '🎯',
      text: `The answer is close to ${rounded}. Count from there!`,
    })
  }

  // ── SUBTRACTION ─────────────────────────────────────────────────────────────
  if (operation === 'subtraction') {
    const [a, b] = numbers

    // Hint 1: Count up strategy
    hints.push({
      emoji: '📈',
      text: `Try counting UP from ${b} to ${a}. How many steps did you need?`,
    })

    // Hint 2: Tens strategy
    const heroA = nearestTen(a)
    if (heroA !== a) {
      hints.push({
        emoji: '🔟',
        text: `Round ${a} to ${heroA} first, subtract ${b}, then fix the difference of ${Math.abs(a - heroA)}.`,
      })
    } else {
      hints.push({
        emoji: '🦸',
        text: `${a} is already a "Hero with Zero"! Just take away ${b}.`,
      })
    }

    // Hint 3: Range
    hints.push({
      emoji: '🎯',
      text: `The answer is between ${Math.max(0, correctAnswer - 3)} and ${correctAnswer + 3}.`,
    })
  }

  // ── MULTIPLICATION ──────────────────────────────────────────────────────────
  if (operation === 'multiplication') {
    const [a, b] = numbers

    // Hint 1: Repeated addition
    hints.push({
      emoji: '🔁',
      text: `Multiplication is repeated addition! Try adding ${a} exactly ${b} times.`,
    })

    // Hint 2: Half and double trick
    if (a % 2 === 0) {
      hints.push({
        emoji: '✂️',
        text: `Halve and double trick! Half of ${a} is ${a / 2}. So ${a / 2} × ${b} = ${(a / 2) * b}, then double it!`,
      })
    } else if (b % 2 === 0) {
      hints.push({
        emoji: '✂️',
        text: `Halve and double! Half of ${b} is ${b / 2}. So ${a} × ${b / 2} = ${a * (b / 2)}, then double it!`,
      })
    } else {
      hints.push({
        emoji: '🧩',
        text: `Break it up! ${a} × ${b} = (${a} × ${Math.floor(b / 2)}) + (${a} × ${b - Math.floor(b / 2)})`,
      })
    }

    // Hint 3: Times table anchor
    const anchor = Math.floor(b / 5) * 5
    if (anchor > 0 && anchor !== b) {
      hints.push({
        emoji: '⚓',
        text: `You probably know ${a} × ${anchor} = ${a * anchor}. Now just add ${a} × ${b - anchor} = ${a * (b - anchor)} more!`,
      })
    } else {
      hints.push({ emoji: '🎯', text: `The answer is between ${correctAnswer - a} and ${correctAnswer + a}.` })
    }
  }

  // ── DIVISION ────────────────────────────────────────────────────────────────
  if (operation === 'division') {
    const [dividend, divisor] = numbers

    // Hint 1: Think of it as multiplication
    hints.push({
      emoji: '🔄',
      text: `Flip it! What number times ${divisor} equals ${dividend}? Think of your ${divisor} times table!`,
    })

    // Hint 2: Grouping
    hints.push({
      emoji: '📦',
      text: `Imagine splitting ${dividend} into groups of ${divisor}. How many groups can you make?`,
    })

    // Hint 3: Range
    hints.push({
      emoji: '🎯',
      text: `The answer is between ${Math.max(1, correctAnswer - 2)} and ${correctAnswer + 2}.`,
    })
  }

  // ── NEGATIVES ───────────────────────────────────────────────────────────────
  if (operation === 'negatives') {
    const [a, b] = numbers

    // Hint 1: Number line
    hints.push({
      emoji: '📏',
      text: `Use a number line! Start at ${a}, then move ${b > 0 ? 'right' : 'left'} ${Math.abs(b)} steps.`,
    })

    // Hint 2: Direction trick
    if (a < 0 && b > 0) {
      hints.push({
        emoji: '🧲',
        text: `When you add a positive to a negative: how much bigger is ${Math.abs(a)} or ${b}? The bigger one "wins"!`,
      })
    } else if (a > 0 && b < 0) {
      hints.push({
        emoji: '🧲',
        text: `Subtracting ${Math.abs(b)} from ${a} — are you going below zero? ${a} − ${Math.abs(b)} = ?`,
      })
    }

    // Hint 3: Range
    hints.push({
      emoji: '🎯',
      text: `The answer is ${correctAnswer < 0 ? 'negative' : 'positive'}, close to ${nearestTen(correctAnswer) || correctAnswer}.`,
    })
  }

  // Always have at least one hint
  if (hints.length === 0) {
    hints.push({
      emoji: '🎯',
      text: `The answer is between ${Math.round(correctAnswer * 0.7)} and ${Math.round(correctAnswer * 1.3) + 1}.`,
    })
  }

  return hints
}
