import { paces } from './features/breathing/breathingTiming.ts'
import type { PaceId } from './features/breathing/breathingTiming.ts'
import { grounding } from './features/grounding/groundingPrompts.ts'
import type { GroundingId } from './features/grounding/groundingPrompts.ts'
import { defaultSound, isBreathingSound, soundTracks } from './features/audio/soundTracks.ts'
import type { BreathingSoundId, SoundId } from './features/audio/soundTracks.ts'

export type MotionPreference = 'system' | 'on' | 'off'
export type ThemePreference = 'system' | 'light' | 'dark'

export interface Preferences {
  pace: PaceId
  inhale: number
  hold: number
  exhale: number
  rest: number
  duration: number
  customDuration: boolean
  prep: number
  ground: GroundingId
  voice: boolean
  voiceVolume: number
  sound: Exclude<SoundId, 'off'>
  breathingSound: BreathingSoundId
  soundEnabled: boolean
  volume: number
  motion: MotionPreference
  theme: ThemePreference
  countdown: boolean
}

export const defaultPreferences: Readonly<Preferences> = {
  pace: 'gentle',
  inhale: 4,
  hold: 0,
  exhale: 6,
  rest: 0,
  duration: 60,
  customDuration: false,
  prep: 3,
  ground: 'full',
  voice: false,
  voiceVolume: 65,
  sound: defaultSound,
  breathingSound: defaultSound,
  soundEnabled: true,
  volume: 30,
  motion: 'on',
  theme: 'system',
  countdown: true,
}

export const preferenceLimits = {
  inhale: { min: 2, max: 10 },
  hold: { min: 0, max: 10 },
  exhale: { min: 2, max: 12 },
  rest: { min: 0, max: 10 },
  duration: { min: 15, max: 600 },
  volume: { min: 0, max: 100 },
  voiceVolume: { min: 0, max: 100 },
} as const

const storageKey = 'quiet-moment-preferences-v1'

export function boundedNumber(
  value: unknown,
  fallback: number,
  limits: { min: number; max: number },
) {
  return typeof value === 'number' && Number.isFinite(value)
    ? Math.min(limits.max, Math.max(limits.min, Math.round(value)))
    : fallback
}

export function normalizePreferences(input: unknown): Preferences {
  if (!input || typeof input !== 'object') return { ...defaultPreferences }
  const saved = input as Record<string, unknown>
  const pace = paces.find(({ id }) => id === saved.pace)?.id
  const savedSound = soundTracks.find(({ id }) => id === saved.sound)?.id
  const sound = savedSound === 'off' ? undefined : savedSound
  const breathingSound = isBreathingSound(sound)
    ? sound
    : isBreathingSound(saved.breathingSound)
      ? saved.breathingSound
      : defaultPreferences.breathingSound
  const ground =
    typeof saved.ground === 'string' && Object.hasOwn(grounding, saved.ground)
      ? (saved.ground as GroundingId)
      : defaultPreferences.ground
  const prep = [0, 3, 5, 10].find((seconds) => seconds === saved.prep)
  const motion =
    saved.motion === false || saved.motion === 'off'
      ? 'off'
      : saved.motion === true || saved.motion === 'system'
        ? 'system'
        : saved.motion === 'on'
          ? 'on'
          : defaultPreferences.motion

  return {
    pace: pace ?? defaultPreferences.pace,
    inhale: boundedNumber(saved.inhale, defaultPreferences.inhale, preferenceLimits.inhale),
    hold: boundedNumber(saved.hold, defaultPreferences.hold, preferenceLimits.hold),
    exhale: boundedNumber(saved.exhale, defaultPreferences.exhale, preferenceLimits.exhale),
    rest: boundedNumber(saved.rest, defaultPreferences.rest, preferenceLimits.rest),
    duration: boundedNumber(saved.duration, defaultPreferences.duration, preferenceLimits.duration),
    customDuration: saved.customDuration === true,
    prep: prep ?? defaultPreferences.prep,
    ground,
    voice: saved.voice === true,
    voiceVolume: boundedNumber(
      saved.voiceVolume,
      defaultPreferences.voiceVolume,
      preferenceLimits.voiceVolume,
    ),
    sound: sound ?? breathingSound,
    breathingSound,
    soundEnabled:
      savedSound !== 'off' &&
      (typeof saved.soundEnabled === 'boolean'
        ? saved.soundEnabled
        : defaultPreferences.soundEnabled),
    volume: boundedNumber(saved.volume, defaultPreferences.volume, preferenceLimits.volume),
    motion,
    theme:
      saved.theme === 'light' || saved.theme === 'dark' ? saved.theme : defaultPreferences.theme,
    countdown:
      typeof saved.countdown === 'boolean' ? saved.countdown : defaultPreferences.countdown,
  }
}

export function loadPreferences(): Preferences {
  try {
    return normalizePreferences(JSON.parse(localStorage.getItem(storageKey) || '{}'))
  } catch {
    return { ...defaultPreferences }
  }
}

export function savePreferences(preferences: Readonly<Preferences>) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(preferences))
  } catch {
    // A blocked storage API should never interrupt an exercise.
  }
}
