import { ALL_DE, byId } from '../state'
import { loadProgress, saveProgress, upsertCard, loadStats, saveStats } from '../storage'
import type { Question, CardProgress } from '../types'
import { updateCard } from '../sm2'
import { Locales } from '../i18n'

const BATCH_SIZE = 20

type SessionItem = { q: Question; progress: CardProgress }

function pickDueBatch(): SessionItem[] {
  const prog = loadProgress()
  const todayISO = new Date().toISOString().slice(0,10)

  const due: Question[] = []
  const newOnes: Question[] = []

  for (const q of ALL_DE) {
    const p = prog[q.id]
    if (!p) { 
      newOnes.push(q)
      continue 
    }
    if (p.dueDate.slice(0,10) <= todayISO) {
      due.push(q)
    }
  }

  const selected: Question[] = []
  // Sort due cards by due date (oldest first)
  due.sort((a,b) => {
    const aDate = prog[a.id]?.dueDate || '0'
    const bDate = prog[b.id]?.dueDate || '0'
    return new Date(aDate).getTime() - new Date(bDate).getTime()
  })
  
  // Add due cards first
  for (const q of due) { 
    if (selected.length < BATCH_SIZE) selected.push(q) 
  }
  
  // Fill remaining slots with new cards
  let i = 0
  while (selected.length < BATCH_SIZE && i < newOnes.length) { 
    selected.push(newOnes[i++]) 
  }

  return selected.map(q => ({ 
    q, 
    progress: prog[q.id] ?? { 
      id: q.id, 
      interval: 0, 
      ease: 2.5, 
      dueDate: new Date().toISOString() 
    } 
  }))
}

export function ReviewView(): HTMLElement {
  const root = document.createElement('div')
  root.className = 'page'

  let queue = pickDueBatch()
  let current = 0
  let answeredCorrect = false
  const showEN = Locales.get()

  root.innerHTML = `
    <header class="py-4 flex items-center justify-between">
      <h1 class="text-xl font-bold">📚 Review (${queue.length})</h1>
      <label class="label cursor-pointer flex items-center gap-2">
        <input type="checkbox" id="langToggle" class="checkbox checkbox-sm" ${showEN ? 'checked' : ''}/>
        <span class="label-text">English helper</span>
      </label>
    </header>
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
    if (current >= queue.length) {
      cardArea.innerHTML = `
        <div class="card text-center bg-base-100 shadow">
          <h2 class="text-lg font-semibold">🎉 Session Complete!</h2>
          <p class="mt-2 text-base-content opacity-70">Great job! Come back later for more cards.</p>
          <button onclick="location.hash='#/'" class="btn btn-primary mt-4">Back to Home</button>
        </div>
      `
      return
    }

    const { q } = queue[current]
    const showEnglish = (root.querySelector('#langToggle') as HTMLInputElement).checked
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
      const deHint = q.hint
      const enHint = byId(q.id).en.hint
      hintBox.classList.remove('hidden')
      hintBox.innerHTML = showEnglish 
        ? `<div>💡 ${deHint}</div><div class="text-muted-foreground mt-1">${enHint}</div>` 
        : `💡 ${deHint}`
    })

    againBtn.disabled = true
    goodBtn.disabled = true
  }

  function onChoose(idx: number) {
    const { q } = queue[current]
    const correct = idx === q.correctIndex
    answeredCorrect = correct

    // Visual feedback
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

    // Update accuracy stats immediately
    const stats = loadStats()
    const total = stats.totalAnswered + 1
    const correctCount = Math.round(stats.accuracy * stats.totalAnswered) + (correct ? 1 : 0)
    stats.totalAnswered = total
    stats.accuracy = correctCount / total

    // Update streak
    const today = new Date().toISOString().slice(0,10)
    if (stats.lastStudyDate) {
      const prev = stats.lastStudyDate
      if (prev === today) {
        // already studying today, don't change streak
      } else {
        // check if consecutive day
        const prevDate = new Date(prev)
        const todayDate = new Date(today)
        const diff = Math.floor((todayDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24))
        stats.streak = diff === 1 ? stats.streak + 1 : 1
      }
    } else {
      stats.streak = 1
    }
    stats.lastStudyDate = today
    saveStats(stats)
  }

  function advance(grade: 'again'|'good') {
    const map = loadProgress()
    const item = queue[current]
    const updatedMap = upsertCard(map, item.q.id, (p) => updateCard(p, grade))
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
