<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import {
  AudioLines,
  Copy,
  CopyPlus,
  Edit3,
  Eye,
  EyeOff,
  GripVertical,
  Image as ImageIcon,
  Lock,
  Music2,
  Palette,
  Plus,
  Scissors,
  Square,
  SquareStack,
  Trash2,
  Type,
  Unlock,
  ZoomIn,
  ZoomOut,
} from '@lucide/vue'
import type { Keyframe, Layer } from '../engine/types'
import EditorPanel from './common/EditorPanel.vue'
import ContextMenu, { type ContextMenuItemDef } from './ui/ContextMenu.vue'
import Slider from './ui/Slider.vue'
import { useEditorStore } from '../stores/editor'

const editor = useEditorStore()

const leftHeaderRef = ref<HTMLElement | null>(null)
const rightTrackRef = ref<HTMLElement | null>(null)
const rulerRef = ref<HTMLElement | null>(null)
const showWaveforms = ref(true)

// 图层拖拽排序状态
const draggedLayerIndex = ref<number | null>(null)
const dragOverLayerIndex = ref<number | null>(null)

function onLayerDragStart(event: DragEvent, index: number) {
  draggedLayerIndex.value = index
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', String(index))
  }
}

function onLayerDragOver(event: DragEvent, index: number) {
  if (draggedLayerIndex.value === null) return
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move'
  }
  dragOverLayerIndex.value = index
}

function onLayerDrop(event: DragEvent, toIndex: number) {
  event.preventDefault()
  if (draggedLayerIndex.value !== null && draggedLayerIndex.value !== toIndex) {
    editor.reorderLayers(draggedLayerIndex.value, toIndex)
  }
  draggedLayerIndex.value = null
  dragOverLayerIndex.value = null
}

function onLayerDragEnd() {
  draggedLayerIndex.value = null
  dragOverLayerIndex.value = null
}

// 左右垂直滚动同步标志
let isSyncingLeft = false
let isSyncingRight = false

// 片段拖拽与裁剪相关状态
let draggingType: 'move' | 'trim-left' | 'trim-right' | null = null
let activeLayerId = ''
let dragStartClientX = 0
let initialStart = 0
let initialDuration = 0

// 时间指针 Scrubbing 拖拽相关状态
let isScrubbing = false
let wasPlayingBeforeScrub = false

const timecode = computed(() => {
  const seconds = Math.max(0, editor.currentTime)
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')
  const rest = (seconds % 60).toFixed(2).padStart(5, '0')
  return `${minutes}:${rest}`
})

const trackWidth = computed(() => {
  return Math.max(800, editor.duration * editor.zoom * 1.5)
})

const layerIcon = (layer: Layer) => {
  if (layer.kind === 'text') return Type
  if (layer.kind === 'image') return ImageIcon
  if (layer.kind === 'audio') return Music2
  if (layer.kind === 'shape') return Square
  if (layer.kind === 'background') return Palette
  return SquareStack
}

// 行内重命名状态
const editingLayerId = ref<string | null>(null)
const editingName = ref('')
const renameInputRef = ref<HTMLInputElement | null>(null)

function startRename(layer: Layer) {
  editingLayerId.value = layer.id
  editingName.value = layer.name
  nextTick(() => {
    renameInputRef.value?.focus()
    renameInputRef.value?.select()
  })
}

function commitRename(layer: Layer) {
  if (editingLayerId.value === layer.id) {
    const trimmed = editingName.value.trim()
    if (trimmed) {
      editor.updateLayer(layer.id, { name: trimmed })
    }
    editingLayerId.value = null
  }
}

function cancelRename() {
  editingLayerId.value = null
}

