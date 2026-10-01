<script setup lang="ts">
import { computed, ref } from 'vue'
import { RotateCcw, SlidersHorizontal, Sparkles } from '@lucide/vue'
import EditorPanel from './common/EditorPanel.vue'

// 通用模块
import OverviewSection from './inspector/common/OverviewSection.vue'
import TransformSection from './inspector/common/TransformSection.vue'
import BackgroundSection from './inspector/canvas/BackgroundSection.vue'
import StandardAnimationSection from './inspector/common/StandardAnimationSection.vue'

// 文字模块
import TextContentSection from './inspector/text/TextContentSection.vue'
import TextAnimationSection from './inspector/text/TextAnimationSection.vue'

// 图片模块
import ImageSection from './inspector/image/ImageSection.vue'

// 色块模块
import ShapeSection from './inspector/shape/ShapeSection.vue'

// 音频模块
import AudioSection from './inspector/audio/AudioSection.vue'

import { useEditorStore } from '../stores/editor'
import type { Layer } from '../engine/types'

const editor = useEditorStore()
const layer = computed(() => editor.selectedLayer)

interface CardDef {
  id: string
  name: string
  component: any
  applicable: (layer: Layer) => boolean
}

const allCards: CardDef[] = [
  {
    id: 'overview',
    name: '图层概览',
    component: OverviewSection,
    applicable: () => true,
  },
  {
    id: 'background',
    name: '画布背景独立设置',
    component: BackgroundSection,
    applicable: () => true,
  },
  {
    id: 'text-content',
    name: '文本排版',
    component: TextContentSection,
    applicable: (l) => l.kind === 'text',
  },
  {
    id: 'text-anim',
    name: 'JIZURA MG 动画预设',
    component: TextAnimationSection,
    applicable: (l) => l.kind === 'text' && l.useJizura !== false,
  },
  {
    id: 'standard-anim',
    name: 'MG 动效预设 (素材/色块)',
    component: StandardAnimationSection,
    applicable: (l) => l.kind === 'image' || l.kind === 'shape' || (l.kind === 'text' && l.useJizura === false),
  },
  {
    id: 'image-asset',
    name: '图片素材',
    component: ImageSection,
    applicable: (l) => l.kind === 'image',
  },
  {
    id: 'shape-props',
    name: '色块属性',
    component: ShapeSection,
    applicable: (l) => l.kind === 'shape',
  },
  {
    id: 'audio-track',
    name: '音频设置',
    component: AudioSection,
    applicable: (l) => l.kind === 'audio',
  },
  {
    id: 'transform',
    name: '空间变换 & 关键帧',
    component: TransformSection,
    applicable: (l) => l.kind !== 'audio',
  },
]

// 响应式卡片顺序
const cardOrder = ref<string[]>([
  'overview',
  'background',
  'text-content',
  'text-anim',
  'standard-anim',
  'image-asset',
  'shape-props',
  'audio-track',
  'transform',
])

// 依据 cardOrder 过滤出当前图层适用的已排序卡片列表
const activeOrderedCards = computed(() => {
  if (!layer.value) return []
  const orderMap = new Map(cardOrder.value.map((id, index) => [id, index]))
  return allCards
    .filter((card) => layer.value && card.applicable(layer.value))
    .sort((a, b) => {
      const idxA = orderMap.has(a.id) ? orderMap.get(a.id)! : 999
      const idxB = orderMap.has(b.id) ? orderMap.get(b.id)! : 999
      return idxA - idxB
    })
})

const draggedCardId = ref<string | null>(null)
const dragOverCardId = ref<string | null>(null)

function onCardDragStart(event: DragEvent, id: string) {
  draggedCardId.value = id
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', id)
  }
}

function onCardDragOver(event: DragEvent, id: string) {
  if (!draggedCardId.value || draggedCardId.value === id) return
  event.preventDefault()
  if (event.dataTransfer) event.dataTransfer.dropEffect = 'move'
  dragOverCardId.value = id
}

function onCardDrop(event: DragEvent, toId: string) {
  event.preventDefault()
  if (draggedCardId.value && draggedCardId.value !== toId) {
    const fromIdx = cardOrder.value.indexOf(draggedCardId.value)
    const toIdx = cardOrder.value.indexOf(toId)
    if (fromIdx !== -1 && toIdx !== -1) {
      const moved = cardOrder.value.splice(fromIdx, 1)[0]
      cardOrder.value.splice(toIdx, 0, moved)
    }
  }
  draggedCardId.value = null
  dragOverCardId.value = null
}

function onCardDragEnd() {
  draggedCardId.value = null
  dragOverCardId.value = null
}

function resetCardOrder() {
  cardOrder.value = [
    'overview',
    'background',
    'text-content',
    'text-anim',
    'standard-anim',
    'image-asset',
    'shape-props',
    'audio-track',
    'transform',
  ]
}
</script>

<template>
  <EditorPanel
    title="属性检查器"
    :icon="Sparkles"
    position="right"
    :width="editor.rightWidth"
    overflow="auto"
  >
    <template #actions>
      <button
        class="icon-button"
        title="重置卡片默认顺序"
        @click="resetCardOrder"
      >
        <RotateCcw :size="13" />
      </button>
    </template>

    <!-- 动态渲染支持拖拽排序的属性卡片列表 -->
    <div v-if="layer" class="space-y-3 p-3">
      <component
        :is="card.component"
        v-for="card in activeOrderedCards"
        :key="card.id"
        :layer="layer"
        :draggable="true"
        :is-dragging="draggedCardId === card.id"
        :is-drag-over="dragOverCardId === card.id"
        @dragstart="onCardDragStart($event, card.id)"
        @dragover="onCardDragOver($event, card.id)"
        @drop="onCardDrop($event, card.id)"
        @dragend="onCardDragEnd"
      />
    </div>

    <!-- 无图层选中提示 -->
    <div v-else class="flex h-full flex-col items-center justify-center p-6 text-center text-slate-500">
      <SlidersHorizontal :size="32" class="mb-3 text-slate-600" />
      <p class="text-xs font-medium">未选中任何图层</p>
      <p class="mt-1 text-[11px] text-slate-600">在画布或时间线选择图层以编辑属性</p>
    </div>
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
  color: #7f8a9a;
  transition: all 0.15s ease;
}
.icon-button:hover {
  background: #1e2430;
  color: #eef2f6;
}
</style>
