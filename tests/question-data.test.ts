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

/** English topic each German topic must translate to. */
const TOPICS: Record<string, string> = {
  'Politik in der Demokratie': 'Politics in Democracy',
  'Geschichte und Verantwortung': 'History and Responsibility',
  'Mensch und Gesellschaft': 'Human and Society',
  'Bundesland': 'Federal State',
  'Alltag in Deutschland': 'Everyday Life in Germany',
  'Familie und Soziales': 'Family and Social Affairs',
  'Bildung und Arbeit': 'Education and Work',
  'Soziales und Kulturelles Leben': 'Social and Cultural Life',
  'Recht und Gesetz': 'Law and Justice',
  'Staat und Institutionen': 'State and Institutions',
  'Arbeit und Beruf': 'Work and Employment',
  'Wirtschaft und Soziales': 'Economy and Social Affairs',
  'Bundesland Berlin': 'Bundesland Berlin',
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
