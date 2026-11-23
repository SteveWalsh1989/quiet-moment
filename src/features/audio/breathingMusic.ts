import type { BreathingPhaseName, BreathingPlan } from '../breathing/breathingTiming'
import type { BreathingArrangement } from './soundTracks'

const sampleRate = 22050

interface Tone {
  attack: number
  release: number
  decay: number
  sustain: number
  overtones: readonly [number, number]
  drift?: number
}

const felt: Tone = {
  attack: 0.065,
  release: 0.24,
  decay: 0.58,
  sustain: 0.16,
  overtones: [0.095, 0.018],
}
const tape: Tone = {
  attack: 0.07,
  release: 0.24,
  decay: 0.72,
  sustain: 0.22,
  overtones: [0.12, 0.025],
  drift: 0.0016,
}
const pluck: Tone = {
  attack: 0.04,
  release: 0.23,
  decay: 0.35,
  sustain: 0.07,
  overtones: [0.14, 0.045],
}
const pad: Tone = {
  attack: 0.2,
  release: 0.32,
  decay: 1.8,
  sustain: 0.55,
  overtones: [0.045, 0.009],
  drift: 0.0023,
}
const low: Tone = {
  attack: 0.09,
  release: 0.25,
  decay: 0.68,
  sustain: 0.19,
  overtones: [0.12, 0.015],
}

const textures = {
  felt: { harmony: felt, lead: felt, chordLevel: 0.055, pulseLevel: 0.074, brush: 0.015 },
  tape: { harmony: tape, lead: tape, chordLevel: 0.05, pulseLevel: 0.084, brush: 0.042 },
  pluck: { harmony: pad, lead: pluck, chordLevel: 0.041, pulseLevel: 0.09, brush: 0.018 },
}

export function renderBreathingMusic(plan: BreathingPlan, arrangement: BreathingArrangement) {
  const samples = new Float32Array((plan.prep + plan.cycleDuration) * sampleRate)
  const texture = textures[arrangement.style]

  function addTone(start: number, duration: number, note: number, volume: number, tone: Tone) {
    const offset = Math.round(start * sampleRate)
    const length = Math.min(Math.round(duration * sampleRate), samples.length - offset)
    const increment = (2 * Math.PI * 440 * 2 ** ((note - 69) / 12)) / sampleRate
    const decayRate = Math.exp(-1 / (sampleRate * tone.decay))
    const [second, third] = tone.overtones
    let decay = 1

    for (let index = 0; index < length; index++) {
      const phase = increment * index
      const attack = Math.min(1, index / (sampleRate * tone.attack))
      const release = Math.min(1, (length - 1 - index) / (sampleRate * tone.release))
      const envelope = attack * release * (tone.sustain + (1 - tone.sustain) * decay)
      const fundamental = tone.drift
        ? 0.78 * Math.sin(phase) + 0.22 * Math.sin(phase * (1 + tone.drift))
        : Math.sin(phase)
      const harmonics = Math.sin(2 * phase) * second + Math.sin(3 * phase) * third
      samples[offset + index] += (fundamental + harmonics) * envelope * volume
      decay *= decayRate
    }
  }

  function addBrush(start: number, volume: number) {
    const offset = Math.round(start * sampleRate)
    const length = Math.min(Math.round(0.11 * sampleRate), samples.length - offset)
    let noise = 0
    let seed = 4321 + offset

    for (let index = 0; index < length; index++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      noise += (seed / 2147483648 - 1 - noise) * 0.095
      const envelope = Math.sin((Math.PI * index) / (length - 1)) ** 2
      samples[offset + index] += noise * envelope * volume
    }
  }

  function addPhase(phase: BreathingPhaseName, start: number, duration: number) {
    const { chord, bass, melody } = arrangement.voicings[phase]
    const level = phase === 'prepare' ? 0.58 : 1
    const bassInterval = arrangement.style === 'tape' ? 2 : 3

    for (const note of chord)
      addTone(start, duration, note, texture.chordLevel * level, texture.harmony)
    for (let count = 0; count < duration; count += bassInterval) {
      const note = bass[(count / bassInterval) % bass.length]
      addTone(start + count, Math.min(1.55, duration - count), note, 0.096 * level, low)
    }

    for (let count = 0; count < duration; count++) {
      const time = start + count
      const pulseLevel = texture.pulseLevel * level * (count === 0 ? 1.08 : 1)
      const note = melody[count % melody.length]
      addTone(time, 0.79, note, pulseLevel, texture.lead)
      addBrush(time, texture.brush * level)

      if (arrangement.style === 'tape' && count % 2 === 1) {
        const reply = chord[(Math.floor(count / 2) + 1) % chord.length]
        addTone(time + 0.46, 0.46, reply, 0.031 * level, tape)
        addBrush(time + 0.46, 0.017 * level)
      } else if (arrangement.style === 'pluck' && count % 3 !== 2) {
        const reply = chord[(count + 1) % chord.length]
        addTone(time + 0.36, 0.5, reply, 0.036 * level, pluck)
        addTone(time + 0.62, 0.33, note, 0.012 * level, pluck)
      }
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
