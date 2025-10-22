import { navigate } from '../router'
import { ALL_DE } from '../state'
import { loadProgress } from '../storage'
import { Footer } from '../lib/footer'

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
      <h1 class="text-3xl font-bold text-center">🇩🇪 BürgerTest Trainer</h1>
      <p class="text-center text-base-content opacity-70 mt-2">Prepare for your German naturalization exam</p>
    </header>
    
    <div class="grid gap-4 sm:grid-cols-2">
      <div class="card bg-base-100 shadow">
        <h2 class="text-xl font-semibold mb-3">📚 Study Mode</h2>
        <p class="text-sm text-base-content opacity-70 mb-4">Spaced repetition learning with ${due} cards due today</p>
        <button id="reviewBtn" class="btn btn-primary w-full">Start Review Session</button>
      </div>
      
      <div class="card bg-base-100 shadow">
        <h2 class="text-xl font-semibold mb-3">📝 Exam Simulation</h2>
        <p class="text-sm text-base-content opacity-70 mb-4">Practice with 33 questions (30 federal + 3 Berlin)</p>
        <button id="examBtn" class="btn btn-primary w-full">Take Practice Exam</button>
      </div>
      
      <div class="card bg-base-100 shadow">
        <h2 class="text-xl font-semibold mb-3">🔍 Browse Questions</h2>
        <p class="text-sm text-base-content opacity-70 mb-4">Search and filter all ${ALL_DE.length} questions by topic</p>
        <button id="browseBtn" class="btn btn-secondary w-full">Browse & Search</button>
      </div>
      
      <div class="card bg-base-100 shadow">
        <h2 class="text-xl font-semibold mb-3">📊 Statistics</h2>
        <p class="text-sm text-base-content opacity-70 mb-4">View your progress, streak, and accuracy</p>
        <button id="statsBtn" class="btn btn-secondary w-full">View Stats</button>
      </div>
    </div>
  `
  
  root.querySelector('#reviewBtn')!.addEventListener('click', () => navigate('#/review'))
  root.querySelector('#examBtn')!.addEventListener('click', () => navigate('#/exam'))
  root.querySelector('#browseBtn')!.addEventListener('click', () => navigate('#/browse'))
  root.querySelector('#statsBtn')!.addEventListener('click', () => navigate('#/stats'))
  
  // Add footer to home page
  root.appendChild(Footer())
  
  return root
}
