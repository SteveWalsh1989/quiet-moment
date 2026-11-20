import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createRenderer } from 'vue'
import { useBackgroundAudio } from '../src/features/audio/useBackgroundAudio.ts'
import { defaultPreferences } from '../src/preferences.ts'

test('only Breathing lo-fi pauses with the timer and resumes at the held position', async (context) => {
  const tracks = []
  globalThis.window = {}
  globalThis.quietMomentOffline = { sounds: { 'breath-lofi': 'breath', rain: 'rain' } }
  globalThis.Audio = class {
    constructor(source) {
      this.source = source
      this.paused = true
      this.currentTime = 0
      this.playTimes = []
      tracks.push(this)
    }
    async play() {
      this.playTimes.push(this.currentTime)
      this.paused = false
    }
    pause() {
      this.paused = true
    }
  }

  const renderer = createRenderer({ createComment: () => ({}), insert() {}, remove() {} })
  let audio
  const app = renderer.createApp({
    setup() {
      audio = useBackgroundAudio(defaultPreferences)
      return () => null
    },
  })
  app.mount({})
  context.after(() => {
    app.unmount()
    delete globalThis.Audio
    delete globalThis.window
    delete globalThis.quietMomentOffline
  })

  await audio.playSound('breath-lofi')
  const breathingTrack = tracks.at(-1)
  breathingTrack.currentTime = 7.25
  audio.setBreathExpansion(0.5)
  const pausedVolume = breathingTrack.volume
  audio.setBreathingPaused(true)
  assert.equal(breathingTrack.paused, true)
  assert.equal(breathingTrack.volume, pausedVolume)
  audio.setBreathingPaused(false)
  assert.deepEqual(breathingTrack.playTimes, [0, 7.25])

  audio.setBreathingPaused(true)
  await audio.playSound('off')
  audio.setBreathingPaused(false)
  assert.equal(breathingTrack.paused, true)
  assert.deepEqual(breathingTrack.playTimes, [0, 7.25])

  await audio.playSound('rain')
  const rain = tracks.at(-1)
  audio.setBreathingPaused(true)
  assert.equal(rain.paused, false)
  await audio.playSound('breath-lofi')
  const newBreathingTrack = tracks.at(-1)
  assert.deepEqual(newBreathingTrack.playTimes, [])
  audio.setBreathingPaused(false)
  assert.deepEqual(newBreathingTrack.playTimes, [0])
})
