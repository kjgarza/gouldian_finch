import type { CardProgress, ProgressMap, StudyId } from '../types'
import { isISODate, localISODate, todayISO } from './study-calendar'

export interface StudyListItem {
  studyId: StudyId
}

export interface SessionItem<T extends StudyListItem> {
  item: T
  progress: CardProgress
}

/**
 * Slots every session holds back for never-seen cards. Without a floor the
 * batch is filled with due cards first, so a backlog of lapses crowds new
 * material out completely and the same questions come back session after
 * session.
 */
export const NEW_CARD_FLOOR = 5

/**
 * Interval a card has to reach before it counts as learned rather than merely
 * seen. Six days is the second successful review: the first Good moves a card
 * to one day, the second to six, so anything below this has either never been
 * answered correctly twice or has lapsed back to the start.
 */
export const MATURE_INTERVAL = 6

export function createDefaultProgress(id: StudyId, today = new Date()): CardProgress {
  return {
    id,
    interval: 0,
    ease: 2.5,
    dueDate: today.toISOString(),
  }
}

export function isMature(progress: CardProgress): boolean {
  return progress.interval >= MATURE_INTERVAL
}

/**
 * Calendar day a card falls due on, in the viewer's timezone. `updateCard`
 * stores the due date as a full instant built from local day arithmetic, so
 * slicing the UTC string off it would move the card a day for anyone west of
 * Greenwich. Bare `YYYY-MM-DD` values (written by older builds) pass through.
 */
export function dueDateISO(progress: CardProgress, fallback = todayISO()): string {
  const raw = progress.dueDate || ''
  if (isISODate(raw)) return raw

  const parsed = new Date(raw)
  // An unparseable due date means a corrupt entry; treating it as due on the
  // day being asked about is the harmless reading — the card comes back into
  // rotation and gets rewritten. It follows the caller's day rather than the
  // clock so that "is this due on X?" stays a question about X alone.
  return Number.isNaN(parsed.getTime()) ? fallback : localISODate(parsed)
}

export function isDueToday(progress: CardProgress, today = todayISO()): boolean {
  return dueDateISO(progress, today) <= today
}

export interface StudyBatchOptions {
  /** Slots reserved for unseen cards even when reviews are backlogged. */
  newCardFloor?: number
  /** Injectable so tests can pin the order; defaults to Fisher-Yates. */
  shuffle?: <U>(items: U[]) => U[]
}

function shuffleInPlace<U>(items: U[]): U[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const swap = items[i]
    items[i] = items[j]
    items[j] = swap
  }
  return items
}

export function pickStudyBatch<T extends StudyListItem>(
  items: T[],
  progressMap: ProgressMap,
  batchSize: number,
  options: StudyBatchOptions = {},
): SessionItem<T>[] {
  const { newCardFloor = NEW_CARD_FLOOR, shuffle = shuffleInPlace } = options
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

  // The floor only claims slots there are actually unseen cards to fill, so a
  // deck the user has worked through end to end still serves a full batch of
  // reviews.
  const newQuota = Math.min(newCardFloor, unseen.length, batchSize)
  const selected = [...due.slice(0, batchSize - newQuota)]
  let index = 0
  while (selected.length < batchSize && index < unseen.length) {
    selected.push(unseen[index])
    index += 1
  }

  // Which cards make the cut stays deterministic — oldest due first — but the
  // order they are asked in does not, so a stable backlog stops feeling like
  // the same session replayed.
  return shuffle(selected).map((item) => ({
    item,
    progress: progressMap[item.studyId] ?? createDefaultProgress(item.studyId),
  }))
}

export interface StudyCounts {
  /** Seen cards whose due date has arrived. */
  due: number
  /** Cards that have never been studied. */
  unseen: number
  /** Everything the deck could serve today. */
  total: number
}

/**
 * Splits what a deck could serve into the two populations rather than summing
 * them. They mean different things to a learner — a review that has come round
 * again is not the same as a question they have never met — and a single total
 * reads as an unworkable backlog when most of it is simply untouched.
 */
export function studyCounts<T extends StudyListItem>(
  items: T[],
  progressMap: ProgressMap,
  today = todayISO(),
): StudyCounts {
  let due = 0
  let unseen = 0

  for (const item of items) {
    const progress = progressMap[item.studyId]
    if (!progress) {
      unseen += 1
    } else if (isDueToday(progress, today)) {
      due += 1
    }
  }

  return { due, unseen, total: due + unseen }
}
