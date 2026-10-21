import { ALL_DE, byId } from '../state'
import { loadProgress, saveProgress, upsertCard } from '../storage'
import type { Question, CardProgress, Topic } from '../types'
import { updateCard } from '../sm2'
import { Locales } from '../i18n'
import { navigate, routeQuery } from '../router'
import { questionStudyId } from '../lib/study-ids'
import { pickStudyBatch } from '../lib/study-session'
import { recordReviewAnswer } from '../lib/study-stats'
import { topicFromSlug, topicMeta } from '../lib/topics'
import { hintHtml, paintAnswer, questionCardHtml, renderChoices } from '../lib/question-card'
import { bindDiagramToggles, diagramHintHtml } from '../diagrams'

const BATCH_SIZE = 20

type ReviewStudyItem = {
  q: Question
  studyId: string
}

type SessionItem = { q: Question; progress: CardProgress; studyId: string }

/** Today's batch, optionally limited to one topic (home's topic bands). */
function pickDueBatch(topic: Topic | null): SessionItem[] {
  const prog = loadProgress()
  const items: ReviewStudyItem[] = ALL_DE
    .filter((q) => topic === null || q.topic === topic)
    .map((q) => ({
      q,
      studyId: questionStudyId(q.id),
    }))

  return pickStudyBatch(items, prog, BATCH_SIZE).map(({ item, progress }) => ({
    q: item.q,
    progress,
    studyId: item.studyId,
  }))
}

/** "in 6 days" — where Good would send the card, from its stored progress. */
function goodIntervalLabel(item: SessionItem): string {
  const progress = loadProgress()[item.studyId] ?? item.progress
  const days = updateCard(progress, 'good').interval
  return `in ${days} ${days === 1 ? 'day' : 'days'}`
}

export function ReviewView(): HTMLElement {
  const root = document.createElement('div')
  root.className = 'page'

  // Read from the URL, so a topic session survives a reload.
  const topic = topicFromSlug(routeQuery().get('topic'))
  let queue = pickDueBatch(topic)
  let current = 0
  /** Choice the learner picked for the current card, or null before they answer. */
  let answeredIndex: number | null = null
  let showEnglish = Locales.get()

  root.innerHTML = `
    <div id="cardArea"></div>
    <div class="cta-bar">
      <button class="btn btn-outline h-auto min-h-14 flex-1 flex-col gap-0 py-1.5" id="againBtn" disabled>
        <span>Again <span class="hidden font-mono text-xs font-normal sm:inline">←</span></span>
        <span class="font-mono text-[11px] font-normal opacity-70">later this session</span>
      </button>
      <button class="btn btn-primary h-auto min-h-14 flex-1 flex-col gap-0 py-1.5" id="goodBtn" disabled>
        <span>Good <span class="hidden font-mono text-xs font-normal sm:inline">→</span></span>
        <span id="goodSub" class="font-mono text-[11px] font-normal opacity-70"></span>
      </button>
    </div>
  `

  const cardArea = root.querySelector('#cardArea') as HTMLDivElement
  const ctaBar = root.querySelector('.cta-bar') as HTMLDivElement
  const againBtn = root.querySelector('#againBtn') as HTMLButtonElement
  const goodBtn = root.querySelector('#goodBtn') as HTMLButtonElement
  const goodSub = root.querySelector('#goodSub') as HTMLSpanElement

  function renderDone(title: string, body: string) {
    // Nothing left to grade: the bar would otherwise keep the last card's
    // enabled buttons and advance past the end of the queue.
    againBtn.disabled = true
    goodBtn.disabled = true
    ctaBar.classList.add('hidden')
    cardArea.innerHTML = `
      <div class="pt-16">
        <h2 class="font-serif text-4xl leading-tight">${title}</h2>
        <p class="mt-3 text-muted">${body}</p>
        <button type="button" data-close class="btn btn-primary mt-8 w-full">Back to home</button>
      </div>
    `
    cardArea.querySelector('[data-close]')!.addEventListener('click', () => navigate('#/'))
  }

  function renderCard() {
    const scope = topic ? topicMeta(topic).short : null

    if (queue.length === 0) {
      renderDone('Nothing due.', scope
        ? `No ${scope} questions are due right now. Come back when they come round again.`
        : 'Every question is scheduled ahead. Come back later for more cards.')
      return
    }

    if (current >= queue.length) {
      renderDone('Session complete.', 'Great job! Come back later for more cards.')
      return
    }

    const item = queue[current]
    const { q } = item
    const en = byId(q.id).en

    cardArea.innerHTML = questionCardHtml({ q, en, showEnglish, position: current + 1, total: queue.length })
    renderChoices(cardArea.querySelector('#choices') as HTMLDivElement, { q, en, showEnglish }, onChoose)
    goodSub.textContent = goodIntervalLabel(item)

    cardArea.querySelector('[data-close]')!.addEventListener('click', () => navigate('#/'))
    cardArea.querySelector('[data-lang-switch]')!.addEventListener('click', () => {
      showEnglish = !showEnglish
      Locales.set(showEnglish)
      renderCard()
    })

    const hintBtn = cardArea.querySelector('#hintBtn') as HTMLButtonElement
    const hintBox = cardArea.querySelector('#hintBox') as HTMLDivElement
    hintBtn.addEventListener('click', () => {
      hintBtn.classList.add('hidden')
      hintBox.classList.remove('hidden')
      hintBox.innerHTML = hintHtml(q, en, showEnglish) + diagramHintHtml(q.id, showEnglish)
      bindDiagramToggles(hintBox)
    })

    // The English helper re-renders mid-card, so an answer already given has
    // to be painted back on. Otherwise the feedback vanishes, the choices come
    // back enabled, and the same card gets answered — and counted — twice.
    if (answeredIndex === null) {
      againBtn.disabled = true
      goodBtn.disabled = true
    } else {
      showAnswer(answeredIndex)
    }
  }

  function showAnswer(idx: number) {
    paintAnswer(cardArea, queue[current].q, idx)
    againBtn.disabled = false
    goodBtn.disabled = idx !== queue[current].q.correctIndex // Good only when correct
  }

  function answeredCorrectly(): boolean {
    return answeredIndex !== null && answeredIndex === queue[current]?.q.correctIndex
  }

  function onChoose(idx: number) {
    if (answeredIndex !== null) return

    answeredIndex = idx
    showAnswer(idx)

    // Update accuracy stats immediately
    recordReviewAnswer(idx === queue[current].q.correctIndex)
  }

  function advance(grade: 'again'|'good') {
    const map = loadProgress()
    const item = queue[current]
    const updatedMap = upsertCard(map, item.studyId, (p) => updateCard(p, grade))
    saveProgress(updatedMap)

    if (grade === 'again') {
      // Reinsert later in the same session (Leitner-ish)
      queue.push(item)
    }
    answeredIndex = null
    current++
    renderCard()
  }

  againBtn.addEventListener('click', () => advance('again'))
  goodBtn.addEventListener('click', () => {
    if (answeredCorrectly()) advance('good')
  })

  // Keyboard shortcuts
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && !againBtn.disabled) {
      e.preventDefault()
      advance('again')
    }
    if (e.key === 'ArrowRight' && !goodBtn.disabled) {
      e.preventDefault()
      advance('good')
    }
  }

  window.addEventListener('keydown', onKey)

  // Cleanup function
  const cleanup = () => window.removeEventListener('keydown', onKey)
  root.addEventListener('removed', cleanup)

  renderCard()
  return root
}
