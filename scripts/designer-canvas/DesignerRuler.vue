<template>
  <canvas
    ref="canvasRef"
    class="designer-ruler"
    :class="`designer-ruler--${orientation}`"
    :style="canvasStyle"
    @pointerdown="$emit('pointerdown', $event)"
  />
</template>

<script lang="ts" setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import type { DesignerUnit } from './types'

const props = defineProps<{
  orientation: 'horizontal' | 'vertical'
  length: number
  thickness: number
  offset: number
  zoom: number
  unit: DesignerUnit
}>()

defineEmits<{
  pointerdown: [event: PointerEvent]
}>()

const canvasRef = ref<HTMLCanvasElement>()
const canvasStyle = computed(() =>
  props.orientation === 'horizontal'
    ? { width: `${props.length}px`, height: `${props.thickness}px` }
    : { width: `${props.thickness}px`, height: `${props.length}px` }
)

function nearlyMultiple(value: number, step: number): boolean {
  return Math.abs(value / step - Math.round(value / step)) < 1e-6
}

function draw(): void {
  const canvas = canvasRef.value
  if (!canvas || props.length <= 0) return

  const dpr = window.devicePixelRatio || 1
  const cssWidth = props.orientation === 'horizontal' ? props.length : props.thickness
  const cssHeight = props.orientation === 'horizontal' ? props.thickness : props.length
  canvas.width = Math.max(1, Math.round(cssWidth * dpr))
  canvas.height = Math.max(1, Math.round(cssHeight * dpr))

  const context = canvas.getContext('2d')
  if (!context) return
  context.setTransform(dpr, 0, 0, dpr, 0, 0)
  context.clearRect(0, 0, cssWidth, cssHeight)
  context.fillStyle = '#f8fafc'
  context.fillRect(0, 0, cssWidth, cssHeight)
  context.strokeStyle = '#cbd5e1'
  context.fillStyle = '#64748b'
  context.lineWidth = 1
  context.font = '14px ui-monospace, SFMono-Regular, Menlo, monospace'
  context.textBaseline = 'top'

  const pxPerWorld = props.unit.pixelsPerUnit * props.zoom
  const steps = props.unit.getRulerSteps({
    zoom: props.zoom,
    pixelsPerUnit: props.unit.pixelsPerUnit,
    minimumMinorTickPx: 7,
    minimumMajorTickPx: 56
  })
  const worldStart = (0 - props.offset) / pxPerWorld
  const worldEnd = (props.length - props.offset) / pxPerWorld
  const firstTick = Math.floor(Math.min(worldStart, worldEnd) / steps.minor) * steps.minor
  const lastTick = Math.max(worldStart, worldEnd) + steps.minor

  context.beginPath()
  if (props.orientation === 'horizontal') {
    context.moveTo(0, props.thickness - 0.5)
    context.lineTo(props.length, props.thickness - 0.5)
  } else {
    context.moveTo(props.thickness - 0.5, 0)
    context.lineTo(props.thickness - 0.5, props.length)
  }
  context.stroke()

  for (let value = firstTick; value <= lastTick; value += steps.minor) {
    const position = props.offset + value * pxPerWorld
    if (position < -1 || position > props.length + 1) continue
    const major = nearlyMultiple(value, steps.major)
    const tickLength = major ? 10 : 5

    context.beginPath()
    if (props.orientation === 'horizontal') {
      context.moveTo(Math.round(position) + 0.5, props.thickness)
      context.lineTo(Math.round(position) + 0.5, props.thickness - tickLength)
    } else {
      context.moveTo(props.thickness, Math.round(position) + 0.5)
      context.lineTo(props.thickness - tickLength, Math.round(position) + 0.5)
    }
    context.stroke()

    if (major) {
      const normalized = Math.abs(value) < 1e-8 ? 0 : value
      const label = props.unit.format(normalized)
      if (props.orientation === 'horizontal') {
        context.fillText(label, position + 3, 2)
      } else {
        context.save()
        context.translate(2, position - 3)
        context.rotate(-Math.PI / 2)
        context.fillText(label, 0, 0)
        context.restore()
      }
    }
  }
}

watch(
  [() => props.length, () => props.thickness, () => props.offset, () => props.zoom, () => props.unit],
  () => nextTick(draw),
  { deep: false }
)
onMounted(draw)
</script>

<style lang="less" scoped>
.designer-ruler {
  display: block;
  user-select: none;
  touch-action: none;
}

.designer-ruler--horizontal {
  cursor: row-resize;
}

.designer-ruler--vertical {
  cursor: col-resize;
}
</style>
