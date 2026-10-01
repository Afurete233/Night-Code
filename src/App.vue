<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import AssetPanel from './components/AssetPanel.vue'
import CanvasStage from './components/CanvasStage.vue'
import EditorHeader from './components/EditorHeader.vue'
import ExportModal from './components/ExportModal.vue'
import InspectorPanel from './components/InspectorPanel.vue'
import LyricImportModal from './components/LyricImportModal.vue'
import JizuraPresetExplorerModal from './components/JizuraPresetExplorerModal.vue'
import PresetDrawerPanel from './components/inspector/common/PresetDrawerPanel.vue'
import TimelinePanel from './components/TimelinePanel.vue'
import { parseLyricText } from './engine/jizura/lyrics'
import { useEditorStore } from './stores/editor'

const editor = useEditorStore()

const workspaceRef = ref<HTMLElement | null>(null)
const activeResizer = ref<'left' | 'right' | 'bottom' | 'drawer' | null>(null)

let startMouseX = 0
let startMouseY = 0
let startDimension = 0

function startResize(type: 'left' | 'right' | 'bottom' | 'drawer', e: PointerEvent) {
  e.preventDefault()
  activeResizer.value = type
  startMouseX = e.clientX
  startMouseY = e.clientY

  if (type === 'left') {
    startDimension = editor.leftWidth
    document.body.style.cursor = 'col-resize'
  } else if (type === 'right') {
    startDimension = editor.rightWidth
    document.body.style.cursor = 'col-resize'
  } else if (type === 'bottom') {
    startDimension = editor.bottomHeight
    document.body.style.cursor = 'row-resize'
  } else if (type === 'drawer') {
    startDimension = editor.presetDrawerWidth
    document.body.style.cursor = 'col-resize'
  }
  document.body.style.userSelect = 'none'

  window.addEventListener('pointermove', onWindowPointerMove)
  window.addEventListener('pointerup', onWindowPointerUp)
  window.addEventListener('pointercancel', onWindowPointerUp)
}

function onWindowPointerMove(e: PointerEvent) {
  if (!activeResizer.value) return

  if (activeResizer.value === 'left') {
    const deltaX = e.clientX - startMouseX
    const maxLeft = Math.max(200, window.innerWidth - 450)
    editor.leftWidth = Math.max(160, Math.min(maxLeft, startDimension + deltaX))
  } else if (activeResizer.value === 'right') {
    const deltaX = startMouseX - e.clientX
    const maxRight = Math.max(200, window.innerWidth - 450)
    editor.rightWidth = Math.max(180, Math.min(maxRight, startDimension + deltaX))
  } else if (activeResizer.value === 'bottom') {
    const deltaY = startMouseY - e.clientY
    const totalH = workspaceRef.value?.clientHeight || (window.innerHeight - 44)
    const minBottom = 64 // 最小高度 64px
    const maxBottom = Math.max(minBottom, totalH - 44) // 最大高度可拖到顶上（保留顶部工具栏 44px）
    editor.bottomHeight = Math.max(minBottom, Math.min(maxBottom, startDimension + deltaY))
  } else if (activeResizer.value === 'drawer') {
    const deltaX = startMouseX - e.clientX
    const maxDrawer = Math.max(320, window.innerWidth - 650)
    editor.presetDrawerWidth = Math.max(280, Math.min(maxDrawer, startDimension + deltaX))
  }
}

function onWindowPointerUp() {
  if (activeResizer.value) {
    activeResizer.value = null
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    window.removeEventListener('pointermove', onWindowPointerMove)
    window.removeEventListener('pointerup', onWindowPointerUp)
    window.removeEventListener('pointercancel', onWindowPointerUp)
  }
}

function handleWindowResize() {
  const totalH = workspaceRef.value?.clientHeight || (window.innerHeight - 44)
  if (editor.bottomHeight > totalH - 44) {
    editor.bottomHeight = Math.max(64, totalH - 44)
  }
  const maxLeft = Math.max(120, window.innerWidth - 300)
  if (editor.leftWidth > maxLeft) {
    editor.leftWidth = maxLeft
  }
  const maxRight = Math.max(140, window.innerWidth - 300)
  if (editor.rightWidth > maxRight) {
    editor.rightWidth = maxRight
  }
}

function preventGlobalContextMenu(e: MouseEvent): boolean {
  const target = e.target as HTMLElement | null
  if (
    target?.closest(
      '[data-custom-context], [data-reka-context-menu-trigger], [data-radix-context-menu-trigger], .layer-row, .timeline-header-row'
    )
  ) {
    return true
  }
  e.preventDefault()
  e.stopPropagation()
  return false
}

function handleAuxClick(e: MouseEvent) {
  if (e.button === 2) {
    preventGlobalContextMenu(e)
  }
}

