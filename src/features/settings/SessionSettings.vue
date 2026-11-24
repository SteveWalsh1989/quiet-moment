<script setup lang="ts">
import { computed, ref, useId } from 'vue'
import AppIcon from '../../components/ui/AppIcon.vue'
import { colorThemes } from './appearance/colorThemes'
import SelectMenu from '../../components/ui/SelectMenu.vue'
import SettingsCheckbox from './SettingsCheckbox.vue'
import PlayerPopover from '../../components/player/PlayerPopover.vue'
import {
  formatTime,
  getPaceRhythm,
  getRhythm,
  paces,
  roundSessionDuration,
} from '../breathing/breathingTiming'
import { grounding } from '../grounding/groundingPrompts'
import {
  ambientSounds,
  breathingArrangements,
  isBreathingSound,
  quietSound,
} from '../audio/soundTracks'
import type { BreathingSoundId, SoundId } from '../audio/soundTracks'
import { boundedNumber, preferenceLimits } from './sessionPreferences'
import type { Preferences } from './sessionPreferences'

const props = defineProps<{
  isBreathing: boolean
  isGrounding: boolean
  audioMessage: string
  voiceMessage: string
  voiceSupported: boolean
}>()
const emit = defineEmits<{ pickSound: [id: SoundId]; reset: []; previewVoice: [] }>()
const preferences = defineModel<Preferences>({ required: true })
const isOpen = defineModel<boolean>('open', { required: true })
const settingsTab = ref<'timing' | 'display' | 'audio'>('timing')

function updatePreferences(update: Partial<Preferences>) {
  preferences.value = { ...preferences.value, ...update }
}

function preferenceModel<K extends keyof Preferences>(key: K) {
  return computed({
    get: () => preferences.value[key],
    set: (value: Preferences[K]) => updatePreferences({ [key]: value }),
  })
}

const pace = preferenceModel('pace')
const ground = preferenceModel('ground')
const countdown = preferenceModel('countdown')
const motion = preferenceModel('motion')
const theme = preferenceModel('theme')
const colorTheme = preferenceModel('colorTheme')
const selectedColorTheme = computed(() => colorThemes.find(({ id }) => id === colorTheme.value))
const prep = preferenceModel('prep')
const volume = preferenceModel('volume')
const selectedSound = computed(() =>
  preferences.value.soundEnabled ? preferences.value.sound : 'off',
)
const arrangementDescriptionId = useId()
const arrangementOptions = breathingArrangements.map(({ id, title, detail }) => ({
  id,
  label: title,
  detail,
}))
const breathingSound = computed({
  get: () => preferences.value.breathingSound,
  set: (id: BreathingSoundId) => {
    if (isBreathingSound(selectedSound.value)) {
      emit('pickSound', id)
      return
    }
    updatePreferences({
      breathingSound: id,
      sound: isBreathingSound(preferences.value.sound) ? id : preferences.value.sound,
    })
  },
})
const soundOptions = computed(() => [
  quietSound,
  {
    id: breathingSound.value,
    title: 'Breathing lo-fi',
    detail: arrangementOptions.find(({ id }) => id === breathingSound.value)?.label,
  },
  ...ambientSounds,
])
const voice = preferenceModel('voice')
const voiceVolume = preferenceModel('voiceVolume')
const rhythm = computed(() => getPaceRhythm(preferences.value))
const selectedPace = computed(() => paces.find(({ id }) => id === pace.value))
const paceOptions = paces.map((item) => ({
  id: item.id,
  label: item.title,
  detail:
    'timing' in item
      ? getRhythm(item.timing)
          .steps.map((step) => `${step.label} ${step.duration}s`)
          .join(' · ')
      : item.detail,
}))
const groundingOptions = Object.entries(grounding).map(([id, item]) => ({
  id: id as Preferences['ground'],
  label: item.label,
  detail: item.detail,
}))
const motionOptions = [
  { id: 'system', label: 'Follow system setting' },
  { id: 'on', label: 'Always animate' },
  { id: 'off', label: 'Keep circle still' },
] as const
const themeOptions = [
  { id: 'system', label: 'System', detail: 'Follow your device', icon: 'monitor' },
  { id: 'light', label: 'Light', icon: 'sun' },
  { id: 'dark', label: 'Dark', icon: 'moon' },
] as const
const prepOptions = [
  { id: 0, label: 'Start immediately' },
  { id: 3, label: '3 seconds' },
  { id: 5, label: '5 seconds' },
  { id: 10, label: '10 seconds' },
]
const durationOptions = [
  { id: 30, label: '30 seconds' },
  { id: 60, label: '1 minute', detail: 'Default duration' },
  { id: 120, label: '2 minutes' },
  { id: 300, label: '5 minutes' },
  { id: 'custom', label: 'Custom duration' },
] as const
const customTimingFields = [
  { id: 'inhale', label: 'Inhale' },
  { id: 'hold', label: 'Hold after inhale' },
  { id: 'exhale', label: 'Exhale' },
  { id: 'rest', label: 'Hold after exhale' },
] as const
const practiceTime = computed(() =>
  roundSessionDuration(preferences.value.duration, rhythm.value.cycleDuration),
)
const settingsLocked = computed(() => props.isBreathing || props.isGrounding)
const storedDuration = computed({
  get: () =>
    preferences.value.customDuration ||
    !durationOptions.some(({ id }) => id === preferences.value.duration)
      ? 'custom'
      : preferences.value.duration,
  set: (value: number | 'custom') => {
    if (value === 'custom') updatePreferences({ customDuration: true })
    else updatePreferences({ duration: value, customDuration: false })
  },
})

