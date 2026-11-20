<script setup lang="ts" generic="T extends string | number">
import { computed, nextTick, onMounted, onUnmounted, ref, useId, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import type { IconName } from './iconPaths'

const props = defineProps<{
  label: string
  options: readonly { id: T; label: string; detail?: string; icon?: IconName }[]
  iconOnly?: boolean
  descriptionId?: string
  disabled?: boolean
}>()
const value = defineModel<T>({ required: true })
const id = useId()
const listId = `${id}-options`
const root = ref<HTMLElement | null>(null)
const trigger = ref<HTMLButtonElement | null>(null)
const list = ref<HTMLElement | null>(null)
const isOpen = ref(false)
const active = ref(0)
const opensAbove = ref(false)
const maxHeight = ref(0)
const selected = computed(() => props.options.findIndex((option) => option.id === value.value))
let search = ''
let lastKeyTime = 0

function optionId(index: number) {
  return `${id}-option-${index}`
}

function highlight(index: number) {
  active.value = Math.max(0, Math.min(props.options.length - 1, index))
  void nextTick(() => {
    const option = list.value?.children.item(active.value)
    option?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  })
}

function open(index = selected.value) {
  const rect = trigger.value?.getBoundingClientRect()
  if (!rect || props.disabled || !props.options.length) return
  const above = rect.top
  const below = window.innerHeight - rect.bottom
  const preferred = Math.min(328, props.options.length * 55 + 12)
  opensAbove.value = below < preferred && above > below
  maxHeight.value = Math.min(preferred, Math.max(104, (opensAbove.value ? above : below) - 16))
  isOpen.value = true
  highlight(index)
}

function close() {
  isOpen.value = false
  search = ''
}

function toggle() {
  if (isOpen.value) close()
  else {
    trigger.value?.focus({ preventScroll: true })
    open()
  }
}

function choose(index: number) {
  const option = props.options[index]
  if (!option) return
  value.value = option.id
  close()
}

function typeAhead(key: string) {
  const now = performance.now()
  const character = key.toLocaleLowerCase()
  search = now - lastKeyTime < 650 ? search + character : character
  lastKeyTime = now
  const repeated = [...search].every((letter) => letter === character)
  const query = repeated ? character : search
  const start = active.value + Number(repeated)
  const count = props.options.length
  for (let offset = 0; offset < count; offset++) {
    const index = (start + offset) % count
    if (props.options[index].label.toLocaleLowerCase().startsWith(query)) {
      highlight(index)
      return
    }
  }
}

function handleKey(event: KeyboardEvent) {
  const { key } = event
  if (event.ctrlKey || event.metaKey || event.isComposing) return

  switch (key) {
    case 'ArrowDown':
    case 'ArrowUp':
      event.preventDefault()
      if (!isOpen.value) open()
      else if (event.altKey && key === 'ArrowUp') choose(active.value)
      else highlight(active.value + (key === 'ArrowDown' ? 1 : -1))
      break
    case 'Home':
    case 'End': {
      event.preventDefault()
      const index = key === 'Home' ? 0 : props.options.length - 1
      if (isOpen.value) highlight(index)
      else open(index)
      break
    }
    case 'Enter':
    case ' ':
      event.preventDefault()
      if (isOpen.value) choose(active.value)
      else open()
      break
    case 'Escape':
      if (!isOpen.value) return
      event.preventDefault()
      event.stopPropagation()
      close()
      break
    case 'Tab':
      if (isOpen.value) choose(active.value)
      break
    default:
      if (key.length !== 1 || event.altKey) return
      event.preventDefault()
      if (!isOpen.value) open()
      typeAhead(key)
  }
}

function closeOutside(event: PointerEvent) {
  if (event.target instanceof Node && !root.value?.contains(event.target)) close()
}

watch(() => props.disabled, close)
onMounted(() => document.addEventListener('pointerdown', closeOutside))
onUnmounted(() => document.removeEventListener('pointerdown', closeOutside))
</script>

<template>
  <div ref="root" class="select-menu">
    <label :id="`${id}-label`" :for="id" :class="iconOnly ? 'sr-only' : 'settings-select-label'">
      {{ label }}
    </label>
    <div class="relative" :class="{ 'mt-[7px]': !iconOnly }">
      <button
        :id="id"
        ref="trigger"
        type="button"
        role="combobox"
        :class="
          iconOnly
            ? 'theme-trigger'
            : 'control settings-select-trigger flex items-center justify-between gap-3 text-left'
        "
        :title="iconOnly ? `${label} · ${options[selected]?.label}` : undefined"
        :disabled="disabled"
        :aria-labelledby="`${id}-label`"
        :aria-describedby="descriptionId"
        :aria-expanded="isOpen"
        :aria-controls="listId"
        :aria-activedescendant="isOpen ? optionId(active) : undefined"
        @click="toggle"
        @blur="close"
        @keydown="handleKey"
      >
        <span :class="{ 'sr-only': iconOnly }">{{ options[selected]?.label }}</span>
        <AppIcon
          :name="iconOnly ? (options[selected]?.icon ?? 'monitor') : 'chevron'"
          :size="iconOnly ? 19 : 16"
        />
      </button>
      <div
        v-show="isOpen"
        :id="listId"
        ref="list"
        role="listbox"
        class="option-popup select-menu-popup"
        :class="{ 'select-menu-popup-above': opensAbove, 'theme-popup': iconOnly }"
        :style="{ maxHeight: `${maxHeight}px` }"
        :aria-labelledby="`${id}-label`"
      >
        <div
          v-for="(option, index) in options"
          :id="optionId(index)"
          :key="option.id"
          role="option"
          class="popup-option select-menu-option flex items-center text-left"
          :class="{ 'select-menu-option-active': active === index }"
          :aria-selected="index === selected"
          @mousedown.prevent
          @click="choose(index)"
        >
          <AppIcon v-if="option.icon" :name="option.icon" :size="17" />
          <span class="flex-1">
            <strong>{{ option.label }}</strong>
            <small v-if="option.detail">{{ option.detail }}</small>
          </span>
          <AppIcon v-if="index === selected" name="check" :size="17" />
        </div>
      </div>
    </div>
  </div>
</template>
