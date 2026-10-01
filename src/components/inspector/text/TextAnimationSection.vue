<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  ExternalLink,
  LogIn,
  LogOut,
  PauseCircle,
  RotateCcw,
  Sliders,
  Sparkles,
} from '@lucide/vue'
import CollapsibleSection from '../common/CollapsibleSection.vue'
import ScrubInput from '../../ui/ScrubInput.vue'
import Select from '../../ui/Select.vue'
import type { Layer } from '../../../engine/types'
import {
  getJizuraEnterMotions,
  getJizuraExitMotions,
  getJizuraHoldMotions,
  JIZURA_COMBO_PRESETS,
} from '../../../engine/presets'
import { useEditorStore } from '../../../stores/editor'

const props = defineProps<{
  layer: Layer
}>()

const editor = useEditorStore()
const activeTab = ref<'combos' | 'custom'>('combos')

const enterMotions = getJizuraEnterMotions()
const holdMotions = getJizuraHoldMotions()
const exitMotions = getJizuraExitMotions()

const comboOptions = JIZURA_COMBO_PRESETS.map((p) => ({
  label: `${p.name} - ${p.desc}`,
  value: p.id,
}))

const enterOptions = enterMotions.map((e) => ({
  label: `${e.name} (${e.id})`,
  value: e.id,
}))

const holdOptions = holdMotions.map((h) => ({
  label: `${h.name} (${h.id})`,
  value: h.id,
}))

const exitOptions = exitMotions.map((x) => ({
  label: `${x.name} (${x.id})`,
  value: x.id,
}))

const currentComboId = computed(() => {
  return props.layer.animPreset || 'pop-bounce'
})

const currentEnterId = computed(() => {
  return props.layer.enterAnim || 'pop'
})

const currentHoldId = computed(() => {
  return props.layer.holdAnim || 'breathe'
})

const currentExitId = computed(() => {
  return props.layer.exitAnim || 'explode'
})

function applyComboPreset(comboId: string) {
  const combo = JIZURA_COMBO_PRESETS.find((c) => c.id === comboId)
  if (!combo) return
  editor.updateSelected({
    animPreset: combo.id,
    enterAnim: combo.enter,
    holdAnim: combo.hold,
    exitAnim: combo.exit,
  })
}

function updateEnter(val: string) {
  editor.updateSelected({ enterAnim: val })
}

function updateHold(val: string) {
  editor.updateSelected({ holdAnim: val })
}

