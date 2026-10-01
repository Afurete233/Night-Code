<script setup lang="ts">
import { ref, type Component } from 'vue'
import {
  CollapsibleContent,
  CollapsibleRoot,
  CollapsibleTrigger,
} from 'reka-ui'
import { ChevronDown, GripVertical } from '@lucide/vue'

const props = withDefaults(
  defineProps<{
    title?: string
    icon?: Component | object
    defaultOpen?: boolean
    badge?: string
    draggable?: boolean
    isDragging?: boolean
    isDragOver?: boolean
  }>(),
  {
    title: '',
    icon: undefined,
    defaultOpen: true,
    badge: '',
    draggable: false,
    isDragging: false,
    isDragOver: false,
  }
)

const emit = defineEmits<{
  (e: 'dragstart', event: DragEvent): void
  (e: 'dragover', event: DragEvent): void
  (e: 'drop', event: DragEvent): void
  (e: 'dragend', event: DragEvent): void
}>()

const isOpen = ref(props.defaultOpen)
</script>

<template>
  <CollapsibleRoot
    v-model:open="isOpen"
    :draggable="draggable"
    :class="[
      'group/card rounded-lg border border-[#242c38] bg-[#131722] shadow-sm overflow-hidden transition-all select-none',
      isDragging ? 'opacity-35 bg-violet-950/20 ring-1 ring-violet-500/40' : '',
      isDragOver && !isDragging ? 'border-t-2 border-t-violet-400 bg-violet-950/30 shadow-md' : ''
    ]"
    @dragstart="emit('dragstart', $event)"
    @dragover="emit('dragover', $event)"
    @drop="emit('drop', $event)"
    @dragend="emit('dragend', $event)"
  >
    <!-- 卡片头部可点击折叠触发区 -->
    <CollapsibleTrigger
      class="group flex w-full items-center justify-between p-3 text-left transition hover:bg-white/[0.02] outline-none"
    >
      <div class="flex items-center gap-1.5 min-w-0">
        <!-- 拖拽手柄 -->
        <div
          v-if="draggable"
          class="cursor-grab active:cursor-grabbing text-slate-600 hover:text-slate-300 p-0.5 -ml-1 opacity-60 group-hover/card:opacity-100 transition-opacity"
          title="按住上下拖动调整此面板卡片顺序"
          @click.stop
        >
          <GripVertical :size="13" />
        </div>

        <component :is="icon" v-if="icon" :size="14" class="text-violet-400 shrink-0" />
        <span class="truncate text-xs font-semibold text-slate-200">
          <slot name="title">{{ title }}</slot>
        </span>
        <span
          v-if="badge"
          class="rounded bg-[#1c2331] px-1.5 py-0.5 font-mono text-[9px] text-slate-400"
        >
          {{ badge }}
        </span>
      </div>

      <div class="flex items-center gap-1.5 shrink-0" @click.stop>
        <slot name="actions" />
        <div
          :class="[
            'p-0.5 text-slate-500 transition-transform duration-200 ease-out',
            isOpen ? 'rotate-0' : '-rotate-90 text-slate-600'
          ]"
        >
          <ChevronDown :size="14" />
        </div>
      </div>
    </CollapsibleTrigger>

    <!-- 卡片主体内容 (Padding 置于内层以防止动画高度测量抖动) -->
    <CollapsibleContent
      class="overflow-hidden data-[state=closed]:animate-collapse data-[state=open]:animate-expand"
    >
      <div class="border-t border-[#1e2531] p-3 text-xs">
        <slot />
      </div>
    </CollapsibleContent>
  </CollapsibleRoot>
</template>
