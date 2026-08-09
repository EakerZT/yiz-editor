<template>
  <div
    ref="rootRef"
    class="designer-canvas"
    :class="{
      'designer-canvas--panning': operation?.type === 'pan',
      'designer-canvas--creating-guide-pair': operation?.type === 'guide-pair-create',
      'designer-canvas--space': spacePressed,
      'designer-canvas--disabled': disabled
    }"
    :style="{ '--yiz-editor-designer-ruler-size': `${rulerSize}px` }"
    tabindex="0"
    @keydown="onKeydown"
    @keyup="onKeyup"
  >
    <div class="designer-canvas__corner" @pointerdown="startGuidePairCreate">
      <slot name="corner">
        <span>{{ unit.symbol }}</span>
      </slot>
    </div>

    <DesignerRuler
      v-if="ruler"
      class="designer-canvas__ruler-horizontal"
      orientation="horizontal"
      :length="surfaceSize.width"
      :thickness="rulerSize"
      :offset="currentTransform.offsetX"
      :zoom="currentTransform.zoom"
      :unit="unit"
      @pointerdown="startGuideCreate($event, 'y')"
    />
    <div v-else class="designer-canvas__ruler-horizontal" />

    <DesignerRuler
      v-if="ruler"
      class="designer-canvas__ruler-vertical"
      orientation="vertical"
      :length="surfaceSize.height"
      :thickness="rulerSize"
      :offset="currentTransform.offsetY"
      :zoom="currentTransform.zoom"
      :unit="unit"
      @pointerdown="startGuideCreate($event, 'x')"
    />
    <div v-else class="designer-canvas__ruler-vertical" />

    <div
      ref="surfaceRef"
      class="designer-canvas__surface"
      :style="{ cursor: surfaceCursor }"
      @pointerdown="onSurfacePointerdown"
      @wheel="onWheel"
    >
      <div class="designer-canvas__stage-shadow" :style="stageStyle" />
      <div class="designer-canvas__stage" :style="stageStyle">
        <div
          v-for="element in visibleElements"
          :key="element.id"
          class="designer-canvas__element"
          :class="[
            {
              'designer-canvas__element--selected': selectedIds.includes(element.id),
              'designer-canvas__element--hovered': localHoveredId === element.id,
              'designer-canvas__element--locked': element.locked
            },
            localHoveredId === element.id ? hoverClass : undefined
          ]"
          :data-element-id="element.id"
          :style="elementStageStyle(element)"
          @pointerdown.stop="onElementPointerdown($event, element)"
          @pointerenter="onElementPointerenter($event, element)"
          @pointerleave="onElementPointerleave($event, element)"
        >
          <div class="designer-canvas__element-content">
            <slot
              name="element"
              :element="element"
              :selected="selectedIds.includes(element.id)"
              :hovered="localHoveredId === element.id"
              :is-hover="localHoveredId === element.id"
              :zoom="currentTransform.zoom"
            />
          </div>
        </div>

        <div class="designer-canvas__world-overlay">
          <slot name="overlay" :transform="currentTransform" :coordinate="coordinateApi" />
        </div>
      </div>

      <template v-if="guidesVisible">
        <div
          v-for="guide in visibleGuides"
          :key="guide.id"
          class="designer-canvas__guide"
          :class="[
            `designer-canvas__guide--${guide.axis}`,
            {
              'designer-canvas__guide--active': isGuideActive(guide.id),
              'designer-canvas__guide--locked': guidesLocked || guide.locked
            }
          ]"
          :data-guide-id="guide.id"
          :style="guideStyle(guide)"
          @pointerdown.stop="startGuideMove($event, guide)"
          @dblclick.stop="removeGuide(guide)"
        >
          <span v-if="isGuideActive(guide.id)" class="designer-canvas__guide-label">
            {{ unit.format(guide.position) }}{{ unit.symbol }}
          </span>
        </div>
      </template>

      <div
        v-for="(line, index) in activeSnapLines"
        :key="`${line.axis}-${line.position}-${index}`"
        class="designer-canvas__snap-line"
        :class="`designer-canvas__snap-line--${line.axis}`"
        :data-snap-source="line.source"
        :style="snapLineStyle(line)"
      >
        <span>{{ snapLineLabel(line) }}</span>
      </div>

      <div class="designer-canvas__selection-layer">
        <div
          v-if="hoverBox && hoverStyleMode !== 'none'"
          class="designer-canvas__hover-box"
          :class="`designer-canvas__hover-box--${hoverStyleMode}`"
          :style="hoverBox.style"
          :data-hover-id="hoverBox.id"
        >
          <span v-if="hoverStyleMode === 'outline'">{{ hoverBoxLabel }}</span>
        </div>

        <div
          v-for="box in selectionBoxes"
          :key="box.id"
          class="designer-canvas__selection-box"
          :class="{ 'designer-canvas__selection-box--member': selectionBoxes.length > 1 }"
          :data-selection-id="box.id"
          :style="box.style"
        />

        <div
          v-if="multiSelectionBox"
          class="designer-canvas__multi-selection-box"
          :style="multiSelectionBox.style"
          data-multi-selection-box
        >
          <span>{{ selectedIds.length }} 个元素</span>
        </div>

        <template v-if="singleSelectionBox && singleSelectionCapabilities">
          <button
            v-for="handle in resizeHandles"
            v-show="isHandleEnabled(handle, singleSelectionCapabilities)"
            :key="handle"
            type="button"
            class="designer-canvas__resize-handle"
            :class="`designer-canvas__resize-handle--${handle}`"
            :data-resize-handle="handle"
            :style="resizeHandleStyle(handle, singleSelectionBox.rect)"
            :aria-label="`resize ${handle}`"
            @pointerdown.stop="startResize($event, handle)"
          />
        </template>

        <div
          v-if="marqueeRect"
          class="designer-canvas__marquee"
          :class="`designer-canvas__marquee--${marqueeMode}`"
          :style="marqueeStyle"
          :data-marquee-mode="marqueeMode"
        >
          <span>{{ marqueeMode === 'contain' ? '包含选择' : '相交选择' }}</span>
        </div>
      </div>

      <div class="designer-canvas__viewport-overlay">
        <slot name="viewport-overlay" :transform="currentTransform" :coordinate="coordinateApi" />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import DesignerRuler from './DesignerRuler.vue'
import { snapMoveRect, snapResizeRect } from './snap-engine'
import { DEFAULT_TRANSFORM, TransformEngine } from './transform-engine'
import type {
  DesignerCanvasExpose,
  DesignerCoordinateApi,
  DesignerElementBase,
  DesignerElementCapabilities,
  DesignerElementHoverEvent,
  DesignerHoverStyleMode,
  DesignerGuide,
  DesignerPoint,
  DesignerRect,
  DesignerSize,
  DesignerSnapCandidate,
  DesignerSnapLine,
  DesignerTransform,
  ElementTransformContext,
  ElementTransformEvent,
  ResizeHandle,
  DesignerUnit
} from './types'

