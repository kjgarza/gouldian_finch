import type { CardProgress, ProgressMap, StudyId } from '../types'
import { isISODate, localISODate, todayISO } from './study-calendar'

export interface StudyListItem {
  studyId: StudyId
}

export interface SessionItem<T extends StudyListItem> {
  item: T
  progress: CardProgress
}

export function createDefaultProgress(id: StudyId, today = new Date()): CardProgress {
  return {
    id,
    interval: 0,
    ease: 2.5,
    dueDate: today.toISOString(),
  }
}

/**
 * Calendar day a card falls due on, in the viewer's timezone. `updateCard`
 * stores the due date as a full instant built from local day arithmetic, so
 * slicing the UTC string off it would move the card a day for anyone west of
 * Greenwich. Bare `YYYY-MM-DD` values (written by older builds) pass through.
 */
export function dueDateISO(progress: CardProgress): string {
  const raw = progress.dueDate || ''
  if (isISODate(raw)) return raw

  const parsed = new Date(raw)
  // An unparseable due date means a corrupt entry; treating it as due today is
  // the harmless reading — the card comes back into rotation and gets rewritten.
  return Number.isNaN(parsed.getTime()) ? todayISO() : localISODate(parsed)
}

export function isDueToday(progress: CardProgress, today = todayISO()): boolean {
  return dueDateISO(progress) <= today
}

export function pickStudyBatch<T extends StudyListItem>(
  items: T[],
  progressMap: ProgressMap,
  batchSize: number,
): SessionItem<T>[] {
  const today = todayISO()
  const due: T[] = []
  const unseen: T[] = []

  for (const item of items) {
    const progress = progressMap[item.studyId]
    if (!progress) {
      unseen.push(item)
      continue
    }

    if (isDueToday(progress, today)) {
      due.push(item)
    }
  }

  due.sort((a, b) => {
    const aDate = progressMap[a.studyId]?.dueDate || '0'
    const bDate = progressMap[b.studyId]?.dueDate || '0'
    return new Date(aDate).getTime() - new Date(bDate).getTime()
  })

  const selected = [...due.slice(0, batchSize)]
  let index = 0
  while (selected.length < batchSize && index < unseen.length) {
    selected.push(unseen[index])
    index += 1
  }

  return selected.map((item) => ({
    item,
    progress: progressMap[item.studyId] ?? createDefaultProgress(item.studyId),
  }))
}

export function countDueIncludingUnseen<T extends StudyListItem>(
  items: T[],
  progressMap: ProgressMap,
  today = todayISO(),
): number {
  return items.filter((item) => {
    const progress = progressMap[item.studyId]
    return progress ? isDueToday(progress, today) : true
  }).length
}
