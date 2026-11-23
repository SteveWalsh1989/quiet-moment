import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createRenderer, watch } from 'vue'
import { renderBreathingMusic } from '../src/features/audio/breathingMusic.ts'
import { breathingArrangements, soundTracks } from '../src/features/audio/soundTracks.ts'
import { useBackgroundAudio } from '../src/features/audio/useBackgroundAudio.ts'
import { getRhythm } from '../src/features/breathing/breathingTiming.ts'
import { useBreathingSession } from '../src/features/breathing/useBreathingSession.ts'
import { defaultPreferences } from '../src/preferences.ts'

test('Velvet Tape is the default synced arrangement', () => {
  assert.deepEqual(
    soundTracks.slice(0, 4).map(({ id }) => id),
    ['off', 'breath-tape', 'breath-lofi', 'breath-afterglow'],
  )
  assert.equal(defaultPreferences.sound, 'breath-tape')
  assert.equal(defaultPreferences.soundEnabled, true)
})

for (const arrangement of breathingArrangements) {
  test(`${arrangement.title} accents every count and changes harmony at each phase boundary`, () => {
    for (const timing of [
      { inhale: 4, exhale: 6 },
      { inhale: 4, hold: 4, exhale: 4 },
      { inhale: 2, hold: 1, exhale: 2, rest: 1 },
    ]) {
      const plan = { ...getRhythm(timing), prep: 3 }
      const { samples, sampleRate } = renderBreathingMusic(plan, arrangement)
      assert.equal(samples.length, sampleRate * (plan.prep + plan.cycleDuration))
      assert.equal(samples[0], 0)
      assert.equal(samples.at(-1), 0)
      const rms = (start, duration = 0.1) => {
        const from = Math.round(start * sampleRate)
        const part = samples.subarray(from, from + Math.round(duration * sampleRate))
        return Math.sqrt(part.reduce((sum, value) => sum + value * value, 0) / part.length)
      }
      for (let second = 0; second < plan.prep + plan.cycleDuration; second++) {
        assert.ok(rms(second + 0.09) > rms(second + 0.85), 'each count has a soft accent')
      }
      for (const step of plan.steps) {
        const at = (plan.prep + step.start) * sampleRate
        assert.equal(samples[at], 0, 'a new phrase is rendered at each phase boundary')
        assert.ok(rms(plan.prep + step.start + 0.09) > 0.015)
      }
      assert.ok(samples.every((value) => Number.isFinite(value) && Math.abs(value) < 0.8))
    }

    const startOfSecondPhase = 4 * 22050
    const withHold = renderBreathingMusic(
      { ...getRhythm({ inhale: 4, hold: 4, exhale: 4 }), prep: 0 },
      arrangement,
    )
    const withExhale = renderBreathingMusic(
      { ...getRhythm({ inhale: 4, exhale: 6 }), prep: 0 },
      arrangement,
    )
    assert.notDeepEqual(
      withHold.samples.slice(startOfSecondPhase, startOfSecondPhase + 1024),
      withExhale.samples.slice(startOfSecondPhase, startOfSecondPhase + 1024),
    )
  })
}

test('the breathing clock follows the music and resumes at the same offset', async (testContext) => {
  let time = 0
  let audioTime = 10
  let nextFrame
  let context
  const restoreNow = globalThis.performance.now
  const sources = []
  const regularTracks = []
  const gain = {
    value: 0,
    setValueAtTime() {},
    setTargetAtTime() {},
    linearRampToValueAtTime() {},
    cancelScheduledValues() {},
  }

  globalThis.window = {
    AudioContext: class extends globalThis.EventTarget {
      state = 'running'
      destination = {}
      constructor() {
        super()
        context = this
      }
      get currentTime() {
        return audioTime
      }
      createGain() {
        return { gain: { ...gain }, connect: (node) => node, disconnect() {} }
      }
      createBuffer(_channels, length) {
        const data = new Float32Array(length)
        return { getChannelData: () => data }
      }
      createBufferSource() {
        const source = {
          connect: (node) => node,
          disconnect() {},
          start(when, offset) {
            source.started = { when, offset }
          },
          stop(when) {
            source.stopped = when
          },
        }
        sources.push(source)
        return source
      }
      async close() {
        this.state = 'closed'
      }
    },
  }
  globalThis.document = new globalThis.EventTarget()
  globalThis.requestAnimationFrame = (callback) => {
    nextFrame = callback
    return 1
  }
  globalThis.cancelAnimationFrame = () => {
    nextFrame = undefined
  }
  globalThis.performance.now = () => time
  globalThis.quietMomentOffline = { sounds: { rain: 'rain' } }
  globalThis.Audio = class {
    constructor(source) {
      this.source = source
      this.paused = true
      regularTracks.push(this)
    }
    async play() {
      this.paused = false
    }
    pause() {
      this.paused = true
    }
  }

  const renderer = createRenderer({ createComment: () => ({}), insert() {}, remove() {} })
  let audio
  let breath
  const app = renderer.createApp({
    setup() {
      const preferences = { ...defaultPreferences, prep: 0 }
      audio = useBackgroundAudio(preferences)
      breath = useBreathingSession(
        preferences,
        () => {},
        () => {},
        () => {},
        audio.readBreathingElapsed,
      )
      watch(
        [breath.state, breath.plan],
        ([state, plan]) => {
          audio.setBreathingSession(
            state === 'running' && plan ? { plan, readElapsed: breath.readElapsed } : null,
          )
        },
        { flush: 'sync' },
      )
      return () => null
    },
  })
  app.mount({})
  testContext.after(() => {
    app.unmount()
    globalThis.performance.now = restoreNow
    delete globalThis.Audio
    delete globalThis.window
    delete globalThis.document
    delete globalThis.requestAnimationFrame
    delete globalThis.cancelAnimationFrame
    delete globalThis.quietMomentOffline
  })

  await audio.playSound(defaultPreferences.sound)
  assert.equal(sources.length, 0, 'music is silent before breathing starts')
  breath.start()
  assert.deepEqual(sources[0].started, { when: 10, offset: 0 })
  assert.equal(sources[0].loopEnd, 10)

  audioTime = 17.25
  time = 7300
  nextFrame()
  assert.equal(breath.phase.value.name, 'exhale')
  assert.equal(breath.readElapsed(), 7.25)

  audioTime = 17.5
  breath.pause()
  assert.equal(breath.readElapsed(), 7.5)
  assert.equal(sources[0].stopped, 17.52)
  assert.equal(audio.readBreathingElapsed(), null)

  audioTime = 40
  time = 30000
  breath.resume()
  assert.deepEqual(sources[1].started, { when: 40, offset: 7.5 })
  assert.equal(sources[1].buffer, sources[0].buffer)
  assert.equal(breath.readElapsed(), 7.5)

  audioTime = 42.5
  time = 32540
  nextFrame()
  assert.equal(breath.phase.value.name, 'inhale')
  assert.equal(breath.phase.value.cycle, 1)

  await audio.playSound('breath-lofi')
  assert.deepEqual(sources.at(-1).started, { when: 42.5, offset: 0 })
  assert.notEqual(sources.at(-1).buffer, sources[1].buffer)

  await audio.playSound('rain')
  assert.equal(regularTracks.at(-1).source, 'rain')
  assert.equal(audio.readBreathingElapsed(), null)
  breath.pause()
  assert.equal(regularTracks.at(-1).paused, false)
  breath.stop()
  assert.equal(regularTracks.at(-1).paused, false)
  await audio.playSound('off')
  assert.equal(regularTracks.at(-1).paused, true)
  assert.equal(context.state, 'running')
})
