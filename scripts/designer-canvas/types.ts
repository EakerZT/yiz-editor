export interface DesignerPoint {
  x: number
  y: number
}

export interface DesignerSize {
  width: number
  height: number
}

export interface DesignerRect extends DesignerPoint, DesignerSize {
  left: number
  top: number
}

export interface DesignerTransform {
  zoom: number
  offsetX: number
  offsetY: number
}

export interface RulerStepContext {
  zoom: number
  pixelsPerUnit: number
  minimumMinorTickPx: number
  minimumMajorTickPx: number
}

export interface RulerSteps {
  minor: number
  major: number
}

export interface DesignerUnit {
  name: string
  symbol: string
  pixelsPerUnit: number
  precision: number
  nudgeStep: number
  nudgeStepLarge: number
  normalize(value: number): number
  format(value: number): string
  getRulerSteps(context: RulerStepContext): RulerSteps
}

export interface DesignerElementBase {
  id: string
  left: number
  top: number
  width: number
  height: number
  locked?: boolean
  hidden?: boolean
  [key: string]: unknown
}

export interface DesignerElementCapabilities {
  selectable?: boolean
  movable?: boolean
  resizeX?: boolean
  resizeY?: boolean
  minWidth?: number
  minHeight?: number
}

export type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w'

export interface DesignerGuide {
  id: string
  axis: 'x' | 'y'
  position: number
  locked?: boolean
  visible?: boolean
  label?: string
}

export type DesignerSnapSource = 'world' | 'guide' | 'element' | 'grid'

export interface DesignerSnapCandidate {
  axis: 'x' | 'y'
  position: number
  source: DesignerSnapSource
  sourceId?: string
}

export interface DesignerSnapLine extends DesignerSnapCandidate {}

export interface DesignerSnapResult {
  rect: DesignerRect
  lines: DesignerSnapLine[]
}

export interface ElementTransformContext<T extends DesignerElementBase = DesignerElementBase> {
  element: T
  operation: 'move' | 'resize' | 'keyboard'
  handle?: ResizeHandle
  original: DesignerRect
  proposed: DesignerRect
  worldSize: DesignerSize
}

export interface ElementTransformItem<T extends DesignerElementBase = DesignerElementBase> {
  element: T
  before: DesignerRect
  current: DesignerRect
}

export interface ElementTransformEvent<T extends DesignerElementBase = DesignerElementBase> {
  operation: 'move' | 'resize' | 'keyboard'
  items: ElementTransformItem<T>[]
}

export interface DesignerElementHoverEvent<T extends DesignerElementBase = DesignerElementBase> {
  element: T
  hovered: boolean
  originalEvent: PointerEvent
}

export interface DesignerCanvasDropEvent {
  originalEvent: DragEvent
  viewportPoint: DesignerPoint
  worldPoint: DesignerPoint
  insideWorld: boolean
}

export type DesignerHoverStyleMode = 'none' | 'background' | 'mask' | 'outline'

export interface DesignerCoordinateApi {
  viewportToWorld(point: DesignerPoint): DesignerPoint
  worldToViewport(point: DesignerPoint): DesignerPoint
  viewportDeltaToWorld(delta: DesignerPoint): DesignerPoint
  worldToStage(point: DesignerPoint): DesignerPoint
  stageToWorld(point: DesignerPoint): DesignerPoint
  worldLengthToStage(value: number): number
  stageLengthToWorld(value: number): number
}

export interface DesignerCanvasExpose extends DesignerCoordinateApi {
  zoomIn(): void
  zoomOut(): void
  zoomTo(zoom: number, anchor?: DesignerPoint): void
  center(): void
  fit(padding?: number): void
  reset(): void
}
