<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import {
  Edit3,
  Eye,
  EyeOff,
  FolderOpen,
  GripVertical,
  Image as ImageIcon,
  Layers3,
  Lock,
  MousePointer2,
  Music2,
  Palette,
  PanelLeftClose,
  Plus,
  Search,
  Square,
  SquareStack,
  Trash2,
  Type,
  Unlock,
  Upload,
  Wand2,
} from '@lucide/vue'
import EditorPanel from './common/EditorPanel.vue'
import ContextMenu, { type ContextMenuItemDef } from './ui/ContextMenu.vue'
import DropdownMenu, { type DropdownMenuItemDef } from './ui/DropdownMenu.vue'
import Input from './ui/Input.vue'
import { useEditorStore, type Layer } from '../stores/editor'

const editor = useEditorStore()
const activePanel = ref<'layers' | 'assets'>('layers')
const search = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const filteredLayers = computed(() => {
  const query = search.value.trim().toLowerCase()
  return !query ? editor.layers : editor.layers.filter((layer) => layer.name.toLowerCase().includes(query))
})

const layerIcon = (layer: Layer) => {
  if (layer.kind === 'text') return Type
  if (layer.kind === 'image') return ImageIcon
  if (layer.kind === 'audio') return Music2
  if (layer.kind === 'shape') return Square
  if (layer.kind === 'background') return Palette
  return SquareStack
}

function importFiles(event: Event) {
  const files = Array.from((event.target as HTMLInputElement).files ?? [])
  files.forEach((file) => editor.addAssetLayer(file))
  ;(event.target as HTMLInputElement).value = ''
}

// 弹出新建菜单选项
const newMenuItems: DropdownMenuItemDef[] = [
  {
    label: 'JIZURA 智能歌词生成器',
    desc: '粘贴歌词/LRC一键生成整套动效排版',
    icon: Wand2,
    onClick: () => {
      editor.showLyricModal = true
    },
  },
  {
    separator: true,
    label: '',
  },
  {
    label: '新建文字图层',
    desc: '创建富文本并支持 JIZURA 与 MG 动效',
    icon: Type,
    onClick: () => editor.addTextLayer(),
  },
  {
    label: '添加几何色块',
    desc: '创建纯直角几何色彩素材',
    icon: Square,
    onClick: () => editor.addShapeLayer(),
  },
  {
    label: '添加背景素材图层',
    desc: '在时间轴上添加独立的背景片段',
    icon: Palette,
    onClick: () => editor.addBackgroundLayer(),
  },
  {
    separator: true,
    label: '',
  },
  {
    label: '导入图片/音频文件',
    desc: '从本地选择图片或音频文件导入',
    icon: Upload,
    onClick: () => fileInput.value?.click(),
  },
]

// 行内重命名状态
const editingLayerId = ref<string | null>(null)
const editingName = ref('')
const renameInputRef = ref<HTMLInputElement | null>(null)

function startRename(layer: Layer) {
  editingLayerId.value = layer.id
  editingName.value = layer.name
  nextTick(() => {
    renameInputRef.value?.focus()
    renameInputRef.value?.select()
  })
}

function commitRename(layer: Layer) {
  if (editingLayerId.value === layer.id) {
    const trimmed = editingName.value.trim()
    if (trimmed) {
      editor.updateLayer(layer.id, { name: trimmed })
    }
    editingLayerId.value = null
  }
}

function cancelRename() {
  editingLayerId.value = null
}

// 右键上下文菜单选项
function getContextMenuItems(layer: Layer): ContextMenuItemDef[] {
  return [
    {
      label: '重命名素材',
      icon: Edit3,
      shortcut: '双击',
      onClick: () => startRename(layer),
    },
    {
      label: layer.visible ? '隐藏此素材' : '显示此素材',
      icon: layer.visible ? EyeOff : Eye,
      onClick: () => editor.toggleVisibility(layer.id),
    },
    {
      label: layer.locked ? '解锁素材' : '锁定素材',
      icon: layer.locked ? Unlock : Lock,
      onClick: () => editor.toggleLock(layer.id),
    },
    {
      separator: true,
      label: '',
    },
    {
      label: '删除此素材',
      icon: Trash2,
      danger: true,
      shortcut: 'Delete',
      onClick: () => editor.deleteLayer(layer.id),
    },
  ]
}