function getContextMenuItems(layer: Layer): ContextMenuItemDef[] {
  return [
    {
      label: '在当前时间点切割',
      icon: Scissors,
      shortcut: 'S',
      onClick: () => editor.splitLayerAtCurrentTime(layer.id),
    },
    {
      separator: true,
      label: '',
    },
    {
      label: '复制图层',
      icon: Copy,
      shortcut: 'Ctrl+C',
      onClick: () => editor.copySelectedLayers(),
    },
    {
      label: '粘贴图层',
      icon: CopyPlus,
      shortcut: 'Ctrl+V',
      onClick: () => editor.pasteLayers(),
    },
    {
      label: '创建图层副本',
      icon: CopyPlus,
      shortcut: 'Ctrl+D',
      onClick: () => editor.duplicateSelectedLayers(),
    },
    {
      separator: true,
      label: '',
    },
    {
      label: '重命名图层',
      icon: Edit3,
      shortcut: '双击',
      onClick: () => startRename(layer),
    },
    {
      label: layer.visible ? '隐藏图层' : '显示图层',
      icon: layer.visible ? EyeOff : Eye,
      onClick: () => editor.toggleVisibility(layer.id),
    },
    {
      label: layer.locked ? '解锁图层' : '锁定图层',
      icon: layer.locked ? Unlock : Lock,
      onClick: () => editor.toggleLock(layer.id),
    },
    {
      separator: true,
      label: '',
    },
    {
      label: '删除此图层',
      icon: Trash2,
      danger: true,
      shortcut: 'Delete',
      onClick: () => editor.deleteLayer(layer.id),
    },
  ]
}

// 左右垂直联动滚动处理
function onLeftScroll(e: Event) {
  if (isSyncingRight) return
  isSyncingLeft = true
  if (rightTrackRef.value) {
    rightTrackRef.value.scrollTop = (e.target as HTMLElement).scrollTop
  }
  requestAnimationFrame(() => {
    isSyncingLeft = false
  })
}

function onRightScroll(e: Event) {
  if (isSyncingLeft) return
  isSyncingRight = true
  if (leftHeaderRef.value) {
    leftHeaderRef.value.scrollTop = (e.target as HTMLElement).scrollTop
  }
  requestAnimationFrame(() => {
    isSyncingRight = false
  })
}

// 左右轨道滚轮事件 (普通滚动控制左右进度，Ctrl + 滚轮控制时间线缩放)
function onTrackWheel(e: WheelEvent) {
  if (!rightTrackRef.value) return

  if (e.ctrlKey || e.metaKey) {
    e.preventDefault()
    const wheelDelta = e.deltaY !== 0 ? e.deltaY : e.deltaX
    if (wheelDelta === 0) return

    const direction = wheelDelta < 0 ? 1 : -1
    const step = direction * Math.max(5, Math.min(25, Math.round(Math.abs(wheelDelta) / 8)))
    const oldZoom = editor.zoom
    const newZoom = Math.max(30, Math.min(250, oldZoom + step))

    if (newZoom === oldZoom) return

    // 锚定鼠标指针在视口中的绝对点进行平滑缩放
    const rect = rightTrackRef.value.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const oldScrollLeft = rightTrackRef.value.scrollLeft
    const oldTrackWidth = trackWidth.value

    editor.zoom = newZoom

    nextTick(() => {
      if (!rightTrackRef.value) return
      const newTrackWidth = trackWidth.value
      const ratio = (oldScrollLeft + mouseX) / oldTrackWidth
      rightTrackRef.value.scrollLeft = Math.max(0, ratio * newTrackWidth - mouseX)
    })
  } else {
    // 鼠标普通滚动：左右滚动进度
    e.preventDefault()
    const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX
    rightTrackRef.value.scrollLeft += delta
  }
}

// 左侧图层头滚轮事件 (Ctrl + 滚轮同样响应缩放)
function onLeftHeaderWheel(e: WheelEvent) {
  if (e.ctrlKey || e.metaKey) {
    e.preventDefault()
    const wheelDelta = e.deltaY !== 0 ? e.deltaY : e.deltaX
    if (wheelDelta === 0) return

    const direction = wheelDelta < 0 ? 1 : -1
    const step = direction * Math.max(5, Math.min(25, Math.round(Math.abs(wheelDelta) / 8)))
    editor.zoom = Math.max(30, Math.min(250, editor.zoom + step))
  }
}

// 时间指针 (Playhead) 高灵敏 Scrubbing 拖拽
function updateTimeFromClientX(clientX: number) {
  if (!rulerRef.value) return
  const bounds = rulerRef.value.getBoundingClientRect()
  const offsetX = clientX - bounds.left
  const ratio = Math.max(0, Math.min(1, offsetX / bounds.width))
  editor.setTime(ratio * editor.duration, true)
}

