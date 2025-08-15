# BürgerTest Trainer (DE/EN) – Vite + TypeScript + Tailwind

A lightweight, mobile‑friendly, bilingual web app to prepare for the German naturalization test using spaced repetition (SM‑2) and exam simulation. Built as a static SPA (GitHub Pages ready) with browser‑only persistence via `localStorage`.

---

## Project Structure

```
bürgertest-trainer/
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
├─ postcss.config.js
├─ tailwind.config.js
├─ index.html
├─ README.md
├─ public/
│  └─ icons/ (optional PWA later)
├─ src/
│  ├─ styles.css
│  ├─ types.ts
│  ├─ i18n.ts
│  ├─ sm2.ts
│  ├─ storage.ts
│  ├─ state.ts
│  ├─ router.ts
│  ├─ main.ts
│  ├─ views/
│  │  ├─ home.ts
│  │  ├─ review.ts
│  │  ├─ exam.ts
│  │  ├─ browse.ts
│  │  └─ stats.ts
│  └─ data/
│     ├─ questions_de.json
│     └─ questions_en.json
└─ dist/ (build output)
```

> **Note:** The JSON datasets here include a small, representative sample. Replace with the full pools (IDs 1–310; Berlin items tagged `"Bundesland Berlin"`). Both DE/EN files share the same IDs and topics, differing only in text.

---

## package.json

```json
{
  "name": "burger-test-trainer",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "format": "prettier --write .",
    "deploy": "vite build && gh-pages -d dist"
  },
  "dependencies": {},
  "devDependencies": {
    "autoprefixer": "^10.4.20",
    "gh-pages": "^6.1.1",
    "postcss": "^8.4.41",
    "tailwindcss": "^3.4.10",
    "typescript": "^5.5.4",
    "vite": "^5.4.0"
  }
}
```

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "react-jsx",
    "sourceMap": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "noEmit": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "types": []
  },
  "include": ["src"]
}
```

## vite.config.ts

```ts
import { defineConfig } from 'vite'

export default defineConfig({
  base: '', // set to '/<repo-name>/' if deploying under a project subpath
})
```

## tailwind.config.js

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx,js}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a'
        }
      }
    }
  },
  plugins: []
}
```

## postcss.config.js

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

## index.html

```html
<!doctype html>
<html lang="de" class="h-full">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>BürgerTest Trainer</title>
    <meta name="description" content="DE/EN study app for the German citizenship test with spaced repetition and exam simulation." />
    <link rel="icon" href="/favicon.ico" />
  </head>
  <body class="h-full bg-white text-gray-900">
    <div id="app" class="min-h-screen flex flex-col"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

## src/styles.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Shared UI primitives */
.btn { @apply inline-flex items-center justify-center rounded-xl px-4 py-3 font-semibold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50; }
.btn-primary { @apply btn bg-brand-600 text-white hover:bg-brand-700 focus:ring-brand-600; }
.btn-secondary { @apply btn bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-300; }
.card { @apply bg-white rounded-2xl shadow p-4 sm:p-6; }
.page { @apply max-w-3xl w-full mx-auto px-4 pb-24; }
.nav { @apply sticky top-0 z-10 bg-white/80 backdrop-blur border-b; }
.kbd { @apply px-2 py-1 rounded-md bg-gray-100 border text-xs font-mono; }
.toggle { @apply inline-flex items-center gap-2; }
.badge { @apply inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700; }
.table { @apply w-full text-sm; }
.table th { @apply text-left font-semibold text-gray-600; }
.table td, .table th { @apply p-2; }

/* Mobile-friendly large tap targets */
.cta-bar { @apply fixed bottom-0 left-0 right-0 bg-white border-t p-3 flex gap-3; }
```

## src/types.ts

```ts
export type Topic =
  | 'Politik in der Demokratie'
  | 'Geschichte und Verantwortung'
  | 'Mensch und Gesellschaft'
  | 'Bundesland Berlin'

export interface Question {
  id: number
  question: string
  choices: string[]
  correctIndex: number
  hint: string
  topic: Topic
}

export interface CardProgress {
  id: number
  interval: number // in days
  ease: number // SM-2 ease factor
  dueDate: string // ISO date
}

export type ProgressMap = Record<string, CardProgress>

export interface Stats {
  streak: number
  accuracy: number // 0..1
  totalAnswered: number
  lastStudyDate?: string // ISO date for streak
}

export interface ExamAttempt {
  timestamp: string // ISO
  score: number
  total: number
  questionIds: number[]
  incorrect: { id: number; chosenIndex: number }[]
}

export type LangHelper = {
  showEnglish: boolean
}
```

