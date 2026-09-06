import { test } from 'node:test'
import assert from 'node:assert/strict'

import { localISODate } from '../src/lib/study-calendar.ts'
import {
  createDefaultProgress,
  dueDateISO,
  isDueToday,
  isMature,
  pickStudyBatch,
  studyCounts,
} from '../src/lib/study-session.ts'
import { updateCard } from '../src/sm2.ts'
import type { ProgressMap } from '../src/types.ts'

test('a card graded Good in the evening comes due the next local day', () => {
  // SM-2 adds the interval in local time, so reading the due date back in UTC
  // pushed the card a day late for anyone west of Greenwich.
  const gradedAt = new Date(2026, 2, 1, 20, 0)
  const next = updateCard(createDefaultProgress('question:1', gradedAt), 'good', gradedAt)

  assert.equal(next.interval, 1)
  assert.equal(dueDateISO(next), localISODate(new Date(2026, 2, 2, 20, 0)))
  assert.equal(isDueToday(next, localISODate(gradedAt)), false)
  assert.equal(isDueToday(next, localISODate(new Date(2026, 2, 2, 8, 0))), true)
})

test('Again puts the card back into today', () => {
  const gradedAt = new Date(2026, 2, 1, 20, 0)
  const next = updateCard(createDefaultProgress('question:1', gradedAt), 'again', gradedAt)

  assert.equal(next.interval, 0)
  assert.equal(isDueToday(next, localISODate(gradedAt)), true)
})

test('a bare YYYY-MM-DD due date from an older build is read as written', () => {
  assert.equal(dueDateISO({ id: 'question:1', interval: 1, ease: 2.5, dueDate: '2026-03-02' }), '2026-03-02')
})

test('an unreadable due date comes back on the day being asked about', () => {
  const corrupt = { id: 'question:1', interval: 1, ease: 2.5, dueDate: 'garbage' }

  // The fallback follows the caller's day, not the wall clock, so the answer
  // does not depend on when the suite happens to run.
  assert.equal(dueDateISO(corrupt, '2026-03-02'), '2026-03-02')
  assert.equal(isDueToday(corrupt, '2026-03-02'), true)
  assert.equal(isDueToday(corrupt, '1999-01-01'), true)
  assert.equal(dueDateISO(corrupt), localISODate(new Date()))
})

test('a batch takes due cards oldest first, then tops up with unseen ones', () => {
  const progress: ProgressMap = {
    'question:1': { id: 'question:1', interval: 1, ease: 2.5, dueDate: '2020-01-02T00:00:00.000Z' },
    'question:2': { id: 'question:2', interval: 1, ease: 2.5, dueDate: '2020-01-01T00:00:00.000Z' },
    'question:3': { id: 'question:3', interval: 30, ease: 2.5, dueDate: '2999-01-01T00:00:00.000Z' },
  }
  const items = [1, 2, 3, 4].map((id) => ({ studyId: `question:${id}` }))

  const batch = pickStudyBatch(items, progress, 3, keepOrder).map((entry) => entry.item.studyId)
  assert.deepEqual(batch, ['question:2', 'question:1', 'question:4'])
})

/** Pins the presentation order so a test can assert on it. */
const keepOrder = { shuffle: <U,>(items: U[]) => items }

const MS_PER_DAY = 24 * 60 * 60 * 1000

/**
 * `count` long-overdue cards, oldest id first. The due dates are stepped off a
 * real instant rather than interpolated into a date string: past day 31 a
 * literal like `2020-01-40` is unparseable, and `pickStudyBatch` sorts on
 * `new Date(dueDate).getTime()`, so a NaN there would leave the order for the
 * engine to decide and the oldest-first assertion below passing by luck.
 */
