<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
import SelectMenu from './SelectMenu.vue'
import {
  formatTime,
  getPaceRhythm,
  getRhythm,
  paces,
  roundSessionDuration,
} from '../features/breathing/breathingTiming'
import { grounding } from '../features/grounding/groundingPrompts'
import { soundTracks } from '../features/audio/soundTracks'
import type { SoundId } from '../features/audio/soundTracks'
import { boundedNumber, preferenceLimits } from '../preferences'
import type { Preferences } from '../preferences'

const props = defineProps<{
  isBreathing: boolean
  isGrounding: boolean
  isGuided: boolean
  playing: boolean
  audioMessage: string
  voiceMessage: string
  voiceSupported: boolean
}>()
const emit = defineEmits<{ pickSound: [id: SoundId]; reset: []; previewVoice: [] }>()
const preferences = defineModel<Preferences>({ required: true })
const settingsTab = defineModel<'session' | 'audio'>('tab', { required: true })

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
const prep = preferenceModel('prep')
const volume = preferenceModel('volume')
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
}))
const motionOptions = [
  { id: 'system', label: 'Follow system setting' },
  { id: 'on', label: 'Always animate' },
  { id: 'off', label: 'Keep circle still' },
] as const
const prepOptions = [
  { id: 0, label: 'Start immediately' },
  { id: 3, label: '3 seconds' },
  { id: 5, label: '5 seconds' },
  { id: 10, label: '10 seconds' },
]
const durationOptions = [
  { id: 30, label: '30 seconds' },
  { id: 60, label: '1 minute', detail: 'Quick reset' },
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
  <aside class="settings" aria-labelledby="settings-heading">
    <div class="settings-title flex items-center">
      <AppIcon name="tune" :size="22" />
      <h2 id="settings-heading">Your session</h2>
    </div>
    <div class="settings-tabs flex" aria-label="Settings sections">
      <button
        type="button"
        :aria-pressed="settingsTab === 'session'"
        @click="settingsTab = 'session'"
      >
        Timing
      </button>
      <button type="button" :aria-pressed="settingsTab === 'audio'" @click="settingsTab = 'audio'">
        Sound & voice
      </button>
    </div>

    <div v-if="settingsTab === 'session'" class="settings-body">
      <div class="settings-row">
        <SelectMenu
          v-model="pace"
          label="Breathing pace"
          :options="paceOptions"
          :disabled="isBreathing"
          description-id="pace-detail"
        />
        <p id="pace-detail" class="field-note">{{ selectedPace?.detail }}</p>
        <div v-if="preferences.pace === 'custom'" class="timing-fields">
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
        <ol class="pace-steps flex flex-wrap" role="list" aria-label="One breath cycle">
          <li v-for="step in rhythm.steps" :key="step.name">
            <span>{{ step.label }}</span> {{ step.duration }}s
          </li>
        </ol>
        <p v-if="rhythm.steps.length > 2" class="field-note">
          Keep holds comfortable. You can pause the session at any time.
        </p>
      </div>
      <div class="settings-row">
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
      <div class="settings-row">
        <SelectMenu v-model="ground" label="Grounding exercise" :options="groundingOptions" />
        <p v-if="isGuided && isGrounding" class="field-note">Changes apply to your next reset.</p>
      </div>
      <details class="more-settings">
        <summary class="flex items-center justify-between">
          Display & countdown<AppIcon name="chevron" :size="16" />
        </summary>
        <label class="switch-row"
          ><span>Show countdowns</span><input v-model="countdown" type="checkbox"
        /></label>
        <SelectMenu
          v-model="motion"
          class="extra-input"
          label="Breathing animation"
          :options="motionOptions"
        />
        <SelectMenu
          v-model="prep"
          class="extra-input"
          label="Preparation countdown"
          :options="prepOptions"
          :disabled="isBreathing"
        />
        <button type="button" class="text-button" :disabled="settingsLocked" @click="emit('reset')">
          Restore recommended settings
        </button>
      </details>
    </div>

    <div v-else class="settings-body">
      <fieldset class="sound-list">
        <legend>Background sound</legend>
        <label v-for="sound in soundTracks" :key="sound.id" class="sound-option flex items-center">
          <input
            type="radio"
            name="background-sound"
            :checked="preferences.sound === sound.id"
            @change="emit('pickSound', sound.id)"
          />
          <span
            ><strong>{{ sound.title }}</strong
            ><small>{{ sound.detail }}</small></span
          >
          <AppIcon
            v-if="sound.id !== 'off' && preferences.sound === sound.id && playing"
            name="music"
            :size="17"
          />
        </label>
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
          :disabled="preferences.sound === 'off'"
        />
      </label>
      <div class="voice-settings">
        <label class="switch-row"
          ><span>Spoken breathing cues</span
          ><input v-model="voice" type="checkbox" :disabled="!voiceSupported"
        /></label>
        <p class="field-note">
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
  </aside>
</template>
