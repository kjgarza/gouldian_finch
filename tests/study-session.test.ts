import { test } from 'node:test'
import assert from 'node:assert/strict'

import { localISODate } from '../src/lib/study-calendar.ts'
import { createDefaultProgress, dueDateISO, isDueToday, pickStudyBatch } from '../src/lib/study-session.ts'
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

  const batch = pickStudyBatch(items, progress, 3).map((entry) => entry.item.studyId)
  assert.deepEqual(batch, ['question:2', 'question:1', 'question:4'])
})
