// @ts-ignore
import { J } from './jizuraEngine'
import type { Layer } from '../types'
import { getJizuraStyle, JIZURA_STYLES } from './styles'

let sharedRenderer: any = null

export function getSharedRenderer() {
  if (!sharedRenderer && typeof J !== 'undefined' && J.Renderer) {
    sharedRenderer = new J.Renderer()
  }
  return sharedRenderer
}

/**
 * 为单个图层编译独立的 JIZURA Plan (保证每个图层拥有独立的 Canvas 渲染、Z-Index 层级堆叠与显隐控制)
 */
export function compileJizuraLayerPlan(layer: Layer, activeStyleId = 'noir') {
  if (!J || !J.plan) return null

  const style = getJizuraStyle(layer.styleId || activeStyleId) || JIZURA_STYLES[0]
  const project = J.defaultProject ? J.defaultProject() : {}
  project.style = style.id || 'noir'
  project.aspect = '16:9'
  project.res = 1080
  project.fps = 30
  project.lang = 'zh-Hans'
  project.lyrics = layer.text || ' '
  project.unify = false

  const decorList: string[] = []
  if (layer.decorAnim && layer.decorAnim !== 'none') {
    decorList.push(layer.decorAnim)
  }

  project.overrides = {
    '0': {
      single: true,
      cuts: 1,
      layout: layer.layoutAnim || layer.textLayout || 'center',
      enter: layer.enterAnim || 'pop',
      hold: layer.holdAnim || 'breathe',
      exit: layer.exitAnim || 'fall',
      decor: decorList.length > 0 ? decorList : undefined,
      treat: layer.treatAnim || layer.textTreatment || 'glow',
      bg: 'none',
      cam: layer.camAnim || 'push',
      trans: layer.transAnim && layer.transAnim !== 'none' ? layer.transAnim : 'wipe',
    },
  }

  project.timing = {
    bpm: 0,
    offset: 0,
    snap: false,
    tail: 0.8,
    lineTimes: { '0': 0 },
    lineScale: 1,
  }

  try {
    const plan = J.plan(project)
    if (plan && plan.cuts && plan.cuts[0]) {
      plan.dur = Math.max(1, layer.duration)
      plan.cuts[0].start = 0
      plan.cuts[0].end = Math.max(1, layer.duration)
      plan.cuts[0].visEnd = Math.max(1, layer.duration)
      if (layer.fontColor && plan.cuts[0].color) {
        plan.cuts[0].color = layer.fontColor
      }
      if (layer.fontSize && plan.cuts[0].size) {
        plan.cuts[0].size = layer.fontSize
      }
    }
    return plan
  } catch (e) {
    console.error('Failed to compile single layer plan:', e)
    return null
  }
}

/**
 * 编译多句歌词连贯无缝切换的 JIZURA 统一 Plan (支持前后歌词连续转场、镜头衔接与连续动画流)
 */
export function compileContinuousLyricPlan(
  layers: Layer[],
  activeStyleId = 'noir',
  duration = 10
) {
  if (!J || !J.plan) return null

  const textLayers = layers.filter((l) => l.kind === 'text' && l.visible && l.useJizura !== false)
  if (textLayers.length === 0) return null

  // 按时间先后顺序排序
  const sortedLayers = [...textLayers].sort((a, b) => a.start - b.start)

  const style = getJizuraStyle(activeStyleId) || JIZURA_STYLES[0]
  const project = J.defaultProject ? J.defaultProject() : {}
  project.style = style.id || activeStyleId || 'noir'
  project.aspect = '16:9'
  project.res = 1080
  project.fps = 30
  project.lang = 'zh-Hans'
  project.lyrics = sortedLayers.map((l) => l.text || ' ').join('\n')
  project.unify = false

  const overrides: Record<string, any> = {}
  const lineTimes: Record<string, number> = {}

  sortedLayers.forEach((layer, idx) => {
    lineTimes[String(idx)] = layer.start
    const decorList: string[] = []
    if (layer.decorAnim && layer.decorAnim !== 'none') {
      decorList.push(layer.decorAnim)
    }

    overrides[String(idx)] = {
      single: true,
      cuts: 1,
      layout: layer.layoutAnim || layer.textLayout || 'center',
      enter: layer.enterAnim || 'pop',
      hold: layer.holdAnim || 'breathe',
      exit: layer.exitAnim || 'fall',
      decor: decorList.length > 0 ? decorList : undefined,
      treat: layer.treatAnim || layer.textTreatment || 'glow',
      bg: 'none',
      cam: layer.camAnim || 'push',
      trans: layer.transAnim && layer.transAnim !== 'none' ? layer.transAnim : 'wipe',
    }
  })

  project.overrides = overrides
  project.timing = {
    bpm: 0,
    offset: 0,
    snap: false,
    tail: 0.8,
    lineTimes,
    lineScale: 1,
  }

  try {
    const plan = J.plan(project)
    if (plan && plan.cuts) {
      plan.dur = Math.max(duration, 1)
      sortedLayers.forEach((layer, idx) => {
        if (plan.cuts[idx]) {
          plan.cuts[idx].start = layer.start
          plan.cuts[idx].end = layer.start + layer.duration
          plan.cuts[idx].visEnd = layer.start + layer.duration
          if (layer.fontColor) plan.cuts[idx].color = layer.fontColor
          if (layer.fontSize) plan.cuts[idx].size = layer.fontSize
        }
      })
    }
    return plan
  } catch (e) {
    console.error('Failed to compile continuous lyric plan:', e)
    return null
  }
}

