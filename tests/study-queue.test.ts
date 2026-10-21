import { test } from 'node:test'
import assert from 'node:assert/strict'

import { createQueue, currentItem, gradeCurrent, isFinished, position } from '../src/lib/study-queue.ts'

test('Good moves on; the session finishes after the last card', () => {
  let queue = createQueue(['a', 'b'])
  assert.equal(currentItem(queue), 'a')
  queue = gradeCurrent(queue, 'good')
  assert.equal(currentItem(queue), 'b')
  queue = gradeCurrent(queue, 'good')
  assert.equal(isFinished(queue), true)
  assert.equal(currentItem(queue), undefined)
})

test('Again sends the card to the back of the same session', () => {
  let queue = createQueue(['a', 'b'])
  queue = gradeCurrent(queue, 'again')
  assert.deepEqual(position(queue), { current: 2, total: 3 })
  queue = gradeCurrent(queue, 'good')
  assert.equal(currentItem(queue), 'a')
  queue = gradeCurrent(queue, 'good')
  assert.equal(isFinished(queue), true)
})

test('grading a finished session changes nothing', () => {
  let queue = gradeCurrent(createQueue(['a']), 'good')
  const after = gradeCurrent(queue, 'again')
  assert.equal(isFinished(after), true)
  assert.deepEqual(position(after), position(queue))
})

test('an empty queue is finished from the start', () => {
  assert.equal(isFinished(createQueue([])), true)
})
