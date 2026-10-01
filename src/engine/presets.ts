import { evaluateEasing } from './easing'
import type { Layer, LayerKind } from './types'
import jizuraData from './jizura/data.json'

export interface JizuraMotionItem {
  id: string
  name: string
  desc: string
  tags?: string[]
}

export interface MgPresetContext {
  layerTime: number
  layerDuration: number
  layer: Layer
  params: Record<string, any>
  baseTransform: {
    x: number
    y: number
    scale: number
    scaleX: number
    scaleY: number
    opacity: number
    rotation: number
    displayedText: string
  }
}

export interface MgPresetTransformResult {
  x?: number
  y?: number
  scale?: number
  scaleX?: number
  scaleY?: number
  opacity?: number
  rotation?: number
  displayedText?: string
}

/**
 * 获取 JIZURA 全量动效字典列表
 */
export function getJizuraEnterMotions(): JizuraMotionItem[] {
  return Object.values(jizuraData.categories.enter as Record<string, JizuraMotionItem>)
}

export function getJizuraHoldMotions(): JizuraMotionItem[] {
  return Object.values(jizuraData.categories.hold as Record<string, JizuraMotionItem>)
}

export function getJizuraExitMotions(): JizuraMotionItem[] {
  return Object.values(jizuraData.categories.exit as Record<string, JizuraMotionItem>)
}

export function getJizuraCamMotions(): JizuraMotionItem[] {
  return Object.values(jizuraData.categories.cam as Record<string, JizuraMotionItem>)
}

export function getJizuraTransMotions(): JizuraMotionItem[] {
  return Object.values(jizuraData.categories.trans as Record<string, JizuraMotionItem>)
}

export function getJizuraLayouts(): JizuraMotionItem[] {
  return Object.values(jizuraData.categories.layout as Record<string, JizuraMotionItem>)
}

export function getJizuraDecors(): JizuraMotionItem[] {
  return Object.values(jizuraData.categories.decor as Record<string, JizuraMotionItem>)
}

export function getJizuraTreats(): JizuraMotionItem[] {
  return Object.values(jizuraData.categories.treat as Record<string, JizuraMotionItem>)
}

export function getJizuraBgs(): JizuraMotionItem[] {
  return Object.values(jizuraData.categories.bg as Record<string, JizuraMotionItem>)
}

/**
 * 经典组合预设 (JIZURA Combo Presets)
 */
export interface MgComboPresetDef {
  id: string
  name: string
  desc: string
  category: 'pop' | 'cyber' | 'minimal' | 'wa' | 'horror' | 'kinetic'
  enter: string
  hold: string
  exit: string
  targetKinds?: LayerKind[]
}

export const JIZURA_COMBO_PRESETS: MgComboPresetDef[] = [
  {
    id: 'pop-bounce',
    name: '波普弹跳组合 (Pop & Bounce)',
    desc: 'Q弹入场 + 脉冲呼吸 + 爆散退场',
    category: 'pop',
    enter: 'pop',
    hold: 'breathe',
    exit: 'explode',
  },
  {
    id: 'cyber-glitch',
    name: '赛博故障组合 (Cyber Glitch)',
    desc: '乱码解码 + 高频抖动 + 故障方块崩解',
    category: 'cyber',
    enter: 'scramble',
    hold: 'jitter',
    exit: 'glitch',
  },
  {
    id: 'wa-elegant',
    name: '和风流光组合 (Wa Elegance)',
    desc: '由下浮现 + 柔和摇曳 + 雾散退场',
    category: 'wa',
    enter: 'riseMask',
    hold: 'sway',
    exit: 'drift',
  },
  {
    id: 'kinetic-slam',
    name: '动感重击组合 (Kinetic Slam)',
    desc: '逐词重击 + 随拍心跳 + 急甩推出',
    category: 'kinetic',
    enter: 'knWordSlam',
    hold: 'beatHop',
    exit: 'knWordKick',
  },
  {
    id: 'editorial-fade',
    name: '杂志极简组合 (Editorial Float)',
    desc: '上浮淡入 + 悬浮微漂 + 划线删除',
    category: 'minimal',
    enter: 'fadeStagger',
    hold: 'float',
    exit: 'tyStrike',
  },
  {
    id: 'drop-bounce',
    name: '跌落下落组合 (Drop & Fall)',
    desc: '高处下落回弹 + 果冻微动 + 重力坠落',
    category: 'pop',
    enter: 'drop',
    hold: 'jelly',
    exit: 'fall',
  },
  {
    id: 'spin-zoom',
    name: '旋转冲刺组合 (Spin & Zoom)',
    desc: '逆时针旋转入场 + 缓慢自转 + 旋转飞出',
    category: 'kinetic',
    enter: 'spin',
    hold: 'rotateSlow',
    exit: 'spinOut',
  },
  {
    id: 'type-terminal',
    name: '极客打字机组合 (Type & Backspace)',
    desc: '逐字打字显现 + 打字微震 + 退格删除',
    category: 'cyber',
    enter: 'type',
    hold: 'typeRattle',
    exit: 'backspace',
    targetKinds: ['text'],
  },
  {
    id: 'horror-creepy',
    name: '惊悚异象组合 (Horror Uneasy)',
    desc: '眨眼闪现 + 烛火闪烁 + 拖入黑暗',
    category: 'horror',
    enter: 'hrJumpScare',
    hold: 'glowFlicker',
    exit: 'hrPulledDown',
  },
  {
    id: 'stretch-rubber',
    name: '橡皮筋拉伸组合 (Rubber & Snap)',
    desc: '弹性拉伸入场 + 随拍拉伸 + 压扁收缩',
    category: 'kinetic',
    enter: 'rubber',
    hold: 'stretchPulse',
    exit: 'squash',
  },
]

