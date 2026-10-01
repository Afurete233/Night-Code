<script setup lang="ts">
import { computed } from 'vue'
import {
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
  { id: 'pop-in', name: 'Q弹缩放入场', desc: '果冻回弹+弹性爆发' },
  { id: 'jelly-pop', name: 'Q弹果冻冲击', desc: '挤压拉伸形变+果冻回弹' },
  { id: 'line-bounce', name: '挤压弹线', desc: '横向拉伸、弹线震荡后归位' },
  { id: 'squash-line', name: '挤压弹线（强）', desc: '强烈扁平挤压与连续回弹' },
  { id: 'squash-stretch', name: '挤压拉伸', desc: '纵向拉伸与落地挤压' },
  { id: 'jelly-deform', name: '果冻变形', desc: '软体波浪式形变入场' },
  { id: 'wave-bounce', name: '波浪弹跳', desc: '旋转倾斜叠加弹线回弹' },
  { id: 'elastic-snap', name: '弹性甩线', desc: '快速甩动后弹性收束' },
  { id: 'spring-drop', name: 'Q弹跌落碰撞', desc: '高处跌落落地挤压并弹起' },
  { id: 'rubber-in', name: '橡皮筋拉伸', desc: '横向拉开瞬间释放回弹' },
  { id: 'fade-up', name: '上浮淡入', desc: '从下方平滑升起并淡入' },
  { id: 'blur-in', name: '聚焦放大淡入', desc: '大尺寸聚焦平滑入场' },
  { id: 'slide-right', name: '左侧划入', desc: '从左侧快速飞入缓冲' },
  { id: 'slide-left', name: '右侧划入', desc: '从右侧快速飞入缓冲' },
  { id: 'bounce-drop', name: '下落碰撞弹跳', desc: '高处跌落并物理回弹' },
  { id: 'spin-in', name: '旋转缩放入场', desc: '旋转同时伴随Q弹缩放显现' },
  { id: 'flip-x', name: '3D 轴向翻转', desc: '沿 X 轴翻转展开' },
  { id: 'glitch-in', name: '赛博故障入场', desc: '随机位移与高频抖动解码' },
  { id: 'whip-in', name: '急甩鞭打入场', desc: '强劲横向甩出与拖尾缓冲' },
  { id: 'q-jelly', name: 'Q弹果冻微动', desc: '持续果冻形变摇晃' },
  { id: 'breathe', name: '脉冲呼吸', desc: '周期性平滑缩放呼吸' },
  { id: 'swing', name: '悬挂轻摇', desc: '持续左右柔和振荡摇摆' },
  { id: 'float', name: '悬浮漂移', desc: '优雅正弦漂移' },
  { id: 'beat-hop', name: '心跳跃动', desc: '配合重音向上跳跃与Q弹' },
  { id: 'fall', name: '重力坠落退场', desc: '向下重力跌落并淡出' },
  { id: 'explode', name: '爆散退场', desc: '瞬间放大爆散并淡出' },
  { id: 'shrink', name: '黑洞收缩退场', desc: '快速向中心缩窄消失' },
  { id: 'squash-out', name: '压扁退场', desc: '垂直压扁平移淡出' },
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
    <div class="space-y-3">
      <!-- 效果预设统一使用下拉选择，避免面板堆叠过多卡片 -->
      <div>
        <label class="block text-[10px] font-medium text-slate-400 mb-1">变形 / MG 动效预设</label>
        <Select
          :model-value="currentPresetId"
          :options="presetOptions"
          @update:model-value="applyPreset"
        />
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
