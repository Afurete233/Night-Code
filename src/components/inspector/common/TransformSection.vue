<script setup lang="ts">
import { computed } from 'vue'
import {
  Clock,
  Diamond,
  Link,
  Move,
  Unlink,
} from '@lucide/vue'
import CollapsibleSection from './CollapsibleSection.vue'
import ScrubInput from '../../ui/ScrubInput.vue'
import Select from '../../ui/Select.vue'
import type { AnimatableProperty, EasingType, Layer } from '../../../engine/types'
import { useEditorStore } from '../../../stores/editor'

const props = defineProps<{
  layer: Layer
}>()

const editor = useEditorStore()

const isAspectLocked = computed(() => !!props.layer.lockAspectRatio)

const easings: { key: EasingType; label: string }[] = [
  { key: 'easeInOut', label: '平滑加减速 (Ease In Out)' },
  { key: 'easeOut', label: '平滑减速 (Ease Out)' },
  { key: 'bounceOut', label: '弹跳回弹 (Bounce Out)' },
  { key: 'backOut', label: '冲出回撤 (Back Out)' },
  { key: 'elasticOut', label: '弹性回弹 (Elastic Out)' },
  { key: 'linear', label: '匀速线性 (Linear)' },
]

const easingOptions = easings.map((e) => ({
  label: e.label,
  value: e.key,
}))

const currentKf = computed(() => {
  if (editor.selectedKeyframeId) {
    const matched = props.layer.keyframes.find((k) => k.id === editor.selectedKeyframeId)
    if (matched) return matched
  }
  const relTime = editor.currentTime - props.layer.start
  return props.layer.keyframes.find((k) => Math.abs(k.time - relTime) < 0.08)
})

const currentEasing = computed<EasingType>(() => {
  return currentKf.value?.easing || 'easeInOut'
})

const activeKfDescription = computed(() => {
  if (editor.selectedKeyframeId) {
    const matched = props.layer.keyframes.find((k) => k.id === editor.selectedKeyframeId)
    if (matched) {
      return `已选帧: ${matched.property} (${matched.time}s)`
    }
  }
  if (currentKf.value) {
    return `当前时刻: ${currentKf.value.property} (${currentKf.value.time}s)`
  }
  if (props.layer.keyframes.length > 0) {
    return `全部 ${props.layer.keyframes.length} 关键帧`
  }
  return `新建帧应用`
})

function onEasingChange(val: string) {
  editor.updateCurrentTimeKeyframeEasing(props.layer.id, val as EasingType)
}

function hasKeyframeAtCurrent(prop: AnimatableProperty) {
  const relTime = editor.currentTime - props.layer.start
  return props.layer.keyframes.some((k) => k.property === prop && Math.abs(k.time - relTime) < 0.08)
}

function toggleKeyframe(prop: AnimatableProperty) {
  if (props.layer.locked) return
  const relTime = Math.max(0, Math.min(props.layer.duration, editor.currentTime - props.layer.start))
  const existingIndex = props.layer.keyframes.findIndex(
    (k) => k.property === prop && Math.abs(k.time - relTime) < 0.08
  )

  if (existingIndex !== -1) {
    const kfId = props.layer.keyframes[existingIndex].id
    editor.removeKeyframe(props.layer.id, kfId)
  } else {
    let val = 100
    if (prop === 'x') val = props.layer.x
    else if (prop === 'y') val = props.layer.y
    else if (prop === 'scale') val = props.layer.scale
    else if (prop === 'scaleX') val = props.layer.scaleX || props.layer.scale
    else if (prop === 'scaleY') val = props.layer.scaleY || props.layer.scale
    else if (prop === 'opacity') val = props.layer.opacity
    else if (prop === 'rotation') val = props.layer.rotation

    editor.addOrUpdateKeyframe(props.layer.id, prop, val, 'easeInOut')
  }
}

function onTransformValChange(key: AnimatableProperty, val: number) {
  editor.updateSelected({ [key]: val })
  if (hasKeyframeAtCurrent(key)) {
    editor.addOrUpdateKeyframe(props.layer.id, key, val)
  }
}

function toggleAspectRatioLock() {
  const nextLock = !props.layer.lockAspectRatio
  editor.updateSelected({ lockAspectRatio: nextLock })
}

function onScaleXChange(newScaleX: number) {
  if (isAspectLocked.value) {
    const currentX = props.layer.scaleX || props.layer.scale || 100
    const currentY = props.layer.scaleY || props.layer.scale || 100
    const ratio = currentX > 0 ? newScaleX / currentX : 1
    const newScaleY = Math.max(10, Math.min(500, Math.round(currentY * ratio)))
    editor.updateSelected({
      scaleX: newScaleX,
      scaleY: newScaleY,
      scale: Math.round((newScaleX + newScaleY) / 2),
    })
    if (hasKeyframeAtCurrent('scaleX')) editor.addOrUpdateKeyframe(props.layer.id, 'scaleX', newScaleX)
    if (hasKeyframeAtCurrent('scaleY')) editor.addOrUpdateKeyframe(props.layer.id, 'scaleY', newScaleY)
  } else {
    onTransformValChange('scaleX', newScaleX)
  }
}

