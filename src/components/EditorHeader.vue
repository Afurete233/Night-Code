<script setup lang="ts">
import { ref } from 'vue'
import {
  Dices,
  Download,
  FolderUp,
  PanelLeftClose,
  PanelLeftOpen,
  Redo2,
  Sparkles,
  Undo2,
  Wand2,
} from '@lucide/vue'
import { useEditorStore } from '../stores/editor'

const editor = useEditorStore()
const emit = defineEmits<{ export: [] }>()

const jsonFileInput = ref<HTMLInputElement | null>(null)

function onImportJSON(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = (event) => {
    const text = event.target?.result as string
    if (text) {
      editor.importProjectJSON(text)
    }
  }
  reader.readAsText(file)
  ;(e.target as HTMLInputElement).value = ''
}
</script>

<template>
  <header class="flex h-14 shrink-0 items-center justify-between border-b border-[#242b35] bg-[#0e1116] px-4 select-none">
    <div class="flex items-center gap-3">
      <button
        class="icon-button"
        :title="editor.isLeftPanelCollapsed ? '展开左侧面板' : '收起左侧面板'"
        @click="editor.toggleLeftPanel"
      >
        <PanelLeftOpen v-if="editor.isLeftPanelCollapsed" :size="16" />
        <PanelLeftClose v-else :size="16" />
      </button>

      <div class="flex items-center gap-2 pr-2">
        <div class="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-400 to-indigo-600 shadow-lg shadow-violet-900/30">
          <Sparkles :size="15" />
        </div>
        <span class="text-sm font-semibold tracking-tight text-white">Frameflow · JIZURA</span>
      </div>

      <div class="h-5 w-px bg-[#242b35]" />

      <!-- JIZURA 快捷操作：随机一版 & 歌词排版 -->
      <div class="flex items-center gap-2">
        <button
          class="flex items-center gap-1.5 rounded-md bg-[#161c28] border border-violet-800/40 px-2.5 py-1 text-xs font-semibold text-violet-300 hover:bg-violet-600 hover:text-white transition shadow-sm"
          title="一键随机重组 JIZURA 风格配色、排版、动效与背景"
          @click="editor.randomizeJizura"
        >
          <Dices :size="13" />
          <span>随机生成一版</span>
        </button>

        <button
          class="flex items-center gap-1.5 rounded-md bg-[#161c28] border border-pink-800/40 px-2.5 py-1 text-xs font-semibold text-pink-300 hover:bg-pink-600 hover:text-white transition shadow-sm"
          title="导入多行歌词/LRC自动生成整首视频序列"
          @click="editor.showLyricModal = true"
        >
          <Wand2 :size="13" />
          <span>歌词排版生成</span>
        </button>
      </div>
    </div>

    <!-- 顶部操作按钮 -->
    <div class="flex items-center gap-2">
      <!-- 导入工程 JSON -->
      <input
        ref="jsonFileInput"
        type="file"
        accept=".json"
        class="hidden"
        @change="onImportJSON"
      />
      <button
        class="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-slate-300 hover:bg-[#1a202a] hover:text-white transition"
        title="导入项目工程文件 (JSON)"
        @click="jsonFileInput?.click"
      >
        <FolderUp :size="14" />
        <span>打开工程</span>
      </button>

      <div class="h-4 w-px bg-[#242b35] mx-1" />

      <button
        class="icon-button"
        title="撤销 (Ctrl+Z)"
        :disabled="!editor.canUndo"
        @click="editor.undo"
      >
        <Undo2 :size="15" />
      </button>

      <button
        class="icon-button"
        title="重做 (Ctrl+Shift+Z)"
        :disabled="!editor.canRedo"
        @click="editor.redo"
      >
        <Redo2 :size="15" />
      </button>

      <div class="mx-1 h-4 w-px bg-[#242b35]" />

      <!-- 渲染与导出 -->
      <button
        class="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:from-violet-500 hover:to-indigo-500 active:scale-95"
        @click="editor.showExportModal = true"
      >
        <Download :size="14" />
        <span>导出视频</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  color: #7f8a9a;
  transition: all 0.15s ease;
}
.icon-button:hover:not(:disabled) {
  background: #1b212b;
  color: #eef2f6;
}
.icon-button:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
</style>
