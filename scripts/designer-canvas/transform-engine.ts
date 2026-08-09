import type { DesignerPoint, DesignerSize, DesignerTransform, DesignerUnit } from './types'

export const DEFAULT_TRANSFORM: DesignerTransform = {
  zoom: 1,
  offsetX: 0,
  offsetY: 0
}

export class TransformEngine {
  constructor(
    private readonly unit: DesignerUnit,
    private readonly transform: DesignerTransform
  ) {}

  worldToStage(point: DesignerPoint): DesignerPoint {
    return {
      x: point.x * this.unit.pixelsPerUnit,
      y: point.y * this.unit.pixelsPerUnit
    }
  }

  stageToWorld(point: DesignerPoint): DesignerPoint {
    return {
      x: point.x / this.unit.pixelsPerUnit,
      y: point.y / this.unit.pixelsPerUnit
    }
  }

  worldToViewport(point: DesignerPoint): DesignerPoint {
    const stage = this.worldToStage(point)
    return {
      x: this.transform.offsetX + stage.x * this.transform.zoom,
      y: this.transform.offsetY + stage.y * this.transform.zoom
    }
  }

  viewportToWorld(point: DesignerPoint): DesignerPoint {
    return this.stageToWorld({
      x: (point.x - this.transform.offsetX) / this.transform.zoom,
      y: (point.y - this.transform.offsetY) / this.transform.zoom
    })
  }

  viewportDeltaToWorld(delta: DesignerPoint): DesignerPoint {
    return this.stageToWorld({
      x: delta.x / this.transform.zoom,
      y: delta.y / this.transform.zoom
    })
  }

  worldLengthToStage(value: number): number {
    return value * this.unit.pixelsPerUnit
  }

  stageLengthToWorld(value: number): number {
    return value / this.unit.pixelsPerUnit
  }

  zoomAt(nextZoom: number, anchor: DesignerPoint): DesignerTransform {
    const worldAtAnchor = this.viewportToWorld(anchor)
    const stageAtAnchor = this.worldToStage(worldAtAnchor)
    return {
      zoom: nextZoom,
      offsetX: anchor.x - stageAtAnchor.x * nextZoom,
      offsetY: anchor.y - stageAtAnchor.y * nextZoom
    }
  }

  center(worldSize: DesignerSize, viewportSize: DesignerSize): DesignerTransform {
    const stageWidth = this.worldLengthToStage(worldSize.width) * this.transform.zoom
    const stageHeight = this.worldLengthToStage(worldSize.height) * this.transform.zoom
    return {
      ...this.transform,
      offsetX: (viewportSize.width - stageWidth) / 2,
      offsetY: (viewportSize.height - stageHeight) / 2
    }
  }

  fit(
    worldSize: DesignerSize,
    viewportSize: DesignerSize,
    padding: number,
    minZoom: number,
    maxZoom: number
  ): DesignerTransform {
    const baseWidth = this.worldLengthToStage(worldSize.width)
    const baseHeight = this.worldLengthToStage(worldSize.height)
    const availableWidth = Math.max(viewportSize.width - padding * 2, 1)
    const availableHeight = Math.max(viewportSize.height - padding * 2, 1)
    const zoom = Math.min(
      maxZoom,
      Math.max(minZoom, Math.min(availableWidth / baseWidth, availableHeight / baseHeight))
    )
    const fittedEngine = new TransformEngine(this.unit, { ...this.transform, zoom })
    return fittedEngine.center(worldSize, viewportSize)
  }
}