const props = withDefaults(
  defineProps<{
    elements: DesignerElementBase[]
    selectedIds?: string[]
    hoveredId?: string
    hoverClass?: string
    hoverStyleMode?: DesignerHoverStyleMode
    worldSize: DesignerSize
    unit: DesignerUnit
    transform?: DesignerTransform
    guides?: DesignerGuide[]
    minZoom?: number
    maxZoom?: number
    zoomStep?: number
    ruler?: boolean
    rulerSize?: number
    guidesVisible?: boolean
    guidesLocked?: boolean
    wheelZoom?: 'ctrl' | 'always' | 'disabled'
    panWithSpace?: boolean
    autoFit?: boolean
    constrainToWorld?: boolean
    disabled?: boolean
    snap?: boolean
    snapThreshold?: number
    snapGridSize?: number
    snapToWorld?: boolean
    snapToGuides?: boolean
    snapToElements?: boolean
    getCapabilities?: (element: DesignerElementBase) => DesignerElementCapabilities
    constrainTransform?: (context: ElementTransformContext) => DesignerRect
  }>(),
  {
    selectedIds: () => [],
    hoveredId: undefined,
    hoverClass: '',
    hoverStyleMode: 'none',
    transform: () => ({ ...DEFAULT_TRANSFORM }),
    guides: () => [],
    minZoom: 0.1,
    maxZoom: 4,
    zoomStep: 0.1,
    ruler: true,
    rulerSize: 28,
    guidesVisible: true,
    guidesLocked: false,
    wheelZoom: 'ctrl',
    panWithSpace: true,
    autoFit: true,
    constrainToWorld: true,
    disabled: false,
    snap: true,
    snapThreshold: 6,
    snapGridSize: 0,
    snapToWorld: true,
    snapToGuides: true,
    snapToElements: true,
    getCapabilities: undefined,
    constrainTransform: undefined
  }
)

const emit = defineEmits<{
  'update:elements': [elements: DesignerElementBase[]]
  'update:selectedIds': [ids: string[]]
  'update:hoveredId': [id: string | undefined]
  'update:transform': [transform: DesignerTransform]
  'update:guides': [guides: DesignerGuide[]]
  'transform-start': [event: ElementTransformEvent]
  'transform-change': [event: ElementTransformEvent]
  'transform-end': [event: ElementTransformEvent]
  'guide-create': [guide: DesignerGuide]
  'guide-change': [guide: DesignerGuide]
  'guide-remove': [guide: DesignerGuide]
  'delete-request': [ids: string[]]
  'element-hover': [event: DesignerElementHoverEvent]
}>()

type RectMap = Record<string, DesignerRect>

type Operation =
  | { type: 'pan'; pointerId: number; start: DesignerPoint; origin: DesignerPoint }
  | { type: 'move'; pointerId: number; startWorld: DesignerPoint; ids: string[]; originals: RectMap }
  | {
      type: 'resize'
      pointerId: number
      startWorld: DesignerPoint
      id: string
      handle: ResizeHandle
      originals: RectMap
    }
  | { type: 'marquee'; pointerId: number; start: DesignerPoint; current: DesignerPoint; additiveIds: string[] }
  | { type: 'guide-create'; pointerId: number; guideId: string }
  | { type: 'guide-pair-create'; pointerId: number; guideIds: { x: string; y: string } }
  | { type: 'guide-move'; pointerId: number; guideId: string; original: DesignerGuide }

const resizeHandles: ResizeHandle[] = ['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w']
const rootRef = ref<HTMLElement>()
const surfaceRef = ref<HTMLElement>()
const surfaceSize = ref<DesignerSize>({ width: 0, height: 0 })
const currentTransform = ref<DesignerTransform>({ ...props.transform })
const draftElements = ref<DesignerElementBase[]>(props.elements.map((element) => ({ ...element })))
const draftGuides = ref<DesignerGuide[]>(props.guides.map((guide) => ({ ...guide })))
const operation = ref<Operation | null>(null)
const spacePressed = ref(false)
const activeGuideId = ref<string>()
const localHoveredId = ref<string | undefined>(props.hoveredId)
const activeSnapLines = ref<DesignerSnapLine[]>([])
const marqueeRect = ref<DesignerRect>()
const marqueeMode = ref<'contain' | 'intersect'>('contain')
let resizeObserver: ResizeObserver | undefined

const engine = computed(() => new TransformEngine(props.unit, currentTransform.value))
const visibleElements = computed(() => draftElements.value.filter((element) => !element.hidden))
const visibleGuides = computed(() => draftGuides.value.filter((guide) => guide.visible !== false))

const coordinateApi: DesignerCoordinateApi = {
  viewportToWorld: (point) => engine.value.viewportToWorld(point),
  worldToViewport: (point) => engine.value.worldToViewport(point),
  viewportDeltaToWorld: (delta) => engine.value.viewportDeltaToWorld(delta),
  worldToStage: (point) => engine.value.worldToStage(point),
  stageToWorld: (point) => engine.value.stageToWorld(point),
  worldLengthToStage: (value) => engine.value.worldLengthToStage(value),
  stageLengthToWorld: (value) => engine.value.stageLengthToWorld(value)
}

const stageStyle = computed(() => ({
  width: `${engine.value.worldLengthToStage(props.worldSize.width)}px`,
  height: `${engine.value.worldLengthToStage(props.worldSize.height)}px`,
  transform: `translate(${currentTransform.value.offsetX}px, ${currentTransform.value.offsetY}px) scale(${currentTransform.value.zoom})`
}))

const surfaceCursor = computed(() => {
  if (operation.value?.type === 'pan') return 'grabbing'
  if (spacePressed.value) return 'grab'
  if (operation.value?.type === 'marquee') return 'crosshair'
  return 'default'
})

function cloneRect(element: DesignerElementBase): DesignerRect {
  return {
    left: element.left,
    top: element.top,
    width: element.width,
    height: element.height,
    x: element.left,
    y: element.top
  }
}

function normalizeRect(rect: DesignerRect): DesignerRect {
  const left = props.unit.normalize(rect.left)
  const top = props.unit.normalize(rect.top)
  return {
    x: left,
    y: top,
    left,
    top,
    width: props.unit.normalize(rect.width),
    height: props.unit.normalize(rect.height)
  }
}

function pointFromEvent(event: PointerEvent | WheelEvent): DesignerPoint {
  const rect = surfaceRef.value?.getBoundingClientRect()
  return {
    x: event.clientX - (rect?.left ?? 0),
    y: event.clientY - (rect?.top ?? 0)
  }
}

function elementStageStyle(element: DesignerElementBase): Record<string, string> {
  return {
    left: `${engine.value.worldLengthToStage(element.left)}px`,
    top: `${engine.value.worldLengthToStage(element.top)}px`,
    width: `${engine.value.worldLengthToStage(element.width)}px`,
    height: `${engine.value.worldLengthToStage(element.height)}px`
  }
}

function elementViewportRect(element: DesignerElementBase): DesignerRect {
  const topLeft = engine.value.worldToViewport({ x: element.left, y: element.top })
  const bottomRight = engine.value.worldToViewport({ x: element.left + element.width, y: element.top + element.height })
  return {
    x: topLeft.x,
    y: topLeft.y,
    left: topLeft.x,
    top: topLeft.y,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y
  }
}

function getCapabilities(element: DesignerElementBase): Required<DesignerElementCapabilities> {
  const custom = props.getCapabilities?.(element) ?? {}
  const locked = Boolean(element.locked)
  return {
    selectable: custom.selectable ?? true,
    movable: locked ? false : (custom.movable ?? true),
    resizeX: locked ? false : (custom.resizeX ?? true),
    resizeY: locked ? false : (custom.resizeY ?? true),
    minWidth: custom.minWidth ?? props.unit.nudgeStep,
    minHeight: custom.minHeight ?? props.unit.nudgeStep
  }
}