function onKeydown(event: KeyboardEvent) {
  const isInputFocused =
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLTextAreaElement ||
    (event.target as HTMLElement)?.isContentEditable

  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'z') {
    event.preventDefault()
    if (event.shiftKey) {
      editor.redo()
    } else {
      editor.undo()
    }
  }
  if (event.code === 'Space' && !isInputFocused) {
    event.preventDefault()
    editor.togglePlay()
  }
  if (event.key.toLowerCase() === 'r' && !event.ctrlKey && !event.metaKey && !isInputFocused) {
    event.preventDefault()
    editor.randomizeJizura()
  }

  // 快捷键: Ctrl + = / Ctrl + - 放大缩小时间线
  if ((event.ctrlKey || event.metaKey) && !isInputFocused) {
    if (event.key === '=' || event.key === '+') {
      event.preventDefault()
      editor.zoom = Math.min(250, editor.zoom + 15)
    } else if (event.key === '-') {
      event.preventDefault()
      editor.zoom = Math.max(30, editor.zoom - 15)
    }
  }

  // 快捷键: 左右方向键微调播放进度 (按住 Shift 可按 0.5s 快进)
  if (!isInputFocused && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
    event.preventDefault()
    const step = event.shiftKey ? 0.5 : 0.1
    const nextTime = event.key === 'ArrowLeft'
      ? Math.max(0, editor.currentTime - step)
      : Math.min(editor.duration, editor.currentTime + step)
    editor.setTime(Number(nextTime.toFixed(2)), true)
  }

  // 快捷键: Ctrl+C 复制 / Ctrl+V 粘贴 / Ctrl+D 副本
  if ((event.ctrlKey || event.metaKey) && !isInputFocused) {
    const key = event.key.toLowerCase()
    if (key === 'c') {
      event.preventDefault()
      editor.copySelectedLayers()
    } else if (key === 'v') {
      event.preventDefault()
      editor.pasteLayers()
    } else if (key === 'd') {
      event.preventDefault()
      editor.duplicateSelectedLayers()
    }
  }

  // 快捷键: S 键在播放指针处切割图层
  if (!isInputFocused && !event.ctrlKey && !event.metaKey && event.key.toLowerCase() === 's') {
    event.preventDefault()
    editor.splitLayerAtCurrentTime()
  }
}

let bridgeTimer: number | undefined
let lastBriefId = ''

async function importBriefAssets(brief: Record<string, unknown>) {
  const assets = Array.isArray(brief.assets) ? brief.assets : []
  const rawUrls = [
    ...(typeof brief.audioUrl === 'string' && brief.audioUrl ? [brief.audioUrl] : []),
    ...(Array.isArray(brief.imageUrls) ? brief.imageUrls.filter((url): url is string => typeof url === 'string' && Boolean(url)) : []),
  ]

  // 1. 处理结构化素材对象 (支持传递指定 width, height, x, y, scale 等)
  for (const item of assets) {
    if (!item || typeof item !== 'object') continue
    const url = typeof item.url === 'string' ? item.url : ''
    if (!url) continue
    try {
      const response = await fetch(url)
      if (!response.ok) continue
      const blob = await response.blob()
      const filename = item.name || decodeURIComponent(new URL(url, window.location.href).pathname.split('/').pop() || 'dsh-asset')
      const initialPos = (typeof item.x === 'number' && typeof item.y === 'number') ? { x: item.x, y: item.y } : undefined
      editor.addAssetLayer(new File([blob], filename, { type: blob.type || 'application/octet-stream' }), initialPos)
      
      // 如果指定了宽高，赋值给刚刚添加的选中图层
      if (editor.selectedLayer) {
        if (typeof item.width === 'number') {
          editor.selectedLayer.width = item.width
          editor.selectedLayer.naturalWidth = item.naturalWidth || item.width
        }
        if (typeof item.height === 'number') {
          editor.selectedLayer.height = item.height
          editor.selectedLayer.naturalHeight = item.naturalHeight || item.height
        }
        if (typeof item.scale === 'number') editor.selectedLayer.scale = item.scale
        if (typeof item.opacity === 'number') editor.selectedLayer.opacity = item.opacity
      }
    } catch {
      // Ignore
    }
  }

  // 2. 处理常规 URL 列表
  for (const url of rawUrls) {
    try {
      const response = await fetch(url)
      if (!response.ok) continue
      const blob = await response.blob()
      const filename = decodeURIComponent(new URL(url, window.location.href).pathname.split('/').pop() || 'dsh-asset')
      editor.addAssetLayer(new File([blob], filename, { type: blob.type || 'application/octet-stream' }))
    } catch {
      // Ignore one unavailable asset and continue importing the rest of the brief.
    }
  }
}