## src/i18n.ts

```ts
export const Locales = {
  get(): boolean {
    const raw = localStorage.getItem('citizenTest_langHelper')
    try { return raw ? JSON.parse(raw).showEnglish === true : false } catch { return false }
  },
  set(showEnglish: boolean) {
    localStorage.setItem('citizenTest_langHelper', JSON.stringify({ showEnglish }))
  }
}
```

## src/sm2.ts

```ts
import type { CardProgress } from './types'

/**
 * Minimal SM-2 update using two grades: Again (q=2), Good (q=4)
 * - Again: reset interval to 0, reduce EF
 * - Good: grow interval by EF
 * EF bounded to [1.3, 2.8]
 */
export function updateCard(prev: CardProgress, grade: 'again' | 'good', today = new Date()): CardProgress {
  const ef = Math.max(1.3, Math.min(2.8,
    grade === 'again'
      ? prev.ease - 0.20
      : prev.ease + 0.05 // slight nudge up on Good
  ))

  let interval = prev.interval
  if (grade === 'again') {
    interval = 0
  } else {
    interval = interval <= 0 ? 1 : Math.round(interval * ef)
  }

  const due = new Date(today)
  due.setDate(due.getDate() + interval)

  return { id: prev.id, ease: ef, interval, dueDate: due.toISOString() }
}
```

## src/storage.ts

```ts
import type { ProgressMap, Stats, ExamAttempt, CardProgress } from './types'

const KEYS = {
  progress: 'citizenTest_progress',
  stats: 'citizenTest_stats',
  exam: 'citizenTest_exam', // array of attempts
} as const

export function loadProgress(): ProgressMap {
  try { return JSON.parse(localStorage.getItem(KEYS.progress) || '{}') } catch { return {} }
}
export function saveProgress(map: ProgressMap) {
  localStorage.setItem(KEYS.progress, JSON.stringify(map))
}

export function loadStats(): Stats {
  try {
    const d = JSON.parse(localStorage.getItem(KEYS.stats) || '{}')
    return { streak: d.streak || 0, accuracy: d.accuracy || 0, totalAnswered: d.totalAnswered || 0, lastStudyDate: d.lastStudyDate }
  } catch { return { streak: 0, accuracy: 0, totalAnswered: 0 } }
}
export function saveStats(s: Stats) {
  localStorage.setItem(KEYS.stats, JSON.stringify(s))
}

export function loadExamAttempts(): ExamAttempt[] {
  try { return JSON.parse(localStorage.getItem(KEYS.exam) || '[]') } catch { return [] }
}
export function saveExamAttempts(a: ExamAttempt[]) {
  localStorage.setItem(KEYS.exam, JSON.stringify(a))
}

export function upsertCard(map: ProgressMap, id: number, updater: (p: CardProgress) => CardProgress): ProgressMap {
  const today = new Date()
  const prev = map[id] ?? { id, interval: 0, ease: 2.5, dueDate: today.toISOString() }
  const next = updater(prev)
  return { ...map, [id]: next }
}

export function resetAll() {
  localStorage.removeItem(KEYS.progress)
  localStorage.removeItem(KEYS.stats)
  localStorage.removeItem(KEYS.exam)
}
```

## src/state.ts

```ts
import de from './data/questions_de.json'
import en from './data/questions_en.json'
import type { Question, ProgressMap, Stats, Topic } from './types'
import { loadProgress, loadStats } from './storage'

export const ALL_DE: Question[] = de as any
export const ALL_EN: Question[] = en as any

export function byId(id: number) {
  const qd = ALL_DE.find(q => q.id === id)
  const qe = ALL_EN.find(q => q.id === id)
  return { de: qd!, en: qe! }
}

export const State = {
  progress: loadProgress() as ProgressMap,
  stats: loadStats() as Stats,
  filter: { topic: 'ALL' as Topic | 'ALL', search: '' },
}
```

## src/router.ts

```ts
export type Route = '#/' | '#/review' | '#/exam' | '#/browse' | '#/stats'

export function navigate(to: Route) {
  if (location.hash !== to) location.hash = to
}

const listeners: Array<(route: Route) => void> = []
export function onRouteChange(fn: (route: Route) => void) { listeners.push(fn) }

export function startRouter() {
  const handler = () => {
    const h = (location.hash || '#/') as Route
    listeners.forEach(l => l(h))
  }
  addEventListener('hashchange', handler)
  handler()
}
```

## src/views/home.ts

