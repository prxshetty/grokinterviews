import { useCallback } from 'react'
import confetti, { Shape } from 'canvas-confetti'

interface ConfettiOptions {
  particleCount?: number
  spread?: number
  origin?: { x: number; y: number }
  colors?: string[]
  startVelocity?: number
  decay?: number
  gravity?: number
  drift?: number
  ticks?: number
  shapes?: Shape[]
  scalar?: number
}

export function useConfetti() {
  const fireConfetti = useCallback((options: ConfettiOptions = {}) => {
    const defaults: ConfettiOptions = {
      particleCount: 100,
      spread: 70,
      origin: { x: 0.5, y: 0.6 },
      colors: ['#ff6b35', '#f7931e', '#ffd23f', '#ee4035', '#7bc043'],
      startVelocity: 30,
      decay: 0.9,
      gravity: 1,
      drift: 0,
      ticks: 200,
      shapes: ['square' as Shape, 'circle' as Shape],
      scalar: 1
    }

    const finalOptions = { ...defaults, ...options }
    confetti(finalOptions)
  }, [])

  const fireStreakConfetti = useCallback(() => {
    // Fire confetti from multiple positions for streak celebration
    const count = 200
    const defaults = {
      origin: { y: 0.7 },
      colors: ['#ff6b35', '#f7931e', '#ffd23f', '#ee4035'],
      startVelocity: 30,
      decay: 0.9,
      gravity: 1,
      drift: 0,
      ticks: 200,
      shapes: ['square' as Shape, 'circle' as Shape],
      scalar: 1.2
    }

    function fire(particleRatio: number, opts: any) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio)
      })
    }

    // Fire from left
    fire(0.25, {
      spread: 26,
      startVelocity: 55,
      origin: { x: 0.2 }
    })

    // Fire from right
    fire(0.2, {
      spread: 60,
      origin: { x: 0.8 }
    })

    // Fire from center
    fire(0.35, {
      spread: 100,
      decay: 0.91,
      scalar: 0.8,
      origin: { x: 0.5 }
    })

    // Fire smaller burst from center-left
    fire(0.1, {
      spread: 120,
      startVelocity: 25,
      decay: 0.92,
      scalar: 1.2,
      origin: { x: 0.35 }
    })

    // Fire smaller burst from center-right
    fire(0.1, {
      spread: 120,
      startVelocity: 45,
      origin: { x: 0.65 }
    })
  }, [])

  return {
    fireConfetti,
    fireStreakConfetti
  }
}