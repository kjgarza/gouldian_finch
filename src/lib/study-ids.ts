import type { Question, StudyId } from '../types'

export const BERLIN_TOPIC = 'Bundesland Berlin'

export function questionStudyId(id: number): StudyId {
  return `question:${id}`
}

export function termStudyId(id: string): StudyId {
  return `term:${id}`
}

export function berlinStudyId(id: number): StudyId {
  return `berlin:${id}`
}

export function isQuestionStudyId(id: string): boolean {
  return id.startsWith('question:')
}

export function isTermStudyId(id: string): boolean {
  return id.startsWith('term:')
}

export function isBerlinStudyId(id: string): boolean {
  return id.startsWith('berlin:')
}

/**
 * Berlin state questions live in their own deck, so the same question always
 * maps to the same progress key no matter which mode graded it.
 */
export function studyIdForQuestion(q: Question): StudyId {
  return q.topic === BERLIN_TOPIC ? berlinStudyId(q.id) : questionStudyId(q.id)
}
