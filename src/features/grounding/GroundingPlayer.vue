<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import AppIcon from '../../components/AppIcon.vue'
import { grounding } from './groundingPrompts'
import type { GroundingId, GroundingStep } from './groundingPrompts'

const props = defineProps<{ guide: GroundingId; isGuided: boolean }>()
const emit = defineEmits<{ complete: [] }>()
const stepIndex = ref(0)
const noticed = ref(0)
const title = ref<HTMLHeadingElement | null>(null)
const groundSteps = computed<readonly GroundingStep[]>(() => grounding[props.guide].steps)
const step = computed(() => groundSteps.value[stepIndex.value])
const needsGroundCount = computed(() =>
  Boolean(step.value.count && noticed.value < step.value.count),
)
const groundingAction = computed(() => {
  const lastStep = stepIndex.value + 1 === groundSteps.value.length
  if (needsGroundCount.value) return lastStep ? 'Skip and finish' : 'Skip prompt'
  return lastStep ? 'Finish grounding' : 'Next prompt'
})

function changeStep(index: number) {
  if (index >= groundSteps.value.length) {
    emit('complete')
    return
  }
  stepIndex.value = Math.max(0, index)
  noticed.value = 0
  void nextTick(() => title.value?.focus({ preventScroll: true }))
}
</script>

<template>
  <div class="prompt-content">
    <div class="step-line flex items-center">
      <AppIcon :name="step.icon" :size="20" />
      <span>Step {{ stepIndex + 1 }} of {{ groundSteps.length }}</span>
    </div>
    <h2 ref="title" tabindex="-1">{{ step.title }}</h2>
    <p>{{ step.prompt }}</p>
    <fieldset v-if="step.count" class="grounding-count" aria-describedby="grounding-count-hint">
      <legend class="sr-only">Things noticed</legend>
      <div class="flex flex-wrap items-baseline justify-between gap-x-3">
        <span id="grounding-count-hint">Tap a number as you go</span>
        <output class="grounding-count-total" aria-live="polite" aria-atomic="true"
          >{{ noticed }} / {{ step.count }} noticed</output
        >
      </div>
      <div class="mt-3 flex gap-1.5 min-[390px]:gap-2">
        <label v-for="count in step.count" :key="count" class="min-w-0 flex-1 cursor-pointer">
          <input
            v-model="noticed"
            type="radio"
            name="grounding-count"
            :value="count"
            :aria-label="`${count} of ${step.count} noticed`"
            class="sr-only"
          />
          <span class="grounding-count-choice" :class="{ 'is-counted': count <= noticed }">
            {{ count }}
            <AppIcon v-if="count <= noticed" name="check" :size="14" />
          </span>
        </label>
      </div>
    </fieldset>
    <div class="examples">
      <h3>For example</h3>
      <ul class="flex flex-wrap">
        <li v-for="example in step.examples" :key="example">{{ example }}</li>
      </ul>
    </div>
  </div>
  <div class="prompt-actions flex flex-wrap items-center">
    <button
      type="button"
      :class="needsGroundCount ? 'on-dark-button' : 'primary-button'"
      @click="changeStep(stepIndex + 1)"
    >
      {{ groundingAction }}
    </button>
    <button
      v-if="stepIndex"
      type="button"
      class="on-dark-button"
      @click="changeStep(stepIndex - 1)"
    >
      Back
    </button>
  </div>
  <div v-if="!isGuided" class="player-bottom">Take your time. You can skip any prompt.</div>
</template>
