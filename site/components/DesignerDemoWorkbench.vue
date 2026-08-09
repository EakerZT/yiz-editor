<template>
  <main class="app-shell">
    <header class="app-header">
      <slot name="toolbar-leading" />

      <div class="toolbar" role="toolbar" aria-label="设计器工具栏">
        <div class="toolbar-group" aria-label="缩放工具">
          <span class="toolbar-label">缩放</span>
          <Slider
            class="zoom-slider"
            aria-label="画布缩放"
            :min="Math.round(minZoom * 100)"
            :max="400"
            :step="1"
            :value="Math.round(transform.zoom * 100)"
            :format-tooltip="formatZoomTooltip"
            @update:value="updateZoom"
          />
          <span class="zoom-value">{{ Math.round(transform.zoom * 100) }}%</span>
        </div>

        <span class="toolbar-separator" />

        <div class="toolbar-group" aria-label="画布视图工具">
          <span class="toolbar-label">画布</span>
          <ButtonGroup :gap="4">
            <Button size="small" @click="canvasRef?.fit()">适应</Button>
            <Button size="small" @click="canvasRef?.center()">居中</Button>
          </ButtonGroup>
        </div>

        <span class="toolbar-separator" />

        <div class="toolbar-group" aria-label="交互工具">
          <span class="toolbar-label">交互</span>
          <ButtonGroup :gap="4">
            <Button size="small" :type="snapEnabled ? 'primary' : 'outlined'" @click="snapEnabled = !snapEnabled"
              >吸附 {{ snapEnabled ? '开' : '关' }}</Button
            >
            <Select
              v-model:value="hoverStyleMode"
              class="hover-mode-select"
              aria-label="Hover 预设样式"
              size="small"
              :options="hoverModeOptions"
            />
          </ButtonGroup>
        </div>

        <span class="toolbar-separator" />

        <div class="toolbar-group" aria-label="辅助线工具">
          <span class="toolbar-label">辅助线</span>
          <Switch v-model:value="guidesVisible" aria-label="显示辅助线" size="small" />
          <span class="toolbar-switch-label">{{ guidesVisible ? '显示' : '隐藏' }}</span>
          <Button size="small" @click="clearGuides">清除</Button>
        </div>
      </div>
    </header>

    <section class="workspace">
      <aside class="left-panel">
        <div class="panel-heading">
          <span>元素</span>
          <small>{{ elements.length }}</small>
        </div>
        <Button
          v-for="element in elements"
          :key="`${element.id}:${Boolean(element.locked)}`"
          class="layer-item"
          type="text"
          :class="{ active: selectedIds.includes(element.id), hovered: hoveredId === element.id }"
          @click="selectedIds = [element.id]"
          @pointerenter="hoveredId = element.id"
          @pointerleave="hoveredId = undefined"
        >
          <span class="layer-icon" :style="{ background: String(element.color ?? '#64748b') }" />
          <span>{{ element.title || element.text || element.id }}</span>
          <em v-if="element.locked">锁定</em>
        </Button>

        <div class="tips-card">
          <strong>交互提示</strong>
          <p>左→右框选必须完整包含元素；右→左框选只要相交即可选中。</p>
          <p>拖动时会吸附网格、画布、辅助线和其他元素；按住 Shift 等比缩放。</p>
          <p>鼠标中键或空格 + 左键始终平移画布，即使指针位于元素、辅助线或控制点上；Ctrl + 滚轮缩放。</p>
          <p>从标尺拖出单条辅助线；从左上角交汇区拖出可同时创建横、竖两条，拖出页面范围即可删除。</p>
        </div>
      </aside>

      <section class="canvas-panel">
        <DesignerCanvas
          ref="canvasRef"
          v-model:elements="elements"
          v-model:selected-ids="selectedIds"
          v-model:hovered-id="hoveredId"
          v-model:transform="transform"
          v-model:guides="guides"
          :world-size="worldSize"
          :unit="unit"
          :min-zoom="minZoom"
          :max-zoom="4"
          :snap="snapEnabled"
          :snap-grid-size="snapGridSize"
          :guides-visible="guidesVisible"
          hover-class="demo-element-wrapper-hover"
          :hover-style-mode="hoverStyleMode"
          :get-capabilities="getCapabilities"
          @transform-end="onTransformEnd"
          @guide-create="lastAction = '创建辅助线'"
          @guide-change="lastAction = '移动辅助线'"
          @guide-remove="lastAction = '删除辅助线'"
          @delete-request="deleteElements"
          @element-hover="onElementHover"
        >
          <template #element="{ element, isHover }">
            <DemoElementContent :element="element" :scene="scene" :is-hover="isHover" />
          </template>

          <template #overlay v-if="scene === 'print'">
            <div class="print-header-boundary" :style="printBoundaryStyle(32)" />
            <div class="print-footer-boundary" :style="printBoundaryStyle(272)" />
          </template>
        </DesignerCanvas>

        <div class="canvas-status">
          <span>{{ selectedIds.length }} 个已选择</span>
          <span>{{ hoveredElement ? `悬浮：${hoveredElement.title || hoveredElement.id}` : '未悬浮元素' }}</span>
          <span>{{ guides.length }} 条辅助线</span>
          <span>{{ lastAction }}</span>
        </div>
      </section>

      <aside class="right-panel">
        <div class="panel-heading">
          <span>几何属性</span>
          <small>{{ unit.symbol }}</small>
        </div>

        <template v-if="selectedElement">
          <div class="selected-title">
            <span class="selected-color" :style="{ background: String(selectedElement.color ?? '#2563eb') }" />
            <div>
              <strong>{{ selectedElement.title || selectedElement.text }}</strong>
              <small>{{ selectedElement.id }}</small>
            </div>
          </div>

          <div class="property-grid">
            <label v-for="field in geometryFields" :key="field.key">
              <span>{{ field.label }}</span>
              <InputNumber
                class="number-input"
                size="small"
                :controls="false"
                :step="unit.nudgeStep"
                :precision="scene === 'print' ? 2 : 0"
                :suffix="unit.symbol"
                :value="Number(selectedElement[field.key])"
                @update:value="updateGeometry(field.key, $event)"
              />
            </label>
          </div>

          <Checkbox v-model:checked="selectedElementLocked" class="lock-control">锁定元素</Checkbox>

          <Button class="danger-button" type="plain" color="error" @click="deleteElements(selectedIds)">
            删除所选元素
          </Button>
        </template>

        <div v-else class="empty-inspector">
          <div class="empty-icon">◇</div>
          <strong>未选择元素</strong>
          <p>点击画布元素或在空白区域拖动框选。</p>
        </div>

        <div class="architecture-note">
          <span>外部只负责</span>
          <strong>#element slot</strong>
          <p>定位、选取、移动、缩放与坐标换算全部由 DesignerCanvas 管理。</p>
        </div>
      </aside>
    </section>
  </main>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { Button, ButtonGroup, Checkbox, InputNumber, Select, Slider, Switch, type SliderValue } from '@eakerzt/yiz-ui'
