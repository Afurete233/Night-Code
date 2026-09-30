export type EasingType =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'bounceOut'
  | 'backOut'
  | 'elasticOut'

export type AnimatableProperty = 'x' | 'y' | 'scale' | 'opacity' | 'rotation' | 'textProgress'

export interface Keyframe {
  id: string
  time: number // 相对图层 start 的时间点 (秒)
  property: AnimatableProperty
  value: number
  easing?: EasingType
}

export type TextAnimPreset = 'none' | 'typewriter' | 'fade-up' | 'pop-in' | 'blur-in'

export type LayerKind = 'text' | 'image' | 'audio' | 'shape'

export interface Layer {
  id: string
  name: string
  kind: LayerKind
  color: string
  start: number
  duration: number
  visible: boolean
  locked: boolean
  // 基础变换属性
  x: number
  y: number
  scale: number // 百分比, 100 为原尺寸
  opacity: number // 0 - 100
  rotation: number // 度数
  // 内容属性
  text?: string
  fontSize?: number
  fontColor?: string
  textPreset?: TextAnimPreset
  assetUrl?: string
  // 音频波形缓存点 (0~1)
  waveform?: number[]
  // 关键帧列表
  keyframes: Keyframe[]
}

export interface ComputedTransform {
  x: number
  y: number
  scale: number
  opacity: number
  rotation: number
  visible: boolean
  displayedText: string
  textProgress: number
}
