import { loadStats, saveStats } from '../storage'

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

export function recordReviewAnswer(correct: boolean) {
  const stats = loadStats()
  const total = stats.totalAnswered + 1
  const correctCount = Math.round(stats.accuracy * stats.totalAnswered) + (correct ? 1 : 0)
  const today = new Date().toISOString().slice(0, 10)

  stats.totalAnswered = total
  stats.accuracy = correctCount / total
  stats.streak = updateSharedStreak(today, stats.lastStudyDate, stats.streak)
  stats.lastStudyDate = today

  saveStats(stats)
}

export function recordMemoryAnswer(correct: boolean) {
  const stats = loadStats()
  const answered = stats.memoryAnswered || 0
  const accuracy = stats.memoryAccuracy || 0
  const correctCount = Math.round(accuracy * answered) + (correct ? 1 : 0)
  const nextAnswered = answered + 1
  const today = new Date().toISOString().slice(0, 10)

  stats.memoryAnswered = nextAnswered
  stats.memoryAccuracy = correctCount / nextAnswered
  stats.streak = updateSharedStreak(today, stats.lastStudyDate, stats.streak)
  stats.lastStudyDate = today

  saveStats(stats)
}
