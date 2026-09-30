<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import AssetPanel from './components/AssetPanel.vue'
import CanvasStage from './components/CanvasStage.vue'
import EditorHeader from './components/EditorHeader.vue'
import ExportModal from './components/ExportModal.vue'
import InspectorPanel from './components/InspectorPanel.vue'
import TimelinePanel from './components/TimelinePanel.vue'
import { useEditorStore } from './stores/editor'

const editor = useEditorStore()

const activeResizer = ref<'left' | 'right' | 'bottom' | null>(null)

function triggerCanvasResize() {
  window.dispatchEvent(new Event('resize'))
}

function startResize(type: 'left' | 'right' | 'bottom', e: PointerEvent) {
  e.preventDefault()
  const target = e.currentTarget as HTMLElement
  try {
    target.setPointerCapture(e.pointerId)
  } catch {}
  activeResizer.value = type
}

function onResizerPointerMove(e: PointerEvent) {
  if (!activeResizer.value) return

  if (activeResizer.value === 'left') {
    editor.leftWidth = Math.max(180, Math.min(480, e.clientX))
  } else if (activeResizer.value === 'right') {
    editor.rightWidth = Math.max(200, Math.min(500, window.innerWidth - e.clientX))
  } else if (activeResizer.value === 'bottom') {
    const maxBottom = Math.max(200, window.innerHeight - 200)
    editor.bottomHeight = Math.max(140, Math.min(maxBottom, window.innerHeight - e.clientY))
  }

  triggerCanvasResize()
}

function stopResize(e: PointerEvent) {
  if (activeResizer.value) {
    const target = e.currentTarget as HTMLElement
    try {
      target.releasePointerCapture(e.pointerId)
    } catch {}
    activeResizer.value = null
    triggerCanvasResize()
  }
}

function onKeydown(event: KeyboardEvent) {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault()
    if (event.shiftKey) {
      editor.redo()
    } else {
      editor.undo()
    }
  }
  if (event.code === 'Space' && (event.target === document.body || (event.target as HTMLElement)?.tagName === 'MAIN')) {
    event.preventDefault()
    editor.togglePlay()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <main class="flex h-screen flex-col bg-[#090b0f] text-slate-200 select-none overflow-hidden relative">
    <EditorHeader />

    <section class="flex min-h-0 flex-1 relative">
      <!-- 左侧素材/图层面板 -->
      <AssetPanel />

      <!-- 左侧调整拖拽手柄 (应用 Pointer Capture 机制) -->
      <div
        class="resizer-v group relative z-30 w-1.5 cursor-col-resize bg-[#1c2330] hover:bg-violet-500 transition-colors"
        title="按住拖拽调整左侧栏宽度"
        @pointerdown="startResize('left', $event)"
        @pointermove="onResizerPointerMove"
        @pointerup="stopResize"
      >
        <div class="absolute inset-y-0 -left-1 -right-1" />
      </div>

      <!-- 中间与底部工作区 -->
      <section class="flex min-w-0 flex-1 flex-col">
        <!-- 预览画布区 -->
        <CanvasStage />

        <!-- 底部时间线调整拖拽手柄 (应用 Pointer Capture 机制) -->
        <div
          class="resizer-h group relative z-30 h-1.5 cursor-row-resize bg-[#1c2330] hover:bg-violet-500 transition-colors"
          title="按住拖拽调整时间线面板高度"
          @pointerdown="startResize('bottom', $event)"
          @pointermove="onResizerPointerMove"
          @pointerup="stopResize"
        >
          <div class="absolute inset-x-0 -top-1 -bottom-1" />
        </div>

        <!-- 底部时间线区 -->
        <TimelinePanel />
      </section>

      <!-- 右侧调整拖拽手柄 (应用 Pointer Capture 机制) -->
      <div
        class="resizer-v group relative z-30 w-1.5 cursor-col-resize bg-[#1c2330] hover:bg-violet-500 transition-colors"
        title="按住拖拽调整属性栏宽度"
        @pointerdown="startResize('right', $event)"
        @pointermove="onResizerPointerMove"
        @pointerup="stopResize"
      >
        <div class="absolute inset-y-0 -left-1 -right-1" />
      </div>

      <!-- 右侧属性检查器面板 -->
      <InspectorPanel />
    </section>

    <!-- 拖拽过程中覆盖遮罩，保证指针形状一致且不与画板文本框选粘连 -->
    <div
      v-if="activeResizer"
      class="fixed inset-0 z-50 select-none"
      :class="{
        'cursor-col-resize': activeResizer === 'left' || activeResizer === 'right',
        'cursor-row-resize': activeResizer === 'bottom'
      }"
    />

    <!-- 视频与工程导出弹窗 -->
    <ExportModal :open="editor.showExportModal" @close="editor.showExportModal = false" />
  </main>
</template>
