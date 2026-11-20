<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from './AppIcon.vue'
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
const paceOptions = paces.map((item) => {
  if (!('timing' in item)) return { id: item.id, label: item.title }
  const counts = getRhythm(item.timing)
    .steps.map(({ duration }) => duration)
    .join('–')
  return {
    id: item.id,
    label: item.title.includes(counts) ? item.title : `${item.title} · ${counts}`,
  }
})
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
const presetDurations = [30, 60, 120, 300]
const storedDuration = computed(() =>
  preferences.value.customDuration || !presetDurations.includes(preferences.value.duration)
    ? 'custom'
    : preferences.value.duration,
)

function setDuration(event: Event) {
  if (!(event.target instanceof HTMLSelectElement)) return
  if (event.target.value === 'custom') updatePreferences({ customDuration: true })
  else updatePreferences({ duration: Number(event.target.value), customDuration: false })
}

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
        <label for="pace">Breathing pace</label>
        <div class="select-wrap">
          <select
            id="pace"
            v-model="pace"
            class="control"
            :disabled="isBreathing"
            aria-describedby="pace-detail"
          >
            <option v-for="item in paceOptions" :key="item.id" :value="item.id">
              {{ item.label }}
            </option>
          </select>
          <AppIcon name="chevron" :size="16" />
        </div>
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
        <label for="duration">Breathing duration</label>
        <div class="select-wrap">
          <select
            id="duration"
            :value="storedDuration"
            class="control"
            :disabled="isBreathing"
            @change="setDuration"
          >
            <option :value="30">30 seconds</option>
            <option :value="60">1 minute · Quick reset</option>
            <option :value="120">2 minutes</option>
            <option :value="300">5 minutes</option>
            <option value="custom">Custom duration</option>
          </select>
          <AppIcon name="chevron" :size="16" />
        </div>
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
        <label for="ground">Grounding exercise</label>
        <div class="select-wrap">
          <select id="ground" v-model="ground" class="control">
            <option v-for="(item, id) in grounding" :key="id" :value="id">
              {{ item.label }}
            </option>
          </select>
          <AppIcon name="chevron" :size="16" />
        </div>
        <p v-if="isGuided && isGrounding" class="field-note">Changes apply to your next reset.</p>
      </div>
      <details class="more-settings">
        <summary class="flex items-center justify-between">
          Display & countdown<AppIcon name="chevron" :size="16" />
        </summary>
        <label class="switch-row"
          ><span>Show countdowns</span><input v-model="countdown" type="checkbox"
        /></label>
        <label class="extra-input" for="motion">
          Breathing animation
          <span class="select-wrap">
            <select id="motion" v-model="motion" class="control">
              <option value="system">Follow system setting</option>
              <option value="on">Always animate</option>
              <option value="off">Keep circle still</option>
            </select>
            <AppIcon name="chevron" :size="16" />
          </span>
        </label>
        <label class="extra-input" for="prep"
          >Preparation countdown
          <span class="select-wrap"
            ><select id="prep" v-model.number="prep" class="control" :disabled="isBreathing">
              <option :value="0">Start immediately</option>
              <option :value="3">3 seconds</option>
              <option :value="5">5 seconds</option>
              <option :value="10">10 seconds</option></select
            ><AppIcon name="chevron" :size="16"
          /></span>
        </label>
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