function onRulerPointerDown(e: PointerEvent) {
  // 只响应左键点击或指针拖拽
  if (e.button !== 0) return
  e.preventDefault()

  isScrubbing = true
  wasPlayingBeforeScrub = editor.isPlaying
  if (editor.isPlaying) {
    editor.isPlaying = false
  }

  updateTimeFromClientX(e.clientX)

  window.addEventListener('pointermove', onScrubPointerMove)
  window.addEventListener('pointerup', onScrubPointerUp)
}

function onScrubPointerMove(e: PointerEvent) {
  if (!isScrubbing) return
  updateTimeFromClientX(e.clientX)
}

function onScrubPointerUp() {
  if (isScrubbing) {
    isScrubbing = false
    if (wasPlayingBeforeScrub) {
      editor.isPlaying = true
    }
  }
  window.removeEventListener('pointermove', onScrubPointerMove)
  window.removeEventListener('pointerup', onScrubPointerUp)
}

// 片段移动与裁剪
function onClipMouseDown(e: MouseEvent, layer: Layer, type: 'move' | 'trim-left' | 'trim-right') {
  if (layer.locked) return
  e.stopPropagation()
  editor.selectLayer(layer.id, e.shiftKey || e.ctrlKey || e.metaKey)

  draggingType = type
  activeLayerId = layer.id
  dragStartClientX = e.clientX
  initialStart = layer.start
  initialDuration = layer.duration

  window.addEventListener('mousemove', onClipMouseMove)
  window.addEventListener('mouseup', onClipMouseUp)
}

function onClipMouseMove(e: MouseEvent) {
  if (!draggingType || !activeLayerId || !rightTrackRef.value) return

  const deltaPx = e.clientX - dragStartClientX
  const pxPerSec = trackWidth.value / editor.duration
  const deltaSec = deltaPx / pxPerSec

  const layer = editor.layers.find((l) => l.id === activeLayerId)
  if (!layer) return

  if (draggingType === 'move') {
    const newStart = Math.max(0, initialStart + deltaSec)
    layer.start = Number(newStart.toFixed(2))
    if (layer.start + layer.duration > editor.duration) {
      editor.duration = Number((layer.start + layer.duration).toFixed(2))
    }
  } else if (draggingType === 'trim-right') {
    const newDur = Math.max(0.3, initialDuration + deltaSec)
    layer.duration = Number(newDur.toFixed(2))
    if (layer.start + layer.duration > editor.duration) {
      editor.duration = Number((layer.start + layer.duration).toFixed(2))
    }
  } else if (draggingType === 'trim-left') {
    const maxShift = initialDuration - 0.3
    const actualDelta = Math.max(-initialStart, Math.min(maxShift, deltaSec))
    layer.start = Number((initialStart + actualDelta).toFixed(2))
    layer.duration = Number((initialDuration - actualDelta).toFixed(2))
  }
}

function onClipMouseUp() {
  draggingType = null
  activeLayerId = ''
  window.removeEventListener('mousemove', onClipMouseMove)
  window.removeEventListener('mouseup', onClipMouseUp)
}

function jumpToKeyframe(layer: Layer, kf: Keyframe) {
  editor.selectLayer(layer.id)
  editor.selectKeyframe(kf.id)
  editor.setTime(layer.start + kf.time, true)
}

function deleteCurrentLayer(id: string) {
  editor.deleteLayer(id)
}

onBeforeUnmount(() => {
  window.removeEventListener('pointermove', onScrubPointerMove)
  window.removeEventListener('pointerup', onScrubPointerUp)
  window.removeEventListener('mousemove', onClipMouseMove)
  window.removeEventListener('mouseup', onClipMouseUp)
})
</script>

