<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '../../components/AppIcon.vue'
import { breathingCues } from './breathingTiming'
import type { BreathingPhase, BreathingRhythm } from './breathingTiming'
import type { BreathingState } from './useBreathingSession'

const props = defineProps<{
  isBreathing: boolean
  isGuided: boolean
  breathState: BreathingState
  phase: BreathingPhase | null
  rhythm: BreathingRhythm
  motionEnabled: boolean
  countdown: boolean
}>()
const emit = defineEmits<{
  start: []
  pause: []
  resume: []
  stop: []
}>()

const breathCue = computed(() => {
  if (!props.isBreathing) {
    return {
      title: 'Ready when you are',
      instruction: 'Gently in through your nose, out through your mouth.',
    }
  }
  if (props.breathState === 'paused') {
    return { title: 'Paused', instruction: 'Breathe normally. Resume when you’re ready.' }
  }
  return props.phase ? breathingCues[props.phase.name] : breathingCues.prepare
})
const isBreathCue = computed(
  () => props.isBreathing && props.breathState === 'running' && props.phase?.name !== 'prepare',
)
const orbLabel = computed(() => {
  if (props.isBreathing) {
    return props.breathState === 'paused' ? 'Resume breathing' : 'Pause breathing'
  }
  return props.isGuided ? 'Start quick reset' : 'Start breathing'
})

const orbCue = computed(() => breathingCues[props.phase?.name ?? 'prepare'].shortLabel)
const isDirectionCue = computed(
  () => props.phase?.name === 'inhale' || props.phase?.name === 'exhale',
)
const activeInstruction = computed(() =>
  isDirectionCue.value
    ? `${breathCue.value.title} ${breathCue.value.instruction.toLowerCase()}`
    : breathCue.value.instruction,
)

const ringSegments = computed(() =>
  props.rhythm.steps.map((step) => {
    const gap = 1.4
    const start = (100 * step.start) / props.rhythm.cycleDuration

    return {
      ...step,
      rotation: start * 3.6 - 90 + gap * 1.8,
      length: (100 * step.duration) / props.rhythm.cycleDuration - gap,
    }
  }),
)
const ringProgress = computed(() => {
  const position = props.phase?.position ?? 0
  return ringSegments.value.map((segment) => {
    const fraction = Math.min(1, Math.max(0, (position - segment.start) / segment.duration))
    return segment.length * fraction
  })
})

function activateCircle() {
  if (!props.isBreathing) emit('start')
  else if (props.breathState === 'paused') emit('resume')
  else emit('pause')
}
</script>

<template>
  <div class="breathing-stage">
    <div
      class="breath-copy text-center"
      :class="{ 'breath-copy-active': isBreathCue }"
      :aria-live="isBreathing ? 'polite' : 'off'"
      aria-atomic="true"
    >
      <h2 tabindex="-1">{{ isBreathCue ? activeInstruction : breathCue.title }}</h2>
      <p v-if="!isBreathCue">{{ breathCue.instruction }}</p>
    </div>
    <div class="orb-area">
      <button
        type="button"
        class="breath-orb [container-type:inline-size]"
        :class="{
          'breath-orb-ready': !isBreathing,
          'breath-orb-preparing': phase?.name === 'prepare',
        }"
        :style="{ '--expansion': phase?.expansion ?? 0 }"
        :aria-label="orbLabel"
        @click="activateCircle"
      >
        <svg class="breath-ring" viewBox="0 0 208 208" aria-hidden="true">
          <g
            v-for="(segment, index) in ringSegments"
            :key="segment.name"
            :class="`breath-ring-${segment.name}`"
            :transform="`rotate(${segment.rotation} 104 104)`"
          >
            <circle
              class="breath-ring-track"
              cx="104"
              cy="104"
              r="100"
              pathLength="100"
              :stroke-dasharray="`${segment.length} 100`"
            />
            <circle
              v-if="motionEnabled && phase && phase.name !== 'prepare'"
              class="breath-ring-fill"
              cx="104"
              cy="104"
              r="100"
              pathLength="100"
              :stroke-dasharray="`${ringProgress[index]} 100`"
            />
          </g>
        </svg>
        <span class="guide-ring guide-ring-inner" aria-hidden="true"></span>
        <span class="orb-body" aria-hidden="true"></span>
        <span class="orb-core" aria-hidden="true"></span>
        <span v-if="!isBreathing" class="orb-start" aria-hidden="true">
          <AppIcon name="play" :size="20" />
          <span>Start</span>
        </span>
        <span v-else-if="breathState === 'paused'" class="orb-start" aria-hidden="true">
          <AppIcon name="play" :size="20" />
          <span>Resume</span>
        </span>
        <span v-else class="orb-cue" aria-hidden="true">
          <span
            class="font-extrabold tracking-tight"
            :class="
              isDirectionCue
                ? 'text-[length:clamp(2rem,calc(31cqi_-_0.875rem),7.5rem)]'
                : 'text-[length:clamp(1.875rem,21cqi,5rem)]'
            "
            >{{ orbCue }}</span
          >
          <span v-if="countdown" class="orb-counter">{{ phase?.seconds }}</span>
        </span>
      </button>
    </div>
    <div v-if="isBreathing" class="player-actions flex flex-wrap items-center justify-center">
      <button
        v-if="breathState === 'paused'"
        type="button"
        class="primary-button"
        @click="emit('resume')"
      >
        <AppIcon name="play" :size="18" />Resume
      </button>
      <button v-else type="button" class="primary-button" @click="emit('pause')">
        <AppIcon name="pause" :size="18" />Pause
      </button>
      <button type="button" class="on-dark-button" @click="emit('stop')">Reset</button>
    </div>
  </div>
  <div v-if="!isGuided" class="player-bottom">
    Let the timing be a guide. Breathe at your own pace.
  </div>
</template>
