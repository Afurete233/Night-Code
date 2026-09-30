import { evaluateEasing } from './easing'
import type { AnimatableProperty, ComputedTransform, Keyframe, Layer } from './types'

export function interpolateProperty(
  keyframes: Keyframe[],
  property: AnimatableProperty,
  layerTime: number,
  fallbackValue: number
): number {
  const filtered = keyframes
    .filter((k) => k.property === property)
    .sort((a, b) => a.time - b.time)

  if (filtered.length === 0) {
    return fallbackValue
  }

  // 早于第一个关键帧
  if (layerTime <= filtered[0].time) {
    return filtered[0].value
  }

  // 晚于最后一个关键帧
  const lastKf = filtered[filtered.length - 1]
  if (layerTime >= lastKf.time) {
    return lastKf.value
  }

  // 处于两个关键帧之间
  for (let i = 0; i < filtered.length - 1; i++) {
    const k0 = filtered[i]
    const k1 = filtered[i + 1]
    if (layerTime >= k0.time && layerTime <= k1.time) {
      const span = k1.time - k0.time
      const progress = span > 0 ? (layerTime - k0.time) / span : 1
      const easedT = evaluateEasing(k0.easing || 'easeInOut', progress)
      return k0.value + (k1.value - k0.value) * easedT
    }
  }

  return fallbackValue
}

export function computeLayerTransform(layer: Layer, globalTime: number): ComputedTransform {
  const isActive = globalTime >= layer.start && globalTime <= layer.start + layer.duration
  if (!isActive || !layer.visible) {
    return {
      x: layer.x,
      y: layer.y,
      scale: layer.scale,
      opacity: 0,
      rotation: layer.rotation,
      visible: false,
      displayedText: layer.text || '',
      textProgress: 100,
    }
  }

  const layerTime = globalTime - layer.start

  // 基础关键帧插值
  let x = interpolateProperty(layer.keyframes, 'x', layerTime, layer.x)
  let y = interpolateProperty(layer.keyframes, 'y', layerTime, layer.y)
  let scale = interpolateProperty(layer.keyframes, 'scale', layerTime, layer.scale)
  let opacity = interpolateProperty(layer.keyframes, 'opacity', layerTime, layer.opacity)
  let rotation = interpolateProperty(layer.keyframes, 'rotation', layerTime, layer.rotation)
  let textProgress = interpolateProperty(layer.keyframes, 'textProgress', layerTime, 100)

  let displayedText = layer.text || ''

  // 内置文字/MG动画预设的动态计算
  if (layer.kind === 'text') {
    const preset = layer.textPreset || 'none'
    const fullText = layer.text || ''

    if (preset === 'typewriter') {
      const animDuration = Math.min(2.0, layer.duration * 0.6)
      const ratio = Math.max(0, Math.min(1, layerTime / animDuration))
      const charCount = Math.floor(ratio * fullText.length)
      displayedText = fullText.slice(0, charCount)
      if (layerTime < animDuration && Math.floor(layerTime * 4) % 2 === 0) {
        displayedText += '▍' // 闪烁的光标
      }
    } else if (preset === 'fade-up') {
      const animDuration = 0.6
      if (layerTime < animDuration) {
        const t = layerTime / animDuration
        const eased = evaluateEasing('easeOut', t)
        opacity = (layer.opacity * eased)
        y += (1 - eased) * 40
      }
    } else if (preset === 'pop-in') {
      const animDuration = 0.5
      if (layerTime < animDuration) {
        const t = layerTime / animDuration
        const eased = evaluateEasing('backOut', t)
        scale = layer.scale * eased
        opacity = Math.min(layer.opacity, layer.opacity * (t * 2))
      }
    } else if (preset === 'blur-in') {
      const animDuration = 0.7
      if (layerTime < animDuration) {
        const t = layerTime / animDuration
        const eased = evaluateEasing('easeOut', t)
        opacity = layer.opacity * eased
        scale = layer.scale * (1.2 - 0.2 * eased)
      }
    }
  }

  return {
    x,
    y,
    scale,
    opacity,
    rotation,
    visible: opacity > 0.01,
    displayedText,
    textProgress,
  }
}
