<script setup lang="ts">
import { ref, watch } from 'vue'
import AppIcon from './AppIcon.vue'
import type { IconName } from './iconPaths'

const props = defineProps<{
  icon: IconName
  progress: string
  title: string
  action: string
  actionIcon: IconName
  canGoBack: boolean
}>()
const emit = defineEmits<{ next: []; back: [] }>()
const heading = ref<HTMLHeadingElement | null>(null)

watch(
  () => props.progress,
  () => heading.value?.focus(),
  { flush: 'post' },
)
</script>

<template>
  <div class="prompt-player">
    <div class="prompt-player-toolbar">
      <div class="step-line flex min-w-0 items-center">
        <AppIcon :name="icon" :size="18" class="shrink-0 text-player-highlight" />
        <span>{{ progress }}</span>
      </div>
      <slot name="toolbar" />
    </div>
    <div class="prompt-player-stage">
      <div class="prompt-player-copy">
        <h2 ref="heading" tabindex="-1">{{ title }}</h2>
        <slot />
      </div>
      <div v-if="$slots.support" class="prompt-player-support">
        <slot name="support" />
      </div>
    </div>
    <div class="prompt-player-actions">
      <button v-if="canGoBack" type="button" class="prompt-back" @click="emit('back')">
        <AppIcon name="arrow-left" :size="17" />
        Back
      </button>
      <button type="button" class="primary-button prompt-next" @click="emit('next')">
        {{ action }}
        <AppIcon :name="actionIcon" :size="17" />
      </button>
    </div>
  </div>
</template>
