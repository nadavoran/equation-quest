import { motion, AnimatePresence } from 'framer-motion'
import type { Equation } from '../types'

// ── Numberblocks-inspired colors per number 1–10 ─────────────────────────────
const NUMBER_COLORS: Record<number, string> = {
  1: '#e17055', 2: '#f9ca24', 3: '#f0932b', 4: '#6c5ce7',
  5: '#fdcb6e', 6: '#e056fd', 7: '#7bed9f', 8: '#70a1ff',
  9: '#ff6b81', 10: '#eccc68',
}
const FALLBACK_COLORS = ['#6c5ce7','#fd79a8','#00b894','#fdcb6e','#e17055','#74b9ff','#a29bfe','#55efc4']

function getColor(n: number, idx: number): string {
  const abs = Math.abs(n)
  if (abs >= 1 && abs <= 10) return NUMBER_COLORS[abs]
  return FALLBACK_COLORS[idx % FALLBACK_COLORS.length]
}

// ── A single square block (no number inside — clean Numberblocks style) ───────
function Block({ size = 22, color, style }: {
  size?: number; color: string; style?: React.CSSProperties
}) {
  return (
    <div style={{
      width: size, height: size,
      backgroundColor: color,
      borderRadius: 4,
      border: '1.5px solid rgba(0,0,0,0.12)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.18), inset 0 1px 0 rgba(255,255,255,0.35)',
      flexShrink: 0,
      ...style,
    }} />
  )
}

// ── A stacked tower of N blocks (Numberblocks style, column) ─────────────────
function Tower({ count, color, blockSize, delayOffset = 0 }: {
  count: number; color: string; blockSize: number; delayOffset?: number
}) {
  const cap = Math.min(Math.abs(count), 20)
  const STACK = 5
  const cols = Math.ceil(cap / STACK)
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
      {Array.from({ length: cols }).map((_, c) => {
        const colCap = c < cols - 1 ? STACK : cap - c * STACK
        return (
          <div key={c} style={{ display: 'flex', flexDirection: 'column-reverse', gap: 2 }}>
            {Array.from({ length: colCap }).map((_, r) => {
              const idx = c * STACK + r
              return (
                <motion.div
                  key={idx}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: delayOffset + idx * 0.025, type: 'spring', stiffness: 400, damping: 22 }}
                >
                  <Block size={blockSize} color={color} />
                </motion.div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

// ── ADDITION: towers slide together → merged result tower ────────────────────
function AdditionAnim({ eq, bs }: { eq: Equation; bs: number }) {
  const resultColor = getColor(eq.correctAnswer, 0)
  const total = Math.min(eq.correctAnswer, 20)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      {/* Pre-merge: show individual towers sliding in */}
      <motion.div
        style={{ display: 'flex', gap: 12, alignItems: 'flex-end', justifyContent: 'center' }}
        initial={{ opacity: 1 }}
        animate={{ opacity: 0, scale: 0.85 }}
        transition={{ delay: 0.8, duration: 0.35 }}
      >
        {eq.numbers.map((n, i) => (
          <motion.div
            key={i}
            initial={{ x: i === 0 ? -20 : 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: i * 0.15, type: 'spring', stiffness: 300 }}
          >
            <Tower count={n} color={getColor(n, i)} blockSize={bs} />
          </motion.div>
        ))}
      </motion.div>
      {/* Merged result */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.1, type: 'spring', stiffness: 280 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
      >
        <Tower count={total} color={resultColor} blockSize={bs} />
        <span style={{ fontWeight: 900, fontSize: 18, color: resultColor }}>= {eq.correctAnswer}</span>
      </motion.div>
    </div>
  )
}

// ── SUBTRACTION: blocks from right-side "fly off" revealing result ────────────
function SubtractionAnim({ eq, bs }: { eq: Equation; bs: number }) {
  const [a, b] = eq.numbers
  const keepCount = Math.min(eq.correctAnswer, 16)
  const removeCount = Math.min(b, 16)
  const keepColor = getColor(a, 0)
  const removeColor = '#e17055'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end' }}>
        {/* Kept blocks (result) */}
        <Tower count={keepCount} color={keepColor} blockSize={bs} />
        {/* Removed blocks — fly right and fade */}
        <div style={{ display: 'flex', flexDirection: 'column-reverse', gap: 2 }}>
          {Array.from({ length: removeCount }).map((_, i) => (
            <motion.div
              key={i}
              initial={{ x: 0, opacity: 1 }}
              animate={{ x: 40, opacity: 0, scale: 0.5 }}
              transition={{ delay: 0.2 + i * 0.06, duration: 0.35, ease: 'easeIn' }}
            >
              <Block size={bs} color={removeColor} />
            </motion.div>
          ))}
        </div>
      </div>
      <motion.span
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 + removeCount * 0.06 + 0.3 }}
        style={{ fontWeight: 900, fontSize: 18, color: keepColor }}
      >
        = {eq.correctAnswer}
      </motion.span>
    </div>
  )
}

// ── MULTIPLICATION: show [multiplier] groups of [multiplicand] blocks, then merge ──
function MultiplicationAnim({ eq, bs }: { eq: Equation; bs: number }) {
  const [a, b] = eq.numbers
  // a groups of b blocks each
  const groupCount = Math.min(a, 8)
  const perGroup   = Math.min(b, 8)
  const colors = FALLBACK_COLORS
  const resultColor = getColor(eq.correctAnswer, 0)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      {/* Groups */}
      <motion.div
        style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}
        animate={{ opacity: 0, scale: 0.8 }}
        transition={{ delay: 1.0 + groupCount * 0.12, duration: 0.4 }}
      >
        {Array.from({ length: groupCount }).map((_, g) => (
          <motion.div
            key={g}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: g * 0.12, type: 'spring', stiffness: 350 }}
            style={{
              display: 'flex', flexDirection: 'column-reverse', gap: 2,
              padding: 4, borderRadius: 8,
              border: `2px solid ${colors[g % colors.length]}33`,
              background: `${colors[g % colors.length]}11`,
            }}
          >
            {Array.from({ length: perGroup }).map((_, r) => (
              <Block key={r} size={bs - 2} color={colors[g % colors.length]} />
            ))}
          </motion.div>
        ))}
      </motion.div>

      {/* Merged result */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 1.3 + groupCount * 0.12, type: 'spring', stiffness: 260 }}
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
      >
        <Tower count={Math.min(eq.correctAnswer, 20)} color={resultColor} blockSize={bs} />
        <span style={{ fontWeight: 900, fontSize: 18, color: resultColor }}>
          {groupCount} × {perGroup} = {eq.correctAnswer}
        </span>
      </motion.div>
    </div>
  )
}

