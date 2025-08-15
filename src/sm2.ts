import type { CardProgress } from './types'

/**
 * Minimal SM-2 update using two grades: Again (q=2), Good (q=4)
 */
export function updateCard(prev: CardProgress, grade: 'again' | 'good', today = new Date()): CardProgress {
  const q = grade === 'again' ? 2 : 4
  let ef = prev.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  ef = Math.max(1.3, Math.min(2.8, ef))

  let interval: number
  if (grade === 'again') {
    interval = 0 // reset to today
  } else {
    if (prev.interval === 0) {
      interval = 1
    } else if (prev.interval === 1) {
      interval = 6
    } else {
      interval = Math.round(prev.interval * ef)
    }
  }

  const due = new Date(today)
  due.setDate(due.getDate() + interval)

  return { 
    id: prev.id, 
    ease: ef, 
    interval, 
    dueDate: due.toISOString() 
  }
}
