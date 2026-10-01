<script setup lang="ts">
import { computed } from 'vue'
import { ExternalLink, Palette, Sliders } from '@lucide/vue'
import CollapsibleSection from '../common/CollapsibleSection.vue'
import ScrubInput from '../../ui/ScrubInput.vue'
import Select from '../../ui/Select.vue'
import type { Layer } from '../../../engine/types'
import { BACKGROUND_PRESETS, type BackgroundType } from '../../../engine/jizura/backgrounds'
import { getJizuraBgs } from '../../../engine/presets'
import { useEditorStore } from '../../../stores/editor'

const props = defineProps<{
  layer?: Layer
}>()

const editor = useEditorStore()

const isLayerMode = computed(() => !!props.layer && props.layer.kind === 'background')

const currentType = computed<string>(() => {
  if (isLayerMode.value) {
    return props.layer?.bgPreset || props.layer?.bgType || 'mesh-gradient'
  }
  return editor.backgroundConfig.type
})

const currentColorA = computed(() => {
  if (isLayerMode.value && props.layer?.colorA) {
    return props.layer.colorA
  }
  return editor.backgroundConfig.colorA
})

const currentColorB = computed(() => {
  if (isLayerMode.value && props.layer?.colorB) {
    return props.layer.colorB
  }
  return editor.backgroundConfig.colorB || '#6366f1'
})

const currentColorC = computed(() => {
  if (isLayerMode.value && props.layer?.colorC) {
    return props.layer.colorC
  }
  return editor.backgroundConfig.colorC || '#ec4899'
})

const currentGridDensity = computed(() => {
  if (isLayerMode.value && props.layer?.gridDensity) {
    return props.layer.gridDensity
  }
  return editor.backgroundConfig.gridDensity || 60
})

const jizuraBgs = getJizuraBgs()

const backgroundOptions = [
  ...BACKGROUND_PRESETS.map((b) => ({
    label: `[常用] ${b.name} (${b.id})`,
    value: b.id,
  })),
  ...jizuraBgs.map((bg) => ({
    label: `[JIZURA] ${bg.name} (${bg.id})`,
    value: bg.id,
  })),
]

const currentBgTitle = computed(() => {
  const matchPreset = BACKGROUND_PRESETS.find((p) => p.id === currentType.value)
  if (matchPreset) return matchPreset.name
  const matchJizura = jizuraBgs.find((b) => b.id === currentType.value)
  if (matchJizura) return matchJizura.name
  return currentType.value
})

function updateBg(patch: Partial<{
  type: BackgroundType
  colorA: string
  colorB: string
  colorC: string
  gridDensity: number
}>) {
  if (isLayerMode.value && props.layer) {
    editor.updateSelected({
      bgPreset: patch.type !== undefined ? patch.type : props.layer.bgPreset,
      bgType: patch.type !== undefined ? patch.type : props.layer.bgType,
      colorA: patch.colorA !== undefined ? patch.colorA : props.layer.colorA,
      colorB: patch.colorB !== undefined ? patch.colorB : props.layer.colorB,
      colorC: patch.colorC !== undefined ? patch.colorC : props.layer.colorC,
      gridDensity: patch.gridDensity !== undefined ? patch.gridDensity : props.layer.gridDensity,
      color: patch.colorA || props.layer.color,
    })
  } else {
    editor.updateBackgroundConfig(patch)
  }
}

function onBgTypeChange(type: string) {
  const preset = BACKGROUND_PRESETS.find((p) => p.id === type)
  updateBg({
    type: type as BackgroundType,
    colorA: preset?.defaultColorA || currentColorA.value,
    colorB: preset?.defaultColorB || currentColorB.value,
    colorC: preset?.defaultColorC || currentColorC.value,
  })
}

function setGreenScreen() {
  updateBg({
    type: 'green-screen',
    colorA: '#00FF00',
  })
}

function setBlackScreen() {
  updateBg({
    type: 'black-screen',
    colorA: '#000000',
  })
}
</script>

