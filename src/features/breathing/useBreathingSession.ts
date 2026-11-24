import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { Preferences } from '../settings/sessionPreferences'
import { getPaceRhythm, getPhase, roundSessionDuration } from './breathingTiming.ts'
import type { BreathingPhaseName, BreathingPlan } from './breathingTiming'

export type BreathingState = 'ready' | 'running' | 'paused' | 'complete'

export function useBreathingSession(
  preferences: Readonly<Preferences>,
  onComplete: () => void,
  onCue: (phase: BreathingPhaseName) => void,
  onQuiet: () => void,
  readMusicElapsed: () => number | null,
) {
  const state = ref<BreathingState>('ready')
  const elapsed = ref(0)
  const plan = ref<(BreathingPlan & { total: number }) | null>(null)
  const rhythm = computed(() => plan.value ?? getPaceRhythm(preferences))
  const phase = computed(() => plan.value && getPhase(elapsed.value, plan.value))
  const remaining = computed(() =>
    plan.value ? Math.max(0, Math.ceil(plan.value.total - elapsed.value)) : preferences.duration,
  )
  let frame = 0
  let startTime = 0
  let lastCue = ''

  function readElapsed() {
    if (state.value !== 'running') return elapsed.value

    const now = performance.now()
    const musicElapsed = readMusicElapsed()
    if (musicElapsed !== null) {
      startTime = now - musicElapsed * 1000
      return musicElapsed
    }
    return Math.max(0, (now - startTime) / 1000)
  }

  function update() {
    const activePlan = plan.value
    if (state.value !== 'running' || !activePlan) return
    elapsed.value = readElapsed()
    if (elapsed.value >= activePlan.total) {
      state.value = 'complete'
      onQuiet()
      onComplete()
      return
    }

    const currentPhase = phase.value
    if (!currentPhase) return
    const nextCue = `${currentPhase.cycle}-${currentPhase.name}`
    if (nextCue !== lastCue) {
      lastCue = nextCue
      onCue(currentPhase.name)
    }
    frame = requestAnimationFrame(update)
  }

  function start() {
    const activeRhythm = getPaceRhythm(preferences)
    plan.value = {
      ...activeRhythm,
      prep: preferences.prep,
      total:
        preferences.prep + roundSessionDuration(preferences.duration, activeRhythm.cycleDuration),
    }
    cancelAnimationFrame(frame)
    onQuiet()
    elapsed.value = 0
    lastCue = ''
    startTime = performance.now()
    state.value = 'running'
    update()
  }

  function pause() {
    if (state.value !== 'running') return
    elapsed.value = readElapsed()
    state.value = 'paused'
    cancelAnimationFrame(frame)
    onQuiet()
  }

  function resume() {
    if (state.value !== 'paused') return
    lastCue = ''
    startTime = performance.now() - elapsed.value * 1000
    state.value = 'running'
    update()
  }

  function stop() {
    cancelAnimationFrame(frame)
    state.value = 'ready'
    elapsed.value = 0
    plan.value = null
    onQuiet()
  }

  function pauseWhenHidden() {
    if (document.hidden) pause()
  }

  onMounted(() => document.addEventListener('visibilitychange', pauseWhenHidden))
  onUnmounted(() => {
    stop()
    document.removeEventListener('visibilitychange', pauseWhenHidden)
  })

  return { state, plan, phase, rhythm, remaining, readElapsed, start, pause, resume, stop }
}
