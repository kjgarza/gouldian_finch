import type { Stats } from '../types'
import { buildHeatmap, daysBetween, formatDay, longestStreak, normalizeStudiedDates, todayISO } from './study-calendar'
import type { DayState, Heatmap, HeatmapWeek } from './study-calendar'

const VISIBLE_WEEKDAYS = new Set([0, 2, 4]) // Mon / Wed / Fri, like a contributions graph
const RECENT_IN_LABEL = 7 // study days named in the grid's text alternative

/**
 * Ink strength (%) behind each state: one ramp from the theme's ink, stepping
 * in lightness rather than hue. Keep in step with `.heat-*` in styles.css.
 */
export const HEAT_SHADES = { studied: 100, missed: 16, future: 6 } as const

const CELL_CLASSES: Record<DayState, string> = {
  studied: 'heat-studied',
  missed: 'heat-missed',
  untracked: 'heat-untracked',
  future: 'heat-future',
}

export function cellShade(state: DayState): string {
  return CELL_CLASSES[state]
}

const CELL_TITLES: Record<DayState, string> = {
  studied: 'studied',
  missed: 'no session',
  untracked: 'before daily history was recorded',
  future: 'upcoming',
}

function cell(date: string, state: DayState, label: string, today: string): string {
  const isToday = date === today ? ' heat-today' : ''
  return `<div class="size-3 rounded-sm ${cellShade(state)}${isToday}" title="${label} — ${CELL_TITLES[state]}" data-date="${date}" data-state="${state}" aria-hidden="true"></div>`
}

function weekColumn(week: HeatmapWeek, today: string): string {
  const label = week.monthLabel
    ? `<span class="absolute left-0 top-0 text-[10px] leading-4 text-muted whitespace-nowrap">${week.monthLabel}</span>`
    : ''

  return `
    <div class="flex flex-col gap-1">
      <div class="relative h-4 w-3">${label}</div>
      ${week.days.map((day) => cell(day.date, day.state, day.label, today)).join('')}
    </div>
  `
}

function weekdayColumn(labels: string[]): string {
  const rows = labels
    .map((label, index) => `
      <div class="h-3 font-mono text-[10px] leading-3 text-muted">${VISIBLE_WEEKDAYS.has(index) ? label : ''}</div>
    `)
    .join('')

  // Sticky so the labels stay readable while the grid scrolls horizontally.
  return `<div class="flex flex-col gap-1 pr-1 sticky left-0 z-10 bg-base-100">
    <div class="h-4"></div>${rows}
  </div>`
}

function legendItem(state: DayState, text: string): string {
  return `
    <span class="flex items-center gap-1">
      <span class="size-3 rounded-sm ${cellShade(state)}"></span>${text}
    </span>
  `
}

/**
 * Text alternative for the grid: the cells themselves are `aria-hidden`, since
 * `title` tooltips are neither reachable by touch nor useful to read out.
 */
function describeGrid(heatmap: Heatmap, studiedDates: string[], longest: number): string {
  const recent = normalizeStudiedDates(studiedDates).slice(-RECENT_IN_LABEL).reverse().map(formatDay)

  return [
    `Study calendar from ${formatDay(heatmap.rangeStart)} to ${formatDay(heatmap.rangeEnd)}: the last three months and the next 30 days.`,
    `${heatmap.studiedCount} day${heatmap.studiedCount === 1 ? '' : 's'} studied,`,
    `longest streak ${longest} day${longest === 1 ? '' : 's'}.`,
    recent.length > 0 ? `Most recent sessions: ${recent.join('; ')}.` : '',
    heatmap.trackedFrom ? `Daily history starts ${formatDay(heatmap.trackedFrom)}.` : '',
  ].filter(Boolean).join(' ')
}

/**
 * Calendar heatmap of the days that had at least one answered card, so gaps in
 * a streak are visible rather than only the streak number.
 */
export function StudyHeatmap(stats: Stats, now: Date = new Date()): HTMLElement {
  const today = todayISO(now)
  const studiedDates = stats.studiedDates || []
  const heatmap = buildHeatmap(studiedDates, today)
  const hasHistory = studiedDates.length > 0
  const longest = longestStreak(studiedDates)
  const gridLabel = describeGrid(heatmap, studiedDates, longest)

  const root = document.createElement('section')
  root.className = 'mt-8'

  root.innerHTML = `
    <div class="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <h2 class="font-serif text-[22px] font-medium">Study calendar</h2>
      ${hasHistory ? `
        <p class="font-mono text-xs text-muted">
          ${heatmap.studiedCount} of ${daysBetween(heatmap.rangeStart, today) + 1} days · longest streak ${longest}
        </p>
      ` : ''}
    </div>

    ${hasHistory ? `
      <div class="mt-3 overflow-x-auto pb-1" id="heatmapScroll" role="img" tabindex="0" aria-label="${gridLabel}">
        <div class="flex w-max gap-1">
          ${weekdayColumn(heatmap.weekdayLabels)}
          ${heatmap.weeks.map((week) => weekColumn(week, today)).join('')}
        </div>
      </div>

      <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-xs text-muted">
        ${legendItem('studied', 'Studied')}
        ${legendItem('missed', 'No session')}
        ${legendItem('untracked', 'Not tracked yet')}
      </div>

      ${heatmap.trackedFrom ? `
        <p class="mt-2 text-xs text-muted">
          Daily history starts ${formatDay(heatmap.trackedFrom)}. Days before that were never recorded, so they are left blank instead of counted as missed.
        </p>
      ` : ''}
    ` : `
      <div class="mt-3 border-y border-base-300 py-6">
        <p class="text-sm">No study days recorded yet.</p>
        <p class="mt-1 text-xs text-muted">Answer a card in Review or Terms and today will show up here.</p>
        <button type="button" class="btn btn-outline btn-sm mt-3" id="heatmapReviewBtn">Start reviewing</button>
      </div>
    `}
  `

  const scroller = root.querySelector<HTMLElement>('#heatmapScroll')
  if (scroller) {
    // Show the most recent weeks first on narrow screens.
    requestAnimationFrame(() => { scroller.scrollLeft = scroller.scrollWidth })
  }

  root.querySelector('#heatmapReviewBtn')?.addEventListener('click', () => {
    location.hash = '#/review'
  })

  return root
}