<template>
  <CollapsibleSection
    :title="isLayerMode ? '背景片段素材属性 (JIZURA)' : '画布背景独立设置 (JIZURA)'"
    :icon="Palette"
    :default-open="true"
    :badge="isLayerMode ? '图层模式' : '全局底色'"
  >
    <div class="space-y-3">
      <!-- 快捷合成背景预设 -->
      <div>
        <div class="flex items-center justify-between mb-1.5">
          <label class="text-[10px] font-medium text-slate-400">影视合成专用模式</label>
          <span class="text-[9px] text-emerald-400 font-mono">免抠像/透明素材</span>
        </div>

        <div class="grid grid-cols-2 gap-1.5">
          <button
            :class="[
              'flex items-center justify-center gap-1.5 rounded-md border p-2 text-xs font-semibold transition',
              currentType === 'green-screen'
                ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 ring-1 ring-emerald-500/50'
                : 'border-[#202733] bg-[#0c1015] text-slate-300 hover:border-emerald-600 hover:text-white'
            ]"
            title="一键切换纯绿幕背景，导出视频后在剪映/AE中一键色度抠像"
            @click="setGreenScreen"
          >
            <div class="h-3 w-3 rounded-full bg-[#00FF00] border border-black/40" />
            <span>绿幕抠像背景</span>
          </button>

          <button
            :class="[
              'flex items-center justify-center gap-1.5 rounded-md border p-2 text-xs font-semibold transition',
              currentType === 'black-screen'
                ? 'border-violet-500 bg-violet-950/40 text-violet-300 ring-1 ring-violet-500/50'
                : 'border-[#202733] bg-[#0c1015] text-slate-300 hover:border-violet-600 hover:text-white'
            ]"
            title="一键切换纯黑背景，在剪映/AE中混合模式设为“滤色”即可透明叠加"
            @click="setBlackScreen"
          >
            <div class="h-3 w-3 rounded-full bg-black border border-slate-700" />
            <span>纯黑滤色背景</span>
          </button>
        </div>
      </div>

      <!-- 背景类型选择 (66 种 JIZURA 背景库) -->
      <div class="pt-1">
        <div class="flex items-center justify-between mb-1">
          <label class="text-[10px] font-medium text-slate-400">JIZURA 背景样式预设 (66 种)</label>
          <div class="flex items-center gap-1.5">
            <span class="text-[9px] text-violet-400 font-mono">{{ currentBgTitle }}</span>
            <button
              class="flex items-center gap-0.5 text-[9px] text-violet-400 hover:text-violet-300 font-mono transition"
              title="展开 66 款背景样式视觉预览"
              @click="editor.openPresetDrawer('bg')"
            >
              <ExternalLink :size="10" />
              <span>展开视觉预览</span>
            </button>
          </div>
        </div>
        <Select
          :model-value="currentType"
          :options="backgroundOptions"
          @update:model-value="onBgTypeChange"
        />
      </div>

      <!-- 背景色彩控制面板 -->
      <div class="rounded-md border border-[#232b38] bg-[#0c1016] p-2.5 space-y-2">
        <div class="flex items-center justify-between border-b border-[#1f2733] pb-1.5 mb-1">
          <div class="flex items-center gap-1.5 text-violet-400 text-[11px] font-medium">
            <Sliders :size="12" />
            <span>{{ currentBgTitle }} · 色彩配置</span>
          </div>
        </div>

        <div class="space-y-1.5">
          <!-- 基础底色 A -->
          <div class="flex h-8 items-center justify-between rounded-md border border-[#242c38] bg-[#090d13] px-2">
            <span class="text-[10px] font-medium text-slate-400">底色 A</span>
            <div class="flex items-center gap-1.5">
              <input
                type="text"
                class="w-16 bg-transparent text-right font-mono text-[10px] text-slate-300 outline-none uppercase"
                :value="currentColorA"
                @change="updateBg({ colorA: ($event.target as HTMLInputElement).value })"
              />
              <input
                type="color"
                class="h-4 w-4 cursor-pointer rounded border-0 bg-transparent p-0"
                :value="currentColorA"
                @input="updateBg({ colorA: ($event.target as HTMLInputElement).value })"
              />
            </div>
          </div>

          <!-- 氛围色 B -->
          <div v-if="currentType !== 'solid' && currentType !== 'green-screen' && currentType !== 'black-screen'" class="flex h-8 items-center justify-between rounded-md border border-[#242c38] bg-[#090d13] px-2">
            <span class="text-[10px] font-medium text-slate-400">辅色/光斑 B</span>
            <div class="flex items-center gap-1.5">
              <input
                type="text"
                class="w-16 bg-transparent text-right font-mono text-[10px] text-slate-300 outline-none uppercase"
                :value="currentColorB"
                @change="updateBg({ colorB: ($event.target as HTMLInputElement).value })"
              />
              <input
                type="color"
                class="h-4 w-4 cursor-pointer rounded border-0 bg-transparent p-0"
                :value="currentColorB"
                @input="updateBg({ colorB: ($event.target as HTMLInputElement).value })"
              />
            </div>
          </div>

          <!-- 光晕色 C -->
          <div v-if="currentType === 'mesh-gradient' || currentType === 'retro-grid' || currentType === 'sunset-glow' || currentType === 'auroraRibbons'" class="flex h-8 items-center justify-between rounded-md border border-[#242c38] bg-[#090d13] px-2">
            <span class="text-[10px] font-medium text-slate-400">光晕/地平线 C</span>
            <div class="flex items-center gap-1.5">
              <input
                type="text"
                class="w-16 bg-transparent text-right font-mono text-[10px] text-slate-300 outline-none uppercase"
                :value="currentColorC"
                @change="updateBg({ colorC: ($event.target as HTMLInputElement).value })"
              />
              <input
                type="color"
                class="h-4 w-4 cursor-pointer rounded border-0 bg-transparent p-0"
                :value="currentColorC"
                @input="updateBg({ colorC: ($event.target as HTMLInputElement).value })"
              />
            </div>
          </div>
        </div>

        <!-- 网格密度调节 -->
        <div v-if="currentType === 'cyber-grid' || currentType === 'dotGrid' || currentType === 'hexGrid'" class="pt-1">
          <ScrubInput
            label="网格密度"
            unit="px"
            :min="20"
            :max="140"
            :step="5"
            :model-value="currentGridDensity"
            @update:model-value="updateBg({ gridDensity: $event })"
          />
        </div>
      </div>
    </div>
  </CollapsibleSection>
</template>
