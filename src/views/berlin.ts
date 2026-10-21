import { ALL_BERLIN_DE, byId } from '../state'
import { loadProgress, saveProgress, upsertCard } from '../storage'
import type { Question, CardProgress } from '../types'
import { updateCard } from '../sm2'
import { Locales } from '../i18n'
import { navigate } from '../router'
import { berlinStudyId } from '../lib/study-ids'
import { pickStudyBatch } from '../lib/study-session'
import { recordReviewAnswer } from '../lib/study-stats'
import { hintHtml, paintAnswer, questionCardHtml, renderChoices } from '../lib/question-card'

// The Berlin state pool is small enough to serve in a single batch.
const BATCH_SIZE = ALL_BERLIN_DE.length

type SessionItem = { q: Question; progress: CardProgress; studyId: string }

function pickDueBatch(): SessionItem[] {
  const prog = loadProgress()
  const items = ALL_BERLIN_DE.map((q) => ({
    q,
    studyId: berlinStudyId(q.id),
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

export function BerlinView(): HTMLElement {
  const root = document.createElement('div')
  root.className = 'page'

  let queue = pickDueBatch()
  let current = 0
  /** Choice the learner picked for the current card, or null before they answer. */
  let answeredIndex: number | null = null
  let showEnglish = Locales.get()
  // Derived from the whole deck, not the due batch: the notice has to stand
  // whatever happens to be due today.
  const substitutedCount = ALL_BERLIN_DE.filter((q) => q.substituted).length

  root.innerHTML = `
    <div id="cardArea"></div>
    ${substitutedCount > 0 ? `
      <p class="mt-6 border-t border-base-300 pt-3 text-sm text-muted">
        ${substitutedCount} of these questions show images in the official test.
        They are replaced here with text versions that check the same facts.
      </p>
    ` : ''}
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
    if (ALL_BERLIN_DE.length === 0) {
      renderDone('No Berlin cards loaded.', 'Add the Berlin state questions to <code>src/data/questions_berlin_de.json</code> to start this deck.')
      return
    }

    if (queue.length === 0) {
      renderDone('Nothing due today.', 'The Berlin deck is scheduled ahead. Come back when these cards are due again.')
      return
    }

    if (current >= queue.length) {
      renderDone('Session complete.', 'You cleared the Berlin deck. Come back when these cards are due again.')
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
      hintBox.innerHTML = hintHtml(q, en, showEnglish)
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

    recordReviewAnswer(idx === queue[current].q.correctIndex)
  }

  function advance(grade: 'again' | 'good') {
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
  root.addEventListener('removed', () => window.removeEventListener('keydown', onKey))

  renderCard()
  return root
}
