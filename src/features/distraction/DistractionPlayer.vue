<script setup lang="ts">
import { computed } from 'vue'
import PromptPlayer from '../../components/PromptPlayer.vue'
import { distractionPrompts } from './distractionPrompts'

const index = defineModel<number>('index', { required: true })
const prompt = computed(() => distractionPrompts[index.value])
const count = distractionPrompts.length
const lastPrompt = computed(() => index.value + 1 === count)

function changePrompt(direction: number) {
  index.value = (index.value + direction + count) % count
}
</script>

<template>
  <PromptPlayer
    icon="focus"
    :progress="`Prompt ${index + 1} of ${count}`"
    :title="prompt.title"
    :action="lastPrompt ? 'Start over' : 'Next'"
    :action-icon="lastPrompt ? 'reset' : 'arrow-right'"
    :can-go-back="index > 0"
    @back="changePrompt(-1)"
    @next="changePrompt(1)"
  >
    <p>{{ prompt.prompt }}</p>
    <template #support>
      <div class="distraction-examples">
        <h3>For example</h3>
        <ul>
          <li v-for="example in prompt.examples" :key="example">{{ example }}</li>
        </ul>
        <p>Stay with a prompt as long as you like.</p>
      </div>
    </template>
  </PromptPlayer>
</template>
