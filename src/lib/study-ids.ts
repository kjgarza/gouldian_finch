import type { StudyId } from '../types'

export function questionStudyId(id: number): StudyId {
  return `question:${id}`
}

export function termStudyId(id: string): StudyId {
  return `term:${id}`
}

export function isQuestionStudyId(id: string): boolean {
  return id.startsWith('question:')
}

export function isTermStudyId(id: string): boolean {
  return id.startsWith('term:')
}
