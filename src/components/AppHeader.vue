<script setup lang="ts">
import { exerciseViews } from '../exerciseViews'
import type { ExerciseView } from '../exerciseViews'
import AppIcon from './AppIcon.vue'

defineProps<{ view: ExerciseView; playing: boolean; audioMessage: string }>()
const emit = defineEmits<{
  home: []
  navigate: [view: ExerciseView]
  toggleSound: []
}>()
const markSource = globalThis.quietMomentOffline?.mark ?? './mark.svg'
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
      <div class="topbar-actions flex items-center">
        <div class="relative">
          <button
            type="button"
            class="header-icon-button"
            aria-label="Background sound"
            :aria-pressed="playing"
            :title="playing ? 'Mute background sound' : 'Play background sound'"
            @click="emit('toggleSound')"
          >
            <AppIcon :name="playing ? 'sound' : 'mute'" :size="18" />
          </button>
          <p v-if="audioMessage" class="sound-error" role="status">
            {{ audioMessage }}
          </p>
        </div>
        <slot name="settings" />
      </div>
    </div>
  </header>
</template>
