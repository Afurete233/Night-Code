/**
 * JIZURA 预设库与渲染引擎全量自动同步脚本
 * 运行方式: node scripts/sync_jizura.js
 * 作用: 从 JIZURA 官方仓库 (https://github.com/852wa/JIZURA) 自动拉取并提取最新的所有:
 * - 风格 (Styles · 27 套)
 * - 手法/氛围 (Moods · 8 种)
 * - 布局 (Layouts · 186+)
 * - 入场 (Enter · 112+)
 * - 保持 (Hold · 46+)
 * - 退场 (Exit · 98+)
 * - 装饰 (Decor · 130+)
 * - 文字处理 (Treatments · 62+)
 * - 背景 (Backgrounds · 66+)
 * - 运镜 (Camera · 36+)
 * - 画面效果 (FX · 69+)
 * - 镜头转场 (Transitions · 27+)
 * - 完整底层 Canvas2D 渲染与动效执行引擎
 */
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import vm from 'vm'

const TEMP_DIR = path.resolve('temp_jizura_sync')
const OUTPUT_DATA = path.resolve('src/engine/jizura/data.json')
const OUTPUT_ENGINE = path.resolve('src/engine/jizura/jizuraEngine.js')

console.log('🔄 正在全量同步 JIZURA 预设与渲染引擎...')

try {
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true })
  }

  console.log('1. 拉取 JIZURA 最新仓库源码...')
  execSync('git clone --depth 1 https://github.com/852wa/JIZURA.git temp_jizura_sync', { stdio: 'inherit' })

  console.log('2. 正在解析全量预设组件与动效代码...')
  const J = {
    GROUP_KEYS: ['layout', 'enter', 'hold', 'exit', 'decor', 'treat', 'bg', 'cam', 'fx', 'trans'],
    LAYOUTS: {}, ENTER: {}, HOLD: {}, EXIT: {}, DECOR: {}, TREAT: {}, BG: {}, CAM: {}, FX: {}, TRANS: {}, STYLES: {}, MOODS: {},
    registry: function(g) {
      const map = {
        layout: this.LAYOUTS, enter: this.ENTER, hold: this.HOLD, exit: this.EXIT, decor: this.DECOR,
        treat: this.TREAT, bg: this.BG, cam: this.CAM, fx: this.FX, trans: this.TRANS
      }
      return map[g] || {}
    },
    reg: function(group, id, def) {
      const table = this.registry(group)
      table[id] = def
    },
    regStyle: function(id, def) { this.STYLES[id] = def },
    regMood: function(id, def) { this.MOODS[id] = def },
    regSet: function() {}
  }

  const sandbox = { J, console, window: {}, document: {}, Math, Object, Array, String, Number }
  vm.createContext(sandbox)

  const files = [
    '01_util.js',
    '02_fonts.js',
    '02b_lang.js',
    '03_text.js',
    '04_styles.js',
    '05_anim.js',
    '05b_registry.js',
    '06_layouts.js',
    '07_decor.js',
    '08_planner.js',
    '08b_omakase.js',
    '09_render.js',
    '11p_bgcamB.js',
    '11p_decor.js',
    '11p_decorB.js',
    '11p_enter.js',
    '11p_enterB.js',
    '11p_exit.js',
    '11p_exitB.js',
    '11p_fxB.js',
    '11p_horror1.js',
    '11p_horror2.js',
    '11p_horror3.js',
    '11p_kinetic1.js',
    '11p_kinetic2.js',
    '11p_kinetic3.js',
    '11p_layoutsA.js',
    '11p_layoutsB.js',
    '11p_layoutsC.js',
    '11p_layoutsD.js',
    '11p_looks.js',
    '11p_styles.js',
    '11p_treattrans.js',
    '11p_typo1.js',
    '11p_typo2.js',
    '11p_typo3.js',
    '11q_sets.js',
  ]

  let engineBundle = ''
  for (const f of files) {
    const filePath = path.join(TEMP_DIR, 'src', f)
    if (fs.existsSync(filePath)) {
      let code = fs.readFileSync(filePath, 'utf8')
      if (f === '01_util.js') {
        code = code.replace('const J = (window.J = window.J || {});', 'J = (window.J = window.J || {});')
      }
      engineBundle += code + '\n'
      try {
        vm.runInContext(code, sandbox)
      } catch (e) {}
    }
  }

  // 加载中文语言包
  const zhFile = path.join(TEMP_DIR, 'app', 'chinese_hans.js')
  if (fs.existsSync(zhFile)) {
    const zhCode = fs.readFileSync(zhFile, 'utf8')
    engineBundle += zhCode + '\n'
    try {
      vm.runInContext(zhCode, sandbox)
    } catch (e) {}
  }

  // 1. 生成 data.json
  const exportData = {
    version: '0.9.0',
    updatedAt: new Date().toISOString(),
    styles: {},
    moods: {
      glitch: { id: 'glitch', name: '故障 · Glitch', desc: '强烈的数字故障、色相错位与跳动' },
      calm: { id: 'calm', name: '柔和 · Calm', desc: '舒缓平滑的流光与呼吸感' },
      pop: { id: 'pop', name: '波普 · Pop', desc: '鲜亮色块、弹跳与动感' },
      graphic: { id: 'graphic', name: '图形 · Graphic', desc: '强调几何构成、线框与排版美学' },
      editorial: { id: 'editorial', name: '杂志 · Editorial', desc: '极简排版、宋体字号与留白' },
      emotional: { id: 'emotional', name: '感性 · Emotional', desc: '深情微焦、光晕与余韵' },
      horror: { id: 'horror', name: '恐怖 · Horror', desc: '雪花噪点、监控红字与不祥回响' },
      chaos: { id: 'chaos', name: '不拘一格 · Chaos', desc: '全手法全预设自由混合' },
    },
    categories: {
      layout: {},
      enter: {},
      hold: {},
      exit: {},
      decor: {},
      treat: {},
      bg: {},
      cam: {},
      fx: {},
      trans: {},
    },
  }

  for (const [id, style] of Object.entries(J.STYLES)) {
    exportData.styles[id] = {
      id,
      name: style.name || id,
      desc: style.desc || '',
      schemes: style.schemes || [],
      fonts: style.fonts || {},
      texture: style.texture || {},
      bias: style.bias || {},
      decor: style.decor || {},
    }
  }

  for (const group of J.GROUP_KEYS) {
    const table = J.registry(group)
    for (const [id, item] of Object.entries(table)) {
      exportData.categories[group][id] = {
        id,
        name: item.name || id,
        desc: item.desc || item.name || id,
        tags: item.tags || [],
        kind: item.kind || group,
      }
    }
  }

  fs.writeFileSync(OUTPUT_DATA, JSON.stringify(exportData, null, 2), 'utf8')

  // 2. 生成 jizuraEngine.js
  const wrappedEngine = `// @ts-nocheck
/* ============================================================
   JIZURA Full Standalone Core Engine Runtime
   ============================================================ */
var _global = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : this;
if (!_global.window) _global.window = _global;
var J = _global.J = _global.J || {};

${engineBundle}

export { J };
export default J;
`
  fs.writeFileSync(OUTPUT_ENGINE, wrappedEngine, 'utf8')

  console.log(`✅ 成功更新 ${OUTPUT_DATA} 与 ${OUTPUT_ENGINE}！`)
} catch (err) {
  console.error('❌ 同步失败:', err)
} finally {
  if (fs.existsSync(TEMP_DIR)) {
    fs.rmSync(TEMP_DIR, { recursive: true, force: true })
  }
}
