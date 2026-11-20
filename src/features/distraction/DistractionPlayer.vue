<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import AppIcon from '../../components/AppIcon.vue'
import { distractionPrompts } from './distractionPrompts'

const index = defineModel<number>('index', { required: true })
const prompt = computed(() => distractionPrompts[index.value])
const title = ref<HTMLHeadingElement | null>(null)

function changePrompt(direction: number) {
  const count = distractionPrompts.length
  index.value = (index.value + direction + count) % count
  void nextTick(() => title.value?.focus({ preventScroll: true }))
}
</script>

<template>
  <div class="prompt-content">
    <div class="step-line flex items-center">
      <AppIcon name="focus" :size="20" /><span
        >Prompt {{ index + 1 }} of {{ distractionPrompts.length }}</span
      >
    </div>
    <h2 ref="title" tabindex="-1">{{ prompt.title }}</h2>
    <p>{{ prompt.prompt }}</p>
    <div class="examples">
      <h3>For example</h3>
      <ul class="flex flex-wrap">
        <li v-for="example in prompt.examples" :key="example">{{ example }}</li>
      </ul>
    </div>
  </div>
  <div class="prompt-actions flex flex-wrap items-center">
    <button type="button" class="primary-button" @click="changePrompt(1)">
      {{ index + 1 === distractionPrompts.length ? 'Start over' : 'Another prompt' }}
    </button>
    <button v-if="index" type="button" class="on-dark-button" @click="changePrompt(-1)">
      Back
    </button>
  </div>
  <div class="player-bottom">Stay with a prompt as long as you like.</div>
</template>
