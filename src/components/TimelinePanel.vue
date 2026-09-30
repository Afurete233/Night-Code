<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import {
  AudioLines,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Lock,
  Music2,
  Plus,
  SquareStack,
  Trash2,
  Type,
  Unlock,
  ZoomIn,
  ZoomOut,
} from '@lucide/vue'
import type { Keyframe, Layer } from '../engine/types'
import { useEditorStore } from '../stores/editor'

const editor = useEditorStore()

const leftHeaderRef = ref<HTMLElement | null>(null)
const rightTrackRef = ref<HTMLElement | null>(null)
const rulerRef = ref<HTMLElement | null>(null)
const showWaveforms = ref(true)

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
  return SquareStack
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

// 时间指针 (Playhead) 高灵敏 Scrubbing 拖拽
function updateTimeFromClientX(clientX: number) {
  if (!rulerRef.value) return
  const bounds = rulerRef.value.getBoundingClientRect()
  const offsetX = clientX - bounds.left
  const ratio = Math.max(0, Math.min(1, offsetX / bounds.width))
  editor.setTime(ratio * editor.duration)
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
  editor.selectLayer(layer.id)

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
    const newStart = Math.max(0, Math.min(editor.duration - layer.duration, initialStart + deltaSec))
    layer.start = Number(newStart.toFixed(2))
  } else if (draggingType === 'trim-right') {
    const newDur = Math.max(0.3, Math.min(editor.duration - layer.start, initialDuration + deltaSec))
    layer.duration = Number(newDur.toFixed(2))
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
  editor.setTime(layer.start + kf.time)
}

function setTimeFromSlider(event: Event) {
  const value = Number((event.target as HTMLInputElement).value)
  editor.setTime(value)
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
  <div class="flex shrink-0 flex-col border-t border-[#242b35] bg-[#0f131a] select-none" :style="{ height: `${editor.bottomHeight}px` }">
    <!-- 时间线顶部工具栏 -->
    <div class="flex h-11 shrink-0 items-center justify-between border-b border-[#242b35] px-3 bg-[#111620]">
      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold text-slate-200">时间线编排</span>
        <span class="rounded bg-[#1a212d] px-2 py-0.5 text-[10px] font-mono text-violet-400">
          {{ editor.layers.length }} 图层
        </span>
        <div class="h-4 w-px bg-[#242b35] mx-1" />
        <button class="icon-button" title="新建文字图层" @click="editor.addTextLayer">
          <Plus :size="15" />
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
          <button class="icon-button" title="缩小时间线" @click="editor.zoom = Math.max(40, editor.zoom - 15)">
            <ZoomOut :size="14" />
          </button>
          <span class="w-10 text-center font-mono text-[10px] text-slate-400">{{ editor.zoom }}%</span>
          <button class="icon-button" title="放大时间线" @click="editor.zoom = Math.min(180, editor.zoom + 15)">
            <ZoomIn :size="14" />
          </button>
        </div>
      </div>
    </div>

    <!-- 轨道主体区域 (包含图层控制列与时间轴轨道) -->
    <div class="flex min-h-0 flex-1 overflow-hidden">
      <!-- 左侧图层头控制列 (绑定垂直同步滚动) -->
      <div
        ref="leftHeaderRef"
        class="w-[230px] shrink-0 border-r border-[#242b35] bg-[#11151d] overflow-y-auto"
        @scroll="onLeftScroll"
      >
        <!-- 刻度尺固定占位标题栏 -->
        <div class="sticky top-0 z-20 flex h-7 items-center justify-between border-b border-[#242b35] bg-[#141923] px-3 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
          <span>图层轨道</span>
          <span>控制</span>
        </div>

        <div
          v-for="layer in editor.layers"
          :key="layer.id"
          :class="[
            'timeline-header-row flex h-[44px] items-center justify-between px-3 border-b border-[#1f2733] transition cursor-pointer',
            editor.selectedLayerId === layer.id ? 'bg-[#1e1b30] text-slate-100 border-l-2 border-l-violet-500' : 'text-slate-400 hover:bg-[#151b24]'
          ]"
          @click="editor.selectLayer(layer.id)"
        >
          <div class="flex items-center gap-2 min-w-0">
            <component :is="layerIcon(layer)" :size="14" :style="{ color: layer.color }" class="shrink-0" />
            <span class="truncate text-xs font-medium">{{ layer.name }}</span>
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
      </div>

      <!-- 右侧时间刻度与轨道片段 (同时开启横向与纵向滚动，绑定垂直同步) -->
      <div
        ref="rightTrackRef"
        class="relative min-w-0 flex-1 overflow-auto bg-[#0d1017]"
        @scroll="onRightScroll"
      >
        <div :style="{ width: `${trackWidth}px` }" class="relative h-fit min-h-full">
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
                editor.selectedLayerId === layer.id ? 'bg-[#181d28]/70' : 'bg-transparent'
              ]"
            >
              <!-- 时间片段主体 -->
              <div
                :class="[
                  'timeline-clip group absolute top-2 h-7 rounded-md border flex items-center select-none shadow-sm transition-shadow',
                  editor.selectedLayerId === layer.id ? 'ring-1 ring-violet-500/80 shadow-md' : 'opacity-90',
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
                  class="keyframe-diamond group/kf absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 rounded-[1px] shadow border border-white cursor-pointer z-20 hover:scale-125 transition-transform"
                  :style="{
                    left: `${(kf.time / layer.duration) * 100}%`,
                    backgroundColor: layer.color,
                  }"
                  :title="`关键帧: ${kf.property} = ${kf.value} (${kf.time}s)`"
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
    <div class="flex h-8 shrink-0 items-center justify-between border-t border-[#242b35] bg-[#0c1016] px-4 text-[11px] text-slate-500">
      <div class="flex items-center gap-3">
        <span class="font-mono text-slate-200 font-semibold">{{ timecode }}</span>
        <input
          aria-label="时间线滑块"
          type="range"
          min="0"
          :max="editor.duration"
          step="0.01"
          :value="editor.currentTime"
          class="h-1 w-44 accent-violet-500 cursor-pointer"
          @input="setTimeFromSlider"
        />
        <span>总时长: {{ editor.duration.toFixed(1) }}s</span>
      </div>

      <div class="flex items-center gap-2 text-[10px] text-slate-500">
        <span class="text-violet-400 font-medium">按住标尺或指针可极速划过拖拽 (Scrubbing)</span>
        <span>·</span>
        <span>图层轨道上下同步联动</span>
      </div>
    </div>
  </div>
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
