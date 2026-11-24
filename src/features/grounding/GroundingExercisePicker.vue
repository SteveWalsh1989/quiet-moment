<script setup lang="ts">
import { ref, useId } from 'vue'
import AppIcon from '../../components/AppIcon.vue'
import PlayerPopover from '../../components/PlayerPopover.vue'
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