function onScaleYChange(newScaleY: number) {
  if (isAspectLocked.value) {
    const currentX = props.layer.scaleX || props.layer.scale || 100
    const currentY = props.layer.scaleY || props.layer.scale || 100
    const ratio = currentY > 0 ? newScaleY / currentY : 1
    const newScaleX = Math.max(10, Math.min(500, Math.round(currentX * ratio)))
    editor.updateSelected({
      scaleX: newScaleX,
      scaleY: newScaleY,
      scale: Math.round((newScaleX + newScaleY) / 2),
    })
    if (hasKeyframeAtCurrent('scaleX')) editor.addOrUpdateKeyframe(props.layer.id, 'scaleX', newScaleX)
    if (hasKeyframeAtCurrent('scaleY')) editor.addOrUpdateKeyframe(props.layer.id, 'scaleY', newScaleY)
  } else {
    onTransformValChange('scaleY', newScaleY)
  }
}
</script>

<template>
  <CollapsibleSection
    title="空间变换 & 关键帧"
    :icon="Move"
    :default-open="true"
    :badge="`${layer.keyframes.length} 帧`"
  >
    <div class="space-y-2.5">
      <!-- 坐标 X / Y -->
      <div class="space-y-1.5">
        <!-- X 坐标 -->
        <div class="flex items-center justify-between gap-2 rounded-md bg-[#0c1015] border border-[#202733] p-1.5">
          <button
            :class="[
              'p-1 rounded transition-colors shrink-0',
              hasKeyframeAtCurrent('x')
                ? 'text-violet-400 bg-violet-950/80 shadow-sm'
                : 'text-slate-600 hover:text-slate-300'
            ]"
            :title="hasKeyframeAtCurrent('x') ? '移除当前关键帧' : '在此时间记录关键帧'"
            @click="toggleKeyframe('x')"
          >
            <Diamond :size="13" class="fill-current" />
          </button>
          <div class="flex-1 min-w-0">
            <ScrubInput
              label="X 坐标"
              unit="px"
              :min="-500"
              :max="2500"
              :step="1"
              :model-value="layer.x"
              @update:model-value="onTransformValChange('x', $event)"
            />
          </div>
        </div>

        <!-- Y 坐标 -->
        <div class="flex items-center justify-between gap-2 rounded-md bg-[#0c1015] border border-[#202733] p-1.5">
          <button
            :class="[
              'p-1 rounded transition-colors shrink-0',
              hasKeyframeAtCurrent('y')
                ? 'text-violet-400 bg-violet-950/80 shadow-sm'
                : 'text-slate-600 hover:text-slate-300'
            ]"
            :title="hasKeyframeAtCurrent('y') ? '移除当前关键帧' : '在此时间记录关键帧'"
            @click="toggleKeyframe('y')"
          >
            <Diamond :size="13" class="fill-current" />
          </button>
          <div class="flex-1 min-w-0">
            <ScrubInput
              label="Y 坐标"
              unit="px"
              :min="-500"
              :max="1500"
              :step="1"
              :model-value="layer.y"
              @update:model-value="onTransformValChange('y', $event)"
            />
          </div>
        </div>

        <!-- 缩放控制 (支持当前自由比例保留与等比/自由联动切换) -->
        <div class="rounded-md bg-[#0c1015] border border-[#202733] p-1.5 space-y-1.5">
          <div class="flex items-center justify-between px-1 text-[10px] text-slate-400 font-medium">
            <span>缩放模式</span>
            <button
              :class="[
                'flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-mono transition',
                isAspectLocked
                  ? 'bg-violet-950/70 text-violet-300 border border-violet-700/60'
                  : 'bg-[#18202c] text-slate-400 hover:text-slate-200 border border-transparent'
              ]"
              :title="isAspectLocked ? '当前按现有比例锁定 (点击切换自由独立拉伸)' : '当前自由拉伸 (点击按当前比例锁定)'"
              @click="toggleAspectRatioLock"
            >
              <Link v-if="isAspectLocked" :size="11" />
              <Unlink v-else :size="11" />
              <span>{{ isAspectLocked ? '按当前比例锁定' : '自由不锁比例' }}</span>
            </button>
          </div>

          <!-- X / Y 独立缩放输入 (锁定状态下按当前比例联动) -->
          <div class="grid grid-cols-2 gap-1.5">
            <div class="flex items-center gap-1">
              <button
                :class="[
                  'p-0.5 rounded transition-colors shrink-0',
                  hasKeyframeAtCurrent('scaleX')
                    ? 'text-violet-400 bg-violet-950/80 shadow-sm'
                    : 'text-slate-600 hover:text-slate-300'
                ]"
                :title="hasKeyframeAtCurrent('scaleX') ? '移除关键帧' : '打关键帧'"
                @click="toggleKeyframe('scaleX')"
              >
                <Diamond :size="11" class="fill-current" />
              </button>
              <div class="flex-1 min-w-0">
                <ScrubInput
                  label="X 缩放"
                  unit="%"
                  :min="10"
                  :max="500"
                  :step="1"
                  :model-value="layer.scaleX || layer.scale"
                  @update:model-value="onScaleXChange"
                />
              </div>
            </div>

            <div class="flex items-center gap-1">
              <button
                :class="[
                  'p-0.5 rounded transition-colors shrink-0',
                  hasKeyframeAtCurrent('scaleY')
                    ? 'text-violet-400 bg-violet-950/80 shadow-sm'
                    : 'text-slate-600 hover:text-slate-300'
                ]"
                :title="hasKeyframeAtCurrent('scaleY') ? '移除关键帧' : '打关键帧'"
                @click="toggleKeyframe('scaleY')"
              >
                <Diamond :size="11" class="fill-current" />
              </button>
              <div class="flex-1 min-w-0">
                <ScrubInput
                  label="Y 缩放"
                  unit="%"
                  :min="10"
                  :max="500"
                  :step="1"
                  :model-value="layer.scaleY || layer.scale"
                  @update:model-value="onScaleYChange"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 不透明度 -->
        <div class="flex items-center justify-between gap-2 rounded-md bg-[#0c1015] border border-[#202733] p-1.5">
          <button
            :class="[
              'p-1 rounded transition-colors shrink-0',
              hasKeyframeAtCurrent('opacity')
                ? 'text-violet-400 bg-violet-950/80 shadow-sm'
                : 'text-slate-600 hover:text-slate-300'
            ]"
            :title="hasKeyframeAtCurrent('opacity') ? '移除当前关键帧' : '在此时间记录关键帧'"
            @click="toggleKeyframe('opacity')"
          >
            <Diamond :size="13" class="fill-current" />
          </button>
          <div class="flex-1 min-w-0">
            <ScrubInput
              label="不透明度"
              unit="%"
              :min="0"
              :max="100"
              :step="1"
              :model-value="layer.opacity"
              @update:model-value="onTransformValChange('opacity', $event)"
            />
          </div>
        </div>

        <!-- 旋转角度 -->
        <div class="flex items-center justify-between gap-2 rounded-md bg-[#0c1015] border border-[#202733] p-1.5">
          <button
            :class="[
              'p-1 rounded transition-colors shrink-0',
              hasKeyframeAtCurrent('rotation')
                ? 'text-violet-400 bg-violet-950/80 shadow-sm'
                : 'text-slate-600 hover:text-slate-300'
            ]"
            :title="hasKeyframeAtCurrent('rotation') ? '移除当前关键帧' : '在此时间记录关键帧'"
            @click="toggleKeyframe('rotation')"
          >
            <Diamond :size="13" class="fill-current" />
          </button>
          <div class="flex-1 min-w-0">
            <ScrubInput
              label="旋转角度"
              unit="°"
              :min="-360"
              :max="360"
              :step="1"
              :model-value="layer.rotation"
              @update:model-value="onTransformValChange('rotation', $event)"
            />
          </div>
        </div>
      </div>

      <!-- 关键帧插值曲线选择 -->
      <div class="pt-1 space-y-1">
        <div class="flex items-center justify-between text-[10px]">
          <label class="font-medium text-slate-400">补间缓动曲线</label>
          <span class="text-[9px] text-violet-400 font-mono truncate max-w-[140px]" :title="activeKfDescription">
            {{ activeKfDescription }}
          </span>
        </div>
        <Select
          :model-value="currentEasing"
          :options="easingOptions"
          @update:model-value="onEasingChange"
        />
      </div>

      <!-- 关键帧缓动提示 -->
      <div class="rounded-md bg-[#0a0d12] p-2 border border-[#1b222c] text-[10px] text-slate-500 leading-relaxed">
        <div class="flex items-center gap-1 text-slate-400 mb-0.5">
          <Clock :size="11" />
          <span class="font-medium">8 点控制与自由拉伸</span>
        </div>
        自由变换后切换锁定，将严格按当前比例保持联动。按住 Shift 拖动画布角手柄可按当前比例等比放缩。
      </div>
    </div>
  </CollapsibleSection>
</template>
