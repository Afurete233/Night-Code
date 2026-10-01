import type { LyricLayoutType, TextTreatmentType } from './jizura/lyrics'
import type { BackgroundConfig, BackgroundType } from './jizura/backgrounds'

export type { LyricLayoutType, TextTreatmentType, BackgroundConfig, BackgroundType }

export type EasingType =
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'bounceOut'
  | 'backOut'
  | 'elasticOut'

export type AnimatableProperty = 'x' | 'y' | 'scale' | 'scaleX' | 'scaleY' | 'opacity' | 'rotation' | 'textProgress'

export interface Keyframe {
  id: string
  time: number // 相对图层 start 的时间点 (秒)
  property: AnimatableProperty
  value: number
  easing?: EasingType
}

export type TextAnimPreset = 'none' | 'typewriter' | 'fade-up' | 'pop-in' | 'blur-in'

export type LayerKind = 'text' | 'image' | 'audio' | 'shape' | 'background'

export interface Layer {
  id: string
  name: string
  kind: LayerKind
  color: string
  start: number
  duration: number
  visible: boolean
  locked: boolean
  // 基础变换属性与尺寸
  x: number
  y: number
  width?: number // 实际当前渲染宽度 (像素 px)
  height?: number // 实际当前渲染高度 (像素 px)
  naturalWidth?: number // 原始固有宽度 (原图/未缩放像素)
  naturalHeight?: number // 原始固有高度 (原图/未缩放像素)
  scale: number // 百分比, 100 为原尺寸
  scaleX?: number // 水平独立缩放百分比 (不锁比例)
  scaleY?: number // 垂直独立缩放百分比 (不锁比例)
  lockAspectRatio?: boolean // 是否锁定等比缩放
  opacity: number // 0 - 100
  rotation: number // 度数
  // 内容属性
  text?: string
  subText?: string // 副文本 / 歌词翻译 / 注音
  fontSize?: number
  fontColor?: string
  textPreset?: TextAnimPreset
  animPreset?: string
  animPresetParams?: Record<string, any>
  useJizura?: boolean // 是否启用 JIZURA 动态文字与表现引擎
  styleId?: string // 图层专属 JIZURA 风格主题 ID (独立保存与渲染，不影响其他图层)
  // JIZURA 歌词 8 大核心要素
  layoutAnim?: string // 1. 布局 (Layout · 186 种)
  enterAnim?: string // 2. 入场 (Enter · 112 种)
  holdAnim?: string // 3. 保持 (Hold · 46 种)
  exitAnim?: string // 4. 退场 (Exit · 98 种)
  decorAnim?: string // 5. 装饰 (Decor · 130 种)
  treatAnim?: string // 6. 文字处理 (Treat · 62 种)
  camAnim?: string // 7. 运镜 (Cam · 36 种)
  transAnim?: string // 8. 转场 (Trans · 27 种)
  // JIZURA 排版与视觉修饰属性 (兼容字段)
  textLayout?: LyricLayoutType
  textTreatment?: TextTreatmentType
  treatmentColor?: string
  treatmentColorB?: string
  strokeWidth?: number
  shadowOffset?: number
  assetUrl?: string
  // 色块属性 (Shape / Solid Color Block)
  blockColor?: string
  blockWidth?: number
  blockHeight?: number
  borderRadius?: number
  // 背景图层属性 (Background Layer · 66 种)
  bgPreset?: string
  bgType?: BackgroundType
  colorA?: string
  colorB?: string
  colorC?: string
  gridDensity?: number
  scanlineOpacity?: number
  // 音频波形缓存点 (0~1)
  waveform?: number[]
  // 关键帧列表
  keyframes: Keyframe[]
}

export interface ComputedTransform {
  x: number
  y: number
  scale: number
  scaleX: number
  scaleY: number
  opacity: number
  rotation: number
  visible: boolean
  displayedText: string
  textProgress: number
}
