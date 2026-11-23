import type { BreathingPhaseName } from '../breathing/breathingTiming'

interface Voicing {
  readonly chord: readonly number[]
  readonly bass: readonly number[]
  readonly melody: readonly number[]
}

export interface BreathingArrangement {
  readonly id: string
  readonly title: string
  readonly detail: string
  readonly style: 'felt' | 'tape' | 'pluck'
  readonly voicings: Record<BreathingPhaseName, Voicing>
}

export const breathingArrangements = [
  {
    id: 'breath-tape',
    title: 'Velvet Tape',
    detail: 'Mellow keys, a moving bass line and a brushed beat',
    style: 'tape',
    voicings: {
      prepare: { chord: [50, 57, 65, 72], bass: [38, 45], melody: [57, 60, 65, 64] },
      inhale: { chord: [46, 53, 62, 69], bass: [34, 41, 45], melody: [60, 62, 65, 69] },
      hold: { chord: [55, 62, 70, 77], bass: [43, 38, 41], melody: [65, 62, 58, 62] },
      exhale: { chord: [50, 57, 65, 72], bass: [38, 45, 36, 38], melody: [65, 64, 62, 57, 60, 57] },
      rest: { chord: [53, 60, 69, 76], bass: [41, 36], melody: [60, 65, 69, 64] },
    },
  },
  {
    id: 'breath-lofi',
    title: 'Warm Keys',
    detail: 'Felt piano, rounded bass and a gentle count',
    style: 'felt',
    voicings: {
      prepare: { chord: [48, 55, 64], bass: [36], melody: [64, 60, 55] },
      inhale: { chord: [53, 60, 69], bass: [41], melody: [60, 65, 69, 65] },
      hold: { chord: [57, 64, 72], bass: [45], melody: [69, 64, 60, 64] },
      exhale: { chord: [48, 55, 64], bass: [36], melody: [67, 64, 60, 55, 60, 64] },
      rest: { chord: [50, 57, 65], bass: [38], melody: [65, 62, 57, 60] },
    },
  },
  {
    id: 'breath-afterglow',
    title: 'Afterglow',
    detail: 'Soft plucked notes over a slow, airy pad',
    style: 'pluck',
    voicings: {
      prepare: { chord: [52, 59, 68, 71], bass: [40], melody: [59, 64, 68, 64, 59] },
      inhale: { chord: [57, 64, 73, 76], bass: [45, 40], melody: [61, 64, 69, 73, 69] },
      hold: { chord: [54, 61, 69, 76], bass: [42, 37], melody: [64, 66, 69, 66, 61] },
      exhale: { chord: [52, 59, 68, 75], bass: [40, 35, 40], melody: [71, 68, 64, 63, 59, 64] },
      rest: { chord: [56, 63, 71, 78], bass: [44, 39], melody: [66, 63, 59, 56, 59] },
    },
  },
] as const satisfies readonly BreathingArrangement[]

export type BreathingSoundId = (typeof breathingArrangements)[number]['id']
export const defaultSound = 'breath-tape' satisfies BreathingSoundId

export function isBreathingSound(id: unknown): id is BreathingSoundId {
  return breathingArrangements.some((arrangement) => arrangement.id === id)
}

export const quietSound = { id: 'off', title: 'Quiet', detail: 'No background sound' } as const

export const ambientSounds = [
  { id: 'lofi', title: 'Soft lo-fi', detail: 'Warm keys and a slow beat' },
  { id: 'rain', title: 'Window rain', detail: 'A soft, steady rain' },
  { id: 'ocean', title: 'Slow tide', detail: 'Low, rolling waves' },
] as const

export const soundTracks = [quietSound, ...breathingArrangements, ...ambientSounds] as const
export type SoundId = (typeof soundTracks)[number]['id']
