export const soundTracks = [
  { id: 'off', title: 'Quiet', detail: 'No background sound' },
  { id: 'lofi', title: 'Soft lo-fi', detail: 'Warm keys and a slow beat' },
  { id: 'breath-lofi', title: 'Breathing lo-fi', detail: 'Beatless keys that follow your breath' },
  { id: 'rain', title: 'Window rain', detail: 'A soft, steady rain' },
  { id: 'ocean', title: 'Slow tide', detail: 'Low, rolling waves' },
] as const

export type SoundId = (typeof soundTracks)[number]['id']