async function pollDshBrief() {
  try {
    const response = await fetch('/api/dsh/production-brief', { cache: 'no-store' })
    if (!response.ok) return
    const payload = await response.json() as { brief?: Record<string, unknown> | null }
    const brief = payload.brief
    if (!brief) return
    const briefId = String(brief.id || brief.receivedAt || '')
    if (!briefId || briefId === lastBriefId) return
    lastBriefId = briefId

    const project = brief.project
    if (project && typeof project === 'object') {
      editor.importProjectJSON(JSON.stringify(project))
      await importBriefAssets(brief)
      return
    }

    const lyrics = typeof brief.lyrics === 'string' ? brief.lyrics.trim() : ''
    if (lyrics) {
      editor.importLyricsToTimeline(parseLyricText(lyrics), { clearExisting: true })
    }
    await importBriefAssets(brief)
  } catch {
    // The bridge is optional; the editor remains fully usable without DSH.
  }
}

onMounted(() => {
  pollDshBrief()
  bridgeTimer = window.setInterval(pollDshBrief, 1500)
  window.addEventListener('keydown', onKeydown)
  window.addEventListener('resize', handleWindowResize)
  window.oncontextmenu = preventGlobalContextMenu
  document.oncontextmenu = preventGlobalContextMenu
  window.addEventListener('contextmenu', preventGlobalContextMenu, { capture: true })
  document.addEventListener('contextmenu', preventGlobalContextMenu, { capture: true })
  window.addEventListener('auxclick', handleAuxClick, { capture: true })
})

onBeforeUnmount(() => {
  if (bridgeTimer !== undefined) window.clearInterval(bridgeTimer)
  window.removeEventListener('keydown', onKeydown)
  window.removeEventListener('resize', handleWindowResize)
  window.oncontextmenu = null
  document.oncontextmenu = null
  window.removeEventListener('contextmenu', preventGlobalContextMenu, { capture: true })
  document.removeEventListener('contextmenu', preventGlobalContextMenu, { capture: true })
  window.removeEventListener('auxclick', handleAuxClick, { capture: true })
  onWindowPointerUp()
})
</script>

<template>
  <main class="flex h-screen flex-col bg-[#090b0f] text-slate-200 select-none overflow-hidden relative" @contextmenu.prevent>
    <EditorHeader />

    <section class="flex min-h-0 flex-1 relative">
      <!-- 左侧素材/图层面板 -->
      <AssetPanel v-if="!editor.isLeftPanelCollapsed" />

      <!-- 左侧调整拖拽手柄 -->
      <div
        v-if="!editor.isLeftPanelCollapsed"
        class="resizer-v group relative z-30 w-1.5 cursor-col-resize bg-[#1c2330] hover:bg-violet-500 transition-colors shrink-0"
        title="按住拖拽调整左侧栏宽度"
        @pointerdown="startResize('left', $event)"
      >
        <div class="absolute inset-y-0 -left-1 -right-1" />
      </div>

      <!-- 中间与底部工作区 -->
      <section ref="workspaceRef" class="flex min-w-0 flex-1 min-h-0 flex-col overflow-hidden">
        <!-- 预览画布区 -->
        <CanvasStage />

        <!-- 底部时间线调整拖拽手柄 -->
        <div
          class="resizer-h group relative z-30 h-1.5 cursor-row-resize bg-[#1c2330] hover:bg-violet-500 transition-colors shrink-0"
          title="按住拖拽调整时间线面板高度"
          @pointerdown="startResize('bottom', $event)"
        >
          <div class="absolute inset-x-0 -top-1 -bottom-1" />
        </div>

        <!-- 底部时间线区 -->
        <TimelinePanel />
      </section>

      <!-- 右侧调整拖拽手柄 -->
      <div
        class="resizer-v group relative z-30 w-1.5 cursor-col-resize bg-[#1c2330] hover:bg-violet-500 transition-colors shrink-0"
        title="按住拖拽调整属性栏宽度"
        @pointerdown="startResize('right', $event)"
      >
        <div class="absolute inset-y-0 -left-1 -right-1" />
      </div>

      <!-- 右侧属性检查器面板 -->
      <InspectorPanel />

      <!-- 预设抽屉拖拽调整手柄 -->
      <div
        v-if="editor.activePresetDrawerCategory"
        class="resizer-v group relative z-30 w-1.5 cursor-col-resize bg-[#1c2330] hover:bg-violet-500 transition-colors shrink-0"
        title="按住拖拽调整预设抽屉面板宽度"
        @pointerdown="startResize('drawer', $event)"
      >
        <div class="absolute inset-y-0 -left-1 -right-1" />
      </div>

      <!-- 最右侧展开的当前预设类型视觉预览抽屉面板 (参考 JIZURA) -->
      <PresetDrawerPanel v-if="editor.activePresetDrawerCategory" />
    </section>

    <!-- 视频与工程导出弹窗 -->
    <ExportModal :open="editor.showExportModal" @close="editor.showExportModal = false" />

    <!-- JIZURA 歌词智能生成弹窗 -->
    <LyricImportModal />

    <!-- JIZURA 全量表现与预设库浏览器 -->
    <JizuraPresetExplorerModal />
  </main>
</template>
