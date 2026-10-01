<script setup lang="ts">
import { ref } from 'vue'
import { Image as ImageIcon, Link, RotateCcw, Unlink, Upload } from '@lucide/vue'
import CollapsibleSection from '../common/CollapsibleSection.vue'
import ScrubInput from '../../ui/ScrubInput.vue'
import type { Layer } from '../../../engine/types'
import { useEditorStore } from '../../../stores/editor'

const props = defineProps<{
  layer: Layer
}>()

const editor = useEditorStore()
const fileInput = ref<HTMLInputElement | null>(null)

function onFileSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (event) => {
    const dataUrl = event.target?.result as string
    if (dataUrl) {
      const img = new Image()
      img.onload = () => {
        const nw = img.naturalWidth || 600
        const nh = img.naturalHeight || 400
        editor.updateSelected({
          assetUrl: dataUrl,
          name: file.name,
          naturalWidth: nw,
          naturalHeight: nh,
          width: nw,
          height: nh,
          scale: 100,
          scaleX: 100,
          scaleY: 100,
        })
      }
      img.src = dataUrl
    }
  }
  reader.readAsDataURL(file)
  ;(e.target as HTMLInputElement).value = ''
}

function onWidthChange(newW: number) {
  const nw = props.layer.naturalWidth || props.layer.width || 600
  const nh = props.layer.naturalHeight || props.layer.height || 400
  if (props.layer.lockAspectRatio !== false) {
    const ratio = nh / nw
    const newH = Math.round(newW * ratio)
    const scale = Math.round((newW / nw) * 100)
    editor.updateSelected({ width: newW, height: newH, scale, scaleX: scale, scaleY: scale })
  } else {
    const scaleX = Math.round((newW / nw) * 100)
    editor.updateSelected({ width: newW, scaleX })
  }
}

function onHeightChange(newH: number) {
  const nw = props.layer.naturalWidth || props.layer.width || 600
  const nh = props.layer.naturalHeight || props.layer.height || 400
  if (props.layer.lockAspectRatio !== false) {
    const ratio = nw / nh
    const newW = Math.round(newH * ratio)
    const scale = Math.round((newH / nh) * 100)
    editor.updateSelected({ width: newW, height: newH, scale, scaleX: scale, scaleY: scale })
  } else {
    const scaleY = Math.round((newH / nh) * 100)
    editor.updateSelected({ height: newH, scaleY })
  }
}

function resetTransform() {
  const nw = props.layer.naturalWidth || 600
  const nh = props.layer.naturalHeight || 400
  editor.updateSelected({
    x: 960,
    y: 540,
    width: nw,
    height: nh,
    scale: 100,
    scaleX: 100,
    scaleY: 100,
    rotation: 0,
    opacity: 100,
  })
}
</script>

<template>
  <CollapsibleSection title="图片素材属性" :icon="ImageIcon" :default-open="true">
    <div class="space-y-3">
      <!-- 缩略图预览卡片 -->
      <div class="flex items-center gap-3 rounded-md border border-[#202733] bg-[#0c1015] p-2.5">
        <div class="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded border border-[#262f3d] bg-[#141924]">
          <img
            v-if="layer.assetUrl"
            :src="layer.assetUrl"
            class="h-full w-full object-contain"
            alt="Layer thumbnail"
          />
          <ImageIcon v-else :size="20" class="text-slate-600" />
        </div>

        <div class="flex min-w-0 flex-1 flex-col justify-between self-stretch py-0.5">
          <div>
            <p class="truncate text-xs font-semibold text-slate-200">{{ layer.name }}</p>
            <p class="text-[10px] text-slate-500 mt-0.5">
              原图: {{ layer.naturalWidth || layer.width || 600 }} × {{ layer.naturalHeight || layer.height || 400 }} px
            </p>
          </div>

          <div class="flex items-center gap-1.5 pt-1">
            <input
              ref="fileInput"
              type="file"
              accept="image/*"
              class="hidden"
              @change="onFileSelect"
            />
            <button
              class="flex items-center gap-1 rounded bg-[#1c2331] px-2 py-1 text-[10px] font-medium text-slate-300 hover:bg-violet-600 hover:text-white transition"
              @click="fileInput?.click()"
            >
              <Upload :size="11" />
              <span>更换图片</span>
            </button>
            <button
              class="flex items-center gap-1 rounded bg-[#1c2331] px-2 py-1 text-[10px] font-medium text-slate-300 hover:bg-[#252f42] hover:text-white transition"
              title="重置到画板中心原图大小"
              @click="resetTransform"
            >
              <RotateCcw :size="11" />
              <span>居中原大</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 尺寸调节 (实际像素与原始分辨率) -->
      <div class="space-y-2">
        <div class="flex items-center justify-between">
          <label class="text-[10px] font-medium text-slate-400">渲染尺寸 (Pixels)</label>
          <button
            class="flex items-center gap-1 text-[10px] text-slate-400 hover:text-violet-300 transition"
            @click="editor.updateSelected({ lockAspectRatio: !(layer.lockAspectRatio !== false) })"
          >
            <Link v-if="layer.lockAspectRatio !== false" :size="11" class="text-violet-400" />
            <Unlink v-else :size="11" class="text-slate-500" />
            <span>{{ layer.lockAspectRatio !== false ? '锁定等比' : '自由拉伸' }}</span>
          </button>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <ScrubInput
            label="宽度"
            unit="px"
            :min="10"
            :max="3840"
            :step="5"
            :model-value="layer.width || layer.naturalWidth || 600"
            @update:model-value="onWidthChange"
          />

          <ScrubInput
            label="高度"
            unit="px"
            :min="10"
            :max="2160"
            :step="5"
            :model-value="layer.height || layer.naturalHeight || 400"
            @update:model-value="onHeightChange"
          />
        </div>
      </div>
    </div>
  </CollapsibleSection>
</template>