<template>
  <EditorPanel
    position="bottom"
    :height="editor.bottomHeight"
    overflow="hidden"
  >
    <template #header>
      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold text-slate-200">时间线编排</span>
        <span class="rounded bg-[#1a212d] px-2 py-0.5 text-[10px] font-mono text-violet-400">
          {{ editor.layers.length }} 图层
        </span>
        <div class="h-4 w-px bg-[#242b35] mx-1" />
        <button class="icon-button" title="新建文字图层" @click="editor.addTextLayer">
          <Plus :size="15" />
        </button>
        <button class="icon-button text-violet-400 hover:text-violet-200" title="在当前时间点切割选中的图层 (S)" @click="editor.splitLayerAtCurrentTime()">
          <Scissors :size="15" />
        </button>
      </div>

      <div class="flex items-center gap-3">
        <button
          :class="[
            'flex items-center gap-1.5 rounded px-2 py-1 text-[11px] transition',
            showWaveforms ? 'bg-violet-950/60 text-violet-300 border border-violet-800/40' : 'text-slate-400 hover:text-slate-200'
          ]"
          @click="showWaveforms = !showWaveforms"
        >
          <AudioLines :size="13" />
          <span>音频波形</span>
        </button>

        <span class="h-4 w-px bg-[#242b35]" />

        <div class="flex items-center gap-1 text-slate-400">
          <button class="icon-button" title="缩小时间线 (Ctrl + - 或 Ctrl + 滚轮向下)" @click="editor.zoom = Math.max(30, editor.zoom - 15)">
            <ZoomOut :size="14" />
          </button>
          <span class="w-10 text-center font-mono text-[10px] text-slate-400" title="按住 Ctrl + 鼠标滚轮可缩放时间线">{{ editor.zoom }}%</span>
          <button class="icon-button" title="放大时间线 (Ctrl + + 或 Ctrl + 滚轮向上)" @click="editor.zoom = Math.min(250, editor.zoom + 15)">
            <ZoomIn :size="14" />
          </button>
        </div>
      </div>
    </template>

    <!-- 轨道主体区域 (包含图层控制列与时间轴轨道) -->
    <div class="flex h-full min-h-0 flex-1 overflow-hidden">
      <!-- 左侧图层头控制列 (绑定垂直同步滚动与 Ctrl+滚轮缩放) -->
      <div
        ref="leftHeaderRef"
        class="w-[230px] h-full shrink-0 border-r border-[#242b35] bg-[#11151d] overflow-y-auto"
        @scroll="onLeftScroll"
        @wheel="onLeftHeaderWheel"
      >
        <!-- 刻度尺固定占位标题栏 -->
        <div class="sticky top-0 z-20 flex h-7 items-center justify-between border-b border-[#242b35] bg-[#141923] px-3 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
          <span>图层轨道</span>
          <span>控制</span>
        </div>

        <div class="space-y-0">
          <ContextMenu
            v-for="(layer, index) in editor.layers"
            :key="layer.id"
            :items="getContextMenuItems(layer)"
          >
            <template #trigger>
              <div
                draggable="true"
                :class="[
                  'timeline-header-row group/row relative flex h-[44px] shrink-0 items-center justify-between px-2.5 border-b border-[#1f2733] transition-all cursor-pointer select-none',
                  editor.selectedLayerIds.includes(layer.id) ? 'bg-[#1e1b30] text-slate-100 border-l-2 border-l-violet-500' : 'text-slate-400 hover:bg-[#151b24]',
                  draggedLayerIndex === index ? 'opacity-35 bg-violet-950/20' : '',
                  dragOverLayerIndex === index && draggedLayerIndex !== index ? 'border-t-2 border-t-violet-400 bg-violet-950/40' : ''
                ]"
                @dragstart="onLayerDragStart($event, index)"
                @dragover="onLayerDragOver($event, index)"
                @drop="onLayerDrop($event, index)"
                @dragend="onLayerDragEnd"
                @click="editor.selectLayer(layer.id, $event.shiftKey || $event.ctrlKey || $event.metaKey)"
              >
                <div class="flex items-center gap-1.5 min-w-0 flex-1">
                  <!-- 拖拽排序列指示手柄 -->
                  <div
                    class="cursor-grab active:cursor-grabbing text-slate-600 group-hover/row:text-slate-400 p-0.5 -ml-1"
                    title="按住拖动调整图层上下顺序"
                    @click.stop
                  >
                    <GripVertical :size="13" />
                  </div>

                  <component :is="layerIcon(layer)" :size="14" :style="{ color: layer.color }" class="shrink-0" />

                  <!-- 行内重命名编辑框 -->
                  <input
                    v-if="editingLayerId === layer.id"
                    ref="renameInputRef"
                    v-model="editingName"
                    class="h-6 min-w-0 flex-1 rounded border border-violet-500 bg-[#090d14] px-1.5 text-xs text-white outline-none mr-2"
                    @blur="commitRename(layer)"
                    @keydown.enter="commitRename(layer)"
                    @keydown.escape="cancelRename"
                    @click.stop
                  />
                  <span
                    v-else
                    class="truncate text-xs font-medium"
                    title="双击或右键可重命名"
                    @dblclick.stop="startRename(layer)"
                  >
                    {{ layer.name }}
                  </span>
                </div>

                <div class="flex items-center gap-1.5 shrink-0" @click.stop>
                  <button
                    class="icon-action text-slate-500 hover:text-slate-200"
                    :title="layer.visible ? '隐藏' : '显示'"
                    @click="editor.toggleVisibility(layer.id)"
                  >
                    <Eye v-if="layer.visible" :size="12" />
                    <EyeOff v-else :size="12" class="text-slate-600" />
                  </button>
                  <button
                    class="icon-action text-slate-500 hover:text-slate-200"
                    :title="layer.locked ? '解锁' : '锁定'"
                    @click="editor.toggleLock(layer.id)"
                  >
                    <Lock v-if="layer.locked" :size="12" class="text-amber-500" />
                    <Unlock v-else :size="12" />
                  </button>
                  <button
                    v-if="editor.layers.length > 1"
                    class="icon-action text-slate-600 hover:text-red-400"
                    title="删除图层"
                    @click="deleteCurrentLayer(layer.id)"
                  >
                    <Trash2 :size="12" />
                  </button>
                </div>
              </div>
            </template>
          </ContextMenu>
        </div>
      </div>

      <!-- 右侧时间刻度与轨道片段 (滚轮控制进度/Ctrl+滚轮控制缩放) -->
      <div
        ref="rightTrackRef"
        class="relative h-full min-w-0 flex-1 overflow-auto bg-[#0d1017]"
        @scroll="onRightScroll"
        @wheel.prevent="onTrackWheel"
      >
        <div :style="{ width: `${trackWidth}px` }" class="relative">
          <!-- 顶部刻度标尺 (支持高灵敏度 Pointer Scrubbing 拖拽) -->
          <div
            ref="rulerRef"
            class="sticky top-0 z-30 flex h-7 border-b border-[#242b35] bg-[#121721] cursor-ew-resize select-none"
            @pointerdown="onRulerPointerDown"
          >
            <div
              v-for="sec in Math.ceil(editor.duration) + 1"
              :key="sec"
              class="absolute top-0 h-full border-l border-[#242b35] flex items-center pointer-events-none"
              :style="{ left: `${((sec - 1) / editor.duration) * 100}%` }"
            >
              <span class="ml-1.5 font-mono text-[9px] text-slate-500">
                {{ (sec - 1).toFixed(1) }}s
              </span>
            </div>
          </div>

          <!-- 各图层片段轨道 -->
          <div class="relative">
            <div
              v-for="layer in editor.layers"
              :key="layer.id"
              :class="[
                'timeline-track-lane relative h-[44px] border-b border-[#1b222d]',
                editor.selectedLayerIds.includes(layer.id) ? 'bg-[#181d28]/70' : 'bg-transparent'
              ]"
            >
              <!-- 时间片段主体 -->
              <div
                :class="[
                  'timeline-clip group absolute top-2 h-7 rounded-md border flex items-center select-none shadow-sm transition-shadow',
                  editor.selectedLayerIds.includes(layer.id) ? 'ring-1 ring-violet-500/80 shadow-md' : 'opacity-90',
                  layer.locked ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
                ]"
                :style="{
                  left: `${(layer.start / editor.duration) * 100}%`,
                  width: `${(layer.duration / editor.duration) * 100}%`,
                  background: `linear-gradient(90deg, ${layer.color}25, ${layer.color}45)`,
                  borderColor: `${layer.color}90`,
                }"
                @mousedown="onClipMouseDown($event, layer, 'move')"
              >
                <!-- 左手柄 (Trim In) -->
                <div
                  v-if="!layer.locked"
                  class="absolute -left-1 top-0 bottom-0 w-2.5 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-white/40 rounded-l"
                  title="调整开始时间"
                  @mousedown.stop="onClipMouseDown($event, layer, 'trim-left')"
                />

                <!-- 音频波形预览 -->
                <div
                  v-if="layer.kind === 'audio' && showWaveforms && layer.waveform"
                  class="absolute inset-x-2 inset-y-1 flex items-center gap-[1px] opacity-75 overflow-hidden pointer-events-none"
                >
                  <div
                    v-for="(val, i) in layer.waveform"
                    :key="i"
                    class="w-[2px] rounded-full bg-emerald-400"
                    :style="{ height: `${Math.max(15, val * 100)}%` }"
                  />
                </div>

                <!-- 片段名称 -->
                <span
                  class="relative z-10 px-2 truncate text-[11px] font-semibold tracking-wide drop-shadow pointer-events-none"
                  :style="{ color: layer.color }"
                >
                  {{ layer.name }}
                </span>

                <!-- 关键帧点标记 -->
                <div
                  v-for="kf in layer.keyframes"
                  :key="kf.id"
                  :class="[
                    'keyframe-diamond group/kf absolute top-1/2 -translate-y-1/2 -translate-x-1/2 rotate-45 rounded-[1px] shadow cursor-pointer z-20 transition-all',
                    editor.selectedKeyframeId === kf.id
                      ? 'w-3 h-3 border-2 border-white bg-amber-400 ring-2 ring-violet-500 shadow-[0_0_10px_#8b5cf6]'
                      : 'w-2.5 h-2.5 border border-white hover:scale-125'
                  ]"
                  :style="{
                    left: `${(kf.time / layer.duration) * 100}%`,
                    backgroundColor: editor.selectedKeyframeId === kf.id ? '#fbbf24' : layer.color,
                  }"
                  :title="`关键帧: ${kf.property} = ${kf.value} (${kf.time}s, 缓动: ${kf.easing || 'easeInOut'})`"
                  @mousedown.stop
                  @click.stop="jumpToKeyframe(layer, kf)"
                />

                <!-- 右手柄 (Trim Out) -->
                <div
                  v-if="!layer.locked"
                  class="absolute -right-1 top-0 bottom-0 w-2.5 cursor-ew-resize opacity-0 group-hover:opacity-100 hover:bg-white/40 rounded-r"
                  title="调整持续时长"
                  @mousedown.stop="onClipMouseDown($event, layer, 'trim-right')"
                />
              </div>
            </div>

            <!-- 垂直播放头指示针与高灵敏拖拽手柄 -->
            <div
              class="playhead-line absolute top-0 bottom-0 z-40 w-px bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.8)] pointer-events-none"
              :style="{ left: `${editor.progress}%` }"
            >
              <!-- 顶部高响应拖拽手柄 (带可点击热区) -->
              <div
                class="playhead-handle pointer-events-auto absolute -left-2 -top-3.5 h-4 w-4 cursor-ew-resize flex items-center justify-center group"
                title="按住拖动播放指针"
                @pointerdown.stop="onRulerPointerDown"
              >
                <div class="h-3 w-3 rotate-45 rounded-[2px] bg-violet-400 shadow-lg group-hover:scale-125 group-hover:bg-violet-300 transition-transform" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部状态指示与微调滑块 -->
    <template #footer>
      <div class="flex h-8 items-center justify-between px-4 text-[11px] text-slate-500">
        <div class="flex items-center gap-3">
          <span class="font-mono text-slate-200 font-semibold">{{ timecode }}</span>
          <div class="w-48">
            <Slider
              :model-value="editor.currentTime"
              :min="0"
              :max="editor.duration"
              :step="0.01"
              @update:model-value="editor.setTime($event, true)"
            />
          </div>
          <span class="font-mono text-[10px]">/ {{ editor.duration.toFixed(1) }}s</span>
        </div>

        <div class="flex items-center gap-2 text-[10px] text-slate-500">
          <span class="text-violet-400 font-medium">滚轮：左右进度 · Ctrl+滚轮：缩放 · S 键：切割图层 · Ctrl+C/V/D：复制粘贴</span>
          <span>·</span>
          <span>按住标尺极速划过 (Scrubbing)</span>
        </div>
      </div>
    </template>
  </EditorPanel>
</template>

<style scoped>
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 5px;
  color: #8b95a5;
  transition: all 0.15s ease;
}
.icon-button:hover {
  background: #1d232e;
  color: #f1f5f9;
}
.icon-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
  border-radius: 4px;
  transition: all 0.15s ease;
}
.icon-action:hover {
  background: #252d3a;
}
.keyframe-diamond:hover {
  box-shadow: 0 0 8px #ffffff;
}
</style>
