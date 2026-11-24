import type { Preferences } from '../settings/sessionPreferences'

export const paces = [
  {
    id: 'gentle',
    title: 'Longer exhale',
    timing: { inhale: 4, exhale: 6 },
    detail: 'Give the exhale a little more time.',
  },
  {
    id: 'even',
    title: 'Steady rhythm',
    timing: { inhale: 4, exhale: 4 },
    detail: 'Breathe in and out for the same count.',
  },
  {
    id: 'short',
    title: 'Shorter breaths',
    timing: { inhale: 3, exhale: 4 },
    detail: 'Use a shorter count for each breath.',
  },
  {
    id: 'balanced',
    title: 'Slow and even',
    timing: { inhale: 5, exhale: 5 },
    detail: 'Take more time in both directions, at the same pace.',
  },
  {
    id: 'long-inhale',
    title: 'Longer inhale',
    timing: { inhale: 6, exhale: 4 },
    detail: 'Spend more time breathing in, then exhale for a shorter count.',
  },
  {
    id: 'three-part',
    title: 'Three-part breathing',
    timing: { inhale: 4, hold: 4, exhale: 4 },
    detail: 'Use equal counts, with a hold after breathing in.',
  },
  {
    id: 'box',
    title: 'Box breathing',
    timing: { inhale: 4, hold: 4, exhale: 4, rest: 4 },
    detail: 'Use four equal counts, with a hold after breathing in and after breathing out.',
  },
  {
    id: 'four-seven-eight',
    title: '4–7–8 breathing',
    timing: { inhale: 4, hold: 7, exhale: 8 },
    detail: 'Take a short inhale, a longer hold, and a slow exhale.',
  },
  {
    id: 'six-seven-eight',
    title: '6–7–8 variation',
    timing: { inhale: 6, hold: 7, exhale: 8 },
    detail: 'Use a two-second longer inhale than 4–7–8.',
  },
  {
    id: 'custom',
    title: 'Custom pace',
    detail: 'Set either hold to 0 to skip it.',
  },
] as const

export const breathingCues = {
  prepare: {
    title: 'Get comfortable',
    instruction: 'Breathe normally until the first cue.',
    shortLabel: 'Ready',
  },
  inhale: { title: 'Breathe in', instruction: 'Through your nose', shortLabel: 'In' },
  hold: { title: 'Hold gently', instruction: 'Pause after breathing in', shortLabel: 'Hold' },
  exhale: { title: 'Breathe out', instruction: 'Through your mouth', shortLabel: 'Out' },
  rest: { title: 'Pause gently', instruction: 'Wait before the next inhale', shortLabel: 'Hold' },
} as const

const breathingSteps = [
  { name: 'inhale', label: 'In', from: 0, to: 1 },
  { name: 'hold', label: 'Hold in', from: 1, to: 1 },
  { name: 'exhale', label: 'Out', from: 1, to: 0 },
  { name: 'rest', label: 'Hold out', from: 0, to: 0 },
] as const

export type PaceId = (typeof paces)[number]['id']
export type BreathingPhaseName = keyof typeof breathingCues
type BreathingTiming = Pick<Preferences, 'inhale' | 'exhale'> &
  Partial<Pick<Preferences, 'hold' | 'rest'>>

export interface BreathingStep {
  name: Exclude<BreathingPhaseName, 'prepare'>
  label: string
  from: number
  to: number
  start: number
  duration: number
}

export interface BreathingRhythm {
  steps: BreathingStep[]
  cycleDuration: number
}

export interface BreathingPlan extends BreathingRhythm {
  prep: number
}

export interface BreathingPhase {
  name: BreathingPhaseName
  cycle: number
  seconds: number
  expansion: number
  position: number
}

export function roundSessionDuration(duration: number, cycleDuration: number): number {
  return Math.ceil(duration / cycleDuration) * cycleDuration
}

export function formatTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

export function getRhythm(timing: BreathingTiming): BreathingRhythm {
  const steps: BreathingStep[] = []
  let cycleDuration = 0

  for (const step of breathingSteps) {
    const duration = timing[step.name] ?? 0
    if (duration === 0) continue
    steps.push({ ...step, start: cycleDuration, duration })
    cycleDuration += duration
  }

  return { steps, cycleDuration }
}

export function getPaceRhythm(preferences: Pick<Preferences, 'pace'> & BreathingTiming) {
  const preset = paces.find(({ id }) => id === preferences.pace)
  return getRhythm(preset && 'timing' in preset ? preset.timing : preferences)
}

export function getPhase(elapsed: number, plan: BreathingPlan): BreathingPhase {
  if (elapsed < plan.prep) {
    return {
      name: 'prepare',
      cycle: -1,
      seconds: Math.ceil(plan.prep - elapsed),
      expansion: 0,
      position: 0,
    }
  }

  const breathingTime = elapsed - plan.prep
  const cycle = Math.floor(breathingTime / plan.cycleDuration)
  const position = breathingTime % plan.cycleDuration
  const step = plan.steps.find(({ start, duration }) => position < start + duration)!
  const timeInStep = position - step.start
  const eased = (1 - Math.cos((Math.PI * timeInStep) / step.duration)) / 2

  return {
    name: step.name,
    cycle,
    seconds: Math.ceil(step.duration - timeInStep),
    expansion: step.from + (step.to - step.from) * eased,
    position,
  }
}
