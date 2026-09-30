<script setup lang="ts">
import { computed } from 'vue'
import {
  ChevronDown,
  Clock,
  Diamond,
  Lock,
  MoreHorizontal,
  Palette,
  Sparkles,
  Type,
  Unlock,
} from '@lucide/vue'
import type { AnimatableProperty, EasingType, TextAnimPreset } from '../engine/types'
import { useEditorStore } from '../stores/editor'

const editor = useEditorStore()
const layer = computed(() => editor.selectedLayer)

const transformFields: { key: AnimatableProperty; label: string; min: number; max: number; step: number; unit: string }[] = [
  { key: 'x', label: 'X 坐标', min: -500, max: 2500, step: 10, unit: 'px' },
  { key: 'y', label: 'Y 坐标', min: -500, max: 1500, step: 10, unit: 'px' },
  { key: 'scale', label: '缩放', min: 10, max: 500, step: 5, unit: '%' },
  { key: 'opacity', label: '不透明度', min: 0, max: 100, step: 5, unit: '%' },
  { key: 'rotation', label: '旋转', min: -360, max: 360, step: 1, unit: '°' },
]

const textPresets: { key: TextAnimPreset; label: string; desc: string }[] = [
  { key: 'none', label: '无动画', desc: '静态展示' },
  { key: 'pop-in', label: '弹跳缩放入场', desc: 'Q弹有冲击力' },
  { key: 'typewriter', label: '打字机逐字', desc: '带闪烁光标' },
  { key: 'fade-up', label: '上浮淡入', desc: '优雅平滑' },
  { key: 'blur-in', label: '聚焦淡入', desc: '微焦柔和' },
]

const easings: { key: EasingType; label: string }[] = [
  { key: 'easeInOut', label: '平滑加减速 (Ease In Out)' },
  { key: 'easeOut', label: '平滑减速 (Ease Out)' },
  { key: 'bounceOut', label: '弹跳回弹 (Bounce Out)' },
  { key: 'backOut', label: '冲出回撤 (Back Out)' },
  { key: 'elasticOut', label: '弹性回弹 (Elastic Out)' },
  { key: 'linear', label: '匀速线性 (Linear)' },
]

function hasKeyframeAtCurrent(prop: AnimatableProperty) {
  if (!layer.value) return false
  const relTime = editor.currentTime - layer.value.start
  return layer.value.keyframes.some((k) => k.property === prop && Math.abs(k.time - relTime) < 0.08)
}

function toggleKeyframe(prop: AnimatableProperty) {
  if (!layer.value || layer.value.locked) return
  const relTime = Math.max(0, Math.min(layer.value.duration, editor.currentTime - layer.value.start))
  const existingIndex = layer.value.keyframes.findIndex(
    (k) => k.property === prop && Math.abs(k.time - relTime) < 0.08
  )

  if (existingIndex !== -1) {
    const kfId = layer.value.keyframes[existingIndex].id
    editor.removeKeyframe(layer.value.id, kfId)
  } else {
    const val = layer.value[prop as 'x' | 'y' | 'scale' | 'opacity' | 'rotation'] as number
    editor.addOrUpdateKeyframe(layer.value.id, prop, val, 'easeInOut')
  }
}

function onNumericChange(key: AnimatableProperty, event: Event) {
  const val = Number((event.target as HTMLInputElement).value)
  editor.updateSelected({ [key]: val })
  if (hasKeyframeAtCurrent(key)) {
    editor.addOrUpdateKeyframe(layer.value.id, key, val)
  }
}

function onTextChange(event: Event) {
  editor.updateSelected({ text: (event.target as HTMLTextAreaElement).value })
}

function onPresetSelect(preset: TextAnimPreset) {
  editor.updateSelected({ textPreset: preset })
}
</script>

