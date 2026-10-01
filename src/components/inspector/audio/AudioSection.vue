<script setup lang="ts">
import { ref } from 'vue'
import { Music2, Upload } from '@lucide/vue'
import CollapsibleSection from '../common/CollapsibleSection.vue'
import type { Layer } from '../../../engine/types'
import { audioEngine } from '../../../engine/audio'
import { useEditorStore } from '../../../stores/editor'

defineProps<{
  layer: Layer
}>()

const editor = useEditorStore()
const fileInput = ref<HTMLInputElement | null>(null)

async function onAudioSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  const url = URL.createObjectURL(file)
  const { buffer, waveform } = await audioEngine.loadAudio(url)
  editor.updateSelected({
    assetUrl: url,
    name: file.name,
    duration: Number(buffer.duration.toFixed(2)),
    waveform,
  })
  ;(e.target as HTMLInputElement).value = ''
}
</script>

<template>
  <CollapsibleSection title="音频轨设置" :icon="Music2" :default-open="true">
    <div class="space-y-3">
      <!-- 波形预览 -->
      <div class="rounded-md border border-[#202733] bg-[#0c1015] p-2.5 space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-xs font-semibold text-slate-200 truncate">{{ layer.name }}</span>
          <span class="font-mono text-[10px] text-emerald-400">Audio Track</span>
        </div>

        <div class="flex h-10 w-full items-center gap-[1px] rounded bg-[#131922] px-2 overflow-hidden">
          <div
            v-for="(val, i) in layer.waveform || []"
            :key="i"
            class="w-[2px] rounded-full bg-emerald-400 opacity-80"
            :style="{ height: `${Math.max(15, val * 100)}%` }"
          />
        </div>

        <div class="flex items-center justify-between pt-1">
          <span class="text-[10px] text-slate-500 font-mono">时长: {{ layer.duration }}s</span>
          <input
            ref="fileInput"
            type="file"
            accept="audio/*"
            class="hidden"
            @change="onAudioSelect"
          />
          <button
            class="flex items-center gap-1 rounded bg-[#1c2331] px-2 py-1 text-[10px] font-medium text-slate-300 hover:bg-violet-600 hover:text-white transition"
            @click="fileInput?.click()"
          >
            <Upload :size="11" />
            <span>更换音轨</span>
          </button>
        </div>
      </div>
    </div>
  </CollapsibleSection>
</template>
