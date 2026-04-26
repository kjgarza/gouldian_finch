import { ALL_TERMS } from '../state'
import { loadProgress, saveProgress, upsertCard } from '../storage'
import { updateCard } from '../sm2'
import { pickStudyBatch } from '../lib/study-session'
import { termStudyId } from '../lib/study-ids'
import { recordMemoryAnswer } from '../lib/study-stats'

const BATCH_SIZE = 20

export function MemoryView(): HTMLElement {
  const root = document.createElement('div')
  root.className = 'page'

  let queue = pickStudyBatch(
    ALL_TERMS.map((term) => ({
      studyId: termStudyId(term.id),
      term,
    })),
    loadProgress(),
    BATCH_SIZE,
  )
  let current = 0
  let revealed = false

  root.innerHTML = `
    <header class="memory-session-header py-4">
      <div class="min-w-0">
        <h1 class="text-xl font-bold">🧠 Term Memory</h1>
        <p class="text-sm text-base-content/70">Flip German terms, then grade yourself with the same SRS rules as review mode.</p>
      </div>
      <div class="memory-session-count">${queue.length} cards</div>
    </header>
    <div id="cardArea"></div>
    <div class="cta-bar">
      <button class="btn btn-secondary flex-1" id="revealBtn">Reveal</button>
      <button class="btn btn-secondary flex-1" id="againBtn" disabled>← Again</button>
      <button class="btn btn-primary flex-1" id="goodBtn" disabled>Good →</button>
    </div>
  `

  const cardArea = root.querySelector('#cardArea') as HTMLDivElement
  const revealBtn = root.querySelector('#revealBtn') as HTMLButtonElement
  const againBtn = root.querySelector('#againBtn') as HTMLButtonElement
  const goodBtn = root.querySelector('#goodBtn') as HTMLButtonElement

  function renderCard() {
    if (current >= queue.length) {
      cardArea.innerHTML = `
        <div class="card text-center bg-base-100 shadow">
          <h2 class="text-lg font-semibold">Session Complete</h2>
          <p class="mt-2 text-base-content/70">You cleared the current term deck. Come back when more cards are due.</p>
          <button onclick="location.hash='#/'" class="btn btn-primary mt-4">Back to Home</button>
        </div>
      `
      revealBtn.disabled = true
      againBtn.disabled = true
      goodBtn.disabled = true
      return
    }

    const { item } = queue[current]
    const linked = item.term.questionIds?.length || 0
    revealed = false

    cardArea.innerHTML = `
      <div class="memory-card card bg-base-100 shadow">
        <div class="flex items-center justify-between mb-4 gap-3">
          <span class="memory-progress">${current + 1}<span class="memory-progress-separator">/</span>${queue.length}</span>
          ${item.term.topic ? `<span class="badge badge-secondary">${item.term.topic}</span>` : ''}
        </div>
        <div class="memory-face ${revealed ? 'is-revealed' : ''}" id="memoryFace">
          <div class="memory-front" id="memoryFront">
            <div class="text-xs uppercase tracking-[0.18em] text-base-content/60">German term</div>
            <h2 class="mt-4 text-[clamp(2rem,9vw,2.75rem)] leading-tight font-bold break-words">${item.term.de}</h2>
            ${item.term.note ? `<p class="mt-4 text-sm text-base-content/70">${item.term.note}</p>` : ''}
          </div>
          <div class="memory-back ${revealed ? '' : 'hidden'}" id="memoryBack">
            <div class="memory-reference">
              <div class="text-xs uppercase tracking-[0.18em] text-base-content/50">German reference</div>
              <p class="mt-2 text-lg leading-snug font-semibold text-base-content/90">${item.term.de}</p>
            </div>
            <div class="memory-answer">
              <div class="text-xs uppercase tracking-[0.18em] text-base-content/60">English translation</div>
              <h3 class="mt-3 max-w-full break-words text-[clamp(1.75rem,8vw,2.5rem)] leading-tight font-bold text-primary">${item.term.en}</h3>
            </div>
            <div class="mt-5 flex max-w-full flex-wrap gap-2 text-sm text-base-content/70">
              ${item.term.topic ? `<span class="badge badge-outline whitespace-normal py-3 text-left leading-snug">${item.term.topic}</span>` : ''}
              ${linked > 0 ? `<span class="badge badge-outline whitespace-normal py-3 text-left leading-snug">${linked} linked question${linked === 1 ? '' : 's'}</span>` : ''}
            </div>
          </div>
        </div>
      </div>
    `

    revealBtn.disabled = false
    againBtn.disabled = true
    goodBtn.disabled = true
  }

  function reveal() {
    if (revealed || current >= queue.length) {
      return
    }

    revealed = true
    const back = root.querySelector('#memoryBack') as HTMLDivElement | null
    const face = root.querySelector('#memoryFace') as HTMLDivElement | null
    const front = root.querySelector('#memoryFront') as HTMLDivElement | null
    front?.classList.add('memory-front-revealed')
    back?.classList.remove('hidden')
    face?.classList.add('is-revealed')
    revealBtn.disabled = true
    againBtn.disabled = false
    goodBtn.disabled = false
  }

  function advance(grade: 'again' | 'good') {
    const currentItem = queue[current]
    const map = loadProgress()
    const nextMap = upsertCard(map, currentItem.item.studyId, (progress) => updateCard(progress, grade))
    saveProgress(nextMap)
    recordMemoryAnswer(grade === 'good')

    if (grade === 'again') {
      queue.push(currentItem)
    }

    current += 1
    renderCard()
  }

  revealBtn.addEventListener('click', reveal)
  againBtn.addEventListener('click', () => advance('again'))
  goodBtn.addEventListener('click', () => advance('good'))

  const onKey = (event: KeyboardEvent) => {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault()
      reveal()
      return
    }
    if (event.key === 'ArrowLeft' && !againBtn.disabled) {
      event.preventDefault()
      advance('again')
      return
    }
    if (event.key === 'ArrowRight' && !goodBtn.disabled) {
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
