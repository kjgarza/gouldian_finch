export type Route = '#/' | '#/review' | '#/berlin' | '#/memory' | '#/exam' | '#/browse' | '#/stats'

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
  '#/berlin': {
    label: 'Berlin',
    title: 'Berlin State Questions - BürgerTest Trainer',
    showNav: false,
    mainClassName: 'main-immersive',
  },
  '#/memory': {
    label: 'Terms',
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
    label: 'Catalogue',
    title: 'Browse Questions - BürgerTest Trainer',
    showNav: true,
  },
  '#/stats': {
    label: 'Stats',
    title: 'Statistics - BürgerTest Trainer',
    showNav: true,
  },
}

export function navigate(to: Route, query?: Record<string, string>) {
  const target = query ? `${to}?${new URLSearchParams(query)}` : to
  if (location.hash !== target) location.hash = target
}

/** Query part of the current hash: `#/review?topic=politik` → topic=politik. */
export function routeQuery(): URLSearchParams {
  const hash = location.hash
  const at = hash.indexOf('?')
  return new URLSearchParams(at >= 0 ? hash.slice(at + 1) : '')
}

const listeners: Array<(route: Route) => void> = []

export function onRouteChange(fn: (route: Route) => void) { 
  listeners.push(fn) 
}

export function startRouter() {
  const handler = () => {
    // The query rides along (routeQuery reads it); only the path picks a view.
    const path = (location.hash || '#/').split('?')[0]
    const h = (path in ROUTE_CONFIG ? path : '#/') as Route
    listeners.forEach(l => l(h))
  }
  addEventListener('hashchange', handler)
  handler()
}
