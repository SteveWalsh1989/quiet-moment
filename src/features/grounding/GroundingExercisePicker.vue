<script setup lang="ts">
import { ref, useId } from 'vue'
import AppIcon from '../../components/AppIcon.vue'
import { grounding } from './groundingPrompts'
import type { GroundingId } from './groundingPrompts'

const props = defineProps<{ guide: GroundingId }>()
const emit = defineEmits<{ select: [guide: GroundingId] }>()
const panelId = useId()
const trigger = ref<HTMLButtonElement | null>(null)
const isOpen = ref(false)
const selected = ref(props.guide)

function closePicker() {
  isOpen.value = false
  trigger.value?.focus({ preventScroll: true })
}

function togglePicker() {
  if (isOpen.value) closePicker()
  else {
    selected.value = props.guide
    isOpen.value = true
  }
}
</script>

<template>
  <button
    ref="trigger"
    type="button"
    class="grounding-secondary grounding-picker-trigger"
    :aria-expanded="isOpen"
    :aria-controls="panelId"
    @click="togglePicker"
    @keydown.esc="closePicker"
  >
    Change exercise
    <AppIcon name="chevron" :size="15" />
  </button>
  <div v-show="isOpen" :id="panelId" class="grounding-picker" @keydown.esc.stop="closePicker">
    <fieldset class="grid gap-1.5" :aria-describedby="`${panelId}-note`">
      <legend class="sr-only">Grounding exercise</legend>
      <label v-for="(exercise, id) in grounding" :key="id" class="grounding-exercise-option">
        <input
          v-model="selected"
          type="radio"
          :name="panelId"
          :value="id"
          class="sr-only"
          :aria-labelledby="`${panelId}-${id}-name`"
          :aria-describedby="`${panelId}-${id}-detail`"
        />
        <span class="grounding-exercise-indicator" aria-hidden="true"></span>
        <span class="min-w-0">
          <strong :id="`${panelId}-${id}-name`" class="block font-bold">{{
            exercise.label
          }}</strong>
          <span :id="`${panelId}-${id}-detail`" class="block text-sm text-player-muted">
            {{ exercise.detail }}
          </span>
        </span>
      </label>
    </fieldset>
    <p :id="`${panelId}-note`" class="mt-3 text-sm text-player-muted">
      Switching starts at the first prompt and saves your choice.
    </p>
    <div class="mt-2 flex flex-wrap justify-end gap-1">
      <button type="button" class="grounding-secondary" @click="closePicker">Cancel</button>
      <button
        type="button"
        class="grounding-count-button"
        :disabled="selected === guide"
        @click="emit('select', selected)"
      >
        Start exercise
      </button>
    </div>
  </div>
</template>
