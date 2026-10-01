<script setup lang="ts">
import { Square } from '@lucide/vue'
import CollapsibleSection from '../common/CollapsibleSection.vue'
import ScrubInput from '../../ui/ScrubInput.vue'
import type { Layer } from '../../../engine/types'
import { useEditorStore } from '../../../stores/editor'

const props = defineProps<{
  layer: Layer
}>()

const editor = useEditorStore()

const colorPresets = [
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#f43f5e', // Rose
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#1e293b', // Slate
  '#ffffff', // White
]

function selectPresetColor(color: string) {
  editor.updateSelected({
    blockColor: color,
    color: color,
  })
}

function applyAspectPreset(w: number, h: number) {
  editor.updateSelected({
    blockWidth: w,
    blockHeight: h,
  })
}
</script>

<template>
  <CollapsibleSection title="色块属性" :icon="Square" :default-open="true">
    <div class="space-y-3.5">
      <!-- 填充颜色与 Hex 输入 -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="text-[10px] font-medium text-slate-400">填充颜色</label>
          <span class="font-mono text-[10px] text-slate-500 uppercase">{{ layer.blockColor || layer.color }}</span>
        </div>

        <div class="flex h-8 items-center justify-between rounded-md border border-[#242c38] bg-[#0c1015] px-2">
          <span class="text-[11px] font-medium text-slate-500">色块色彩</span>
          <div class="flex items-center gap-1.5">
            <input
              type="text"
              class="w-16 bg-transparent text-right font-mono text-[11px] text-slate-300 outline-none uppercase"
              :value="layer.blockColor || layer.color || '#6366f1'"
              @change="selectPresetColor(($event.target as HTMLInputElement).value)"
            />
            <input
              type="color"
              class="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
              :value="layer.blockColor || layer.color || '#6366f1'"
              @input="selectPresetColor(($event.target as HTMLInputElement).value)"
              @change="selectPresetColor(($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>

        <!-- 预设调色板 -->
        <div class="flex items-center gap-1.5 pt-2">
          <button
            v-for="c in colorPresets"
            :key="c"
            :style="{ backgroundColor: c }"
            :class="[
              'h-4 w-4 rounded-full border transition-transform hover:scale-125',
              (layer.blockColor || layer.color) === c ? 'border-white scale-110 shadow-sm' : 'border-black/40'
            ]"
            :title="`应用颜色 ${c}`"
            @click="selectPresetColor(c)"
          />
        </div>
      </div>

      <!-- 尺寸调节 (宽度、高度) -->
      <div class="space-y-2">
        <div class="grid grid-cols-2 gap-2">
          <ScrubInput
            label="宽度"
            unit="px"
            :min="10"
            :max="2000"
            :step="5"
            :model-value="layer.blockWidth || 400"
            @update:model-value="editor.updateSelected({ blockWidth: $event })"
          />

          <ScrubInput
            label="高度"
            unit="px"
            :min="10"
            :max="2000"
            :step="5"
            :model-value="layer.blockHeight || 280"
            @update:model-value="editor.updateSelected({ blockHeight: $event })"
          />
        </div>
      </div>

      <!-- 快捷比例预设 -->
      <div>
        <label class="block text-[10px] font-medium text-slate-400 mb-1">常用尺寸比例</label>
        <div class="grid grid-cols-4 gap-1.5">
          <button
            class="rounded border border-[#202733] bg-[#0c1015] py-1 text-[10px] font-mono text-slate-400 hover:border-slate-600 hover:text-white transition"
            @click="applyAspectPreset(300, 300)"
          >
            1 : 1
          </button>
          <button
            class="rounded border border-[#202733] bg-[#0c1015] py-1 text-[10px] font-mono text-slate-400 hover:border-slate-600 hover:text-white transition"
            @click="applyAspectPreset(480, 270)"
          >
            16 : 9
          </button>
          <button
            class="rounded border border-[#202733] bg-[#0c1015] py-1 text-[10px] font-mono text-slate-400 hover:border-slate-600 hover:text-white transition"
            @click="applyAspectPreset(270, 480)"
          >
            9 : 16
          </button>
          <button
            class="rounded border border-[#202733] bg-[#0c1015] py-1 text-[10px] font-mono text-slate-400 hover:border-slate-600 hover:text-white transition"
            @click="applyAspectPreset(400, 300)"
          >
            4 : 3
          </button>
        </div>
      </div>
    </div>
  </CollapsibleSection>
</template>