/**
 * ============================================================================
 * JIZURA 动态入场求值器 (Enter Evaluator)
 * ============================================================================
 */
export function evaluateJizuraEnter(
  enterId: string,
  ctx: MgPresetContext,
  enterDuration = 0.6
): MgPresetTransformResult {
  const { layerTime, baseTransform, params } = ctx
  const dur = Number(params.enterDuration) || enterDuration
  if (layerTime >= dur) return {}

  const t = Math.max(0, Math.min(1, layerTime / dur))
  const intensity = (Number(params.motionIntensity) ?? 100) / 100

  switch (enterId) {
    case 'pop':
    case 'pop-in': {
      const e = evaluateEasing('backOut', t)
      return {
        scale: baseTransform.scale * e,
        opacity: Math.min(baseTransform.opacity, baseTransform.opacity * (t * 2.5)),
      }
    }
    case 'riseMask':
    case 'fade-up': {
      const e = evaluateEasing('easeOut', t)
      return {
        y: baseTransform.y + (1 - e) * 60 * intensity,
        opacity: baseTransform.opacity * e,
      }
    }
    case 'dropMask':
    case 'drop':
    case 'bounceBig': {
      const e = evaluateEasing('bounceOut', t)
      return {
        y: baseTransform.y - (1 - e) * 140 * intensity,
        opacity: baseTransform.opacity * Math.min(1, t * 3),
      }
    }
    case 'slideL':
    case 'slideWhole':
    case 'slide-right': {
      const e = evaluateEasing('easeOut', t)
      return {
        x: baseTransform.x - (1 - e) * 200 * intensity,
        opacity: baseTransform.opacity * e,
      }
    }
    case 'slideR': {
      const e = evaluateEasing('easeOut', t)
      return {
        x: baseTransform.x + (1 - e) * 200 * intensity,
        opacity: baseTransform.opacity * e,
      }
    }
    case 'whip':
    case 'slingshot': {
      const e = evaluateEasing('backOut', t)
      return {
        x: baseTransform.x - (1 - e) * 350 * intensity,
        scaleX: baseTransform.scaleX * (1 + (1 - t) * 0.8),
        opacity: baseTransform.opacity * e,
      }
    }
    case 'spin':
    case 'spin-in':
    case 'rollIn': {
      const eS = evaluateEasing('backOut', t)
      const eR = evaluateEasing('easeOut', t)
      return {
        rotation: baseTransform.rotation - (1 - eR) * 180 * intensity,
        scale: baseTransform.scale * eS,
        opacity: baseTransform.opacity * Math.min(1, t * 2.5),
      }
    }
    case 'flipX': {
      const e = evaluateEasing('backOut', t)
      return {
        scaleX: baseTransform.scaleX * Math.abs(Math.sin((t * Math.PI) / 2)),
        scale: baseTransform.scale * e,
        opacity: baseTransform.opacity * e,
      }
    }
    case 'flipY': {
      const e = evaluateEasing('backOut', t)
      return {
        scaleY: baseTransform.scaleY * Math.abs(Math.sin((t * Math.PI) / 2)),
        scale: baseTransform.scale * e,
        opacity: baseTransform.opacity * e,
      }
    }
    case 'blur':
    case 'blur-in':
    case 'zoomOut': {
      const e = evaluateEasing('easeOut', t)
      return {
        scale: baseTransform.scale * (1.35 - 0.35 * e),
        opacity: baseTransform.opacity * e,
      }
    }
    case 'rubber':
    case 'stretch': {
      const e = evaluateEasing('elasticOut', t)
      return {
        scaleX: baseTransform.scaleX * (1 + (1 - t) * 0.9 * intensity),
        scaleY: baseTransform.scaleY * (0.4 + 0.6 * e),
        opacity: baseTransform.opacity * Math.min(1, t * 3),
      }
    }
    case 'type':
    case 'typewriter': {
      const full = ctx.layer.text || ''
      const count = Math.floor(t * full.length)
      const cursor = params.cursorChar !== undefined ? (params.cursorChar === 'none' ? '' : String(params.cursorChar)) : '▍'
      let displayed = full.slice(0, count)
      if (cursor && t < 1 && Math.floor(layerTime * 4) % 2 === 0) {
        displayed += cursor
      }
      return {
        displayedText: displayed,
      }
    }
    case 'scramble':
    case 'glitchIn':
    case 'resolve': {
      const rndX = (Math.random() - 0.5) * 20 * (1 - t) * intensity
      const rndY = (Math.random() - 0.5) * 10 * (1 - t) * intensity
      const flicker = Math.random() > 0.15 ? 1 : 0.2
      return {
        x: baseTransform.x + rndX,
        y: baseTransform.y + rndY,
        opacity: baseTransform.opacity * t * flicker,
      }
    }
    case 'knWordSlam':
    case 'knTypeToSlam': {
      const e = evaluateEasing('bounceOut', t)
      return {
        scale: baseTransform.scale * (2.2 - 1.2 * e),
        opacity: baseTransform.opacity * Math.min(1, t * 4),
      }
    }
    case 'hrJumpScare':
    case 'hrBlinkCreep': {
      const blink = Math.floor(layerTime * 8) % 2 === 0 && t < 0.6 ? 0 : 1
      return {
        scale: baseTransform.scale * (t < 0.5 ? 1.4 : 1.0),
        opacity: baseTransform.opacity * blink,
      }
    }
    default: {
      const e = evaluateEasing('easeOut', t)
      return {
        opacity: baseTransform.opacity * e,
        y: baseTransform.y + (1 - e) * 30,
      }
    }
  }
}

