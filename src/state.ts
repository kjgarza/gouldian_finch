import de from './data/questions_de.json'
import en from './data/questions_en.json'
import berlinDe from './data/questions_berlin_de.json'
import berlinEn from './data/questions_berlin_en.json'
import terms from './data/terms_de_en.json'
import type { Question, ProgressMap, Stats, Topic, Term } from './types'
import { loadProgress, loadStats } from './storage'

export const ALL_DE: Question[] = de as any
export const ALL_EN: Question[] = en as any
export const ALL_BERLIN_DE: Question[] = berlinDe as any
export const ALL_BERLIN_EN: Question[] = berlinEn as any
export const ALL_TERMS: Term[] = terms as any

/** Federal deck plus the Berlin state deck, for lookups and browsing. */
export const ALL_QUESTIONS_DE: Question[] = [...ALL_DE, ...ALL_BERLIN_DE]
export const ALL_QUESTIONS_EN: Question[] = [...ALL_EN, ...ALL_BERLIN_EN]

export function byId(id: number) {
  const qd = ALL_QUESTIONS_DE.find(q => q.id === id)
  // Not every German question has an English counterpart yet, so fall back to
  // the German record instead of handing callers an undefined translation.
  const qe = ALL_QUESTIONS_EN.find(q => q.id === id) || qd
  return { de: qd!, en: qe! }
}

export const State = {
  progress: loadProgress() as ProgressMap,
  stats: loadStats() as Stats,
  filter: { topic: 'ALL' as Topic | 'ALL', search: '' },
}
