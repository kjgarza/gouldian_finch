import { navigate } from '../router'
import { ALL_BERLIN_DE, ALL_DE, ALL_QUESTIONS_DE, ALL_TERMS } from '../state'
import { loadProgress } from '../storage'
import { Footer } from '../lib/footer'
import { countDueIncludingUnseen } from '../lib/study-session'
import { berlinStudyId, questionStudyId, termStudyId } from '../lib/study-ids'

function reviewDueCountToday(): number {
  const prog = loadProgress()
  return countDueIncludingUnseen(
    ALL_DE.map((q) => ({ studyId: questionStudyId(q.id) })),
    prog,
  )
}

function berlinDueCountToday(): number {
  const prog = loadProgress()
  return countDueIncludingUnseen(
    ALL_BERLIN_DE.map((q) => ({ studyId: berlinStudyId(q.id) })),
    prog,
  )
}

function memoryDueCountToday(): number {
  const prog = loadProgress()
  return countDueIncludingUnseen(
    ALL_TERMS.map((term) => ({ studyId: termStudyId(term.id) })),
    prog,
  )
}

export function HomeView(): HTMLElement {
  const root = document.createElement('div')
  root.className = 'page'
  const reviewDue = reviewDueCountToday()
  const berlinDue = berlinDueCountToday()
  const memoryDue = memoryDueCountToday()
  
  root.innerHTML = `
    <header class="py-6">
      <h1 class="text-3xl font-bold text-center">🇩🇪 BürgerTest Trainer</h1>
      <p class="text-center text-base-content opacity-70 mt-2">Prepare for your German naturalization exam</p>
    </header>
    
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <div class="card bg-base-100 shadow">
        <h2 class="text-xl font-semibold mb-3">📚 Study Mode</h2>
        <p class="text-sm text-base-content opacity-70 mb-4">Spaced repetition learning with ${reviewDue} cards due today</p>
        <button id="reviewBtn" class="btn btn-primary w-full">Start Review Session</button>
      </div>

      <div class="card bg-base-100 shadow">
        <h2 class="text-xl font-semibold mb-3">🐻 Berlin State Questions</h2>
        <p class="text-sm text-base-content opacity-70 mb-4">Drill the ${ALL_BERLIN_DE.length} Berlin questions on their own deck, with ${berlinDue} due today</p>
        <button id="berlinBtn" class="btn btn-primary w-full">Start Berlin Session</button>
      </div>

      <div class="card bg-base-100 shadow">
        <h2 class="text-xl font-semibold mb-3">🧠 Memory Terms</h2>
        <p class="text-sm text-base-content opacity-70 mb-4">Flip through ${ALL_TERMS.length} German terms with ${memoryDue} cards due today</p>
        <button id="memoryBtn" class="btn btn-primary w-full">Start Memory Session</button>
      </div>
      
      <div class="card bg-base-100 shadow">
        <h2 class="text-xl font-semibold mb-3">📝 Exam Simulation</h2>
        <p class="text-sm text-base-content opacity-70 mb-4">Practice with 33 questions (30 federal + 3 Berlin)</p>
        <button id="examBtn" class="btn btn-primary w-full">Take Practice Exam</button>
      </div>
      
      <div class="card bg-base-100 shadow">
        <h2 class="text-xl font-semibold mb-3">🔍 Browse Questions</h2>
        <p class="text-sm text-base-content opacity-70 mb-4">Search and filter all ${ALL_QUESTIONS_DE.length} questions by topic</p>
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
  root.querySelector('#berlinBtn')!.addEventListener('click', () => navigate('#/berlin'))
  root.querySelector('#memoryBtn')!.addEventListener('click', () => navigate('#/memory'))
  root.querySelector('#examBtn')!.addEventListener('click', () => navigate('#/exam'))
  root.querySelector('#browseBtn')!.addEventListener('click', () => navigate('#/browse'))
  root.querySelector('#statsBtn')!.addEventListener('click', () => navigate('#/stats'))
  
  // Add footer to home page
  root.appendChild(Footer())
  
  return root
}
