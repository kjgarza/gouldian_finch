import { navigate } from '../router'
import { ALL_BERLIN_DE, ALL_DE } from '../state'
import { loadExamAttempts, loadProgress, loadStats } from '../storage'
import { Footer } from '../lib/footer'
import { studyCounts } from '../lib/study-session'
import { buildTopicDecks, type TopicDeck } from '../lib/topic-decks'
import { currentStreak } from '../lib/study-stats'
import { questionStudyId } from '../lib/study-ids'
import { topicMeta } from '../lib/topics'

/** "12 due · 88 not started", trimmed to whichever halves are non-zero. */
function waitingLabel(counts: { due: number; unseen: number }): string {
  const parts: string[] = []
  if (counts.due > 0) parts.push(`${counts.due} due`)
  if (counts.unseen > 0) parts.push(`${counts.unseen} not started`)
  return parts.length > 0 ? parts.join(' · ') : 'all caught up'
}

/**
 * Leads with owed reviews; with none owed, with what is left to start, so a
 * new learner isn't greeted with "nothing due" in front of 310 questions.
 */
function headline(due: number, unseen: number): string {
  const big = (n: number) => `<span class="text-[64px]">${n}</span>`
  if (due > 0) return `${big(due)} ${due === 1 ? 'question' : 'questions'}<br>due today.`
  if (unseen > 0) return `${big(unseen)} new ${unseen === 1 ? 'question' : 'questions'}<br>to start.`
  return 'Nothing due today.'
}

/** Right-hand side of a band: what is due, else what is new, else done. */
function bandStatus({ counts }: TopicDeck): string {
  if (counts.due > 0) {
    return `<span class="font-serif text-[34px] leading-none">${counts.due}<span class="sr-only"> due</span></span>`
  }
  if (counts.unseen > 0) {
    return `<span class="font-mono text-xs">${counts.unseen} new</span>`
  }
  return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round" role="img" aria-label="nothing due"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>`
}

export function HomeView(): HTMLElement {
  const root = document.createElement('div')
  root.className = 'page'
  // Read once: every call re-parses localStorage and re-runs the id migration.
  const prog = loadProgress()

  const decks = buildTopicDecks(prog, ALL_DE, ALL_BERLIN_DE)
  /** Where tapping a band goes. */
  const openDeck = (deck: TopicDeck) => deck.topic === 'Bundesland Berlin'
    ? navigate('#/berlin')
    : navigate('#/review', { topic: topicMeta(deck.topic).slug })

  const totalDue = decks.reduce((sum, deck) => sum + deck.counts.due, 0)
  const totalNew = decks.reduce((sum, deck) => sum + deck.counts.unseen, 0)
  const federal = studyCounts(ALL_DE.map((q) => ({ studyId: questionStudyId(q.id) })), prog)
  const streak = currentStreak(loadStats())
  const lastExam = loadExamAttempts()[0]

  root.innerHTML = `
    <header class="flex min-h-11 items-center justify-between">
      <span class="font-serif text-[22px] font-medium">Finch</span>
      ${streak > 0 ? `
        <span class="flex items-center gap-1.5 font-mono text-xs text-muted">
          <span aria-hidden="true" class="size-[7px] rounded-full bg-live"></span>${streak}-day streak
        </span>
      ` : ''}
    </header>

    <h1 class="mt-4 font-serif text-4xl leading-[1.05]">
      ${headline(totalDue, totalNew)}
    </h1>

    <div class="mt-5 flex flex-col gap-1.5">
      ${decks.map((deck, i) => `
        <button type="button" data-deck="${i}" class="topic-band ${topicMeta(deck.topic).className}">
          <span class="flex min-w-0 flex-col gap-0.5 text-left">
            <span class="text-[17px] font-semibold">${deck.topic}</span>
            <span class="topic-band-sub font-mono text-xs">${deck.learned} of ${deck.size} learned</span>
          </span>
          ${bandStatus(deck)}
        </button>
      `).join('')}
    </div>

    <button type="button" id="reviewBtn" class="btn btn-primary mt-3 h-auto min-h-[60px] w-full flex-col gap-0 py-2">
      <span class="text-[17px] font-semibold">Study all</span>
      <span class="font-mono text-[11px] font-normal opacity-80">${waitingLabel(federal)}</span>
    </button>

    <button type="button" id="examBtn" class="mt-3 flex min-h-[52px] w-full items-center justify-between border-y border-base-300 text-left">
      <span class="text-base font-semibold">Practice exam <span class="font-normal text-muted">· 33 questions</span></span>
      <span class="flex items-center gap-1.5 font-mono text-xs text-muted">
        ${lastExam ? `last ${lastExam.score}/${lastExam.total}` : ''}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
      </span>
    </button>
  `

  root.querySelectorAll<HTMLButtonElement>('[data-deck]').forEach((btn) => {
    btn.addEventListener('click', () => openDeck(decks[Number(btn.dataset.deck)]))
  })
  root.querySelector('#reviewBtn')!.addEventListener('click', () => navigate('#/review'))
  root.querySelector('#examBtn')!.addEventListener('click', () => navigate('#/exam'))

  root.appendChild(Footer())

  return root
}
