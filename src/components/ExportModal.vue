<script setup lang="ts">
import { ref } from 'vue'
import {
  CheckCircle2,
  Film,
  FileJson,
  Loader2,
  Video,
} from '@lucide/vue'
import { computeLayerTransform } from '../engine/animation'
import {
  compileJizuraLayerPlan,
  drawJizuraBackground,
  renderJizuraFrame,
} from '../engine/jizura/renderer'
import { getJizuraStyle, JIZURA_STYLES } from '../engine/jizura/styles'
import Dialog from './ui/Dialog.vue'
import Select from './ui/Select.vue'
import { useEditorStore } from '../stores/editor'

defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
}>()

const editor = useEditorStore()

const resolution = ref<'1080p' | '720p'>('1080p')
const fps = ref<30 | 60>(30)
const format = ref<'webm' | 'mp4'>('webm')

const isExporting = ref(false)
const exportProgress = ref(0)
const exportSuccess = ref(false)

function close() {
  if (isExporting.value) return
  exportSuccess.value = false
  emit('close')
}

// 导出 JSON 项目文件
function exportJSON() {
  const jsonStr = editor.exportProjectJSON()
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `jizura-frameflow-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// 逐帧离线渲染并使用 MediaRecorder 编码导出 JIZURA 动态视频
async function exportVideo() {
  isExporting.value = true
  exportProgress.value = 0
  exportSuccess.value = false

  const width = resolution.value === '1080p' ? 1920 : 1280
  const height = resolution.value === '1080p' ? 1080 : 720
  const targetFps = fps.value

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    isExporting.value = false
    return
  }

  // JIZURA 离线图层渲染画板
  const layerCanvas = document.createElement('canvas')
  layerCanvas.width = 1920
  layerCanvas.height = 1080
  const layerCtx = layerCanvas.getContext('2d')

  const stream = canvas.captureStream(targetFps)
  let preferredMime = 'video/webm'
  if (format.value === 'mp4') {
    if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1.42E01E,mp4a.40.2')) {
      preferredMime = 'video/mp4;codecs=avc1.42E01E,mp4a.40.2'
    } else if (MediaRecorder.isTypeSupported('video/mp4')) {
      preferredMime = 'video/mp4'
    }
  } else {
    if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
      preferredMime = 'video/webm;codecs=vp9'
    }
  }

  const recorder = new MediaRecorder(stream, {
    mimeType: preferredMime,
    videoBitsPerSecond: 16_000_000,
  })

  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  const finishedPromise = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: preferredMime }))
    }
  })

  recorder.start()

  const totalFrames = Math.ceil(editor.duration * targetFps)
  const frameInterval = 1 / targetFps

  // 预先缓存图片元素
  const imgCache = new Map<string, HTMLImageElement>()
  for (const l of editor.layers) {
    if (l.kind === 'image' && l.assetUrl) {
      const img = new Image()
      img.src = l.assetUrl
      await new Promise((res) => {
        img.onload = res
        img.onerror = res
      })
      imgCache.set(l.id, img)
    }
  }

  // 逐帧高质量渲染与推流
  for (let f = 0; f < totalFrames; f++) {
    const t = f * frameInterval
    renderFrameToCanvas(ctx, width, height, t, imgCache, layerCanvas, layerCtx)
    exportProgress.value = Math.round((f / totalFrames) * 100)

    // 让出微任务时间，供 MediaRecorder 吞吐视频帧
    await new Promise((resolve) => setTimeout(resolve, 8))
  }

  recorder.stop()
  const finalBlob = await finishedPromise

  // 自动触发浏览器下载
  const ext = format.value === 'mp4' && preferredMime.includes('mp4') ? 'mp4' : 'webm'
  const url = URL.createObjectURL(finalBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = `jizura-motion-${Date.now()}.${ext}`
  a.click()
  URL.revokeObjectURL(url)

  isExporting.value = false
  exportSuccess.value = true
  exportProgress.value = 100
}

function renderFrameToCanvas(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  time: number,
  imgCache: Map<string, HTMLImageElement>,
  layerCanvas: HTMLCanvasElement,
  layerCtx: CanvasRenderingContext2D | null
) {
  const scaleRatio = w / 1920

  // 1. 渲染 JIZURA 背景层（当前时间轴激活的背景素材或全局底色）
  const activeBgLayer = editor.layers.find(
    (l) => l.kind === 'background' && l.visible && time >= l.start && time <= l.start + l.duration
  )

  const bgKey = activeBgLayer?.bgPreset || activeBgLayer?.bgType || editor.backgroundConfig.type || 'meshBlobs'
  const style = getJizuraStyle(editor.activeJizuraStyleId) || JIZURA_STYLES[0]
  const scheme = {
    bg: activeBgLayer?.colorA || editor.backgroundConfig.colorA || style.scheme.bg,
    fg: style.scheme.fg,
    accent: activeBgLayer?.colorB || editor.backgroundConfig.colorB || style.scheme.accent,
    accent2: activeBgLayer?.colorC || editor.backgroundConfig.colorC || style.scheme.accent2,
    sub: style.scheme.sub,
    ink: style.scheme.ink,
    dim: style.scheme.dim,
  }

  drawJizuraBackground(ctx, w, h, bgKey, scheme, time)

  // 2. 按照真实层级顺序从下到上依次渲染各图层
  const activeLayers = [...editor.layers].reverse()

  for (const layer of activeLayers) {
    if (layer.kind === 'audio' || layer.kind === 'background') continue

    // 检查图层显隐与时间有效性
    const isTimeActive = time >= layer.start && time <= layer.start + layer.duration
    if (!layer.visible || !isTimeActive) continue

    const tr = computeLayerTransform(layer, time)
    if (!tr.visible) continue

    // A. 文本图层：完美导出 JIZURA 动态文字排版或标准文字
    if (layer.kind === 'text') {
      const isJizura = layer.useJizura !== false

      if (isJizura && layerCtx) {
        layerCtx.clearRect(0, 0, 1920, 1080)
        const singlePlan = compileJizuraLayerPlan(layer, editor.activeJizuraStyleId)
        if (singlePlan) {
          const localTime = Math.max(0, Math.min(layer.duration, time - layer.start))
          renderJizuraFrame(layerCtx, singlePlan, localTime, { transparent: true })
        }

        ctx.save()
        const offsetX = (tr.x - 960) * scaleRatio
        const offsetY = (tr.y - 540) * scaleRatio
        ctx.translate(offsetX, offsetY)
        ctx.globalAlpha = tr.opacity / 100
        ctx.drawImage(layerCanvas, 0, 0, w, h)
        ctx.restore()
      } else {
        ctx.save()
        const targetX = tr.x * scaleRatio
        const targetY = tr.y * scaleRatio
        ctx.translate(targetX, targetY)
        ctx.rotate((tr.rotation * Math.PI) / 180)
        ctx.scale((tr.scale / 100) * scaleRatio, (tr.scale / 100) * scaleRatio)
        ctx.globalAlpha = tr.opacity / 100

        const fontSize = Math.round((layer.fontSize || 48) * scaleRatio)
        ctx.font = `bold ${fontSize}px Inter, "Noto Sans SC", system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillStyle = layer.fontColor || '#ffffff'
        ctx.shadowColor = 'rgba(0,0,0,0.5)'
        ctx.shadowBlur = 12
        ctx.shadowOffsetY = 4
        ctx.fillText(tr.displayedText || '', 0, 0)
        ctx.restore()
      }
    } else if (layer.kind === 'image') {
      // B. 渲染图片素材
      ctx.save()
      const targetX = tr.x * scaleRatio
      const targetY = tr.y * scaleRatio
      ctx.translate(targetX, targetY)
      ctx.rotate((tr.rotation * Math.PI) / 180)
      ctx.scale((tr.scale / 100) * scaleRatio, (tr.scale / 100) * scaleRatio)
      ctx.globalAlpha = tr.opacity / 100

      const img = imgCache.get(layer.id)
      if (img && img.complete && img.naturalWidth > 0) {
        const maxWidth = 900
        const maxHeight = 620
        const fitScale = Math.min(maxWidth / img.naturalWidth, maxHeight / img.naturalHeight, 1)
        const dw = img.naturalWidth * fitScale
        const dh = img.naturalHeight * fitScale
        ctx.drawImage(img, -dw / 2, -dh / 2, dw, dh)
      } else {
        ctx.fillStyle = '#131924'
        ctx.strokeStyle = '#384355'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.roundRect(-300, -180, 600, 360, 24)
        ctx.fill()
        ctx.stroke()
      }
      ctx.restore()
    } else if (layer.kind === 'shape') {
      // C. 渲染几何色块
      ctx.save()
      const targetX = tr.x * scaleRatio
      const targetY = tr.y * scaleRatio
      ctx.translate(targetX, targetY)
      ctx.rotate((tr.rotation * Math.PI) / 180)
      ctx.scale((tr.scale / 100) * scaleRatio, (tr.scale / 100) * scaleRatio)
      ctx.globalAlpha = tr.opacity / 100

      const bw = (layer.blockWidth || 400) * scaleRatio
      const bh = (layer.blockHeight || 280) * scaleRatio
      const br = (layer.borderRadius ?? 0) * scaleRatio
      ctx.fillStyle = layer.blockColor || layer.color || '#6366f1'
      ctx.beginPath()
      ctx.roundRect(-bw / 2, -bh / 2, bw, bh, br)
      ctx.fill()
      ctx.restore()
    }
  }
}
</script>

