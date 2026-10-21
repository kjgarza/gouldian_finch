import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

interface Question {
  id: number
  question: string
  choices: string[]
  correctIndex: number
  topic: string
}

const load = (file: string): Question[] =>
  JSON.parse(readFileSync(new URL(`../src/data/${file}`, import.meta.url), 'utf8'))

/** The three official federal areas. English questions carry the same (German) label. */
const FEDERAL_TOPICS = ['Politik in der Demokratie', 'Geschichte und Verantwortung', 'Mensch und Gesellschaft']

const BERLIN_TOPIC = 'Bundesland Berlin'

const TOPICS = [...FEDERAL_TOPICS, BERLIN_TOPIC]

const DECKS = [
  ['federal', 'questions_de.json', 'questions_en.json'],
  ['Berlin', 'questions_berlin_de.json', 'questions_berlin_en.json'],
] as const

// byId() falls back to German when a translation is missing, so a gap here
// shows up in the app as German text in the English helper, not as an error.
for (const [name, deFile, enFile] of DECKS) {
  const de = load(deFile)
  const en = new Map(load(enFile).map(q => [q.id, q]))

  test(`${name} deck: every German question has an English translation`, () => {
    const missing = de.filter(q => !en.has(q.id)).map(q => q.id)
    assert.deepEqual(missing, [])
    assert.equal(en.size, de.length)
  })

  test(`${name} deck: every question has an integer correctIndex within its choices`, () => {
    for (const [file, qs] of [[deFile, de], [enFile, [...en.values()]]] as const) {
      for (const q of qs) {
        assert.ok(Number.isInteger(q.correctIndex), `${file} question ${q.id} correctIndex is ${q.correctIndex}`)
        assert.ok(q.correctIndex >= 0 && q.correctIndex < q.choices.length, `${file} question ${q.id} correctIndex out of range`)
      }
    }
  })

  test(`${name} deck: English answers line up with German`, () => {
    for (const q of de) {
      const e = en.get(q.id)
      if (!e) continue
      assert.equal(e.correctIndex, q.correctIndex, `question ${q.id} correctIndex`)
      assert.equal(e.choices.length, q.choices.length, `question ${q.id} choice count`)
      assert.equal(new Set(e.choices).size, e.choices.length, `question ${q.id} has duplicate English choices`)
    }
  })

  test(`${name} deck: English topics follow the German topic`, () => {
    for (const q of de) {
      const e = en.get(q.id)
      if (!e) continue
      assert.ok(TOPICS.includes(q.topic), `question ${q.id} has unmapped topic "${q.topic}"`)
      assert.equal(e.topic, q.topic, `question ${q.id} English topic must equal the German topic`)
    }
  })
}

test('federal deck: every question uses one of the three federal areas', () => {
  for (const file of ['questions_de.json', 'questions_en.json']) {
    const allowed = new Set(FEDERAL_TOPICS)
    const bad = load(file).filter(q => !allowed.has(q.topic)).map(q => `${q.id}:${q.topic}`)
    assert.deepEqual(bad, [], `${file} has off-list topics`)
  }
})

test('federal deck: each of the three areas is populated', () => {
  const counts = new Map<string, number>()
  for (const q of load('questions_de.json')) counts.set(q.topic, (counts.get(q.topic) ?? 0) + 1)
  for (const topic of FEDERAL_TOPICS) {
    assert.ok((counts.get(topic) ?? 0) >= 30, `${topic} has only ${counts.get(topic) ?? 0} questions`)
  }
})

test('Berlin deck: every question is "Bundesland Berlin" in both languages', () => {
  for (const file of ['questions_berlin_de.json', 'questions_berlin_en.json']) {
    const bad = load(file).filter(q => q.topic !== BERLIN_TOPIC).map(q => q.id)
    assert.deepEqual(bad, [], `${file} has non-Berlin topics`)
  }
})
