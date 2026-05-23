import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import confetti from 'canvas-confetti'

interface Props {
  streak: number
  onDone: () => void
}

interface MilestoneConfig {
  emoji: string
  title: string
  subtitle: string
  color: string
  bg: string
  confettiColors: string[]
}

function getMilestone(streak: number): MilestoneConfig | null {
  if (streak === 5)  return {
    emoji: '🔥',
    title: '5 in a row!',
    subtitle: "You're on fire!",
    color: '#e17055',
    bg: 'rgba(225,112,85,0.12)',
    confettiColors: ['#e17055', '#fdcb6e', '#fd79a8'],
  }
  if (streak === 10) return {
    emoji: '⚡',
    title: '10 streak!',
    subtitle: 'Lightning brain! 🧠',
    color: '#6c5ce7',
    bg: 'rgba(108,92,231,0.12)',
    confettiColors: ['#6c5ce7', '#a29bfe', '#fd79a8', '#fdcb6e'],
  }
  if (streak === 20) return {
    emoji: '👑',
    title: '20 in a row!!!',
    subtitle: 'MATH CHAMPION!',
    color: '#f9ca24',
    bg: 'rgba(249,202,36,0.15)',
    confettiColors: ['#f9ca24', '#6c5ce7', '#fd79a8', '#00b894', '#e17055'],
  }
  if (streak > 20 && streak % 10 === 0) return {
    emoji: '🏆',
    title: `${streak} streak!`,
    subtitle: 'Absolutely incredible!',
    color: '#00b894',
    bg: 'rgba(0,184,148,0.12)',
    confettiColors: ['#00b894', '#55efc4', '#6c5ce7', '#fdcb6e'],
  }
  return null
}

export default function StreakCelebration({ streak, onDone }: Props) {
  const milestone = getMilestone(streak)
  // expert streaks get extra celebration

  useEffect(() => {
    if (!milestone) return

    // Big confetti burst for milestones
    const isEpic = streak >= 20
    confetti({
      particleCount: isEpic ? 300 : 180,
      spread: isEpic ? 100 : 80,
      origin: { y: 0.4 },
      colors: milestone.confettiColors,
      scalar: isEpic ? 1.3 : 1,
    })

    // Second burst for epic streaks
    if (isEpic) {
      setTimeout(() => confetti({
        particleCount: 150,
        angle: 60,
        spread: 70,
        origin: { x: 0, y: 0.5 },
        colors: milestone.confettiColors,
      }), 300)
      setTimeout(() => confetti({
        particleCount: 150,
        angle: 120,
        spread: 70,
        origin: { x: 1, y: 0.5 },
        colors: milestone.confettiColors,
      }), 400)
    }

    // Auto-dismiss after 2.5 seconds
    const timer = setTimeout(onDone, 2500)
    return () => clearTimeout(timer)
  }, [streak])

  if (!milestone) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.4, y: -60 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.6, y: -40 }}
        transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        style={{
          position: 'fixed',
          top: '15%',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 100,
          background: milestone.bg,
          border: `2.5px solid ${milestone.color}`,
          borderRadius: 24,
          padding: '20px 32px',
          textAlign: 'center',
          backdropFilter: 'blur(8px)',
          boxShadow: `0 8px 32px ${milestone.color}44`,
          minWidth: 220,
          pointerEvents: 'none',
        }}
      >
        {/* Pulsing emoji */}
        <motion.div
          animate={{ scale: [1, 1.25, 1], rotate: [0, -8, 8, 0] }}
          transition={{ repeat: 2, duration: 0.5 }}
          style={{ fontSize: 52, lineHeight: 1, marginBottom: 8 }}
        >
          {milestone.emoji}
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{ fontSize: 22, fontWeight: 900, color: milestone.color, margin: 0, lineHeight: 1.2 }}
        >
          {milestone.title}
        </motion.p>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{ fontSize: 14, fontWeight: 700, color: milestone.color, opacity: 0.8, marginTop: 4 }}
        >
          {milestone.subtitle}
        </motion.p>

        {/* Progress dots showing how many milestones hit */}
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 12 }}>
          {[5, 10, 20].map(m => (
            <div
              key={m}
              style={{
                width: 8, height: 8, borderRadius: '50%',
                background: streak >= m ? milestone.color : 'rgba(0,0,0,0.15)',
                transition: 'background 0.3s',
              }}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
