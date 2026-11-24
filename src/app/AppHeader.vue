<script setup lang="ts">
import { exerciseViews } from './exerciseViews'
import type { ExerciseView } from './exerciseViews'
import AppIcon from '../components/ui/AppIcon.vue'

defineProps<{ view: ExerciseView }>()
const emit = defineEmits<{
  home: []
  navigate: [view: ExerciseView]
}>()
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
        <svg width="34" height="34" viewBox="0 0 40 40" aria-hidden="true">
          <rect width="40" height="40" rx="10" class="fill-player-mid" />
          <circle cx="25.5" cy="13.5" r="2.1" class="fill-action" />
          <path
            d="M9 21c5.5 0 5.5-3.7 11-3.7s5.5 3.7 11 3.7M9 27c5.5 0 5.5-3.7 11-3.7s5.5 3.7 11 3.7"
            fill="none"
            class="stroke-action"
            stroke-linecap="round"
            stroke-width="1.7"
          />
        </svg>
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
    </div>
  </header>
</template>
