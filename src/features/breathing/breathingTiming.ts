import type { Preferences } from '../../preferences'

export const paces = [
  { id: 'gentle', title: 'Longer exhale', timing: [4, 6], detail: '4s in · 6s out' },
  { id: 'even', title: 'Steady rhythm', timing: [4, 4], detail: '4s in · 4s out' },
  { id: 'short', title: 'Shorter breaths', timing: [3, 4], detail: '3s in · 4s out' },
  { id: 'custom', title: 'Custom pace', detail: 'Set your own timing' },
] as const

export const breathingCues = {
  prepare: { title: 'Get comfortable', instruction: 'Breathe normally until the first cue.' },
  inhale: { title: 'Breathe in', instruction: 'Through your nose' },
  exhale: { title: 'Breathe out', instruction: 'Through your mouth' },
} as const

export type PaceId = (typeof paces)[number]['id']
export type BreathingPhaseName = keyof typeof breathingCues

export interface BreathingPlan {
  prep: number
  inhale: number
  exhale: number
}

export interface BreathingPhase {
  name: BreathingPhaseName
  cycle: number
  seconds: number
  expansion: number
}

export function roundSessionDuration(duration: number, inhale: number, exhale: number): number {
  const cycleDuration = inhale + exhale
  return Math.ceil(duration / cycleDuration) * cycleDuration
}

export function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

export function getTiming(
  preferences: Pick<Preferences, 'pace' | 'inhale' | 'exhale'>,
): readonly [number, number] {
  const pace = paces.find(({ id }) => id === preferences.pace)
  return pace && 'timing' in pace ? pace.timing : [preferences.inhale, preferences.exhale]
}

export function getPhase(elapsed: number, plan: BreathingPlan): BreathingPhase {
  if (elapsed < plan.prep) {
    return {
      name: 'prepare',
      cycle: -1,
      seconds: Math.ceil(plan.prep - elapsed),
      expansion: 0,
    }
  }

  const movingTime = elapsed - plan.prep
  const length = plan.inhale + plan.exhale
  const cycle = Math.floor(movingTime / length)
  const position = movingTime % length
  const inhaling = position < plan.inhale
  const duration = inhaling ? plan.inhale : plan.exhale
  const remainingSeconds = (inhaling ? plan.inhale : length) - position
  const remainingFraction = remainingSeconds / duration
  const expansion = inhaling ? 1 - remainingFraction : remainingFraction

  return {
    name: inhaling ? 'inhale' : 'exhale',
    cycle,
    seconds: Math.ceil(remainingSeconds),
    expansion: (1 - Math.cos(Math.PI * expansion)) / 2,
  }
}