<template>
  <Dialog
    :open="open"
    title="渲染与导出项目"
    description="离线逐帧渲染 JIZURA 动态视觉视频 (MP4 / WebM) 或导出工程源文件"
    max-width="max-w-[440px]"
    :show-close="!isExporting"
    @close="close"
  >
    <template #title>
      <div class="flex items-center gap-2">
        <Film :size="16" class="text-violet-400" />
        <span>JIZURA 渲染与导出</span>
      </div>
    </template>

    <!-- 导出设置主体 -->
    <div v-if="!isExporting && !exportSuccess" class="space-y-4 pt-1">
      <!-- 分辨率选择卡片 -->
      <div>
        <label class="block text-[11px] font-medium text-slate-400 mb-1.5">导出分辨率</label>
        <div class="grid grid-cols-2 gap-2">
          <button
            :class="[
              'flex flex-col items-start p-2.5 rounded-lg border text-left transition',
              resolution === '1080p'
                ? 'border-violet-500/80 bg-violet-950/40 text-violet-200'
                : 'border-[#232b37] bg-[#0c1016] text-slate-400 hover:border-slate-600'
            ]"
            @click="resolution = '1080p'"
          >
            <span class="text-xs font-semibold">1080P 全高清</span>
            <span class="text-[10px] text-slate-500">1920 × 1080 · 电影级品质</span>
          </button>

          <button
            :class="[
              'flex flex-col items-start p-2.5 rounded-lg border text-left transition',
              resolution === '720p'
                ? 'border-violet-500/80 bg-violet-950/40 text-violet-200'
                : 'border-[#232b37] bg-[#0c1016] text-slate-400 hover:border-slate-600'
            ]"
            @click="resolution = '720p'"
          >
            <span class="text-xs font-semibold">720P 高清</span>
            <span class="text-[10px] text-slate-500">1280 × 720 · 渲染更快</span>
          </button>
        </div>
      </div>

      <!-- 帧率与格式 -->
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-[11px] font-medium text-slate-400 mb-1.5">帧率 (FPS)</label>
          <Select
            :model-value="String(fps)"
            :options="[
              { label: '30 FPS (标准电影感)', value: '30' },
              { label: '60 FPS (丝滑高帧率)', value: '60' }
            ]"
            @update:model-value="fps = Number($event) as 30 | 60"
          />
        </div>

        <div>
          <label class="block text-[11px] font-medium text-slate-400 mb-1.5">导出格式</label>
          <Select
            :model-value="format"
            :options="[
              { label: 'WebM (VP9 极清画质)', value: 'webm' },
              { label: 'MP4 (剪辑软件广泛兼容)', value: 'mp4' }
            ]"
            @update:model-value="format = $event as 'webm' | 'mp4'"
          />
        </div>
      </div>

      <!-- 项目文件备份卡片 -->
      <div class="rounded-lg bg-[#0e121a] p-3 border border-[#212936] flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <FileJson :size="17" class="text-cyan-400 shrink-0" />
          <div>
            <p class="text-xs font-medium text-slate-200">工程源文件 (JSON)</p>
            <p class="text-[10px] text-slate-500">保存全部 JIZURA 预设、关键帧与图层数据</p>
          </div>
        </div>
        <button
          class="px-2.5 py-1 text-xs rounded-md border border-[#2a3444] bg-[#161c26] text-slate-300 hover:text-white hover:border-slate-500 transition"
          @click="exportJSON"
        >
          导出工程
        </button>
      </div>
    </div>

    <!-- 渲染进度展示 -->
    <div v-else-if="isExporting" class="py-6 text-center space-y-4">
      <Loader2 :size="32" class="mx-auto text-violet-500 animate-spin" />
      <div>
        <p class="text-sm font-semibold text-slate-100">正在逐帧离线渲染 JIZURA 动态视频...</p>
        <p class="text-xs text-slate-400 mt-1">计算排版布局、粒子动效与 3D 修饰 · {{ exportProgress }}%</p>
      </div>
      <!-- 进度条 -->
      <div class="w-full bg-[#18202c] rounded-full h-2 overflow-hidden border border-[#273242]">
        <div
          class="bg-gradient-to-r from-violet-500 to-indigo-500 h-full transition-all duration-150"
          :style="{ width: `${exportProgress}%` }"
        />
      </div>
    </div>

    <!-- 渲染完成展示 -->
    <div v-else-if="exportSuccess" class="py-6 text-center space-y-3">
      <CheckCircle2 :size="36" class="mx-auto text-emerald-400" />
      <div>
        <p class="text-sm font-semibold text-slate-100">JIZURA 视频渲染导出完成！</p>
        <p class="text-xs text-slate-400 mt-1">视频已保存并自动触发下载，可直接导入剪映/AE/PR进行后期剪辑</p>
      </div>
    </div>

    <!-- 底部控制按钮 -->
    <template #footer>
      <button
        class="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
        :disabled="isExporting"
        @click="close"
      >
        取消
      </button>
      <button
        v-if="!isExporting && !exportSuccess"
        class="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-violet-900/30 hover:from-violet-500 hover:to-indigo-500 transition active:scale-95"
        @click="exportVideo"
      >
        <Video :size="14" />
        <span>开始离线渲染导出</span>
      </button>
      <button
        v-else-if="exportSuccess"
        class="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition"
        @click="close"
      >
        完成
      </button>
    </template>
  </Dialog>
</template>
