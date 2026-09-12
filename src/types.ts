export interface Question {
  id: number
  question: string
  choices: string[]
  correctIndex: number
  hint: string
  topic: Topic
  /** Text stand-in for an official question that presents its options as images. */
  substituted?: boolean
}

export interface Term {
  id: string
  de: string
  en: string
  topic?: Topic
  questionIds?: number[]
  note?: string
}

export type Topic = 
  | "Politik in der Demokratie"
  | "Geschichte und Verantwortung" 
  | "Mensch und Gesellschaft"
  | "Bundesland Berlin"

/**
 * The app is phone-only, so diagrams use portrait/square "Instagram" ratios.
 * Nothing landscape: a wide image shrinks to an unreadable strip in a card.
 */
export type DiagramAspect = '1:1' | '4:5' | '3:4' | '9:16'

export type DiagramType =
  | 'organigram'
  | 'flowchart'
  | 'timeline'
  | 'venn'
  | 'network'
  | 'comparison'
  | 'pyramid'
  | 'cycle'
  | 'map'
  | 'bar'

/**
 * A visual hint shared by every question that turns on the same concept, so one
 * picture serves many cards. `file` is a path relative to the Vite base, empty
 * while the image is still being generated.
 */
export interface Diagram {
  key: string
  type: DiagramType
  titleDe: string
  titleEn: string
  altDe: string
  altEn: string
  aspect: DiagramAspect
  file: string
  questionIds: number[]
  /** Generation prompt, kept so a diagram can be regenerated reproducibly. */
  prompt?: string
}

export type StudyId = string

export interface CardProgress {
  id: StudyId
  interval: number
  ease: number
  dueDate: string // ISO date
}

export type ProgressMap = Record<string, CardProgress>

export interface Stats {
  streak: number
  /** Derived from the counters below; kept on disk for older builds to read. */
  accuracy: number
  totalAnswered: number
  /** Correct answers behind `accuracy`, counted rather than re-derived. */
  correctAnswered?: number
  lastStudyDate?: string // ISO date for streak
  studiedDates?: string[] // ISO dates with at least one answered card, oldest first
  memoryAnswered?: number
  memoryAccuracy?: number
  memoryCorrect?: number
  /** Questions answered inside exam simulations, part of `totalAnswered`. */
  examAnswered?: number
}

export interface ExamAttempt {
  timestamp: string // ISO
  score: number
  total: number
  questionIds: number[]
  incorrect: { id: number; chosenIndex: number }[]
}

export type LangHelper = {
  showEnglish: boolean
}
