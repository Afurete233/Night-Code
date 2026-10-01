<script setup lang="ts">
import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuRoot,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from 'reka-ui'
import type { Component } from 'vue'

export interface DropdownMenuItemDef {
  id?: string
  label: string
  desc?: string
  icon?: Component | object
  shortcut?: string
  danger?: boolean
  separator?: boolean
  onClick?: () => void
}

withDefaults(
  defineProps<{
    items?: DropdownMenuItemDef[]
    align?: 'start' | 'center' | 'end'
    sideOffset?: number
  }>(),
  {
    items: () => [],
    align: 'start',
    sideOffset: 6,
  }
)

const emit = defineEmits<{
  (e: 'select', item: DropdownMenuItemDef): void
}>()

function handleSelect(item: DropdownMenuItemDef) {
  if (item.onClick) {
    item.onClick()
  }
  emit('select', item)
}
</script>

<template>
  <DropdownMenuRoot>
    <DropdownMenuTrigger as-child>
      <slot name="trigger" />
    </DropdownMenuTrigger>

    <DropdownMenuPortal>
      <DropdownMenuContent
        :align="align"
        :side-offset="sideOffset"
        class="select-dropdown z-50 min-w-[180px] overflow-hidden rounded-lg border border-[#2a3444] bg-[#121620]/95 p-1 text-slate-200 shadow-2xl backdrop-blur-md outline-none"
      >
        <slot>
          <template v-for="(item, idx) in items" :key="item.id || item.label || idx">
            <DropdownMenuSeparator
              v-if="item.separator"
              class="my-1 h-px bg-[#242c38]"
            />
            <DropdownMenuItem
              v-else
              :class="[
                'group relative flex cursor-pointer select-none items-center justify-between rounded-md px-2.5 py-1.5 text-xs text-slate-300 outline-none transition-colors',
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
                <div class="truncate">
                  <div class="font-medium leading-tight">{{ item.label }}</div>
                  <div v-if="item.desc" class="text-[10px] text-slate-500 font-normal leading-tight">{{ item.desc }}</div>
                </div>
              </div>

              <span v-if="item.shortcut" class="ml-3 font-mono text-[10px] text-slate-500">
                {{ item.shortcut }}
              </span>
            </DropdownMenuItem>
          </template>
        </slot>
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
