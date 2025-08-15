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
    <nav class="nav bg-white border-b border-gray-200 sticky top-0 z-50">
      <div class="max-w-4xl mx-auto px-4 h-16 flex items-center gap-1">
        <button data-nav="#/" class="nav-btn font-bold text-brand-700">
          🇩🇪 BürgerTest
        </button>
        <div class="flex-1"></div>
        <button data-nav="#/review" class="nav-btn">Review</button>
        <button data-nav="#/exam" class="nav-btn">Exam</button>
        <button data-nav="#/browse" class="nav-btn">Browse</button>
        <button data-nav="#/stats" class="nav-btn">Stats</button>
      </div>
    </nav>
    <main class="flex-1 max-w-4xl mx-auto p-4 w-full"></main>
  `
  
  const main = app.querySelector('main')!
  main.appendChild(content)
  
  // Handle navigation
  const navButtons = app.querySelectorAll('[data-nav]') as NodeListOf<HTMLButtonElement>
  navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      location.hash = btn.dataset.nav!
    })
  })
  
  // Highlight active nav button
  const currentHash = location.hash || '#/'
  navButtons.forEach(btn => {
    if (btn.dataset.nav === currentHash) {
      btn.classList.add('nav-btn-active')
    } else {
      btn.classList.remove('nav-btn-active')
    }
  })
}

function render(route: Route) {
  let view: HTMLElement
  
  switch (route) {
    case '#/review': 
      view = ReviewView() 
      break
    case '#/exam': 
      view = ExamView() 
      break
    case '#/browse': 
      view = BrowseView() 
      break
    case '#/stats': 
      view = StatsView() 
      break
    default: 
      view = HomeView()
  }
  
  // Emit cleanup event for previous view
  const app = document.getElementById('app')!
  const oldMain = app.querySelector('main')
  if (oldMain) {
    oldMain.dispatchEvent(new Event('removed'))
  }
  
  shell(view)
}

// Start the app
onRouteChange(render)
startRouter()

// Set page title based on route
onRouteChange((route) => {
  const titles = {
    '#/': 'BürgerTest Trainer - German Naturalization Exam',
    '#/review': 'Review Session - BürgerTest Trainer',
    '#/exam': 'Practice Exam - BürgerTest Trainer',
    '#/browse': 'Browse Questions - BürgerTest Trainer',
    '#/stats': 'Statistics - BürgerTest Trainer'
  }
  document.title = titles[route] || titles['#/']
})