// ── DIVISION: dividend splits into [divisor] equal groups ────────────────────
function DivisionAnim({ eq, bs }: { eq: Equation; bs: number }) {
  const [dividend, divisor] = eq.numbers
  const groupCount  = Math.min(divisor, 6)       // number of groups = divisor
  const perGroup    = Math.min(eq.correctAnswer, 10) // blocks per group = result
  const colors = FALLBACK_COLORS

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: '#888', margin: 0 }}>
        {dividend} ÷ {divisor}: splitting into {groupCount} equal groups
      </p>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
        {Array.from({ length: groupCount }).map((_, g) => (
          <motion.div
            key={g}
            initial={{ scale: 0, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ delay: g * 0.15, type: 'spring', stiffness: 320 }}
            style={{
              display: 'flex', flexDirection: 'column-reverse', gap: 2,
              padding: 5, borderRadius: 10,
              border: `2px solid ${colors[g % colors.length]}`,
              background: `${colors[g % colors.length]}18`,
            }}
          >
            {Array.from({ length: perGroup }).map((_, r) => (
              <Block key={r} size={bs - 2} color={colors[g % colors.length]} />
            ))}
            <span style={{ fontSize: 10, fontWeight: 800, color: colors[g % colors.length], textAlign: 'center' }}>
              {eq.correctAnswer}
            </span>
          </motion.div>
        ))}
      </div>
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: groupCount * 0.15 + 0.4 }}
        style={{ fontWeight: 900, fontSize: 18, color: '#6c5ce7' }}
      >
        = {eq.correctAnswer} each
      </motion.span>
    </div>
  )
}

// ── NEGATIVES ────────────────────────────────────────────────────────────────
function NegativesAnim({ eq, bs }: { eq: Equation; bs: number }) {
  const [a, b] = eq.numbers
  const posColor = '#6c5ce7', negColor = '#636e72'
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
        {[a, b].map((n, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.2 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <Tower count={Math.abs(n)} color={n >= 0 ? posColor : negColor} blockSize={bs} />
            <span style={{ fontSize: 12, fontWeight: 800, color: n >= 0 ? posColor : negColor }}>
              {n > 0 ? `+${n}` : n}
            </span>
          </motion.div>
        ))}
      </div>
      <motion.span
        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.6, type: 'spring' }}
        style={{ fontWeight: 900, fontSize: 20, color: eq.correctAnswer >= 0 ? posColor : negColor }}
      >
        = {eq.correctAnswer}
      </motion.span>
    </div>
  )
}

// ── Main export ───────────────────────────────────────────────────────────────
interface Props {
  equation: Equation
  showHint: boolean
  feedbackState: 'idle' | 'correct' | 'wrong' | 'hint'
  blockSize?: number
}

export default function VisualBlocks({ equation, showHint, feedbackState, blockSize = 22 }: Props) {
  const isCorrect = feedbackState === 'correct'
  const op = equation.operation

  if (isCorrect) {
    return (
      <AnimatePresence mode="wait">
        <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', justifyContent: 'center', paddingTop: 4 }}>
          {op === 'addition'       && <AdditionAnim       eq={equation} bs={blockSize} />}
          {op === 'subtraction'    && <SubtractionAnim    eq={equation} bs={blockSize} />}
          {op === 'multiplication' && <MultiplicationAnim eq={equation} bs={blockSize} />}
          {op === 'division'       && <DivisionAnim       eq={equation} bs={blockSize} />}
          {op === 'negatives'      && <NegativesAnim      eq={equation} bs={blockSize} />}
        </motion.div>
      </AnimatePresence>
    )
  }

  // Idle/wrong: show equation towers side by side
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 10, flexWrap: 'wrap', padding: '4px 0', minHeight: 80 }}>
      {equation.numbers.map((num, i) => {
        const color = num < 0 ? '#636e72' : getColor(num, i)
        const opSymbols: Record<string, string> = {
          addition: '+', subtraction: '−', multiplication: '×', division: '÷', negatives: '+'
        }
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
            {i > 0 && (
              <span style={{ fontSize: 22, fontWeight: 900, color: '#bbb', lineHeight: 1, paddingBottom: 4 }}>
                {opSymbols[op] ?? '+'}
              </span>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
              <Tower count={num} color={color} blockSize={blockSize} />
              {showHint && (
                <motion.span
                  initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                  style={{ fontSize: 11, fontWeight: 900, color }}
                >
                  {num}
                </motion.span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
