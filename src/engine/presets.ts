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

export function isEnterPreset(id: string): boolean {
  const enterIds = [
    'pop', 'pop-in', 'q-bounce', 'jelly-pop', 'jelly-in',
    'line-bounce', 'squash-line', 'squash-stretch', 'jelly-deform', 'wave-bounce', 'elastic-snap',
    'riseMask', 'fade-up', 'dropMask', 'drop', 'bounceBig', 'bounce-drop', 'spring-drop',
    'slideL', 'slideWhole', 'slide-right', 'slideR', 'slide-left', 'slide-down',
    'whip', 'whip-in', 'slingshot', 'spin', 'spin-in', 'rollIn', 'twister',
    'flipX', 'flip-x', 'flipY', 'flip-y', 'blur', 'blur-in', 'zoomOut',
    'rubber', 'rubber-in', 'stretch', 'type', 'typewriter',
    'scramble', 'glitchIn', 'glitch-in', 'resolve', 'knWordSlam', 'knTypeToSlam',
    'hrJumpScare', 'hrBlinkCreep'
  ]
  return enterIds.includes(id)
}

export function isHoldPreset(id: string): boolean {
  const holdIds = [
    'breathe', 'pulse', 'q-jelly', 'jelly', 'pulse-squeeze', 'float', 'drift',
    'sway', 'dangle', 'swing', 'jitter', 'glitchtick', 'beatHop', 'beat-hop',
    'heartbeat', 'rotateSlow', 'rotate-slow', 'glowFlicker', 'shimmer'
  ]
  return holdIds.includes(id)
}

