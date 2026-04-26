import type { CardProgress, ProgressMap, StudyId } from '../types'

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

export function isDueToday(progress: CardProgress, todayISO = new Date().toISOString().slice(0, 10)): boolean {
  return progress.dueDate.slice(0, 10) <= todayISO
}

export function pickStudyBatch<T extends StudyListItem>(
  items: T[],
  progressMap: ProgressMap,
  batchSize: number,
): SessionItem<T>[] {
  const todayISO = new Date().toISOString().slice(0, 10)
  const due: T[] = []
  const unseen: T[] = []

  for (const item of items) {
    const progress = progressMap[item.studyId]
    if (!progress) {
      unseen.push(item)
      continue
    }

    if (isDueToday(progress, todayISO)) {
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
  todayISO = new Date().toISOString().slice(0, 10),
): number {
  return items.filter((item) => {
    const progress = progressMap[item.studyId]
    return progress ? isDueToday(progress, todayISO) : true
  }).length
}
