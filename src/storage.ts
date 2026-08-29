import type { ProgressMap, Stats, ExamAttempt, CardProgress, StudyId } from './types'
import { questionStudyId } from './lib/study-ids'
import { createDefaultProgress } from './lib/study-session'
import { isISODate, normalizeStudiedDates } from './lib/study-calendar'

const KEYS = {
  progress: 'citizenTest_progress',
  stats: 'citizenTest_stats',
  exam: 'citizenTest_exam', // array of attempts
} as const

export function loadProgress(): ProgressMap {
  try { 
    const raw = JSON.parse(localStorage.getItem(KEYS.progress) || '{}') as Record<string, CardProgress>
    const migrated = migrateLegacyProgress(raw)
    if (JSON.stringify(raw) !== JSON.stringify(migrated)) {
      saveProgress(migrated)
    }
    return migrated
  } catch { 
    return {} 
  }
}

export function saveProgress(map: ProgressMap) {
  localStorage.setItem(KEYS.progress, JSON.stringify(map))
}

export function loadStats(): Stats {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEYS.stats) || '{}') as Partial<Stats>
    const totalAnswered = counter(parsed.totalAnswered)
    const memoryAnswered = counter(parsed.memoryAnswered)
    const correctAnswered = migrateCorrectCount(parsed.correctAnswered, parsed.accuracy, totalAnswered)
    const memoryCorrect = migrateCorrectCount(parsed.memoryCorrect, parsed.memoryAccuracy, memoryAnswered)

    return {
      streak: counter(parsed.streak),
      accuracy: ratio(correctAnswered, totalAnswered),
      totalAnswered,
      correctAnswered,
      lastStudyDate: parsed.lastStudyDate,
      studiedDates: migrateStudiedDates(parsed),
      memoryAnswered,
      memoryAccuracy: ratio(memoryCorrect, memoryAnswered),
      memoryCorrect,
      examAnswered: counter(parsed.examAnswered),
    }
  } catch { 
    return emptyStats()
  }
}

export function emptyStats(): Stats {
  return {
    streak: 0,
    accuracy: 0,
    totalAnswered: 0,
    correctAnswered: 0,
    studiedDates: [],
    memoryAnswered: 0,
    memoryAccuracy: 0,
    memoryCorrect: 0,
    examAnswered: 0,
  }
}

/** A stored count is only usable if it is a finite, non-negative whole number. */
function counter(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? Math.round(value) : 0
}

export function ratio(correct: number, total: number): number {
  return total > 0 ? correct / total : 0
}

/**
 * Correct answers used to be implied by `accuracy`, so builds before this one
 * left no count on disk. Recovering it from the stored ratio keeps existing
 * accuracy figures intact; from here on the count is the source of truth.
 */
function migrateCorrectCount(stored: unknown, accuracy: unknown, total: number): number {
  const explicit = counter(stored)
  if (explicit > 0) return Math.min(explicit, total)
  const rate = typeof accuracy === 'number' && Number.isFinite(accuracy) ? accuracy : 0
  return Math.min(total, Math.max(0, Math.round(rate * total)))
}

/**
 * Daily history was added after the first release, so existing users have no
 * `studiedDates` yet. The one day we can honestly recover is `lastStudyDate`;
 * everything before that stays unknown instead of being invented.
 */
function migrateStudiedDates(parsed: Partial<Stats>): string[] {
  const dates = normalizeStudiedDates(parsed.studiedDates)
  if (dates.length > 0 || !isISODate(parsed.lastStudyDate)) return dates
  return [parsed.lastStudyDate]
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

export function upsertCard(map: ProgressMap, id: StudyId, updater: (p: CardProgress) => CardProgress): ProgressMap {
  const existing = map[id] || createDefaultProgress(id)
  const next = updater(existing)
  return { ...map, [id]: next }
}

function migrateLegacyProgress(raw: Record<string, CardProgress>): ProgressMap {
  const migrated: ProgressMap = {}

  for (const [key, value] of Object.entries(raw)) {
    const numericId = Number(key)
    const nextId = Number.isFinite(numericId) && key.trim() !== ''
      ? questionStudyId(numericId)
      : String(value?.id || key)

    migrated[nextId] = {
      ...createDefaultProgress(nextId),
      ...value,
      id: nextId,
    }
  }

  return migrated
}

export function resetAll() {
  localStorage.removeItem(KEYS.progress)
  localStorage.removeItem(KEYS.stats)
  localStorage.removeItem(KEYS.exam)
}
