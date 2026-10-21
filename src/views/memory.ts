import { ALL_TERMS } from '../state'
import { loadProgress, saveProgress, upsertCard } from '../storage'
import { updateCard } from '../sm2'
import { navigate } from '../router'
import { pickStudyBatch } from '../lib/study-session'
import { termStudyId } from '../lib/study-ids'
import { recordMemoryAnswer } from '../lib/study-stats'
import { topicMeta } from '../lib/topics'
import { createQueue, currentItem, gradeCurrent, isFinished, position } from '../lib/study-queue'

const BATCH_SIZE = 20

export function MemoryView(): HTMLElement {
  const root = document.createElement('div')
  root.className = 'page'

  let queue = createQueue(
    pickStudyBatch(
      ALL_TERMS.map((term) => ({
        studyId: termStudyId(term.id),
        term,
      })),
      loadProgress(),
      BATCH_SIZE,
    ),
  )
  let revealed = false

  root.innerHTML = `
    <div id="cardArea"></div>
    <div class="cta-bar cta-bar-tabbed" id="ctaBar">
      <button type="button" class="btn btn-primary h-auto min-h-14 flex-1" id="revealBtn">
        Reveal <span class="hidden font-mono text-xs font-normal sm:inline">space</span>
      </button>
      <button type="button" class="btn btn-outline hidden h-auto min-h-14 flex-1 flex-col gap-0 py-1.5" id="againBtn" disabled>
        <span>Again <span class="hidden font-mono text-xs font-normal sm:inline">←</span></span>
        <span class="font-mono text-[11px] font-normal opacity-70">later this session</span>
      </button>
      <button type="button" class="btn btn-primary hidden h-auto min-h-14 flex-1 flex-col gap-0 py-1.5" id="goodBtn" disabled>
        <span>Good <span class="hidden font-mono text-xs font-normal sm:inline">→</span></span>
        <span id="goodSub" class="font-mono text-[11px] font-normal opacity-70"></span>
      </button>
    </div>
  `

  const cardArea = root.querySelector('#cardArea') as HTMLDivElement
  const ctaBar = root.querySelector('#ctaBar') as HTMLDivElement
  const revealBtn = root.querySelector('#revealBtn') as HTMLButtonElement
  const againBtn = root.querySelector('#againBtn') as HTMLButtonElement
  const goodBtn = root.querySelector('#goodBtn') as HTMLButtonElement
  const goodSub = root.querySelector('#goodSub') as HTMLSpanElement

  /** Reveal alone before the flip; Again / Good once the answer is showing. */
  function setBar(state: 'front' | 'revealed' | 'done') {
    revealBtn.classList.toggle('hidden', state !== 'front')
    againBtn.classList.toggle('hidden', state !== 'revealed')
    goodBtn.classList.toggle('hidden', state !== 'revealed')
    revealBtn.disabled = state !== 'front'
    againBtn.disabled = state !== 'revealed'
    goodBtn.disabled = state !== 'revealed'
    // Nothing left to grade: leave no enabled button that could advance past the end.
    ctaBar.classList.toggle('hidden', state === 'done')
  }

  function renderDone() {
    const empty = queue.items.length === 0
    revealed = false
    setBar('done')
    cardArea.innerHTML = `
      <div class="pt-16">
        <h2 class="font-serif text-4xl leading-tight">${empty ? 'Nothing due.' : 'Session complete.'}</h2>
        <p class="mt-3 text-muted">${empty
          ? 'Every term is scheduled ahead. Come back later for more cards.'
          : 'You cleared the current term deck. Come back when more cards are due.'}</p>
        <button type="button" data-close class="btn btn-primary mt-8 w-full">Back to home</button>
      </div>
    `
    cardArea.querySelector('[data-close]')!.addEventListener('click', () => navigate('#/'))
  }

  function renderCard() {
    const entry = currentItem(queue)
    if (!entry) {
      renderDone()
      return
    }

    const { item } = entry
    const { term } = item
    const { current, total } = position(queue)
    const meta = term.topic ? topicMeta(term.topic) : null
    revealed = false

    const days = updateCard(loadProgress()[item.studyId] ?? entry.progress, 'good').interval
    goodSub.textContent = `in ${days} ${days === 1 ? 'day' : 'days'}`

    cardArea.innerHTML = `
      <header class="flex min-h-11 items-center gap-3">
        <h1 class="font-serif text-[22px] font-medium">Terms</h1>
        <span class="term-progress" aria-hidden="true"><span style="width: ${Math.min(100, (current / total) * 100)}%"></span></span>
        <span class="font-mono text-xs">${current}/${total}</span>
      </header>

      <section class="mt-10 ${meta ? meta.className : ''}">
        ${meta ? `
          <p class="flex items-center gap-2 font-mono text-xs text-muted">
            <span class="topic-mark" aria-hidden="true"></span>${meta.short}
          </p>
        ` : ''}
        <h2 lang="de" class="mt-3 break-words font-serif text-[clamp(2.25rem,11vw,3rem)] leading-[1.1]">${term.de}</h2>
        <div id="termBack" class="mt-6 hidden border-t border-base-300 pt-5">
          <p lang="en" class="font-serif text-[28px] italic leading-tight text-correct">${term.en}</p>
          ${term.note ? `<p class="mt-3 text-sm text-muted">${term.note}</p>` : ''}
        </div>
      </section>
    `

    setBar('front')
  }

  function reveal() {
    if (revealed || isFinished(queue)) return

    revealed = true
    root.querySelector('#termBack')?.classList.remove('hidden')
    setBar('revealed')
  }

  function advance(grade: 'again' | 'good') {
    // Guard on state, not on the buttons: a stray key must not grade a card
    // that has not been revealed, or one past the end of the queue.
    const entry = currentItem(queue)
    if (!entry || !revealed) return

    saveProgress(upsertCard(loadProgress(), entry.item.studyId, (progress) => updateCard(progress, grade)))
    recordMemoryAnswer(grade === 'good')

    queue = gradeCurrent(queue, grade)
    renderCard()
  }

  revealBtn.addEventListener('click', reveal)
  againBtn.addEventListener('click', () => advance('again'))
  goodBtn.addEventListener('click', () => advance('good'))

  const onKey = (event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return
    if (event.key === ' ' || event.key === 'Enter') {
      if (revealed || isFinished(queue)) return
      event.preventDefault()
      reveal()
      return
    }
    if (event.key === 'ArrowLeft' && revealed) {
      event.preventDefault()
      advance('again')
      return
    }
    if (event.key === 'ArrowRight' && revealed) {
      event.preventDefault()
      advance('good')
    }
  }

  window.addEventListener('keydown', onKey)
  root.addEventListener('removed', () => {
    window.removeEventListener('keydown', onKey)
  })

  renderCard()
  return root
}
