<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: number
    min?: number
    max?: number
    step?: number
    label?: string
    unit?: string
    disabled?: boolean
    precision?: number
  }>(),
  {
    min: -Infinity,
    max: Infinity,
    step: 1,
    label: '',
    unit: '',
    disabled: false,
    precision: undefined,
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: number): void
  (e: 'change', val: number): void
}>()

let isScrubbing = false
let startX = 0
let startVal = 0

function clamp(val: number): number {
  let res = Math.max(props.min, Math.min(props.max, val))
  if (props.precision !== undefined) {
    res = Number(res.toFixed(props.precision))
  } else if (props.step < 1) {
    const decimals = (props.step.toString().split('.')[1] || '').length
    res = Number(res.toFixed(Math.max(1, decimals)))
  } else {
    res = Math.round(res)
  }
  return res
}

function onInputChange(e: Event) {
  const raw = Number((e.target as HTMLInputElement).value)
  if (!isNaN(raw)) {
    const clamped = clamp(raw)
    emit('update:modelValue', clamped)
    emit('change', clamped)
  }
}

function startScrub(e: PointerEvent) {
  if (props.disabled || e.button !== 0) return
  isScrubbing = true
  startX = e.clientX
  startVal = props.modelValue || 0

  document.body.style.cursor = 'ew-resize'
  document.body.style.userSelect = 'none'

  window.addEventListener('pointermove', onScrubMove)
  window.addEventListener('pointerup', stopScrub)
  window.addEventListener('pointercancel', stopScrub)
}

function onScrubMove(e: PointerEvent) {
  if (!isScrubbing) return
  const deltaX = e.clientX - startX
  const multiplier = e.shiftKey ? props.step * 10 : e.altKey ? props.step * 0.1 : props.step
  const newVal = clamp(startVal + deltaX * multiplier)
  emit('update:modelValue', newVal)
}

function stopScrub() {
  if (isScrubbing) {
    isScrubbing = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    window.removeEventListener('pointermove', onScrubMove)
    window.removeEventListener('pointerup', stopScrub)
    window.removeEventListener('pointercancel', stopScrub)
    emit('change', props.modelValue)
  }
}
</script>

<template>
  <div
    :class="[
      'group relative flex h-8 items-center rounded-md border border-[#242c38] bg-[#0c1015] px-2 text-xs transition-all',
      'hover:border-[#384457] focus-within:border-violet-500 focus-within:ring-1 focus-within:ring-violet-500/50',
      disabled ? 'cursor-not-allowed opacity-50' : ''
    ]"
  >
    <!-- 可左右拖拽调数值的标签手柄 (Scrub Label) -->
    <span
      v-if="label"
      class="mr-1.5 cursor-ew-resize select-none font-mono text-[11px] font-semibold text-slate-500 hover:text-violet-400 active:text-violet-300"
      :title="`按住左右拖动调节 ${label}`"
      @pointerdown="startScrub"
    >
      {{ label }}
    </span>

    <input
      type="number"
      :value="modelValue"
      :min="min !== -Infinity ? min : undefined"
      :max="max !== Infinity ? max : undefined"
      :step="step"
      :disabled="disabled"
      class="h-full min-w-0 flex-1 bg-transparent text-right font-mono text-xs text-slate-200 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      @change="onInputChange"
    />

    <span v-if="unit" class="ml-1 select-none font-mono text-[10px] text-slate-500">
      {{ unit }}
    </span>
  </div>
</template>