function updateNumber(field: (typeof customTimingFields)[number]['id'] | 'duration', event: Event) {
  if (!(event.target instanceof HTMLInputElement)) return
  const value = boundedNumber(
    event.target.valueAsNumber,
    preferences.value[field],
    preferenceLimits[field],
  )
  updatePreferences({ [field]: value })
  event.target.value = String(value)
}
</script>

<template>
  <PlayerPopover
    v-model:open="isOpen"
    label="Settings"
    close-label="Close settings"
    trigger-class="player-icon-button"
    dim-backdrop
  >
    <template #trigger>
      <AppIcon name="settings" />
    </template>
    <template #header>
      <div
        class="settings-tabs flex items-center gap-0.5 whitespace-nowrap"
        role="group"
        aria-label="Settings sections"
      >
        <button
          type="button"
          :aria-pressed="settingsTab === 'timing'"
          @click="settingsTab = 'timing'"
        >
          Timing
        </button>
        <button
          type="button"
          :aria-pressed="settingsTab === 'display'"
          @click="settingsTab = 'display'"
        >
          Display
        </button>
        <button
          type="button"
          :aria-pressed="settingsTab === 'audio'"
          @click="settingsTab = 'audio'"
        >
          Sound & voice
        </button>
      </div>
    </template>
    <div class="settings">
      <div v-if="settingsTab === 'timing'" class="grid gap-4 pt-4">
        <p v-if="isBreathing" class="field-note">Timing changes are available after the session.</p>
        <div>
          <SelectMenu
            v-model="pace"
            label="Breathing pace"
            :options="paceOptions"
            :disabled="isBreathing"
            description-id="pace-detail"
          />
          <p id="pace-detail" class="field-note">{{ selectedPace?.detail }}</p>
          <div
            v-if="preferences.pace === 'custom'"
            class="mt-[9px] grid grid-cols-2 gap-[9px] text-[length:0.78rem] font-[720]"
          >
            <label v-for="field in customTimingFields" :key="field.id">
              {{ field.label }} (seconds)
              <input
                class="control"
                type="number"
                :value="preferences[field.id]"
                :min="preferenceLimits[field.id].min"
                :max="preferenceLimits[field.id].max"
                step="1"
                :disabled="isBreathing"
                @change="updateNumber(field.id, $event)"
              />
            </label>
          </div>
          <ol
            class="pace-steps mt-2 flex list-none flex-wrap gap-1 p-0"
            role="list"
            aria-label="One breath cycle"
          >
            <li v-for="step in rhythm.steps" :key="step.name">
              <span>{{ step.label }}</span> {{ step.duration }}s
            </li>
          </ol>
          <p v-if="rhythm.steps.length > 2" class="field-note">
            Keep holds comfortable. You can pause the session at any time.
          </p>
        </div>
        <div>
          <SelectMenu
            v-model="storedDuration"
            label="Breathing duration"
            :options="durationOptions"
            :disabled="isBreathing"
          />
          <label v-if="storedDuration === 'custom'" class="extra-input"
            >Seconds (15–600)<input
              class="control"
              type="number"
              :min="preferenceLimits.duration.min"
              :max="preferenceLimits.duration.max"
              step="1"
              :value="preferences.duration"
              :disabled="isBreathing"
              @change="updateNumber('duration', $event)"
          /></label>
          <p v-if="practiceTime !== preferences.duration" class="field-note">
            Ends after a full cycle at {{ formatTime(practiceTime) }}.
          </p>
        </div>
        <SelectMenu
          v-model="prep"
          label="Preparation countdown"
          :options="prepOptions"
          :disabled="isBreathing"
        />
        <SelectMenu
          v-if="!isGrounding"
          v-model="ground"
          label="Grounding exercise"
          :options="groundingOptions"
        />
      </div>

      <div v-else-if="settingsTab === 'display'" class="grid gap-4 pt-4">
        <SelectMenu v-model="theme" label="Appearance" :options="themeOptions" />
        <fieldset>
          <legend class="settings-select-label mb-1 w-full">
            <span class="flex justify-between gap-2">
              Color theme
              <span class="font-semibold text-muted" aria-hidden="true">{{
                selectedColorTheme?.label
              }}</span>
            </span>
          </legend>
          <div class="grid grid-cols-5 gap-1">
            <label
              v-for="palette in colorThemes"
              :key="palette.id"
              class="palette-option relative grid h-11 w-full cursor-pointer place-items-center rounded-lg hover:bg-hover"
              :title="palette.label"
            >
              <input
                v-model="colorTheme"
                class="sr-only"
                type="radio"
                name="color-theme"
                :value="palette.id"
              />
              <span class="sr-only">{{ palette.label }}</span>
              <span
                class="palette-swatch grid size-8 place-items-center rounded-full"
                :data-color-theme="palette.id"
                aria-hidden="true"
              >
                <span
                  v-if="colorTheme === palette.id"
                  class="grid size-[18px] place-items-center rounded-full bg-white text-slate-900"
                >
                  <AppIcon name="check" :size="13" />
                </span>
              </span>
            </label>
          </div>
        </fieldset>
        <div>
          <SettingsCheckbox
            v-model="countdown"
            label="Show countdowns"
            description-id="countdown-detail"
          />
          <p id="countdown-detail" class="field-note">
            Show seconds in the circle and time remaining at the top of the player.
          </p>
        </div>
        <SelectMenu v-model="motion" label="Breathing animation" :options="motionOptions" />
      </div>

      <div v-else class="grid gap-4 pt-4">
        <fieldset class="sound-list">
          <legend>Background sound</legend>
          <div
            v-for="sound in soundOptions"
            :key="isBreathingSound(sound.id) ? 'breathing' : sound.id"
            class="grid grid-cols-[minmax(0,1fr)_auto] items-center"
          >
            <label class="sound-option flex items-center">
              <input
                type="radio"
                name="background-sound"
                :checked="selectedSound === sound.id"
                @change="emit('pickSound', sound.id)"
              />
              <span>
                <strong>{{ sound.title }}</strong>
                <small :id="isBreathingSound(sound.id) ? arrangementDescriptionId : undefined">
                  {{ sound.detail }}
                </small>
              </span>
            </label>
            <SelectMenu
              v-if="isBreathingSound(sound.id)"
              v-model="breathingSound"
              compact
              label="Breathing lo-fi arrangement"
              :description-id="arrangementDescriptionId"
              :options="arrangementOptions"
            />
          </div>
        </fieldset>
        <p v-if="audioMessage" class="field-note" role="status">{{ audioMessage }}</p>
        <label class="volume-label">
          <span class="flex items-center justify-between"
            >Background volume <span>{{ preferences.volume }}%</span></span
          >
          <input
            v-model.number="volume"
            type="range"
            min="0"
            max="100"
            :disabled="!preferences.soundEnabled"
          />
        </label>
        <div class="voice-settings">
          <SettingsCheckbox
            v-model="voice"
            label="Spoken breathing cues"
            description-id="voice-detail"
            :disabled="!voiceSupported"
          />
          <p id="voice-detail" class="field-note">
            Hear when to breathe in through your nose and out through your mouth.
          </p>
          <template v-if="preferences.voice">
            <label class="volume-label"
              ><span class="flex items-center justify-between"
                >Voice volume <span>{{ preferences.voiceVolume }}%</span></span
              ><input v-model.number="voiceVolume" type="range" min="0" max="100"
            /></label>
            <button class="text-button" type="button" @click="emit('previewVoice')">
              Preview voice
            </button>
          </template>
          <p v-if="voiceMessage || !voiceSupported" class="field-note" role="status">
            {{ voiceMessage || 'Spoken cues are unavailable in this browser.' }}
          </p>
        </div>
      </div>
      <div class="mt-4">
        <button type="button" class="text-button" :disabled="settingsLocked" @click="emit('reset')">
          Restore session defaults
        </button>
      </div>
    </div>
  </PlayerPopover>
