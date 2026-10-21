import { test } from 'node:test'
import assert from 'node:assert/strict'

import { buildTopicDecks } from '../src/lib/topic-decks.ts'
import { createDefaultProgress } from '../src/lib/study-session.ts'
import type { ProgressMap, Question } from '../src/types.ts'

const q = (id: number, topic: Question['topic']): Question => ({
  id, question: '', choices: [], correctIndex: 0, hint: '', topic,
}) as Question

const federal = [
  q(1, 'Politik in der Demokratie'),
  q(2, 'Politik in der Demokratie'),
  q(3, 'Geschichte und Verantwortung'),
]
const berlin = [q(901, 'Bundesland Berlin')]

const card = (id: string, interval: number) => ({ ...createDefaultProgress(id), interval })

test('learned counts only cards at the mature interval, per topic', () => {
  const prog: ProgressMap = {
    'question:1': card('question:1', 6),
    'question:2': card('question:2', 1), // seen, not yet retained
    'question:3': card('question:3', 20),
    'berlin:901': card('berlin:901', 0),
  }
  const decks = buildTopicDecks(prog, federal, berlin)
  const byTopic = Object.fromEntries(decks.map((d) => [d.topic, [d.learned, d.size]]))

  assert.deepEqual(byTopic, {
    'Politik in der Demokratie': [1, 2],
    'Geschichte und Verantwortung': [1, 1],
    'Bundesland Berlin': [0, 1],
  })
})

test('a topic with no questions has no deck, and Berlin is read from its own id space', () => {
  const prog: ProgressMap = { 'question:901': card('question:901', 30), 'berlin:901': card('berlin:901', 30) }
  const decks = buildTopicDecks(prog, federal, berlin)

  assert.equal(decks.some((d) => d.topic === 'Mensch und Gesellschaft'), false)
  assert.equal(decks.find((d) => d.topic === 'Bundesland Berlin')!.learned, 1)
})

test('a card never seen is unseen, not due or learned', () => {
  const [politik] = buildTopicDecks({}, federal, berlin)
  assert.equal(politik.learned, 0)
  assert.equal(politik.counts.unseen, 2)
})
