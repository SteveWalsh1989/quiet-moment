import type { BreathingPhaseName } from '../breathing/breathingTiming'

interface Voicing {
  readonly chord: readonly number[]
  readonly bass: number
  readonly pulse: readonly number[]
}

export interface BreathingArrangement {
  readonly id: string
  readonly title: string
  readonly detail: string
  readonly voicings: Record<BreathingPhaseName, Voicing>
}

export const breathingArrangements = [
  {
    id: 'breath-lofi',
    title: 'Breathing lo-fi · Warm Keys',
    detail: 'Soft piano pulses and chord changes synced to your breath',
    voicings: {
      prepare: { chord: [48, 55, 59, 62], bass: 36, pulse: [67, 64, 62] },
      inhale: { chord: [53, 57, 60, 64], bass: 41, pulse: [69, 72, 76, 72] },
      hold: { chord: [57, 60, 64, 67], bass: 45, pulse: [72, 71, 67, 64] },
      exhale: { chord: [48, 55, 59, 64], bass: 36, pulse: [67, 64, 62, 60, 62, 64] },
      rest: { chord: [50, 53, 57, 60], bass: 38, pulse: [65, 62, 60, 62] },
    },
  },
] as const satisfies readonly BreathingArrangement[]

export const defaultSound = breathingArrangements[0].id

export const soundTracks = [
  { id: 'off', title: 'Quiet', detail: 'No background sound' },
  ...breathingArrangements,
  { id: 'lofi', title: 'Soft lo-fi', detail: 'Warm keys and a slow beat' },
  { id: 'rain', title: 'Window rain', detail: 'A soft, steady rain' },
  { id: 'ocean', title: 'Slow tide', detail: 'Low, rolling waves' },
] as const

export type SoundId = (typeof soundTracks)[number]['id']
