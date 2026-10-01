<script setup lang="ts">
import { computed, type Component } from 'vue'

export interface EditorPanelProps {
  title?: string
  icon?: Component | object
  width?: number | string
  height?: number | string
  position?: 'left' | 'right' | 'bottom' | 'custom'
  overflow?: 'auto' | 'hidden'
  bordered?: boolean
}

const props = withDefaults(defineProps<EditorPanelProps>(), {
  title: '',
  icon: undefined,
  width: undefined,
  height: undefined,
  position: 'custom',
  overflow: 'hidden',
  bordered: true,
})

const panelStyle = computed(() => {
  const styles: Record<string, string> = {}
  if (props.width !== undefined) {
    styles.width = typeof props.width === 'number' ? `${props.width}px` : props.width
  }
  if (props.height !== undefined) {
    styles.height = typeof props.height === 'number' ? `${props.height}px` : props.height
  }
  return styles
})
</script>

<template>
  <aside
    :class="[
      'editor-panel flex shrink-0 flex-col bg-[#11151b] select-none text-slate-200 border-[#242b35]',
      bordered && position === 'left' && 'border-r',
      bordered && position === 'right' && 'border-l',
      bordered && position === 'bottom' && 'border-t',
    ]"
    :style="panelStyle"
  >
    <!-- 面板标准头部工具栏 (包含图标、标题和动作操作区插槽) -->
    <header
      v-if="$slots.header || title || icon || $slots.title || $slots.actions"
      class="flex h-11 shrink-0 items-center justify-between border-b border-[#242b35] px-3 bg-[#131720]"
    >
      <slot name="header">
        <div class="flex items-center gap-2 min-w-0">
          <slot name="icon">
            <component :is="icon" v-if="icon" :size="15" class="text-violet-400 shrink-0" />
          </slot>
          <slot name="title">
            <span v-if="title" class="truncate text-xs font-semibold text-slate-200">{{ title }}</span>
          </slot>
        </div>

        <div class="flex items-center gap-1.5 shrink-0">
          <slot name="actions" />
        </div>
      </slot>
    </header>

    <!-- 面板内容主体容器 -->
    <div :class="['min-h-0 flex-1 flex flex-col', overflow === 'auto' ? 'overflow-y-auto' : 'overflow-hidden']">
      <slot />
    </div>

    <!-- 面板底栏辅助区插槽 -->
    <footer v-if="$slots.footer" class="shrink-0 border-t border-[#242b35] bg-[#0d1016]">
      <slot name="footer" />
    </footer>
  </aside>
</template>