</template>

<style scoped>
.settings-tabs button {
  @apply min-h-11 rounded-md px-1.5 text-xs font-[750] text-muted min-[380px]:px-2 min-[380px]:text-sm;
}

.settings-tabs button:hover {
  @apply text-accent-ink;
}

.settings-tabs button[aria-pressed='true'] {
  @apply bg-selected text-accent-ink;
}

.palette-swatch {
  background: hsl(var(--palette-hue) var(--palette-saturation) 43%);
}

.palette-option input:focus-visible ~ .palette-swatch {
  @apply outline outline-2 outline-focus outline-offset-[3px];
}

@media (forced-colors: active) {
  .palette-swatch {
    forced-color-adjust: none;
  }

  .palette-option input:focus-visible ~ .palette-swatch {
    outline-color: Highlight;
  }
}

.sound-list legend,
.extra-input,
.volume-label {
  @apply block text-ink text-[length:0.89rem] font-extrabold;
}

input.control {
  @apply block mt-[4px] pr-[8px] appearance-auto;
}

.field-note {
  @apply m-[6px_0_0] text-muted text-[length:0.82rem] leading-[1.52];
}

.pace-steps li {
  @apply p-[3px_7px] border border-solid border-line rounded-[5px] text-muted text-[length:0.76rem];
  @apply whitespace-nowrap;
}

.pace-steps span {
  @apply text-ink font-[750];
}

.extra-input {
  @apply mt-[10px];
}

.text-button {
  @apply min-h-[44px] text-accent-ink text-[length:0.84rem] font-extrabold underline underline-offset-[3px];
}

.text-button:disabled {
  @apply opacity-[0.58];
}

.sound-list {
  @apply m-0 p-0 border-0;
}

.sound-list legend {
  @apply mb-[6px];
}

.sound-option {
  @apply gap-[9px] min-h-[50px] p-[5px_3px] cursor-pointer;
}

.sound-option:hover {
  @apply bg-hover;
}

.sound-option > span {
  @apply flex-1;
}

.sound-option strong,
.sound-option small {
  @apply block;
}

.sound-option strong {
  @apply text-[length:0.89rem] font-[780];
}

.sound-option small {
  @apply text-[length:0.78rem] text-muted;
}

.volume-label span span {
  @apply text-muted tabular-nums;
}

.voice-settings {
  @apply pt-2 border-t border-solid border-t-line;
}

.voice-settings .volume-label {
  @apply mt-3;
}

.voice-settings .field-note {
  @apply mt-[1px];
}
</style>