export function isExitPreset(id: string): boolean {
  const exitIds = [
    'fall', 'gravity', 'explode', 'popOut', 'scatter', 'shrink', 'collapse',
    'vacuumOut', 'blur', 'drift', 'slideOutL', 'slide-out-left', 'whipOut',
    'knPushOut', 'slideOutR', 'slide-out-right', 'knWordKick', 'spinOut',
    'twist', 'riseOut', 'glitch', 'scrambleOut', 'squash', 'squash-out',
    'backspace', 'tyStrike', 'hrPulledDown'
  ]
  return exitIds.includes(id)
}

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
  const dur = Number(params.duration) || Number(params.enterDuration) || enterDuration
  if (layerTime >= dur) return {}

  const t = Math.max(0, Math.min(1, layerTime / dur))
  const intensity = (Number(params.motionIntensity) ?? 100) / 100
  const dist = Number(params.distance) ?? 60

  switch (enterId) {
    case 'pop':
    case 'pop-in':
    case 'q-bounce': {
      const e = evaluateEasing('elasticOut', t)
      const squash = Math.sin(t * Math.PI * 3) * Math.exp(-t * 4) * 0.25 * intensity
      return {
        scale: baseTransform.scale * e,
        scaleX: baseTransform.scaleX * e * (1 + squash),
        scaleY: baseTransform.scaleY * e * (1 - squash),
        opacity: Math.min(baseTransform.opacity, baseTransform.opacity * (t * 3.5)),
      }
    }
    case 'jelly-pop':
    case 'jelly-in': {
      const e = evaluateEasing('elasticOut', t)
      const deform = Math.sin(t * Math.PI * 4) * Math.exp(-t * 3.5) * 0.45 * intensity
      return {
        scale: baseTransform.scale * e,
        scaleX: baseTransform.scaleX * Math.max(0.01, e + deform),
        scaleY: baseTransform.scaleY * Math.max(0.01, e - deform),
        opacity: Math.min(baseTransform.opacity, baseTransform.opacity * (t * 4)),
      }
    }
    case 'line-bounce':
    case 'squash-line': {
      // 挤压弹线动画：强烈横向拉伸变扁，随后沿弹线高频震荡回弹
      const e = evaluateEasing('elasticOut', t)
      const lineWave = Math.sin(t * Math.PI * 4.5) * Math.exp(-t * 3.8) * 0.75 * intensity
      const bounceY = Math.abs(Math.sin(t * Math.PI * 3)) * (1 - t) * -22 * intensity
      return {
        scale: baseTransform.scale * Math.min(1, t * 2.2),
        scaleX: baseTransform.scaleX * Math.max(0.05, e + lineWave),
        scaleY: baseTransform.scaleY * Math.max(0.05, e - lineWave * 0.6),
        y: baseTransform.y + bounceY,
        opacity: Math.min(baseTransform.opacity, baseTransform.opacity * (t * 4)),
      }
    }
    case 'squash-stretch': {
      // 弹性挤压拉伸：纵向拉伸到落地挤压扁平，再弹起归位
      const e = evaluateEasing('elasticOut', t)
      const stretch = Math.cos(t * Math.PI * 3.5) * Math.exp(-t * 3.5) * 0.65 * intensity
      return {
        scale: baseTransform.scale * Math.min(1, t * 2.5),
        scaleX: baseTransform.scaleX * Math.max(0.05, e - stretch),
        scaleY: baseTransform.scaleY * Math.max(0.05, e + stretch),
        opacity: Math.min(baseTransform.opacity, baseTransform.opacity * (t * 4)),
      }
    }
    case 'jelly-deform': {
      // 果冻波浪变形：高频果冻软体波浪变形
      const e = evaluateEasing('easeOut', t)
      const deformX = Math.sin(t * Math.PI * 5) * Math.exp(-t * 3) * 0.5 * intensity
      const deformY = Math.cos(t * Math.PI * 5) * Math.exp(-t * 3) * 0.5 * intensity
      return {
        scaleX: baseTransform.scaleX * Math.max(0.05, e + deformX),
        scaleY: baseTransform.scaleY * Math.max(0.05, e + deformY),
        opacity: baseTransform.opacity * e,
      }
    }
    case 'wave-bounce':
    case 'elastic-snap': {
      // 波浪弹线甩动：结合旋转倾斜与弹线形变
      const e = evaluateEasing('elasticOut', t)
      const rot = Math.sin(t * Math.PI * 4) * Math.exp(-t * 3) * 18 * intensity
      const wave = Math.sin(t * Math.PI * 4) * Math.exp(-t * 3) * 0.45 * intensity
      return {
        rotation: baseTransform.rotation + rot,
        scaleX: baseTransform.scaleX * Math.max(0.05, e + wave),
        scaleY: baseTransform.scaleY * Math.max(0.05, e - wave),
        opacity: baseTransform.opacity * Math.min(1, t * 3.5),
      }
    }
    case 'riseMask':
    case 'fade-up': {
      const e = evaluateEasing('easeOut', t)
      return {
        y: baseTransform.y + (1 - e) * dist * intensity,
        opacity: baseTransform.opacity * e,
      }
    }
    case 'dropMask':
    case 'drop':
    case 'bounceBig':
    case 'bounce-drop':
    case 'spring-drop': {
      const e = evaluateEasing('bounceOut', t)
      const dropDist = dist * 2.2 * intensity
      const impactSquash = t > 0.4 ? Math.sin(t * Math.PI * 3) * Math.exp(-t * 3) * 0.25 * intensity : 0
      return {
        y: baseTransform.y - (1 - e) * dropDist,
        scaleX: baseTransform.scaleX * (1 + impactSquash),
        scaleY: baseTransform.scaleY * (1 - impactSquash),
        opacity: baseTransform.opacity * Math.min(1, t * 3),
      }
    }
    case 'slideL':
    case 'slideWhole':
    case 'slide-right': {
      const e = evaluateEasing('easeOut', t)
      return {
        x: baseTransform.x - (1 - e) * dist * 3.3 * intensity,
        opacity: baseTransform.opacity * e,
      }
    }
    case 'slideR':
    case 'slide-left': {
      const e = evaluateEasing('easeOut', t)
      return {
        x: baseTransform.x + (1 - e) * dist * 3.3 * intensity,
        opacity: baseTransform.opacity * e,
      }
    }
    case 'slide-down': {
      const e = evaluateEasing('easeOut', t)
      return {
        y: baseTransform.y - (1 - e) * dist * 3.3 * intensity,
        opacity: baseTransform.opacity * e,
      }
    }
    case 'whip':
    case 'whip-in':
    case 'slingshot': {
      const e = evaluateEasing('backOut', t)
      return {
        x: baseTransform.x - (1 - e) * dist * 5 * intensity,
        scaleX: baseTransform.scaleX * (1 + (1 - t) * 0.8 * intensity),
        opacity: baseTransform.opacity * e,
      }
    }
    case 'spin':
    case 'spin-in':
    case 'rollIn':
    case 'twister': {
      const eS = evaluateEasing('elasticOut', t)
      const eR = evaluateEasing('easeOut', t)
      return {
        rotation: baseTransform.rotation - (1 - eR) * 360 * intensity,
        scale: baseTransform.scale * eS,
        scaleX: baseTransform.scaleX * eS,
        scaleY: baseTransform.scaleY * eS,
        opacity: baseTransform.opacity * Math.min(1, t * 2.5),
      }
    }
    case 'flipX':
    case 'flip-x': {
      const e = evaluateEasing('backOut', t)
      return {
        scaleX: baseTransform.scaleX * Math.abs(Math.sin((t * Math.PI) / 2)),
        scale: baseTransform.scale * e,
        opacity: baseTransform.opacity * e,
      }
    }
    case 'flipY':
    case 'flip-y': {
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
        scale: baseTransform.scale * (1.5 - 0.5 * e),
        scaleX: baseTransform.scaleX * (1.5 - 0.5 * e),
        scaleY: baseTransform.scaleY * (1.5 - 0.5 * e),
        opacity: baseTransform.opacity * e,
      }
    }
    case 'rubber':
    case 'rubber-in':
    case 'stretch': {
      const e = evaluateEasing('elasticOut', t)
      return {
        scaleX: baseTransform.scaleX * (1 + (1 - t) * 1.2 * intensity),
        scaleY: baseTransform.scaleY * (0.3 + 0.7 * e),
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
    case 'glitch-in':
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
        scaleX: baseTransform.scaleX * (2.2 - 1.2 * e),
        scaleY: baseTransform.scaleY * (2.2 - 1.2 * e),
        opacity: baseTransform.opacity * Math.min(1, t * 4),
      }
    }
    case 'hrJumpScare':
    case 'hrBlinkCreep': {
      const blink = Math.floor(layerTime * 8) % 2 === 0 && t < 0.6 ? 0 : 1
      return {
        scale: baseTransform.scale * (t < 0.5 ? 1.4 : 1.0),
        scaleX: baseTransform.scaleX * (t < 0.5 ? 1.4 : 1.0),
        scaleY: baseTransform.scaleY * (t < 0.5 ? 1.4 : 1.0),
        opacity: baseTransform.opacity * blink,
      }
    }
    default: {
      const e = evaluateEasing('easeOut', t)
      return {
        opacity: baseTransform.opacity * e,
        y: baseTransform.y + (1 - e) * 30 * intensity,
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
      const s = 1 + Math.sin(layerTime * 3) * 0.05 * intensity
      return {
        scale: baseTransform.scale * s,
        scaleX: baseTransform.scaleX * s,
        scaleY: baseTransform.scaleY * s,
      }
    }
    case 'q-jelly':
    case 'jelly': {
      const sx = 1 + Math.sin(layerTime * 5.5) * 0.08 * intensity
      const sy = 1 - Math.sin(layerTime * 5.5) * 0.08 * intensity
      const bounceY = Math.abs(Math.sin(layerTime * 2.8)) * -10 * intensity
      return {
        scaleX: baseTransform.scaleX * sx,
        scaleY: baseTransform.scaleY * sy,
        y: baseTransform.y + bounceY,
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
      const angle = Math.sin(layerTime * 3.5) * 7 * intensity
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
    case 'beat-hop':
    case 'heartbeat': {
      const beat = Math.pow(Math.sin(layerTime * Math.PI * 2), 6) * 0.1 * intensity
      return {
        scale: baseTransform.scale * (1 + beat),
        scaleX: baseTransform.scaleX * (1 + beat),
        scaleY: baseTransform.scaleY * (1 + beat * 1.2),
        y: baseTransform.y - beat * 35,
      }
    }
    case 'rotateSlow':
    case 'rotate-slow': {
      return {
        rotation: baseTransform.rotation + ((layerTime * 20 * intensity) % 360),
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
        y: baseTransform.y + e * 200 * intensity,
        opacity: baseTransform.opacity * (1 - e),
      }
    }
    case 'explode':
    case 'popOut':
    case 'scatter': {
      const e = evaluateEasing('easeOut', t)
      return {
        scale: baseTransform.scale * (1 + e * 0.8 * intensity),
        scaleX: baseTransform.scaleX * (1 + e * 0.8 * intensity),
        scaleY: baseTransform.scaleY * (1 + e * 0.8 * intensity),
        opacity: baseTransform.opacity * (1 - e),
      }
    }
    case 'shrink':
    case 'collapse':
    case 'vacuumOut': {
      const e = evaluateEasing('easeIn', t)
      const s = Math.max(0, 1 - e)
      return {
        scale: baseTransform.scale * s,
        scaleX: baseTransform.scaleX * s,
        scaleY: baseTransform.scaleY * s,
        opacity: baseTransform.opacity * (1 - e),
      }
    }
    case 'blur':
    case 'drift': {
      const e = evaluateEasing('easeOut', t)
      return {
        scale: baseTransform.scale * (1 + e * 0.3),
        scaleX: baseTransform.scaleX * (1 + e * 0.3),
        scaleY: baseTransform.scaleY * (1 + e * 0.3),
        opacity: baseTransform.opacity * (1 - e),
      }
    }
    case 'slideOutL':
    case 'slide-out-left':
    case 'whipOut':
    case 'knPushOut': {
      const e = evaluateEasing('easeIn', t)
      return {
        x: baseTransform.x - e * 320 * intensity,
        opacity: baseTransform.opacity * (1 - e),
      }
    }
    case 'slideOutR':
    case 'slide-out-right':
    case 'knWordKick': {
      const e = evaluateEasing('easeIn', t)
      return {
        x: baseTransform.x + e * 320 * intensity,
        opacity: baseTransform.opacity * (1 - e),
      }
    }
    case 'spinOut':
    case 'twist': {
      const e = evaluateEasing('easeIn', t)
      const s = Math.max(0, 1 - e)
      return {
        rotation: baseTransform.rotation + e * 360 * intensity,
        scale: baseTransform.scale * s,
        scaleX: baseTransform.scaleX * s,
        scaleY: baseTransform.scaleY * s,
        opacity: baseTransform.opacity * (1 - e),
      }
    }
    case 'riseOut': {
      const e = evaluateEasing('easeIn', t)
      return {
        y: baseTransform.y - e * 140 * intensity,
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
    case 'squash':
    case 'squash-out': {
      const e = evaluateEasing('easeIn', t)
      return {
        scaleY: baseTransform.scaleY * Math.max(0.02, 1 - e),
        scaleX: baseTransform.scaleX * (1 + e * 0.8),
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
  let enterId = layer.enterAnim || combo?.enter || ''
  let holdId = layer.holdAnim || combo?.hold || ''
  let exitId = layer.exitAnim || combo?.exit || ''
  let camId = layer.camAnim || ''

  if (!combo && presetId && presetId !== 'none') {
    if (isEnterPreset(presetId)) {
      if (!enterId) enterId = presetId
    } else if (isHoldPreset(presetId)) {
      if (!holdId) holdId = presetId
    } else if (isExitPreset(presetId)) {
      if (!exitId) exitId = presetId
    } else {
      if (!enterId) enterId = presetId
    }
  }

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
  if (camId && camId !== 'none') {
    const camRes = evaluateJizuraCamera(camId, fullCtx)
    if (camRes.x !== undefined) resX = camRes.x
    if (camRes.y !== undefined) resY = camRes.y
    if (camRes.scale !== undefined) {
      const ratio = resScale ? camRes.scale / resScale : 1
      resScale = camRes.scale
      resScaleX *= ratio
      resScaleY *= ratio
    }
    if (camRes.rotation !== undefined) resRotation = camRes.rotation
  }

  // 2. 持续 Hold 微动
  if (holdId && holdId !== 'none' && holdId !== 'still') {
    const holdRes = evaluateJizuraHold(holdId, { ...fullCtx, baseTransform: { ...ctx.baseTransform, x: resX, y: resY, scale: resScale, scaleX: resScaleX, scaleY: resScaleY, opacity: resOpacity, rotation: resRotation, displayedText: resDisplayed } })
    if (holdRes.x !== undefined) resX = holdRes.x
    if (holdRes.y !== undefined) resY = holdRes.y
    if (holdRes.scale !== undefined) {
      const ratio = resScale ? holdRes.scale / resScale : 1
      resScale = holdRes.scale
      if (holdRes.scaleX === undefined) resScaleX *= ratio
      if (holdRes.scaleY === undefined) resScaleY *= ratio
    }
    if (holdRes.scaleX !== undefined) resScaleX = holdRes.scaleX
    if (holdRes.scaleY !== undefined) resScaleY = holdRes.scaleY
    if (holdRes.opacity !== undefined) resOpacity = holdRes.opacity
    if (holdRes.rotation !== undefined) resRotation = holdRes.rotation
  }

  // 3. 入场动效 (Enter)
  const enterDur = Number(params.duration) || Number(params.enterDuration) || 0.6
  if (ctx.layerTime < enterDur && enterId && enterId !== 'cut' && enterId !== 'none') {
    const enterRes = evaluateJizuraEnter(enterId, { ...fullCtx, baseTransform: { ...ctx.baseTransform, x: resX, y: resY, scale: resScale, scaleX: resScaleX, scaleY: resScaleY, opacity: resOpacity, rotation: resRotation, displayedText: resDisplayed } }, enterDur)
    if (enterRes.x !== undefined) resX = enterRes.x
    if (enterRes.y !== undefined) resY = enterRes.y
    if (enterRes.scale !== undefined) {
      const ratio = resScale ? enterRes.scale / resScale : 1
      resScale = enterRes.scale
      if (enterRes.scaleX === undefined) resScaleX *= ratio
      if (enterRes.scaleY === undefined) resScaleY *= ratio
    }
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
    if (exitRes.scale !== undefined) {
      const ratio = resScale ? exitRes.scale / resScale : 1
      resScale = exitRes.scale
      if (exitRes.scaleX === undefined) resScaleX *= ratio
      if (exitRes.scaleY === undefined) resScaleY *= ratio
    }
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
