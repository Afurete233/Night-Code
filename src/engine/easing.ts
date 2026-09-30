import type { EasingType } from './types'

export function evaluateEasing(type: EasingType = 'linear', t: number): number {
  const clampT = Math.max(0, Math.min(1, t))
  switch (type) {
    case 'easeIn':
      return clampT * clampT
    case 'easeOut':
      return clampT * (2 - clampT)
    case 'easeInOut':
      return clampT < 0.5 ? 2 * clampT * clampT : -1 + (4 - 2 * clampT) * clampT
    case 'backOut': {
      const c1 = 1.70158
      const c3 = c1 + 1
      return 1 + c3 * Math.pow(clampT - 1, 3) + c1 * Math.pow(clampT - 1, 2)
    }
    case 'bounceOut': {
      const n1 = 7.5625
      const d1 = 2.75
      let x = clampT
      if (x < 1 / d1) {
        return n1 * x * x
      } else if (x < 2 / d1) {
        x -= 1.5 / d1
        return n1 * x * x + 0.75
      } else if (x < 2.5 / d1) {
        x -= 2.25 / d1
        return n1 * x * x + 0.9375
      } else {
        x -= 2.625 / d1
        return n1 * x * x + 0.984375
      }
    }
    case 'elasticOut': {
      if (clampT === 0) return 0
      if (clampT === 1) return 1
      return Math.pow(2, -10 * clampT) * Math.sin(((clampT * 10 - 0.75) * (2 * Math.PI)) / 3) + 1
    }
    case 'linear':
    default:
      return clampT
  }
}
