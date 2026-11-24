<script setup lang="ts">
import { computed, nextTick, ref, useId } from 'vue'
import AppIcon from '../../components/AppIcon.vue'
import GroundingExercisePicker from './GroundingExercisePicker.vue'
import { grounding } from './groundingPrompts'
import type { GroundingId, GroundingStep } from './groundingPrompts'

const props = defineProps<{ guide: GroundingId }>()
const emit = defineEmits<{ complete: []; selectGuide: [guide: GroundingId] }>()
const stepIndex = ref(0)
const counts = ref<number[]>([])
const title = ref<HTMLHeadingElement | null>(null)
const countStatusId = useId()
const groundSteps = computed<readonly GroundingStep[]>(() => grounding[props.guide].steps)
const step = computed(() => groundSteps.value[stepIndex.value])
const noticed = computed(() => counts.value[stepIndex.value] ?? 0)
const lastStep = computed(() => stepIndex.value + 1 === groundSteps.value.length)

function countOne() {
  if (step.value.count && noticed.value < step.value.count) {
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
  void nextTick(() => title.value?.focus())
}
</script>

<template>
  <div class="grounding-player">
    <div class="grounding-toolbar">
      <div class="step-line flex flex-wrap items-center">
        <AppIcon :name="step.icon" :size="18" class="text-player-highlight" />
        <span>{{ step.label }}</span>
        <span aria-hidden="true">·</span>
        <span>Step {{ stepIndex + 1 }} of {{ groundSteps.length }}</span>
      </div>
      <GroundingExercisePicker :guide="guide" @select="emit('selectGuide', $event)" />
    </div>
    <div class="grounding-prompt">
      <h2 ref="title" tabindex="-1">{{ step.title }}</h2>
      <p>{{ step.example }}</p>
    </div>
    <div v-if="step.count" class="grounding-count">
      <p class="grounding-count-hint">
        {{ step.note ?? 'Go at your own pace. Counting is optional.' }}
      </p>
      <div class="flex flex-wrap items-center gap-x-2 gap-y-2 sm:gap-x-4">
        <div :key="stepIndex" class="flex gap-1.5" aria-hidden="true">
          <span
            v-for="count in step.count"
            :key="count"
            class="grounding-count-marker"
            :class="{ 'is-counted': count <= noticed }"
          >
            <AppIcon name="check" :size="15" />
          </span>
        </div>
        <output
          :id="countStatusId"
          class="grounding-count-total"
          aria-live="polite"
          aria-atomic="true"
        >
          {{ noticed }} of {{ step.count }} noticed
        </output>
      </div>
      <div class="flex flex-wrap items-center gap-1">
        <button
          type="button"
          class="grounding-count-button"
          :aria-describedby="countStatusId"
          :aria-disabled="noticed >= step.count"
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
    <div class="grounding-actions">
      <button
        v-if="stepIndex"
        type="button"
        class="grounding-secondary"
        @click="changeStep(stepIndex - 1)"
      >
        <AppIcon name="arrow-left" :size="17" />
        Back
      </button>
      <button
        type="button"
        class="primary-button grounding-next"
        @click="changeStep(stepIndex + 1)"
      >
        {{ lastStep ? 'Finish' : 'Next' }}
        <AppIcon :name="lastStep ? 'check' : 'arrow-right'" :size="17" />
      </button>
    </div>
  </div>
</template>
