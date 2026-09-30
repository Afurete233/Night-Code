<script setup lang="ts">
import { Application, Container, Graphics, Sprite, Text as PixiText, TextStyle } from 'pixi.js'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  ChevronRight,
  Focus,
  MousePointer2,
  Pause,
  Play,
  RotateCcw,
} from '@lucide/vue'
import { computeLayerTransform } from '../engine/animation'
import { useEditorStore } from '../stores/editor'

const editor = useEditorStore()
const canvasHost = ref<HTMLElement | null>(null)
const appReady = ref(false)

let pixiApp: Application | null = null
let viewport: Container | null = null
let artboardLayer: Graphics | null = null
let contentLayer: Container | null = null
let gizmoLayer: Graphics | null = null

let raf = 0
let lastTime = 0

// 画布尺寸常量
const STAGE_WIDTH = 1920
const STAGE_HEIGHT = 1080

// 拖拽相关状态
let isDragging = false
let activeDragLayerId = ''
let dragStartStageX = 0
let dragStartStageY = 0
let initialLayerX = 0
let initialLayerY = 0

const timecode = computed(() => {
  const seconds = Math.max(0, editor.currentTime)
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0')
  const rest = (seconds % 60).toFixed(2).padStart(5, '0')
  return `${minutes}:${rest}`
})

function updateViewportTransform() {
  if (!pixiApp || !viewport || !canvasHost.value) return
  const hostWidth = canvasHost.value.clientWidth
  const hostHeight = canvasHost.value.clientHeight
  if (hostWidth === 0 || hostHeight === 0) return

  const padding = 40
  const scale = Math.min((hostWidth - padding) / STAGE_WIDTH, (hostHeight - padding) / STAGE_HEIGHT)
  viewport.scale.set(scale)
  viewport.position.set(
    (hostWidth - STAGE_WIDTH * scale) / 2,
    (hostHeight - STAGE_HEIGHT * scale) / 2
  )
}

function stagePointFromClient(clientX: number, clientY: number) {
  if (!viewport || !canvasHost.value) return { x: 960, y: 540 }
  const bounds = canvasHost.value.getBoundingClientRect()
  const canvasX = clientX - bounds.left
  const canvasY = clientY - bounds.top
  return {
    x: Math.round((canvasX - viewport.position.x) / viewport.scale.x),
    y: Math.round((canvasY - viewport.position.y) / viewport.scale.y),
  }
}

function getLayerBoundsInStage(layerId: string) {
  const layer = editor.layers.find((l) => l.id === layerId)
  if (!layer) return null
  const tr = computeLayerTransform(layer, editor.currentTime)
  if (!tr.visible) return null

  let w = 400
  let h = 200

  if (layer.kind === 'text') {
    const textLen = (tr.displayedText || ' ').length
    const fontSize = layer.fontSize || 48
    w = Math.max(120, textLen * fontSize * 0.6 * (tr.scale / 100))
    h = Math.max(60, fontSize * 1.3 * (tr.scale / 100))
  } else if (layer.kind === 'image') {
    w = 600 * (tr.scale / 100)
    h = 360 * (tr.scale / 100)
  }

  const pad = 24
  return {
    minX: tr.x - w / 2 - pad,
    maxX: tr.x + w / 2 + pad,
    minY: tr.y - h / 2 - pad,
    maxY: tr.y + h / 2 + pad,
    centerX: tr.x,
    centerY: tr.y,
    width: w,
    height: h,
    tr,
  }
}

function findHitLayer(stageX: number, stageY: number) {
  // 优先检查当前选中的图层
  if (editor.selectedLayerId) {
    const selectedBounds = getLayerBoundsInStage(editor.selectedLayerId)
    if (
      selectedBounds &&
      stageX >= selectedBounds.minX &&
      stageX <= selectedBounds.maxX &&
      stageY >= selectedBounds.minY &&
      stageY <= selectedBounds.maxY
    ) {
      const selectedLayer = editor.layers.find((l) => l.id === editor.selectedLayerId)
      if (selectedLayer) return selectedLayer
    }
  }

  // 从顶到底检查处于当前时间的所有活动图层
  for (const layer of editor.layers) {
    if (layer.kind === 'audio') continue
    const bounds = getLayerBoundsInStage(layer.id)
    if (
      bounds &&
      stageX >= bounds.minX &&
      stageX <= bounds.maxX &&
      stageY >= bounds.minY &&
      stageY <= bounds.maxY
    ) {
      return layer
    }
  }
  return null
}

function onCanvasPointerDown(e: PointerEvent) {
  // 如果点击的是悬浮播放控制面板，不触发画布拖拽
  if ((e.target as HTMLElement)?.closest('.floating-controls')) return

  const pt = stagePointFromClient(e.clientX, e.clientY)
  const hitLayer = findHitLayer(pt.x, pt.y)

  if (hitLayer) {
    editor.selectLayer(hitLayer.id)
    if (!hitLayer.locked) {
      isDragging = true
      activeDragLayerId = hitLayer.id
      dragStartStageX = pt.x
      dragStartStageY = pt.y
      const tr = computeLayerTransform(hitLayer, editor.currentTime)
      initialLayerX = tr.x
      initialLayerY = tr.y
      editor.beginInteraction()
    }
  }
}

