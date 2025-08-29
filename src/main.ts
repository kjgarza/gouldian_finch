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
    <nav class="navbar bg-base-100 border-b border-base-300 sticky top-0 z-50">
      <div class="navbar-start">
        <button data-nav="#/" class="btn btn-ghost normal-case text-xl text-primary font-bold">
          Gouldian Finch
        </button>
      </div>
      <div class="navbar-end">
        <div class="flex gap-1">
          <button data-nav="#/review" class="nav-btn">Review</button>
          <button data-nav="#/exam" class="nav-btn">Exam</button>
          <button data-nav="#/browse" class="nav-btn">Browse</button>
          <button data-nav="#/stats" class="nav-btn">Stats</button>
        </div>
      </div>
    </nav>
    <main class="flex-1 max-w-4xl mx-auto p-4 w-full min-h-screen"></main>
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
