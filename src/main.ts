import './styles.css'
import { startRouter, onRouteChange, Route, ROUTE_CONFIG } from './router'
import { HomeView } from './views/home'
import { ReviewView } from './views/review'
import { BerlinView } from './views/berlin'
import { MemoryView } from './views/memory'
import { ExamView } from './views/exam'
import { BrowseView } from './views/browse'
import { StatsView } from './views/stats'
import { fontManager, type FontPairingKey } from './lib/font-pairings'

// Configure font pairing (change this to your desired font pairing)
const SELECTED_FONT_PAIRING: FontPairingKey = "newsreader-instrument"; // Change this to any available pairing

// Initialize fonts early
fontManager.loadFontPairing(SELECTED_FONT_PAIRING)

/** Stroke paths for the tab bar, drawn in a 24×24 box. */
const TAB_ICONS: Partial<Record<Route, string>> = {
  '#/': '<path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-5h-6v5H5a1 1 0 0 1-1-1z"/>',
  '#/memory': '<rect x="4" y="6" width="13" height="14" rx="1.5"/><path d="M8 3h11a1 1 0 0 1 1 1v13"/>',
  '#/browse': '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
  '#/stats': '<path d="M5 20V11M12 20V5M19 20v-6"/>',
}

function shell(route: Route, content: HTMLElement) {
  const routeConfig = ROUTE_CONFIG[route]
  const app = document.getElementById('app')!
  const navRoutes = (Object.entries(ROUTE_CONFIG) as Array<[Route, typeof ROUTE_CONFIG[Route]]>)
    .filter(([, config]) => config.showNav && config.label)

  app.className = routeConfig.showNav ? 'app-shell' : 'app-shell app-shell-immersive'
  app.innerHTML = `
    <main class="app-main ${routeConfig.showNav ? 'app-main-tabs' : ''} ${routeConfig.mainClassName || ''}"></main>
    ${routeConfig.showNav ? `
      <nav class="tab-bar" aria-label="Main">
        <div class="tab-bar-inner">
          ${navRoutes.map(([path, config]) => `
            <button type="button" data-nav="${path}" class="tab-btn" ${path === route ? 'aria-current="page"' : ''}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${TAB_ICONS[path] ?? ''}</svg>
              <span>${config.label}</span>
            </button>
          `).join('')}
        </div>
      </nav>
    ` : ''}
  `

  const main = app.querySelector('main')!
  main.appendChild(content)

  app.querySelectorAll<HTMLButtonElement>('[data-nav]').forEach(btn => {
    btn.addEventListener('click', () => {
      location.hash = btn.dataset.nav!
    })
  })
}

function render(route: Route) {
  let view: HTMLElement
  
  switch (route) {
    case '#/review': 
      view = ReviewView() 
      break
    case '#/berlin':
      view = BerlinView()
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
