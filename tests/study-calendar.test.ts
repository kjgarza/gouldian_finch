import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  addStudiedDate,
  buildHeatmap,
  heatmapRange,
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
  const heatmap = buildHeatmap(['2026-03-02'], '2026-03-04', { pastMonths: 1, futureDays: 0 })
  const days = heatmap.weeks.flatMap((week) => week.days)
  const state = (date: string) => days.find((day) => day.date === date)?.state

  assert.equal(state('2026-03-01'), 'untracked')
  assert.equal(state('2026-03-02'), 'studied')
  assert.equal(state('2026-03-03'), 'missed')
  assert.equal(state('2026-03-05'), 'future')
  assert.equal(heatmap.studiedCount, 1)
})

// 2026-10-21 is a Wednesday. Three months back is 2026-07-21 (a Tuesday), so the
// grid starts on Monday 2026-07-20; 30 days ahead is 2026-11-20 (a Friday), so it
// ends on Sunday 2026-11-22.
test('the range runs from the Monday on or before today minus 3 months to the Sunday on or after today plus 30 days', () => {
  assert.deepEqual(heatmapRange('2026-10-21'), { start: '2026-07-20', end: '2026-11-22' })

  const heatmap = buildHeatmap([], '2026-10-21')
  const days = heatmap.weeks.flatMap((week) => week.days)
  assert.equal(days[0].date, '2026-07-20')
  assert.equal(days[days.length - 1].date, '2026-11-22')
  assert.equal(heatmap.weeks.length, 18)
  assert.ok(heatmap.weeks.every((week) => week.days.length === 7))
})

test('the range is calendar months, clamped when the target month is shorter', () => {
  // 31 May minus 3 months has no 31 February: clamp to 28 Feb 2026 (a Saturday).
  assert.equal(heatmapRange('2026-05-31').start, '2026-02-23')
  // Crossing a year boundary.
  assert.equal(heatmapRange('2026-01-15').start, '2025-10-13')
})

test('the past and future windows are parameters', () => {
  assert.deepEqual(heatmapRange('2026-10-21', { pastMonths: 1, futureDays: 0 }), {
    start: '2026-09-21',
    end: '2026-10-25',
  })
})

test('every day after today is future, and today is not', () => {
  const days = buildHeatmap(['2026-10-20'], '2026-10-21').weeks.flatMap((week) => week.days)
  assert.ok(days.filter((day) => day.date > '2026-10-21').every((day) => day.state === 'future'))
  assert.ok(days.filter((day) => day.date > '2026-10-21').length >= 30)
  assert.notEqual(days.find((day) => day.date === '2026-10-21')?.state, 'future')
})

test('month labels cover the future months', () => {
  const labels = buildHeatmap([], '2026-10-21').weeks.map((week) => week.monthLabel).filter(Boolean)
  assert.deepEqual(labels, ['Jul', 'Aug', 'Sep', 'Oct', 'Nov'])
})

test('the studied count only covers the days shown up to today', () => {
  const heatmap = buildHeatmap(['2026-07-01', '2026-07-21', '2026-10-21'], '2026-10-21')
  assert.equal(heatmap.studiedCount, 2)
})
