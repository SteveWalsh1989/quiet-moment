import type { BreathingPhaseName, BreathingPlan } from '../breathing/breathingTiming'
import type { BreathingArrangement } from './soundTracks'

const sampleRate = 22050

export function renderBreathingMusic(plan: BreathingPlan, arrangement: BreathingArrangement) {
  const samples = new Float32Array((plan.prep + plan.cycleDuration) * sampleRate)

  function addTone(start: number, duration: number, note: number, volume: number, warmth: number) {
    const offset = Math.round(start * sampleRate)
    const length = Math.min(Math.round(duration * sampleRate), samples.length - offset)
    const frequency = 440 * 2 ** ((note - 69) / 12)
    const increment = (2 * Math.PI * frequency) / sampleRate

    for (let index = 0; index < length; index++) {
      const time = index / sampleRate
      const phase = increment * index
      const attack = Math.min(1, time / 0.04)
      const release = Math.min(1, (length - 1 - index) / (sampleRate * 0.19))
      const decay = 0.24 + 0.76 * Math.exp(-time / 0.63)
      const harmonics = 0.1 * Math.sin(2 * phase) + 0.035 * Math.sin(3 * phase)
      const signal = Math.sin(phase + warmth * Math.exp(-time / 0.24) * Math.sin(2 * phase))
      samples[offset + index] += (signal + harmonics) * attack * release * decay * volume
    }
  }

  function addBrush(start: number, volume: number) {
    const offset = Math.round(start * sampleRate)
    const length = Math.min(Math.round(0.11 * sampleRate), samples.length - offset)
    let noise = 0
    let seed = 4321 + offset

    for (let index = 0; index < length; index++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      noise += (seed / 2147483648 - 1 - noise) * 0.18
      const envelope = Math.sin((Math.PI * index) / (length - 1)) ** 2
      samples[offset + index] += noise * envelope * volume
    }
  }

  function addPhase(phase: BreathingPhaseName, start: number, duration: number) {
    const { chord, bass, pulse } = arrangement.voicings[phase]
    const level = phase === 'prepare' ? 0.55 : 1

    for (const note of chord) addTone(start, duration, note, 0.085 * level, 0.32)
    addTone(start, Math.min(1.8, duration), bass, 0.13 * level, 0.03)

    for (let count = 0; count < duration; count++) {
      const time = start + count
      addTone(time, 0.78, pulse[count % pulse.length], 0.082 * level, 0.4)
      addBrush(time, 0.036 * level)
    }
  }

  if (plan.prep) addPhase('prepare', 0, plan.prep)
  for (const step of plan.steps) addPhase(step.name, plan.prep + step.start, step.duration)

  return { samples, sampleRate }
}

export interface MusicSession {
  plan: BreathingPlan & { total: number }
  readElapsed: () => number
}

export function createBreathingMusic(context: AudioContext) {
  const volume = context.createGain()
  volume.gain.value = 0
  volume.connect(context.destination)
  let playback: {
    source: AudioBufferSourceNode
    fade: GainNode
    startedAt: number
    elapsedAtStart: number
  } | null = null
  let prepared: { key: string; buffer: AudioBuffer } | null = null

  function stop() {
    if (!playback) return
    const { source, fade } = playback
    playback = null
    const now = context.currentTime
    fade.gain.cancelScheduledValues(now)
    fade.gain.setTargetAtTime(0, now, 0.004)
    source.stop(now + 0.02)
  }

  function start({ plan, readElapsed }: MusicSession, arrangement: BreathingArrangement) {
    if (playback) return
    const elapsedAtStart = readElapsed()
    if (elapsedAtStart >= plan.total) return

    const key = JSON.stringify([arrangement.id, plan.prep, plan.steps])
    if (prepared?.key !== key) {
      const { samples, sampleRate } = renderBreathingMusic(plan, arrangement)
      const buffer = context.createBuffer(1, samples.length, sampleRate)
      buffer.getChannelData(0).set(samples)
      prepared = { key, buffer }
    }

    const source = context.createBufferSource()
    const fade = context.createGain()
    source.buffer = prepared.buffer
    source.loop = true
    source.loopStart = plan.prep
    source.loopEnd = plan.prep + plan.cycleDuration
    source.connect(fade).connect(volume)
    source.onended = () => {
      source.disconnect()
      fade.disconnect()
    }

    const startedAt = context.currentTime
    const offset =
      elapsedAtStart < plan.prep
        ? elapsedAtStart
        : plan.prep + ((elapsedAtStart - plan.prep) % plan.cycleDuration)
    const endsAt = startedAt + plan.total - elapsedAtStart
    fade.gain.setValueAtTime(0, startedAt)
    fade.gain.linearRampToValueAtTime(1, Math.min(startedAt + 0.012, endsAt))
    if (endsAt - startedAt > 0.06) {
      fade.gain.setValueAtTime(1, endsAt - 0.04)
      fade.gain.linearRampToValueAtTime(0, endsAt)
    }
    source.start(startedAt, offset)
    source.stop(endsAt)
    playback = { source, fade, startedAt, elapsedAtStart }
  }

  return {
    start,
    stop,
    readElapsed: () =>
      playback ? playback.elapsedAtStart + context.currentTime - playback.startedAt : null,
    setVolume: (value: number) => volume.gain.setTargetAtTime(value, context.currentTime, 0.03),
  }
}
