<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import AppHeader from './components/AppHeader.vue'
import AppIcon from './components/AppIcon.vue'
import SessionSettings from './components/SessionSettings.vue'
import { exerciseViews } from './exerciseViews'
import type { ExerciseView } from './exerciseViews'
import BreathingPlayer from './features/breathing/BreathingPlayer.vue'
import { formatTime } from './features/breathing/breathingTiming'
import { useBreathingSession } from './features/breathing/useBreathingSession'
import { useMotionPreference } from './features/breathing/useMotionPreference'
import GroundingPlayer from './features/grounding/GroundingPlayer.vue'
import DistractionPlayer from './features/distraction/DistractionPlayer.vue'
import { isBreathingSound } from './features/audio/soundTracks'
import type { SoundId } from './features/audio/soundTracks'
import { useBackgroundAudio } from './features/audio/useBackgroundAudio'
import { useSpokenCues } from './features/audio/useSpokenCues'
import { defaultPreferences, loadPreferences, savePreferences } from './preferences'
import type { Preferences } from './preferences'
import { useThemePreference } from './useThemePreference'

type ExerciseStage = 'ready' | 'breathe' | 'ground' | 'focus' | 'done'

const preferences = reactive(loadPreferences())
watch(preferences, () => savePreferences(preferences))
useThemePreference(preferences)

const view = ref<ExerciseView>('reset')
const stage = ref<ExerciseStage>('ready')
const guide = ref(preferences.ground)
const attentionIndex = ref(0)
const settingsOpen = ref(false)
const player = ref<HTMLElement | null>(null)
const current = computed(
  () => exerciseViews.find((item) => item.id === view.value) ?? exerciseViews[0],
)
const isGuided = computed(() => view.value === 'reset')
const isBreathing = computed(() => stage.value === 'breathe')
const isGrounding = computed(() => stage.value === 'ground')
const showGuidedStages = computed(() => isGuided.value && stage.value !== 'done')
const motionEnabled = useMotionPreference(preferences)

const audio = useBackgroundAudio(preferences)
const { playing, audioMessage } = audio
const voice = useSpokenCues(preferences)
const { voiceMessage, voiceSupported } = voice
const breath = useBreathingSession(
  preferences,
  finishBreathing,
  voice.cuePhase,
  voice.stopVoice,
  audio.readBreathingElapsed,
)
const { state: breathState, phase, rhythm, remaining } = breath

watch(
  [breathState, breath.plan],
  ([state, plan]) =>
    audio.setBreathingSession(
      state === 'running' && plan ? { plan, readElapsed: breath.readElapsed } : null,
    ),
  { flush: 'sync' },
)

function focusExercise() {
  void nextTick(() => {
    if (settingsOpen.value) return
    player.value?.querySelector<HTMLElement>('h2[tabindex="-1"]')?.focus({ preventScroll: true })
  })
}

function selectView(id: ExerciseView) {
  if (view.value === id) return
  view.value = id
  if (id === 'ground') startGrounding()
  else {
    breath.stop()
    stage.value = id === 'focus' ? 'focus' : 'ready'
    focusExercise()
  }
}

function startBreathing() {
  stage.value = 'breathe'
  if (preferences.soundEnabled && !playing.value) void audio.playSound(preferences.sound)
  breath.start()
  focusExercise()
}

function finishBreathing() {
  if (isGuided.value) startGrounding()
  else finishExercise()
}

function startGrounding() {
  breath.stop()
  guide.value = preferences.ground
  stage.value = 'ground'
  focusExercise()
}

function finishExercise() {
  stage.value = 'done'
  focusExercise()
}

function returnToStart() {
  breath.stop()
  stage.value = 'ready'
  focusExercise()
}

function pickSound(id: SoundId) {
  if (id !== 'off') preferences.sound = id
  if (isBreathingSound(id)) preferences.breathingSound = id
  preferences.soundEnabled = id !== 'off'
  void audio.playSound(id)
}

function toggleSound() {
  pickSound(preferences.soundEnabled ? 'off' : preferences.sound)
}

function updatePreferences(next: Preferences) {
  const groundChanged = next.ground !== preferences.ground
  Object.assign(preferences, next)
  if (groundChanged && view.value === 'ground' && isGrounding.value) startGrounding()
}

function resetSettings() {
  Object.assign(preferences, { ...defaultPreferences, theme: preferences.theme })
  void audio.playSound('off')
}

function previewVoice() {
  voice.speak('Breathe in through your nose. Breathe out through your mouth.')
}
</script>

