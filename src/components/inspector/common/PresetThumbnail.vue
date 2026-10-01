<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { J, getSharedRenderer } from '../../../engine/jizura/renderer'
import { useEditorStore } from '../../../stores/editor'

const props = defineProps<{
  category: string
  item: any
}>()

const editor = useEditorStore()
const canvasRef = ref<HTMLCanvasElement | null>(null)

function renderThumbnail() {
  const canvas = canvasRef.value
  if (!canvas || !J) return
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const renderer = getSharedRenderer()
  if (!renderer) return

  const cat = props.category
  const key = props.item.id

  const project = J.defaultProject ? J.defaultProject() : {}
  project.style = editor.activeJizuraStyleId || 'noir'
  project.aspect = '16:9'
  project.res = 1080
  project.fps = 30
  project.lang = 'zh-Hans'

  try {
    if (cat === 'styles') {
      project.style = key
      const plan = J.previewPlan(project, 'layout', 'center')
      renderer.frame(ctx, plan, 0.8, { scale: canvas.width / plan.W, fast: true, noHud: true })
    } else {
      const plan = J.previewPlan(project, cat, key)
      if (plan) {
        const c = plan.cuts && plan.cuts.length ? plan.cuts[plan.cuts.length - 1] : null
        let t = 0.8
        if (c) {
          if (cat === 'enter') t = c.start + 0.35
          else if (cat === 'exit') t = c.end - 0.25
          else if (cat === 'hold') t = c.start + (c.dur || 2) * 0.5
          else t = c.start + 0.6
        }
        renderer.frame(ctx, plan, t, { scale: canvas.width / plan.W, fast: true, noHud: true, noGhost: cat !== 'fx' })
      }
    }
  } catch (e) {
    ctx.fillStyle = '#111722'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
  }
}

onMounted(() => {
  renderThumbnail()
})

watch(
  () => [props.item.id, props.category, editor.activeJizuraStyleId],
  () => {
    renderThumbnail()
  }
)
</script>

<template>
  <div class="w-full aspect-[16/9] rounded-md overflow-hidden bg-[#090d14] border border-[#1f2735] flex items-center justify-center relative shadow-sm">
    <canvas ref="canvasRef" width="160" height="90" class="w-full h-full object-cover" />
  </div>
</template>
