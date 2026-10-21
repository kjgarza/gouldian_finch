import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { SchemaMapperService } from '../src/pipeline/services/schema-mapper.js'
import { ALLOWED_TOPICS } from '../src/pipeline/domain/topics.js'
import { enforceTranslationShape } from '../src/pipeline/services/translation-guard.js'
import type { ProcessedQuestion } from '../src/pipeline/domain/types.js'

const raw = (id: number, question: string) => ({ id, question, options: ['a', 'b', 'c', 'd'] })

test('ALLOWED_TOPICS equals the app Topic union in src/types.ts', () => {
  const src = readFileSync(new URL('../src/types.ts', import.meta.url), 'utf8')
  const block = src.match(/export type Topic =([\s\S]*?)\n\n/)![1]
  const appTopics = [...block.matchAll(/"([^"]+)"/g)].map(m => m[1])
  assert.deepEqual([...ALLOWED_TOPICS].sort(), appTopics.sort())
})

test('mapper: a question it cannot classify fails with a clear error, not a default', () => {
  const mapper = new SchemaMapperService()
  assert.throws(
    () => mapper.mapToProcessedSchema(raw(999, 'Völlig neutrale Frage?'), 0, 'h', 'e'),
    /Cannot classify question 999/,
  )
})

test('mapper: an explicit off-map topic is rejected', () => {
  const mapper = new SchemaMapperService()
  assert.throws(
    () => mapper.mapToProcessedSchema(raw(1, 'x'), 0, 'h', 'e', 'Bundesland'),
    /not an allowed topic/,
  )
})

test('mapper: an existing label for the id wins over keyword inference', () => {
  const mapper = new SchemaMapperService({ existingTopics: new Map([[7, 'Mensch und Gesellschaft']]) })
  const q = mapper.mapToProcessedSchema(raw(7, 'Frage zum Grundgesetz?'), 0, 'h', 'e')
  assert.equal(q.topic, 'Mensch und Gesellschaft')
})

test('mapper: inference only ever returns a federal area', () => {
  const mapper = new SchemaMapperService()
  const q = mapper.mapToProcessedSchema(raw(8, 'Was steht im Grundgesetz?'), 0, 'h', 'e')
  assert.equal(q.topic, 'Politik in der Demokratie')
})

test('mapper: the Berlin deck is always "Bundesland Berlin"', () => {
  const mapper = new SchemaMapperService({ deck: 'berlin' })
  assert.equal(mapper.mapToProcessedSchema(raw(301, 'Neutral?'), 0, 'h', 'e').topic, 'Bundesland Berlin')
})

test('mapper: re-running over committed data keeps every topic', () => {
  const load = (f: string) => JSON.parse(readFileSync(new URL(`../src/data/${f}`, import.meta.url), 'utf8'))
  const fed = load('questions_de.json')
  const berlin = load('questions_berlin_de.json')
  const mappers = {
    federal: new SchemaMapperService({ existingTopics: new Map(fed.map((q: any) => [q.id, q.topic])) }),
    berlin: new SchemaMapperService({ deck: 'berlin' }),
  }
  for (const [deck, qs] of [['federal', fed], ['berlin', berlin]] as const) {
    for (const q of qs) {
      const out = mappers[deck].mapToProcessedSchema({ id: q.id, question: q.question, options: q.choices }, q.correctIndex, q.hint, q.explanation)
      assert.equal(out.topic, q.topic, `question ${q.id}`)
    }
  }
})

const de: ProcessedQuestion = {
  id: 1, question: 'F?', choices: ['a', 'b', 'c', 'd'], correctIndex: 2, hint: 'h', explanation: 'e',
  topic: 'Geschichte und Verantwortung',
}

test('translation: the English topic is copied from German, never translated', () => {
  const out = enforceTranslationShape(de, { question: 'Q?', choices: ['A', 'B', 'C', 'D'], hint: 'H', explanation: 'E', topic: 'History' })
  assert.equal(out.topic, de.topic)
  assert.equal(out.correctIndex, 2)
})

test('translation: wrong choice count is rejected', () => {
  assert.throws(() => enforceTranslationShape(de, { choices: ['A', 'B', 'C'] }), /choice count/)
})

test('translation: missing choices fall back to German in the same order', () => {
  assert.deepEqual(enforceTranslationShape(de, { question: 'Q?' }).choices, de.choices)
})
