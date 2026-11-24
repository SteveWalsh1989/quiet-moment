import { computed, onMounted, onUnmounted, ref } from 'vue'
import type { Preferences } from '../settings/sessionPreferences'

export function useMotionPreference(preferences: Readonly<Preferences>) {
  const systemMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const reducedMotion = ref(systemMotion.matches)

  function updateReducedMotion(event: MediaQueryListEvent) {
    reducedMotion.value = event.matches
  }

  onMounted(() => systemMotion.addEventListener('change', updateReducedMotion))
  onUnmounted(() => systemMotion.removeEventListener('change', updateReducedMotion))

  return computed(
    () => preferences.motion === 'on' || (preferences.motion === 'system' && !reducedMotion.value),
  )
}
