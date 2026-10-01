<script setup lang="ts">
import {
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuPortal,
  ContextMenuRoot,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from 'reka-ui'
import type { Component } from 'vue'

export interface ContextMenuItemDef {
  id?: string
  label: string
  desc?: string
  icon?: Component | object
  shortcut?: string
  danger?: boolean
  separator?: boolean
  disabled?: boolean
  onClick?: () => void
}

withDefaults(
  defineProps<{
    items?: ContextMenuItemDef[]
  }>(),
  {
    items: () => [],
  }
)

const emit = defineEmits<{
  (e: 'select', item: ContextMenuItemDef): void
}>()

function handleSelect(item: ContextMenuItemDef) {
  if (item.disabled) return
  if (item.onClick) {
    item.onClick()
  }
  emit('select', item)
}
</script>

<template>
  <ContextMenuRoot>
    <ContextMenuTrigger as-child data-custom-context="true">
      <slot name="trigger" />
    </ContextMenuTrigger>

    <ContextMenuPortal>
      <ContextMenuContent
        class="select-dropdown z-50 min-w-[160px] overflow-hidden rounded-lg border border-[#2a3444] bg-[#121620]/95 p-1 text-slate-200 shadow-2xl backdrop-blur-md outline-none"
      >
        <slot>
          <template v-for="(item, idx) in items" :key="item.id || item.label || idx">
            <ContextMenuSeparator
              v-if="item.separator"
              class="my-1 h-px bg-[#242c38]"
            />
            <ContextMenuItem
              v-else
              :disabled="item.disabled"
              :class="[
                'group relative flex cursor-pointer select-none items-center justify-between rounded-md px-2.5 py-1.5 text-xs text-slate-300 outline-none transition-colors',
                item.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : '',
                item.danger
                  ? 'text-red-400 hover:bg-red-950/40 hover:text-red-300'
                  : 'hover:bg-violet-600/25 hover:text-white data-[highlighted]:bg-violet-600/30 data-[highlighted]:text-white'
              ]"
              @click="handleSelect(item)"
            >
              <div class="flex items-center gap-2 min-w-0">
                <component
                  :is="item.icon"
                  v-if="item.icon"
                  :size="14"
                  :class="item.danger ? 'text-red-400' : 'text-violet-400 group-hover:text-violet-300'"
                />
                <span class="truncate font-medium">{{ item.label }}</span>
              </div>

              <span v-if="item.shortcut" class="ml-3 font-mono text-[10px] text-slate-500">
                {{ item.shortcut }}
              </span>
            </ContextMenuItem>
          </template>
        </slot>
      </ContextMenuContent>
    </ContextMenuPortal>
  </ContextMenuRoot>
</template>