function updateExit(val: string) {
  editor.updateSelected({ exitAnim: val })
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
  <CollapsibleSection title="JIZURA MG 动画预设" :icon="Sparkles" :default-open="true">
    <div class="space-y-3">
      <!-- 预设模式切换：经典套件 VS 分段自定 -->
      <div class="flex items-center gap-1 bg-[#0c1015] p-1 rounded-lg border border-[#202734]">
        <button
          :class="[
            'flex-1 py-1 text-center text-xs font-medium rounded-md transition',
            activeTab === 'combos'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          ]"
          @click="activeTab = 'combos'"
        >
          经典动效组合
        </button>
        <button
          :class="[
            'flex-1 py-1 text-center text-xs font-medium rounded-md transition',
            activeTab === 'custom'
              ? 'bg-violet-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          ]"
          @click="activeTab = 'custom'"
        >
          分段自由编排 (入/保/退)
        </button>
      </div>

      <!-- 模式 1: 经典套件选择 -->
      <div v-if="activeTab === 'combos'" class="space-y-2.5">
        <div>
          <label class="block text-[10px] font-medium text-slate-400 mb-1">JIZURA 组合动效预设</label>
          <Select
            :model-value="currentComboId"
            :options="comboOptions"
            @update:model-value="applyComboPreset"
          />
        </div>

        <!-- 组合卡片快捷网格 -->
        <div class="grid grid-cols-2 gap-1.5 pt-1">
          <button
            v-for="p in JIZURA_COMBO_PRESETS"
            :key="p.id"
            :class="[
              'flex flex-col items-start rounded-md border p-2 text-left transition relative overflow-hidden',
              currentComboId === p.id
                ? 'border-violet-500 bg-violet-950/40 text-violet-200 shadow-sm ring-1 ring-violet-500/50'
                : 'border-[#202733] bg-[#0c1015] text-slate-400 hover:border-slate-600 hover:text-slate-200'
            ]"
            @click="applyComboPreset(p.id)"
          >
            <span class="text-[11px] font-semibold">{{ p.name.split('(')[0] }}</span>
            <span class="text-[9px] text-slate-500 mt-0.5 line-clamp-1">{{ p.desc }}</span>
          </button>
        </div>
      </div>

      <!-- 模式 2: 分段自定动效选择 (入场 112 / 保持 46 / 退场 98) -->
      <div v-else class="space-y-2.5">
        <!-- 1. 入场动效 -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="flex items-center gap-1 text-[10px] font-medium text-emerald-400">
              <LogIn :size="11" />
              <span>入场动效 (Enter · 112 种)</span>
            </label>
            <button
              class="flex items-center gap-0.5 text-[9px] text-emerald-400 hover:text-emerald-300 font-mono transition"
              title="展开 112 款入场动效视觉预览"
              @click="editor.openPresetDrawer('enter')"
            >
              <ExternalLink :size="10" />
              <span>展开视觉预览</span>
            </button>
          </div>
          <Select
            :model-value="currentEnterId"
            :options="enterOptions"
            @update:model-value="updateEnter"
          />
        </div>

        <!-- 2. 保持微动 -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="flex items-center gap-1 text-[10px] font-medium text-cyan-400">
              <PauseCircle :size="11" />
              <span>持续保持/微动 (Hold · 46 种)</span>
            </label>
            <button
              class="flex items-center gap-0.5 text-[9px] text-cyan-400 hover:text-cyan-300 font-mono transition"
              title="展开 46 款保持微动视觉预览"
              @click="editor.openPresetDrawer('hold')"
            >
              <ExternalLink :size="10" />
              <span>展开视觉预览</span>
            </button>
          </div>
          <Select
            :model-value="currentHoldId"
            :options="holdOptions"
            @update:model-value="updateHold"
          />
        </div>

        <!-- 3. 退场动效 -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="flex items-center gap-1 text-[10px] font-medium text-pink-400">
              <LogOut :size="11" />
              <span>退场动效 (Exit · 98 种)</span>
            </label>
            <button
              class="flex items-center gap-0.5 text-[9px] text-pink-400 hover:text-pink-300 font-mono transition"
              title="展开 98 款退场动效视觉预览"
              @click="editor.openPresetDrawer('exit')"
            >
              <ExternalLink :size="10" />
              <span>展开视觉预览</span>
            </button>
          </div>
          <Select
            :model-value="currentExitId"
            :options="exitOptions"
            @update:model-value="updateExit"
          />
        </div>
      </div>

      <!-- 动效细节参数控制面板 -->
      <div class="rounded-md border border-[#232b38] bg-[#0c1016] p-2.5 space-y-2">
        <div class="flex items-center justify-between border-b border-[#1f2733] pb-1.5 mb-1">
          <div class="flex items-center gap-1.5 text-violet-400 text-[11px] font-medium">
            <Sliders :size="12" />
            <span>动效时长与强度参数</span>
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
            label="入场时长"
            unit="s"
            :min="0.1"
            :max="3.0"
            :step="0.05"
            :model-value="getParam('enterDuration', 0.6)"
            @update:model-value="setParam('enterDuration', $event)"
          />

          <ScrubInput
            label="退场时长"
            unit="s"
            :min="0.1"
            :max="2.5"
            :step="0.05"
            :model-value="getParam('exitDuration', 0.5)"
            @update:model-value="setParam('exitDuration', $event)"
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
