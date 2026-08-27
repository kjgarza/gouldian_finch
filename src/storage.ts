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
    return {
      streak: parsed.streak || 0,
      accuracy: parsed.accuracy || 0,
      totalAnswered: parsed.totalAnswered || 0,
      lastStudyDate: parsed.lastStudyDate,
      studiedDates: migrateStudiedDates(parsed),
      memoryAnswered: parsed.memoryAnswered || 0,
      memoryAccuracy: parsed.memoryAccuracy || 0,
    }
  } catch { 
    return { streak: 0, accuracy: 0, totalAnswered: 0, studiedDates: [], memoryAnswered: 0, memoryAccuracy: 0 } 
  }
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
