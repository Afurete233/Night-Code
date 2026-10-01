<script setup lang="ts">
import { ref } from 'vue'
import { Image as ImageIcon, RotateCcw, Upload } from '@lucide/vue'
import CollapsibleSection from '../common/CollapsibleSection.vue'
import type { Layer } from '../../../engine/types'
import { useEditorStore } from '../../../stores/editor'

defineProps<{
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
      editor.updateSelected({
        assetUrl: dataUrl,
        name: file.name,
      })
    }
  }
  reader.readAsDataURL(file)
  ;(e.target as HTMLInputElement).value = ''
}

function resetTransform() {
  editor.updateSelected({
    x: 960,
    y: 540,
    scale: 100,
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
            <p class="text-[10px] text-slate-500 mt-0.5">自适应画板尺寸</p>
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
              title="重置到画板中心"
              @click="resetTransform"
            >
              <RotateCcw :size="11" />
              <span>居中</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </CollapsibleSection>
</template>