function onCanvasPointerMove(e: PointerEvent) {
  if (!isDragging || !viewport || !activeDragLayerId) return
  const currentPt = stagePointFromClient(e.clientX, e.clientY)
  const dx = currentPt.x - dragStartStageX
  const dy = currentPt.y - dragStartStageY

  editor.dragUpdatePosition(
    activeDragLayerId,
    Math.round(initialLayerX + dx),
    Math.round(initialLayerY + dy)
  )
}

function onCanvasPointerUp() {
  if (isDragging) {
    editor.endInteraction()
  }
  isDragging = false
}

function onCanvasDragOver(event: DragEvent) {
  if (event.dataTransfer?.types.includes('Files')) {
    event.preventDefault()
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy'
  }
}

function onCanvasDrop(event: DragEvent) {
  event.preventDefault()
  const files = Array.from(event.dataTransfer?.files ?? [])
  const point = stagePointFromClient(event.clientX, event.clientY)
  files.forEach((file, index) => {
    if (file.type.startsWith('image/') || file.type.startsWith('audio/')) {
      editor.addAssetLayer(file, { x: point.x + index * 24, y: point.y + index * 24 })
    }
  })
}

function renderScene() {
  if (!contentLayer || !gizmoLayer) return

  contentLayer.removeChildren()
  gizmoLayer.clear()

  const activeLayers = [...editor.layers].reverse()

  for (const layer of activeLayers) {
    if (layer.kind === 'audio') continue

    const computedTransform = computeLayerTransform(layer, editor.currentTime)
    if (!computedTransform.visible) continue

    const nodeContainer = new Container()
    nodeContainer.position.set(computedTransform.x, computedTransform.y)
    nodeContainer.scale.set(computedTransform.scale / 100)
    nodeContainer.alpha = computedTransform.opacity / 100
    nodeContainer.angle = computedTransform.rotation

    if (layer.kind === 'text') {
      const textStyle = new TextStyle({
        fill: layer.fontColor || '#ffffff',
        fontSize: layer.fontSize || 48,
        fontWeight: '700',
        fontFamily: 'Inter, system-ui, sans-serif',
        align: 'center',
        dropShadow: {
          alpha: 0.4,
          blur: 12,
          color: '#000000',
          distance: 4,
        },
      })

      const textNode = new PixiText({
        text: computedTransform.displayedText || ' ',
        style: textStyle,
      })
      textNode.anchor.set(0.5)
      nodeContainer.addChild(textNode)
    } else if (layer.kind === 'image') {
      if (layer.assetUrl) {
        const sprite = Sprite.from(layer.assetUrl)
        sprite.anchor.set(0.5)
        const maxWidth = 900
        const maxHeight = 620
        const textureWidth = sprite.texture.width || maxWidth
        const textureHeight = sprite.texture.height || maxHeight
        const fitScale = Math.min(maxWidth / textureWidth, maxHeight / textureHeight, 1)
        sprite.scale.set(fitScale)
        nodeContainer.addChild(sprite)
      } else {
        const card = new Graphics()
          .roundRect(-300, -180, 600, 360, 24)
          .fill({ color: '#131924', alpha: 0.85 })
          .stroke({ color: '#384355', width: 2 })
        nodeContainer.addChild(card)

        const innerGlow = new Graphics()
          .circle(0, 0, 100)
          .fill({ color: '#7c3aed', alpha: 0.15 })
        nodeContainer.addChild(innerGlow)

        const label = new PixiText({
          text: layer.name,
          style: new TextStyle({
            fill: '#94a3b8',
            fontSize: 24,
            fontWeight: '600',
          }),
        })
        label.anchor.set(0.5)
        nodeContainer.addChild(label)
      }
    }

    contentLayer.addChild(nodeContainer)

    // 画亮紫/蓝色 Gizmo 选框
    if (editor.selectedLayerId === layer.id) {
      const bounds = getLayerBoundsInStage(layer.id)
      if (bounds) {
        const left = bounds.minX + 8
        const top = bounds.minY + 8
        const width = bounds.maxX - bounds.minX - 16
        const height = bounds.maxY - bounds.minY - 16

        gizmoLayer
          .rect(left, top, width, height)
          .stroke({ color: '#8b5cf6', width: 2, alpha: 0.9 })

        const corners = [
          [left, top],
          [left + width, top],
          [left + width, top + height],
          [left, top + height],
        ]
        for (const [cx, cy] of corners) {
          gizmoLayer.rect(cx - 5, cy - 5, 10, 10).fill('#ffffff').stroke({ color: '#8b5cf6', width: 2 })
        }
      }
    }
  }
}

function animate(now: number) {
  if (editor.isPlaying) {
    if (lastTime > 0) {
      const deltaSec = (now - lastTime) / 1000
      editor.setTime(editor.currentTime + deltaSec)
      if (editor.currentTime >= editor.duration) {
        editor.setTime(0)
      }
    }
  }
  lastTime = now
  renderScene()
  raf = requestAnimationFrame(animate)
}