```ts
import { navigate } from '../router'
import { ALL_DE } from '../state'
import { loadProgress } from '../storage'

function dueCountToday(): number {
  const prog = loadProgress()
  const todayISO = new Date().toISOString().slice(0,10)
  return ALL_DE.filter(q => {
    const p = prog[q.id]
    return p ? p.dueDate.slice(0,10) <= todayISO : true // unseen are due
  }).length
}

export function HomeView(): HTMLElement {
  const root = document.createElement('div')
  root.className = 'page'
  const due = dueCountToday()
  root.innerHTML = `
    <header class="py-6">
      <h1 class="text-2xl font-bold">BürgerTest Trainer</h1>
      <p class="text-sm text-gray-600">Prepare for the German citizenship test (DE/EN).</p>
    </header>

    <div class="grid gap-4 sm:grid-cols-2">
      <div class="card">
        <div class="flex items-baseline justify-between">
          <h2 class="text-lg font-semibold">Today</h2>
          <span class="badge">Due: ${due}</span>
        </div>
        <p class="mt-2 text-gray-700">Study with spaced repetition (20 cards/session).</p>
        <button class="btn-primary mt-4 w-full" id="reviewBtn">Start Review</button>
      </div>

      <div class="card">
        <h2 class="text-lg font-semibold">Exam Simulation</h2>
        <p class="mt-2 text-gray-700">Take a 33‑question practice test (Berlin‑specific included).</p>
        <button class="btn-secondary mt-4 w-full" id="examBtn">Start Exam</button>
      </div>

      <div class="card sm:col-span-2">
        <h2 class="text-lg font-semibold">Browse Questions</h2>
        <p class="mt-2 text-gray-700">Search and filter the full question pool.</p>
        <button class="btn-secondary mt-4 w-full" id="browseBtn">Browse</button>
      </div>

      <div class="card sm:col-span-2">
        <h2 class="text-lg font-semibold">Stats</h2>
        <p class="mt-2 text-gray-700">Streak, accuracy, due count.</p>
        <button class="btn-secondary mt-4 w-full" id="statsBtn">View Stats</button>
      </div>
    </div>
  `
  root.querySelector('#reviewBtn')!.addEventListener('click', () => navigate('#/review'))
  root.querySelector('#examBtn')!.addEventListener('click', () => navigate('#/exam'))
  root.querySelector('#browseBtn')!.addEventListener('click', () => navigate('#/browse'))
  root.querySelector('#statsBtn')!.addEventListener('click', () => navigate('#/stats'))
  return root
}
```

## src/views/review\.ts