/**
 * ============================================================================
 * JIZURA 持续保持/微动求值器 (Hold Evaluator)
 * ============================================================================
 */
export function evaluateJizuraHold(
  holdId: string,
  ctx: MgPresetContext
): MgPresetTransformResult {
  const { layerTime, baseTransform, params } = ctx
  const intensity = (Number(params.motionIntensity) ?? 100) / 100

  switch (holdId) {
    case 'still':
    case 'none':
      return {}
    case 'breathe':
    case 'pulse': {
      const s = 1 + Math.sin(layerTime * 3) * 0.04 * intensity
      return {
        scale: baseTransform.scale * s,
      }
    }
    case 'float':
    case 'drift': {
      const dy = Math.sin(layerTime * 2.2) * 12 * intensity
      const dx = Math.cos(layerTime * 1.5) * 8 * intensity
      return {
        x: baseTransform.x + dx,
        y: baseTransform.y + dy,
      }
    }
    case 'sway':
    case 'dangle':
    case 'swing': {
      const angle = Math.sin(layerTime * 3.5) * 6 * intensity
      return {
        rotation: baseTransform.rotation + angle,
      }
    }
    case 'jitter':
    case 'glitchtick': {
      const glitch = Math.random() < 0.12
      if (glitch) {
        return {
          x: baseTransform.x + (Math.random() - 0.5) * 16 * intensity,
          y: baseTransform.y + (Math.random() - 0.5) * 8 * intensity,
        }
      }
      return {}
    }
    case 'beatHop':
    case 'heartbeat': {
      const beat = Math.pow(Math.sin(layerTime * Math.PI * 2), 6) * 0.08 * intensity
      return {
        scale: baseTransform.scale * (1 + beat),
        y: baseTransform.y - beat * 40,
      }
    }
    case 'rotateSlow': {
      return {
        rotation: baseTransform.rotation + ((layerTime * 15 * intensity) % 360),
      }
    }
    case 'jelly': {
      const sx = 1 + Math.sin(layerTime * 5) * 0.06 * intensity
      const sy = 1 - Math.sin(layerTime * 5) * 0.06 * intensity
      return {
        scaleX: baseTransform.scaleX * sx,
        scaleY: baseTransform.scaleY * sy,
      }
    }
    case 'glowFlicker':
    case 'shimmer': {
      const flicker = 0.85 + Math.random() * 0.15
      return {
        opacity: baseTransform.opacity * flicker,
      }
    }
    default:
      return {}
  }
}

