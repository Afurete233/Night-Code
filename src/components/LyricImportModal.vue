<script setup lang="ts">
import { computed, ref } from 'vue'
import { Sparkles, Wand2 } from '@lucide/vue'
import Dialog from './ui/Dialog.vue'
import Select from './ui/Select.vue'
import { JIZURA_STYLES } from '../engine/jizura/styles'
import { parseLyricText, type ParsedLyricLine } from '../engine/jizura/lyrics'
import { useEditorStore } from '../stores/editor'

const editor = useEditorStore()

const sampleLyrics = `我还记得 // The Color of Dawn
黎明的颜色
远处响起渐渐散去的声音 // A fading whisper
现在还来得及吗？
不想就这样 *透明* 地结束!`

const lyricsInput = ref(sampleLyrics)
const selectedStyleId = ref('noir')
const durationPerLine = ref(2.8)
const clearExisting = ref(true)

const styleOptions = JIZURA_STYLES.map((s) => ({
  label: `${s.name} (${s.desc.slice(0, 16)}...)`,
  value: s.id,
}))

const parsedLines = computed<ParsedLyricLine[]>(() => {
  return parseLyricText(lyricsInput.value, durationPerLine.value)
})

function onGenerate() {
  editor.importLyricsToTimeline(parsedLines.value, {
    clearExisting: clearExisting.value,
    styleId: selectedStyleId.value,
  })
  editor.showLyricModal = false
}

function loadSample(type: 'jizura' | 'fast' | 'ballad') {
  if (type === 'jizura') {
    lyricsInput.value = sampleLyrics
    selectedStyleId.value = 'noir'
  } else if (type === 'fast') {
    lyricsInput.value = `[00:00.00] 疾速霓虹闪烁 // Cyber Overdrive\n[00:02.00] 穿梭在无尽的 *赛博都市*\n[00:04.20] 数据的洪流吞没一切 // Flow of Data\n[00:06.50] 启动最后的 *超频驱动* !`
    selectedStyleId.value = 'synth80'
  } else if (type === 'ballad') {
    lyricsInput.value = `微风吹拂过山岚 // Gentle breeze\n樱花悄然在掌心飘落\n时光慢些吧 // Stay a little longer\n愿这一刻成为 *永恒*`
    selectedStyleId.value = 'sakura'
  }
}
</script>

<template>
  <Dialog
    :open="editor.showLyricModal"
    title="JIZURA 智能歌词与排版生成器"
    :icon="Wand2"
    @update:open="editor.showLyricModal = $event"
  >
    <div class="space-y-4 text-xs text-slate-300">
      <!-- 快捷样例切换 -->
      <div class="flex items-center justify-between bg-[#0e121a] p-2 rounded-lg border border-[#202735]">
        <span class="text-[11px] text-slate-400 font-medium">快速范例：</span>
        <div class="flex items-center gap-1.5">
          <button
            class="px-2 py-1 rounded bg-[#18202c] hover:bg-violet-600 hover:text-white text-[10px] text-slate-300 transition"
            @click="loadSample('jizura')"
          >
            经典 JIZURA
          </button>
          <button
            class="px-2 py-1 rounded bg-[#18202c] hover:bg-violet-600 hover:text-white text-[10px] text-slate-300 transition"
            @click="loadSample('fast')"
          >
            带时间戳 LRC (快节奏)
          </button>
          <button
            class="px-2 py-1 rounded bg-[#18202c] hover:bg-violet-600 hover:text-white text-[10px] text-slate-300 transition"
            @click="loadSample('ballad')"
          >
            和风抒情
          </button>
        </div>
      </div>

      <!-- 歌词多行文本输入框 -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="text-[11px] font-medium text-slate-300">歌词文本 (支持 LRC 时间戳 / //翻译小字 / *重点强调*)</label>
          <span class="text-[10px] text-violet-400 font-mono">已解析 {{ parsedLines.length }} 句歌词</span>
        </div>
        <textarea
          v-model="lyricsInput"
          rows="6"
          class="w-full rounded-md border border-[#273242] bg-[#0c1015] p-2.5 font-mono text-xs text-slate-100 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 leading-relaxed"
          placeholder="粘贴歌词文本或带 [00:12.34] 的 LRC 歌词..."
        />
      </div>

      <!-- 风格与参数设置 -->
      <div class="grid grid-cols-2 gap-3">
        <div>
          <label class="block text-[10px] font-medium text-slate-400 mb-1">视觉风格主题</label>
          <Select
            v-model="selectedStyleId"
            :options="styleOptions"
          />
        </div>

        <div>
          <label class="block text-[10px] font-medium text-slate-400 mb-1">无时间戳时单句时长 (秒)</label>
          <input
            v-model.number="durationPerLine"
            type="number"
            min="1"
            max="10"
            step="0.5"
            class="h-8 w-full rounded-md border border-[#273242] bg-[#0c1015] px-2.5 text-xs text-slate-200 outline-none focus:border-violet-500"
          />
        </div>
      </div>

      <!-- 选项 -->
      <div class="flex items-center gap-2 pt-1">
        <input
          id="clearExistingCheck"
          v-model="clearExisting"
          type="checkbox"
          class="rounded border-slate-700 bg-[#0c1015] text-violet-600 focus:ring-0 cursor-pointer"
        />
        <label for="clearExistingCheck" class="text-[11px] text-slate-400 cursor-pointer select-none">
          生成时替换现有视觉图层 (保留音频伴奏轨)
        </label>
      </div>

      <!-- 解析预览卡片列表 -->
      <div v-if="parsedLines.length > 0" class="max-h-36 overflow-y-auto rounded-lg border border-[#1f2735] bg-[#0a0d13] p-2 space-y-1.5">
        <div
          v-for="(line, idx) in parsedLines"
          :key="idx"
          class="flex items-center justify-between rounded bg-[#111722] px-2.5 py-1.5 text-[11px]"
        >
          <div class="flex items-center gap-2 min-w-0 flex-1">
            <span class="font-mono text-[10px] text-violet-400">#{{ idx + 1 }}</span>
            <span class="truncate font-medium text-slate-200">{{ line.text }}</span>
            <span v-if="line.subText" class="truncate text-[10px] text-slate-500">({{ line.subText }})</span>
          </div>
          <span class="font-mono text-[10px] text-slate-400 shrink-0 ml-2">{{ line.start }}s ~ {{ (line.start! + line.duration!).toFixed(1) }}s</span>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-end gap-2">
        <button
          class="rounded-md px-3 py-1.5 text-xs font-medium text-slate-400 hover:bg-[#18202d] hover:text-white transition"
          @click="editor.showLyricModal = false"
        >
          取消
        </button>
        <button
          class="flex items-center gap-1.5 rounded-md bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-violet-950/50 hover:from-violet-500 hover:to-indigo-500 transition"
          @click="onGenerate"
        >
          <Sparkles :size="13" />
          <span>一键智能生成排版</span>
        </button>
      </div>
    </template>
  </Dialog>
</template>
