<script setup lang="ts">
import { ref } from 'vue'
import {
  CheckCircle2,
  Film,
  FileJson,
  Loader2,
  Video,
  X,
} from '@lucide/vue'
import { computeLayerTransform } from '../engine/animation'
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
const downloadUrl = ref('')

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
  a.download = `frameflow-project-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
}

// 逐帧离线渲染并使用 MediaRecorder 编码视频
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

  const stream = canvas.captureStream(targetFps)
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
    ? 'video/webm;codecs=vp9'
    : 'video/webm'

  const recorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 8_000_000,
  })

  const chunks: Blob[] = []
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data)
  }

  const finishedPromise = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: 'video/webm' }))
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
      imgCache.set(l.id, img)
    }
  }

  // 逐帧绘制循环
  for (let frame = 0; frame <= totalFrames; frame++) {
    const t = frame * frameInterval

    // 绘制暗色背景
    ctx.fillStyle = '#0b0e14'
    ctx.fillRect(0, 0, width, height)

    // 绘制中央主画板
    const scaleFactor = width / 1920
    ctx.save()
    ctx.scale(scaleFactor, scaleFactor)

    const activeLayers = [...editor.layers].reverse()
    for (const layer of activeLayers) {
      if (layer.kind === 'audio') continue
      const tr = computeLayerTransform(layer, t)
      if (!tr.visible) continue

      ctx.save()
      ctx.translate(tr.x, tr.y)
      ctx.rotate((tr.rotation * Math.PI) / 180)
      ctx.scale(tr.scale / 100, tr.scale / 100)
      ctx.globalAlpha = tr.opacity / 100

      if (layer.kind === 'text') {
        ctx.fillStyle = layer.fontColor || '#ffffff'
        ctx.font = `bold ${layer.fontSize || 48}px Inter, system-ui, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.shadowColor = 'rgba(0,0,0,0.5)'
        ctx.shadowBlur = 10
        ctx.fillText(tr.displayedText, 0, 0)
      } else if (layer.kind === 'image') {
        const cachedImg = imgCache.get(layer.id)
        if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
          ctx.drawImage(cachedImg, -cachedImg.width / 2, -cachedImg.height / 2)
        } else {
          // 优雅卡片
          ctx.fillStyle = '#141a24'
          ctx.strokeStyle = '#323d4d'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.roundRect(-300, -180, 600, 360, 24)
          ctx.fill()
          ctx.stroke()

          ctx.fillStyle = '#8a99ad'
          ctx.font = '600 24px system-ui'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(layer.name, 0, 0)
        }
      }
      ctx.restore()
    }

    ctx.restore()

    exportProgress.value = Math.min(99, Math.round((frame / totalFrames) * 100))

    // 释放主线程微任务让编码器捕获
    await new Promise((r) => setTimeout(r, 8))
  }

  recorder.stop()
  const videoBlob = await finishedPromise
  downloadUrl.value = URL.createObjectURL(videoBlob)

  exportProgress.value = 100
  isExporting.value = false
  exportSuccess.value = true

  // 自动触发下载
  const a = document.createElement('a')
  a.href = downloadUrl.value
  a.download = `frameflow-render-${Date.now()}.webm`
  a.click()
}
</script>

<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm select-none"
    @click.self="close"
  >
    <div
      class="w-[460px] rounded-xl border border-[#2a3444] bg-[#12161f] p-5 shadow-2xl text-slate-200 transition-all"
    >
      <!-- 弹窗标题 -->
      <div class="flex items-center justify-between border-b border-[#242b35] pb-3 mb-4">
        <div class="flex items-center gap-2">
          <Film :size="18" class="text-violet-400" />
          <h2 class="text-sm font-semibold">渲染与导出</h2>
        </div>
        <button
          class="rounded p-1 text-slate-500 hover:bg-[#1f2735] hover:text-slate-200 transition"
          :disabled="isExporting"
          @click="close"
        >
          <X :size="16" />
        </button>
      </div>

      <!-- 导出选项 -->
      <div v-if="!isExporting && !exportSuccess" class="space-y-4">
        <!-- 分辨率 -->
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
              <span class="text-[10px] text-slate-500">1920 × 1080 · 极清品质</span>
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
            <div class="flex gap-2">
              <button
                :class="['flex-1 py-1.5 rounded-md border text-xs font-mono transition', fps === 30 ? 'border-violet-500 bg-violet-950/40 text-violet-200' : 'border-[#242c38] bg-[#0c1016] text-slate-400']"
                @click="fps = 30"
              >
                30 FPS
              </button>
              <button
                :class="['flex-1 py-1.5 rounded-md border text-xs font-mono transition', fps === 60 ? 'border-violet-500 bg-violet-950/40 text-violet-200' : 'border-[#242c38] bg-[#0c1016] text-slate-400']"
                @click="fps = 60"
              >
                60 FPS
              </button>
            </div>
          </div>

          <div>
            <label class="block text-[11px] font-medium text-slate-400 mb-1.5">导出格式</label>
            <div class="flex gap-2">
              <button
                :class="['flex-1 py-1.5 rounded-md border text-xs font-mono transition', format === 'webm' ? 'border-violet-500 bg-violet-950/40 text-violet-200' : 'border-[#242c38] bg-[#0c1016] text-slate-400']"
                @click="format = 'webm'"
              >
                WebM (默认)
              </button>
            </div>
          </div>
        </div>

        <!-- 项目文件备份按钮 -->
        <div class="rounded-lg bg-[#0e121a] p-3 border border-[#212936] flex items-center justify-between">
          <div class="flex items-center gap-2">
            <FileJson :size="16" class="text-cyan-400" />
            <div>
              <p class="text-xs font-medium text-slate-200">工程源文件 (JSON)</p>
              <p class="text-[10px] text-slate-500">保存全部关键帧与图层参数</p>
            </div>
          </div>
          <button
            class="px-2.5 py-1 text-xs rounded border border-[#2a3444] bg-[#161c26] text-slate-300 hover:text-white hover:border-slate-500 transition"
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
          <p class="text-sm font-semibold text-slate-100">正在逐帧渲染 MG 视频...</p>
          <p class="text-xs text-slate-500 mt-1">计算关键帧曲线与插值渲染 {{ exportProgress }}%</p>
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
          <p class="text-sm font-semibold text-slate-100">渲染导出完成！</p>
          <p class="text-xs text-slate-400 mt-1">视频已保存并自动触发浏览器下载</p>
        </div>
      </div>

      <!-- 底部控制按钮 -->
      <div class="flex items-center justify-end gap-2 border-t border-[#242b35] pt-3 mt-4">
        <button
          class="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
          :disabled="isExporting"
          @click="close"
        >
          取消
        </button>
        <button
          v-if="!isExporting && !exportSuccess"
          class="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-violet-900/30 hover:bg-violet-500 transition active:scale-95"
          @click="exportVideo"
        >
          <Video :size="14" />
          <span>开始渲染导出</span>
        </button>
        <button
          v-else-if="exportSuccess"
          class="rounded-lg bg-emerald-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 transition"
          @click="close"
        >
          完成
        </button>
      </div>
    </div>
  </div>
</template>