/**
 * ============================================================================
 * JIZURA 退场求值器 (Exit Evaluator)
 * ============================================================================
 */
export function evaluateJizuraExit(
  exitId: string,
  ctx: MgPresetContext,
  exitDuration = 0.5
): MgPresetTransformResult {
  const { layerTime, layerDuration, baseTransform, params } = ctx
  const dur = Number(params.exitDuration) || exitDuration
  const exitStart = layerDuration - dur
  if (layerTime < exitStart) return {}

  const t = Math.max(0, Math.min(1, (layerTime - exitStart) / dur))
  const intensity = (Number(params.motionIntensity) ?? 100) / 100

  switch (exitId) {
    case 'cut':
    case 'none':
      return t >= 1 ? { opacity: 0 } : {}
    case 'fall':
    case 'gravity': {
      const e = evaluateEasing('easeIn', t)
      return {
        y: baseTransform.y + e * 180 * intensity,
        opacity: baseTransform.opacity * (1 - e),
      }
    }
    case 'explode':
    case 'popOut':
    case 'scatter': {
      const e = evaluateEasing('easeOut', t)
      return {
        scale: baseTransform.scale * (1 + e * 0.8 * intensity),
        opacity: baseTransform.opacity * (1 - e),
      }
    }
    case 'shrink':
    case 'collapse':
    case 'vacuumOut': {
      const e = evaluateEasing('easeIn', t)
      return {
        scale: baseTransform.scale * Math.max(0, 1 - e),
        opacity: baseTransform.opacity * (1 - e),
      }
    }
    case 'blur':
    case 'drift': {
      const e = evaluateEasing('easeOut', t)
      return {
        scale: baseTransform.scale * (1 + e * 0.3),
        opacity: baseTransform.opacity * (1 - e),
      }
    }
    case 'slideOutL':
    case 'whipOut':
    case 'knPushOut': {
      const e = evaluateEasing('easeIn', t)
      return {
        x: baseTransform.x - e * 300 * intensity,
        opacity: baseTransform.opacity * (1 - e),
      }
    }
    case 'slideOutR':
    case 'knWordKick': {
      const e = evaluateEasing('easeIn', t)
      return {
        x: baseTransform.x + e * 300 * intensity,
        opacity: baseTransform.opacity * (1 - e),
      }
    }
    case 'spinOut':
    case 'twist': {
      const e = evaluateEasing('easeIn', t)
      return {
        rotation: baseTransform.rotation + e * 240 * intensity,
        scale: baseTransform.scale * (1 - e),
        opacity: baseTransform.opacity * (1 - e),
      }
    }
    case 'riseOut': {
      const e = evaluateEasing('easeIn', t)
      return {
        y: baseTransform.y - e * 120 * intensity,
        opacity: baseTransform.opacity * (1 - e),
      }
    }
    case 'glitch':
    case 'scrambleOut': {
      const jitter = (Math.random() - 0.5) * 30 * t * intensity
      return {
        x: baseTransform.x + jitter,
        opacity: Math.random() > t ? baseTransform.opacity * (1 - t) : 0,
      }
    }
    case 'squash': {
      const e = evaluateEasing('easeIn', t)
      return {
        scaleY: baseTransform.scaleY * Math.max(0.05, 1 - e),
        scaleX: baseTransform.scaleX * (1 + e * 0.6),
        opacity: baseTransform.opacity * (1 - e),
      }
    }
    case 'backspace':
    case 'tyStrike': {
      const full = ctx.layer.text || ''
      const remain = Math.floor((1 - t) * full.length)
      return {
        displayedText: full.slice(0, remain),
        opacity: t >= 1 ? 0 : baseTransform.opacity,
      }
    }
    case 'hrPulledDown': {
      const e = evaluateEasing('easeIn', t)
      return {
        y: baseTransform.y + e * 220,
        scaleX: baseTransform.scaleX * (1 - e * 0.4),
        opacity: baseTransform.opacity * (1 - e),
      }
    }
    default: {
      const e = evaluateEasing('easeIn', t)
      return {
        opacity: baseTransform.opacity * (1 - e),
      }
    }
  }
}

