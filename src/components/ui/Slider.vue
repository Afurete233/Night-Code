<script setup lang="ts">
import { computed } from 'vue'
import { SliderRange, SliderRoot, SliderThumb, SliderTrack } from 'reka-ui'

const props = withDefaults(
  defineProps<{
    modelValue: number
    min?: number
    max?: number
    step?: number
    disabled?: boolean
  }>(),
  {
    min: 0,
    max: 100,
    step: 1,
    disabled: false,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: number): void
  (e: 'change', val: number): void
}>()

const sliderValues = computed({
  get: () => [props.modelValue],
  set: (val: number[]) => {
    if (val && val.length > 0) {
      emit('update:modelValue', val[0])
      emit('change', val[0])
    }
  },
})
</script>

<template>
  <SliderRoot
    v-model="sliderValues"
    :min="min"
    :max="max"
    :step="step"
    :disabled="disabled"
    class="relative flex h-5 w-full touch-none select-none items-center cursor-pointer"
  >
    <SliderTrack class="relative h-1.5 w-full grow overflow-hidden rounded-full bg-[#1e2633]">
      <SliderRange class="absolute h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full" />
    </SliderTrack>
    <SliderThumb
      class="block h-3.5 w-3.5 rounded-full border border-violet-400 bg-white shadow-md shadow-violet-950/60 ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 hover:scale-110 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
    />
  </SliderRoot>
</template>
