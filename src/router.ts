export type Route = '#/' | '#/review' | '#/exam' | '#/browse' | '#/stats'

export function navigate(to: Route) {
  if (location.hash !== to) location.hash = to
}

const listeners: Array<(route: Route) => void> = []

export function onRouteChange(fn: (route: Route) => void) { 
  listeners.push(fn) 
}

export function startRouter() {
  const handler = () => {
    const h = (location.hash || '#/') as Route
    listeners.forEach(l => l(h))
  }
  addEventListener('hashchange', handler)
  handler()
}