function emitSelection(ids: string[]): void {
  activeGuideId.value = undefined
  emit('update:selectedIds', [...new Set(ids)])
}

function emitTransformModel(transform: DesignerTransform): void {
  currentTransform.value = transform
  emit('update:transform', { ...transform })
}

function applyRectConstraint(
  element: DesignerElementBase,
  proposed: DesignerRect,
  original: DesignerRect,
  operationType: 'move' | 'resize' | 'keyboard',
  handle?: ResizeHandle
): DesignerRect {
  const capabilities = getCapabilities(element)
  let next = { ...proposed }
  next.width = Math.max(capabilities.minWidth, next.width)
  next.height = Math.max(capabilities.minHeight, next.height)

  if (props.constrainTransform) {
    next = props.constrainTransform({
      element,
      operation: operationType,
      handle,
      original,
      proposed: next,
      worldSize: props.worldSize
    })
  }

  if (props.constrainToWorld) {
    next.width = Math.min(next.width, props.worldSize.width)
    next.height = Math.min(next.height, props.worldSize.height)
    next.left = Math.min(Math.max(next.left, 0), props.worldSize.width - next.width)
    next.top = Math.min(Math.max(next.top, 0), props.worldSize.height - next.height)
  }
  next.x = next.left
  next.y = next.top
  return next
}

function buildTransformEvent(
  type: 'move' | 'resize' | 'keyboard',
  originals: RectMap,
  elements = draftElements.value
): ElementTransformEvent {
  return {
    operation: type,
    items: Object.entries(originals).flatMap(([id, before]) => {
      const element = elements.find((candidate) => candidate.id === id)
      return element ? [{ element, before, current: cloneRect(element) }] : []
    })
  }
}

function updateElementRects(
  rects: Record<string, DesignerRect>,
  type: 'move' | 'resize' | 'keyboard',
  originals: RectMap,
  normalize = false
): void {
  const next = draftElements.value.map((element) => {
    const rect = rects[element.id]
    if (!rect) return element
    const value = normalize ? normalizeRect(rect) : rect
    return {
      ...element,
      left: value.left,
      top: value.top,
      width: value.width,
      height: value.height
    }
  })
  draftElements.value = next
  emit(
    'update:elements',
    next.map((element) => ({ ...element }))
  )
  emit('transform-change', buildTransformEvent(type, originals, next))
}

function bindOperationListeners(): void {
  window.addEventListener('pointermove', onWindowPointermove)
  window.addEventListener('pointerup', onWindowPointerup)
  window.addEventListener('pointercancel', onWindowPointerup)
}

function unbindOperationListeners(): void {
  window.removeEventListener('pointermove', onWindowPointermove)
  window.removeEventListener('pointerup', onWindowPointerup)
  window.removeEventListener('pointercancel', onWindowPointerup)
}

function beginOperation(next: Operation): void {
  operation.value = next
  bindOperationListeners()
}

function startPan(event: PointerEvent): void {
  rootRef.value?.focus({ preventScroll: true })
  const point = pointFromEvent(event)
  beginOperation({
    type: 'pan',
    pointerId: event.pointerId,
    start: point,
    origin: { x: currentTransform.value.offsetX, y: currentTransform.value.offsetY }
  })
  event.preventDefault()
}

function shouldStartPan(event: PointerEvent): boolean {
  return event.button === 1 || (event.button === 0 && props.panWithSpace && spacePressed.value)
}

function onElementPointerdown(event: PointerEvent, element: DesignerElementBase): void {
  if (props.disabled) return
  if (shouldStartPan(event)) {
    startPan(event)
    return
  }
  if (event.button !== 0) return
  rootRef.value?.focus({ preventScroll: true })
  const capabilities = getCapabilities(element)
  if (!capabilities.selectable) return

  let ids = props.selectedIds
  if (event.shiftKey) {
    ids = ids.includes(element.id) ? ids.filter((id) => id !== element.id) : [...ids, element.id]
  } else if (!ids.includes(element.id)) {
    ids = [element.id]
  }
  emitSelection(ids)
  if (!ids.includes(element.id) || !capabilities.movable) return

  const movableIds = ids.filter((id) => {
    const candidate = draftElements.value.find((item) => item.id === id)
    return candidate ? getCapabilities(candidate).movable : false
  })
  const originals = Object.fromEntries(
    draftElements.value
      .filter((candidate) => movableIds.includes(candidate.id))
      .map((candidate) => [candidate.id, cloneRect(candidate)])
  )
  if (!Object.keys(originals).length) return
  const nextOperation: Operation = {
    type: 'move',
    pointerId: event.pointerId,
    startWorld: engine.value.viewportToWorld(pointFromEvent(event)),
    ids: movableIds,
    originals
  }
  emit('transform-start', buildTransformEvent('move', originals))
  beginOperation(nextOperation)
  event.preventDefault()
}

function setHoveredElement(element: DesignerElementBase | undefined, hovered: boolean, event: PointerEvent): void {
  const nextId = hovered ? element?.id : undefined
  if (!hovered && element && localHoveredId.value !== element.id) return
  localHoveredId.value = nextId
  emit('update:hoveredId', nextId)
  if (element) emit('element-hover', { element, hovered, originalEvent: event })
}

function onElementPointerenter(event: PointerEvent, element: DesignerElementBase): void {
  setHoveredElement(element, true, event)
}

function onElementPointerleave(event: PointerEvent, element: DesignerElementBase): void {
  setHoveredElement(element, false, event)
}

function onSurfacePointerdown(event: PointerEvent): void {
  if (props.disabled) return
  rootRef.value?.focus({ preventScroll: true })
  if (shouldStartPan(event)) {
    startPan(event)
    return
  }
  if (event.button !== 0) return
  const point = pointFromEvent(event)
  activeGuideId.value = undefined
  beginOperation({
    type: 'marquee',
    pointerId: event.pointerId,
    start: point,
    current: point,
    additiveIds: event.shiftKey ? [...props.selectedIds] : []
  })
  marqueeRect.value = { x: point.x, y: point.y, left: point.x, top: point.y, width: 0, height: 0 }
  marqueeMode.value = 'contain'
  if (!event.shiftKey) emitSelection([])
  event.preventDefault()
}

function startResize(event: PointerEvent, handle: ResizeHandle): void {
  if (props.disabled) return
  if (shouldStartPan(event)) {
    startPan(event)
    return
  }
  if (event.button !== 0 || !singleSelectionElement.value) return
  const element = singleSelectionElement.value
  const capabilities = getCapabilities(element)
  if (!isHandleEnabled(handle, capabilities)) return
  const originals = { [element.id]: cloneRect(element) }
  emit('transform-start', buildTransformEvent('resize', originals))
  beginOperation({
    type: 'resize',
    pointerId: event.pointerId,
    startWorld: engine.value.viewportToWorld(pointFromEvent(event)),
    id: element.id,
    handle,
    originals
  })
  event.preventDefault()
}

