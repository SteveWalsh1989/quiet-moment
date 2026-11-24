<script setup lang="ts">
import { ref, useId } from 'vue'
import AppIcon from '../../components/ui/AppIcon.vue'
import PlayerPopover from '../../components/player/PlayerPopover.vue'
import { grounding } from './groundingPrompts'
import type { GroundingId } from './groundingPrompts'

const props = defineProps<{ guide: GroundingId }>()
const emit = defineEmits<{ select: [guide: GroundingId] }>()
const panelId = useId()
const isOpen = ref(false)
const selected = ref(props.guide)

function updateOpen(open: boolean) {
  if (open) selected.value = props.guide
  isOpen.value = open
}

function startExercise(close: () => void) {
  close()
  emit('select', selected.value)
}
</script>

<template>
  <PlayerPopover
    :open="isOpen"
    label="Change exercise"
    close-label="Close exercise chooser"
    trigger-class="grounding-secondary grounding-picker-trigger"
    @update:open="updateOpen"
  >
    <template #trigger>
      Change exercise
      <AppIcon name="chevron" :size="15" />
    </template>
    <template #default>
      <fieldset class="grid gap-1.5 pt-3" :aria-describedby="`${panelId}-note`">
        <legend class="sr-only">Grounding exercise</legend>
        <label
          v-for="(exercise, id) in grounding"
          :key="id"
          class="grounding-exercise-option relative flex min-h-[54px] cursor-pointer items-center gap-3 rounded-lg border border-transparent px-3 py-2 hover:bg-hover"
        >
          <input
            v-model="selected"
            type="radio"
            :name="panelId"
            :value="id"
            class="sr-only"
            :aria-labelledby="`${panelId}-${id}-name`"
            :aria-describedby="`${panelId}-${id}-detail`"
          />
          <span
            class="grounding-exercise-indicator grid size-5 shrink-0 place-items-center rounded-full border border-field-line"
            aria-hidden="true"
          ></span>
          <span class="min-w-0">
            <strong :id="`${panelId}-${id}-name`" class="block font-bold">{{
              exercise.label
            }}</strong>
            <span :id="`${panelId}-${id}-detail`" class="block text-sm text-muted">
              {{ exercise.detail }}
            </span>
          </span>
        </label>
      </fieldset>
    </template>
    <template #footer="{ close }">
      <p :id="`${panelId}-note`" class="text-sm text-muted">
        Switching starts at the first prompt and saves your choice.
      </p>
      <div class="mt-2 flex flex-wrap justify-end gap-1">
        <button type="button" class="player-popover-cancel" @click="close">Cancel</button>
        <button
          type="button"
          class="player-popover-action"
          :disabled="selected === guide"
          @click="startExercise(close)"
        >
          Start exercise
        </button>
      </div>
    </template>
  </PlayerPopover>
</template>

<style scoped>
.grounding-exercise-option:has(input:checked) {
  @apply border-field-line bg-selected;
}

.grounding-exercise-option:has(input:focus-visible) {
  @apply outline outline-2 outline-focus outline-offset-[-2px];
}

.grounding-exercise-indicator::after {
  @apply size-2.5 scale-50 rounded-full bg-accent opacity-0 content-[''];
}

input:checked + .grounding-exercise-indicator::after {
  @apply scale-100 opacity-100;
}

@media (prefers-reduced-motion: no-preference) {
  .grounding-exercise-option {
    @apply transition-colors duration-150 ease-out;
  }

  .grounding-exercise-indicator::after {
    @apply transition-[opacity,transform] duration-150 ease-out;
  }
}

@media (forced-colors: active) {
  .grounding-exercise-option:has(input:checked) {
    border-color: Highlight;
  }

  .grounding-exercise-indicator::after {
    forced-color-adjust: none;
    background: Highlight;
  }
}
</style>
