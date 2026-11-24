<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '../../components/ui/AppIcon.vue'
import { guidedResetLabel } from '../../app/exerciseViews'
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
  return props.isGuided ? `Start ${guidedResetLabel.toLowerCase()}` : 'Start breathing'
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
  <div class="breathing-stage flex flex-1 flex-col justify-center">
    <div
      class="breath-copy grid min-h-[7.25rem] grid-rows-[1fr_auto] items-end px-4 pt-4 text-center"
      :class="{ 'breath-copy-active': isBreathCue }"
      :aria-live="isBreathing ? 'polite' : 'off'"
      aria-atomic="true"
    >
      <h2 tabindex="-1">{{ isBreathCue ? activeInstruction : breathCue.title }}</h2>
      <p v-if="!isBreathCue">{{ breathCue.instruction }}</p>
    </div>
    <div class="orb-area grid place-items-center pt-5">
      <button
        type="button"
        class="breath-orb relative isolate grid aspect-square w-[clamp(156px,_43vw,_206px)] place-items-center rounded-full [container-type:inline-size]"
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
                ? 'text-[length:clamp(1.875rem,calc(27.5cqi_-_0.875rem),6.625rem)]'
                : 'text-[length:clamp(1.875rem,21cqi,5rem)]'
            "
            >{{ orbCue }}</span
          >
          <span v-if="countdown" class="orb-counter">{{ phase?.seconds }}</span>
        </span>
      </button>
    </div>
    <div
      v-if="isBreathing"
      class="player-actions m-[21px_16px_20px] flex flex-wrap items-center justify-center gap-2"
    >
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

<style scoped>
.breath-orb:focus-visible {
  @apply outline-offset-[4px];
}

.guide-ring,
.orb-body,
.orb-core {
  @apply absolute inset-0 rounded-full pointer-events-none;
}

.breath-ring {
  @apply absolute inset-0 w-full fill-none stroke-current stroke-[4] pointer-events-none;
}

.breath-ring-inhale {
  @apply text-breath-in;
}

.breath-ring-exhale {
  @apply text-breath-out;
}

.breath-ring-hold,
.breath-ring-rest {
  @apply text-breath-hold;
}

.breath-ring-track {
  @apply opacity-[0.32];
}

.guide-ring-inner {
  @apply inset-[9%] border border-solid border-player-border;
}

.orb-body {
  @apply inset-[8%];
  scale: calc(0.55 + 0.45 * var(--expansion));
  @apply border border-solid border-player-border;
  @apply bg-[radial-gradient(circle_at_39%_30%,_var(--orb-light),_var(--orb-mid)_47%,_var(--orb-edge)_85%)];
  box-shadow:
    0 5px 32px color-mix(in srgb, var(--orb-glow) 22%, transparent),
    inset 0 0 24px color-mix(in srgb, var(--action) 17%, transparent);
}

.orb-core {
  @apply inset-[16%];
  scale: calc(0.55 + 0.45 * var(--expansion));
  @apply bg-[radial-gradient(circle_at_39%_32%,_var(--orb-core),_transparent_67%)];
}

.orb-cue,
.orb-start {
  @apply relative text-on-player;
  text-shadow: 0 1px 4px var(--player-edge);
}
.orb-start {
  @apply grid justify-items-center gap-[3px] text-[length:1.1rem] font-extrabold leading-[1.2];
}

.breath-orb-ready .orb-body,
.breath-orb-ready .orb-core {
  scale: 0.9;
}

.breath-orb-preparing .orb-body,
.breath-orb-preparing .orb-core {
  transition: scale 600ms ease-out;
}

.breath-orb-ready:hover .orb-body,
.breath-orb-ready:focus-visible .orb-body {
  border-color: color-mix(in srgb, var(--action) 85%, transparent);
  box-shadow: 0 5px 36px color-mix(in srgb, var(--orb-glow) 40%, transparent);
}

.orb-cue {
  @apply grid gap-[4px] justify-items-center leading-none;
}

.orb-counter {
  @apply text-[length:1.75rem] font-[650] leading-none tabular-nums;
}

.no-motion .orb-body,
.no-motion .orb-core {
  scale: 0.83;
  @apply transition-none;
}

.breath-copy h2 {
  @apply m-0 text-[length:clamp(1.5rem,_5vw,_2.15rem)] font-extrabold tracking-[-0.03em] leading-[1.1];
}

.breath-copy p {
  @apply m-[6px_0_0] text-player-muted text-[length:0.98rem] leading-normal;
}

.breath-copy-active h2 {
  @apply row-start-2 text-on-player text-[length:clamp(1.05rem,_1.25vw,_1.4rem)] font-bold leading-[1.3] tracking-normal;
}

.player-bottom {
  @apply min-h-[53px] m-[auto_24px_0] p-[8px_0] border-t border-solid border-t-[#ffffff26] flex flex-wrap;
  @apply justify-center items-center gap-[12px] text-player-muted text-[length:0.86rem] font-[650] text-center;
}

@media (max-width: 760px) {
  .breath-copy {
    @apply min-h-[5rem] p-[10px_12px_0];
  }
  .orb-area {
    @apply [padding-block:14px_16px];
  }
  .breath-orb {
    @apply w-[clamp(140px,_45vw,_206px)];
  }
  .player-bottom {
    @apply min-h-[49px] [padding-block:0] mx-[12px] gap-[0_8px] text-[length:0.78rem];
  }
  .player-bottom button {
    @apply min-h-[44px];
  }
  .player-actions {
    @apply grid w-[min(290px,_calc(100%_-_28px))] self-center grid-cols-2 m-[0_0_12px];
  }
  .player-actions .on-dark-button {
    @apply border border-solid border-player-border;
  }
}

@media (min-width: 1280px) {
  .player-bottom {
    @apply [margin-inline:clamp(24px,_2vw,_40px)];
  }
}

@media (min-width: 1280px) and (min-height: 800px) {
  .breathing-stage {
    @apply grid grid-rows-[auto_auto_minmax(5.5rem,_auto)] content-center justify-stretch;
  }

  .orb-area {
    @apply pt-[clamp(20px,_1.8svh,_30px)];
  }

  .breath-orb {
    @apply w-[clamp(13rem,_min(27vw,_52svh_-_13rem),_33rem)];
  }

  .orb-counter {
    @apply text-[length:clamp(1.75rem,_3vw,_3.75rem)];
  }

  .orb-start {
    @apply gap-[7px] text-[length:clamp(1.1rem,_1.3vw,_1.55rem)];
  }

  .orb-start svg {
    @apply w-[clamp(22px,_1.65vw,_36px)] h-auto;
  }

  .breath-copy:not(.breath-copy-active) h2 {
    @apply text-[length:clamp(2.15rem,_2.35vw,_3.25rem)];
  }

  .breath-copy p {
    @apply text-[length:clamp(1.05rem,_1.25vw,_1.4rem)];
  }

  .player-actions {
    @apply [margin-block:clamp(21px,_2.3svh,_36px)_16px];
  }

  .player-actions button {
    @apply min-h-[50px] text-[length:1rem];
  }
}
</style>
