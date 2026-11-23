import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  getPaceRhythm,
  getPhase,
  getRhythm,
  roundSessionDuration,
} from '../src/features/breathing/breathingTiming.ts'
import { defaultPreferences, normalizePreferences } from '../src/preferences.ts'

const plan = { prep: 3, ...getRhythm({ inhale: 4, exhale: 6 }) }

test('the countdown and circle agree at breathing phase boundaries', () => {
  assert.deepEqual(getPhase(0, plan), {
    name: 'prepare',
    cycle: -1,
    seconds: 3,
    expansion: 0,
    position: 0,
  })
  assert.equal(getPhase(3, plan).name, 'inhale')
  assert.equal(getPhase(3, plan).seconds, 4)
  assert.equal(getPhase(3, plan).expansion, 0)
  assert.equal(getPhase(7, plan).name, 'exhale')
  assert.equal(getPhase(7, plan).seconds, 6)
  assert.equal(getPhase(7, plan).expansion, 1)
  assert.equal(getPhase(13, plan).cycle, 1)
  assert.equal(getPhase(13, plan).expansion, 0)
  assert.ok(getPhase(3.001, plan).expansion < 0.00001)
  assert.ok(getPhase(6.999, plan).expansion > 0.99999)
  assert.ok(getPhase(7.001, plan).expansion > getPhase(8, plan).expansion)
  assert.equal(roundSessionDuration(30, getRhythm({ inhale: 3, exhale: 4 }).cycleDuration), 35)
})

test('ring position, countdown and expansion share a clock through both holds', () => {
  const box = { prep: 0, ...getPaceRhythm({ ...defaultPreferences, pace: 'box' }) }
  const expected = [
    [0, 'inhale', 4, 0],
    [4, 'hold', 4, 1],
    [6, 'hold', 2, 1],
    [8, 'exhale', 4, 1],
    [12, 'rest', 4, 0],
    [15.5, 'rest', 1, 0],
    [16, 'inhale', 4, 0],
  ]
  for (const [elapsed, name, seconds, expansion] of expected) {
    assert.deepEqual(getPhase(elapsed, box), {
      name,
      cycle: Math.floor(elapsed / 16),
      seconds,
      expansion,
      position: elapsed % 16,
    })
  }
  assert.equal(roundSessionDuration(60, box.cycleDuration), 64)
})

test('all paces run the selected steps in order and skip omitted holds', () => {
  const timings = {
    gentle: [4, 6],
    even: [4, 4],
    short: [3, 4],
    balanced: [5, 5],
    'long-inhale': [6, 4],
    'three-part': [4, 4, 4],
    box: [4, 4, 4, 4],
    'four-seven-eight': [4, 7, 8],
    'six-seven-eight': [6, 7, 8],
  }
  for (const [pace, counts] of Object.entries(timings)) {
    const rhythm = getPaceRhythm(normalizePreferences({ pace }))
    assert.deepEqual(
      rhythm.steps.map(({ duration }) => duration),
      counts,
    )
    assert.equal(
      rhythm.cycleDuration,
      counts.reduce((total, count) => total + count, 0),
    )
  }

  const custom = normalizePreferences({ pace: 'custom', inhale: 3, exhale: 5, hold: 0, rest: 2 })
  assert.deepEqual(
    getPaceRhythm(custom).steps.map(({ name }) => name),
    ['inhale', 'exhale', 'rest'],
  )
  const legacy = normalizePreferences({ pace: 'custom', inhale: 3, exhale: 5 })
  assert.deepEqual(
    getPaceRhythm(legacy).steps.map(({ name }) => name),
    ['inhale', 'exhale'],
  )
})

test('saved preferences keep legacy motion choices and reject invalid timing', () => {
  assert.deepEqual(normalizePreferences(null), defaultPreferences)
  assert.equal(normalizePreferences({}).motion, 'on')
  assert.equal(normalizePreferences({ motion: 'unknown' }).motion, 'on')
  assert.equal(normalizePreferences({ motion: 'system' }).motion, 'system')
  assert.equal(normalizePreferences({ motion: 'off' }).motion, 'off')
  assert.equal(normalizePreferences({ motion: true }).motion, 'system')
  assert.equal(normalizePreferences({ motion: false }).motion, 'off')
  assert.equal(normalizePreferences({ motion: 'on' }).motion, 'on')
  assert.equal(normalizePreferences({}).theme, 'system')
  assert.equal(normalizePreferences({ theme: 'light' }).theme, 'light')
  assert.equal(normalizePreferences({ theme: 'dark' }).theme, 'dark')
  assert.equal(normalizePreferences({ theme: 'unknown' }).theme, 'system')
  const saved = normalizePreferences({
    pace: 'unknown',
    inhale: 0,
    hold: 3.6,
    exhale: 50,
    rest: -2,
    countdown: false,
    sound: 'breath-lofi',
  })
  assert.equal(saved.pace, 'gentle')
  assert.equal(saved.inhale, 2)
  assert.equal(saved.hold, 4)
  assert.equal(saved.exhale, 12)
  assert.equal(saved.rest, 0)
  assert.equal(saved.countdown, false)
  assert.equal(saved.sound, 'breath-lofi')
})
