<script setup lang="ts">
import { computed, type Component } from 'vue'
import {
  SelectContent,
  SelectItem,
  SelectItemIndicator,
  SelectItemText,
  SelectPortal,
  SelectRoot,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectTrigger,
  SelectValue,
  SelectViewport,
} from 'reka-ui'
import { Check, ChevronDown, ChevronUp } from '@lucide/vue'

export interface SelectOption {
  label: string
  value: string | number
  description?: string
  icon?: Component | object
}

const props = withDefaults(
  defineProps<{
    modelValue?: string | number
    options: (SelectOption | string)[]
    placeholder?: string
    disabled?: boolean
    size?: 'sm' | 'md'
  }>(),
  {
    modelValue: '',
    placeholder: '请选择...',
    disabled: false,
    size: 'sm',
  }
)

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
  (e: 'change', val: string): void
}>()

const normalizedOptions = computed<SelectOption[]>(() => {
  return props.options.map((opt) => {
    if (typeof opt === 'string') {
      const val = opt === '' ? '__empty__' : opt
      return { label: opt || '(空)', value: val }
    }
    return {
      ...opt,
      value: opt.value === '' ? '__empty__' : opt.value
    }
  })
})

const stringValue = computed(() => {
  const raw = props.modelValue !== undefined && props.modelValue !== null ? String(props.modelValue) : ''
  return raw === '' ? '__empty__' : raw
})

function onValueChange(val: string) {
  const actualVal = val === '__empty__' ? '' : val
  emit('update:modelValue', actualVal)
  emit('change', actualVal)
}
</script>

<template>
  <SelectRoot :model-value="stringValue" :disabled="disabled" @update:model-value="onValueChange">
    <SelectTrigger
      :class="[
        'flex w-full items-center justify-between gap-2 rounded-md border border-[#262e3b] bg-[#0d1015] text-left text-slate-200 outline-none transition-all',
        'hover:border-[#384457] focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50',
        'disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'h-8 px-2.5 text-xs' : 'h-9 px-3 text-xs'
      ]"
    >
      <SelectValue :placeholder="placeholder" class="truncate" />
      <ChevronDown :size="13" class="shrink-0 text-slate-500 transition-transform duration-200 group-data-[state=open]:rotate-180" />
    </SelectTrigger>

    <SelectPortal>
      <SelectContent
        position="popper"
        :side-offset="4"
        class="select-dropdown z-50 min-w-[10rem] max-h-[320px] overflow-hidden rounded-lg border border-[#2a3342] bg-[#121620]/95 p-1 text-slate-200 shadow-2xl backdrop-blur-md outline-none"
      >
        <SelectScrollUpButton class="flex h-5 items-center justify-center text-slate-400">
          <ChevronUp :size="13" />
        </SelectScrollUpButton>

        <SelectViewport class="p-0.5 max-h-[280px] overflow-y-auto">
          <SelectItem
            v-for="opt in normalizedOptions"
            :key="String(opt.value)"
            :value="String(opt.value)"
            class="relative flex cursor-pointer select-none items-center justify-between rounded-md px-2.5 py-1.5 text-xs text-slate-300 outline-none transition-colors hover:bg-violet-600/20 hover:text-white data-[highlighted]:bg-violet-600/30 data-[highlighted]:text-white data-[state=checked]:font-semibold data-[state=checked]:text-violet-300"
          >
            <div class="flex items-center gap-2">
              <component :is="opt.icon" v-if="opt.icon" :size="13" class="shrink-0 text-slate-400" />
              <SelectItemText>{{ opt.label }}</SelectItemText>
            </div>

            <SelectItemIndicator class="ml-2 flex items-center justify-center text-violet-400">
              <Check :size="13" />
            </SelectItemIndicator>
          </SelectItem>
        </SelectViewport>

        <SelectScrollDownButton class="flex h-5 items-center justify-center text-slate-400">
          <ChevronDown :size="13" />
        </SelectScrollDownButton>
      </SelectContent>
    </SelectPortal>
  </SelectRoot>
</template>
