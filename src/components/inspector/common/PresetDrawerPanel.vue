<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Camera,
  Check,
  ChevronLeft,
  ChevronRight,
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
  X,
} from '@lucide/vue'
import Input from '../../ui/Input.vue'
import PresetThumbnail from './PresetThumbnail.vue'
import {
  getAllJizuraStyles,
  getJizuraCategoryItems,
  type JizuraCategoryKey,
} from '../../../engine/jizura/index'
import { useEditorStore } from '../../../stores/editor'

const editor = useEditorStore()
const search = ref('')
const categoryBarRef = ref<HTMLElement | null>(null)

const categories: Array<{ id: string; label: string; icon: any; count: number }> = [
  { id: 'layout', label: '布局排版', icon: LayoutGrid, count: 186 },
  { id: 'enter', label: '入场动效', icon: LogIn, count: 112 },
  { id: 'hold', label: '保持微动', icon: PauseCircle, count: 46 },
  { id: 'exit', label: '退场动效', icon: LogOut, count: 98 },
  { id: 'decor', label: '装饰图元', icon: Sparkles, count: 130 },
  { id: 'treat', label: '文字处理', icon: Type, count: 62 },
  { id: 'bg', label: '背景样式', icon: Layers, count: 66 },
  { id: 'cam', label: '镜头运镜', icon: Camera, count: 36 },
  { id: 'trans', label: '镜头转场', icon: Film, count: 27 },
  { id: 'styles', label: '风格配色', icon: Palette, count: 27 },
]

const currentCategory = computed({
  get: () => editor.activePresetDrawerCategory || 'layout',
  set: (val: string) => editor.openPresetDrawer(val),
})

function scrollCategoryBar(dir: 'left' | 'right') {
  if (categoryBarRef.value) {
    categoryBarRef.value.scrollBy({
      left: dir === 'left' ? -180 : 180,
      behavior: 'smooth',
    })
  }
}

function onCategoryWheel(e: WheelEvent) {
  if (!e.deltaY && !e.deltaX) return
  if (categoryBarRef.value) {
    categoryBarRef.value.scrollLeft += e.deltaY || e.deltaX
    e.preventDefault()
  }
}

