import { loadStats, ratio, saveStats } from '../storage'
import type { Stats } from '../types'
import { addStudiedDate, daysBetween, isISODate, todayISO } from './study-calendar'

function updateSharedStreak(today: string, lastStudyDate?: string, currentStreak = 0): number {
  if (!isISODate(lastStudyDate)) {
    return 1
  }

  if (lastStudyDate === today) {
    return currentStreak || 1
  }

  return daysBetween(lastStudyDate, today) === 1 ? currentStreak + 1 : 1
}

/**
 * Streak as of `today`, for display. The stored number is only recalculated
 * when an answer comes in, so someone who stopped a week ago still has their
 * old count on disk — reading it back has to let it lapse.
 */
export function currentStreak(stats: Stats, today = todayISO()): number {
  const last = stats.lastStudyDate
  if (!isISODate(last)) return 0

  const gap = daysBetween(last, today)
  // A gap of 1 is yesterday: the streak is still alive, just not extended yet.
  if (gap < 0 || gap > 1) return 0
  return stats.streak || 0
}

/** Records that the user studied on `today`: streak, last session and day log. */
function markStudiedToday(stats: Stats, today: string) {
  stats.streak = updateSharedStreak(today, stats.lastStudyDate, stats.streak)
  stats.lastStudyDate = today
  stats.studiedDates = addStudiedDate(stats.studiedDates || [], today)
}

/**
 * Folds graded questions into the shared question counters. Every mode that
 * shows questions — review, Berlin and the exam — feeds the same pair, so
 * "overall accuracy" covers all the questions actually answered.
 */
function recordQuestionAnswers(answered: number, correct: number, fromExam = false) {
  if (answered <= 0) return

  const stats = loadStats()
  stats.totalAnswered += answered
  stats.correctAnswered = (stats.correctAnswered || 0) + correct
  stats.accuracy = ratio(stats.correctAnswered, stats.totalAnswered)
  if (fromExam) stats.examAnswered = (stats.examAnswered || 0) + answered
  markStudiedToday(stats, todayISO())

  saveStats(stats)
}

export function recordReviewAnswer(correct: boolean) {
  recordQuestionAnswers(1, correct ? 1 : 0)
}

/**
 * Finishing an exam is a study session like any other: it has to light up the
 * calendar and extend the streak, not just append to the attempt history.
 */
export function recordExamCompletion(score: number, total: number) {
  const answered = Math.max(0, Math.round(total))
  const correct = Math.min(answered, Math.max(0, Math.round(score)))
  recordQuestionAnswers(answered, correct, true)
}

export function recordMemoryAnswer(correct: boolean) {
  const stats = loadStats()

  stats.memoryAnswered = (stats.memoryAnswered || 0) + 1
  stats.memoryCorrect = (stats.memoryCorrect || 0) + (correct ? 1 : 0)
  stats.memoryAccuracy = ratio(stats.memoryCorrect, stats.memoryAnswered)
  markStudiedToday(stats, todayISO())

  saveStats(stats)
}
