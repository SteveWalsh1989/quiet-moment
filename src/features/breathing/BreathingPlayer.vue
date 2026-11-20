<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '../../components/AppIcon.vue'
import { breathingCues } from './breathingTiming'
import type { BreathingPhase } from './breathingTiming'
import type { BreathingState } from './useBreathingSession'

const props = defineProps<{
  isBreathing: boolean
  isGuided: boolean
  breathState: BreathingState
  phase: BreathingPhase | null
  motionEnabled: boolean
  offerAnimatedStart: boolean
  countdown: boolean
}>()
const emit = defineEmits<{
  start: []
  pause: []
  resume: []
  stop: []
  ground: []
  toggleAnimation: []
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
  if (props.offerAnimatedStart) return 'Start with animation'
  return props.isGuided ? 'Start quick reset' : 'Start breathing'
})

function activateCircle() {
  if (!props.isBreathing) emit('start')
  else if (props.breathState === 'paused') emit('resume')
  else emit('pause')
}

</script>

<template>
  <div
    class="breath-copy text-center"
    :class="{ 'breath-copy-active': isBreathCue }"
    :aria-live="isBreathing ? 'polite' : 'off'"
    aria-atomic="true"
  >
    <h2 tabindex="-1">{{ breathCue.title }}</h2>
    <p>{{ breathCue.instruction }}</p>
  </div>
  <div class="orb-area">
    <button
      type="button"
      class="breath-orb"
      :class="{ 'breath-orb-ready': !isBreathing, 'breath-orb-preparing': phase?.name === 'prepare' }"
      :style="{ '--expansion': phase?.expansion ?? 0 }"
      :aria-label="orbLabel"
      @click="activateCircle"
    >
      <span class="guide-ring guide-ring-outer" aria-hidden="true"></span>
      <span class="guide-ring guide-ring-inner" aria-hidden="true"></span>
      <span class="orb-body" aria-hidden="true"></span>
      <span class="orb-core" aria-hidden="true"></span>
      <span v-if="!isBreathing" class="orb-start" aria-hidden="true">
        <AppIcon name="play" :size="20" />
        <span>Start</span>
        <small v-if="offerAnimatedStart">With animation</small>
      </span>
      <span v-else-if="breathState === 'paused'" class="orb-start" aria-hidden="true">
        <AppIcon name="play" :size="20" />
        <span>Resume</span>
      </span>
      <span v-else-if="countdown" class="orb-counter" aria-hidden="true">{{ phase?.seconds }}</span>
      <AppIcon v-else class="orb-mark" name="breathe" :size="30" />
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
  <div class="player-bottom">
    <template v-if="isGuided">
      <span class="flow-position"><i class="active"></i> Breathing</span>
      <span class="flow-separator" aria-hidden="true"></span>
      <button type="button" class="flow-position flow-link" @click="emit('ground')">
        <i></i> {{ isBreathing ? 'Skip to grounding' : 'Grounding' }}
      </button>
    </template>
    <span v-else>Let the timing be a guide. Breathe at your own pace.</span>
    <button
      type="button"
      class="flow-position flow-link"
      aria-label="Breathing animation"
      :aria-pressed="motionEnabled"
      :title="motionEnabled ? 'Turn breathing animation off' : 'Turn breathing animation on'"
      @click="emit('toggleAnimation')"
    >
      Animation {{ motionEnabled ? 'on' : 'off' }}
    </button>
  </div>
</template>
