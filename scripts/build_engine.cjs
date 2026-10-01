const fs = require('fs')
const path = require('path')

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
  '../app/chinese_hans.js',
]

// Also update sync_jizura.js with this same logic
let bundle = ''
for (const f of files) {
  const p = path.resolve('temp_jizura_core/src', f)
  let code = ''
  if (fs.existsSync(p)) {
    code = fs.readFileSync(p, 'utf8')
  } else {
    // If temp_jizura_core is removed, check if jizuraEngine.js exists
    const enginePath = path.resolve('src/engine/jizura/jizuraEngine.js')
    if (fs.existsSync(enginePath)) {
      code = fs.readFileSync(enginePath, 'utf8')
      code = code.replace(/const J = \(window\.J = window\.J \|\| \{\}\);/g, 'J = (window.J = window.J || {});')
      code = code.replace(/const J = _global\.J = _global\.J \|\| \{\};/g, 'var J = _global.J = _global.J || {};')
      fs.writeFileSync(enginePath, code, 'utf8')
      console.log('Fixed jizuraEngine.js declarations directly!')
      process.exit(0)
    }
  }
  if (f === '01_util.js') {
    code = code.replace('const J = (window.J = window.J || {});', 'J = (window.J = window.J || {});')
  }
  bundle += code + '\n'
}

const wrapped = `// @ts-nocheck
/* ============================================================
   JIZURA Full Standalone Core Engine Runtime
   ============================================================ */
var _global = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof self !== 'undefined' ? self : this;
if (!_global.window) _global.window = _global;
var J = _global.J = _global.J || {};

${bundle}

export { J };
export default J;
`

fs.writeFileSync(path.resolve('src/engine/jizura/jizuraEngine.js'), wrapped, 'utf8')
console.log('✅ Generated src/engine/jizura/jizuraEngine.js with full JIZURA engine!')
