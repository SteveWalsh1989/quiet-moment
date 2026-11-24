<script setup lang="ts">
import { onMounted, onUnmounted, ref, useId } from 'vue'
import AppIcon from './AppIcon.vue'

defineProps<{
  label: string
  closeLabel: string
  triggerClass: string
  dimBackdrop?: boolean
}>()
const isOpen = defineModel<boolean>('open', { required: true })
const panelId = useId()
const headingId = `${panelId}-heading`
const trigger = ref<HTMLButtonElement | null>(null)
const panel = ref<HTMLDialogElement | null>(null)
const supportsPopover = 'showPopover' in HTMLElement.prototype

function placePanel() {
  const bounds = trigger.value?.getBoundingClientRect()
  const dialog = panel.value
  if (!bounds || !dialog) return

  const gutter = 12
  const gap = 8
  const { clientWidth: width, clientHeight: height } = document.documentElement
  const top = Math.max(gutter, bounds.bottom + gap)
  const bottom = Math.max(gutter, height - bounds.top + gap)
  const above = height - bottom - gutter
  const below = height - top - gutter
  const opensAbove = below < 320 && above > below
  const available = opensAbove ? above : below
  const fitsBesideTrigger = available >= 160

  dialog.style.setProperty('--popover-right', `${Math.max(gutter, width - bounds.right)}px`)
  dialog.style.setProperty(
    '--popover-top',
    !fitsBesideTrigger ? `${gutter}px` : opensAbove ? 'auto' : `${top}px`,
  )
  dialog.style.setProperty(
    '--popover-bottom',
    fitsBesideTrigger && opensAbove ? `${bottom}px` : 'auto',
  )
  dialog.style.setProperty(
    '--popover-height',
    `${fitsBesideTrigger ? available : height - 2 * gutter}px`,
  )
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

function closePopover() {
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
    closePopover()
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
    :class="triggerClass"
    :aria-label="label"
    aria-haspopup="dialog"
    :aria-expanded="isOpen"
    :aria-controls="panelId"
    :title="label"
    :popovertarget="panelId"
    @click="handleTrigger"
  >
    <slot name="trigger" />
  </button>
  <dialog
    :id="panelId"
    ref="panel"
    class="player-popover"
    :class="{ 'player-popover-dim': dimBackdrop }"
    :popover="supportsPopover ? 'auto' : undefined"
    :aria-labelledby="headingId"
    @beforetoggle="placePanel"
    @toggle="handlePopoverToggle"
    @close="isOpen = false"
    @click.self="dismissFallback"
  >
    <div class="player-popover-header flex items-center justify-between">
      <h2 :id="headingId" :class="$slots.header ? 'sr-only' : 'pl-2 font-extrabold'">
        {{ label }}
      </h2>
      <slot name="header" />
      <button
        type="button"
        class="player-popover-close"
        :aria-label="closeLabel"
        autofocus
        @click="closePopover"
      >
        <AppIcon name="close" :size="18" />
      </button>
    </div>
    <div class="player-popover-content">
      <slot />
    </div>
    <div v-if="$slots.footer" class="player-popover-footer">
      <slot name="footer" :close="closePopover" />
    </div>
  </dialog>
</template>
