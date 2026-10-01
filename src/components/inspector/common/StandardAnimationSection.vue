<script setup lang="ts">
import { computed } from 'vue'
import {
  ExternalLink,
  RotateCcw,
  Sliders,
  Sparkles,
} from '@lucide/vue'
import CollapsibleSection from './CollapsibleSection.vue'
import ScrubInput from '../../ui/ScrubInput.vue'
import Select from '../../ui/Select.vue'
import type { Layer } from '../../../engine/types'
import { useEditorStore } from '../../../stores/editor'

const props = defineProps<{
  layer: Layer
}>()

const editor = useEditorStore()

const standardPresets = [
  { id: 'none', name: '无动画', desc: '静态展示' },
  { id: 'pop-in', name: 'Q弹缩放入场', desc: '带回弹缩放冲击力' },
  { id: 'fade-up', name: '上浮淡入', desc: '从下方平滑升起并淡入' },
  { id: 'blur-in', name: '聚焦放大淡入', desc: '大尺寸聚焦平滑入场' },
  { id: 'slide-right', name: '侧向划入', desc: '从侧边快速飞入缓冲' },
  { id: 'bounce-drop', name: '下落碰撞弹跳', desc: '高处跌落并物理回弹' },
  { id: 'spin-in', name: '旋转缩放入场', desc: '旋转同时伴随缩放显现' },
  { id: 'swing', name: '悬挂轻摇', desc: '持续左右柔和振荡摇摆' },
]

const presetOptions = standardPresets.map((p) => ({
  label: `${p.name} (${p.desc})`,
  value: p.id,
}))

const currentPresetId = computed(() => {
  return props.layer.animPreset || 'none'
})

function applyPreset(id: string) {
  editor.updateSelected({
    animPreset: id,
  })
}

function getParam(key: string, defVal: any) {
  return props.layer.animPresetParams?.[key] ?? defVal
}

function setParam(key: string, val: any) {
  const current = { ...(props.layer.animPresetParams || {}) }
  current[key] = val
  editor.updateSelected({ animPresetParams: current })
}

function resetParams() {
  editor.updateSelected({ animPresetParams: undefined })
}
</script>

<template>
  <CollapsibleSection
    title="MG 动效预设 (素材/色块)"
    :icon="Sparkles"
    :default-open="true"
  >
    <template #actions>
      <button
        class="flex items-center gap-1 text-[10px] text-violet-400 hover:text-violet-300 transition"
        title="在右侧展开视觉预设面板"
        @click="editor.openPresetDrawer('standard-anim')"
      >
        <ExternalLink :size="11" />
        <span>展开预览</span>
      </button>
    </template>

    <div class="space-y-3">
      <!-- 预设下拉选择 -->
      <div>
        <label class="block text-[10px] font-medium text-slate-400 mb-1">动效预设选择</label>
        <Select
          :model-value="currentPresetId"
          :options="presetOptions"
          @update:model-value="applyPreset"
        />
      </div>

      <!-- 快捷卡片切换 -->
      <div class="grid grid-cols-2 gap-1.5 pt-1">
        <button
          v-for="p in standardPresets"
          :key="p.id"
          :class="[
            'flex flex-col items-start rounded-md border p-2 text-left transition relative overflow-hidden',
            currentPresetId === p.id
              ? 'border-violet-500 bg-violet-950/40 text-violet-200 shadow-sm ring-1 ring-violet-500/50'
              : 'border-[#202733] bg-[#0c1015] text-slate-400 hover:border-slate-600 hover:text-slate-200'
          ]"
          @click="applyPreset(p.id)"
        >
          <span class="text-[11px] font-semibold">{{ p.name }}</span>
          <span class="text-[9px] text-slate-500 mt-0.5 line-clamp-1">{{ p.desc }}</span>
        </button>
      </div>

      <!-- 细节参数调节 -->
      <div v-if="currentPresetId !== 'none'" class="rounded-md border border-[#232b38] bg-[#0c1016] p-2.5 space-y-2 pt-2">
        <div class="flex items-center justify-between border-b border-[#1f2733] pb-1.5 mb-1">
          <div class="flex items-center gap-1.5 text-violet-400 text-[11px] font-medium">
            <Sliders :size="12" />
            <span>动效细节参数</span>
          </div>
          <button
            class="text-[9px] text-slate-500 hover:text-slate-200 flex items-center gap-0.5 transition"
            title="重置动效参数"
            @click="resetParams"
          >
            <RotateCcw :size="10" />
            <span>重置</span>
          </button>
        </div>

        <div class="space-y-1.5">
          <ScrubInput
            label="动画时长"
            unit="s"
            :min="0.1"
            :max="3.0"
            :step="0.05"
            :model-value="getParam('duration', 0.6)"
            @update:model-value="setParam('duration', $event)"
          />

          <ScrubInput
            label="位移距离"
            unit="px"
            :min="10"
            :max="400"
            :step="5"
            :model-value="getParam('distance', 60)"
            @update:model-value="setParam('distance', $event)"
          />

          <ScrubInput
            label="动效强度"
            unit="%"
            :min="10"
            :max="200"
            :step="5"
            :model-value="getParam('motionIntensity', 100)"
            @update:model-value="setParam('motionIntensity', $event)"
          />
        </div>
      </div>
    </div>
  </CollapsibleSection>
</template>
