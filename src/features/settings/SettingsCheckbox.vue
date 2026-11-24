<script setup lang="ts">
import AppIcon from '../../components/ui/AppIcon.vue'

defineProps<{ label: string; descriptionId: string; disabled?: boolean }>()
const checked = defineModel<boolean>({ required: true })
</script>

<template>
  <label
    class="settings-checkbox relative flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-lg py-1.5 pr-1.5 text-[length:0.88rem] font-[720]"
  >
    <input
      v-model="checked"
      type="checkbox"
      class="sr-only"
      :aria-describedby="descriptionId"
      :disabled="disabled"
    />
    <span>{{ label }}</span>
    <span
      class="settings-checkbox-mark grid size-6 shrink-0 place-items-center rounded-md border border-field-line bg-control text-paper"
      aria-hidden="true"
    >
      <AppIcon name="check" :size="16" />
    </span>
  </label>
</template>

<style scoped>
.settings-checkbox:hover:not(:has(input:disabled)) .settings-checkbox-mark {
  @apply border-accent;
}

.settings-checkbox:has(input:focus-visible) {
  @apply outline outline-2 outline-focus outline-offset-2;
}

.settings-checkbox:has(input:disabled) {
  @apply cursor-default opacity-60;
}

.settings-checkbox-mark svg {
  @apply scale-75 opacity-0;
}

.settings-checkbox input:checked ~ .settings-checkbox-mark {
  @apply border-accent bg-accent;
}

.settings-checkbox input:checked ~ .settings-checkbox-mark svg {
  @apply scale-100 opacity-100;
}

@media (prefers-reduced-motion: no-preference) {
  .settings-checkbox-mark {
    @apply transition-colors duration-150 ease-out;
  }

  .settings-checkbox-mark svg {
    @apply transition-[opacity,transform] duration-150 ease-out;
  }
}

@media (forced-colors: active) {
  .settings-checkbox input:checked ~ .settings-checkbox-mark {
    border-color: Highlight;
  }
}
</style>
