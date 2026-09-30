import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { audioEngine } from '../engine/audio'
import type { AnimatableProperty, EasingType, Keyframe, Layer, LayerKind, TextAnimPreset } from '../engine/types'

export type { AnimatableProperty, EasingType, Keyframe, Layer, LayerKind, TextAnimPreset }

type Snapshot = {
  layers: Layer[]
  selectedLayerId: string
  currentTime: number
  duration: number
}

const DEFAULT_BG_IMAGE = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="960" height="540" viewBox="0 0 960 540"><defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%231e1b4b"/><stop offset="50%" stop-color="%23312e81"/><stop offset="100%" stop-color="%230f172a"/></linearGradient><linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%238b5cf6" stop-opacity="0.4"/><stop offset="100%" stop-color="%2306b6d4" stop-opacity="0.1"/></linearGradient></defs><rect width="960" height="540" rx="24" fill="url(%23g)"/><rect x="40" y="40" width="880" height="460" rx="16" fill="url(%23glow)" stroke="%236366f1" stroke-width="2" stroke-opacity="0.4"/><circle cx="700" cy="200" r="140" fill="%238b5cf6" fill-opacity="0.15"/><circle cx="280" cy="360" r="180" fill="%2306b6d4" fill-opacity="0.12"/><text x="480" y="270" fill="%2394a3b8" font-size="28" font-family="sans-serif" font-weight="bold" text-anchor="middle" letter-spacing="4">MOTION ARTBOARD</text></svg>`

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

export const useEditorStore = defineStore('editor', () => {
  const currentTime = ref(1.2)
  const isPlaying = ref(false)
  const selectedLayerId = ref('title')
  const duration = ref(10)
  const zoom = ref(80)
  const showExportModal = ref(false)

  // 布局尺寸状态 (弹性可调节)
  const leftWidth = ref(248)
  const rightWidth = ref(280)
  const bottomHeight = ref(280)

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
      scale: 100,
      opacity: 100,
      rotation: 0,
      text: 'Motion Sequences',
      fontSize: 58,
      fontColor: '#ffffff',
      textPreset: 'pop-in',
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
      scale: 100,
      opacity: 100,
      rotation: 0,
      text: 'Next-Gen Vector Motion Graphics',
      fontSize: 22,
      fontColor: '#94a3b8',
      textPreset: 'typewriter',
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
      scale: 100,
      opacity: 100,
      rotation: 0,
      keyframes: [],
      waveform: audioEngine.generateMockWaveform(120),
    },
  ])

  const past = ref<Snapshot[]>([])
  const future = ref<Snapshot[]>([])

  const selectedLayer = computed(() => {
    return layers.value.find((l) => l.id === selectedLayerId.value) ?? layers.value[0]
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
    }
  }

  function restore(value: Snapshot) {
    layers.value = clone(value.layers)
    selectedLayerId.value = value.selectedLayerId
    currentTime.value = value.currentTime
    duration.value = value.duration
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

  function selectLayer(id: string) {
    if (layers.value.some((layer) => layer.id === id)) {
      selectedLayerId.value = id
    }
  }

  function updateSelected(patch: Partial<Layer>) {
    if (!selectedLayer.value || selectedLayer.value.locked) return
    commit()
    Object.assign(selectedLayer.value, patch)
  }

  function updateLayer(id: string, patch: Partial<Layer>) {
    const target = layers.value.find((l) => l.id === id)
    if (!target) return
    commit()
    Object.assign(target, patch)
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
    layers.value.unshift({
      id,
      name: '新文字图层',
      kind: 'text',
      color: '#8b5cf6',
      start: currentTime.value,
      duration: 3.5,
      visible: true,
      locked: false,
      x: 960,
      y: 540,
      scale: 100,
      opacity: 100,
      rotation: 0,
      text: '创意线性动画',
      fontSize: 48,
      fontColor: '#ffffff',
      textPreset: 'fade-up',
      keyframes: [],
    })
    selectedLayerId.value = id
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
        })
        .catch(() => {
          newLayer.waveform = audioEngine.generateMockWaveform()
        })
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string
        if (dataUrl) {
          newLayer.assetUrl = dataUrl
        }
      }
      reader.readAsDataURL(file)
    }

    layers.value.unshift(newLayer)
    selectedLayerId.value = id
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

  function endInteraction() {
    // 保留 beginInteraction 创建的快照；此方法用于对称的交互生命周期。
  }


  // 关键帧管理
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
    } else {
      layer.keyframes.push({
        id: `kf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        time: Number(relTime.toFixed(2)),
        property,
        value,
        easing,
      })
    }
  }

  function removeKeyframe(layerId: string, kfId: string) {
    const layer = layers.value.find((l) => l.id === layerId)
    if (!layer) return
    commit()
    layer.keyframes = layer.keyframes.filter((k) => k.id !== kfId)
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

  function setTime(time: number) {
    currentTime.value = Math.max(0, Math.min(duration.value, Number(time.toFixed(2))))
    if (isPlaying.value) {
      syncAudio()
    }
  }

  function setTimeFromPercent(value: number) {
    setTime((value / 100) * duration.value)
  }

  function togglePlay() {
    isPlaying.value = !isPlaying.value
    syncAudio()
  }

  function exportProjectJSON() {
    return JSON.stringify(
      {
        version: '1.0.0',
        project: 'Frameflow Motion Design',
        duration: duration.value,
        layers: layers.value,
      },
      null,
      2
    )
  }

  function importProjectJSON(jsonText: string) {
    try {
      const data = JSON.parse(jsonText)
      if (Array.isArray(data.layers)) {
        commit()
        layers.value = data.layers
        if (data.duration) duration.value = data.duration
        currentTime.value = 0
        if (layers.value.length > 0) {
          selectedLayerId.value = layers.value[0].id
        }
      }
    } catch (e) {
      console.error('Failed to parse project JSON', e)
    }
  }

  return {
    currentTime,
    isPlaying,
    selectedLayerId,
    duration,
    zoom,
    showExportModal,
    leftWidth,
    rightWidth,
    bottomHeight,
    layers,
    selectedLayer,
    progress,
    canUndo,
    canRedo,
    selectLayer,
    updateSelected,
    dragUpdatePosition,
    beginInteraction,
    endInteraction,
    updateLayer,
    toggleVisibility,
    toggleLock,
    deleteLayer,
    addTextLayer,
    addAssetLayer,
    addOrUpdateKeyframe,
    removeKeyframe,
    setTime,
    setTimeFromPercent,
    togglePlay,
    undo,
    redo,
    exportProjectJSON,
    importProjectJSON,
  }
})