async function initPixi() {
  if (!canvasHost.value || pixiApp) return

  pixiApp = new Application()
  await pixiApp.init({
    resizeTo: canvasHost.value,
    antialias: true,
    background: '#090b0f',
  })
  canvasHost.value.appendChild(pixiApp.canvas)

  viewport = new Container()
  pixiApp.stage.addChild(viewport)

  artboardLayer = new Graphics()
    .roundRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT, 16)
    .fill('#11151c')
    .stroke({ color: '#242b35', width: 2 })
  viewport.addChild(artboardLayer)

  contentLayer = new Container()
  viewport.addChild(contentLayer)

  gizmoLayer = new Graphics()
  viewport.addChild(gizmoLayer)

  updateViewportTransform()
  window.addEventListener('resize', updateViewportTransform)
  window.addEventListener('pointermove', onCanvasPointerMove)
  window.addEventListener('pointerup', onCanvasPointerUp)

  appReady.value = true
  renderScene()
  raf = requestAnimationFrame(animate)
}

watch(
  () => [
    editor.currentTime,
    editor.selectedLayerId,
    editor.layers
      .map(
        (l) =>
          `${l.id}:${l.x}:${l.y}:${l.scale}:${l.opacity}:${l.rotation}:${l.visible}:${l.text}:${l.assetUrl || ''}:${l.keyframes.length}`
      )
      .join(';'),
  ],
  renderScene
)

onMounted(() => {
  void initPixi()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  window.removeEventListener('resize', updateViewportTransform)
  window.removeEventListener('pointermove', onCanvasPointerMove)
  window.removeEventListener('pointerup', onCanvasPointerUp)
  pixiApp?.destroy(true, { children: true })
  pixiApp = null
})
</script>

<template>
  <section class="flex min-w-0 flex-1 flex-col bg-[#0b0e14]">
    <!-- 画布顶部信息栏 -->
    <div class="flex h-11 shrink-0 items-center justify-between border-b border-[#242b35] px-4">
      <div class="flex items-center gap-2">
        <button class="toolbar-button toolbar-button-active" title="选择并移动">
          <MousePointer2 :size="14" />
          <span>选择</span>
        </button>
        <button class="toolbar-button" title="重置画布视图" @click="updateViewportTransform">
          <Focus :size="14" />
          <span>适应视图</span>
        </button>
      </div>

      <div class="flex items-center gap-3 text-[11px] text-slate-500">
        <span class="font-mono text-slate-400">1920 × 1080</span>
        <span class="h-3 w-px bg-[#242b35]" />
        <span>60 FPS (WebGL)</span>
        <span class="h-3 w-px bg-[#242b35]" />
        <span class="flex items-center gap-1.5 text-emerald-400">
          <span class="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          画布交互激活
        </span>
      </div>
    </div>

    <!-- Pixi 真实画布挂载点 -->
    <div
      ref="canvasHost"
      class="canvas-grid relative min-h-0 flex-1 overflow-hidden select-none cursor-crosshair"
      @pointerdown="onCanvasPointerDown"
      @dragover="onCanvasDragOver"
      @drop="onCanvasDrop"
    >
      <div
        v-if="!appReady"
        class="absolute inset-0 flex items-center justify-center text-xs text-slate-500"
      >
        正在初始化 WebGL 动画画布...
      </div>

      <!-- 悬浮播放控制面板 -->
      <div
        class="floating-controls absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2.5 rounded-xl border border-[#2e3745] bg-[#12161f]/95 px-3 py-2 shadow-2xl backdrop-blur-md z-40"
      >
        <button
          class="icon-button"
          title="跳转开头"
          @click="editor.setTime(0)"
        >
          <RotateCcw :size="13" />
        </button>

        <button
          class="flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-white shadow-md shadow-violet-900/40 transition hover:bg-violet-500 active:scale-95"
          :title="editor.isPlaying ? '暂停 (Space)' : '播放 (Space)'"
          @click="editor.togglePlay"
        >
          <Pause v-if="editor.isPlaying" :size="15" />
          <Play v-else :size="15" class="ml-0.5" />
        </button>

        <button
          class="icon-button"
          title="前进 0.5s"
          @click="editor.setTime(Math.min(editor.duration, editor.currentTime + 0.5))"
        >
          <ChevronRight :size="15" />
        </button>

        <div class="mx-1 h-4 w-px bg-[#2e3745]" />

        <div class="flex items-baseline gap-1 font-mono text-xs">
          <span class="font-semibold text-slate-100">{{ timecode }}</span>
          <span class="text-slate-600">/ {{ (editor.duration).toFixed(2) }}s</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  color: #8b95a5;
  transition: all 0.15s ease;
}
.icon-button:hover {
  background: #1e2430;
  color: #f1f5f9;
}
.toolbar-button {
  display: flex;
  align-items: center;
  gap: 6px;
  border-radius: 6px;
  padding: 5px 10px;
  font-size: 11px;
  color: #8b95a5;
  transition: all 0.15s ease;
}
.toolbar-button-active,
.toolbar-button:hover {
  color: #f1f5f9;
  background: #1c222c;
}
</style>
