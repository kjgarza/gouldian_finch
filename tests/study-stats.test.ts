import { beforeEach, test } from 'node:test'
import assert from 'node:assert/strict'

/** Minimal stand-in for the browser store the app records into. */
class MemoryStorage {
  #entries = new Map<string, string>()

  getItem(key: string): string | null {
    return this.#entries.has(key) ? this.#entries.get(key)! : null
  }

  setItem(key: string, value: string) {
    this.#entries.set(key, String(value))
  }

  removeItem(key: string) {
    this.#entries.delete(key)
  }
}

const store = new MemoryStorage()
Object.defineProperty(globalThis, 'localStorage', { value: store, configurable: true })

const { loadStats, saveStats } = await import('../src/storage.ts')
const {
  currentStreak,
  recordExamCompletion,
  recordMemoryAnswer,
  recordReviewAnswer,
} = await import('../src/lib/study-stats.ts')
const { todayISO, addDays } = await import('../src/lib/study-calendar.ts')

const today = todayISO()
const yesterday = addDays(today, -1)

beforeEach(() => {
  store.removeItem('citizenTest_stats')
})

test('a review answer lands in the counters, the streak and the day log', () => {
  recordReviewAnswer(true)
  recordReviewAnswer(false)

  const stats = loadStats()
  assert.equal(stats.totalAnswered, 2)
  assert.equal(stats.correctAnswered, 1)
  assert.equal(stats.accuracy, 0.5)
  assert.equal(stats.streak, 1)
  assert.equal(stats.lastStudyDate, today)
  assert.deepEqual(stats.studiedDates, [today])
})

test('finishing an exam records the session, not just the attempt', () => {
  recordExamCompletion(20, 33)

  const stats = loadStats()
  assert.equal(stats.totalAnswered, 33)
  assert.equal(stats.correctAnswered, 20)
  assert.equal(stats.examAnswered, 33)
  assert.equal(stats.streak, 1)
  assert.deepEqual(stats.studiedDates, [today])
})

test('exam answers join the same accuracy as review answers', () => {
  recordReviewAnswer(true)
  recordExamCompletion(0, 3)

  const stats = loadStats()
  assert.equal(stats.totalAnswered, 4)
  assert.equal(stats.correctAnswered, 1)
  assert.equal(stats.accuracy, 0.25)
})

test('a memory answer keeps its own counters but shares the streak', () => {
  recordMemoryAnswer(true)

  const stats = loadStats()
  assert.equal(stats.memoryAnswered, 1)
  assert.equal(stats.memoryCorrect, 1)
  assert.equal(stats.memoryAccuracy, 1)
  assert.equal(stats.totalAnswered, 0, 'term cards are not exam questions')
  assert.equal(stats.lastStudyDate, today)
})

test('studying again after a day off extends the streak', () => {
  saveStats({ ...loadStats(), streak: 4, lastStudyDate: yesterday, studiedDates: [yesterday] })
  recordReviewAnswer(true)

  assert.equal(loadStats().streak, 5)
})

test('a gap resets the streak to the current day', () => {
  const lastWeek = addDays(today, -7)
  saveStats({ ...loadStats(), streak: 9, lastStudyDate: lastWeek, studiedDates: [lastWeek] })
  recordReviewAnswer(true)

  assert.equal(loadStats().streak, 1)
})

test('a second session on the same day does not extend the streak', () => {
  recordReviewAnswer(true)
  recordMemoryAnswer(false)

  const stats = loadStats()
  assert.equal(stats.streak, 1)
  assert.deepEqual(stats.studiedDates, [today])
})

test('a stored streak lapses once the last session is older than yesterday', () => {
  const stats = { ...loadStats(), streak: 12 }

  assert.equal(currentStreak({ ...stats, lastStudyDate: today }, today), 12)
  assert.equal(currentStreak({ ...stats, lastStudyDate: yesterday }, today), 12)
  assert.equal(currentStreak({ ...stats, lastStudyDate: addDays(today, -2) }, today), 0)
  assert.equal(currentStreak({ ...stats, lastStudyDate: undefined }, today), 0)
})

test('accuracy recorded by an older build survives the move to counters', () => {
  store.setItem('citizenTest_stats', JSON.stringify({
    streak: 3,
    accuracy: 0.8,
    totalAnswered: 50,
    lastStudyDate: yesterday,
    memoryAnswered: 10,
    memoryAccuracy: 0.5,
  }))

  const migrated = loadStats()
  assert.equal(migrated.correctAnswered, 40)
  assert.equal(migrated.accuracy, 0.8)
  assert.equal(migrated.memoryCorrect, 5)
  assert.deepEqual(migrated.studiedDates, [yesterday], 'the one recoverable study day')

  recordReviewAnswer(true)
  const after = loadStats()
  assert.equal(after.totalAnswered, 51)
  assert.equal(after.correctAnswered, 41)
})

test('corrupt stats fall back to an empty record instead of NaN', () => {
  store.setItem('citizenTest_stats', '{"totalAnswered":"lots","accuracy":null,"streak":-3}')

  const stats = loadStats()
  assert.equal(stats.totalAnswered, 0)
  assert.equal(stats.correctAnswered, 0)
  assert.equal(stats.accuracy, 0)
  assert.equal(stats.streak, 0)
})
