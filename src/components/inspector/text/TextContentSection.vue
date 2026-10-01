<script setup lang="ts">
import { computed } from 'vue'
import { Camera, ExternalLink, Film, LayoutGrid, Sparkles, Type } from '@lucide/vue'
import CollapsibleSection from '../common/CollapsibleSection.vue'
import ScrubInput from '../../ui/ScrubInput.vue'
import Select from '../../ui/Select.vue'
import type { Layer } from '../../../engine/types'
import {
  getJizuraCamMotions,
  getJizuraDecors,
  getJizuraLayouts,
  getJizuraTransMotions,
  getJizuraTreats,
} from '../../../engine/presets'
import { useEditorStore } from '../../../stores/editor'

const props = defineProps<{
  layer: Layer
}>()

const editor = useEditorStore()

const layouts = getJizuraLayouts()
const decors = getJizuraDecors()
const treats = getJizuraTreats()
const cams = getJizuraCamMotions()
const transs = getJizuraTransMotions()

const layoutOptions = layouts.map((l) => ({
  label: `${l.name} (${l.id})`,
  value: l.id,
}))

const decorOptions = [
  { label: '无装饰 (none)', value: 'none' },
  ...decors.map((d) => ({
    label: `${d.name} (${d.id})`,
    value: d.id,
  })),
]

const treatOptions = treats.map((t) => ({
  label: `${t.name} (${t.id})`,
  value: t.id,
}))

const camOptions = [
  { label: '无运镜 (none)', value: 'none' },
  ...cams.map((c) => ({
    label: `${c.name} (${c.id})`,
    value: c.id,
  })),
]

const transOptions = [
  { label: '无转场 (none)', value: 'none' },
  ...transs.map((tr) => ({
    label: `${tr.name} (${tr.id})`,
    value: tr.id,
  })),
]

const currentLayout = computed(() => {
  return props.layer.layoutAnim || props.layer.textLayout || 'center'
})

const currentTreat = computed(() => {
  return props.layer.treatAnim || props.layer.textTreatment || 'none'
})

const currentDecor = computed(() => {
  return props.layer.decorAnim || 'none'
})

const currentCam = computed(() => {
  return props.layer.camAnim || 'none'
})

const currentTrans = computed(() => {
  return props.layer.transAnim || 'none'
})

function onTextChange(event: Event) {
  editor.updateSelected({ text: (event.target as HTMLTextAreaElement).value })
}

function onSubTextChange(event: Event) {
  editor.updateSelected({ subText: (event.target as HTMLInputElement).value })
}

function updateLayout(val: string) {
  editor.updateSelected({
    layoutAnim: val,
    textLayout: val as any,
  })
}

function updateTreat(val: string) {
  editor.updateSelected({
    treatAnim: val,
    textTreatment: val as any,
  })
}

function updateDecor(val: string) {
  editor.updateSelected({ decorAnim: val })
}

function updateCam(val: string) {
  editor.updateSelected({ camAnim: val })
}

function updateTrans(val: string) {
  editor.updateSelected({ transAnim: val })
}

function updateColor(key: 'fontColor' | 'treatmentColor' | 'treatmentColorB', val: string) {
  editor.updateSelected({ [key]: val })
}
</script>

