import jizuraData from './data.json'

export interface JizuraPresetItem {
  id: string
  name: string
  desc: string
  tags?: string[]
  kind?: string
}

export interface JizuraStyleItem {
  id: string
  name: string
  desc: string
  schemes: Array<{
    bg: string
    fg: string
    sub: string
    accent: string
    accent2: string
    ink: string
    dim: string
    ghostA?: string
    ghostB?: string
    swap?: boolean
  }>
  fonts?: Record<string, string[]>
  texture?: { grain?: number; paper?: number; scan?: number }
  bias?: Record<string, Record<string, number>>
  decor?: Record<string, number>
}

export type JizuraCategoryKey =
  | 'layout'
  | 'enter'
  | 'hold'
  | 'exit'
  | 'decor'
  | 'treat'
  | 'bg'
  | 'cam'
  | 'fx'
  | 'trans'

export const JIZURA_CATEGORY_NAMES: Record<JizuraCategoryKey, string> = {
  layout: '布局排版 (Layout)',
  enter: '入场动效 (Enter)',
  hold: '保持与微动 (Hold)',
  exit: '退场动效 (Exit)',
  decor: '装饰图元 (Decor)',
  treat: '文字处理 (Treat)',
  bg: '背景预设 (Background)',
  cam: '运镜控制 (Camera)',
  fx: '画面效果 (FX)',
  trans: '镜头转场 (Transition)',
}

/**
 * 获取某个类别的全部预设列表
 */
export function getJizuraCategoryItems(category: JizuraCategoryKey): JizuraPresetItem[] {
  const table = (jizuraData.categories as Record<string, Record<string, JizuraPresetItem>>)[category] || {}
  return Object.values(table)
}

/**
 * 获取某个类别的特定预设
 */
export function getJizuraItem(category: JizuraCategoryKey, id: string): JizuraPresetItem | undefined {
  const table = (jizuraData.categories as Record<string, Record<string, JizuraPresetItem>>)[category] || {}
  return table[id]
}

/**
 * 获取所有 27 款风格配置
 */
export function getAllJizuraStyles(): JizuraStyleItem[] {
  return Object.values(jizuraData.styles as Record<string, JizuraStyleItem>)
}

/**
 * 根据 ID 获取特定风格
 */
export function getJizuraStyleById(id: string): JizuraStyleItem | undefined {
  return (jizuraData.styles as Record<string, JizuraStyleItem>)[id]
}

/**
 * 获取所有手法氛围 (Moods)
 */
export function getJizuraMoods() {
  return Object.values(jizuraData.moods)
}

export { jizuraData }
