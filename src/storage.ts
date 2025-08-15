import type { ProgressMap, Stats, ExamAttempt, CardProgress } from './types'

const KEYS = {
  progress: 'citizenTest_progress',
  stats: 'citizenTest_stats',
  exam: 'citizenTest_exam', // array of attempts
} as const

export function loadProgress(): ProgressMap {
  try { 
    return JSON.parse(localStorage.getItem(KEYS.progress) || '{}') 
  } catch { 
    return {} 
  }
}

export function saveProgress(map: ProgressMap) {
  localStorage.setItem(KEYS.progress, JSON.stringify(map))
}

export function loadStats(): Stats {
  try {
    return JSON.parse(localStorage.getItem(KEYS.stats) || '{}') 
  } catch { 
    return { streak: 0, accuracy: 0, totalAnswered: 0 } 
  }
}

export function saveStats(s: Stats) {
  localStorage.setItem(KEYS.stats, JSON.stringify(s))
}

export function loadExamAttempts(): ExamAttempt[] {
  try { 
    return JSON.parse(localStorage.getItem(KEYS.exam) || '[]') 
  } catch { 
    return [] 
  }
}

export function saveExamAttempts(a: ExamAttempt[]) {
  localStorage.setItem(KEYS.exam, JSON.stringify(a))
}

export function upsertCard(map: ProgressMap, id: number, updater: (p: CardProgress) => CardProgress): ProgressMap {
  const today = new Date()
  const existing = map[id] || { id, interval: 0, ease: 2.5, dueDate: today.toISOString() }
  const next = updater(existing)
  return { ...map, [id]: next }
}

export function resetAll() {
  localStorage.removeItem(KEYS.progress)
  localStorage.removeItem(KEYS.stats)
  localStorage.removeItem(KEYS.exam)
}
