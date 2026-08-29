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
