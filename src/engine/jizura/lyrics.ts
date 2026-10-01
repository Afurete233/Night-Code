export type LyricLayoutType =
  | 'center'
  | 'mixed'
  | 'vcols'
  | 'huge'
  | 'marquee'
  | 'staircase'
  | 'pill'
  | 'bubble'
  | 'ransom'
  | 'karaoke'

export type TextTreatmentType =
  | 'none'
  | 'outline'
  | 'doubleOutline'
  | 'extrude'
  | 'hardShadow'
  | 'glow'
  | 'marker'
  | 'gradientV'
  | 'glitchSplit'
  | 'boxed'
  | 'sticker'

export interface LyricLayoutDef {
  id: LyricLayoutType
  name: string
  desc: string
}

export const LYRIC_LAYOUTS: LyricLayoutDef[] = [
  { id: 'center', name: '标准居中', desc: '经典优雅居中排版' },
  { id: 'mixed', name: '大小混排', desc: '重点词自动放大突出 (用*包裹)' },
  { id: 'vcols', name: '日式竖排', desc: '古风/日系传统纵向排版' },
  { id: 'huge', name: '出框巨字', desc: '超出画面视觉冲击大字' },
  { id: 'marquee', name: '横幅流动', desc: '宽版流动字幕' },
  { id: 'staircase', name: '阶梯错落', desc: '行间阶梯层叠推进' },
  { id: 'pill', name: '胶囊字块', desc: '圆角药丸背景条' },
  { id: 'bubble', name: '漫画气泡', desc: '二次元对话框风' },
  { id: 'ransom', name: '剪报拼贴', desc: '杂志撕纸剪贴风' },
  { id: 'karaoke', name: '卡拉OK高亮', desc: '随节拍逐字色彩高亮' },
]

export interface TextTreatmentDef {
  id: TextTreatmentType
  name: string
  desc: string
}

export const TEXT_TREATMENTS: TextTreatmentDef[] = [
  { id: 'none', name: '纯色填充', desc: '无附加特效' },
  { id: 'outline', name: '空心镂空', desc: '描边线稿镂空' },
  { id: 'doubleOutline', name: '双层描边', desc: '内外双色描边增强' },
  { id: 'extrude', name: '3D 立体字', desc: '等轴立体挤出厚度' },
  { id: 'hardShadow', name: '错位硬阴影', desc: '波普风直角硬阴影' },
  { id: 'glow', name: '霓虹发光', desc: '柔和漫反射辉光' },
  { id: 'marker', name: '荧光笔高亮', desc: '底色手绘荧光底带' },
  { id: 'gradientV', name: '双色垂直渐变', desc: '上下双色平滑过渡' },
  { id: 'glitchSplit', name: 'RGB 色彩错位', desc: '赛博红蓝分色重影' },
  { id: 'boxed', name: '徽标方框', desc: '实心反转底框' },
  { id: 'sticker', name: '贴纸白边', desc: '二次元粗白边贴纸' },
]

export interface ParsedLyricLine {
  text: string
  subText?: string
  start?: number
  duration?: number
  emphasisWords?: string[]
}

/**
 * LRC 与多行歌词文本智能解析器
 */
export function parseLyricText(raw: string, defaultDurationPerLine = 2.5): ParsedLyricLine[] {
  const lines = raw.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const result: ParsedLyricLine[] = []

  const timeRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?\]/

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i]
    let text = rawLine
    let startTime: number | undefined = undefined

    // 匹配 LRC 时间戳 [01:23.45]
    const match = rawLine.match(timeRegex)
    if (match) {
      const minutes = parseInt(match[1], 10)
      const seconds = parseInt(match[2], 10)
      const ms = match[3] ? parseFloat(`0.${match[3]}`) : 0
      startTime = Number((minutes * 60 + seconds + ms).toFixed(2))
      text = rawLine.replace(timeRegex, '').trim()
    }

    // 提取副歌词 / 翻译 / 注音 (格式: "主歌词 // 英文翻译" 或 "主歌词 (副标题)")
    let subText: string | undefined = undefined
    if (text.includes('//')) {
      const parts = text.split('//')
      text = parts[0].trim()
      subText = parts.slice(1).join('//').trim()
    } else if (text.includes('（') && text.endsWith('）')) {
      const p = text.lastIndexOf('（')
      subText = text.slice(p + 1, text.length - 1).trim()
      text = text.slice(0, p).trim()
    } else if (text.includes('(') && text.endsWith(')')) {
      const p = text.lastIndexOf('(')
      subText = text.slice(p + 1, text.length - 1).trim()
      text = text.slice(0, p).trim()
    }

    // 提取 *重点强调词*
    const emphasisWords: string[] = []
    const cleanText = text.replace(/\*([^*]+)\*/g, (_, word) => {
      emphasisWords.push(word)
      return word
    })

    if (cleanText) {
      result.push({
        text: cleanText,
        subText,
        start: startTime,
        duration: defaultDurationPerLine,
        emphasisWords: emphasisWords.length > 0 ? emphasisWords : undefined,
      })
    }
  }

  // 若带时间戳，根据后一句的时间自动推导前一句的时长
  for (let i = 0; i < result.length; i++) {
    if (result[i].start !== undefined) {
      if (i + 1 < result.length && result[i + 1].start !== undefined) {
        const gap = result[i + 1].start! - result[i].start!
        if (gap > 0.3) {
          result[i].duration = Number(Math.min(gap, 6.0).toFixed(2))
        }
      }
    } else {
      // 线性递增时间分配
      result[i].start = Number((i * defaultDurationPerLine).toFixed(2))
    }
  }

  return result
}
