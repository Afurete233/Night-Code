<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    modelValue: number
    label?: string
    unit?: string
    min?: number
    max?: number
    step?: number
    precision?: number
    disabled?: boolean
    size?: 'sm' | 'md'
  }>(),
  {
    label: '',
    unit: '',
    min: -Infinity,
    max: Infinity,
    step: 1,
    precision: undefined,
    disabled: false,
    size: 'sm',
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: number): void
  (e: 'change', val: number): void
}>()

const isEditing = ref(false)
const isDragging = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)
const inputValue = ref('')

let startPointerX = 0
let startValue = 0
let hasMoved = false

const displayDecimals = computed(() => {
  if (props.precision !== undefined) return props.precision
  if (props.step < 1) {
    const dec = props.step.toString().split('.')[1]
    return dec ? dec.length : 1
  }
  return 0
})

const formattedValue = computed(() => {
  const v = props.modelValue ?? 0
  return displayDecimals.value > 0 ? v.toFixed(displayDecimals.value) : String(Math.round(v))
})

function clamp(val: number): number {
  let clamped = Math.max(props.min, Math.min(props.max, val))
  if (displayDecimals.value > 0) {
    clamped = Number(clamped.toFixed(displayDecimals.value))
  } else {
    clamped = Math.round(clamped)
  }
  return clamped
}

function startPointerDown(e: PointerEvent) {
  if (props.disabled || isEditing.value || e.button !== 0) return
  e.preventDefault()

  isDragging.value = false
  hasMoved = false
  startPointerX = e.clientX
  startValue = props.modelValue ?? 0

  window.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)
  window.addEventListener('pointercancel', onPointerUp)
}

function onPointerMove(e: PointerEvent) {
  const deltaX = e.clientX - startPointerX
  if (!hasMoved && Math.abs(deltaX) > 2) {
    hasMoved = true
    isDragging.value = true
    document.body.style.cursor = 'ew-resize'
    document.body.style.userSelect = 'none'
  }

  if (isDragging.value) {
    const multiplier = e.shiftKey ? props.step * 10 : e.altKey ? props.step * 0.1 : props.step
    const nextVal = clamp(startValue + deltaX * multiplier)
    emit('update:modelValue', nextVal)
  }
}

function onPointerUp() {
  window.removeEventListener('pointermove', onPointerMove)
  window.removeEventListener('pointerup', onPointerUp)
  window.removeEventListener('pointercancel', onPointerUp)

  if (isDragging.value) {
    isDragging.value = false
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    emit('change', props.modelValue)
  } else if (!hasMoved) {
    // 纯点击进入键盘直接输入模式
    startEdit()
  }
}

function startEdit() {
  if (props.disabled) return
  isEditing.value = true
  inputValue.value = String(props.modelValue)
  nextTick(() => {
    inputRef.value?.focus()
    inputRef.value?.select()
  })
}

function commitEdit() {
  if (!isEditing.value) return
  isEditing.value = false
  const parsed = Number(inputValue.value)
  if (!isNaN(parsed)) {
    const nextVal = clamp(parsed)
    emit('update:modelValue', nextVal)
    emit('change', nextVal)
  }
}

function cancelEdit() {
  isEditing.value = false
}

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    commitEdit()
  } else if (e.key === 'Escape') {
    cancelEdit()
  }
}
</script>

<template>
  <div
    :class="[
      'group relative flex w-full select-none items-center justify-between rounded-md border border-[#242c38] bg-[#0c1015] px-2.5 transition-all',
      'hover:border-[#384457] hover:bg-[#10141c]',
      isDragging ? 'border-violet-500 bg-violet-950/30 ring-1 ring-violet-500/50 shadow-inner' : '',
      isEditing ? 'border-violet-500 bg-[#090c10] ring-1 ring-violet-500/50 cursor-text' : 'cursor-ew-resize',
      disabled ? 'cursor-not-allowed opacity-50' : '',
      size === 'sm' ? 'h-8 text-xs' : 'h-9 text-xs'
    ]"
    :title="!isEditing ? '按住鼠标左右拖拽快速调节数值，单击直接输入' : ''"
    @pointerdown="startPointerDown"
  >
    <!-- 左侧属性标签 (如 X, Y, 缩放等) -->
    <span
      v-if="label"
      :class="[
        'mr-2 font-mono text-[11px] font-semibold transition-colors',
        isDragging ? 'text-violet-300' : 'text-slate-500 group-hover:text-slate-300'
      ]"
    >
      {{ label }}
    </span>

    <!-- 拖拽/展示状态 -->
    <div v-if="!isEditing" class="flex min-w-0 flex-1 items-baseline justify-end gap-1 font-mono">
      <span
        :class="[
          'truncate font-semibold tracking-tight transition-colors',
          isDragging ? 'text-violet-200' : 'text-slate-200 group-hover:text-white'
        ]"
      >
        {{ formattedValue }}
      </span>
      <span v-if="unit" class="text-[10px] text-slate-500 group-hover:text-slate-400">
        {{ unit }}
      </span>
    </div>

    <!-- 键盘直接输入状态 -->
    <input
      v-else
      ref="inputRef"
      v-model="inputValue"
      type="number"
      :min="min !== -Infinity ? min : undefined"
      :max="max !== Infinity ? max : undefined"
      :step="step"
      class="h-full min-w-0 flex-1 bg-transparent text-right font-mono text-xs font-semibold text-white outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      @blur="commitEdit"
      @keydown="onKeyDown"
    />
  </div>
</template>
