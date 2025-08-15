import de from './data/questions_de.json'
import en from './data/questions_en.json'
import type { Question, ProgressMap, Stats, Topic } from './types'
import { loadProgress, loadStats } from './storage'

export const ALL_DE: Question[] = de as any
export const ALL_EN: Question[] = en as any

export function byId(id: number) {
  const qd = ALL_DE.find(q => q.id === id)
  const qe = ALL_EN.find(q => q.id === id)
  return { de: qd!, en: qe! }
}

export const State = {
  progress: loadProgress() as ProgressMap,
  stats: loadStats() as Stats,
  filter: { topic: 'ALL' as Topic | 'ALL', search: '' },
}
