import { onMounted, onUnmounted, watch } from 'vue'
import type { Preferences } from './preferences'

export function useThemePreference(preferences: Readonly<Preferences>) {
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')

  function applyTheme() {
    const theme =
      preferences.theme === 'system' ? (systemTheme.matches ? 'dark' : 'light') : preferences.theme
    const root = document.documentElement
    root.dataset.theme = theme
    if (themeColor) {
      themeColor.content = getComputedStyle(root).getPropertyValue('--topbar').trim()
    }
  }

  watch(() => preferences.theme, applyTheme, { immediate: true })
  onMounted(() => systemTheme.addEventListener('change', applyTheme))
  onUnmounted(() => systemTheme.removeEventListener('change', applyTheme))
}
