<script setup lang="ts">
import {
  FolderOpen,
  Image as ImageIcon,
  Lock,
  Music2,
  Palette,
  Type,
  Unlock,
} from '@lucide/vue'
import CollapsibleSection from './CollapsibleSection.vue'
import Input from '../../ui/Input.vue'
import ScrubInput from '../../ui/ScrubInput.vue'
import { useEditorStore, type Layer } from '../../../stores/editor'

defineProps<{
  layer: Layer
}>()

const editor = useEditorStore()
</script>

<template>
  <CollapsibleSection title="图层概览" :icon="FolderOpen" :default-open="true">
    <template #actions>
      <button
        class="icon-action text-slate-400 hover:text-slate-100"
        :title="layer.locked ? '解锁图层' : '锁定图层'"
        @click.stop="editor.toggleLock(layer.id)"
      >
        <Lock v-if="layer.locked" :size="13" class="text-amber-400" />
        <Unlock v-else :size="13" />
      </button>
    </template>

    <div class="space-y-3">
      <!-- 图层名称与类型标识 -->
      <div class="flex items-center gap-2.5">
        <div
          class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md shadow-sm"
          :style="{ backgroundColor: `${layer.color}25`, color: layer.color }"
        >
          <Type v-if="layer.kind === 'text'" :size="15" />
          <ImageIcon v-else-if="layer.kind === 'image'" :size="15" />
          <Music2 v-else-if="layer.kind === 'audio'" :size="15" />
          <Palette v-else :size="15" />
        </div>

        <div class="min-w-0 flex-1">
          <Input
            :model-value="layer.name"
            placeholder="图层名称"
            size="sm"
            @update:model-value="editor.updateSelected({ name: $event })"
          />
        </div>
      </div>

      <!-- 时间区间调节 (ScrubInput) -->
      <div class="grid grid-cols-2 gap-2">
        <ScrubInput
          label="入场"
          unit="s"
          :min="0"
          :max="editor.duration"
          :step="0.1"
          :precision="2"
          :model-value="layer.start"
          @update:model-value="editor.updateSelected({ start: $event })"
        />
        <ScrubInput
          label="时长"
          unit="s"
          :min="0.2"
          :max="editor.duration"
          :step="0.1"
          :precision="2"
          :model-value="layer.duration"
          @update:model-value="editor.updateSelected({ duration: $event })"
        />
      </div>
    </div>
  </CollapsibleSection>
</template>

<style scoped>
.icon-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  transition: all 0.15s ease;
}
.icon-action:hover {
  background: #252d3a;
}
</style>
