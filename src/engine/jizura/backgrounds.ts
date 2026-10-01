export type BackgroundType =
  | 'none'
  | 'solid'
  | 'green-screen'
  | 'black-screen'
  | 'auroraRibbons'
  | 'meshBlobs'
  | 'duotoneSweep'
  | 'horizonGlow'
  | 'seigaiha'
  | 'asanoha'
  | 'houndstooth'
  | 'herringbone'
  | 'hexGrid'
  | 'topoLines'
  | 'starfield'
  | 'nightMoon'
  | 'skyline'
  | 'sunsetSun'
  | 'oceanWaves'
  | 'rainWindow'
  | 'snowLayers'
  | 'fireworks'
  | 'cloudLayers'
  | 'mountains'
  | 'filmStrip'
  | 'vhsBand'
  | 'tornPaper'
  | 'godRays'
  | 'kaleidoscope'
  | 'sunburst'
  | 'concentric'
  | 'halftoneFade'
  | 'speedLines'
  | 'scanBars'
  | 'dotGrid'
  | 'retroGrid'
  | 'bokehBg'
  | 'particlesBg'
  | 'ripples'
  | 'polka'
  | 'tvBars'
  | 'checker'
  | 'borderFrame'
  | 'letterbox'
  | 'noiseField'

export interface BackgroundPresetDef {
  id: BackgroundType
  name: string
  desc: string
  category: 'composite' | 'gradient' | 'cyber' | 'artistic' | 'wa' | 'nature'
  defaultColorA: string
  defaultColorB?: string
  defaultColorC?: string
}

export const BACKGROUND_PRESETS: BackgroundPresetDef[] = [
  {
    id: 'green-screen',
    name: '绿幕抠像 (影视合成专用)',
    desc: '纯绿底色 (#00FF00)，导出后可无损在剪映/AE/PR中一键色度键抠像叠加',
    category: 'composite',
    defaultColorA: '#00FF00',
  },
  {
    id: 'black-screen',
    name: '纯黑背景 (滤色合成)',
    desc: '纯黑底色 (#000000)，在剪映/AE中使用“滤色/变亮”模式即可无缝透明叠加',
    category: 'composite',
    defaultColorA: '#000000',
  },
  {
    id: 'meshBlobs',
    name: '网格渐变 (Mesh Blobs)',
    desc: '多色柔和漫反射光斑渐变',
    category: 'gradient',
    defaultColorA: '#0f172a',
    defaultColorB: '#6366f1',
    defaultColorC: '#ec4899',
  },
  {
    id: 'auroraRibbons',
    name: '极光彩带 (Aurora)',
    desc: '流光波浪极光缎带渐变',
    category: 'gradient',
    defaultColorA: '#061a24',
    defaultColorB: '#10b981',
    defaultColorC: '#06b6d4',
  },
  {
    id: 'retroGrid',
    name: '80s 透视地平线 (Retro Grid)',
    desc: '复古合成波 3D 渐隐透视地面网格',
    category: 'cyber',
    defaultColorA: '#0b001a',
    defaultColorB: '#d946ef',
    defaultColorC: '#06b6d4',
  },
  {
    id: 'dotGrid',
    name: '点状网格 (Dot Grid)',
    desc: '赛博朋克科技数据点阵与十字网格',
    category: 'cyber',
    defaultColorA: '#090d14',
    defaultColorB: '#38bdf8',
  },
  {
    id: 'hexGrid',
    name: '六角蜂巢网格 (Hex Grid)',
    desc: '科幻未来感六边形蜂窝网格',
    category: 'cyber',
    defaultColorA: '#090d14',
    defaultColorB: '#f59e0b',
  },
  {
    id: 'scanBars',
    name: '扫描线带 (Scan Bars)',
    desc: '经典 CRT 电子管扫描横纹与监控质感',
    category: 'cyber',
    defaultColorA: '#05070a',
    defaultColorB: '#22c55e',
  },
  {
    id: 'starfield',
    name: '浩瀚星空 (Starfield)',
    desc: '深邃宇宙群星闪烁流光',
    category: 'nature',
    defaultColorA: '#050510',
    defaultColorB: '#e2e8f0',
    defaultColorC: '#818cf8',
  },
  {
    id: 'topoLines',
    name: '等高线地形 (Topo Lines)',
    desc: '自然地理等高线轮廓',
    category: 'artistic',
    defaultColorA: '#18181b',
    defaultColorB: '#a1a1aa',
  },
  {
    id: 'sunsetSun',
    name: '日落夕阳 (Sunset Sun)',
    desc: '地平线温暖落日辉光',
    category: 'nature',
    defaultColorA: '#1e1024',
    defaultColorB: '#f97316',
    defaultColorC: '#a855f7',
  },
  {
    id: 'oceanWaves',
    name: '深海流波 (Ocean Waves)',
    desc: '深邃洋流与光波起伏',
    category: 'nature',
    defaultColorA: '#041626',
    defaultColorB: '#0284c7',
    defaultColorC: '#38bdf8',
  },
  {
    id: 'seigaiha',
    name: '青海波 (Seigaiha)',
    desc: '传统和风古典青海波水纹',
    category: 'wa',
    defaultColorA: '#1c1917',
    defaultColorB: '#0284c7',
    defaultColorC: '#f5f5f4',
  },
  {
    id: 'asanoha',
    name: '麻叶纹 (Asanoha)',
    desc: '传统和风几何麻叶纹样',
    category: 'wa',
    defaultColorA: '#1c1917',
    defaultColorB: '#e11d48',
    defaultColorC: '#f5f5f4',
  },
  {
    id: 'tornPaper',
    name: '宣纸撕纸质感 (Torn Paper)',
    desc: '复古纸张、纸浆边缘与墨斑质感',
    category: 'artistic',
    defaultColorA: '#1c1815',
    defaultColorB: '#c2410c',
    defaultColorC: '#e2d9cc',
  },
  {
    id: 'halftoneFade',
    name: '波普网点渐变 (Halftone Fade)',
    desc: '复古美漫印刷网点阵列',
    category: 'artistic',
    defaultColorA: '#1e1b2e',
    defaultColorB: '#f43f5e',
  },
  {
    id: 'speedLines',
    name: '动感集中线 (Speed Lines)',
    desc: '热血动漫视觉速度线',
    category: 'artistic',
    defaultColorA: '#09090b',
    defaultColorB: '#ffffff',
  },
  {
    id: 'particlesBg',
    name: '飞舞粒子 (Particles)',
    desc: '漂浮悬浮发光粒子阵列',
    category: 'nature',
    defaultColorA: '#0a0a14',
    defaultColorB: '#c084fc',
    defaultColorC: '#38bdf8',
  },
  {
    id: 'solid',
    name: '单色底色 (Solid)',
    desc: '纯净单色自定义底色',
    category: 'composite',
    defaultColorA: '#11151c',
  },
]

export interface BackgroundConfig {
  type: string
  colorA: string
  colorB?: string
  colorC?: string
  gridDensity?: number // 10 ~ 100
  scanlineOpacity?: number // 0 ~ 100
  showVignette?: boolean
}

export function getDefaultBackgroundConfig(type: string = 'meshBlobs'): BackgroundConfig {
  const preset = BACKGROUND_PRESETS.find((p) => p.id === type) || BACKGROUND_PRESETS[2]
  return {
    type,
    colorA: preset.defaultColorA,
    colorB: preset.defaultColorB,
    colorC: preset.defaultColorC,
    gridDensity: 60,
    scanlineOpacity: 30,
    showVignette: true,
  }
}