/**
 * ============================================================================
 * JIZURA 运镜求值器 (Camera Evaluator)
 * ============================================================================
 */
export function evaluateJizuraCamera(
  camId: string,
  ctx: MgPresetContext
): MgPresetTransformResult {
  const { layerTime, layerDuration, baseTransform } = ctx
  const progress = layerDuration > 0 ? layerTime / layerDuration : 0

  switch (camId) {
    case 'push':
    case 'dollyIn':
      return {
        scale: baseTransform.scale * (1 + progress * 0.15),
      }
    case 'pullOut':
      return {
        scale: baseTransform.scale * (1.15 - progress * 0.15),
      }
    case 'orbitDrift':
      return {
        x: baseTransform.x + Math.cos(layerTime * 1.5) * 16,
        y: baseTransform.y + Math.sin(layerTime * 1.5) * 16,
      }
    case 'barrelRoll':
      return {
        rotation: baseTransform.rotation + Math.sin(layerTime * 2) * 6,
      }
    case 'pendulumSway':
      return {
        rotation: baseTransform.rotation + Math.sin(layerTime * 2.8) * 5,
      }
    case 'earthquake':
    case 'shakeHard':
      return {
        x: baseTransform.x + (Math.random() - 0.5) * 18,
        y: baseTransform.y + (Math.random() - 0.5) * 12,
      }
    case 'bounce':
      return {
        y: baseTransform.y + Math.abs(Math.sin(layerTime * 5)) * -22,
      }
    case 'panL':
      return {
        x: baseTransform.x - progress * 80,
      }
    case 'panR':
      return {
        x: baseTransform.x + progress * 80,
      }
    case 'tiltDown':
      return {
        y: baseTransform.y + progress * 40,
      }
    case 'tiltUp':
      return {
        y: baseTransform.y - progress * 40,
      }
    default:
      return {}
  }
}

/**
 * 核心统一动画求值函数：自动串联 Enter -> Hold -> Exit -> Cam 与 JIZURA 组合
 */
