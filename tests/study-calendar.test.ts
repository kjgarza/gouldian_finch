import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  addStudiedDate,
  buildHeatmap,
  isISODate,
  localISODate,
  longestStreak,
  normalizeStudiedDates,
  todayISO,
} from '../src/lib/study-calendar.ts'

test('todayISO reports the local calendar day, not the UTC one', () => {
  // 00:30 on 2 March in a UTC+2 zone is still 1 March in UTC.
  const localMidnightish = new Date(2026, 2, 2, 0, 30)
  assert.equal(todayISO(localMidnightish), '2026-03-02')
  assert.equal(localISODate(localMidnightish), '2026-03-02')
})

test('local dates are zero padded', () => {
  assert.equal(localISODate(new Date(2026, 0, 5, 13, 0)), '2026-01-05')
})

test('isISODate rejects overflowing dates', () => {
  assert.equal(isISODate('2026-02-30'), false)
  assert.equal(isISODate('2026-02-28'), true)
  assert.equal(isISODate('not a date'), false)
})

test('the day log stays sorted, unique and bounded', () => {
  const dates = addStudiedDate(addStudiedDate(['2026-03-02'], '2026-03-01'), '2026-03-02')
  assert.deepEqual(dates, ['2026-03-01', '2026-03-02'])
  assert.deepEqual(normalizeStudiedDates(['2026-03-05', 'junk', '2026-03-04'], 1), ['2026-03-05'])
})

test('longest streak counts consecutive days only', () => {
  assert.equal(longestStreak(['2026-03-01', '2026-03-02', '2026-03-03', '2026-03-05']), 3)
  assert.equal(longestStreak([]), 0)
})

test('days before the first recorded session are untracked, not missed', () => {
  const heatmap = buildHeatmap(['2026-03-02'], '2026-03-04', 2)
  const days = heatmap.weeks.flatMap((week) => week.days)
  const state = (date: string) => days.find((day) => day.date === date)?.state

  assert.equal(state('2026-03-01'), 'untracked')
  assert.equal(state('2026-03-02'), 'studied')
  assert.equal(state('2026-03-03'), 'missed')
  assert.equal(state('2026-03-05'), 'future')
  assert.equal(heatmap.studiedCount, 1)
})
