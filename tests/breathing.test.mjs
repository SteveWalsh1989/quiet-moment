import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getPhase, roundSessionDuration } from '../src/features/breathing/breathingTiming.ts'
import { defaultPreferences, normalizePreferences } from '../src/preferences.ts'

const plan = { prep: 3, inhale: 4, exhale: 6 }

test('the countdown and circle agree at breathing phase boundaries', () => {
  assert.deepEqual(getPhase(0, plan), { name: 'prepare', cycle: -1, seconds: 3, expansion: 0 })
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
  assert.equal(roundSessionDuration(30, 3, 4), 35)
})

test('saved preferences keep legacy motion choices and reject invalid timing', () => {
  assert.deepEqual(normalizePreferences(null), defaultPreferences)
  assert.equal(normalizePreferences({ motion: true }).motion, 'system')
  assert.equal(normalizePreferences({ motion: false }).motion, 'off')
  assert.equal(normalizePreferences({ motion: 'on' }).motion, 'on')
  const saved = normalizePreferences({
    pace: 'unknown',
    inhale: 0,
    exhale: 50,
    countdown: false,
    sound: 'breath-lofi',
  })
  assert.equal(saved.pace, 'gentle')
  assert.equal(saved.inhale, 2)
  assert.equal(saved.exhale, 12)
  assert.equal(saved.countdown, false)
  assert.equal(saved.sound, 'breath-lofi')
})
