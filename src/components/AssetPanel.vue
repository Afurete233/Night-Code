<script setup lang="ts">
import { computed, ref } from 'vue'
import { Eye, FolderOpen, Image as ImageIcon, Layers3, MoreHorizontal, MousePointer2, Music2, Plus, Search, Settings2, SquareStack, Type } from '@lucide/vue'
import { useEditorStore, type Layer } from '../stores/editor'

const editor = useEditorStore()
const activePanel = ref<'assets' | 'layers'>('assets')
const search = ref('')
const fileInput = ref<HTMLInputElement | null>(null)
const filteredLayers = computed(() => { const query = search.value.trim().toLowerCase(); return !query ? editor.layers : editor.layers.filter((layer) => layer.name.toLowerCase().includes(query)) })
const layerIcon = (layer: Layer) => layer.kind === 'text' ? Type : layer.kind === 'image' ? ImageIcon : layer.kind === 'audio' ? Music2 : SquareStack
function importFiles(event: Event) { const files = Array.from((event.target as HTMLInputElement).files ?? []); files.forEach((file) => editor.addAssetLayer(file)); (event.target as HTMLInputElement).value = '' }
</script>

<template>
  <aside class="flex shrink-0 flex-col border-r border-[#242b35] bg-[#11151b]" :style="{ width: `${editor.leftWidth}px` }">
    <div class="flex h-11 shrink-0 items-center gap-1 border-b border-[#242b35] px-2"><button :class="['panel-tab', activePanel === 'assets' && 'panel-tab-active']" @click="activePanel = 'assets'"><FolderOpen :size="14" />素材</button><button :class="['panel-tab', activePanel === 'layers' && 'panel-tab-active']" @click="activePanel = 'layers'"><Layers3 :size="14" />图层</button><button class="icon-button ml-auto"><MoreHorizontal :size="16" /></button></div>
    <div class="border-b border-[#242b35] p-3"><div class="relative"><Search :size="14" class="absolute left-2.5 top-2.5 text-slate-500" /><input v-model="search" class="h-9 w-full rounded-md border border-[#2a323e] bg-[#0d1015] pl-8 pr-3 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-violet-500" placeholder="搜索素材..." /></div></div>
    <div class="min-h-0 flex-1 overflow-y-auto p-2"><div class="mb-2 flex items-center justify-between px-2 py-1 text-[10px] font-semibold uppercase tracking-[.16em] text-slate-500"><span>{{ activePanel === 'assets' ? 'Project assets' : 'Scene layers' }}</span><button class="text-slate-500 hover:text-white" @click="fileInput?.click"><Plus :size="14" /></button></div>
      <input ref="fileInput" class="hidden" type="file" accept="image/*,audio/*" multiple @change="importFiles" />
      <div v-if="activePanel === 'assets'" class="mb-3 grid grid-cols-2 gap-2"><button class="asset-tile" @click="editor.addTextLayer"><div class="asset-thumb bg-gradient-to-br from-violet-500/50 via-indigo-500/20 to-slate-900"><Type :size="19" class="text-violet-200" /></div><span>新建文字</span></button><button class="asset-tile" @click="fileInput?.click"><div class="asset-thumb bg-gradient-to-br from-cyan-400/40 via-blue-900/30 to-slate-900"><ImageIcon :size="19" class="text-cyan-200" /></div><span>导入素材</span></button></div>
      <div class="space-y-1"><div v-for="layer in filteredLayers" :key="layer.id" :class="['layer-row cursor-pointer select-none', editor.selectedLayerId === layer.id && 'layer-row-active']" role="button" tabindex="0" @click="editor.selectLayer(layer.id)"><component :is="layerIcon(layer)" :size="15" :style="{ color: layer.color }" /><span class="min-w-0 flex-1 truncate text-left">{{ layer.name }}</span><button class="shrink-0 text-slate-600 hover:text-slate-200" @click.stop="editor.toggleVisibility(layer.id)"><Eye v-if="layer.visible" :size="13" /><span v-else class="block h-3 w-3 rounded-full border border-slate-600" /></button></div></div>
      <div class="mt-5 rounded-lg border border-dashed border-[#2a323e] p-3 text-center"><MousePointer2 :size="16" class="mx-auto mb-2 text-slate-600" /><p class="text-[11px] leading-5 text-slate-500">点击导入图片或音频<br />开始你的创作</p></div>
    </div>
    <div class="border-t border-[#242b35] p-3"><button class="flex w-full items-center gap-2 rounded-md px-2 py-2 text-xs text-slate-400 hover:bg-[#1b212b] hover:text-slate-200"><Settings2 :size="14" />项目设置<span class="ml-auto text-[10px] text-slate-600">⌘ ,</span></button></div>
  </aside>
</template>

<style scoped>
.icon-button { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 6px; color: #7f8a9a; }
.icon-button:hover { background: #1b212b; color: #eef2f6; }
.panel-tab { display: flex; align-items: center; gap: 6px; border-radius: 6px; padding: 7px 9px; font-size: 11px; color: #7f8a9a; }.panel-tab-active { background: #1b212b; color: #f1f5f9; }
.asset-tile { text-align: left; color: #94a3b8; font-size: 10px; }.asset-thumb { display: flex; height: 70px; align-items: center; justify-content: center; border: 1px solid #2a323e; border-radius: 7px; margin-bottom: 6px; }.asset-tile:hover .asset-thumb { border-color: #8b5cf6aa; }
.layer-row { display: flex; width: 100%; align-items: center; gap: 8px; border-radius: 6px; padding: 8px 9px; color: #9aa6b5; font-size: 11px; }.layer-row:hover { background: #191f28; color: #e2e8f0; }.layer-row-active { background: #241d3c; color: #f4f1ff; box-shadow: inset 2px 0 #8b5cf6; }
</style>