```ts
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
    if (!p) { newOnes.push(q); continue }
    if (p.dueDate.slice(0,10) <= todayISO) due.push(q)
  }

  const selected: Question[] = []
  due.sort((a,b) => new Date(prog[a.id]?.dueDate||0).getTime() - new Date(prog[b.id]?.dueDate||0).getTime())
  for (const q of due) { if (selected.length < BATCH_SIZE) selected.push(q) }
  let i = 0
  while (selected.length < BATCH_SIZE && i < newOnes.length) { selected.push(newOnes[i++]) }

  return selected.map(q => ({ q, progress: prog[q.id] ?? { id: q.id, interval: 0, ease: 2.5, dueDate: new Date().toISOString() } }))
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
      <h1 class="text-xl font-bold">Review (${queue.length})</h1>
      <label class="toggle"><input type="checkbox" id="langToggle" ${showEN ? 'checked' : ''}/> <span>English helper</span></label>
    </header>
    <div id="cardArea"></div>
    <div class="cta-bar">
      <button class="btn-secondary flex-1" id="againBtn" disabled>← Again <span class="hidden sm:inline">(Left)</span></button>
      <button class="btn-primary flex-1" id="goodBtn" disabled>Good → <span class="hidden sm:inline">(Right)</span></button>
    </div>
  `

  const langToggle = root.querySelector('#langToggle') as HTMLInputElement
  langToggle.addEventListener('change', () => { Locales.set(langToggle.checked); renderCard() })

  const cardArea = root.querySelector('#cardArea') as HTMLDivElement
  const againBtn = root.querySelector('#againBtn') as HTMLButtonElement
  const goodBtn = root.querySelector('#goodBtn') as HTMLButtonElement

  function renderCard() {
    if (current >= queue.length) {
      cardArea.innerHTML = `<div class="card"><h2 class="text-lg font-semibold">Session complete</h2><p class="mt-2">Great job! Come back later for more.</p></div>`
      againBtn.disabled = true; goodBtn.disabled = true
      return
    }

    const { q } = queue[current]
    const showEnglish = (root.querySelector('#langToggle') as HTMLInputElement).checked
    const en = byId(q.id).en

    answeredCorrect = false

    cardArea.innerHTML = `
      <div class="card">
        <div class="flex items-center justify-between">
          <span class="badge">#${q.id}</span>
          <span class="badge">${q.topic}</span>
        </div>
        <h2 class="mt-3 text-xl font-semibold">${q.question}</h2>
        ${showEnglish ? `<p class="mt-1 text-gray-600">${en.question}</p>` : ''}
        <div class="mt-4 grid gap-2" id="choices"></div>
        <button id="hintBtn" class="mt-4 btn-secondary">Hint</button>
        <div id="hintBox" class="mt-2 text-sm text-gray-700 hidden"></div>
      </div>
    `

    const choicesBox = cardArea.querySelector('#choices') as HTMLDivElement
    q.choices.forEach((c, idx) => {
      const btn = document.createElement('button')
      btn.className = 'w-full text-left border rounded-xl p-3 hover:bg-gray-50'
      btn.innerHTML = `<div>${c}</div>${showEnglish ? `<div class='text-gray-600 text-sm'>${byId(q.id).en.choices[idx]}</div>` : ''}`
      btn.addEventListener('click', () => onChoose(idx, btn))
      choicesBox.appendChild(btn)
    })

    const hintBtn = cardArea.querySelector('#hintBtn') as HTMLButtonElement
    const hintBox = cardArea.querySelector('#hintBox') as HTMLDivElement
    hintBtn.addEventListener('click', () => {
      const deHint = q.hint
      const enHint = byId(q.id).en.hint
      hintBox.classList.remove('hidden')
      hintBox.innerHTML = showEnglish ? `<div>💡 ${deHint}</div><div class="text-gray-600">${enHint}</div>` : `💡 ${deHint}`
    })

    againBtn.disabled = true
    goodBtn.disabled = true
  }

  function onChoose(idx: number, btn: HTMLButtonElement) {
    const { q } = queue[current]
    const correct = idx === q.correctIndex
    answeredCorrect = correct

    // Visual feedback
    const btns = Array.from(root.querySelectorAll('#choices button')) as HTMLButtonElement[]
    btns.forEach((b, i) => {
      b.disabled = true
      if (i === q.correctIndex) b.classList.add('bg-green-50', 'border-green-400')
      if (i === idx && !correct) b.classList.add('bg-red-50', 'border-red-400')
    })

    againBtn.disabled = false
    goodBtn.disabled = !correct // Good only when correct

    // Update accuracy stats immediately
    const stats = loadStats()
    const total = stats.totalAnswered + 1
    const correctCount = Math.round(stats.accuracy * stats.totalAnswered) + (correct ? 1 : 0)
    stats.totalAnswered = total
    stats.accuracy = correctCount / total

    // streak
    const today = new Date().toISOString().slice(0,10)
    if (stats.lastStudyDate) {
      const prev = stats.lastStudyDate
      if (prev === today) {
        // already studying today
      } else {
        // check if consecutive day
        const dprev = new Date(prev)
        const d = new Date(today)
        const diff = (d.getTime() - dprev.getTime()) / 86400000
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
  goodBtn.addEventListener('click', () => { if (answeredCorrect) advance('good') })

  // Keyboard shortcuts
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft' && !againBtn.disabled) advance('again')
    if (e.key === 'ArrowRight' && !goodBtn.disabled) advance('good')
  }
  window.addEventListener('keydown', onKey)
  root.addEventListener('removed', () => window.removeEventListener('keydown', onKey))

  renderCard()
  return root
}
```

## src/views/exam.ts

```ts
import { ALL_DE } from '../state'
import { loadExamAttempts, saveExamAttempts, loadProgress, saveProgress, upsertCard } from '../storage'
import type { Question } from '../types'

function sampleExam(): Question[] {
  const berlin = ALL_DE.filter(q => q.topic === 'Bundesland Berlin')
  const federal = ALL_DE.filter(q => q.topic !== 'Bundesland Berlin')
  const pick = (arr: Question[], n: number) => {
    const a = [...arr]
    const out: Question[] = []
    while (out.length < n && a.length) {
      const i = Math.floor(Math.random() * a.length)
      out.push(a.splice(i,1)[0])
    }
    return out
  }
  return [...pick(federal, 30), ...pick(berlin, 3)]
}

export function ExamView(): HTMLElement {
  const root = document.createElement('div')
  root.className = 'page'

  const questions = sampleExam()
  const answers = new Map<number, number>()
  let idx = 0

  root.innerHTML = `
    <header class="py-4">
      <h1 class="text-xl font-bold">Exam Simulation</h1>
      <p class="text-sm text-gray-600">33 questions · No timer · Pass with 17 correct</p>
    </header>
    <div id="area"></div>
    <div class="cta-bar">
      <button class="btn-secondary flex-1" id="backBtn">Back</button>
      <button class="btn-primary flex-1" id="nextBtn">Next</button>
    </div>
  `

  const area = root.querySelector('#area') as HTMLDivElement
  const backBtn = root.querySelector('#backBtn') as HTMLButtonElement
  const nextBtn = root.querySelector('#nextBtn') as HTMLButtonElement

  function render() {
    const q = questions[idx]
    const chosen = answers.get(q.id)
    area.innerHTML = `
      <div class="card">
        <div class="flex items-center justify-between">
          <span class="badge">${idx+1} / ${questions.length}</span>
          <span class="badge">${q.topic}</span>
        </div>
        <h2 class="mt-3 text-xl font-semibold">${q.question}</h2>
        <div class="mt-4 grid gap-2" id="choices"></div>
      </div>
    `

    const choicesBox = area.querySelector('#choices') as HTMLDivElement
    q.choices.forEach((c, i) => {
      const b = document.createElement('button')
      b.className = 'w-full text-left border rounded-xl p-3 hover:bg-gray-50'
      b.textContent = c
      if (chosen === i) b.classList.add('bg-gray-100')
      b.addEventListener('click', () => { answers.set(q.id, i); render() })
      choicesBox.appendChild(b)
    })

    backBtn.disabled = idx === 0
    nextBtn.textContent = idx === questions.length - 1 ? 'Finish' : 'Next'
  }

  function finish() {
    const incorrect: { id: number; chosenIndex: number }[] = []
    let correct = 0
    for (const q of questions) {
      const c = answers.get(q.id)
      if (c === q.correctIndex) correct++
      else incorrect.push({ id: q.id, chosenIndex: c ?? -1 })
    }

    const pass = correct >= 17
    const attempts = loadExamAttempts()
    attempts.unshift({
      timestamp: new Date().toISOString(),
      score: correct,
      total: questions.length,
      questionIds: questions.map(q => q.id),
      incorrect
    })
    saveExamAttempts(attempts.slice(0, 20))

    area.innerHTML = `
      <div class="card">
        <h2 class="text-xl font-bold">Result: ${correct}/${questions.length} ${pass ? '✅ Pass' : '❌ Fail'}</h2>
        <p class="text-gray-700 mt-2">Wrong answers listed below. You can add them to your review deck.</p>
        <div class="mt-4" id="wrongList"></div>
        <button id="addWrong" class="btn-primary mt-4">Add wrong answers to review deck</button>
        <h3 class="mt-6 font-semibold">Previous attempts</h3>
        <ul class="mt-2 text-sm text-gray-600">${attempts.map(a => `<li>${new Date(a.timestamp).toLocaleString()} – ${a.score}/${a.total}</li>`).join('')}</ul>
      </div>
    `

    const wrongList = area.querySelector('#wrongList') as HTMLDivElement
    wrongList.innerHTML = incorrect.length ? incorrect.map(w => {
      const q = questions.find(qq => qq.id === w.id)!
      return `<div class="mt-3"><div class="font-medium">#${q.id} ${q.question}</div>
        <div class="text-sm text-red-700">Your answer: ${w.chosenIndex>=0? q.choices[w.chosenIndex]: '—'}</div>
        <div class="text-sm text-green-700">Correct: ${q.choices[q.correctIndex]}</div></div>`
    }).join('') : '<p class="text-sm">🎉 No wrong answers!</p>'

    const addWrong = area.querySelector('#addWrong') as HTMLButtonElement
    addWrong.addEventListener('click', () => {
      const map = loadProgress()
      let m = map
      for (const w of incorrect) {
        m = upsertCard(m, w.id, (p) => ({ ...p, interval: 0, dueDate: new Date().toISOString() }))
      }
      saveProgress(m)
      addWrong.disabled = true
      addWrong.textContent = 'Added to review deck ✓'
    })
  }

  backBtn.addEventListener('click', () => { if (idx>0) { idx--; render() } })
  nextBtn.addEventListener('click', () => { if (idx < questions.length-1) { idx++; render() } else { finish() } })

  render()
  return root
}
```

## src/views/browse.ts

```ts
import { ALL_DE, byId, State } from '../state'
import type { Topic } from '../types'
import { Locales } from '../i18n'

const TOPICS: Array<{ label: string; value: Topic | 'ALL' }> = [
  { label: 'All Topics', value: 'ALL' },
  { label: 'Politik in der Demokratie', value: 'Politik in der Demokratie' },
  { label: 'Geschichte und Verantwortung', value: 'Geschichte und Verantwortung' },
  { label: 'Mensch und Gesellschaft', value: 'Mensch und Gesellschaft' },
  { label: 'Bundesland Berlin', value: 'Bundesland Berlin' },
]

export function BrowseView(): HTMLElement {
  const root = document.createElement('div')
  root.className = 'page'

  const showEN = Locales.get()

  root.innerHTML = `
    <header class="py-4">
      <h1 class="text-xl font-bold">Browse & Search</h1>
      <div class="mt-3 flex flex-col sm:flex-row gap-3">
        <input id="search" placeholder="Search keyword…" class="border rounded-xl px-3 py-2 w-full sm:w-1/2" />
        <select id="topic" class="border rounded-xl px-3 py-2 w-full sm:w-1/2"></select>
        <label class="toggle"><input type="checkbox" id="langToggle" ${showEN?'checked':''}/> <span>English helper</span></label>
      </div>
    </header>
    <div class="card overflow-x-auto">
      <table class="table" id="tbl">
        <thead><tr><th class="w-16">ID</th><th>Question</th><th class="w-64">Choices</th></tr></thead>
        <tbody></tbody>
      </table>
    </div>
  `

  const select = root.querySelector('#topic') as HTMLSelectElement
  for (const t of TOPICS) {
    const o = document.createElement('option')
    o.value = t.value
    o.textContent = t.label
    select.appendChild(o)
  }

  const search = root.querySelector('#search') as HTMLInputElement
  const langToggle = root.querySelector('#langToggle') as HTMLInputElement
  langToggle.addEventListener('change', () => { Locales.set(langToggle.checked); render() })

  function render() {
    State.filter.search = search.value.trim()
    State.filter.topic = (select.value as any)

    let list = ALL_DE
    if (State.filter.topic !== 'ALL') list = list.filter(q => q.topic === State.filter.topic)
    if (State.filter.search) {
      const s = State.filter.search.toLowerCase()
      list = list.filter(q => q.question.toLowerCase().includes(s) || q.choices.some(c => c.toLowerCase().includes(s)))
    }

    const tbody = root.querySelector('tbody') as HTMLTableSectionElement
    tbody.innerHTML = ''

    for (const q of list) {
      const tr = document.createElement('tr')
      tr.innerHTML = `
        <td class="align-top">${q.id}</td>
        <td class="align-top">
          <div class="font-medium">${q.question}</div>
          ${langToggle.checked ? `<div class='text-gray-600 text-sm'>${byId(q.id).en.question}</div>` : ''}
        </td>
        <td class="align-top">
          <ul class="space-y-1">${q.choices.map((c,i)=>`<li class="choice" data-i="${i}">${c}${langToggle.checked? `<div class='text-gray-600 text-xs'>${byId(q.id).en.choices[i]}</div>`:''}</li>`).join('')}</ul>
          <button class="mt-2 text-sm underline text-brand-700" data-reveal>Reveal answer</button>
          <div class="mt-1 hidden text-sm" data-ans>Correct: <span class="text-green-700 font-medium">${q.choices[q.correctIndex]}</span></div>
        </td>`
      const reveal = tr.querySelector('[data-reveal]') as HTMLButtonElement
      const ans = tr.querySelector('[data-ans]') as HTMLDivElement
      reveal.addEventListener('click', () => ans.classList.toggle('hidden'))
      tbody.appendChild(tr)
    }
  }

  search.addEventListener('input', render)
  select.addEventListener('change', render)
  render()
  return root
}
```

## src/views/stats.ts

```ts
import { loadProgress, resetAll, loadStats } from '../storage'

function dueToday(): number {
  const prog = loadProgress()
  const today = new Date().toISOString().slice(0,10)
  return Object.values(prog).filter(p => p.dueDate.slice(0,10) <= today).length
}

export function StatsView(): HTMLElement {
  const root = document.createElement('div')
  root.className = 'page'
  const stats = loadStats()
  const due = dueToday()

  root.innerHTML = `
    <header class="py-4">
      <h1 class="text-xl font-bold">Stats</h1>
    </header>
    <div class="grid gap-4 sm:grid-cols-3">
      <div class="card"><div class="text-gray-600 text-sm">Streak</div><div class="text-3xl font-bold">${stats.streak || 0} days</div></div>
      <div class="card"><div class="text-gray-600 text-sm">Accuracy</div><div class="text-3xl font-bold">${Math.round((stats.accuracy||0)*100)}%</div></div>
      <div class="card"><div class="text-gray-600 text-sm">Due Today</div><div class="text-3xl font-bold">${due}</div></div>
    </div>

    <div class="card mt-4">
      <h2 class="text-lg font-semibold">Reset</h2>
      <p class="text-sm text-gray-700 mt-1">This clears all local progress, stats, and exam history.</p>
      <button class="btn-secondary mt-3" id="resetBtn">Reset Progress</button>
    </div>
  `

  root.querySelector('#resetBtn')!.addEventListener('click', () => {
    if (confirm('Reset all local data?')) { resetAll(); location.reload() }
  })

  return root
}
```

## src/main.ts

```ts
import './styles.css'
import { startRouter, onRouteChange, Route } from './router'
import { HomeView } from './views/home'
import { ReviewView } from './views/review'
import { ExamView } from './views/exam'
import { BrowseView } from './views/browse'
import { StatsView } from './views/stats'

function shell(content: HTMLElement) {
  const app = document.getElementById('app')!
  app.innerHTML = `
    <nav class="nav">
      <div class="max-w-3xl mx-auto px-4 h-14 flex items-center gap-3">
        <button data-nav="#/" class="px-3 py-2 rounded-lg hover:bg-gray-100 font-semibold">Home</button>
        <button data-nav="#/review" class="px-3 py-2 rounded-lg hover:bg-gray-100">Review</button>
        <button data-nav="#/exam" class="px-3 py-2 rounded-lg hover:bg-gray-100">Exam</button>
        <button data-nav="#/browse" class="px-3 py-2 rounded-lg hover:bg-gray-100">Browse</button>
        <button data-nav="#/stats" class="ml-auto px-3 py-2 rounded-lg hover:bg-gray-100">Stats</button>
      </div>
    </nav>
    <main class="flex-1"> </main>
  `
  const main = app.querySelector('main')!
  main.appendChild(content)
  ;(app.querySelectorAll('[data-nav]') as NodeListOf<HTMLButtonElement>).forEach(b => b.addEventListener('click', () => location.hash = b.dataset.nav!))
}

function render(route: Route) {
  let view: HTMLElement
  switch (route) {
    case '#/review': view = ReviewView(); break
    case '#/exam': view = ExamView(); break
    case '#/browse': view = BrowseView(); break
    case '#/stats': view = StatsView(); break
    default: view = HomeView()
  }
  // Emit a custom event when a view is removed (for cleanup like key handlers)
  const app = document.getElementById('app')!
  const oldMain = app.querySelector('main')
  if (oldMain) { oldMain.dispatchEvent(new Event('removed')) }
  shell(view)
}

onRouteChange(render)
startRouter()
```

## src/data/questions\_de.json (sample)

```json
[
  {
    "id": 1,
    "question": "Wie heißt die Verfassung Deutschlands?",
    "choices": ["Grundgesetz", "Bundesgesetz", "Gesetzbuch", "Verfassungsgesetz"],
    "correctIndex": 0,
    "hint": "Es wurde 1949 eingeführt.",
    "topic": "Politik in der Demokratie"
  },
  {
    "id": 2,
    "question": "Welches Tier ist das Wappentier von Berlin?",
    "choices": ["Bär", "Adler", "Löwe", "Pferd"],
    "correctIndex": 0,
    "hint": "Es steht auch auf der Berliner Flagge.",
    "topic": "Bundesland Berlin"
  },
  {
    "id": 3,
    "question": "Wann war die Wiedervereinigung Deutschlands?",
    "choices": ["1990", "1989", "2001", "1999"],
    "correctIndex": 0,
    "hint": "Im Oktober.",
    "topic": "Geschichte und Verantwortung"
  },
  {
    "id": 4,
    "question": "Was ist ein Grundrecht in Deutschland?",
    "choices": ["Meinungsfreiheit", "Recht auf Arbeit", "Schulpflicht", "Militärdienst"],
    "correctIndex": 0,
    "hint": "Artikel 5.",
    "topic": "Politik in der Demokratie"
  }
]
```

## src/data/questions\_en.json (sample)

```json
[
  {
    "id": 1,
    "question": "What is the name of Germany's constitution?",
    "choices": ["Basic Law", "Federal Law", "Code of Laws", "Constitutional Law"],
    "correctIndex": 0,
    "hint": "It was introduced in 1949.",
    "topic": "Politik in der Demokratie"
  },
  {
    "id": 2,
    "question": "Which animal is the coat of arms of Berlin?",
    "choices": ["Bear", "Eagle", "Lion", "Horse"],
    "correctIndex": 0,
    "hint": "It's also on Berlin's flag.",
    "topic": "Bundesland Berlin"
  },
  {
    "id": 3,
    "question": "When was German reunification?",
    "choices": ["1990", "1989", "2001", "1999"],
    "correctIndex": 0,
    "hint": "In October.",
    "topic": "Geschichte und Verantwortung"
  },
  {
    "id": 4,
    "question": "What is a fundamental right in Germany?",
    "choices": ["Freedom of expression", "Right to work", "Compulsory schooling", "Military service"],
    "correctIndex": 0,
    "hint": "Article 5.",
    "topic": "Politik in der Demokratie"
  }
]
```

## README.md

````md
# BürgerTest Trainer

A static, mobile‑friendly SPA to prepare for the German naturalization exam. Bilingual (DE/EN), spaced repetition (SM‑2), and exam simulation (30 federal + 3 Berlin) with local storage persistence.

## Features
- **Study Mode (SM‑2)**: Two buttons (Again/Good), batch size 20, keyboard shortcuts (←/→), hints, DE first with optional EN helper.
- **Exam Simulation**: 33 questions (30 federal + 3 Berlin), pass @ 17, results with incorrect list, add wrong answers to review deck, attempts saved.
- **Browse/Search**: Topic filter + keyword search, reveal correct answers, EN helper toggle.
- **Stats**: Streak, accuracy, due today; reset option.
- **Persistence**: `localStorage` keys: `citizenTest_progress`, `citizenTest_stats`, `citizenTest_exam`, plus `citizenTest_langHelper`.

## Tech
- TypeScript (vanilla), Vite, TailwindCSS. Static deploy to GitHub Pages.

## Getting Started
```bash
pnpm i   # or npm i / yarn
pnpm dev # open http://localhost:5173
````

## Build

```bash
pnpm build
```

## Deploy to GitHub Pages

1. Ensure `vite.config.ts` `base` matches your repo path if publishing at `https://<user>.github.io/<repo>/` (e.g., `base: '/bürgertest-trainer/'`).
2. `pnpm add -D gh-pages`
3. `pnpm deploy` (runs `vite build` then publishes `dist/`).

## Data

Replace `src/data/questions_de.json` / `questions_en.json` with full pools. Schema:

```json
{
  "id": 1,
  "question": "…",
  "choices": ["…", "…", "…", "…"],
  "correctIndex": 0,
  "hint": "…",
  "topic": "Politik in der Demokratie" | "Geschichte und Verantwortung" | "Mensch und Gesellschaft" | "Bundesland Berlin"
}
```

Both DE/EN files must share identical `id` and `topic` values so the translation helper aligns.

## Notes

- **Batch selection**: Due cards first (by `dueDate`), then unseen to fill 20.
- **SM‑2**: Minimal two‑grade interpretation; EF ∈ [1.3, 2.8]; `Good` grows interval, `Again` resets and reinserts in session.
- **Accessibility**: Large tap targets, high contrast, keyboard shortcuts.
- **PWA**: Not included by default; can be added later.

```

---

## Implementation Status vs. Requirements
- ✅ Study Mode (SM‑2), two buttons, batch size 20, keyboard shortcuts, hint behavior, translation toggle, large buttons.
- ✅ Exam simulation 30+3, pass @17, results with incorrect + add to review, attempts persisted.
- ✅ Browse & Search with topic filter, reveal correct on click, DE/EN helper.
- ✅ Stats: streak, accuracy, due today; reset option.
- ✅ LocalStorage keys per spec (+ `citizenTest_langHelper`).
- ✅ Mobile-first layout with Tailwind.
- 🔧 Data files: include sample only; swap in full datasets.
- 🔜 (Optional) PWA.

---

## QA Checklist
- Review: Left/Right arrows trigger Again/Good; Good only enabled after correct selection.
- Session: Wrong answers reappear later within same 20-card batch.
- Exam: Random 30 federal + 3 Berlin each attempt; results saved (keep 20 recent).
- Browse: Filter + search responsive; reveal answer on tap; EN helper reflects global toggle.
- Stats: Streak increments on consecutive days; Reset clears everything.
- Persistence keys: `citizenTest_progress`, `citizenTest_stats`, `citizenTest_exam`, `citizenTest_langHelper`.

---

Happy studying! 🇩🇪🎓

```