import DemoElementContent from './DemoElementContent.vue'
import {
  DesignerCanvas,
  type DesignerCanvasExpose,
  type DesignerElementBase,
  type DesignerElementCapabilities,
  type DesignerGuide,
  type DesignerSize,
  type DesignerTransform,
  type DesignerUnit,
  type ElementTransformEvent,
  type DesignerElementHoverEvent,
  type DesignerHoverStyleMode
} from 'yiz-editor'

type Scene = 'screen' | 'print'
type GeometryKey = 'left' | 'top' | 'width' | 'height'

const { scene, worldSize, unit, minZoom, snapGridSize } = defineProps<{
  scene: Scene
  worldSize: DesignerSize
  unit: DesignerUnit
  minZoom: number
  snapGridSize: number
}>()

const elements = defineModel<DesignerElementBase[]>('elements', { required: true })
const guides = defineModel<DesignerGuide[]>('guides', { required: true })
const selectedIds = ref<string[]>([])
const hoveredId = ref<string>()
const transform = ref<DesignerTransform>({ zoom: 1, offsetX: 0, offsetY: 0 })
const canvasRef = ref<DesignerCanvasExpose>()
const lastAction = ref('就绪')
const snapEnabled = ref(true)
const guidesVisible = ref(true)
const hoverStyleMode = ref<DesignerHoverStyleMode>('outline')
const hoverModeOptions = [
  { label: 'Hover · 自定义', value: 'none' },
  { label: 'Hover · 底色', value: 'background' },
  { label: 'Hover · 蒙版', value: 'mask' },
  { label: 'Hover · 外框', value: 'outline' }
]

