import { evaluateEasing } from './easing'
import { applyMgPreset } from './presets'
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
  const baseScaleX = layer.scaleX !== undefined ? layer.scaleX : layer.scale
  const baseScaleY = layer.scaleY !== undefined ? layer.scaleY : layer.scale

  const isActive = globalTime >= layer.start && globalTime <= layer.start + layer.duration
  if (!isActive || !layer.visible) {
    return {
      x: layer.x,
      y: layer.y,
      scale: layer.scale,
      scaleX: baseScaleX,
      scaleY: baseScaleY,
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
  let scaleX = interpolateProperty(layer.keyframes, 'scaleX', layerTime, baseScaleX)
  let scaleY = interpolateProperty(layer.keyframes, 'scaleY', layerTime, baseScaleY)
  let opacity = interpolateProperty(layer.keyframes, 'opacity', layerTime, layer.opacity)
  let rotation = interpolateProperty(layer.keyframes, 'rotation', layerTime, layer.rotation)
  let textProgress = interpolateProperty(layer.keyframes, 'textProgress', layerTime, 100)

  if (scale !== layer.scale) {
    const scaleRatio = layer.scale ? scale / layer.scale : 1
    scaleX *= scaleRatio
    scaleY *= scaleRatio
  }

  let displayedText = layer.text || ''

  // 通用 MG 动画预设计算 (支持文字、图片、色块图层)
  const hasMgAnim = !!(
    (layer.animPreset && layer.animPreset !== 'none') ||
    (layer.textPreset && layer.textPreset !== 'none') ||
    (layer.enterAnim && layer.enterAnim !== 'none') ||
    (layer.holdAnim && layer.holdAnim !== 'none' && layer.holdAnim !== 'still') ||
    (layer.exitAnim && layer.exitAnim !== 'none' && layer.exitAnim !== 'cut') ||
    (layer.camAnim && layer.camAnim !== 'none')
  )

  const activePreset = layer.animPreset || layer.textPreset || layer.enterAnim || 'none'
  if (hasMgAnim) {
    const prevScale = scale
    const presetRes = applyMgPreset(activePreset, {
      layerTime,
      layerDuration: layer.duration,
      layer,
      customParams: layer.animPresetParams,
      baseTransform: {
        x,
        y,
        scale,
        scaleX,
        scaleY,
        opacity,
        rotation,
        displayedText,
      },
    })

    if (presetRes.x !== undefined) x = presetRes.x
    if (presetRes.y !== undefined) y = presetRes.y
    if (presetRes.scale !== undefined) {
      scale = presetRes.scale
      if (presetRes.scaleX === undefined && prevScale > 0) {
        scaleX *= scale / prevScale
      }
      if (presetRes.scaleY === undefined && prevScale > 0) {
        scaleY *= scale / prevScale
      }
    }
    if (presetRes.scaleX !== undefined) scaleX = presetRes.scaleX
    if (presetRes.scaleY !== undefined) scaleY = presetRes.scaleY
    if (presetRes.opacity !== undefined) opacity = presetRes.opacity
    if (presetRes.rotation !== undefined) rotation = presetRes.rotation
    if (presetRes.displayedText !== undefined) displayedText = presetRes.displayedText
  }

  return {
    x,
    y,
    scale,
    scaleX,
    scaleY,
    opacity,
    rotation,
    visible: opacity > 0.01,
    displayedText,
    textProgress,
  }
}
