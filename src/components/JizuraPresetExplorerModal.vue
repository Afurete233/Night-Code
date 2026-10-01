<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Camera,
  Check,
  Film,
  Layers,
  LayoutGrid,
  LogIn,
  LogOut,
  Palette,
  PauseCircle,
  Search,
  Sparkles,
  Type,
  Wand2,
  Zap,
} from '@lucide/vue'
import Dialog from './ui/Dialog.vue'
import Input from './ui/Input.vue'
import {
  getAllJizuraStyles,
  getJizuraCategoryItems,
  getJizuraMoods,
  type JizuraCategoryKey,
} from '../engine/jizura/index'
import { useEditorStore } from '../stores/editor'

const editor = useEditorStore()

const activeTab = ref<JizuraCategoryKey | 'styles' | 'moods'>('styles')
const searchQuery = ref('')
const copiedId = ref<string | null>(null)

const categoryTabs: Array<{ id: JizuraCategoryKey | 'styles' | 'moods'; label: string; icon: any }> = [
  { id: 'styles', label: '风格 (Styles 27)', icon: Palette },
  { id: 'moods', label: '手法氛围 (Moods 8)', icon: Wand2 },
  { id: 'layout', label: '布局 (Layout 186)', icon: LayoutGrid },
  { id: 'enter', label: '入场 (Enter 112)', icon: LogIn },
  { id: 'hold', label: '保持 (Hold 46)', icon: PauseCircle },
  { id: 'exit', label: '退场 (Exit 98)', icon: LogOut },
  { id: 'decor', label: '装饰 (Decor 130)', icon: Sparkles },
  { id: 'treat', label: '文字处理 (Treat 62)', icon: Type },
  { id: 'bg', label: '背景 (BG 66)', icon: Layers },
  { id: 'cam', label: '运镜 (Camera 36)', icon: Camera },
  { id: 'fx', label: '画面特效 (FX 69)', icon: Zap },
  { id: 'trans', label: '转场 (Trans 27)', icon: Film },
]

const currentItems = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (activeTab.value === 'styles') {
    const all = getAllJizuraStyles()
    if (!q) return all
    return all.filter((s) => s.name.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
  }
  if (activeTab.value === 'moods') {
    const all = getJizuraMoods()
    if (!q) return all
    return all.filter((m) => m.name.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q) || m.id.toLowerCase().includes(q))
  }

  const all = getJizuraCategoryItems(activeTab.value)
  if (!q) return all
  return all.filter((item) => item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q) || (item.desc && item.desc.toLowerCase().includes(q)))
})

function applyItem(item: any) {
  if (activeTab.value === 'styles') {
    editor.applyJizuraStyle(item.id)
  } else if (activeTab.value === 'treat') {
    editor.updateSelected({ textTreatment: item.id })
  } else if (activeTab.value === 'layout') {
    editor.updateSelected({ textLayout: item.id })
  } else if (activeTab.value === 'bg') {
    editor.updateBackgroundConfig({ type: item.id })
  }

  copiedId.value = item.id
  setTimeout(() => {
    if (copiedId.value === item.id) {
      copiedId.value = null
    }
  }, 1500)
}
</script>

<template>
  <Dialog
    :open="editor.showJizuraExplorerModal"
    title="JIZURA 全量表现与预设库 (850+ 表现部件)"
    :icon="Sparkles"
    @update:open="editor.showJizuraExplorerModal = $event"
  >
    <div class="space-y-3.5 text-xs text-slate-300">
      <!-- 搜索栏 -->
      <div>
        <Input
          v-model="searchQuery"
          placeholder="搜索全部 850+ JIZURA 表现预设、样式、动效与布局..."
          :prefix-icon="Search"
          size="md"
        />
      </div>

      <!-- 类别切换标签栏 -->
      <div class="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar border-b border-[#242b36]">
        <button
          v-for="tab in categoryTabs"
          :key="tab.id"
          :class="[
            'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium shrink-0 transition',
            activeTab === tab.id
              ? 'bg-violet-600 text-white shadow-sm'
              : 'bg-[#121722] text-slate-400 hover:text-slate-200 hover:bg-[#18202d]'
          ]"
          @click="activeTab = tab.id"
        >
          <component :is="tab.icon" :size="12" />
          <span>{{ tab.label }}</span>
        </button>
      </div>

      <!-- 预设卡片网格 -->
      <div class="max-h-[380px] overflow-y-auto pr-1">
        <div class="grid grid-cols-3 gap-2">
          <div
            v-for="item in currentItems"
            :key="item.id"
            class="group flex flex-col justify-between rounded-lg border border-[#202734] bg-[#0c1016] p-2.5 hover:border-violet-500 hover:bg-[#111722] transition relative"
          >
            <div>
              <div class="flex items-center justify-between gap-1 mb-1">
                <span class="font-semibold text-slate-100 text-xs truncate group-hover:text-violet-300">
                  {{ item.name }}
                </span>
                <span class="font-mono text-[9px] text-slate-500 bg-[#161c28] px-1.5 py-0.5 rounded shrink-0">
                  {{ item.id }}
                </span>
              </div>

              <p class="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                {{ item.desc || item.name }}
              </p>
            </div>

            <!-- 底部操作按钮 -->
            <div class="pt-2 mt-2 border-t border-[#1a212c] flex items-center justify-between">
              <span class="text-[9px] text-slate-500 font-mono">{{ activeTab }}</span>

              <button
                class="flex items-center gap-1 px-2 py-0.5 rounded bg-violet-950/60 text-violet-300 hover:bg-violet-600 hover:text-white text-[10px] font-medium transition"
                @click="applyItem(item)"
              >
                <Check v-if="copiedId === item.id" :size="10" />
                <span>{{ copiedId === item.id ? '已应用' : '一键应用' }}</span>
              </button>
            </div>
          </div>
        </div>

        <div v-if="currentItems.length === 0" class="py-12 text-center text-slate-500">
          未搜索到匹配的表现预设
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex items-center justify-between text-[11px] text-slate-500">
        <span>数据源自 JIZURA 官方规范，支持运行 scripts/sync_jizura.js 一键拉取更新</span>
        <button
          class="rounded-md bg-[#18202d] px-3.5 py-1.5 text-xs text-slate-300 hover:bg-[#222c3e] hover:text-white transition"
          @click="editor.showJizuraExplorerModal = false"
        >
          关闭
        </button>
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