function resizeRect(
  element: DesignerElementBase,
  original: DesignerRect,
  handle: ResizeHandle,
  delta: DesignerPoint,
  keepAspectRatio = false
): DesignerRect {
  const capabilities = getCapabilities(element)
  if (keepAspectRatio && capabilities.resizeX && capabilities.resizeY && original.width > 0 && original.height > 0) {
    return resizeRectWithAspectRatio(original, handle, delta, capabilities)
  }
  let { left, top, width, height } = original
  if (capabilities.resizeX) {
    if (handle.includes('w')) {
      left += delta.x
      width -= delta.x
    } else if (handle.includes('e')) {
      width += delta.x
    }
  }
  if (capabilities.resizeY) {
    if (handle.includes('n')) {
      top += delta.y
      height -= delta.y
    } else if (handle.includes('s')) {
      height += delta.y
    }
  }

  if (width < capabilities.minWidth) {
    if (handle.includes('w')) left -= capabilities.minWidth - width
    width = capabilities.minWidth
  }
  if (height < capabilities.minHeight) {
    if (handle.includes('n')) top -= capabilities.minHeight - height
    height = capabilities.minHeight
  }
  return { x: left, y: top, left, top, width, height }
}

function resizeRectWithAspectRatio(
  original: DesignerRect,
  handle: ResizeHandle,
  delta: DesignerPoint,
  capabilities: Required<DesignerElementCapabilities>
): DesignerRect {
  const ratio = original.width / original.height
  const hasX = handle.includes('e') || handle.includes('w')
  const hasY = handle.includes('n') || handle.includes('s')
  const centerX = original.left + original.width / 2
  const centerY = original.top + original.height / 2
  let width = original.width
  let height = original.height

  if (hasX && hasY) {
    const rawWidth = Math.max(capabilities.minWidth, original.width + (handle.includes('e') ? delta.x : -delta.x))
    const rawHeight = Math.max(capabilities.minHeight, original.height + (handle.includes('s') ? delta.y : -delta.y))
    const widthChange = Math.abs(rawWidth / original.width - 1)
    const heightChange = Math.abs(rawHeight / original.height - 1)
    if (widthChange >= heightChange) {
      width = rawWidth
      height = Math.max(capabilities.minHeight, width / ratio)
      width = height * ratio
    } else {
      height = rawHeight
      width = Math.max(capabilities.minWidth, height * ratio)
      height = width / ratio
    }
  } else if (hasX) {
    width = Math.max(capabilities.minWidth, original.width + (handle.includes('e') ? delta.x : -delta.x))
    height = Math.max(capabilities.minHeight, width / ratio)
    width = height * ratio
  } else if (hasY) {
    height = Math.max(capabilities.minHeight, original.height + (handle.includes('s') ? delta.y : -delta.y))
    width = Math.max(capabilities.minWidth, height * ratio)
    height = width / ratio
  }

  const left = handle.includes('w')
    ? original.left + original.width - width
    : handle.includes('e')
      ? original.left
      : centerX - width / 2
  const top = handle.includes('n')
    ? original.top + original.height - height
    : handle.includes('s')
      ? original.top
      : centerY - height / 2
  return { x: left, y: top, left, top, width, height }
}

function reapplyAspectRatioAfterSnap(
  rect: DesignerRect,
  original: DesignerRect,
  handle: ResizeHandle,
  driverAxis: 'x' | 'y'
): DesignerRect {
  const ratio = original.width / original.height
  const centerX = original.left + original.width / 2
  const centerY = original.top + original.height / 2
  let width = rect.width
  let height = rect.height
  if (driverAxis === 'x') height = width / ratio
  else width = height * ratio

  const left = handle.includes('w')
    ? original.left + original.width - width
    : handle.includes('e')
      ? original.left
      : centerX - width / 2
  const top = handle.includes('n')
    ? original.top + original.height - height
    : handle.includes('s')
      ? original.top
      : centerY - height / 2
  return { x: left, y: top, left, top, width, height }
}

function getSnapCandidates(excludedIds: string[]): DesignerSnapCandidate[] {
  const candidates: DesignerSnapCandidate[] = []
  if (props.snapToWorld) {
    candidates.push(
      { axis: 'x', position: 0, source: 'world' },
      { axis: 'x', position: props.worldSize.width / 2, source: 'world' },
      { axis: 'x', position: props.worldSize.width, source: 'world' },
      { axis: 'y', position: 0, source: 'world' },
      { axis: 'y', position: props.worldSize.height / 2, source: 'world' },
      { axis: 'y', position: props.worldSize.height, source: 'world' }
    )
  }
  if (props.snapToGuides) {
    for (const guide of visibleGuides.value) {
      candidates.push({ axis: guide.axis, position: guide.position, source: 'guide', sourceId: guide.id })
    }
  }
  if (props.snapToElements) {
    for (const element of visibleElements.value) {
      if (excludedIds.includes(element.id)) continue
      candidates.push(
        { axis: 'x', position: element.left, source: 'element', sourceId: element.id },
        { axis: 'x', position: element.left + element.width / 2, source: 'element', sourceId: element.id },
        { axis: 'x', position: element.left + element.width, source: 'element', sourceId: element.id },
        { axis: 'y', position: element.top, source: 'element', sourceId: element.id },
        { axis: 'y', position: element.top + element.height / 2, source: 'element', sourceId: element.id },
        { axis: 'y', position: element.top + element.height, source: 'element', sourceId: element.id }
      )
    }
  }
  return candidates
}

function getBoundingRect(rects: RectMap): DesignerRect {
  const values = Object.values(rects)
  const left = Math.min(...values.map((rect) => rect.left))
  const top = Math.min(...values.map((rect) => rect.top))
  const right = Math.max(...values.map((rect) => rect.left + rect.width))
  const bottom = Math.max(...values.map((rect) => rect.top + rect.height))
  return { x: left, y: top, left, top, width: right - left, height: bottom - top }
}

function snapThresholdInWorld(): number {
  return props.snapThreshold / currentTransform.value.zoom / props.unit.pixelsPerUnit
}

function lineStillAligned(line: DesignerSnapLine, rect: DesignerRect, handle: ResizeHandle): boolean {
  const edge =
    line.axis === 'x'
      ? handle.includes('w')
        ? rect.left
        : rect.left + rect.width
      : handle.includes('n')
        ? rect.top
        : rect.top + rect.height
  return Math.abs(edge - line.position) < 1e-6
}

function createGuideId(axis: 'x' | 'y'): string {
  return `guide-${Date.now()}-${axis}-${Math.random().toString(36).slice(2, 7)}`
}

function isGuideActive(guideId: string): boolean {
  const current = operation.value
  return (
    activeGuideId.value === guideId ||
    (current?.type === 'guide-pair-create' && (current.guideIds.x === guideId || current.guideIds.y === guideId))
  )
}

function startGuidePairCreate(event: PointerEvent): void {
  if (props.disabled) return
  if (shouldStartPan(event)) {
    startPan(event)
    return
  }
  if (!props.ruler) return
  if (event.button !== 0 || props.guidesLocked) return
  rootRef.value?.focus({ preventScroll: true })
  const world = engine.value.viewportToWorld(pointFromEvent(event))
  const xGuide: DesignerGuide = {
    id: createGuideId('x'),
    axis: 'x',
    position: world.x
  }
  const yGuide: DesignerGuide = {
    id: createGuideId('y'),
    axis: 'y',
    position: world.y
  }
  draftGuides.value = [...draftGuides.value, xGuide, yGuide]
  activeGuideId.value = undefined
  emit(
    'update:guides',
    draftGuides.value.map((guide) => ({ ...guide }))
  )
  beginOperation({
    type: 'guide-pair-create',
    pointerId: event.pointerId,
    guideIds: { x: xGuide.id, y: yGuide.id }
  })
  event.preventDefault()
}