export function applyMgPreset(
  presetId: string,
  ctx: {
    layerTime: number
    layerDuration: number
    layer: Layer
    customParams?: Record<string, any>
    baseTransform: {
      x: number
      y: number
      scale: number
      scaleX: number
      scaleY: number
      opacity: number
      rotation: number
      displayedText: string
    }
  }
): MgPresetTransformResult {
  const layer = ctx.layer
  const params = ctx.customParams || layer.animPresetParams || {}

  // 检查组合预设
  const combo = JIZURA_COMBO_PRESETS.find((c) => c.id === presetId)

  // 确定入场/保持/退场/运镜 ID
  const enterId = layer.enterAnim || combo?.enter || presetId || 'fade-up'
  const holdId = layer.holdAnim || combo?.hold || 'breathe'
  const exitId = layer.exitAnim || combo?.exit || 'fall'
  const camId = layer.camAnim || ''

  const fullCtx: MgPresetContext = {
    ...ctx,
    params,
  }

  let resX = ctx.baseTransform.x
  let resY = ctx.baseTransform.y
  let resScale = ctx.baseTransform.scale
  let resScaleX = ctx.baseTransform.scaleX
  let resScaleY = ctx.baseTransform.scaleY
  let resOpacity = ctx.baseTransform.opacity
  let resRotation = ctx.baseTransform.rotation
  let resDisplayed = ctx.baseTransform.displayedText

  // 1. 运镜效果 (Camera)
  if (camId) {
    const camRes = evaluateJizuraCamera(camId, fullCtx)
    if (camRes.x !== undefined) resX = camRes.x
    if (camRes.y !== undefined) resY = camRes.y
    if (camRes.scale !== undefined) resScale = camRes.scale
    if (camRes.rotation !== undefined) resRotation = camRes.rotation
  }

  // 2. 持续 Hold 微动
  if (holdId && holdId !== 'none' && holdId !== 'still') {
    const holdRes = evaluateJizuraHold(holdId, { ...fullCtx, baseTransform: { ...ctx.baseTransform, x: resX, y: resY, scale: resScale, scaleX: resScaleX, scaleY: resScaleY, opacity: resOpacity, rotation: resRotation, displayedText: resDisplayed } })
    if (holdRes.x !== undefined) resX = holdRes.x
    if (holdRes.y !== undefined) resY = holdRes.y
    if (holdRes.scale !== undefined) resScale = holdRes.scale
    if (holdRes.scaleX !== undefined) resScaleX = holdRes.scaleX
    if (holdRes.scaleY !== undefined) resScaleY = holdRes.scaleY
    if (holdRes.opacity !== undefined) resOpacity = holdRes.opacity
    if (holdRes.rotation !== undefined) resRotation = holdRes.rotation
  }

  // 3. 入场动效 (Enter)
  const enterDur = Number(params.enterDuration) || 0.6
  if (ctx.layerTime < enterDur && enterId && enterId !== 'cut' && enterId !== 'none') {
    const enterRes = evaluateJizuraEnter(enterId, { ...fullCtx, baseTransform: { ...ctx.baseTransform, x: resX, y: resY, scale: resScale, scaleX: resScaleX, scaleY: resScaleY, opacity: resOpacity, rotation: resRotation, displayedText: resDisplayed } }, enterDur)
    if (enterRes.x !== undefined) resX = enterRes.x
    if (enterRes.y !== undefined) resY = enterRes.y
    if (enterRes.scale !== undefined) resScale = enterRes.scale
    if (enterRes.scaleX !== undefined) resScaleX = enterRes.scaleX
    if (enterRes.scaleY !== undefined) resScaleY = enterRes.scaleY
    if (enterRes.opacity !== undefined) resOpacity = enterRes.opacity
    if (enterRes.rotation !== undefined) resRotation = enterRes.rotation
    if (enterRes.displayedText !== undefined) resDisplayed = enterRes.displayedText
  }

  // 4. 退场动效 (Exit)
  const exitDur = Number(params.exitDuration) || 0.5
  const exitStart = ctx.layerDuration - exitDur
  if (ctx.layerTime >= exitStart && exitId && exitId !== 'cut' && exitId !== 'none') {
    const exitRes = evaluateJizuraExit(exitId, { ...fullCtx, baseTransform: { ...ctx.baseTransform, x: resX, y: resY, scale: resScale, scaleX: resScaleX, scaleY: resScaleY, opacity: resOpacity, rotation: resRotation, displayedText: resDisplayed } }, exitDur)
    if (exitRes.x !== undefined) resX = exitRes.x
    if (exitRes.y !== undefined) resY = exitRes.y
    if (exitRes.scale !== undefined) resScale = exitRes.scale
    if (exitRes.scaleX !== undefined) resScaleX = exitRes.scaleX
    if (exitRes.scaleY !== undefined) resScaleY = exitRes.scaleY
    if (exitRes.opacity !== undefined) resOpacity = exitRes.opacity
    if (exitRes.rotation !== undefined) resRotation = exitRes.rotation
    if (exitRes.displayedText !== undefined) resDisplayed = exitRes.displayedText
  }

  return {
    x: resX,
    y: resY,
    scale: resScale,
    scaleX: resScaleX,
    scaleY: resScaleY,
    opacity: resOpacity,
    rotation: resRotation,
    displayedText: resDisplayed,
  }
}