const BG_KEY_ALIASES: Record<string, string> = {
  'mesh-gradient': 'meshBlobs',
  'cyber-grid': 'dotGrid',
  'retro-grid': 'retroGrid',
  'hud-lines': 'hexGrid',
  'blueprint-grid': 'dotGrid',
  'japanese-washi': 'tornPaper',
  'scanlines': 'scanBars',
  'halftone-dots': 'halftoneFade',
  'sunset-glow': 'sunsetSun',
  solid: 'none',
}

/**
 * 独立渲染 JIZURA 背景 (支持 JIZURA 全部 66 种背景预设)
 */
export function drawJizuraBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  bgKey: string,
  scheme: any,
  t: number
) {
  if (!ctx) return

  // 1. 特殊合成背景
  if (bgKey === 'green-screen') {
    ctx.fillStyle = '#00FF00'
    ctx.fillRect(0, 0, w, h)
    return
  }
  if (bgKey === 'black-screen') {
    ctx.fillStyle = '#000000'
    ctx.fillRect(0, 0, w, h)
    return
  }

  const resolvedKey = BG_KEY_ALIASES[bgKey] || bgKey
  const bgDef = J.BG ? J.BG[resolvedKey] : null

  ctx.save()
  // 底色铺垫
  ctx.fillStyle = scheme.bg || '#060607'
  ctx.fillRect(0, 0, w, h)

  if (bgDef && typeof bgDef.draw === 'function') {
    try {
      const rng = J.rng ? J.rng(42) : null
      const st = { schemes: [scheme], texture: { paper: 0.3, grain: 0.5 } }
      const P = bgDef.plan && rng ? bgDef.plan(rng, st) : { seed: 42 }
      const env = {
        W: w,
        H: h,
        t,
        lt: t,
        scale: 1,
        fps: 30,
        ctx,
        sc: scheme,
        cut: {
          start: 0,
          end: 100,
          bg: resolvedKey,
          bgP: P,
          scheme: 0,
        },
        plan: {
          W: w,
          H: h,
          fps: 30,
          dur: 100,
          style: st,
          fx: { motion: 0.7, density: 0.6, texture: 0.5 },
        },
      }
      bgDef.draw(env, P, ctx)
    } catch (e) {
      // 容错降级
      const g = ctx.createRadialGradient(w / 2, h * 0.45, 0, w / 2, h / 2, Math.hypot(w, h) * 0.6)
      g.addColorStop(0, scheme.accent ? scheme.accent + '25' : 'rgba(99,102,241,0.18)')
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
    }
  } else {
    // 默认光晕底色
    const g = ctx.createRadialGradient(w / 2, h * 0.45, 0, w / 2, h / 2, Math.hypot(w, h) * 0.6)
    g.addColorStop(0, scheme.accent ? scheme.accent + '25' : 'rgba(99,102,241,0.18)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  }
  ctx.restore()
}

/**
 * 独立渲染 JIZURA 装饰图元 (支持 JIZURA 全部 130 种装饰预设)
 */
export function drawJizuraDecor(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  decorKey: string,
  scheme: any,
  t: number,
  anchor = { x: 960, y: 540, w: 400, h: 200 }
) {
  if (!ctx || !decorKey || decorKey === 'none') return

  const decorDef = J.DECOR ? J.DECOR[decorKey] : null
  if (!decorDef || typeof decorDef.draw !== 'function') return

  const env = {
    W: w,
    H: h,
    t,
    lt: t,
    scale: 1,
    ctx,
    sc: scheme,
    fx: { decor: 0.8, motion: 0.7 },
    cut: {
      start: 0,
      end: 100,
      decor: decorKey,
      decorP: { seed: 88 },
      scheme: 0,
      box: {
        x0: anchor.x - anchor.w / 2,
        y0: anchor.y - anchor.h / 2,
        x1: anchor.x + anchor.w / 2,
        y1: anchor.y + anchor.h / 2,
        w: anchor.w,
        h: anchor.h,
        cx: anchor.x,
        cy: anchor.y,
      },
    },
    plan: {
      W: w,
      H: h,
      style: { schemes: [scheme] },
      fx: { decor: 0.8, motion: 0.7 },
    },
  }

  ctx.save()
  try {
    decorDef.draw(env, { seed: 88, anchor }, ctx)
  } catch (e) {}
  ctx.restore()
}

/**
 * 使用 JIZURA 官方渲染器在 Canvas 上渲染真实电影级画面 (支持透明背景叠加模式)
 */
export function renderJizuraFrame(
  ctx: CanvasRenderingContext2D,
  plan: any,
  time: number,
  opt: { transparent?: boolean; scale?: number } = { transparent: true }
) {
  if (!ctx || !plan) return
  const renderer = getSharedRenderer()
  if (renderer && typeof renderer.frame === 'function') {
    try {
      renderer.frame(ctx, plan, time, opt)
    } catch (e) {
      // 容错降级
    }
  }
}

export { J }