function startGuideCreate(event: PointerEvent, axis: 'x' | 'y'): void {
  if (props.disabled) return
  if (shouldStartPan(event)) {
    startPan(event)
    return
  }
  if (event.button !== 0 || props.guidesLocked) return
  rootRef.value?.focus({ preventScroll: true })
  const world = engine.value.viewportToWorld(pointFromEvent(event))
  const guide: DesignerGuide = {
    id: createGuideId(axis),
    axis,
    position: axis === 'x' ? world.x : world.y
  }
  draftGuides.value = [...draftGuides.value, guide]
  activeGuideId.value = guide.id
  emit(
    'update:guides',
    draftGuides.value.map((item) => ({ ...item }))
  )
  beginOperation({ type: 'guide-create', pointerId: event.pointerId, guideId: guide.id })
  event.preventDefault()
}

function startGuideMove(event: PointerEvent, guide: DesignerGuide): void {
  if (props.disabled) return
  if (shouldStartPan(event)) {
    startPan(event)
    return
  }
  if (event.button !== 0) return
  if (props.guidesLocked || guide.locked) {
    activeGuideId.value = guide.id
    return
  }
  activeGuideId.value = guide.id
  beginOperation({ type: 'guide-move', pointerId: event.pointerId, guideId: guide.id, original: { ...guide } })
  event.preventDefault()
}

function updateGuideFromEvent(guideId: string, event: PointerEvent): void {
  const world = engine.value.viewportToWorld(pointFromEvent(event))
  draftGuides.value = draftGuides.value.map((guide) =>
    guide.id === guideId ? { ...guide, position: guide.axis === 'x' ? world.x : world.y } : guide
  )
  emit(
    'update:guides',
    draftGuides.value.map((guide) => ({ ...guide }))
  )
}

function updateGuidePairFromEvent(guideIds: { x: string; y: string }, event: PointerEvent): void {
  const world = engine.value.viewportToWorld(pointFromEvent(event))
  draftGuides.value = draftGuides.value.map((guide) => {
    if (guide.id === guideIds.x) return { ...guide, position: world.x }
    if (guide.id === guideIds.y) return { ...guide, position: world.y }
    return guide
  })
  emit(
    'update:guides',
    draftGuides.value.map((guide) => ({ ...guide }))
  )
}

function removeGuide(guide: DesignerGuide): void {
  if (props.guidesLocked || guide.locked) return
  draftGuides.value = draftGuides.value.filter((candidate) => candidate.id !== guide.id)
  activeGuideId.value = undefined
  emit(
    'update:guides',
    draftGuides.value.map((candidate) => ({ ...candidate }))
  )
  emit('guide-remove', guide)
}

function onWindowPointermove(event: PointerEvent): void {
  const current = operation.value
  if (!current || event.pointerId !== current.pointerId) return
  const viewport = pointFromEvent(event)

  if (current.type === 'pan') {
    emitTransformModel({
      ...currentTransform.value,
      offsetX: current.origin.x + viewport.x - current.start.x,
      offsetY: current.origin.y + viewport.y - current.start.y
    })
    return
  }

  if (current.type === 'move') {
    const world = engine.value.viewportToWorld(viewport)
    const delta = { x: world.x - current.startWorld.x, y: world.y - current.startWorld.y }
    const groupOriginal = getBoundingRect(current.originals)
    let snappedDelta = delta
    if (props.snap) {
      const groupProposed = {
        ...groupOriginal,
        x: groupOriginal.left + delta.x,
        y: groupOriginal.top + delta.y,
        left: groupOriginal.left + delta.x,
        top: groupOriginal.top + delta.y
      }
      const snapResult = snapMoveRect(
        groupProposed,
        getSnapCandidates(current.ids),
        snapThresholdInWorld(),
        props.snapGridSize
      )
      snappedDelta = {
        x: snapResult.rect.left - groupOriginal.left,
        y: snapResult.rect.top - groupOriginal.top
      }
      activeSnapLines.value = snapResult.lines
    } else {
      activeSnapLines.value = []
    }
    const rects = Object.fromEntries(
      current.ids.map((id) => {
        const element = draftElements.value.find((candidate) => candidate.id === id)!
        const original = current.originals[id]
        const proposed = {
          ...original,
          x: original.left + snappedDelta.x,
          y: original.top + snappedDelta.y,
          left: original.left + snappedDelta.x,
          top: original.top + snappedDelta.y
        }
        return [id, applyRectConstraint(element, proposed, original, 'move')]
      })
    )
    updateElementRects(rects, 'move', current.originals)
    return
  }

  if (current.type === 'resize') {
    const element = draftElements.value.find((candidate) => candidate.id === current.id)
    if (!element) return
    const world = engine.value.viewportToWorld(viewport)
    const delta = { x: world.x - current.startWorld.x, y: world.y - current.startWorld.y }
    const original = current.originals[current.id]
    const keepAspectRatio = event.shiftKey
    let proposed = resizeRect(element, original, current.handle, delta, keepAspectRatio)
    if (props.snap) {
      const snapResult = snapResizeRect(
        proposed,
        current.handle,
        getSnapCandidates([current.id]),
        snapThresholdInWorld(),
        props.snapGridSize
      )
      proposed = snapResult.rect
      if (keepAspectRatio && original.width > 0 && original.height > 0 && snapResult.lines.length) {
        const driverAxis = snapResult.lines.some((line) => line.axis === 'x') ? 'x' : 'y'
        proposed = reapplyAspectRatioAfterSnap(proposed, original, current.handle, driverAxis)
        activeSnapLines.value = snapResult.lines.filter((line) => lineStillAligned(line, proposed, current.handle))
      } else {
        activeSnapLines.value = snapResult.lines
      }
    } else {
      activeSnapLines.value = []
    }
    updateElementRects(
      { [current.id]: applyRectConstraint(element, proposed, original, 'resize', current.handle) },
      'resize',
      current.originals
    )
    return
  }

  if (current.type === 'marquee') {
    current.current = viewport
    marqueeMode.value = viewport.x >= current.start.x ? 'contain' : 'intersect'
    const left = Math.min(current.start.x, viewport.x)
    const top = Math.min(current.start.y, viewport.y)
    marqueeRect.value = {
      x: left,
      y: top,
      left,
      top,
      width: Math.abs(viewport.x - current.start.x),
      height: Math.abs(viewport.y - current.start.y)
    }
    return
  }

  if (current.type === 'guide-pair-create') {
    updateGuidePairFromEvent(current.guideIds, event)
    return
  }

  updateGuideFromEvent(current.guideId, event)
}

function finishElementTransform(current: Extract<Operation, { type: 'move' | 'resize' }>): void {
  const type = current.type
  const rects = Object.fromEntries(
    Object.keys(current.originals).flatMap((id) => {
      const element = draftElements.value.find((candidate) => candidate.id === id)
      return element ? [[id, normalizeRect(cloneRect(element))]] : []
    })
  )
  updateElementRects(rects, type, current.originals, true)
  emit('transform-end', buildTransformEvent(type, current.originals))
}

