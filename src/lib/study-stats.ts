import { loadStats, saveStats } from '../storage'
import type { Stats } from '../types'
import { addStudiedDate, todayISO } from './study-calendar'

function updateSharedStreak(today: string, lastStudyDate?: string, currentStreak = 0): number {
  if (!lastStudyDate) {
    return 1
  }

  if (lastStudyDate === today) {
    return currentStreak || 1
  }

  const prevDate = new Date(lastStudyDate)
  const todayDate = new Date(today)
  const diff = Math.floor((todayDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
  return diff === 1 ? currentStreak + 1 : 1
}

/** Records that the user studied on `today`: streak, last session and day log. */
function markStudiedToday(stats: Stats, today: string) {
  stats.streak = updateSharedStreak(today, stats.lastStudyDate, stats.streak)
  stats.lastStudyDate = today
  stats.studiedDates = addStudiedDate(stats.studiedDates || [], today)
}

export function recordReviewAnswer(correct: boolean) {
  const stats = loadStats()
  const total = stats.totalAnswered + 1
  const correctCount = Math.round(stats.accuracy * stats.totalAnswered) + (correct ? 1 : 0)
  const today = todayISO()

  stats.totalAnswered = total
  stats.accuracy = correctCount / total
  markStudiedToday(stats, today)

  saveStats(stats)
}

export function recordMemoryAnswer(correct: boolean) {
  const stats = loadStats()
  const answered = stats.memoryAnswered || 0
  const accuracy = stats.memoryAccuracy || 0
  const correctCount = Math.round(accuracy * answered) + (correct ? 1 : 0)
  const nextAnswered = answered + 1
  const today = todayISO()

  stats.memoryAnswered = nextAnswered
  stats.memoryAccuracy = correctCount / nextAnswered
  markStudiedToday(stats, today)

  saveStats(stats)
}