// 拖拽排序
const draggedIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

function onDragStart(e: DragEvent, index: number) {
  if (editingLayerId.value) {
    e.preventDefault()
    return
  }
  draggedIndex.value = index
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }
}

function onDragOver(e: DragEvent, index: number) {
  if (draggedIndex.value === null) return
  e.preventDefault()
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'move'
  dragOverIndex.value = index
}

function onDrop(e: DragEvent, toIndex: number) {
  e.preventDefault()
  if (draggedIndex.value !== null && draggedIndex.value !== toIndex) {
    editor.reorderLayers(draggedIndex.value, toIndex)
  }
  draggedIndex.value = null
  dragOverIndex.value = null
}

function onDragEnd() {
  draggedIndex.value = null
  dragOverIndex.value = null
}
</script>

<template>
  <EditorPanel position="left" :width="editor.leftWidth" overflow="hidden">
    <!-- 通用 Header 插槽自定义标签栏与扩展动作按钮 -->
    <template #header>
      <div class="flex h-full items-center gap-1">
        <button
          :class="['panel-tab', activePanel === 'layers' && 'panel-tab-active']"
          @click="activePanel = 'layers'"
        >
          <Layers3 :size="14" />图层
        </button>
        <button
          :class="['panel-tab', activePanel === 'assets' && 'panel-tab-active']"
          @click="activePanel = 'assets'"
        >
          <FolderOpen :size="14" />素材
        </button>
      </div>

      <div class="flex items-center gap-1 ml-auto">
        <DropdownMenu :items="newMenuItems" align="end">
          <template #trigger>
            <button class="icon-button" title="新建与导入">
              <Plus :size="15" />
            </button>
          </template>
        </DropdownMenu>
        <button class="icon-button" title="收起左侧面板" @click="editor.toggleLeftPanel">
          <PanelLeftClose :size="14" />
        </button>
      </div>
    </template>

    <!-- 通用 Body 默认插槽区 -->
    <div class="flex h-full flex-col">
      <!-- 全局隐藏式文件导入选择框，随时随地响应导入 -->
      <input ref="fileInput" class="hidden" type="file" accept="image/*,audio/*" multiple @change="importFiles" />

      <!-- 搜索栏 -->
      <div class="border-b border-[#242b35] p-2.5">
        <Input
          v-model="search"
          :placeholder="activePanel === 'layers' ? '搜索图层...' : '搜索已导入素材...'"
          :prefix-icon="Search"
          size="sm"
        />
      </div>

      <!-- 面板 1: 图层列表 -->
      <div v-if="activePanel === 'layers'" class="min-h-0 flex-1 overflow-y-auto p-2">
        <div class="mb-2 flex items-center justify-between px-2 py-1 text-[10px] font-semibold uppercase tracking-[.16em] text-slate-500">
          <span>Scene layers ({{ editor.layers.length }})</span>
          <button
            class="text-[10px] text-violet-400 hover:text-violet-300"
            @click="editor.addTextLayer"
          >
            + 加文字
          </button>
        </div>

        <!-- 图层列表与右键菜单/重命名 -->
        <div class="space-y-1">
          <ContextMenu
            v-for="(layer, index) in filteredLayers"
            :key="layer.id"
            :items="getContextMenuItems(layer)"
          >
            <template #trigger>
              <div
                draggable="true"
                :class="[
                  'layer-row group/row cursor-pointer select-none relative transition-all',
                  editor.selectedLayerIds.includes(layer.id) && 'layer-row-active',
                  draggedIndex === index ? 'opacity-35 bg-violet-950/20' : '',
                  dragOverIndex === index && draggedIndex !== index ? 'border-t-2 border-t-violet-400 bg-violet-950/40' : ''
                ]"
                role="button"
                tabindex="0"
                @dragstart="onDragStart($event, index)"
                @dragover="onDragOver($event, index)"
                @drop="onDrop($event, index)"
                @dragend="onDragEnd"
                @click="editor.selectLayer(layer.id, $event.shiftKey || $event.ctrlKey || $event.metaKey)"
              >
                <!-- 拖拽手柄 -->
                <div
                  class="cursor-grab active:cursor-grabbing text-slate-600 group-hover/row:text-slate-400 p-0.5 -ml-1"
                  title="按住上下拖动调整图层顺序"
                  @click.stop
                >
                  <GripVertical :size="13" />
                </div>

                <component :is="layerIcon(layer)" :size="15" :style="{ color: layer.color }" />

                <!-- 行内重命名编辑框 -->
                <input
                  v-if="editingLayerId === layer.id"
                  ref="renameInputRef"
                  v-model="editingName"
                  class="h-6 min-w-0 flex-1 rounded border border-violet-500 bg-[#090d14] px-1.5 text-xs text-white outline-none"
                  @blur="commitRename(layer)"
                  @keydown.enter="commitRename(layer)"
                  @keydown.escape="cancelRename"
                  @click.stop
                />
                <span
                  v-else
                  class="min-w-0 flex-1 truncate text-left"
                  title="双击或右键可重命名"
                  @dblclick.stop="startRename(layer)"
                >
                  {{ layer.name }}
                </span>

                <!-- 显隐切换按钮 -->
                <button class="shrink-0 text-slate-600 hover:text-slate-200" @click.stop="editor.toggleVisibility(layer.id)">
                  <Eye v-if="layer.visible" :size="13" />
                  <span v-else class="block h-3 w-3 rounded-full border border-slate-600" />
                </button>
              </div>
            </template>
          </ContextMenu>
        </div>
      </div>

      <!-- 面板 2: 素材库 -->
      <div v-else class="min-h-0 flex-1 overflow-y-auto p-2">
        <div class="mb-2 flex items-center justify-between px-2 py-1 text-[10px] font-semibold uppercase tracking-[.16em] text-slate-500">
          <span>Imported Assets</span>
          <button
            class="text-[10px] text-violet-400 hover:text-violet-300"
            @click="fileInput?.click()"
          >
            + 导入
          </button>
        </div>

        <div class="space-y-1.5">
          <div
            v-for="layer in editor.layers.filter((l) => l.kind === 'image' || l.kind === 'audio')"
            :key="layer.id"
            class="flex items-center gap-2 rounded-md border border-[#222b38] bg-[#0c1015] p-2 text-xs text-slate-200"
          >
            <component :is="layerIcon(layer)" :size="14" :style="{ color: layer.color }" />
            <span class="truncate flex-1">{{ layer.name }}</span>
          </div>
        </div>

        <!-- 底部导入提示引导 -->
        <div
          class="mt-4 rounded-lg border border-dashed border-[#2a323e] p-3 text-center cursor-pointer hover:border-violet-500 transition"
          @click="fileInput?.click()"
        >
          <MousePointer2 :size="16" class="mx-auto mb-2 text-slate-600" />
          <p class="text-[11px] leading-5 text-slate-500">
            点击或拖拽图片/音频至此导入<br />支持一键生成视频素材
          </p>
        </div>
      </div>
    </div>

    <!-- 通用 Footer 底栏插槽 -->
    <template #footer>
      <div class="p-2.5">
        <button
          class="flex w-full items-center justify-center gap-2 rounded-md bg-[#161c26] border border-[#263140] px-2 py-1.5 text-xs text-slate-300 hover:border-violet-500 hover:text-white transition"
          @click="editor.showLyricModal = true"
        >
          <Wand2 :size="13" class="text-violet-400" />
          <span>JIZURA 智能歌词排版生成器</span>
        </button>
      </div>
    </template>
  </EditorPanel>
</template>

<style scoped>
.icon-button { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 6px; color: #7f8a9a; }
.icon-button:hover { background: #1b212b; color: #eef2f6; }
.panel-tab { display: flex; align-items: center; gap: 5px; border-radius: 6px; padding: 6px 8px; font-size: 11px; color: #7f8a9a; transition: all 0.15s; }
.panel-tab:hover { color: #cbd5e1; }
.panel-tab-active { background: #1b212b; color: #f1f5f9; }
.layer-row { display: flex; width: 100%; align-items: center; gap: 8px; border-radius: 6px; padding: 8px 9px; color: #9aa6b5; font-size: 11px; }
.layer-row:hover { background: #191f28; color: #e2e8f0; }
.layer-row-active { background: #241d3c; color: #f4f1ff; box-shadow: inset 2px 0 #8b5cf6; }
</style>
