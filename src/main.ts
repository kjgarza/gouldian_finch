import './styles.css'
import { startRouter, onRouteChange, Route, ROUTE_CONFIG } from './router'
import { HomeView } from './views/home'
import { ReviewView } from './views/review'
import { MemoryView } from './views/memory'
import { ExamView } from './views/exam'
import { BrowseView } from './views/browse'
import { StatsView } from './views/stats'
import { fontManager, type FontPairingKey } from './lib/font-pairings'

// Configure font pairing (change this to your desired font pairing)
const SELECTED_FONT_PAIRING: FontPairingKey = "bitter-raleway"; // Change this to any available pairing

// Initialize fonts early
fontManager.loadFontPairing(SELECTED_FONT_PAIRING)

function shell(route: Route, content: HTMLElement) {
  const routeConfig = ROUTE_CONFIG[route]
  const app = document.getElementById('app')!
  const navRoutes = (Object.entries(ROUTE_CONFIG) as Array<[Route, typeof ROUTE_CONFIG[Route]]>)
    .filter(([, config]) => config.showNav && config.label)

  app.className = routeConfig.showNav ? 'app-shell' : 'app-shell app-shell-immersive'
  app.innerHTML = `
    ${routeConfig.showNav ? `
      <nav class="app-nav border-b border-base-300 bg-base-100/95 backdrop-blur sticky top-0 z-50">
        <div class="mx-auto flex w-full max-w-4xl items-center gap-3 px-4 py-3">
          <button data-nav="#/" class="nav-brand btn btn-ghost px-0 normal-case text-left text-lg sm:text-xl text-primary font-bold">
            Gouldian Finch
          </button>
          <div class="ml-auto hidden items-center gap-1 md:flex">
            ${navRoutes.map(([path, config]) => `
              <button data-nav="${path}" class="nav-btn">${config.label}</button>
            `).join('')}
          </div>
          <button
            id="mobileMenuBtn"
            class="btn btn-ghost btn-sm ml-auto md:hidden"
            type="button"
            aria-expanded="false"
            aria-controls="mobileNavPanel"
            aria-label="Toggle navigation"
          >
            Menu
          </button>
        </div>
        <div id="mobileNavPanel" class="mobile-nav-panel hidden border-t border-base-300 px-4 pb-4 md:hidden">
          <div class="flex flex-col gap-2 pt-3">
            ${navRoutes.map(([path, config]) => `
              <button data-nav="${path}" class="nav-btn nav-btn-mobile justify-start">${config.label}</button>
            `).join('')}
          </div>
        </div>
      </nav>
    ` : ''}
    <main class="flex-1 max-w-4xl mx-auto p-4 w-full min-h-screen ${routeConfig.mainClassName || ''}"></main>
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

  const mobileMenuBtn = app.querySelector('#mobileMenuBtn') as HTMLButtonElement | null
  const mobileNavPanel = app.querySelector('#mobileNavPanel') as HTMLDivElement | null

  const closeMobileMenu = () => {
    if (!mobileMenuBtn || !mobileNavPanel) return
    mobileMenuBtn.setAttribute('aria-expanded', 'false')
    mobileNavPanel.classList.add('hidden')
  }

  mobileMenuBtn?.addEventListener('click', () => {
    if (!mobileNavPanel) return
    const expanded = mobileMenuBtn.getAttribute('aria-expanded') === 'true'
    mobileMenuBtn.setAttribute('aria-expanded', expanded ? 'false' : 'true')
    mobileNavPanel.classList.toggle('hidden', expanded)
  })

  navButtons.forEach(btn => {
    if (btn.id !== 'mobileMenuBtn') {
      btn.addEventListener('click', closeMobileMenu)
    }
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
    case '#/memory':
      view = MemoryView()
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
    const oldView = oldMain.firstElementChild as HTMLElement | null
    oldView?.dispatchEvent(new Event('removed'))
  }
  
  shell(route, view)
}

// Start the app
onRouteChange(render)
startRouter()

// Set page title based on route
onRouteChange((route) => {
  document.title = ROUTE_CONFIG[route].title
})
