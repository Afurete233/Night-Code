import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { audioEngine } from '../engine/audio'
import type { AnimatableProperty, BackgroundConfig, BackgroundType, EasingType, Keyframe, Layer, LayerKind, TextAnimPreset } from '../engine/types'
import { BACKGROUND_PRESETS, getDefaultBackgroundConfig } from '../engine/jizura/backgrounds'
import { getJizuraStyle, JIZURA_STYLES } from '../engine/jizura/styles'
import type { ParsedLyricLine } from '../engine/jizura/lyrics'

export type { AnimatableProperty, EasingType, Keyframe, Layer, LayerKind, TextAnimPreset }

const LAYOUT_STORAGE_KEY = 'frameflow_layout_v1'
const PROJECT_STORAGE_KEY = 'frameflow_project_v1'

function getInitialLayoutSettings() {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        leftWidth: typeof parsed.leftWidth === 'number' ? parsed.leftWidth : 248,
        rightWidth: typeof parsed.rightWidth === 'number' ? parsed.rightWidth : 280,
        presetDrawerWidth: typeof parsed.presetDrawerWidth === 'number' ? parsed.presetDrawerWidth : 420,
        bottomHeight: typeof parsed.bottomHeight === 'number' ? parsed.bottomHeight : 280,
        isLeftPanelCollapsed: typeof parsed.isLeftPanelCollapsed === 'boolean' ? parsed.isLeftPanelCollapsed : false,
        activePresetDrawerCategory:
          parsed.activePresetDrawerCategory === 'standard-anim'
            ? null
            : typeof parsed.activePresetDrawerCategory === 'string' || parsed.activePresetDrawerCategory === null
              ? parsed.activePresetDrawerCategory
              : null,
        zoom: typeof parsed.zoom === 'number' ? parsed.zoom : 80,
      }
    }
  } catch (e) {
    console.error('Failed to load layout settings from localStorage', e)
  }
  return {
    leftWidth: 248,
    rightWidth: 280,
    presetDrawerWidth: 420,
    bottomHeight: 280,
    isLeftPanelCollapsed: false,
    activePresetDrawerCategory: null,
    zoom: 80,
  }
}

type Snapshot = {
  layers: Layer[]
  selectedLayerId: string
  currentTime: number
  duration: number
  backgroundConfig: BackgroundConfig
}

