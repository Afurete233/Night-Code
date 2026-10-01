<script setup lang="ts">
import {
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogOverlay,
  DialogPortal,
  DialogRoot,
  DialogTitle,
} from 'reka-ui'
import { X } from '@lucide/vue'

withDefaults(
  defineProps<{
    open: boolean
    title?: string
    description?: string
    maxWidth?: string
    showClose?: boolean
  }>(),
  {
    title: '',
    description: '',
    maxWidth: 'max-w-md',
    showClose: true,
  }
)

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void
  (e: 'close'): void
}>()

function onUpdateOpen(val: boolean) {
  emit('update:open', val)
  if (!val) {
    emit('close')
  }
}
</script>

<template>
  <DialogRoot :open="open" @update:open="onUpdateOpen">
    <DialogPortal>
      <DialogOverlay
        class="dialog-overlay fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
      />
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <DialogContent
          :class="[
            'dialog-content pointer-events-auto relative w-full rounded-xl border border-[#2a3444] bg-[#121620] p-5 text-slate-200 shadow-2xl outline-none select-none',
            maxWidth
          ]"
        >
          <!-- 弹窗头部 -->
          <div v-if="title || $slots.title || $slots.header" class="mb-4 flex items-center justify-between border-b border-[#242b35] pb-3">
            <slot name="header">
              <div>
                <DialogTitle v-if="title" class="text-sm font-semibold text-slate-100">
                  <slot name="title">{{ title }}</slot>
                </DialogTitle>
                <DialogDescription v-if="description" class="mt-0.5 text-xs text-slate-400">
                  <slot name="description">{{ description }}</slot>
                </DialogDescription>
              </div>
            </slot>

            <DialogClose
              v-if="showClose"
              class="rounded-md p-1 text-slate-400 hover:bg-[#1f2735] hover:text-slate-200 transition-colors outline-none focus:ring-1 focus:ring-violet-500"
            >
              <X :size="16" />
            </DialogClose>
          </div>

          <!-- 弹窗主体内容 -->
          <div class="min-h-0">
            <slot />
          </div>

          <!-- 弹窗底部操作区 -->
          <div v-if="$slots.footer" class="mt-5 border-t border-[#242b35] pt-3 flex items-center justify-end gap-2">
            <slot name="footer" />
          </div>
        </DialogContent>
      </div>
    </DialogPortal>
  </DialogRoot>
</template>
