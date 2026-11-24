<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import AppIcon from '../../components/AppIcon.vue'
import PromptPlayer from '../../components/PromptPlayer.vue'
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
      <div class="grounding-count">
        <p class="grounding-count-hint">
          {{ step.note ?? 'Go at your own pace. Counting is optional.' }}
        </p>
        <div class="grounding-count-progress">
          <div :key="stepIndex" class="grounding-count-markers" aria-hidden="true">
            <span
              v-for="count in targetCount"
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
