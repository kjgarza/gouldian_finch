/**
 * Position in a study session. A missed card goes to the back of the same
 * queue, so the total grows; once `index` passes the end nothing is gradable.
 */
export interface StudyQueue<T> {
  items: readonly T[]
  index: number
}

export function createQueue<T>(items: readonly T[]): StudyQueue<T> {
  return { items, index: 0 }
}

export function isFinished<T>(queue: StudyQueue<T>): boolean {
  return queue.index >= queue.items.length
}

export function currentItem<T>(queue: StudyQueue<T>): T | undefined {
  return isFinished(queue) ? undefined : queue.items[queue.index]
}

/** 1-based place of the current card and the queue length. */
export function position<T>(queue: StudyQueue<T>): { current: number; total: number } {
  return { current: Math.min(queue.index + 1, queue.items.length), total: queue.items.length }
}

/** Returns the next state; grading a finished session is a no-op. */
export function gradeCurrent<T>(queue: StudyQueue<T>, grade: 'again' | 'good'): StudyQueue<T> {
  if (isFinished(queue)) return queue
  const items = grade === 'again' ? [...queue.items, queue.items[queue.index]] : queue.items
  return { items, index: queue.index + 1 }
}
