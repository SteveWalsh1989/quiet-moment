<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import AppIcon from './AppIcon.vue'

const isOpen = defineModel<boolean>('open', { required: true })
const trigger = ref<HTMLButtonElement | null>(null)
const panel = ref<HTMLDialogElement | null>(null)
const supportsPopover = 'showPopover' in HTMLElement.prototype

function placePanel() {
  const bounds = trigger.value?.getBoundingClientRect()
  const dialog = panel.value
  if (!bounds || !dialog) return

  const gutter = 12
  const gap = 8
  const above = bounds.top - gap - gutter
  const below = window.innerHeight - bounds.bottom - gap - gutter
  const opensAbove = below < 320 && above > below
  const available = opensAbove ? above : below

  dialog.style.setProperty(
    '--settings-right',
    `${Math.max(gutter, window.innerWidth - bounds.right)}px`,
  )
  dialog.style.setProperty('--settings-top', opensAbove ? 'auto' : `${bounds.bottom + gap}px`)
  dialog.style.setProperty(
    '--settings-bottom',
    opensAbove ? `${window.innerHeight - bounds.top + gap}px` : 'auto',
  )
  dialog.style.setProperty('--settings-height', `${Math.max(120, available)}px`)
}

function handlePopoverToggle(event: ToggleEvent) {
  isOpen.value = event.newState === 'open'
}

function handleTrigger() {
  const dialog = panel.value
  if (!dialog) return
  if (!isOpen.value) trigger.value?.focus({ preventScroll: true })
  if (supportsPopover) return

  if (dialog.open) dialog.close()
  else {
    placePanel()
    dialog.showModal()
    isOpen.value = true
  }
}

function closeSettings() {
  if (supportsPopover) panel.value?.hidePopover()
  else panel.value?.close()
  trigger.value?.focus({ preventScroll: true })
}

function dismissFallback(event: MouseEvent) {
  if (supportsPopover || !panel.value?.open) return
  const { left, right, top, bottom } = panel.value.getBoundingClientRect()
  if (
    event.clientX < left ||
    event.clientX > right ||
    event.clientY < top ||
    event.clientY > bottom
  ) {
    closeSettings()
  }
}

function reposition() {
  if (isOpen.value) placePanel()
}

onMounted(() => {
  window.addEventListener('resize', reposition)
  window.addEventListener('scroll', reposition, { passive: true })
})
onUnmounted(() => {
  window.removeEventListener('resize', reposition)
  window.removeEventListener('scroll', reposition)
})
</script>

<template>
  <button
    ref="trigger"
    type="button"
    class="header-icon-button"
    aria-label="Settings"
    aria-haspopup="dialog"
    :aria-expanded="isOpen"
    aria-controls="session-settings"
    title="Settings"
    popovertarget="session-settings"
    @click="handleTrigger"
  >
    <AppIcon name="settings" :size="21" />
  </button>
  <dialog
    id="session-settings"
    ref="panel"
    class="settings-popover"
    :popover="supportsPopover ? 'auto' : undefined"
    aria-labelledby="settings-heading"
    @beforetoggle="placePanel"
    @toggle="handlePopoverToggle"
    @close="isOpen = false"
    @click.self="dismissFallback"
  >
    <div class="settings-popover-header flex items-center justify-between">
      <h2 id="settings-heading">Settings</h2>
      <button
        type="button"
        class="settings-close"
        aria-label="Close settings"
        autofocus
        @click="closeSettings"
      >
        <AppIcon name="close" :size="19" />
      </button>
    </div>
    <div class="settings-popover-content">
      <slot />
    </div>
  </dialog>
</template>
