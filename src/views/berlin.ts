import { ALL_BERLIN_DE, byId } from '../state'
import { loadProgress, saveProgress, upsertCard } from '../storage'
import type { Question, CardProgress } from '../types'
import { updateCard } from '../sm2'
import { Locales } from '../i18n'
import { berlinStudyId } from '../lib/study-ids'
import { pickStudyBatch } from '../lib/study-session'
import { recordReviewAnswer } from '../lib/study-stats'

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

export function BerlinView(): HTMLElement {
  const root = document.createElement('div')
  root.className = 'page'

  let queue = pickDueBatch()
  let current = 0
  let answeredCorrect = false
  const showEN = Locales.get()
  // Derived from the whole deck, not the due batch: the warning has to stand
  // while any Berlin question is still drafted, whatever is due today.
  const hasUnverified = ALL_BERLIN_DE.some((q) => q.unverified)

  root.innerHTML = `
    <header class="py-4 flex items-center justify-between gap-3">
      <div class="min-w-0">
        <h1 class="text-xl font-bold">🐻 Berlin State (${queue.length})</h1>
        <p class="text-sm text-base-content/70">The ${ALL_BERLIN_DE.length} state questions, on their own schedule.</p>
      </div>
      <label class="label cursor-pointer flex items-center gap-2">
        <input type="checkbox" id="langToggle" class="checkbox checkbox-sm" ${showEN ? 'checked' : ''}/>
        <span class="label-text">English helper</span>
      </label>
    </header>
    ${hasUnverified ? `
      <div class="alert alert-warning mb-4 text-sm">
        ⚠️ Draft content — these questions still need to be checked against the official
        Einbürgerungstest catalogue for Berlin.
      </div>
    ` : ''}
    <div id="cardArea"></div>
    <div class="cta-bar">
      <button class="btn btn-secondary flex-1" id="againBtn" disabled>
        ← Again <span class="hidden sm:inline">(Left)</span>
      </button>
      <button class="btn btn-primary flex-1" id="goodBtn" disabled>
        Good → <span class="hidden sm:inline">(Right)</span>
      </button>
    </div>
  `

  const langToggle = root.querySelector('#langToggle') as HTMLInputElement
  langToggle.addEventListener('change', () => {
    Locales.set(langToggle.checked)
    renderCard()
  })

  const cardArea = root.querySelector('#cardArea') as HTMLDivElement
  const againBtn = root.querySelector('#againBtn') as HTMLButtonElement
  const goodBtn = root.querySelector('#goodBtn') as HTMLButtonElement

  function renderCard() {
    if (ALL_BERLIN_DE.length === 0) {
      cardArea.innerHTML = `
        <div class="card text-center bg-base-100 shadow">
          <h2 class="text-lg font-semibold">No Berlin cards loaded</h2>
          <p class="mt-2 text-base-content opacity-70">Add the Berlin state questions to <code>src/data/questions_berlin_de.json</code> to start this deck.</p>
          <button onclick="location.hash='#/'" class="btn btn-primary mt-4">Back to Home</button>
        </div>
      `
      return
    }

    if (queue.length === 0) {
      cardArea.innerHTML = `
        <div class="card text-center bg-base-100 shadow">
          <h2 class="text-lg font-semibold">✅ Nothing due today</h2>
          <p class="mt-2 text-base-content opacity-70">The Berlin deck is scheduled ahead. Come back when these cards are due again.</p>
          <button onclick="location.hash='#/'" class="btn btn-primary mt-4">Back to Home</button>
        </div>
      `
      return
    }

    if (current >= queue.length) {
      cardArea.innerHTML = `
        <div class="card text-center bg-base-100 shadow">
          <h2 class="text-lg font-semibold">🎉 Session Complete!</h2>
          <p class="mt-2 text-base-content opacity-70">You cleared the Berlin deck. Come back when these cards are due again.</p>
          <button onclick="location.hash='#/'" class="btn btn-primary mt-4">Back to Home</button>
        </div>
      `
      return
    }

    const { q } = queue[current]
    const showEnglish = langToggle.checked
    const en = byId(q.id).en

    answeredCorrect = false

    cardArea.innerHTML = `
      <div class="card bg-base-100 shadow">
        <div class="flex items-center justify-between mb-4">
          <span class="badge badge-neutral">${current + 1} / ${queue.length}</span>
          <span class="badge badge-secondary">${q.topic}</span>
        </div>

        <h2 class="text-xl font-semibold mb-3">${q.question}</h2>
        ${showEnglish ? `<p class="text-base-content opacity-70 text-sm mb-4 italic">${en.question}</p>` : ''}

        <div class="grid gap-2" id="choices"></div>

        <div class="mt-4">
          <button id="hintBtn" class="btn btn-ghost btn-sm">
            💡 Show hint
          </button>
          <div id="hintBox" class="hidden mt-2 p-3 bg-muted rounded-lg text-sm"></div>
        </div>
      </div>
    `

    const choicesBox = cardArea.querySelector('#choices') as HTMLDivElement
    q.choices.forEach((c, idx) => {
      const btn = document.createElement('button')
      btn.className = 'w-full text-left border-2 border-border rounded-xl p-4 hover:bg-accent transition-colors'
      btn.innerHTML = `
        <div>${c}</div>
        ${showEnglish ? `<div class="text-muted-foreground text-xs mt-1">${en.choices[idx]}</div>` : ''}
      `
      btn.addEventListener('click', () => onChoose(idx))
      choicesBox.appendChild(btn)
    })

    const hintBtn = cardArea.querySelector('#hintBtn') as HTMLButtonElement
    const hintBox = cardArea.querySelector('#hintBox') as HTMLDivElement
    hintBtn.addEventListener('click', () => {
      hintBox.classList.remove('hidden')
      hintBox.innerHTML = showEnglish
        ? `<div>💡 ${q.hint}</div><div class="text-muted-foreground mt-1">${en.hint}</div>`
        : `💡 ${q.hint}`
    })

    againBtn.disabled = true
    goodBtn.disabled = true
  }

  function onChoose(idx: number) {
    const { q } = queue[current]
    const correct = idx === q.correctIndex
    answeredCorrect = correct

    const btns = Array.from(root.querySelectorAll('#choices button')) as HTMLButtonElement[]
    btns.forEach((b, i) => {
      b.disabled = true
      if (i === q.correctIndex) {
        b.classList.add('border-success/60', 'bg-success/10')
      }
      if (i === idx && !correct) {
        b.classList.add('border-destructive', 'bg-destructive/10')
      }
    })

    againBtn.disabled = false
    goodBtn.disabled = !correct // Good only when correct

    recordReviewAnswer(correct)
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
    current++
    renderCard()
  }

  againBtn.addEventListener('click', () => advance('again'))
  goodBtn.addEventListener('click', () => {
    if (answeredCorrect) advance('good')
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
