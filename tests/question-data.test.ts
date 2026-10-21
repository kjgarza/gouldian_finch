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

/** The three official federal areas, and the English topic each translates to. */
const FEDERAL_TOPICS: Record<string, string> = {
  'Politik in der Demokratie': 'Politics in Democracy',
  'Geschichte und Verantwortung': 'History and Responsibility',
  'Mensch und Gesellschaft': 'Human and Society',
}

const BERLIN_TOPIC = 'Bundesland Berlin'

/** English topic each German topic must translate to (the four `Topic` values). */
const TOPICS: Record<string, string> = {
  ...FEDERAL_TOPICS,
  [BERLIN_TOPIC]: BERLIN_TOPIC,
}

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
      assert.ok(q.topic in TOPICS, `question ${q.id} has unmapped topic "${q.topic}"`)
      assert.equal(e.topic, TOPICS[q.topic], `question ${q.id} topic`)
    }
  })
}

test('federal deck: every question uses one of the three federal areas', () => {
  for (const file of ['questions_de.json', 'questions_en.json']) {
    const allowed = new Set(file.endsWith('_de.json') ? Object.keys(FEDERAL_TOPICS) : Object.values(FEDERAL_TOPICS))
    const bad = load(file).filter(q => !allowed.has(q.topic)).map(q => `${q.id}:${q.topic}`)
    assert.deepEqual(bad, [], `${file} has off-list topics`)
  }
})

test('federal deck: each of the three areas is populated', () => {
  const counts = new Map<string, number>()
  for (const q of load('questions_de.json')) counts.set(q.topic, (counts.get(q.topic) ?? 0) + 1)
  for (const topic of Object.keys(FEDERAL_TOPICS)) {
    assert.ok((counts.get(topic) ?? 0) >= 30, `${topic} has only ${counts.get(topic) ?? 0} questions`)
  }
})

test('Berlin deck: every question is "Bundesland Berlin" in both languages', () => {
  for (const file of ['questions_berlin_de.json', 'questions_berlin_en.json']) {
    const bad = load(file).filter(q => q.topic !== BERLIN_TOPIC).map(q => q.id)
    assert.deepEqual(bad, [], `${file} has non-Berlin topics`)
  }
})
