<script setup lang="ts">
import { Application, Container, Graphics, Sprite, Text as PixiText, Texture } from 'pixi.js'
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
import { drawJizuraBackground, compileJizuraLayerPlan, renderJizuraFrame } from '../engine/jizura/renderer'
import { getJizuraStyle, JIZURA_STYLES } from '../engine/jizura/styles'
import { useEditorStore } from '../stores/editor'

const editor = useEditorStore()
const canvasHost = ref<HTMLElement | null>(null)
const appReady = ref(false)

let pixiApp: Application | null = null
let viewport: Container | null = null
let contentLayer: Container | null = null
let gizmoLayer: Graphics | null = null

let jizuraBgCanvas: HTMLCanvasElement | null = null
let jizuraBgCtx: CanvasRenderingContext2D | null = null
let jizuraBgTexture: Texture | null = null
let jizuraBgSprite: Sprite | null = null

let raf = 0
let lastTime = 0
let resizeObserver: ResizeObserver | null = null

// 节点缓存池，防止每一帧重复创建 Texture 与 Canvas 2D 对象造成 DevTools 卡死与告警
interface LayerNodeCache {
  container: Container
  textNode?: PixiText
  subTextNode?: PixiText
  jizuraCanvas?: HTMLCanvasElement
  jizuraCtx?: CanvasRenderingContext2D | null
  jizuraTexture?: Texture
  jizuraSprite?: Sprite
  sprite?: Sprite
  shapeGraphic?: Graphics
  lastKind: string
  lastAssetUrl?: string
}
const layerNodesMap = new Map<string, LayerNodeCache>()
const textureCache = new Map<string, Texture>()
const pendingTextureLoads = new Set<string>()

function loadAndApplyTexture(sprite: Sprite, url: string) {
  if (!url) return
  if (textureCache.has(url)) {
    const tex = textureCache.get(url)!
    sprite.texture = tex
    const maxWidth = 900
    const maxHeight = 620
    const tw = tex.width || maxWidth
    const th = tex.height || maxHeight
    const fitScale = Math.min(maxWidth / tw, maxHeight / th, 1)
    sprite.scale.set(fitScale)
    return
  }

  if (pendingTextureLoads.has(url)) return
  pendingTextureLoads.add(url)

  const img = new Image()
  img.crossOrigin = 'anonymous'
  img.onload = () => {
    try {
      const texture = Texture.from(img)
      textureCache.set(url, texture)
      pendingTextureLoads.delete(url)
      sprite.texture = texture
      const maxWidth = 900
      const maxHeight = 620
      const tw = texture.width || maxWidth
      const th = texture.height || maxHeight
      const fitScale = Math.min(maxWidth / tw, maxHeight / th, 1)
      sprite.scale.set(fitScale)
      renderScene()
    } catch {
      pendingTextureLoads.delete(url)
    }
  }
  img.onerror = () => {
    pendingTextureLoads.delete(url)
  }
  img.src = url
}

// 画布尺寸常量
const STAGE_WIDTH = 1920
const STAGE_HEIGHT = 1080

// 拖拽与缩放交互状态
type GizmoHandle = 'tl' | 'tr' | 'br' | 'bl' | 't' | 'b' | 'l' | 'r'
let dragMode: 'move' | 'scale' | null = null
let activeDragLayerId = ''
let activeHandle: GizmoHandle | null = null
let dragStartStageX = 0
let dragStartStageY = 0
let initialLayerX = 0
let initialLayerY = 0
let initialLayerScale = 100
let initialLayerScaleX = 100
let initialLayerScaleY = 100
let initialHalfWidth = 1
let initialHalfHeight = 1
let initialDistanceToCenter = 1

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

  const sx = (tr.scaleX || tr.scale) / 100
  const sy = (tr.scaleY || tr.scale) / 100

  if (layer.kind === 'text') {
    const cached = layerNodesMap.get(layer.id)
    if (cached?.textNode && cached.textNode.width > 0) {
      w = cached.textNode.width * sx
      h = cached.textNode.height * sy
    } else {
      const textLen = (tr.displayedText || ' ').length
      const fontSize = layer.fontSize || 48
      w = Math.max(120, textLen * fontSize * 0.6 * sx)
      h = Math.max(60, fontSize * 1.3 * sy)
    }
  } else if (layer.kind === 'image') {
    if (layer.assetUrl && textureCache.has(layer.assetUrl)) {
      const tex = textureCache.get(layer.assetUrl)!
      const tw = tex.width || 900
      const th = tex.height || 620
      const fitScale = Math.min(900 / tw, 620 / th, 1)
      w = tw * fitScale * sx
      h = th * fitScale * sy
    } else {
      w = 600 * sx
      h = 360 * sy
    }
  } else if (layer.kind === 'shape') {
    w = (layer.blockWidth || 400) * sx
    h = (layer.blockHeight || 280) * sy
  }

  const pad = 12
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

