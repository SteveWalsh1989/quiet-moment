<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { exerciseViews } from '../exerciseViews'
import type { ExerciseView } from '../exerciseViews'
import { soundTracks } from '../features/audio/soundTracks'
import type { SoundId } from '../features/audio/soundTracks'
import AppIcon from './AppIcon.vue'

defineProps<{ view: ExerciseView; activeSound: SoundId; playing: boolean; audioMessage: string }>()
const emit = defineEmits<{
  home: []
  navigate: [view: ExerciseView]
  toggleSound: []
  pickSound: [id: SoundId]
}>()
const soundMenuOpen = ref(false)
const soundControl = ref<HTMLDivElement | null>(null)
const soundMenuToggle = ref<HTMLButtonElement | null>(null)
const markSource = globalThis.quietMomentOffline?.mark ?? './mark.svg'

function closeSoundMenu(restoreFocus = false) {
  if (!soundMenuOpen.value) return
  soundMenuOpen.value = false
  if (restoreFocus) soundMenuToggle.value?.focus()
}

function closeSoundMenuOnBlur(event: FocusEvent) {
  if (event.relatedTarget instanceof Node && !soundControl.value?.contains(event.relatedTarget)) {
    closeSoundMenu()
  }
}

function closeSoundMenuOutside(event: MouseEvent) {
  if (event.target instanceof Node && !soundControl.value?.contains(event.target)) closeSoundMenu()
}

function pickHeaderSound(id: SoundId) {
  emit('pickSound', id)
  closeSoundMenu(true)
}

onMounted(() => document.addEventListener('click', closeSoundMenuOutside))
onUnmounted(() => document.removeEventListener('click', closeSoundMenuOutside))
</script>

<template>
  <header class="topbar">
    <div class="topbar-inner flex items-center justify-between">
      <a
        href="./"
        class="wordmark inline-flex items-center"
        aria-label="Quiet Moment home"
        @click.prevent="emit('home')"
      >
        <img :src="markSource" alt="" width="34" height="34" />
        <span>Quiet Moment</span>
      </a>
      <nav class="main-nav flex items-center" aria-label="Exercises">
        <button
          v-for="item in exerciseViews"
          :key="item.id"
          type="button"
          :aria-current="view === item.id ? 'page' : undefined"
          @click="emit('navigate', item.id)"
        >
          <AppIcon :name="item.icon" :size="17" />
          <span>{{ item.label }}</span>
        </button>
      </nav>
      <div
        ref="soundControl"
        class="sound-control relative flex items-center"
        @focusout="closeSoundMenuOnBlur"
        @keydown.esc.stop="closeSoundMenu(true)"
      >
        <button
          type="button"
          class="sound-shortcut"
          :title="playing ? 'Mute background sound' : 'Play background sound'"
          @click="emit('toggleSound')"
        >
          <AppIcon :name="playing ? 'sound' : 'mute'" :size="18" />
          <span>{{ playing ? 'Sound on' : 'Sound off' }}</span>
        </button>
        <button
          ref="soundMenuToggle"
          type="button"
          class="sound-menu-toggle"
          aria-label="Choose background sound"
          aria-controls="header-sound-options"
          :aria-expanded="soundMenuOpen"
          @click="soundMenuOpen = !soundMenuOpen"
        >
          <AppIcon name="chevron" :size="16" />
        </button>
        <div
          v-show="soundMenuOpen"
          id="header-sound-options"
          class="sound-menu option-popup"
          role="group"
          aria-label="Background sound"
        >
          <button
            v-for="sound in soundTracks"
            :key="sound.id"
            type="button"
            class="popup-option flex w-full items-center justify-between text-left"
            :aria-pressed="activeSound === sound.id"
            @click="pickHeaderSound(sound.id)"
          >
            <span>
              <strong>{{ sound.title }}</strong>
              <small>{{ sound.detail }}</small>
            </span>
            <AppIcon v-if="activeSound === sound.id" name="check" :size="17" />
          </button>
        </div>
        <p v-if="audioMessage" class="sound-error" role="status">
          {{ audioMessage }}
        </p>
      </div>
    </div>
  </header>
</template>