<template>
  <div class="site-shell" :class="{ 'breathing-session': isBreathing }">
    <a class="skip-link" href="#main-content">Skip to main content</a>
    <AppHeader
      :view="view"
      @home="view === 'reset' ? returnToStart() : selectView('reset')"
      @navigate="selectView"
    />
    <main id="main-content" class="main-wrap" tabindex="-1">
      <div class="intro-block">
        <h1>{{ current.title }}</h1>
        <p>{{ current.intro }}</p>
      </div>

      <div class="workbench">
        <section
          ref="player"
          class="player"
          :class="{ 'no-motion': !motionEnabled }"
          :aria-label="current.label"
        >
          <div class="player-top flex items-center justify-between gap-2">
            <div class="flex min-w-0 flex-wrap items-center gap-x-5">
              <div class="player-label inline-flex items-center whitespace-nowrap">
                <AppIcon :name="current.icon" :size="19" />
                <span>{{ current.label }}</span>
              </div>
              <nav
                v-if="showGuidedStages"
                class="flex items-center gap-3 whitespace-nowrap text-xs text-player-muted max-[395px]:gap-2 max-[395px]:[&_i]:hidden"
                :aria-label="`${current.label} stages`"
              >
                <span class="flow-position" :aria-current="isGrounding ? undefined : 'step'">
                  <i aria-hidden="true"></i> Breathing
                </span>
                <span v-if="isGrounding" class="flow-position" aria-current="step">
                  <i aria-hidden="true"></i> Grounding
                </span>
                <button
                  v-else
                  type="button"
                  class="flow-position flow-link"
                  :aria-label="isBreathing ? 'Skip to grounding' : undefined"
                  :title="isBreathing ? 'Skip to grounding' : undefined"
                  @click="startGrounding"
                >
                  <i aria-hidden="true"></i> Grounding
                </button>
              </nav>
            </div>
            <div class="flex shrink-0 items-center gap-1">
              <span
                v-if="isBreathing && preferences.countdown"
                class="session-timer inline-flex items-center max-[340px]:[&>svg]:hidden"
                aria-label="Time remaining"
              >
                <AppIcon name="timer" :size="16" /> {{ formatTime(remaining) }}
              </span>
              <div class="relative">
                <button
                  type="button"
                  class="player-icon-button"
                  aria-label="Background sound"
                  :aria-pressed="preferences.soundEnabled"
                  :title="
                    preferences.soundEnabled ? 'Mute background sound' : 'Enable background sound'
                  "
                  @click="toggleSound"
                >
                  <AppIcon :name="preferences.soundEnabled ? 'sound' : 'mute'" />
                </button>
                <p v-if="audioMessage && !settingsOpen" class="sound-error" role="status">
                  {{ audioMessage }}
                </p>
              </div>
              <SessionSettings
                v-model:open="settingsOpen"
                :model-value="preferences"
                :is-breathing="isBreathing"
                :is-grounding="isGrounding"
                :is-guided="isGuided"
                :audio-message="audioMessage"
                :voice-message="voiceMessage"
                :voice-supported="voiceSupported"
                @update:model-value="updatePreferences"
                @pick-sound="pickSound"
                @reset="resetSettings"
                @preview-voice="previewVoice"
              />
            </div>
          </div>
          <BreathingPlayer
            v-if="stage === 'ready' || isBreathing"
            :is-breathing="isBreathing"
            :is-guided="isGuided"
            :breath-state="breathState"
            :phase="phase"
            :rhythm="rhythm"
            :motion-enabled="motionEnabled"
            :countdown="preferences.countdown"
            @start="startBreathing"
            @pause="breath.pause"
            @resume="breath.resume"
            @stop="returnToStart"
          />
          <GroundingPlayer
            v-else-if="isGrounding"
            :key="guide"
            :guide="guide"
            :is-guided="isGuided"
            @complete="finishExercise"
          />
          <DistractionPlayer v-else-if="stage === 'focus'" v-model:index="attentionIndex" />
          <template v-else>
            <div class="prompt-content completion">
              <div class="step-line flex items-center">
                <AppIcon name="check" :size="20" /><span>Session complete</span>
              </div>
              <h2 tabindex="-1">Take your time.</h2>
              <p>Stay here for another moment, or choose another exercise whenever you’re ready.</p>
            </div>
            <div class="prompt-actions flex flex-wrap items-center">
              <button
                v-if="view === 'ground'"
                class="primary-button"
                type="button"
                @click="startGrounding"
              >
                Ground again
              </button>
              <button v-else class="primary-button" type="button" @click="returnToStart">
                Back to start
              </button>
              <button
                v-if="view === 'breathe'"
                class="on-dark-button"
                type="button"
                @click="selectView('ground')"
              >
                Try grounding
              </button>
              <button v-else class="on-dark-button" type="button" @click="selectView('focus')">
                Try a distraction
              </button>
            </div>
          </template>
        </section>
      </div>
      <footer class="site-footer flex items-start">
        <AppIcon name="info" :size="19" />
        <p>
          Quiet Moment is a self-help tool for moments of anxiety. It’s not a medical device or a
          substitute for professional care.
          <a
            href="https://www2.hse.ie/mental-health/issues/how-to-deal-with-panic-attacks/"
            target="_blank"
            rel="noopener noreferrer"
            >HSE guidance on panic attacks</a
          >
        </p>
      </footer>
    </main>
  </div>
</template>
