const MS_PER_DAY = 1000 * 60 * 60 * 24
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/

const MONTH_LABELS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

/** Number of past days kept in `Stats.studiedDates` (a little over two years). */
export const STUDIED_DATES_LIMIT = 800

export type DayState = 'studied' | 'missed' | 'untracked' | 'future'

export interface HeatmapDay {
  date: string // ISO date
  state: DayState
  label: string // human readable, for tooltips
}

export interface HeatmapWeek {
  days: HeatmapDay[] // always 7, Monday first
  monthLabel?: string // set when this column starts a new month
}

export interface Heatmap {
  weeks: HeatmapWeek[]
  weekdayLabels: string[]
  studiedCount: number
  trackedFrom?: string // ISO date of the first recorded study day, if any
}

export function todayISO(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10)
}

export function isISODate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE.test(value)) return false
  const [yearText, monthText, dayText] = value.split('-')
  const year = Number(yearText)
  const month = Number(monthText)
  const day = Number(dayText)
  const parsed = new Date(Date.UTC(year, month - 1, day))
  return parsed.getUTCFullYear() === year
    && parsed.getUTCMonth() === month - 1
    && parsed.getUTCDate() === day
}

function toUTC(date: string): number {
  return Date.parse(`${date}T00:00:00Z`)
}

export function addDays(date: string, days: number): string {
  return new Date(toUTC(date) + days * MS_PER_DAY).toISOString().slice(0, 10)
}

export function daysBetween(from: string, to: string): number {
  return Math.round((toUTC(to) - toUTC(from)) / MS_PER_DAY)
}

/** Monday-first weekday index (0 = Monday ... 6 = Sunday). */
function weekdayIndex(date: string): number {
  return (new Date(toUTC(date)).getUTCDay() + 6) % 7
}

/**
 * Keeps only well-formed ISO dates, de-duplicates them and sorts oldest first.
 * Anything unexpected in localStorage is dropped rather than trusted.
 */
export function normalizeStudiedDates(input: unknown, limit = STUDIED_DATES_LIMIT): string[] {
  if (!Array.isArray(input)) return []
  const unique = new Set(input.filter(isISODate))
  const sorted = [...unique].sort()
  return sorted.slice(Math.max(0, sorted.length - limit))
}

/** Adds `date` to the log, keeping it sorted, de-duplicated and bounded. */
export function addStudiedDate(dates: string[], date: string, limit = STUDIED_DATES_LIMIT): string[] {
  if (!isISODate(date)) return dates
  return normalizeStudiedDates([...dates, date], limit)
}

/** Longest run of consecutive calendar days in the log. */
export function longestStreak(dates: string[]): number {
  const sorted = normalizeStudiedDates(dates)
  let longest = 0
  let run = 0
  let previous: string | undefined

  for (const date of sorted) {
    run = previous && daysBetween(previous, date) === 1 ? run + 1 : 1
    previous = date
    if (run > longest) longest = run
  }

  return longest
}

/**
 * Builds a GitHub-contributions-style grid ending with the week that contains
 * `today`. Days before the first recorded session are `untracked` rather than
 * `missed` — the app only started logging individual days recently, so claiming
 * those days were missed would be a lie.
 */
export function buildHeatmap(studiedDates: string[], today: string, weeks = 26): Heatmap {
  const studied = new Set(normalizeStudiedDates(studiedDates))
  const trackedFrom = [...studied].sort()[0]

  const gridEnd = addDays(today, 6 - weekdayIndex(today)) // Sunday of the current week
  const gridStart = addDays(gridEnd, -(weeks * 7 - 1))

  const grid: HeatmapWeek[] = []
  let previousMonth = ''

  for (let week = 0; week < weeks; week++) {
    const days: HeatmapDay[] = []

    for (let day = 0; day < 7; day++) {
      const date = addDays(gridStart, week * 7 + day)
      days.push({ date, state: dayState(date, today, studied, trackedFrom), label: formatDay(date) })
    }

    const monthOfWeek = MONTH_LABELS[new Date(toUTC(days[0].date)).getUTCMonth()]
    const monthLabel = monthOfWeek === previousMonth ? undefined : monthOfWeek
    previousMonth = monthOfWeek

    grid.push({ days, monthLabel })
  }

  const windowStart = grid[0].days[0].date
  const studiedCount = [...studied].filter((date) => date >= windowStart && date <= today).length

  return { weeks: grid, weekdayLabels: WEEKDAY_LABELS, studiedCount, trackedFrom }
}

function dayState(date: string, today: string, studied: Set<string>, trackedFrom?: string): DayState {
  if (date > today) return 'future'
  if (studied.has(date)) return 'studied'
  if (!trackedFrom || date < trackedFrom) return 'untracked'
  return 'missed'
}

export function formatDay(date: string): string {
  const d = new Date(toUTC(date))
  return `${WEEKDAY_LABELS[weekdayIndex(date)]}, ${d.getUTCDate()} ${MONTH_LABELS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}