<template>
  <aside class="flex shrink-0 flex-col border-l border-[#242b35] bg-[#11151b] select-none text-slate-200" :style="{ width: `${editor.rightWidth}px` }">
    <!-- 面板头部 -->
    <div class="flex h-11 shrink-0 items-center justify-between border-b border-[#242b35] px-4">
      <div class="flex items-center gap-2">
        <Sparkles :size="15" class="text-violet-400" />
        <span class="text-xs font-semibold">属性检查器</span>
      </div>
      <button class="icon-button">
        <MoreHorizontal :size="16" />
      </button>
    </div>

    <!-- 属性内容主体 -->
    <div v-if="layer" class="min-h-0 flex-1 overflow-y-auto">
      <!-- 1. 当前选中图层概览 -->
      <div class="border-b border-[#242b35] p-4 bg-[#141922]">
        <div class="mb-3 flex items-center justify-between">
          <div class="flex items-center gap-2.5 min-w-0">
            <div
              class="flex h-8 w-8 items-center justify-center rounded-lg shadow-sm"
              :style="{ backgroundColor: `${layer.color}25`, color: layer.color }"
            >
              <Type v-if="layer.kind === 'text'" :size="16" />
              <Palette v-else :size="16" />
            </div>
            <div class="min-w-0">
              <input
                class="w-full truncate bg-transparent text-xs font-semibold text-slate-100 outline-none hover:bg-white/5 focus:bg-white/10 px-1 py-0.5 rounded"
                :value="layer.name"
                @change="editor.updateSelected({ name: ($event.target as HTMLInputElement).value })"
              />
              <span class="px-1 text-[10px] font-mono text-slate-500 uppercase">
                {{ layer.kind }} 元素
              </span>
            </div>
          </div>

          <button
            class="icon-action text-slate-500 hover:text-slate-200"
            :title="layer.locked ? '解锁' : '锁定图层'"
            @click="editor.toggleLock(layer.id)"
          >
            <Lock v-if="layer.locked" :size="15" class="text-amber-400" />
            <Unlock v-else :size="15" />
          </button>
        </div>

        <!-- 时间区间调节 -->
        <div class="grid grid-cols-2 gap-2 text-[11px]">
          <div class="property-box">
            <span class="text-slate-500">入场时刻</span>
            <div class="flex items-center">
              <input
                type="number"
                step="0.1"
                min="0"
                class="prop-input"
                :value="layer.start"
                @change="editor.updateSelected({ start: Number(($event.target as HTMLInputElement).value) })"
              />
              <span class="text-[10px] text-slate-500">s</span>
            </div>
          </div>

          <div class="property-box">
            <span class="text-slate-500">持续时长</span>
            <div class="flex items-center">
              <input
                type="number"
                step="0.1"
                min="0.2"
                class="prop-input"
                :value="layer.duration"
                @change="editor.updateSelected({ duration: Number(($event.target as HTMLInputElement).value) })"
              />
              <span class="text-[10px] text-slate-500">s</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. 文字特有设置与 MG 动画预设 -->
      <div v-if="layer.kind === 'text'" class="border-b border-[#242b35] p-4">
        <label class="block text-[11px] font-medium text-slate-400 mb-1.5">文字内容</label>
        <textarea
          rows="2"
          class="w-full rounded-md border border-[#2a3442] bg-[#0c1017] p-2 text-xs text-slate-100 outline-none focus:border-violet-500 transition"
          :value="layer.text"
          @input="onTextChange"
        />

        <div class="grid grid-cols-2 gap-2 mt-3">
          <div class="property-box">
            <span class="text-slate-500">字号</span>
            <input
              type="number"
              min="12"
              max="200"
              class="prop-input"
              :value="layer.fontSize || 48"
              @change="editor.updateSelected({ fontSize: Number(($event.target as HTMLInputElement).value) })"
            />
          </div>

          <div class="property-box">
            <span class="text-slate-500">文字颜色</span>
            <input
              type="color"
              class="w-7 h-5 rounded cursor-pointer bg-transparent border-0"
              :value="layer.fontColor || '#ffffff'"
              @change="editor.updateSelected({ fontColor: ($event.target as HTMLInputElement).value })"
            />
          </div>
        </div>

        <!-- 动画预设选择 -->
        <div class="mt-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-[11px] font-semibold text-slate-300">MG 逐字/出入场动画</span>
            <span class="text-[10px] text-violet-400">实时计算</span>
          </div>

          <div class="space-y-1.5">
            <button
              v-for="p in textPresets"
              :key="p.key"
              :class="[
                'flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-xs text-left transition',
                layer.textPreset === p.key
                  ? 'bg-violet-950/70 text-violet-200 border border-violet-700/60 font-medium'
                  : 'bg-[#0f131a] text-slate-400 hover:bg-[#181f2a] hover:text-slate-200 border border-transparent'
              ]"
              @click="onPresetSelect(p.key)"
            >
              <span>{{ p.label }}</span>
              <span class="text-[10px] text-slate-500">{{ p.desc }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 3. 基础变换与关键帧系统 -->
      <div class="p-4">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
            <ChevronDown :size="14" />
            <span>变换属性 & 关键帧</span>
          </div>
          <span class="text-[10px] text-slate-500 font-mono">
            {{ layer.keyframes.length }} 帧已记录
          </span>
        </div>

        <div class="space-y-2">
          <div
            v-for="field in transformFields"
            :key="field.key"
            class="flex items-center justify-between p-2 rounded bg-[#0f131a] border border-[#232b37]"
          >
            <div class="flex items-center gap-1.5">
              <!-- 打关键帧按钮 -->
              <button
                :class="[
                  'p-1 rounded transition',
                  hasKeyframeAtCurrent(field.key)
                    ? 'text-violet-400 bg-violet-950/80 shadow-sm'
                    : 'text-slate-600 hover:text-slate-300'
                ]"
                :title="hasKeyframeAtCurrent(field.key) ? '移除当前关键帧' : '在此时间记录关键帧'"
                @click="toggleKeyframe(field.key)"
              >
                <Diamond :size="13" class="fill-current" />
              </button>
              <span class="text-[11px] text-slate-400">{{ field.label }}</span>
            </div>

            <div class="flex items-center gap-1">
              <input
                type="number"
                :min="field.min"
                :max="field.max"
                :step="field.step"
                class="prop-input w-16 text-right font-mono text-xs"
                :value="layer[field.key as 'x'|'y'|'scale'|'opacity'|'rotation']"
                @change="onNumericChange(field.key, $event)"
              />
              <span class="text-[10px] text-slate-500 w-4">{{ field.unit }}</span>
            </div>
          </div>
        </div>

        <!-- 默认插值曲线选择 -->
        <div class="mt-2.5 flex items-center justify-between text-[11px] p-2 rounded bg-[#0f131a] border border-[#232b37]">
          <span class="text-slate-400">插值曲线</span>
          <select class="bg-transparent text-violet-300 text-xs outline-none cursor-pointer max-w-[150px]">
            <option v-for="e in easings" :key="e.key" :value="e.key" class="bg-[#12161f] text-slate-200">
              {{ e.label }}
            </option>
          </select>
        </div>

        <!-- 关键帧缓动提示 -->
        <div class="mt-4 rounded-lg bg-[#0e131a] p-2.5 border border-[#222a36] text-[10px] text-slate-500">
          <div class="flex items-center gap-1 text-slate-400 mb-1">
            <Clock :size="12" />
            <span class="font-medium">自动补间机制</span>
          </div>
          在不同时间拖拽画布或修改数值，点击菱形即可记录关键帧，系统将自动使用贝塞尔曲线插值。
        </div>
      </div>
    </div>

    <!-- 无图层选中提示 -->
    <div v-else class="flex flex-1 items-center justify-center p-4 text-xs text-slate-500">
      请在左侧或时间线选择一个图层
    </div>
  </aside>
</template>

<style scoped>
.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 5px;
  color: #7f8a9a;
  transition: all 0.15s ease;
}
.icon-button:hover {
  background: #1e2430;
  color: #eef2f6;
}
.icon-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 5px;
  transition: all 0.15s ease;
}
.icon-action:hover {
  background: #252d3a;
}
.property-box {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid #242c36;
  border-radius: 6px;
  background: #0d1015;
  padding: 5px 8px;
}
.prop-input {
  color: #cbd5e1;
  background: transparent;
  outline: none;
  border: none;
  font-family: ui-monospace, monospace;
}
</style>
