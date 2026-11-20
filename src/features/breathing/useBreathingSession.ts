import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { Preferences } from '../../preferences'
import { getPaceRhythm, getPhase, roundSessionDuration } from './breathingTiming'
import type { BreathingPhaseName, BreathingPlan } from './breathingTiming'

export type BreathingState = 'ready' | 'running' | 'paused' | 'complete'

export function useBreathingSession(
  preferences: Readonly<Preferences>,
  onComplete: () => void,
  onCue: (phase: BreathingPhaseName) => void,
  onQuiet: () => void,
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

  function update(timestamp: number) {
    const activePlan = plan.value
    if (state.value !== 'running' || !activePlan) return
    elapsed.value = Math.max(0, (timestamp - startTime) / 1000)
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
    state.value = 'running'
    startTime = performance.now()
    update(startTime)
  }

  function pause() {
    if (state.value !== 'running') return
    state.value = 'paused'
    cancelAnimationFrame(frame)
    onQuiet()
  }

  function resume() {
    if (state.value !== 'paused') return
    state.value = 'running'
    lastCue = ''
    startTime = performance.now() - elapsed.value * 1000
    update(performance.now())
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

  return { state, phase, rhythm, remaining, start, pause, resume, stop }
}