const items = computed(() => {
  const cat = currentCategory.value
  const q = search.value.trim().toLowerCase()

  if (cat === 'styles') {
    const all = getAllJizuraStyles()
    if (!q) return all
    return all.filter((s) => s.name.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
  }
  if (cat === 'standard-anim') {
    const all = [
      { id: 'pop-in', name: 'Q弹缩放入场', desc: '果冻回弹+弹性爆发' },
      { id: 'jelly-pop', name: 'Q弹果冻冲击', desc: '夸张挤压拉伸形变+果冻回弹' },
      { id: 'spring-drop', name: 'Q弹跌落碰撞', desc: '高处跌落落地挤压并弹起' },
      { id: 'rubber-in', name: '橡皮筋拉伸', desc: '横向拉开瞬间释放回弹' },
      { id: 'fade-up', name: '上浮淡入', desc: '从下方平滑升起并淡入' },
      { id: 'blur-in', name: '聚焦放大淡入', desc: '大尺寸聚焦平滑入场' },
      { id: 'slide-right', name: '左侧划入', desc: '从左侧快速飞入缓冲' },
      { id: 'slide-left', name: '右侧划入', desc: '从右侧快速飞入缓冲' },
      { id: 'bounce-drop', name: '下落碰撞弹跳', desc: '高处跌落并物理回弹' },
      { id: 'spin-in', name: '旋转缩放入场', desc: '旋转同时伴随Q弹缩放显现' },
      { id: 'flip-x', name: '3D 轴向翻转', desc: '沿 X 轴翻转展开' },
      { id: 'glitch-in', name: '赛博故障入场', desc: '随机位移与高频抖动解码' },
      { id: 'whip-in', name: '急甩鞭打入场', desc: '强劲横向甩出与拖尾缓冲' },
      { id: 'q-jelly', name: 'Q弹果冻微动', desc: '持续果果弹弹地形变摇晃' },
      { id: 'breathe', name: '脉冲呼吸', desc: '周期性平滑缩放呼吸' },
      { id: 'swing', name: '悬挂轻摇', desc: '持续左右柔和振荡摇摆' },
      { id: 'float', name: '悬浮漂移', desc: '优雅8字轨迹正弦漂移' },
      { id: 'beat-hop', name: '心跳跃动', desc: '配合重音向上跳跃与Q弹' },
      { id: 'fall', name: '重力坠落退场', desc: '向下重力跌落并淡出' },
      { id: 'explode', name: '爆散退场', desc: '瞬间放大爆散并淡出' },
      { id: 'shrink', name: '黑洞收缩退场', desc: '快速向中心缩窄消失' },
      { id: 'squash-out', name: '压扁退场', desc: '垂直压扁平移淡出' },
      { id: 'none', name: '无动画', desc: '静态展示' },
    ]
    if (!q) return all
    return all.filter((s) => s.name.toLowerCase().includes(q) || s.desc.toLowerCase().includes(q))
  }

  const all = getJizuraCategoryItems(cat as JizuraCategoryKey)
  if (!q) return all
  return all.filter((item) => item.name.toLowerCase().includes(q) || item.id.toLowerCase().includes(q) || (item.desc && item.desc.toLowerCase().includes(q)))
})

const selectedItemKey = computed(() => {
  const layer = editor.selectedLayer
  if (!layer) return ''
  const cat = currentCategory.value

  if (cat === 'layout') return layer.layoutAnim || layer.textLayout || 'center'
  if (cat === 'enter') return layer.enterAnim || 'pop'
  if (cat === 'hold') return layer.holdAnim || 'breathe'
  if (cat === 'exit') return layer.exitAnim || 'fall'
  if (cat === 'decor') return layer.decorAnim || 'none'
  if (cat === 'treat') return layer.treatAnim || layer.textTreatment || 'none'
  if (cat === 'bg') return layer.bgPreset || layer.bgType || editor.backgroundConfig.type
  if (cat === 'cam') return layer.camAnim || 'none'
  if (cat === 'trans') return layer.transAnim || 'none'
  if (cat === 'styles') return editor.activeJizuraStyleId
  if (cat === 'standard-anim') return layer.animPreset || 'none'
  return ''
})

function applyPreset(item: any) {
  const cat = currentCategory.value
  const hasBgLayer = editor.selectedLayers.some((l) => l.kind === 'background')

  if (cat === 'layout') {
    editor.updateSelected({ layoutAnim: item.id, textLayout: item.id })
  } else if (cat === 'enter') {
    editor.updateSelected({ enterAnim: item.id })
  } else if (cat === 'hold') {
    editor.updateSelected({ holdAnim: item.id })
  } else if (cat === 'exit') {
    editor.updateSelected({ exitAnim: item.id })
  } else if (cat === 'decor') {
    editor.updateSelected({ decorAnim: item.id })
  } else if (cat === 'treat') {
    editor.updateSelected({ treatAnim: item.id, textTreatment: item.id })
  } else if (cat === 'bg') {
    if (hasBgLayer) {
      editor.updateSelected({ bgPreset: item.id, bgType: item.id })
    } else {
      editor.updateBackgroundConfig({ type: item.id })
    }
  } else if (cat === 'cam') {
    editor.updateSelected({ camAnim: item.id })
  } else if (cat === 'trans') {
    editor.updateSelected({ transAnim: item.id })
  } else if (cat === 'styles') {
    editor.applyJizuraStyle(item.id)
  } else if (cat === 'standard-anim') {
    editor.updateSelected({ animPreset: item.id })
  }
}
</script>

<template>
  <aside
    class="relative flex h-full shrink-0 flex-col border-l border-[#242b36] bg-[#0c1016] text-slate-200 select-none overflow-hidden z-30 shadow-2xl transition-all duration-75"
    :style="{ width: `${editor.presetDrawerWidth || 420}px` }"
  >
    <!-- 顶栏标题与关闭按钮 -->
    <div class="flex h-11 shrink-0 items-center justify-between border-b border-[#242b36] px-3.5 bg-[#10151f]">
      <div class="flex items-center gap-2 text-xs font-semibold text-slate-200">
        <Sparkles :size="15" class="text-violet-400" />
        <span>视觉预设实时预览库</span>
        <span v-if="editor.selectedLayers.length > 1" class="text-[10px] font-mono text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-800">
          已多选 {{ editor.selectedLayers.length }} 个图层
        </span>
      </div>

      <button
        class="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-[#1a2230] hover:text-white transition"
        title="关闭预设抽屉面板"
        @click="editor.closePresetDrawer"
      >
        <X :size="14" />
      </button>
    </div>

    <!-- 分类滑动选择栏 (带左右箭头导航与滚轮支持) -->
    <div class="relative flex items-center border-b border-[#1f2733] bg-[#090d14] px-1">
      <button
        class="flex h-7 w-5 items-center justify-center text-slate-500 hover:text-white shrink-0 hover:bg-[#161c28] rounded transition"
        title="向左滑动分类"
        @click="scrollCategoryBar('left')"
      >
        <ChevronLeft :size="13" />
      </button>

      <div
        ref="categoryBarRef"
        class="flex items-center gap-1 overflow-x-auto py-2 px-1 no-scrollbar scroll-smooth flex-1"
        @wheel.prevent="onCategoryWheel"
      >
        <button
          v-for="c in categories"
          :key="c.id"
          :class="[
            'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium shrink-0 transition',
            currentCategory === c.id
              ? 'bg-violet-600 text-white shadow-sm'
              : 'bg-[#131924] text-slate-400 hover:text-slate-200 hover:bg-[#17202e]'
          ]"
          @click="currentCategory = c.id"
        >
          <component :is="c.icon" :size="12" />
          <span>{{ c.label }}</span>
          <span class="opacity-60 text-[9px] font-mono">({{ c.count }})</span>
        </button>
      </div>

      <button
        class="flex h-7 w-5 items-center justify-center text-slate-500 hover:text-white shrink-0 hover:bg-[#161c28] rounded transition"
        title="向右滑动分类"
        @click="scrollCategoryBar('right')"
      >
        <ChevronRight :size="13" />
      </button>
    </div>

    <!-- 搜索筛选框 -->
    <div class="border-b border-[#202734] p-2.5 bg-[#0b0f16]">
      <Input
        v-model="search"
        placeholder="快速检索当前分类预设..."
        :prefix-icon="Search"
        size="sm"
      />
    </div>

    <!-- 宫格卡片列表 (展示真实的 JIZURA 动态图形与排版预览) -->
    <div class="min-h-0 flex-1 overflow-y-auto p-2.5">
      <div class="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-2">
        <button
          v-for="item in items"
          :key="item.id"
          :class="[
            'group flex flex-col rounded-lg border p-1.5 text-left transition relative overflow-hidden',
            selectedItemKey === item.id
              ? 'border-violet-500 bg-violet-950/40 text-violet-100 shadow-sm ring-1 ring-violet-500/60'
              : 'border-[#1e2634] bg-[#0f141d] text-slate-300 hover:border-violet-500/80 hover:bg-[#141b26]'
          ]"
          @click="applyPreset(item)"
        >
          <!-- 核心：真实的预设视觉预览画布 -->
          <PresetThumbnail :category="currentCategory" :item="item" />

          <!-- 卡片信息 -->
          <div class="mt-1.5 px-0.5">
            <div class="flex items-center justify-between gap-1 mb-0.5">
              <span class="text-[11px] font-semibold text-slate-100 group-hover:text-violet-300 truncate">
                {{ item.name }}
              </span>

              <span
                v-if="selectedItemKey === item.id"
                class="flex items-center gap-0.5 text-[8px] font-mono text-emerald-400 bg-emerald-950/90 px-1 py-0.5 rounded border border-emerald-800/60 shrink-0"
              >
                <Check :size="8" />已应用
              </span>
            </div>

            <p class="text-[9px] text-slate-400 leading-snug line-clamp-1 mt-0.5">
              {{ item.desc || item.name }}
            </p>
          </div>
        </button>
      </div>

      <div v-if="items.length === 0" class="py-16 text-center text-slate-500 text-xs">
        未检索到匹配的预设
      </div>
    </div>

    <!-- 底部状态指示栏 -->
    <div class="flex h-8 shrink-0 items-center justify-between border-t border-[#202734] bg-[#0a0e14] px-3.5 text-[10px] text-slate-500">
      <span>点击卡片应用至选中的 {{ editor.selectedLayers.length }} 个图层</span>
      <span class="font-mono text-violet-400">{{ items.length }} 款预设</span>
    </div>
  </aside>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
</style>
