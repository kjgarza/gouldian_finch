export type Route = '#/' | '#/review' | '#/memory' | '#/exam' | '#/browse' | '#/stats'

export interface RouteConfig {
  label?: string
  title: string
  showNav: boolean
  mainClassName?: string
}

export const ROUTE_CONFIG: Record<Route, RouteConfig> = {
  '#/': {
    label: 'Home',
    title: 'BürgerTest Trainer - German Naturalization Exam',
    showNav: true,
  },
  '#/review': {
    label: 'Review',
    title: 'Review Session - BürgerTest Trainer',
    showNav: false,
    mainClassName: 'main-immersive',
  },
  '#/memory': {
    label: 'Memory',
    title: 'Term Memory - BürgerTest Trainer',
    showNav: true,
  },
  '#/exam': {
    label: 'Exam',
    title: 'Practice Exam - BürgerTest Trainer',
    showNav: false,
    mainClassName: 'main-immersive',
  },
  '#/browse': {
    label: 'Browse',
    title: 'Browse Questions - BürgerTest Trainer',
    showNav: true,
  },
  '#/stats': {
    label: 'Stats',
    title: 'Statistics - BürgerTest Trainer',
    showNav: true,
  },
}

export function navigate(to: Route) {
  if (location.hash !== to) location.hash = to
}

const listeners: Array<(route: Route) => void> = []

export function onRouteChange(fn: (route: Route) => void) { 
  listeners.push(fn) 
}

export function startRouter() {
  const handler = () => {
    const hash = location.hash || '#/'
    const h = (hash in ROUTE_CONFIG ? hash : '#/') as Route
    listeners.forEach(l => l(h))
  }
  addEventListener('hashchange', handler)
  handler()
}
