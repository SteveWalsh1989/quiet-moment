<script setup lang="ts">
import { computed } from 'vue'
import PromptPlayer from '../../components/player/PromptPlayer.vue'
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
      <div class="grid gap-2 min-[960px]:gap-y-4">
        <h3 class="text-sm font-bold text-player-muted">For example</h3>
        <ul class="list-disc space-y-1 pl-5 text-on-player marker:text-player-highlight">
          <li v-for="example in prompt.examples" :key="example">{{ example }}</li>
        </ul>
        <p class="mt-1 text-sm text-player-muted">Stay with a prompt as long as you like.</p>
      </div>
    </template>
  </PromptPlayer>
</template>