function finishMarquee(current: Extract<Operation, { type: 'marquee' }>): void {
  const box = marqueeRect.value
  if (!box || (box.width < 3 && box.height < 3)) {
    marqueeRect.value = undefined
    return
  }
  const mode = current.current.x >= current.start.x ? 'contain' : 'intersect'
  const matching = visibleElements.value
    .filter((element) => {
      const rect = elementViewportRect(element)
      if (!getCapabilities(element).selectable) return false
      if (mode === 'contain') {
        return (
          rect.left >= box.left &&
          rect.left + rect.width <= box.left + box.width &&
          rect.top >= box.top &&
          rect.top + rect.height <= box.top + box.height
        )
      }
      return (
        rect.left < box.left + box.width &&
        rect.left + rect.width > box.left &&
        rect.top < box.top + box.height &&
        rect.top + rect.height > box.top
      )
    })
    .map((element) => element.id)
  emitSelection([...current.additiveIds, ...matching])
  marqueeRect.value = undefined
}

function finishGuide(current: Extract<Operation, { type: 'guide-create' | 'guide-move' }>): void {
  const guide = draftGuides.value.find((candidate) => candidate.id === current.guideId)
  if (!guide) return
  const limit = guide.axis === 'x' ? props.worldSize.width : props.worldSize.height
  if (guide.position < 0 || guide.position > limit) {
    removeGuide(guide)
    return
  }
  const normalized = { ...guide, position: props.unit.normalize(guide.position) }
  draftGuides.value = draftGuides.value.map((candidate) => (candidate.id === guide.id ? normalized : candidate))
  emit(
    'update:guides',
    draftGuides.value.map((candidate) => ({ ...candidate }))
  )
  if (current.type === 'guide-create') emit('guide-create', normalized)
  else emit('guide-change', normalized)
}

function finishGuidePair(current: Extract<Operation, { type: 'guide-pair-create' }>): void {
  const guideIds = [current.guideIds.x, current.guideIds.y]
  const guides = guideIds.flatMap((id) => {
    const guide = draftGuides.value.find((candidate) => candidate.id === id)
    return guide ? [guide] : []
  })
  if (guides.length !== 2) return

  const valid = guides.every((guide) => {
    const limit = guide.axis === 'x' ? props.worldSize.width : props.worldSize.height
    return guide.position >= 0 && guide.position <= limit
  })
  if (!valid) {
    draftGuides.value = draftGuides.value.filter((guide) => !guideIds.includes(guide.id))
    emit(
      'update:guides',
      draftGuides.value.map((guide) => ({ ...guide }))
    )
    return
  }

  const normalized = guides.map((guide) => ({
    ...guide,
    position: props.unit.normalize(guide.position)
  }))
  const normalizedById = new Map(normalized.map((guide) => [guide.id, guide]))
  draftGuides.value = draftGuides.value.map((guide) => normalizedById.get(guide.id) ?? guide)
  emit(
    'update:guides',
    draftGuides.value.map((guide) => ({ ...guide }))
  )
  normalized.forEach((guide) => emit('guide-create', guide))
}

function onWindowPointerup(event: PointerEvent): void {
  const current = operation.value
  if (!current || event.pointerId !== current.pointerId) return
  if (current.type === 'move' || current.type === 'resize') finishElementTransform(current)
  else if (current.type === 'marquee') finishMarquee(current)
  else if (current.type === 'guide-create' || current.type === 'guide-move') finishGuide(current)
  else if (current.type === 'guide-pair-create') finishGuidePair(current)
  operation.value = null
  activeSnapLines.value = []
  unbindOperationListeners()
}

function clampZoom(value: number): number {
  return Math.min(props.maxZoom, Math.max(props.minZoom, value))
}

function zoomTo(zoom: number, anchor?: DesignerPoint): void {
  const nextZoom = clampZoom(zoom)
  const target = anchor ?? { x: surfaceSize.value.width / 2, y: surfaceSize.value.height / 2 }
  emitTransformModel(engine.value.zoomAt(nextZoom, target))
}

function onWheel(event: WheelEvent): void {
  const enabled = props.wheelZoom === 'always' || (props.wheelZoom === 'ctrl' && event.ctrlKey)
  if (!enabled || props.disabled) return
  event.preventDefault()
  const direction = event.deltaY > 0 ? -1 : 1
  zoomTo(currentTransform.value.zoom + direction * props.zoomStep, pointFromEvent(event))
}

function center(): void {
  emitTransformModel(engine.value.center(props.worldSize, surfaceSize.value))
}

function fit(padding = 48): void {
  if (!surfaceSize.value.width || !surfaceSize.value.height) return
  emitTransformModel(engine.value.fit(props.worldSize, surfaceSize.value, padding, props.minZoom, props.maxZoom))
}

function reset(): void {
  currentTransform.value = { ...DEFAULT_TRANSFORM }
  center()
}

function zoomIn(): void {
  zoomTo(currentTransform.value.zoom + props.zoomStep)
}

function zoomOut(): void {
  zoomTo(currentTransform.value.zoom - props.zoomStep)
}

function onKeydown(event: KeyboardEvent): void {
  const target = event.target as HTMLElement
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable) return
  if (event.code === 'Space' && props.panWithSpace) {
    spacePressed.value = true
    event.preventDefault()
    return
  }
  if ((event.key === 'Delete' || event.key === 'Backspace') && activeGuideId.value) {
    const guide = draftGuides.value.find((candidate) => candidate.id === activeGuideId.value)
    if (guide) removeGuide(guide)
    event.preventDefault()
    return
  }
  if (event.key === 'Delete' || event.key === 'Backspace') {
    if (props.selectedIds.length) emit('delete-request', [...props.selectedIds])
    event.preventDefault()
    return
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'a') {
    emitSelection(
      visibleElements.value.filter((element) => getCapabilities(element).selectable).map((element) => element.id)
    )
    event.preventDefault()
    return
  }
  const directions: Record<string, DesignerPoint> = {
    ArrowLeft: { x: -1, y: 0 },
    ArrowRight: { x: 1, y: 0 },
    ArrowUp: { x: 0, y: -1 },
    ArrowDown: { x: 0, y: 1 }
  }
  const direction = directions[event.key]
  if (!direction || !props.selectedIds.length) return
  const step = event.shiftKey ? props.unit.nudgeStepLarge : props.unit.nudgeStep
  const originals: RectMap = Object.fromEntries(
    draftElements.value
      .filter((element) => props.selectedIds.includes(element.id) && getCapabilities(element).movable)
      .map((element) => [element.id, cloneRect(element)])
  )
  if (!Object.keys(originals).length) return
  emit('transform-start', buildTransformEvent('keyboard', originals))
  const rects = Object.fromEntries(
    Object.entries(originals).map(([id, original]) => {
      const element = draftElements.value.find((candidate) => candidate.id === id)!
      const proposed = {
        ...original,
        x: original.left + direction.x * step,
        y: original.top + direction.y * step,
        left: original.left + direction.x * step,
        top: original.top + direction.y * step
      }
      return [id, normalizeRect(applyRectConstraint(element, proposed, original, 'keyboard'))]
    })
  )
  updateElementRects(rects, 'keyboard', originals, true)
  emit('transform-end', buildTransformEvent('keyboard', originals))
  event.preventDefault()
}

function onKeyup(event: KeyboardEvent): void {
  if (event.code === 'Space') spacePressed.value = false
}

