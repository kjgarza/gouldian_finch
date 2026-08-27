import type { Stats } from '../types'
import { buildHeatmap, formatDay, longestStreak, normalizeStudiedDates, todayISO } from './study-calendar'
import type { DayState, Heatmap, HeatmapWeek } from './study-calendar'

const WEEKS = 26
const VISIBLE_WEEKDAYS = new Set([0, 2, 4]) // Mon / Wed / Fri, like a contributions graph
const RECENT_IN_LABEL = 7 // study days named in the grid's text alternative

const CELL_CLASSES: Record<DayState, string> = {
  studied: 'bg-primary',
  missed: 'bg-base-300',
  untracked: 'border border-dashed border-base-300',
  future: 'bg-base-200 opacity-40',
}

const CELL_TITLES: Record<DayState, string> = {
  studied: 'studied',
  missed: 'no session',
  untracked: 'before daily history was recorded',
  future: 'upcoming',
}

function cell(date: string, state: DayState, label: string, today: string): string {
  const isToday = date === today ? ' ring-1 ring-primary ring-offset-1 ring-offset-base-100' : ''
  return `<div class="w-3 h-3 rounded-sm ${CELL_CLASSES[state]}${isToday}" title="${label} — ${CELL_TITLES[state]}" data-date="${date}" data-state="${state}" aria-hidden="true"></div>`
}

function weekColumn(week: HeatmapWeek, today: string): string {
  const label = week.monthLabel
    ? `<span class="absolute left-0 top-0 text-[10px] leading-4 text-base-content opacity-70 whitespace-nowrap">${week.monthLabel}</span>`
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
      <div class="h-3 text-[10px] leading-3 text-base-content opacity-70">${VISIBLE_WEEKDAYS.has(index) ? label : ''}</div>
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
      <span class="w-3 h-3 rounded-sm ${CELL_CLASSES[state]}"></span>${text}
    </span>
  `
}

/**
 * Text alternative for the grid: the cells themselves are `aria-hidden`, since
 * 182 `title` tooltips are neither reachable by touch nor useful to read out.
 */
function describeGrid(heatmap: Heatmap, studiedDates: string[], today: string, longest: number): string {
  const recent = normalizeStudiedDates(studiedDates).slice(-RECENT_IN_LABEL).reverse().map(formatDay)

  return [
    `Study calendar for the ${WEEKS * 7} days ending ${formatDay(today)}.`,
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
  const heatmap = buildHeatmap(studiedDates, today, WEEKS)
  const hasHistory = studiedDates.length > 0
  const longest = longestStreak(studiedDates)
  const gridLabel = describeGrid(heatmap, studiedDates, today, longest)

  const root = document.createElement('div')
  root.className = 'card bg-base-100 shadow p-4 mb-6'

  root.innerHTML = `
    <div class="flex flex-wrap items-baseline justify-between gap-2 mb-3">
      <h2 class="text-lg font-semibold">🗓️ Study Calendar</h2>
      ${hasHistory ? `
        <div class="text-sm text-base-content opacity-70">
          ${heatmap.studiedCount} of the last ${WEEKS * 7} days
          · longest streak ${longest} day${longest === 1 ? '' : 's'}
        </div>
      ` : ''}
    </div>

    ${hasHistory ? `
      <div class="overflow-x-auto pb-1" id="heatmapScroll" role="img" tabindex="0" aria-label="${gridLabel}">
        <div class="flex gap-1 w-max">
          ${weekdayColumn(heatmap.weekdayLabels)}
          ${heatmap.weeks.map((week) => weekColumn(week, today)).join('')}
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs text-base-content opacity-70">
        ${legendItem('studied', 'Studied')}
        ${legendItem('missed', 'No session')}
        ${legendItem('untracked', 'Not tracked yet')}
      </div>

      ${heatmap.trackedFrom ? `
        <p class="text-xs text-base-content opacity-70 mt-2">
          Daily history starts ${formatDay(heatmap.trackedFrom)} — days before that were never recorded, so they are left blank instead of counted as missed.
        </p>
      ` : ''}
    ` : `
      <div class="text-center text-base-content opacity-70 py-6">
        <div class="text-2xl mb-2">📅</div>
        <div class="text-sm">No study days recorded yet</div>
        <div class="text-xs mt-1">Answer a card in Review or Memory and today will light up here.</div>
        <button class="btn btn-primary btn-sm mt-3" id="heatmapReviewBtn">Start reviewing</button>
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