interface HandlePoint {
  type: GizmoHandle
  x: number
  y: number
}

function getGizmoHandles(layerId: string): HandlePoint[] {
  const bounds = getLayerBoundsInStage(layerId)
  if (!bounds) return []
  const left = bounds.minX
  const top = bounds.minY
  const right = bounds.maxX
  const bottom = bounds.maxY
  const midX = bounds.centerX
  const midY = bounds.centerY

  return [
    { type: 'tl', x: left, y: top },
    { type: 'tr', x: right, y: top },
    { type: 'br', x: right, y: bottom },
    { type: 'bl', x: left, y: bottom },
    { type: 't', x: midX, y: top },
    { type: 'b', x: midX, y: bottom },
    { type: 'l', x: left, y: midY },
    { type: 'r', x: right, y: midY },
  ]
}

function findHitHandle(stageX: number, stageY: number): GizmoHandle | null {
  if (!editor.selectedLayerId) return null
  const handles = getGizmoHandles(editor.selectedLayerId)
  const hitRadius = 22 // stage units
  for (const h of handles) {
    if (Math.hypot(stageX - h.x, stageY - h.y) <= hitRadius) {
      return h.type
    }
  }
  return null
}

function findHitLayer(stageX: number, stageY: number) {
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
  if ((e.target as HTMLElement)?.closest('.floating-controls')) return

  const pt = stagePointFromClient(e.clientX, e.clientY)

  // 1. 优先检查是否点中了当前选中图层的 8 个控制手柄 (拖拽缩放/拉伸)
  const hitHandle = findHitHandle(pt.x, pt.y)
  if (hitHandle && editor.selectedLayerId) {
    const selectedLayer = editor.layers.find((l) => l.id === editor.selectedLayerId)
    if (selectedLayer && !selectedLayer.locked) {
      dragMode = 'scale'
      activeDragLayerId = selectedLayer.id
      activeHandle = hitHandle
      dragStartStageX = pt.x
      dragStartStageY = pt.y
      const tr = computeLayerTransform(selectedLayer, editor.currentTime)
      initialLayerScale = tr.scale
      initialLayerScaleX = tr.scaleX || tr.scale
      initialLayerScaleY = tr.scaleY || tr.scale
      initialLayerX = tr.x
      initialLayerY = tr.y
      const bounds = getLayerBoundsInStage(selectedLayer.id)
      initialHalfWidth = Math.max(10, bounds ? bounds.width / 2 : 100)
      initialHalfHeight = Math.max(10, bounds ? bounds.height / 2 : 100)
      initialDistanceToCenter = Math.max(10, Math.hypot(pt.x - tr.x, pt.y - tr.y))
      editor.beginInteraction()
      return
    }
  }

  // 2. 检查是否点中了某个图层的主体 (拖拽平移)
  const hitLayer = findHitLayer(pt.x, pt.y)
  if (hitLayer) {
    editor.selectLayer(hitLayer.id)
    if (!hitLayer.locked) {
      dragMode = 'move'
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
  if (!viewport || !canvasHost.value) return
  const currentPt = stagePointFromClient(e.clientX, e.clientY)

  if (dragMode === 'scale' && activeDragLayerId && activeHandle) {
    const dx = Math.abs(currentPt.x - initialLayerX)
    const dy = Math.abs(currentPt.y - initialLayerY)
    const layer = editor.layers.find((l) => l.id === activeDragLayerId)
    const isLockedRatio = layer?.lockAspectRatio || e.shiftKey

    if (activeHandle === 'l' || activeHandle === 'r') {
      // 自由拉伸宽度 (X 轴)
      const ratioX = dx / initialHalfWidth
      const newScaleX = Math.max(10, Math.min(500, Math.round(initialLayerScaleX * ratioX)))
      editor.dragUpdateScale(activeDragLayerId, layer?.scale || 100, newScaleX, initialLayerScaleY)
    } else if (activeHandle === 't' || activeHandle === 'b') {
      // 自由拉伸高度 (Y 轴)
      const ratioY = dy / initialHalfHeight
      const newScaleY = Math.max(10, Math.min(500, Math.round(initialLayerScaleY * ratioY)))
      editor.dragUpdateScale(activeDragLayerId, layer?.scale || 100, initialLayerScaleX, newScaleY)
    } else {
      // 四角拉伸 (tl, tr, br, bl)
      if (isLockedRatio) {
        const currentDist = Math.hypot(currentPt.x - initialLayerX, currentPt.y - initialLayerY)
        const ratio = currentDist / Math.max(10, initialDistanceToCenter)
        const newScale = Math.max(10, Math.min(500, Math.round(initialLayerScale * ratio)))
        const newScaleX = Math.max(10, Math.min(500, Math.round(initialLayerScaleX * ratio)))
        const newScaleY = Math.max(10, Math.min(500, Math.round(initialLayerScaleY * ratio)))
        editor.dragUpdateScale(activeDragLayerId, newScale, newScaleX, newScaleY)
      } else {
        const ratioX = dx / initialHalfWidth
        const ratioY = dy / initialHalfHeight
        const newScaleX = Math.max(10, Math.min(500, Math.round(initialLayerScaleX * ratioX)))
        const newScaleY = Math.max(10, Math.min(500, Math.round(initialLayerScaleY * ratioY)))
        const avgScale = Math.round((newScaleX + newScaleY) / 2)
        editor.dragUpdateScale(activeDragLayerId, avgScale, newScaleX, newScaleY)
      }
    }
    return
  }

  if (dragMode === 'move' && activeDragLayerId) {
    // 平移位置计算
    const dx = currentPt.x - dragStartStageX
    const dy = currentPt.y - dragStartStageY
    editor.dragUpdatePosition(
      activeDragLayerId,
      Math.round(initialLayerX + dx),
      Math.round(initialLayerY + dy)
    )
    return
  }

  // 非拖拽时的悬浮光标反馈 (Hover Cursor Feedback)
  const hitHandle = findHitHandle(currentPt.x, currentPt.y)
  if (hitHandle) {
    if (hitHandle === 'tl' || hitHandle === 'br') {
      canvasHost.value.style.cursor = 'nwse-resize'
    } else if (hitHandle === 'tr' || hitHandle === 'bl') {
      canvasHost.value.style.cursor = 'nesw-resize'
    } else if (hitHandle === 'l' || hitHandle === 'r') {
      canvasHost.value.style.cursor = 'ew-resize'
    } else if (hitHandle === 't' || hitHandle === 'b') {
      canvasHost.value.style.cursor = 'ns-resize'
    }
  } else if (findHitLayer(currentPt.x, currentPt.y)) {
    canvasHost.value.style.cursor = 'move'
  } else {
    canvasHost.value.style.cursor = 'crosshair'
  }
}

function onCanvasPointerUp() {
  if (dragMode) {
    editor.endInteraction()
  }
  dragMode = null
  activeDragLayerId = ''
  activeHandle = null
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

function drawBackground() {
  if (!jizuraBgCtx || !jizuraBgTexture) return

  // 1. 优先获取当前播放头位置处于激活区间的 background 图层素材
  const activeBgLayer = editor.layers.find(
    (l) => l.kind === 'background' && l.visible && editor.currentTime >= l.start && editor.currentTime <= l.start + l.duration
  )

  const bgKey = activeBgLayer?.bgPreset || activeBgLayer?.bgType || editor.backgroundConfig.type || 'meshBlobs'
  const style = getJizuraStyle(editor.activeJizuraStyleId) || JIZURA_STYLES[0]
  const scheme = {
    bg: activeBgLayer?.colorA || editor.backgroundConfig.colorA || style.scheme.bg,
    fg: style.scheme.fg,
    accent: activeBgLayer?.colorB || editor.backgroundConfig.colorB || style.scheme.accent,
    accent2: activeBgLayer?.colorC || editor.backgroundConfig.colorC || style.scheme.accent2,
    sub: style.scheme.sub,
    ink: style.scheme.ink,
    dim: style.scheme.dim,
  }

  drawJizuraBackground(jizuraBgCtx, STAGE_WIDTH, STAGE_HEIGHT, bgKey, scheme, editor.currentTime)
  jizuraBgTexture.source?.update()
}

function renderScene() {
  if (!jizuraBgCtx || !jizuraBgTexture || !contentLayer || !gizmoLayer) return

  // 1. 渲染独立背景层（支持多片段 background 图层分段切换）
  drawBackground()

  // 2. 清理已删除的图层缓存节点
  const currentLayerIds = new Set(editor.layers.map((l) => l.id))
  for (const [id, cached] of layerNodesMap.entries()) {
    if (!currentLayerIds.has(id)) {
      cached.container.destroy({ children: true })
      layerNodesMap.delete(id)
    }
  }

  // 3. 按照时间轴真实堆叠顺序（底层在前，顶层在后）依次绘制每个图层
  const activeLayers = [...editor.layers].reverse()

  for (let i = 0; i < activeLayers.length; i++) {
    const layer = activeLayers[i]
    if (layer.kind === 'audio' || layer.kind === 'background') continue

    let cached = layerNodesMap.get(layer.id)
    if (!cached || cached.lastKind !== layer.kind) {
      if (cached) {
        cached.container.destroy({ children: true })
        layerNodesMap.delete(layer.id)
      }
      const container = new Container()
      contentLayer.addChild(container)
      cached = {
        container,
        lastKind: layer.kind,
      }
      layerNodesMap.set(layer.id, cached)
    }

    // 严格同步图层的真实 Z-Index 层级堆叠顺序（保证新建图层和时间轴排序完全生效）
    if (cached.container.parent === contentLayer) {
      const targetIndex = Math.min(i, contentLayer.children.length - 1)
      contentLayer.setChildIndex(cached.container, targetIndex)
    }

    // 检查图层显隐与时间有效性
    const isTimeActive = editor.currentTime >= layer.start && editor.currentTime <= layer.start + layer.duration
    const isVisible = layer.visible && isTimeActive

    cached.container.visible = isVisible
    if (!isVisible) continue

    const computedTransform = computeLayerTransform(layer, editor.currentTime)

    // A. 文本图层：支持 JIZURA 动态文字引擎与标准关键帧文字
    if (layer.kind === 'text') {
      const isJizura = layer.useJizura !== false

      if (isJizura) {
        if (cached.textNode) {
          cached.textNode.visible = false
        }

        if (!cached.jizuraCanvas) {
          cached.jizuraCanvas = document.createElement('canvas')
          cached.jizuraCanvas.width = STAGE_WIDTH
          cached.jizuraCanvas.height = STAGE_HEIGHT
          cached.jizuraCtx = cached.jizuraCanvas.getContext('2d')
          cached.jizuraTexture = Texture.from(cached.jizuraCanvas)
          cached.jizuraSprite = new Sprite(cached.jizuraTexture)
          cached.jizuraSprite.anchor.set(0, 0)
          cached.container.addChild(cached.jizuraSprite)
        }

        if (cached.jizuraSprite) {
          cached.jizuraSprite.visible = true
        }

        if (cached.jizuraCtx && cached.jizuraTexture) {
          cached.jizuraCtx.clearRect(0, 0, STAGE_WIDTH, STAGE_HEIGHT)
          const singlePlan = compileJizuraLayerPlan(layer, editor.activeJizuraStyleId)
          if (singlePlan) {
            const localTime = Math.max(0, Math.min(layer.duration, editor.currentTime - layer.start))
            renderJizuraFrame(cached.jizuraCtx, singlePlan, localTime, { transparent: true })
            cached.jizuraTexture.source?.update()
          }
        }

        // 定位与变换：支持用户拖拽与关键帧平移 (相对于画布基准 960, 540)
        const offsetX = computedTransform.x - 960
        const offsetY = computedTransform.y - 540
        cached.container.position.set(offsetX, offsetY)
        cached.container.scale.set(
          (computedTransform.scaleX || computedTransform.scale) / 100,
          (computedTransform.scaleY || computedTransform.scale) / 100
        )
        cached.container.alpha = computedTransform.opacity / 100
        cached.container.angle = computedTransform.rotation
      } else {
        if (cached.jizuraSprite) {
          cached.jizuraSprite.visible = false
        }

        if (!cached.textNode) {
          const textNode = new PixiText({
            text: computedTransform.displayedText || ' ',
            style: {
              fill: layer.fontColor || '#ffffff',
              fontSize: layer.fontSize || 48,
              fontWeight: '700',
              fontFamily: 'Inter, "Noto Sans SC", system-ui, sans-serif',
              align: 'center',
            },
          })
          textNode.anchor.set(0.5)
          cached.container.addChild(textNode)
          cached.textNode = textNode
        }

        if (cached.textNode) {
          cached.textNode.visible = true
          cached.textNode.text = computedTransform.displayedText || ' '
          cached.textNode.style.fill = layer.fontColor || '#ffffff'
          cached.textNode.style.fontSize = layer.fontSize || 48
        }

        cached.container.position.set(computedTransform.x, computedTransform.y)
        cached.container.scale.set(
          (computedTransform.scaleX || computedTransform.scale) / 100,
          (computedTransform.scaleY || computedTransform.scale) / 100
        )
        cached.container.alpha = computedTransform.opacity / 100
        cached.container.angle = computedTransform.rotation
      }
    } else if (layer.kind === 'image') {
      if (!cached.sprite) {
        const sprite = new Sprite(Texture.WHITE)
        sprite.anchor.set(0.5)
        cached.container.addChild(sprite)
        cached.sprite = sprite
      }
      if (layer.assetUrl && cached.lastAssetUrl !== layer.assetUrl) {
        cached.lastAssetUrl = layer.assetUrl
        loadAndApplyTexture(cached.sprite, layer.assetUrl)
      }
      cached.container.position.set(computedTransform.x, computedTransform.y)
      cached.container.scale.set(
        (computedTransform.scaleX || computedTransform.scale) / 100,
        (computedTransform.scaleY || computedTransform.scale) / 100
      )
      cached.container.alpha = computedTransform.opacity / 100
      cached.container.angle = computedTransform.rotation
    } else if (layer.kind === 'shape') {
      if (!cached.shapeGraphic) {
        const shapeGraphic = new Graphics()
        cached.container.addChild(shapeGraphic)
        cached.shapeGraphic = shapeGraphic
      }
      const color = layer.blockColor || layer.color || '#6366f1'
      const bw = layer.blockWidth || 400
      const bh = layer.blockHeight || 280
      const br = layer.borderRadius ?? 0
      cached.shapeGraphic.clear()
      cached.shapeGraphic.roundRect(-bw / 2, -bh / 2, bw, bh, br).fill({ color })

      cached.container.position.set(computedTransform.x, computedTransform.y)
      cached.container.scale.set(
        (computedTransform.scaleX || computedTransform.scale) / 100,
        (computedTransform.scaleY || computedTransform.scale) / 100
      )
      cached.container.alpha = computedTransform.opacity / 100
      cached.container.angle = computedTransform.rotation
    }
  }

  // 4. 绘制选中选框 (Gizmo)
  gizmoLayer.clear()
  if (editor.selectedLayerId) {
    const bounds = getLayerBoundsInStage(editor.selectedLayerId)
    if (bounds && bounds.tr.visible) {
      const left = bounds.minX + 12
      const top = bounds.minY + 12
      const width = bounds.width
      const height = bounds.height

      gizmoLayer
        .rect(left, top, width, height)
        .stroke({ color: '#8b5cf6', width: 1.5, alpha: 0.9 })

      const handles = [
        { type: 'tl', x: left, y: top },
        { type: 'tr', x: left + width, y: top },
        { type: 'br', x: left + width, y: top + height },
        { type: 'bl', x: left, y: top + height },
        { type: 't', x: left + width / 2, y: top },
        { type: 'b', x: left + width / 2, y: top + height },
        { type: 'l', x: left, y: top + height / 2 },
        { type: 'r', x: left + width, y: top + height / 2 },
      ]

      for (const h of handles) {
        const isCurrentHandleActive = dragMode === 'scale' && activeHandle === h.type
        const isCorner = h.type === 'tl' || h.type === 'tr' || h.type === 'br' || h.type === 'bl'

        if (isCorner) {
          // 四个角手柄：方形
          gizmoLayer
            .rect(h.x - 5, h.y - 5, 10, 10)
            .fill(isCurrentHandleActive ? '#8b5cf6' : '#ffffff')
            .stroke({ color: '#8b5cf6', width: 2 })
        } else if (h.type === 't' || h.type === 'b') {
          // 顶部/底部中间手柄：横向胶囊条
          gizmoLayer
            .roundRect(h.x - 7, h.y - 3, 14, 6, 2)
            .fill(isCurrentHandleActive ? '#8b5cf6' : '#ffffff')
            .stroke({ color: '#8b5cf6', width: 1.5 })
        } else if (h.type === 'l' || h.type === 'r') {
          // 左侧/右侧中间手柄：纵向胶囊条
          gizmoLayer
            .roundRect(h.x - 3, h.y - 7, 6, 14, 2)
            .fill(isCurrentHandleActive ? '#8b5cf6' : '#ffffff')
            .stroke({ color: '#8b5cf6', width: 1.5 })
        }
      }
    }
  }
}

function animate(now: number) {
  if (editor.isPlaying) {
    if (lastTime > 0) {
      const deltaSec = (now - lastTime) / 1000
      let nextTime = editor.currentTime + deltaSec
      if (nextTime >= editor.duration) {
        nextTime = 0
      }
      editor.setTime(nextTime, false)
    }
    renderScene()
  }
  lastTime = now
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

  // 1. 底层独立背景渲染层
  jizuraBgCanvas = document.createElement('canvas')
  jizuraBgCanvas.width = STAGE_WIDTH
  jizuraBgCanvas.height = STAGE_HEIGHT
  jizuraBgCtx = jizuraBgCanvas.getContext('2d')
  jizuraBgTexture = Texture.from(jizuraBgCanvas)
  jizuraBgSprite = new Sprite(jizuraBgTexture)
  viewport.addChild(jizuraBgSprite)

  // 2. 所有图层按时间轴顺序堆叠
  contentLayer = new Container()
  viewport.addChild(contentLayer)

  // 3. 交互式选框层 (Gizmo)
  gizmoLayer = new Graphics()
  viewport.addChild(gizmoLayer)

  updateViewportTransform()
  if (canvasHost.value && typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(() => {
      if (pixiApp && canvasHost.value) {
        updateViewportTransform()
      }
    })
    resizeObserver.observe(canvasHost.value)
  }
  window.addEventListener('resize', updateViewportTransform)
  window.addEventListener('pointermove', onCanvasPointerMove)
  window.addEventListener('pointerup', onCanvasPointerUp)

  appReady.value = true
  renderScene()
  raf = requestAnimationFrame(animate)
}

watch(
  () => [editor.currentTime, editor.selectedLayerId],
  () => {
    renderScene()
  }
)

watch(
  () => [editor.layers, editor.backgroundConfig, editor.activeJizuraStyleId, editor.duration],
  () => {
    renderScene()
  },
  { deep: true }
)

onMounted(() => {
  void initPixi()
})

onBeforeUnmount(() => {
  cancelAnimationFrame(raf)
  resizeObserver?.disconnect()
  resizeObserver = null
  window.removeEventListener('resize', updateViewportTransform)
  window.removeEventListener('pointermove', onCanvasPointerMove)
  window.removeEventListener('pointerup', onCanvasPointerUp)

  for (const [, cached] of layerNodesMap) {
    cached.container.destroy({ children: true })
  }
  layerNodesMap.clear()

  for (const [, tex] of textureCache) {
    tex.destroy(true)
  }
  textureCache.clear()
  pendingTextureLoads.clear()

  pixiApp?.destroy(true, { children: true })
  pixiApp = null
})
</script>

<template>
  <section class="flex min-w-0 flex-1 min-h-0 flex-col bg-[#0b0e14] overflow-hidden">
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
          @click="editor.setTime(0, true)"
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
          @click="editor.setTime(Math.min(editor.duration, editor.currentTime + 0.5), true)"
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