function isHandleEnabled(handle: ResizeHandle, capabilities: Required<DesignerElementCapabilities>): boolean {
  const usesX = handle.includes('e') || handle.includes('w')
  const usesY = handle.includes('n') || handle.includes('s')
  return (!usesX || capabilities.resizeX) && (!usesY || capabilities.resizeY)
}

function resizeHandleStyle(handle: ResizeHandle, rect: DesignerRect): Record<string, string> {
  const x = handle.includes('w')
    ? rect.left
    : handle.includes('e')
      ? rect.left + rect.width
      : rect.left + rect.width / 2
  const y = handle.includes('n') ? rect.top : handle.includes('s') ? rect.top + rect.height : rect.top + rect.height / 2
  return { left: `${x}px`, top: `${y}px` }
}

const selectionBoxes = computed(() =>
  props.selectedIds.flatMap((id) => {
    const element = draftElements.value.find((candidate) => candidate.id === id && !candidate.hidden)
    if (!element) return []
    const rect = elementViewportRect(element)
    return [
      {
        id,
        rect,
        style: {
          left: `${rect.left}px`,
          top: `${rect.top}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`
        }
      }
    ]
  })
)

const hoverBox = computed(() => {
  if (!localHoveredId.value || operation.value) return undefined
  const element = draftElements.value.find((candidate) => candidate.id === localHoveredId.value && !candidate.hidden)
  if (!element) return undefined
  const rect = elementViewportRect(element)
  return {
    id: element.id,
    style: {
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`
    }
  }
})

const hoverBoxLabel = computed(() => {
  const element = draftElements.value.find((candidate) => candidate.id === localHoveredId.value)
  return String(element?.title ?? element?.name ?? element?.id ?? '')
})

const multiSelectionBox = computed(() => {
  if (selectionBoxes.value.length < 2) return undefined
  const left = Math.min(...selectionBoxes.value.map((box) => box.rect.left))
  const top = Math.min(...selectionBoxes.value.map((box) => box.rect.top))
  const right = Math.max(...selectionBoxes.value.map((box) => box.rect.left + box.rect.width))
  const bottom = Math.max(...selectionBoxes.value.map((box) => box.rect.top + box.rect.height))
  return {
    rect: { x: left, y: top, left, top, width: right - left, height: bottom - top },
    style: { left: `${left}px`, top: `${top}px`, width: `${right - left}px`, height: `${bottom - top}px` }
  }
})

const singleSelectionElement = computed(() =>
  props.selectedIds.length === 1
    ? draftElements.value.find((element) => element.id === props.selectedIds[0])
    : undefined
)
const singleSelectionBox = computed(() => (selectionBoxes.value.length === 1 ? selectionBoxes.value[0] : undefined))
const singleSelectionCapabilities = computed(() =>
  singleSelectionElement.value ? getCapabilities(singleSelectionElement.value) : undefined
)

const marqueeStyle = computed(() =>
  marqueeRect.value
    ? {
        left: `${marqueeRect.value.left}px`,
        top: `${marqueeRect.value.top}px`,
        width: `${marqueeRect.value.width}px`,
        height: `${marqueeRect.value.height}px`
      }
    : {}
)

function guideStyle(guide: DesignerGuide): Record<string, string> {
  const point = engine.value.worldToViewport({
    x: guide.axis === 'x' ? guide.position : 0,
    y: guide.axis === 'y' ? guide.position : 0
  })
  return guide.axis === 'x' ? { left: `${point.x}px` } : { top: `${point.y}px` }
}

function snapLineStyle(line: DesignerSnapLine): Record<string, string> {
  const point = engine.value.worldToViewport({
    x: line.axis === 'x' ? line.position : 0,
    y: line.axis === 'y' ? line.position : 0
  })
  return line.axis === 'x' ? { left: `${point.x}px` } : { top: `${point.y}px` }
}

function snapLineLabel(line: DesignerSnapLine): string {
  const sourceNames = { world: '画布', guide: '辅助线', element: '元素', grid: '网格' }
  return `${sourceNames[line.source]} · ${props.unit.format(line.position)}${props.unit.symbol}`
}

watch(
  () => props.transform,
  (value) => {
    if (value) currentTransform.value = { ...value }
  },
  { deep: true }
)

watch(
  () => props.elements,
  (value) => {
    draftElements.value = value.map((element) => ({ ...element }))
  },
  { deep: true }
)

watch(
  () => props.hoveredId,
  (value) => {
    localHoveredId.value = value
  }
)

watch(
  () => props.guides,
  (value) => {
    draftGuides.value = value.map((guide) => ({ ...guide }))
  },
  { deep: true }
)

watch([() => props.worldSize.width, () => props.worldSize.height, () => props.unit.name], () =>
  nextTick(() => props.autoFit && fit())
)

onMounted(() => {
  if (surfaceRef.value) {
    resizeObserver = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const wasEmpty = surfaceSize.value.width === 0 || surfaceSize.value.height === 0
      surfaceSize.value = { width, height }
      if (wasEmpty && props.autoFit) nextTick(() => fit())
    })
    resizeObserver.observe(surfaceRef.value)
  }
  window.addEventListener('keyup', onKeyup)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  unbindOperationListeners()
  window.removeEventListener('keyup', onKeyup)
})

defineExpose<DesignerCanvasExpose>({
  ...coordinateApi,
  zoomIn,
  zoomOut,
  zoomTo,
  center,
  fit,
  reset
})
</script>

<style lang="less" scoped>
.designer-canvas {
  --yiz-editor-designer-ruler-size: 28px;
  --yiz-editor-designer-accent: #2563eb;
  --yiz-editor-designer-guide: #f43f5e;
  --yiz-editor-designer-guide-active: #e11d48;
  --yiz-editor-designer-hover-background: rgb(14 165 233 / 12%);
  --yiz-editor-designer-hover-mask: rgb(15 23 42 / 28%);
  --yiz-editor-designer-hover-outline: #38bdf8;
  position: relative;
  display: grid;
  grid-template-columns: var(--yiz-editor-designer-ruler-size) minmax(0, 1fr);
  grid-template-rows: var(--yiz-editor-designer-ruler-size) minmax(0, 1fr);
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  outline: none;
  background: #e8edf3;
}

.designer-canvas:focus-visible {
  box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--yiz-editor-designer-accent) 42%, transparent);
}

.designer-canvas__corner {
  z-index: 8;
  display: grid;
  place-items: center;
  grid-column: 1;
  grid-row: 1;
  color: #64748b;
  font:
    14px ui-monospace,
    SFMono-Regular,
    Menlo,
    monospace;
  background: #f1f5f9;
  border-right: 1px solid #cbd5e1;
  border-bottom: 1px solid #cbd5e1;
  cursor: crosshair;
  touch-action: none;
  user-select: none;
}

.designer-canvas__ruler-horizontal {
  z-index: 7;
  grid-column: 2;
  grid-row: 1;
}

.designer-canvas__ruler-vertical {
  z-index: 7;
  grid-column: 1;
  grid-row: 2;
}

.designer-canvas__surface {
  position: relative;
  grid-column: 2;
  grid-row: 2;
  min-width: 0;
  min-height: 0;
  overflow: hidden;
  touch-action: none;
  background-color: #e8edf3;
  background-image:
    linear-gradient(45deg, rgb(255 255 255 / 22%) 25%, transparent 25%),
    linear-gradient(-45deg, rgb(255 255 255 / 22%) 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, rgb(255 255 255 / 22%) 75%),
    linear-gradient(-45deg, transparent 75%, rgb(255 255 255 / 22%) 75%);
  background-position:
    0 0,
    0 8px,
    8px -8px,
    -8px 0;
  background-size: 16px 16px;
}

.designer-canvas__stage,
.designer-canvas__stage-shadow {
  position: absolute;
  left: 0;
  top: 0;
  transform-origin: left top;
}

.designer-canvas__stage-shadow {
  z-index: 0;
  background: #fff;
  box-shadow:
    0 16px 45px rgb(15 23 42 / 18%),
    0 3px 10px rgb(15 23 42 / 12%);
  pointer-events: none;
}

.designer-canvas__stage {
  z-index: 1;
  overflow: hidden;
  background: #fff;
}

.designer-canvas__element {
  position: absolute;
  box-sizing: border-box;
  user-select: none;
  touch-action: none;
}

.designer-canvas__element--locked {
  cursor: not-allowed;
}

.designer-canvas__element:not(.designer-canvas__element--locked) {
  cursor: move;
}

.designer-canvas__element-content {
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}

.designer-canvas__world-overlay {
  position: absolute;
  inset: 0;
  z-index: 10;
  pointer-events: none;
}

.designer-canvas__guide {
  position: absolute;
  z-index: 30;
  color: var(--yiz-editor-designer-guide);
  touch-action: none;
}

.designer-canvas__guide--x {
  top: 0;
  bottom: 0;
  width: 1px;
  cursor: col-resize;
  border-left: 1px solid currentColor;
}

.designer-canvas__guide--y {
  left: 0;
  right: 0;
  height: 1px;
  cursor: row-resize;
  border-top: 1px solid currentColor;
}

.designer-canvas__guide::after {
  position: absolute;
  content: '';
}

.designer-canvas__guide--x::after {
  top: 0;
  bottom: 0;
  left: -4px;
  width: 8px;
}

.designer-canvas__guide--y::after {
  right: 0;
  bottom: -4px;
  left: 0;
  height: 8px;
}

.designer-canvas__guide--active {
  color: var(--yiz-editor-designer-guide-active);
}

.designer-canvas__guide--locked {
  cursor: not-allowed;
  opacity: 0.72;
}

.designer-canvas__guide-label {
  position: absolute;
  top: 5px;
  left: 5px;
  padding: 2px 5px;
  color: #fff;
  font:
    14px ui-monospace,
    SFMono-Regular,
    Menlo,
    monospace;
  white-space: nowrap;
  background: var(--yiz-editor-designer-guide-active);
  border-radius: 4px;
}

.designer-canvas__snap-line {
  position: absolute;
  z-index: 36;
  color: #0ea5e9;
  pointer-events: none;
}

.designer-canvas__snap-line--x {
  top: 0;
  bottom: 0;
  border-left: 1px dashed currentColor;
}

.designer-canvas__snap-line--y {
  right: 0;
  left: 0;
  border-top: 1px dashed currentColor;
}

.designer-canvas__snap-line span {
  position: absolute;
  top: 5px;
  left: 5px;
  padding: 2px 5px;
  color: #fff;
  font:
    14px ui-monospace,
    SFMono-Regular,
    Menlo,
    monospace;
  white-space: nowrap;
  background: #0284c7;
  border-radius: 4px;
}

.designer-canvas__snap-line--y span {
  top: 5px;
}

.designer-canvas__guide--y .designer-canvas__guide-label {
  top: 5px;
  left: 5px;
}

.designer-canvas__selection-layer,
.designer-canvas__viewport-overlay {
  position: absolute;
  inset: 0;
  z-index: 40;
  pointer-events: none;
}

.designer-canvas__viewport-overlay {
  z-index: 50;
}

.designer-canvas__selection-box {
  position: absolute;
  box-sizing: border-box;
  border: 1px solid var(--yiz-editor-designer-accent);
  box-shadow: 0 0 0 1px rgb(255 255 255 / 70%);
  pointer-events: none;
}

.designer-canvas__selection-box--member {
  border-style: dotted;
  opacity: 0.72;
}

.designer-canvas__hover-box,
.designer-canvas__multi-selection-box {
  position: absolute;
  box-sizing: border-box;
  pointer-events: none;
}

.designer-canvas__hover-box {
  z-index: 1;
}

.designer-canvas__hover-box--background {
  background: var(--yiz-editor-designer-hover-background);
}

.designer-canvas__hover-box--mask {
  background: var(--yiz-editor-designer-hover-mask);
}

.designer-canvas__hover-box--outline {
  border: 1px solid var(--yiz-editor-designer-hover-outline);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--yiz-editor-designer-hover-outline) 12%, transparent);
}

.designer-canvas__hover-box span,
.designer-canvas__multi-selection-box span {
  position: absolute;
  bottom: calc(100% + 4px);
  left: -1px;
  padding: 2px 5px;
  color: #fff;
  font:
    14px Inter,
    'Microsoft YaHei',
    'PingFang SC',
    sans-serif;
  white-space: nowrap;
  border-radius: 4px;
}

.designer-canvas__hover-box span {
  background: var(--yiz-editor-designer-hover-outline);
}

.designer-canvas__multi-selection-box {
  border: 1px dashed #1d4ed8;
  box-shadow: 0 0 0 1px rgb(255 255 255 / 76%);
}

.designer-canvas__multi-selection-box span {
  background: #1d4ed8;
}

.designer-canvas__resize-handle {
  position: absolute;
  z-index: 2;
  box-sizing: border-box;
  width: 9px !important;
  height: 9px !important;
  padding: 0;
  background: #fff;
  border: 2px solid var(--yiz-editor-designer-accent);
  border-radius: 2px;
  transform: translate(-50%, -50%);
  pointer-events: auto;
}

.designer-canvas__resize-handle--nw,
.designer-canvas__resize-handle--se {
  cursor: nwse-resize;
}
.designer-canvas__resize-handle--n,
.designer-canvas__resize-handle--s {
  cursor: ns-resize;
}
.designer-canvas__resize-handle--ne,
.designer-canvas__resize-handle--sw {
  cursor: nesw-resize;
}
.designer-canvas__resize-handle--e,
.designer-canvas__resize-handle--w {
  cursor: ew-resize;
}

.designer-canvas__marquee {
  position: absolute;
  box-sizing: border-box;
}

.designer-canvas__marquee--contain {
  background: rgb(37 99 235 / 10%);
  border: 1px solid rgb(37 99 235 / 78%);
}

.designer-canvas__marquee--intersect {
  background: rgb(16 185 129 / 10%);
  border: 1px dashed rgb(5 150 105 / 88%);
}

.designer-canvas__marquee span {
  position: absolute;
  top: 4px;
  left: 4px;
  padding: 2px 5px;
  color: #fff;
  font:
    14px Inter,
    'Microsoft YaHei',
    'PingFang SC',
    sans-serif;
  white-space: nowrap;
  background: #2563eb;
  border-radius: 4px;
}

.designer-canvas__marquee--intersect span {
  background: #059669;
}

.designer-canvas--space,
.designer-canvas--space * {
  cursor: grab !important;
}

.designer-canvas--panning,
.designer-canvas--panning * {
  cursor: grabbing !important;
}

.designer-canvas--creating-guide-pair,
.designer-canvas--creating-guide-pair * {
  cursor: crosshair !important;
}

.designer-canvas--disabled {
  opacity: 0.78;
}
</style>