const selectedElement = computed(() => elements.value.find((element) => element.id === selectedIds.value[0]))
const selectedElementLocked = computed({
  get: () => Boolean(selectedElement.value?.locked),
  set: (locked: boolean | undefined) => {
    if (!selectedElement.value || locked == null) return
    const selectedId = selectedElement.value.id
    elements.value = elements.value.map((element) => (element.id === selectedId ? { ...element, locked } : element))
    lastAction.value = locked ? '锁定元素' : '解锁元素'
  }
})
const hoveredElement = computed(() => elements.value.find((element) => element.id === hoveredId.value))
const geometryFields: Array<{ key: GeometryKey; label: string }> = [
  { key: 'left', label: 'X' },
  { key: 'top', label: 'Y' },
  { key: 'width', label: 'W' },
  { key: 'height', label: 'H' }
]

function updateZoom(value: SliderValue | undefined): void {
  if (typeof value !== 'number') return
  canvasRef.value?.zoomTo(value / 100)
}

function formatZoomTooltip(value: number): string {
  return `${Math.round(value)}%`
}

function getCapabilities(element: DesignerElementBase): DesignerElementCapabilities {
  if (element.locked) {
    return { movable: false, resizeX: false, resizeY: false }
  }
  if (element.kind === 'print-line') {
    return { resizeX: true, resizeY: false, minWidth: 1, minHeight: 0.2 }
  }
  return {
    movable: true,
    resizeX: true,
    resizeY: true,
    minWidth: scene === 'print' ? 2 : 20,
    minHeight: scene === 'print' ? 2 : 20
  }
}

function onTransformEnd(event: ElementTransformEvent): void {
  const operationName = event.operation === 'move' ? '移动' : event.operation === 'resize' ? '调整尺寸' : '键盘移动'
  lastAction.value = `${operationName} ${event.items.length} 个元素`
}

function onElementHover(event: DesignerElementHoverEvent): void {
  lastAction.value = event.hovered ? `悬浮 ${String(event.element.title ?? event.element.id)}` : '离开元素'
}

function deleteElements(ids: string[]): void {
  if (!ids.length) return
  elements.value = elements.value.filter((element) => !ids.includes(element.id) || element.locked)
  selectedIds.value = []
  lastAction.value = '删除元素'
}

function updateGeometry(key: GeometryKey, value: number | null | undefined): void {
  if (!selectedElement.value || value == null) return
  if (!Number.isFinite(value)) return
  elements.value = elements.value.map((element) =>
    element.id === selectedElement.value?.id ? { ...element, [key]: unit.normalize(value) } : element
  )
  lastAction.value = '修改几何属性'
}

function clearGuides(): void {
  guides.value = guides.value.filter((guide) => guide.locked)
  lastAction.value = '清除辅助线'
}

function printBoundaryStyle(position: number): Record<string, string> {
  const top = canvasRef.value?.worldLengthToStage(position) ?? position
  return { top: `${top}px` }
}
</script>