const DEFAULT_BG_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231e1b4b"/><stop offset="50%" stop-color="%23312e81"/><stop offset="100%" stop-color="%230f172a"/></linearGradient><linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%238b5cf6" stop-opacity="0.4"/><stop offset="100%" stop-color="%2306b6d4" stop-opacity="0.1"/></linearGradient></defs><rect width="960" height="540" rx="24" fill="url(%23g)"/><rect x="40" y="40" width="880" height="460" rx="16" fill="url(%23glow)" stroke="%236366f1" stroke-width="2" stroke-opacity="0.4"/><circle cx="700" cy="200" r="140" fill="%238b5cf6" fill-opacity="0.15"/><circle cx="280" cy="360" r="180" fill="%2306b6d4" fill-opacity="0.12"/><text x="480" y="270" fill="%2394a3b8" font-size="28" font-family="sans-serif" font-weight="bold" text-anchor="middle" letter-spacing="4">MOTION ARTBOARD</text></svg>`

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

export const useEditorStore = defineStore('editor', () => {
  const initialLayout = getInitialLayoutSettings()

  const currentTime = ref(1.2)
  const isPlaying = ref(false)
  const selectedLayerId = ref('title')
  const selectedLayerIds = ref<string[]>(['title'])
  const selectedKeyframeId = ref<string | null>('k1')
  const isLeftPanelCollapsed = ref(initialLayout.isLeftPanelCollapsed)
  const duration = ref(10)
  const zoom = ref(initialLayout.zoom)
  const showExportModal = ref(false)
  const showLyricModal = ref(false)
  const showJizuraExplorerModal = ref(false)
  const activePresetDrawerCategory = ref<string | null>(initialLayout.activePresetDrawerCategory)
  const continuousLyricTransition = ref<boolean>(true)
  const activeJizuraStyleId = ref<string>('noir')
  const backgroundConfig = ref<BackgroundConfig>(getDefaultBackgroundConfig('cyber-grid'))

  // 布局尺寸状态 (弹性可调节并自动持久化到 localStorage)
  const leftWidth = ref(initialLayout.leftWidth)
  const rightWidth = ref(initialLayout.rightWidth)
  const presetDrawerWidth = ref(initialLayout.presetDrawerWidth)
  const bottomHeight = ref(initialLayout.bottomHeight)

  // 监听面板布局尺寸与展开分类变化自动保存
  watch(
    [leftWidth, rightWidth, presetDrawerWidth, bottomHeight, isLeftPanelCollapsed, activePresetDrawerCategory, zoom],
    () => {
      try {
        localStorage.setItem(
          LAYOUT_STORAGE_KEY,
          JSON.stringify({
            leftWidth: leftWidth.value,
            rightWidth: rightWidth.value,
            presetDrawerWidth: presetDrawerWidth.value,
            bottomHeight: bottomHeight.value,
            isLeftPanelCollapsed: isLeftPanelCollapsed.value,
            activePresetDrawerCategory: activePresetDrawerCategory.value,
            zoom: zoom.value,
          })
        )
      } catch (e) {
        console.error('Failed to save layout settings to localStorage', e)
      }
    },
    { deep: true }
  )

  function resetLayoutSettings() {
    leftWidth.value = 248
    rightWidth.value = 280
    presetDrawerWidth.value = 420
    bottomHeight.value = 280
    isLeftPanelCollapsed.value = false
    activePresetDrawerCategory.value = null
    zoom.value = 80
  }

  // 初始图层，包含真实关键帧与文字动画
  const layers = ref<Layer[]>([
    {
      id: 'title',
      name: '动态文字 · 弹跳入场',
      kind: 'text',
      color: '#8b5cf6',
      start: 0.5,
      duration: 5.5,
      visible: true,
      locked: false,
      x: 960,
      y: 480,
      width: 600,
      height: 90,
      naturalWidth: 600,
      naturalHeight: 90,
      scale: 100,
      opacity: 100,
      rotation: 0,
      text: 'Motion Sequences',
      fontSize: 58,
      fontColor: '#ffffff',
      textPreset: 'pop-in',
      useJizura: true,
      layoutAnim: 'center',
      enterAnim: 'pop',
      holdAnim: 'breathe',
      exitAnim: 'fall',
      decorAnim: 'rings',
      treatAnim: 'glow',
      treatmentColor: '#8b5cf6',
      treatmentColorB: '#ec4899',
      keyframes: [
        { id: 'k1', time: 0, property: 'y', value: 380, easing: 'bounceOut' },
        { id: 'k2', time: 1.2, property: 'y', value: 480, easing: 'easeInOut' },
        { id: 'k3', time: 2.2, property: 'rotation', value: 0, easing: 'easeInOut' },
        { id: 'k4', time: 3.5, property: 'rotation', value: 6, easing: 'easeInOut' },
      ],
    },
    {
      id: 'subtitle',
      name: '副标题 · 打字机效果',
      kind: 'text',
      color: '#22d3ee',
      start: 1.5,
      duration: 6.0,
      visible: true,
      locked: false,
      x: 960,
      y: 590,
      width: 480,
      height: 50,
      naturalWidth: 480,
      naturalHeight: 50,
      scale: 100,
      opacity: 100,
      rotation: 0,
      text: 'Next-Gen Vector Motion Graphics',
      fontSize: 22,
      fontColor: '#94a3b8',
      textPreset: 'typewriter',
      useJizura: true,
      layoutAnim: 'center',
      enterAnim: 'type',
      holdAnim: 'still',
      exitAnim: 'fade-up',
      decorAnim: 'none',
      treatAnim: 'none',
      keyframes: [],
    },
    {
      id: 'photo',
      name: '背景视觉卡片',
      kind: 'image',
      color: '#f59e0b',
      start: 0,
      duration: 8.5,
      visible: true,
      locked: false,
      x: 960,
      y: 540,
      width: 960,
      height: 540,
      naturalWidth: 960,
      naturalHeight: 540,
      scale: 100,
      opacity: 90,
      rotation: 0,
      assetUrl: DEFAULT_BG_IMAGE,
      keyframes: [
        { id: 'kp1', time: 0, property: 'scale', value: 90, easing: 'easeOut' },
        { id: 'kp2', time: 1.5, property: 'scale', value: 100, easing: 'easeInOut' },
      ],
    },
    {
      id: 'music',
      name: 'cyber-rhythm.mp3',
      kind: 'audio',
      color: '#34d399',
      start: 0,
      duration: 10,
      visible: true,
      locked: false,
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      scale: 100,
      opacity: 100,
      rotation: 0,
      keyframes: [],
      waveform: audioEngine.generateMockWaveform(120),
    },
  ])

  const past = ref<Snapshot[]>([])
  const future = ref<Snapshot[]>([])

  const selectedLayers = computed(() => {
    return layers.value.filter((l) => selectedLayerIds.value.includes(l.id))
  })

  const selectedLayer = computed(() => {
    return layers.value.find((l) => l.id === selectedLayerId.value) || selectedLayers.value[0] || layers.value[0]
  })

  const progress = computed(() => {
    return duration.value ? (currentTime.value / duration.value) * 100 : 0
  })

  const canUndo = computed(() => past.value.length > 0)
  const canRedo = computed(() => future.value.length > 0)

  function snapshot(): Snapshot {
    return {
      layers: clone(layers.value),
      selectedLayerId: selectedLayerId.value,
      currentTime: currentTime.value,
      duration: duration.value,
      backgroundConfig: clone(backgroundConfig.value),
    }
  }

  function restore(value: Snapshot) {
    layers.value = clone(value.layers)
    selectedLayerId.value = value.selectedLayerId
    selectedLayerIds.value = [value.selectedLayerId]
    currentTime.value = value.currentTime
    duration.value = value.duration
    if (value.backgroundConfig) {
      backgroundConfig.value = clone(value.backgroundConfig)
    }
  }

  function commit() {
    past.value.push(snapshot())
    if (past.value.length > 50) past.value.shift()
    future.value = []
  }

  function undo() {
    const previous = past.value.pop()
    if (!previous) return
    future.value.push(snapshot())
    restore(previous)
  }

  function redo() {
    const next = future.value.pop()
    if (!next) return
    past.value.push(snapshot())
    restore(next)
  }

  function selectLayer(id: string, multi = false) {
    if (!layers.value.some((layer) => layer.id === id)) return
    if (multi) {
      if (selectedLayerIds.value.includes(id)) {
        if (selectedLayerIds.value.length > 1) {
          selectedLayerIds.value = selectedLayerIds.value.filter((i) => i !== id)
          selectedLayerId.value = selectedLayerIds.value[selectedLayerIds.value.length - 1]
        }
      } else {
        selectedLayerIds.value.push(id)
        selectedLayerId.value = id
      }
    } else {
      selectedLayerIds.value = [id]
      selectedLayerId.value = id
    }
  }

  function selectAllLayers() {
    selectedLayerIds.value = layers.value.map((l) => l.id)
    if (layers.value.length > 0) {
      selectedLayerId.value = layers.value[0].id
    }
  }

  function updateSelected(patch: Partial<Layer>) {
    let targets = selectedLayers.value.filter((l) => !l.locked)
    if (targets.length === 0 && selectedLayer.value && !selectedLayer.value.locked) {
      targets = [selectedLayer.value]
    }
    if (targets.length === 0) return
    commit()
    for (const target of targets) {
      Object.assign(target, clone(patch))
      if (target.start + target.duration > duration.value) {
        duration.value = Number((target.start + target.duration).toFixed(2))
      }
    }
  }

  function updateLayer(id: string, patch: Partial<Layer>) {
    const target = layers.value.find((l) => l.id === id)
    if (!target) return
    commit()
    Object.assign(target, patch)
    if (target.start + target.duration > duration.value) {
      duration.value = Number((target.start + target.duration).toFixed(2))
    }
  }

  function toggleVisibility(id: string) {
    const layer = layers.value.find((item) => item.id === id)
    if (!layer) return
    commit()
    layer.visible = !layer.visible
  }

  function toggleLock(id: string) {
    const layer = layers.value.find((item) => item.id === id)
    if (!layer) return
    commit()
    layer.locked = !layer.locked
  }

  function deleteLayer(id: string) {
    const index = layers.value.findIndex((l) => l.id === id)
    if (index === -1) return
    commit()
    layers.value.splice(index, 1)
    if (selectedLayerId.value === id && layers.value.length > 0) {
      selectedLayerId.value = layers.value[0].id
    }
  }

  function addTextLayer() {
    commit()
    const id = `text-${Date.now()}`
    const chosenStyle = getJizuraStyle(activeJizuraStyleId.value) || JIZURA_STYLES[0]
    layers.value.unshift({
      id,
      name: '新文字图层',
      kind: 'text',
      color: chosenStyle.scheme.accent,
      start: currentTime.value,
      duration: 3.5,
      visible: true,
      locked: false,
      x: 960,
      y: 540,
      width: 600,
      height: 90,
      naturalWidth: 600,
      naturalHeight: 90,
      scale: 100,
      scaleX: 100,
      scaleY: 100,
      opacity: 100,
      rotation: 0,
      text: '创意线性动画',
      fontSize: 54,
      fontColor: chosenStyle.scheme.fg,
      useJizura: true,
      layoutAnim: chosenStyle.defaultLayout || 'center',
      enterAnim: chosenStyle.defaultPreset || 'pop',
      holdAnim: 'breathe',
      exitAnim: 'fall',
      decorAnim: 'rings',
      treatAnim: chosenStyle.defaultTreatment || 'glow',
      treatmentColor: chosenStyle.scheme.accent,
      treatmentColorB: chosenStyle.scheme.accent2,
      camAnim: 'push',
      transAnim: 'wipe',
      textPreset: 'pop-in',
      keyframes: [],
    })
    selectedLayerId.value = id
    selectedLayerIds.value = [id]
  }

  function addShapeLayer(color = '#6366f1') {
    commit()
    const id = `shape-${Date.now()}`
    const newLayer: Layer = {
      id,
      name: '纯色色块',
      kind: 'shape',
      color: color,
      blockColor: color,
      blockWidth: 400,
      blockHeight: 280,
      width: 400,
      height: 280,
      naturalWidth: 400,
      naturalHeight: 280,
      borderRadius: 0, // 默认纯直角色块
      scale: 100,
      scaleX: 100,
      scaleY: 100,
      lockAspectRatio: false,
      start: currentTime.value,
      duration: 5,
      visible: true,
      locked: false,
      x: 960,
      y: 540,
      opacity: 100,
      rotation: 0,
      keyframes: [],
    }
    if (newLayer.start + newLayer.duration > duration.value) {
      duration.value = Number((newLayer.start + newLayer.duration).toFixed(2))
    }
    layers.value.unshift(newLayer)
    selectedLayerId.value = id
    selectedLayerIds.value = [id]
  }

  function addBackgroundLayer(bgType: BackgroundType = 'dotGrid', colorA?: string, colorB?: string, colorC?: string) {
    commit()
    const id = `bg-${Date.now()}`
    const preset = BACKGROUND_PRESETS.find((p) => p.id === bgType) || BACKGROUND_PRESETS[5]
    const newLayer: Layer = {
      id,
      name: `背景 · ${preset.name}`,
      kind: 'background',
      color: colorA || preset.defaultColorA,
      bgType,
      colorA: colorA || preset.defaultColorA,
      colorB: colorB || preset.defaultColorB,
      colorC: colorC || preset.defaultColorC,
      width: 1920,
      height: 1080,
      naturalWidth: 1920,
      naturalHeight: 1080,
      gridDensity: 60,
      scanlineOpacity: 30,
      scale: 100,
      scaleX: 100,
      scaleY: 100,
      lockAspectRatio: false,
      start: currentTime.value,
      duration: Math.max(3, duration.value - currentTime.value),
      visible: true,
      locked: false,
      x: 960,
      y: 540,
      opacity: 100,
      rotation: 0,
      keyframes: [],
    }
    if (newLayer.start + newLayer.duration > duration.value) {
      duration.value = Number((newLayer.start + newLayer.duration).toFixed(2))
    }
    layers.value.push(newLayer)
    selectedLayerId.value = id
    selectedLayerIds.value = [id]
  }

  function addAssetLayer(file: File, initialPos?: { x: number; y: number }) {
    commit()
    const id = `asset-${Date.now()}`
    const isAudio = file.type.startsWith('audio')
    const kind: LayerKind = isAudio ? 'audio' : 'image'

    const newLayer: Layer = {
      id,
      name: file.name,
      kind,
      color: isAudio ? '#34d399' : '#f59e0b',
      start: currentTime.value,
      duration: isAudio ? Math.max(2, duration.value - currentTime.value) : 5,
      visible: true,
      locked: false,
      x: initialPos ? initialPos.x : 960,
      y: initialPos ? initialPos.y : 540,
      width: 600,
      height: 400,
      naturalWidth: 600,
      naturalHeight: 400,
      scale: 100,
      opacity: 100,
      rotation: 0,
      keyframes: [],
    }

    if (isAudio) {
      const url = URL.createObjectURL(file)
      newLayer.assetUrl = url
      audioEngine
        .loadAudio(url)
        .then((res) => {
          newLayer.waveform = res.waveform
          newLayer.duration = Number(res.buffer.duration.toFixed(2))
          if (newLayer.start + newLayer.duration > duration.value) {
            duration.value = Number((newLayer.start + newLayer.duration).toFixed(2))
          }
        })
        .catch(() => {
          newLayer.waveform = audioEngine.generateMockWaveform()
        })
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        if (dataUrl) {
          const img = new Image()
          img.onload = () => {
            const nw = img.naturalWidth || 600
            const nh = img.naturalHeight || 400
            updateLayer(newLayer.id, {
              assetUrl: dataUrl,
              naturalWidth: nw,
              naturalHeight: nh,
              width: nw,
              height: nh,
              scale: 100,
              scaleX: 100,
              scaleY: 100,
            })
          }
          img.src = dataUrl
        }
      }
      reader.readAsDataURL(file)
    }

    layers.value.unshift(newLayer)
    selectedLayerId.value = id
    selectedLayerIds.value = [id]
  }

  function beginInteraction() {
    past.value.push(snapshot())
    if (past.value.length > 50) past.value.shift()
    future.value = []
  }

  function dragUpdatePosition(id: string, newX: number, newY: number) {
    const layer = layers.value.find((l) => l.id === id)
    if (!layer || layer.locked) return
    const relTime = currentTime.value - layer.start

    // X 坐标更新策略
    const xKeyframes = layer.keyframes.filter((k) => k.property === 'x').sort((a, b) => a.time - b.time)
    if (xKeyframes.length === 0) {
      layer.x = newX
    } else {
      let closest = xKeyframes[0]
      let minDiff = Math.abs(closest.time - relTime)
      for (const k of xKeyframes) {
        const diff = Math.abs(k.time - relTime)
        if (diff < minDiff) {
          minDiff = diff
          closest = k
        }
      }
      closest.value = newX
    }

    // Y 坐标更新策略
    const yKeyframes = layer.keyframes.filter((k) => k.property === 'y').sort((a, b) => a.time - b.time)
    if (yKeyframes.length === 0) {
      layer.y = newY
    } else {
      let closest = yKeyframes[0]
      let minDiff = Math.abs(closest.time - relTime)
      for (const k of yKeyframes) {
        const diff = Math.abs(k.time - relTime)
        if (diff < minDiff) {
          minDiff = diff
          closest = k
        }
      }
      closest.value = newY
    }
  }

  // 画布快速拖拽缩放 (支持独立 scaleX, scaleY，并实时同步更新实际 width 与 height)
  function dragUpdateScale(
    layerId: string,
    newScale: number,
    newScaleX?: number,
    newScaleY?: number
  ) {
    const layer = layers.value.find((l) => l.id === layerId)
    if (!layer || layer.locked) return

    const clampedScale = Math.max(10, Math.min(500, Math.round(newScale)))
    const relTime = currentTime.value - layer.start
    const nw = layer.naturalWidth || layer.width || (layer.kind === 'shape' ? layer.blockWidth || 400 : layer.kind === 'text' ? 600 : 600)
    const nh = layer.naturalHeight || layer.height || (layer.kind === 'shape' ? layer.blockHeight || 280 : layer.kind === 'text' ? 90 : 400)

    if (newScaleX !== undefined && newScaleY !== undefined) {
      const clampedX = Math.max(10, Math.min(500, Math.round(newScaleX)))
      const clampedY = Math.max(10, Math.min(500, Math.round(newScaleY)))
      layer.scaleX = clampedX
      layer.scaleY = clampedY
      layer.scale = clampedScale
      layer.width = Math.round(nw * (clampedX / 100))
      layer.height = Math.round(nh * (clampedY / 100))
      if (layer.kind === 'shape') {
        layer.blockWidth = layer.width
        layer.blockHeight = layer.height
      }

      const kfX = layer.keyframes.filter((k) => k.property === 'scaleX').sort((a, b) => a.time - b.time)
      if (kfX.length > 0) {
        let closest = kfX[0]
        let minDiff = Math.abs(closest.time - relTime)
        for (const k of kfX) {
          const diff = Math.abs(k.time - relTime)
          if (diff < minDiff) {
            minDiff = diff
            closest = k
          }
        }
        closest.value = clampedX
      }

      const kfY = layer.keyframes.filter((k) => k.property === 'scaleY').sort((a, b) => a.time - b.time)
      if (kfY.length > 0) {
        let closest = kfY[0]
        let minDiff = Math.abs(closest.time - relTime)
        for (const k of kfY) {
          const diff = Math.abs(k.time - relTime)
          if (diff < minDiff) {
            minDiff = diff
            closest = k
          }
        }
        closest.value = clampedY
      }
    } else {
      layer.scale = clampedScale
      if (layer.scaleX !== undefined) layer.scaleX = clampedScale
      if (layer.scaleY !== undefined) layer.scaleY = clampedScale
      layer.width = Math.round(nw * (clampedScale / 100))
      layer.height = Math.round(nh * (clampedScale / 100))
      if (layer.kind === 'shape') {
        layer.blockWidth = layer.width
        layer.blockHeight = layer.height
      }

      const scaleKeyframes = layer.keyframes.filter((k) => k.property === 'scale').sort((a, b) => a.time - b.time)
      if (scaleKeyframes.length > 0) {
        let closest = scaleKeyframes[0]
        let minDiff = Math.abs(closest.time - relTime)
        for (const k of scaleKeyframes) {
          const diff = Math.abs(k.time - relTime)
          if (diff < minDiff) {
            minDiff = diff
            closest = k
          }
        }
        closest.value = clampedScale
      }
    }
  }

  function endInteraction() {
    // 保留 beginInteraction 创建的快照；此方法用于对称的交互生命周期。
  }

  // 图层上下拖拽排序
  function reorderLayers(fromIndex: number, toIndex: number) {
    if (
      fromIndex < 0 ||
      fromIndex >= layers.value.length ||
      toIndex < 0 ||
      toIndex >= layers.value.length ||
      fromIndex === toIndex
    ) {
      return
    }
    commit()
    const moved = layers.value.splice(fromIndex, 1)[0]
    layers.value.splice(toIndex, 0, moved)
  }


  function selectKeyframe(id: string | null) {
    selectedKeyframeId.value = id
  }

  // 关键帧管理
  function updateKeyframeEasing(layerId: string, kfId: string, easing: EasingType) {
    const layer = layers.value.find((l) => l.id === layerId)
    if (!layer) return
    const kf = layer.keyframes.find((k) => k.id === kfId)
    if (!kf) return
    commit()
    kf.easing = easing
  }

  function updateCurrentTimeKeyframeEasing(layerId: string, easing: EasingType) {
    const layer = layers.value.find((l) => l.id === layerId)
    if (!layer) return
    commit()

    // 1. 若当前优先选中了某个具体关键帧，直接更新它
    if (selectedKeyframeId.value) {
      const selectedKf = layer.keyframes.find((k) => k.id === selectedKeyframeId.value)
      if (selectedKf) {
        selectedKf.easing = easing
        return
      }
    }

    // 2. 否则找到当前播放头所在时间的关键帧
    const relTime = Math.max(0, Math.min(layer.duration, currentTime.value - layer.start))
    const matchingKeyframes = layer.keyframes.filter((k) => Math.abs(k.time - relTime) < 0.08)

    if (matchingKeyframes.length > 0) {
      matchingKeyframes.forEach((k) => {
        k.easing = easing
      })
    } else if (layer.keyframes.length > 0) {
      // 3. 若当前播放头不在关键帧上，更新当前图层内所有关键帧的缓动
      layer.keyframes.forEach((k) => {
        k.easing = easing
      })
    }
  }

  function addOrUpdateKeyframe(
    layerId: string,
    property: AnimatableProperty,
    value: number,
    easing: EasingType = 'easeInOut'
  ) {
    const layer = layers.value.find((l) => l.id === layerId)
    if (!layer) return
    commit()
    const relTime = Math.max(0, Math.min(layer.duration, currentTime.value - layer.start))
    const existing = layer.keyframes.find(
      (k) => k.property === property && Math.abs(k.time - relTime) < 0.05
    )
    if (existing) {
      existing.value = value
      existing.easing = easing
      selectedKeyframeId.value = existing.id
    } else {
      const newKfId = `kf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      layer.keyframes.push({
        id: newKfId,
        time: Number(relTime.toFixed(2)),
        property,
        value,
        easing,
      })
      selectedKeyframeId.value = newKfId
    }
  }

  function removeKeyframe(layerId: string, kfId: string) {
    const layer = layers.value.find((l) => l.id === layerId)
    if (!layer) return
    commit()
    layer.keyframes = layer.keyframes.filter((k) => k.id !== kfId)
    if (selectedKeyframeId.value === kfId) {
      selectedKeyframeId.value = null
    }
  }

  function syncAudio() {
    if (isPlaying.value) {
      for (const layer of layers.value) {
        if (layer.kind === 'audio' && layer.assetUrl && layer.visible) {
          if (currentTime.value >= layer.start && currentTime.value <= layer.start + layer.duration) {
            audioEngine.playLayer(layer.id, layer.assetUrl, currentTime.value - layer.start, layer.duration)
          } else {
            audioEngine.stopLayer(layer.id)
          }
        }
      }
    } else {
      audioEngine.stopAll()
    }
  }

  function setTime(time: number, forceSyncAudio = false) {
    currentTime.value = Math.max(0, Math.min(duration.value, Number(time.toFixed(3))))
    if (isPlaying.value && forceSyncAudio) {
      syncAudio()
    }
  }

  function setTimeFromPercent(value: number) {
    setTime((value / 100) * duration.value, true)
  }

  function togglePlay() {
    isPlaying.value = !isPlaying.value
    syncAudio()
  }

  function autoSaveProject() {
    try {
      const data = {
        version: '1.0.0',
        savedAt: new Date().toISOString(),
        duration: duration.value,
        backgroundConfig: backgroundConfig.value,
        activeJizuraStyleId: activeJizuraStyleId.value,
        layers: layers.value,
      }
      localStorage.setItem(PROJECT_STORAGE_KEY, JSON.stringify(data))
    } catch (e) {
      console.error('Failed to auto-save project', e)
    }
  }

  function loadAutoSavedProject(): boolean {
    try {
      const raw = localStorage.getItem(PROJECT_STORAGE_KEY)
      if (!raw) return false
      const data = JSON.parse(raw)
      const proj = data.project || data
      if (Array.isArray(proj.layers) && proj.layers.length > 0) {
        layers.value = proj.layers
        if (typeof proj.duration === 'number') duration.value = proj.duration
        if (proj.backgroundConfig) backgroundConfig.value = proj.backgroundConfig
        if (proj.activeJizuraStyleId) activeJizuraStyleId.value = proj.activeJizuraStyleId
        if (layers.value.length > 0) {
          selectedLayerId.value = layers.value[0].id
          selectedLayerIds.value = [layers.value[0].id]
        }
        return true
      }
    } catch (e) {
      console.error('Failed to load auto-saved project', e)
    }
    return false
  }

  // 尝试加载上一次自动保存的工程状态
  loadAutoSavedProject()

  // 监听工程核心状态变化自动持久化
  watch(
    [layers, duration, backgroundConfig, activeJizuraStyleId],
    () => {
      autoSaveProject()
    },
    { deep: true }
  )

  function exportProjectJSON() {
    return JSON.stringify(
      {
        version: '1.0.0',
        app: 'Night-Code Motion Design',
        exportedAt: new Date().toISOString(),
        duration: duration.value,
        backgroundConfig: backgroundConfig.value,
        activeJizuraStyleId: activeJizuraStyleId.value,
        layers: layers.value,
      },
      null,
      2
    )
  }

  function downloadProjectFile() {
    const jsonStr = exportProjectJSON()
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `night-code-project-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function importProjectJSON(jsonText: string): boolean {
    try {
      const data = JSON.parse(jsonText)
      const proj = data.project || data
      if (Array.isArray(proj.layers) && proj.layers.length > 0) {
        commit()
        layers.value = proj.layers
        if (typeof proj.duration === 'number') duration.value = proj.duration
        if (proj.backgroundConfig) backgroundConfig.value = proj.backgroundConfig
        if (proj.activeJizuraStyleId) activeJizuraStyleId.value = proj.activeJizuraStyleId
        currentTime.value = 0
        if (layers.value.length > 0) {
          selectedLayerId.value = layers.value[0].id
          selectedLayerIds.value = [layers.value[0].id]
        }
        autoSaveProject()
        return true
      }
    } catch (e) {
      console.error('Failed to parse project JSON', e)
    }
    return false
  }

  function resetProjectToDefault() {
    localStorage.removeItem(PROJECT_STORAGE_KEY)
    window.location.reload()
  }

  // 剪贴板图层存储
  const layerClipboard = ref<Layer[] | null>(null)

  function copySelectedLayers() {
    const targets = selectedLayers.value
    if (targets.length === 0) return
    layerClipboard.value = clone(targets)
  }

  function pasteLayers() {
    if (!layerClipboard.value || layerClipboard.value.length === 0) return
    commit()
    const pastedIds: string[] = []
    const pasteTime = Number(currentTime.value.toFixed(2))

    const newLayers: Layer[] = layerClipboard.value.map((src) => {
      const newId = `layer_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      pastedIds.push(newId)
      return {
        ...clone(src),
        id: newId,
        name: `${src.name} (副本)`,
        start: pasteTime,
        keyframes: (src.keyframes || []).map((kf) => ({
          ...kf,
          id: `kf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        })),
      }
    })

    layers.value.unshift(...newLayers)
    selectedLayerId.value = pastedIds[0]
    selectedLayerIds.value = pastedIds
  }

  function duplicateSelectedLayers() {
    copySelectedLayers()
    pasteLayers()
  }

  // 图层切割/剪切 (Split layer at current playhead time)
  function splitLayerAtCurrentTime(targetLayerId?: string) {
    const cutTime = Number(currentTime.value.toFixed(2))

    let targetsToSplit: Layer[] = []
    if (targetLayerId) {
      const l = layers.value.find((item) => item.id === targetLayerId)
      if (l) targetsToSplit = [l]
    } else if (selectedLayers.value.length > 0) {
      targetsToSplit = selectedLayers.value
    } else {
      targetsToSplit = layers.value.filter(
        (l) => cutTime > l.start + 0.1 && cutTime < l.start + l.duration - 0.1
      )
    }

    let hasSplitAny = false
    const newSelectedIds: string[] = []

    for (const target of targetsToSplit) {
      if (target.locked) continue
      if (cutTime <= target.start + 0.1 || cutTime >= target.start + target.duration - 0.1) {
        continue
      }

      if (!hasSplitAny) {
        commit()
        hasSplitAny = true
      }

      const leftDuration = Number((cutTime - target.start).toFixed(2))
      const rightStart = cutTime
      const rightDuration = Number((target.start + target.duration - cutTime).toFixed(2))

      const originalKfs = target.keyframes || []
      const leftKeyframes = originalKfs.filter((kf) => kf.time <= leftDuration)
      const rightKeyframes = originalKfs
        .filter((kf) => kf.time > leftDuration)
        .map((kf) => ({
          ...kf,
          id: `kf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          time: Number((kf.time - leftDuration).toFixed(2)),
        }))

      target.duration = leftDuration
      target.keyframes = leftKeyframes

      const rightLayerId = `layer_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
      const rightLayer: Layer = {
        ...clone(target),
        id: rightLayerId,
        name: `${target.name} (后半段)`,
        start: rightStart,
        duration: rightDuration,
        keyframes: rightKeyframes,
      }

      const index = layers.value.findIndex((l) => l.id === target.id)
      if (index !== -1) {
        layers.value.splice(index + 1, 0, rightLayer)
      } else {
        layers.value.unshift(rightLayer)
      }
      newSelectedIds.push(rightLayerId)
    }

    if (newSelectedIds.length > 0) {
      selectedLayerId.value = newSelectedIds[0]
      selectedLayerIds.value = newSelectedIds
    }
  }

  function updateBackgroundConfig(patch: Partial<BackgroundConfig>) {
    commit()
    Object.assign(backgroundConfig.value, patch)
  }

  function applyStyleToLayer(layer: Layer, style: any) {
    layer.styleId = style.id // 锁定该图层专属的风格主题 ID
    if (layer.kind === 'text') {
      layer.fontColor = style.scheme.fg
      layer.color = style.scheme.accent
      layer.textTreatment = style.defaultTreatment
      layer.treatAnim = style.defaultTreatment
      layer.textLayout = style.defaultLayout
      layer.layoutAnim = style.defaultLayout
      layer.treatmentColor = style.scheme.accent
      layer.treatmentColorB = style.scheme.accent2
      layer.animPreset = style.defaultPreset
      layer.enterAnim = style.defaultPreset
    } else if (layer.kind === 'background') {
      layer.bgPreset = style.backgroundType
      layer.bgType = style.backgroundType as BackgroundType
      layer.colorA = style.scheme.bg
      layer.colorB = style.scheme.accent
      layer.colorC = style.scheme.accent2
      layer.color = style.scheme.bg
    } else if (layer.kind === 'shape') {
      layer.blockColor = style.scheme.accent
      layer.color = style.scheme.accent
    }
  }

  function applyJizuraStyle(styleId: string, applyToAll = false) {
    const style = getJizuraStyle(styleId)
    if (!style) return
    commit()

    // 只有在明确指定 applyToAll 为 true 时才全局替换画板底色和全部图层
    if (applyToAll) {
      activeJizuraStyleId.value = styleId
      backgroundConfig.value = {
        ...getDefaultBackgroundConfig(style.backgroundType),
        colorA: style.scheme.bg,
        colorB: style.scheme.accent,
        colorC: style.scheme.accent2,
      }
      for (const layer of layers.value) {
        applyStyleToLayer(layer, style)
      }
      return
    }

    // 默认行为：只替换当前选中的一个或多个图层！
    let targets = selectedLayers.value.filter((l) => !l.locked)
    if (targets.length === 0 && selectedLayer.value && !selectedLayer.value.locked) {
      targets = [selectedLayer.value]
    }

    if (targets.length > 0) {
      for (const layer of targets) {
        applyStyleToLayer(layer, style)
      }
    }
  }

  function randomizeJizura() {
    const randomIndex = Math.floor(Math.random() * JIZURA_STYLES.length)
    const randomStyle = JIZURA_STYLES[randomIndex]
    applyJizuraStyle(randomStyle.id, true)
  }

  function toggleLeftPanel() {
    isLeftPanelCollapsed.value = !isLeftPanelCollapsed.value
  }

  function importLyricsToTimeline(
    lines: ParsedLyricLine[],
    options?: { clearExisting?: boolean; styleId?: string }
  ) {
    if (lines.length === 0) return
    commit()

    const chosenStyle = getJizuraStyle(options?.styleId || activeJizuraStyleId.value) || JIZURA_STYLES[0]
    activeJizuraStyleId.value = chosenStyle.id

    if (options?.clearExisting) {
      // 保留音频，清除其他视觉图层
      layers.value = layers.value.filter((l) => l.kind === 'audio')
    }

    // 自动更新画板背景
    backgroundConfig.value = {
      ...getDefaultBackgroundConfig(chosenStyle.backgroundType),
      colorA: chosenStyle.scheme.bg,
      colorB: chosenStyle.scheme.accent,
      colorC: chosenStyle.scheme.accent2,
    }

    let maxEndTime = duration.value

    // 倒序添加图层以保证图层堆叠顺序与视觉层级
    const newLayers: Layer[] = []
    const presets = ['pop-in', 'fade-up', 'slide-right', 'blur-in', 'bounce-drop']

    lines.forEach((line, idx) => {
      const id = `lyric-${Date.now()}-${idx}`
      const start = line.start !== undefined ? line.start : idx * 2.5
      const lineDuration = line.duration || 2.5
      const end = start + lineDuration
      if (end > maxEndTime) {
        maxEndTime = Number(end.toFixed(2))
      }

      const preset = presets[idx % presets.length]

      const fontSize = line.text.length > 15 ? 42 : line.text.length > 8 ? 52 : 64
      const estWidth = Math.max(240, Math.round(line.text.length * fontSize * 1.1 + 80))
      const estHeight = Math.round(fontSize * (line.subText ? 2.2 : 1.5) + 30)

      newLayers.push({
        id,
        name: `歌词 · ${line.text.slice(0, 10)}`,
        kind: 'text',
        color: chosenStyle.scheme.accent,
        start,
        duration: lineDuration,
        visible: true,
        locked: false,
        x: 960,
        y: 540,
        width: estWidth,
        height: estHeight,
        naturalWidth: estWidth,
        naturalHeight: estHeight,
        scale: 100,
        opacity: 100,
        rotation: 0,
        text: line.text,
        subText: line.subText,
        fontSize,
        fontColor: chosenStyle.scheme.fg,
        textPreset: preset as TextAnimPreset,
        animPreset: preset,
        textLayout: chosenStyle.defaultLayout,
        textTreatment: chosenStyle.defaultTreatment,
        treatmentColor: chosenStyle.scheme.accent,
        treatmentColorB: chosenStyle.scheme.accent2,
        keyframes: [],
      })
    })

    duration.value = Math.max(duration.value, Number((maxEndTime + 1).toFixed(1)))
    layers.value.unshift(...newLayers)
    if (newLayers.length > 0) {
      selectedLayerId.value = newLayers[0].id
    }
  }

  function openPresetDrawer(category: string) {
    activePresetDrawerCategory.value = category
  }

  function closePresetDrawer() {
    activePresetDrawerCategory.value = null
  }

  function toggleContinuousLyricTransition() {
    continuousLyricTransition.value = !continuousLyricTransition.value
  }

  return {
    currentTime,
    isPlaying,
    selectedLayerId,
    selectedLayerIds,
    selectedKeyframeId,
    isLeftPanelCollapsed,
    duration,
    zoom,
    showExportModal,
    showLyricModal,
    showJizuraExplorerModal,
    activePresetDrawerCategory,
    continuousLyricTransition,
    activeJizuraStyleId,
    backgroundConfig,
    leftWidth,
    rightWidth,
    presetDrawerWidth,
    bottomHeight,
    layers,
    selectedLayer,
    selectedLayers,
    progress,
    canUndo,
    canRedo,
    selectLayer,
    selectAllLayers,
    updateSelected,
    dragUpdatePosition,
    dragUpdateScale,
    beginInteraction,
    endInteraction,
    updateLayer,
    toggleVisibility,
    toggleLock,
    toggleLeftPanel,
    toggleContinuousLyricTransition,
    deleteLayer,
    reorderLayers,
    addTextLayer,
    addShapeLayer,
    addBackgroundLayer,
    addAssetLayer,
    addOrUpdateKeyframe,
    removeKeyframe,
    selectKeyframe,
    updateKeyframeEasing,
    updateCurrentTimeKeyframeEasing,
    updateBackgroundConfig,
    applyJizuraStyle,
    randomizeJizura,
    importLyricsToTimeline,
    openPresetDrawer,
    closePresetDrawer,
    setTime,
    setTimeFromPercent,
    togglePlay,
    undo,
    redo,
    exportProjectJSON,
    downloadProjectFile,
    importProjectJSON,
    resetProjectToDefault,
    resetLayoutSettings,
    copySelectedLayers,
    pasteLayers,
    duplicateSelectedLayers,
    splitLayerAtCurrentTime,
  }
})
