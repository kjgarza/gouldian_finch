import { loadProgress, resetAll, loadStats, loadExamAttempts } from '../storage'
import { ALL_BERLIN_DE, ALL_DE, ALL_TERMS } from '../state'
import { navigate } from '../router'
import { isTermStudyId } from '../lib/study-ids'
import { isMature } from '../lib/study-session'
import { StudyHeatmap } from '../lib/study-heatmap'
import { formatDay, isISODate } from '../lib/study-calendar'
import { currentStreak } from '../lib/study-stats'
import { buildTopicDecks } from '../lib/topic-decks'
import { topicMeta } from '../lib/topics'

const PASS_MARK = 17

/**
 * Share of a deck completed, as a CSS-safe percentage. A deck can legitimately
 * be empty and `0 / 0` would put `NaN%` into the bar's width.
 */
function percent(part: number, total: number): number {
  return total > 0 ? (part / total) * 100 : 0
}

function sectionTitle(text: string): string {
  return `<h2 class="font-mono text-xs text-muted">${text}</h2>`
}

/** One hairline row: mark, label, "learned / total" in mono, thin bar beneath. */
function progressRow(label: string, learned: number, size: number, className: string): string {
  return `
    <div class="border-b border-base-300 py-3 ${className}">
      <div class="flex min-h-7 items-center gap-3">
        <span class="topic-mark size-2.5" aria-hidden="true"></span>
        <span class="flex-1">${label}</span>
        <span class="font-mono text-[13px]">${learned} / ${size}</span>
      </div>
      <div class="stat-bar mt-2" role="img" aria-label="${learned} of ${size} learned"><span style="width: ${percent(learned, size)}%"></span></div>
    </div>
  `
}

function attemptRow(attempt: { timestamp: string; score: number; total: number }): string {
  const pass = attempt.score >= PASS_MARK
  return `
    <div class="flex min-h-12 items-center gap-3 border-b border-base-300">
      <span class="flex-1 font-mono text-[13px] text-muted">${new Date(attempt.timestamp).toLocaleDateString()}</span>
      <span class="font-mono text-[13px]">${attempt.score}/${attempt.total}</span>
      <span class="w-20 text-right text-sm font-semibold ${pass ? 'text-correct' : 'text-wrong'}">${pass ? 'Passed' : 'Not passed'}</span>
    </div>
  `
}

export function StatsView(): HTMLElement {
  const root = document.createElement('div')
  root.className = 'page'

  const stats = loadStats()
  const streak = currentStreak(stats)
  // Read once: every call re-parses localStorage and re-runs the id migration.
  const prog = loadProgress()
  // Same function Home's bands use, so the counts agree by construction.
  const decks = buildTopicDecks(prog, ALL_DE, ALL_BERLIN_DE)
  const learnedTotal = decks.reduce((sum, deck) => sum + deck.learned, 0)
  const questionTotal = decks.reduce((sum, deck) => sum + deck.size, 0)
  const learnedTerms = Object.values(prog).filter((card) => isTermStudyId(card.id) && isMature(card)).length
  const attempts = loadExamAttempts()
  const lastAttempt = attempts[0]
  const accuracy = Math.round((stats.accuracy || 0) * 100)

  root.innerHTML = `
    <header class="flex min-h-11 items-center">
      <h1 class="font-serif text-[22px] font-medium">Stats</h1>
    </header>

    <p class="mt-4 font-serif text-4xl leading-[1.05]">
      <span class="text-[64px]">${learnedTotal}</span> of ${questionTotal}<br>questions learned.
    </p>

    <div class="mt-5 flex min-h-14 items-center justify-between gap-3 border-y border-base-300 font-mono text-xs">
      <span class="flex items-center gap-1.5">
        ${streak > 0 ? '<span aria-hidden="true" class="size-[7px] rounded-full bg-live"></span>' : ''}${streak}-day streak
      </span>
      <span>${accuracy}% accuracy <span class="text-muted">· ${stats.totalAnswered || 0} answered</span></span>
    </div>

    <section class="mt-8" aria-label="Learning progress">
      ${sectionTitle('Learned by topic')}
      <div class="mt-1 flex flex-col">
        ${decks.map((deck) => progressRow(deck.topic, deck.learned, deck.size, topicMeta(deck.topic).className)).join('')}
        ${progressRow('Terms', learnedTerms, ALL_TERMS.length, 'term-all')}
      </div>
      ${isISODate(stats.lastStudyDate) ? `
        <p class="mt-3 font-mono text-xs text-muted">Last studied ${formatDay(stats.lastStudyDate)}</p>
      ` : ''}
    </section>

    <section class="mt-8" aria-label="Exam performance">
      ${sectionTitle('Exam performance')}
      ${lastAttempt ? `
        <p class="mt-3 flex items-baseline gap-2.5 font-serif">
          <span class="text-[64px] leading-none">${lastAttempt.score}</span>
          <span class="text-[22px] text-muted">/ ${lastAttempt.total}</span>
          <span class="font-sans text-base font-semibold ${lastAttempt.score >= PASS_MARK ? 'text-correct' : 'text-wrong'}">${lastAttempt.score >= PASS_MARK ? 'Passed' : 'Not passed'}</span>
        </p>
        <p class="mt-1 font-mono text-xs text-muted">Last exam · ${PASS_MARK} needed to pass</p>
        <div class="mt-3 flex flex-col border-t border-base-300">
          ${attempts.slice(0, 5).map(attemptRow).join('')}
        </div>
      ` : `
        <div class="mt-3 border-y border-base-300 py-6">
          <p class="text-sm">No exam attempts yet.</p>
          <button type="button" id="examBtn" class="btn btn-outline btn-sm mt-3">Take your first exam</button>
        </div>
      `}
    </section>

    <div id="studyHeatmap"></div>

    <section class="mt-10" aria-label="Reset progress">
      <p class="text-sm text-muted">Resetting deletes all progress, statistics and exam history. It cannot be undone.</p>
      <button type="button" id="resetBtn" class="btn btn-outline mt-3 w-full text-wrong">Reset all data</button>
    </section>
  `

  root.querySelector('#studyHeatmap')!.replaceWith(StudyHeatmap(stats))
  root.querySelector('#examBtn')?.addEventListener('click', () => navigate('#/exam'))

  root.querySelector('#resetBtn')!.addEventListener('click', () => {
    const confirmed = confirm(
      'Are you sure you want to reset all your data?\n\n' +
      'This will delete:\n' +
      '• All learning progress\n' +
      '• Statistics and streak\n' +
      '• Exam history\n\n' +
      'This action cannot be undone!'
    )

    if (confirmed) {
      const doubleConfirm = confirm('Last chance! Are you absolutely sure?')
      if (doubleConfirm) {
        resetAll()
        localStorage.removeItem('citizenTest_langHelper')
        location.reload()
      }
    }
  })

  return root
}
