<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import AppIcon from '../../components/ui/AppIcon.vue'
import PromptPlayer from '../../components/player/PromptPlayer.vue'
import GroundingExercisePicker from './GroundingExercisePicker.vue'
import { grounding } from './groundingPrompts'
import type { GroundingId, GroundingStep } from './groundingPrompts'

const props = defineProps<{ guide: GroundingId }>()
const emit = defineEmits<{ complete: []; selectGuide: [guide: GroundingId] }>()
const stepIndex = ref(0)
const counts = ref<number[]>([])
const countStatusId = useId()
const groundSteps = computed<readonly GroundingStep[]>(() => grounding[props.guide].steps)
const step = computed(() => groundSteps.value[stepIndex.value])
const targetCount = computed(() => step.value.count ?? 0)
const noticed = computed(() => counts.value[stepIndex.value] ?? 0)
const lastStep = computed(() => stepIndex.value + 1 === groundSteps.value.length)

function countOne() {
  if (noticed.value < targetCount.value) {
    counts.value[stepIndex.value] = noticed.value + 1
  }
}

function undoCount() {
  if (noticed.value > 0) counts.value[stepIndex.value] = noticed.value - 1
}

function changeStep(index: number) {
  if (index >= groundSteps.value.length) {
    emit('complete')
    return
  }
  stepIndex.value = index
}
</script>

<template>
  <PromptPlayer
    :icon="step.icon"
    :progress="`${step.label} · Step ${stepIndex + 1} of ${groundSteps.length}`"
    :title="step.title"
    :action="lastStep ? 'Finish' : 'Next'"
    :action-icon="lastStep ? 'check' : 'arrow-right'"
    :can-go-back="stepIndex > 0"
    @back="changeStep(stepIndex - 1)"
    @next="changeStep(stepIndex + 1)"
  >
    <template #toolbar>
      <GroundingExercisePicker :guide="guide" @select="emit('selectGuide', $event)" />
    </template>
    <p>{{ step.example }}</p>
    <template v-if="targetCount" #support>
      <div class="grid gap-y-3 min-[960px]:gap-y-4">
        <p class="text-sm font-semibold text-player-muted">
          {{ step.note ?? 'Go at your own pace. Counting is optional.' }}
        </p>
        <div
          class="flex flex-wrap items-center gap-x-2 gap-y-2 sm:gap-x-4 min-[960px]:grid min-[960px]:gap-y-2.5"
        >
          <div :key="stepIndex" class="flex gap-1.5 min-[960px]:gap-2" aria-hidden="true">
            <span
              v-for="count in targetCount"
              :key="count"
              class="grounding-count-marker grid size-6 place-items-center rounded-full border border-player-border bg-player-edge text-action-ink min-[960px]:size-8"
              :class="{ 'is-counted': count <= noticed }"
            >
              <AppIcon name="check" :size="15" />
            </span>
          </div>
          <output
            :id="countStatusId"
            class="text-sm font-semibold tabular-nums text-player-muted"
            aria-live="polite"
            aria-atomic="true"
          >
            {{ noticed }} of {{ targetCount }} noticed
          </output>
        </div>
        <div class="flex flex-wrap items-center gap-1">
          <button
            type="button"
            class="grounding-count-button"
            :aria-describedby="countStatusId"
            :aria-disabled="noticed >= targetCount"
            @click="countOne"
          >
            <AppIcon name="plus" :size="17" />
            Count one
          </button>
          <button
            type="button"
            class="grounding-secondary"
            :aria-disabled="noticed === 0"
            @click="undoCount"
          >
            Undo
          </button>
        </div>
      </div>
    </template>
  </PromptPlayer>
</template>

<style scoped>
.grounding-count-marker.is-counted {
  @apply border-action bg-action;
}

.grounding-count-marker svg {
  @apply scale-75 opacity-0;
}

.grounding-count-marker.is-counted svg {
  @apply scale-100 opacity-100;
}

.grounding-count-button {
  @apply inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border bg-player-control px-3.5 py-2 text-sm font-bold text-on-player;
  border-color: color-mix(in srgb, var(--player-highlight) 60%, var(--player-edge));
}

.grounding-count-button:hover:not(:disabled, [aria-disabled='true']) {
  @apply bg-player-control-hover;
}

.grounding-count-button:is(:disabled, [aria-disabled='true']) {
  @apply cursor-default opacity-60;
}

@media (prefers-reduced-motion: no-preference) {
  .grounding-count-marker {
    @apply transition-colors duration-150 ease-out;
  }

  .grounding-count-marker svg {
    @apply transition-[opacity,transform] duration-150 ease-out;
  }
}

@media (min-width: 960px) {
  .grounding-count-button {
    @apply min-h-[52px] px-4 text-base;
  }
}
</style>