<template>
  <CollapsibleSection title="歌词排版与文字表现" :icon="Type" :default-open="true">
    <div class="space-y-3">
      <!-- 引擎模式切换：JIZURA 动态文字 VS 标准关键帧文字 -->
      <div class="flex items-center justify-between bg-[#0b0e14] p-2 rounded-lg border border-[#202734]">
        <div>
          <span class="text-xs font-semibold text-slate-200">JIZURA 动态文字排版</span>
          <p class="text-[9px] text-slate-500 mt-0.5">开启使用 186 种排版、装饰、3D处理与运镜</p>
        </div>
        <button
          :class="[
            'px-2.5 py-1 rounded text-xs font-semibold transition',
            props.layer.useJizura !== false
              ? 'bg-violet-600 text-white shadow-sm'
              : 'bg-[#18202d] text-slate-400 hover:text-white'
          ]"
          @click="editor.updateSelected({ useJizura: !(props.layer.useJizura !== false) })"
        >
          {{ props.layer.useJizura !== false ? '已开启 JIZURA' : '标准关键帧' }}
        </button>
      </div>

      <!-- 歌词主文本 -->
      <div>
        <div class="flex items-center justify-between mb-1">
          <label class="text-[10px] font-medium text-slate-400">主歌词 / 文本</label>
          <span class="text-[9px] text-slate-500 font-mono">{{ (layer.text || '').length }} 字符</span>
        </div>
        <textarea
          rows="2"
          class="w-full rounded-md border border-[#262e3b] bg-[#0c1015] p-2 text-xs text-slate-100 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50"
          :value="layer.text"
          placeholder="输入主歌词 (支持 *重点词* 强调)..."
          @input="onTextChange"
        />
      </div>

      <!-- 副歌词 / 翻译 / 注音 -->
      <div>
        <label class="block text-[10px] font-medium text-slate-400 mb-1">副歌词 / 翻译 / 标音 (Sub-text)</label>
        <input
          type="text"
          class="h-8 w-full rounded-md border border-[#262e3b] bg-[#0c1015] px-2.5 text-xs text-slate-200 outline-none transition focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50"
          :value="layer.subText || ''"
          placeholder="例如：English Translation / 罗马音注记..."
          @input="onSubTextChange"
        />
      </div>

      <!-- 字号与主色 -->
      <div class="grid grid-cols-2 gap-2 items-center">
        <ScrubInput
          label="主字号"
          unit="px"
          :min="12"
          :max="240"
          :step="2"
          :model-value="layer.fontSize || 48"
          @update:model-value="editor.updateSelected({ fontSize: $event })"
        />

        <div class="flex h-8 items-center justify-between rounded-md border border-[#242c38] bg-[#0c1015] px-2">
          <span class="text-[11px] font-medium text-slate-500">主字体色</span>
          <div class="flex items-center gap-1.5">
            <input
              type="text"
              class="w-16 bg-transparent text-right font-mono text-[11px] text-slate-300 outline-none uppercase"
              :value="layer.fontColor || '#ffffff'"
              @change="updateColor('fontColor', ($event.target as HTMLInputElement).value)"
            />
            <input
              type="color"
              class="h-5 w-5 cursor-pointer rounded border-0 bg-transparent p-0"
              :value="layer.fontColor || '#ffffff'"
              @input="updateColor('fontColor', ($event.target as HTMLInputElement).value)"
              @change="updateColor('fontColor', ($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>
      </div>

      <!-- JIZURA 动态特性选择区 (开启时显示) -->
      <div v-if="props.layer.useJizura !== false" class="space-y-2.5 pt-1">
        <!-- 1. JIZURA 布局排版 (Layout · 186 种) -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="flex items-center gap-1 text-[10px] font-medium text-violet-400">
              <LayoutGrid :size="11" />
              <span>1. 布局排版 (Layout · 186 种)</span>
            </label>
            <button
              class="flex items-center gap-0.5 text-[9px] text-violet-400 hover:text-violet-300 font-mono transition"
              title="展开 186 款布局排版视觉预览"
              @click="editor.openPresetDrawer('layout')"
            >
              <ExternalLink :size="10" />
              <span>展开视觉预览</span>
            </button>
          </div>
          <Select
            :model-value="currentLayout"
            :options="layoutOptions"
            @update:model-value="updateLayout"
          />
        </div>

        <!-- 2. JIZURA 文字处理 (Treat · 62 种) -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="flex items-center gap-1 text-[10px] font-medium text-pink-400">
              <Type :size="11" />
              <span>2. 文字处理 (Treat · 62 种)</span>
            </label>
            <button
              class="flex items-center gap-0.5 text-[9px] text-pink-400 hover:text-pink-300 font-mono transition"
              title="展开 62 款文字处理视觉预览"
              @click="editor.openPresetDrawer('treat')"
            >
              <ExternalLink :size="10" />
              <span>展开视觉预览</span>
            </button>
          </div>
          <Select
            :model-value="currentTreat"
            :options="treatOptions"
            @update:model-value="updateTreat"
          />
        </div>

        <!-- 3. JIZURA 装饰图元 (Decor · 130 种) -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="flex items-center gap-1 text-[10px] font-medium text-amber-400">
              <Sparkles :size="11" />
              <span>3. 装饰图元 (Decor · 130 种)</span>
            </label>
            <button
              class="flex items-center gap-0.5 text-[9px] text-amber-400 hover:text-amber-300 font-mono transition"
              title="展开 130 款装饰图元视觉预览"
              @click="editor.openPresetDrawer('decor')"
            >
              <ExternalLink :size="10" />
              <span>展开视觉预览</span>
            </button>
          </div>
          <Select
            :model-value="currentDecor"
            :options="decorOptions"
            @update:model-value="updateDecor"
          />
        </div>

        <!-- 4. JIZURA 运镜控制 (Camera · 36 种) -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="flex items-center gap-1 text-[10px] font-medium text-cyan-400">
              <Camera :size="11" />
              <span>4. 镜头运镜 (Camera · 36 种)</span>
            </label>
            <button
              class="flex items-center gap-0.5 text-[9px] text-cyan-400 hover:text-cyan-300 font-mono transition"
              title="展开 36 款运镜控制视觉预览"
              @click="editor.openPresetDrawer('cam')"
            >
              <ExternalLink :size="10" />
              <span>展开视觉预览</span>
            </button>
          </div>
          <Select
            :model-value="currentCam"
            :options="camOptions"
            @update:model-value="updateCam"
          />
        </div>

        <!-- 5. JIZURA 转场 (Transition · 27 种) -->
        <div>
          <div class="flex items-center justify-between mb-1">
            <label class="flex items-center gap-1 text-[10px] font-medium text-emerald-400">
              <Film :size="11" />
              <span>5. 镜头转场 (Transition · 27 种)</span>
            </label>
            <button
              class="flex items-center gap-0.5 text-[9px] text-emerald-400 hover:text-emerald-300 font-mono transition"
              title="展开 27 款镜头转场视觉预览"
              @click="editor.openPresetDrawer('trans')"
            >
              <ExternalLink :size="10" />
              <span>展开视觉预览</span>
            </button>
          </div>
          <Select
            :model-value="currentTrans"
            :options="transOptions"
            @update:model-value="updateTrans"
          />
        </div>

        <!-- 修饰色彩与参数控制 -->
        <div class="rounded-md border border-[#232b38] bg-[#0c1016] p-2.5 space-y-2 pt-2">
          <div class="flex items-center gap-1.5 text-violet-400 text-[11px] font-medium border-b border-[#1f2733] pb-1.5">
            <Sparkles :size="12" />
            <span>修饰特效色彩与细节</span>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <!-- 辅色 A -->
            <div class="flex h-8 items-center justify-between rounded-md border border-[#242c38] bg-[#090d13] px-2">
              <span class="text-[10px] font-medium text-slate-400">特效色 A</span>
              <div class="flex items-center gap-1">
                <input
                  type="color"
                  class="h-4 w-4 cursor-pointer rounded border-0 bg-transparent p-0"
                  :value="layer.treatmentColor || '#6366f1'"
                  @input="updateColor('treatmentColor', ($event.target as HTMLInputElement).value)"
                />
              </div>
            </div>

            <!-- 辅色 B -->
            <div class="flex h-8 items-center justify-between rounded-md border border-[#242c38] bg-[#090d13] px-2">
              <span class="text-[10px] font-medium text-slate-400">副标/辅色 B</span>
              <div class="flex items-center gap-1">
                <input
                  type="color"
                  class="h-4 w-4 cursor-pointer rounded border-0 bg-transparent p-0"
                  :value="layer.treatmentColorB || '#ec4899'"
                  @input="updateColor('treatmentColorB', ($event.target as HTMLInputElement).value)"
                />
              </div>
            </div>
          </div>

          <div class="pt-1">
            <ScrubInput
              label="描边粗细"
              unit="px"
              :min="1"
              :max="30"
              :step="1"
              :model-value="layer.strokeWidth || 4"
              @update:model-value="editor.updateSelected({ strokeWidth: $event })"
            />
          </div>

          <div class="pt-1">
            <ScrubInput
              label="阴影/立体厚度"
              unit="px"
              :min="2"
              :max="40"
              :step="1"
              :model-value="layer.shadowOffset || 8"
              @update:model-value="editor.updateSelected({ shadowOffset: $event })"
            />
          </div>
        </div>
      </div>

      <!-- 标准关键帧模式提示 -->
      <div v-else class="rounded-md border border-[#202734] bg-[#0c1016] p-2.5 text-[11px] text-slate-400 leading-relaxed">
        当前图层处于 <strong class="text-violet-300">标准关键帧文字模式</strong>。你可以自由在画布上拖拽移动位置、缩放拉伸，并在下方空间变换面板中对坐标、缩放与旋转记录关键帧。
      </div>
    </div>
  </CollapsibleSection>
</template>
