import './styles.css'
import { startRouter, onRouteChange, Route, ROUTE_CONFIG } from './router'
import { HomeView } from './views/home'
import { ReviewView } from './views/review'
import { BerlinView } from './views/berlin'
import { MemoryView } from './views/memory'
import { ExamView } from './views/exam'
import { BrowseView } from './views/browse'
import { StatsView } from './views/stats'
import { AboutView } from './views/about'
import { fontManager, type FontPairingKey } from './lib/font-pairings'
import { icon, type IconName } from './lib/icons'

// Configure font pairing (change this to your desired font pairing)
const SELECTED_FONT_PAIRING: FontPairingKey = "newsreader-instrument"; // Change this to any available pairing

// Initialize fonts early
fontManager.loadFontPairing(SELECTED_FONT_PAIRING)

/** Phosphor icon per tab. */
const TAB_ICONS: Partial<Record<Route, IconName>> = {
  '#/': 'house',
  '#/memory': 'cards',
  '#/browse': 'list-bullets',
  '#/stats': 'chart-bar',
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
              ${TAB_ICONS[path] ? icon(TAB_ICONS[path], { size: 22 }) : ''}
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
    case '#/about':
      view = AboutView()
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
