<script setup lang="ts">
import type { Component } from 'vue'

withDefaults(
  defineProps<{
    modelValue?: string | number
    type?: string
    placeholder?: string
    prefixIcon?: Component | object
    suffix?: string
    disabled?: boolean
    size?: 'sm' | 'md'
  }>(),
  {
    modelValue: '',
    type: 'text',
    placeholder: '',
    prefixIcon: undefined,
    suffix: '',
    disabled: false,
    size: 'sm',
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'change', event: Event): void
  (e: 'blur', event: FocusEvent): void
}>()

function onInput(e: Event) {
  emit('update:modelValue', (e.target as HTMLInputElement).value)
}
</script>

<template>
  <div
    :class="[
      'relative flex items-center rounded-md border border-[#262e3b] bg-[#0d1015] transition-all',
      'hover:border-[#384457] focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500/50',
      disabled ? 'cursor-not-allowed opacity-50' : '',
      size === 'sm' ? 'h-8 text-xs' : 'h-9 text-xs'
    ]"
  >
    <div v-if="prefixIcon" class="pl-2.5 pr-1 text-slate-500 flex items-center justify-center">
      <component :is="prefixIcon" :size="13" />
    </div>

    <input
      :type="type"
      :value="modelValue"
      :placeholder="placeholder"
      :disabled="disabled"
      class="h-full min-w-0 flex-1 bg-transparent px-2.5 text-slate-200 placeholder:text-slate-600 outline-none disabled:cursor-not-allowed font-sans"
      @input="onInput"
      @change="emit('change', $event)"
      @blur="emit('blur', $event)"
    />

    <span v-if="suffix" class="pr-2.5 text-[10px] font-mono text-slate-500 select-none">
      {{ suffix }}
    </span>
  </div>
</template>
