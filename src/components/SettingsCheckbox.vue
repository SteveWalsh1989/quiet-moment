<script setup lang="ts">
import AppIcon from './AppIcon.vue'

defineProps<{ label: string; descriptionId: string; disabled?: boolean }>()
const checked = defineModel<boolean>({ required: true })
</script>

<template>
  <label class="settings-checkbox">
    <input
      v-model="checked"
      type="checkbox"
      class="sr-only"
      :aria-describedby="descriptionId"
      :disabled="disabled"
    />
    <span>{{ label }}</span>
    <span class="settings-checkbox-mark" aria-hidden="true">
      <AppIcon name="check" :size="16" />
    </span>
  </label>
</template>
