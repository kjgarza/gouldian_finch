import { test } from 'node:test'
import assert from 'node:assert/strict'

import { cellShade, HEAT_SHADES } from '../src/lib/study-heatmap.ts'

test('every day state gets its own shade, so the grid reads without colour', () => {
  const states = ['studied', 'missed', 'untracked', 'future'] as const
  const classes = states.map(cellShade)
  assert.equal(new Set(classes).size, states.length)
})

test('shades step down in ink strength from studied to future', () => {
  assert.deepEqual(
    [HEAT_SHADES.studied, HEAT_SHADES.missed, HEAT_SHADES.future],
    [100, 16, 6],
  )
  assert.ok(HEAT_SHADES.studied > HEAT_SHADES.missed && HEAT_SHADES.missed > HEAT_SHADES.future)
})

test('shade classes carry no shadow or off-theme colour', () => {
  for (const state of ['studied', 'missed', 'untracked', 'future'] as const) {
    assert.doesNotMatch(cellShade(state), /shadow|bg-(red|green|blue|primary|success)/)
  }
})
