import type { ProgressMap, Question, StudyId, Topic } from '../types'
import { berlinStudyId, questionStudyId } from './study-ids'
import { isMature, studyCounts, type StudyCounts } from './study-session'
import { FEDERAL_TOPICS } from './topics'

export interface TopicDeck {
  topic: Topic
  counts: StudyCounts
  /** Cards that reached the mature interval, not merely ones that were seen. */
  learned: number
  size: number
}

/**
 * Reads one topic's slice of a deck. Due cards and never-started ones are kept
 * apart: a review that has come round again is work the learner already owes,
 * while an untouched question is simply new material.
 */
export function topicDeck(
  topic: Topic,
  questions: Question[],
  studyId: (id: number) => StudyId,
  prog: ProgressMap,
): TopicDeck {
  const items = questions.map((q) => ({ studyId: studyId(q.id) }))
  const learned = items.filter(({ studyId: id }) => prog[id] && isMature(prog[id])).length
  return { topic, counts: studyCounts(items, prog), learned, size: items.length }
}

/**
 * The per-topic decks Home and Stats both show: the three federal topics, then
 * Berlin, skipping any that are empty. One function, so the counts agree.
 */
export function buildTopicDecks(prog: ProgressMap, federal: Question[], berlin: Question[]): TopicDeck[] {
  return [
    ...FEDERAL_TOPICS.map((topic) => topicDeck(
      topic,
      federal.filter((q) => q.topic === topic),
      questionStudyId,
      prog,
    )),
    topicDeck('Bundesland Berlin', berlin, berlinStudyId, prog),
  ].filter((deck) => deck.size > 0)
}