function backlog(count: number): ProgressMap {
  const map: ProgressMap = {}
  for (let i = 1; i <= count; i++) {
    const id = `question:${i}`
    map[id] = {
      id,
      interval: 1,
      ease: 2.5,
      dueDate: new Date(Date.UTC(2020, 0, 1) + (i - 1) * MS_PER_DAY).toISOString(),
    }
  }
  return map
}

const deck = (size: number) => Array.from({ length: size }, (_, i) => ({ studyId: `question:${i + 1}` }))

test('a review backlog cannot crowd new questions out of the batch', () => {
  // The bug this guards: filling with due cards first meant a learner with more
  // than a batch of lapses saw the same cards session after session and never
  // met a new question.
  const batch = pickStudyBatch(deck(140), backlog(40), 20, { ...keepOrder, newCardFloor: 5 })
  const ids = batch.map((entry) => entry.item.studyId)
  const fresh = ids.filter((id) => Number(id.split(':')[1]) > 40)

  assert.equal(ids.length, 20)
  assert.equal(fresh.length, 5)
})

test('the floor claims only as many slots as there are unseen cards', () => {
  // A deck worked through end to end still serves a full batch of reviews.
  const batch = pickStudyBatch(deck(40), backlog(40), 20, { ...keepOrder, newCardFloor: 5 })
  assert.equal(batch.length, 20)
  assert.ok(batch.every((entry) => Number(entry.item.studyId.split(':')[1]) <= 40))
})

test('the floor never shrinks a batch a short due list would have filled', () => {
  const batch = pickStudyBatch(deck(140), backlog(3), 20, { ...keepOrder, newCardFloor: 5 })
  const fresh = batch.filter((entry) => Number(entry.item.studyId.split(':')[1]) > 3)

  assert.equal(batch.length, 20)
  assert.equal(fresh.length, 17)
})

test('due cards are still selected oldest first within the slots left to them', () => {
  const batch = pickStudyBatch(deck(140), backlog(40), 20, { ...keepOrder, newCardFloor: 5 })
  const dueIds = batch.slice(0, 15).map((entry) => entry.item.studyId)

  assert.deepEqual(dueIds, Array.from({ length: 15 }, (_, i) => `question:${i + 1}`))
})

test('shuffling changes the order a batch is asked in, not which cards it holds', () => {
  const reverse = { shuffle: <U,>(items: U[]) => [...items].reverse(), newCardFloor: 5 }
  const ordered = pickStudyBatch(deck(140), backlog(40), 20, { ...keepOrder, newCardFloor: 5 })
  const shuffled = pickStudyBatch(deck(140), backlog(40), 20, reverse)

  const ids = (b: typeof ordered) => b.map((entry) => entry.item.studyId)
  assert.notDeepEqual(ids(shuffled), ids(ordered))
  assert.deepEqual([...ids(shuffled)].sort(), [...ids(ordered)].sort())
})

test('study counts keep due cards and never-started ones apart', () => {
  const progress: ProgressMap = {
    'question:1': { id: 'question:1', interval: 1, ease: 2.5, dueDate: '2020-01-01T00:00:00.000Z' },
    'question:2': { id: 'question:2', interval: 30, ease: 2.5, dueDate: '2999-01-01T00:00:00.000Z' },
  }

  assert.deepEqual(studyCounts(deck(5), progress), { due: 1, unseen: 3, total: 4 })
})

test('a card counts as learned only once it survives a second successful review', () => {
  // Six days is the interval after two Goods; below that the card has either
  // never been answered right twice or has lapsed back to the start.
  assert.equal(isMature({ id: 'question:1', interval: 0, ease: 2.5, dueDate: '2020-01-01' }), false)
  assert.equal(isMature({ id: 'question:1', interval: 1, ease: 2.5, dueDate: '2020-01-01' }), false)
  assert.equal(isMature({ id: 'question:1', interval: 6, ease: 2.5, dueDate: '2020-01-01' }), true)
  assert.equal(isMature({ id: 'question:1', interval: 30, ease: 2.5, dueDate: '2020-01-01' }), true)
})
