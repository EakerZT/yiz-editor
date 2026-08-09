import { describe, expect, it } from 'vitest'
import { TransformEngine } from '../scripts/designer-canvas/transform-engine'
import { millimeterUnit, pixelUnit } from '../scripts/designer-canvas/units'

describe('TransformEngine', () => {
  it('round-trips px world and viewport coordinates', () => {
    const engine = new TransformEngine(pixelUnit, { zoom: 0.5, offsetX: 120, offsetY: 80 })
    const viewport = engine.worldToViewport({ x: 640, y: 360 })
    expect(viewport).toEqual({ x: 440, y: 260 })
    expect(engine.viewportToWorld(viewport)).toEqual({ x: 640, y: 360 })
  })

  it('round-trips millimeters without leaking CSS pixels', () => {
    const engine = new TransformEngine(millimeterUnit, { zoom: 1.75, offsetX: 31.5, offsetY: -12 })
    const world = { x: 105.25, y: 148.5 }
    const result = engine.viewportToWorld(engine.worldToViewport(world))
    expect(result.x).toBeCloseTo(world.x, 10)
    expect(result.y).toBeCloseTo(world.y, 10)
  })

  it('keeps the world point under the zoom anchor stable', () => {
    const transform = { zoom: 0.8, offsetX: 47, offsetY: 91 }
    const anchor = { x: 330, y: 240 }
    const before = new TransformEngine(pixelUnit, transform)
    const worldBefore = before.viewportToWorld(anchor)
    const nextTransform = before.zoomAt(1.6, anchor)
    const after = new TransformEngine(pixelUnit, nextTransform)
    expect(after.viewportToWorld(anchor).x).toBeCloseTo(worldBefore.x, 10)
    expect(after.viewportToWorld(anchor).y).toBeCloseTo(worldBefore.y, 10)
  })

  it('converts deltas independently from offset', () => {
    const first = new TransformEngine(millimeterUnit, { zoom: 2, offsetX: 0, offsetY: 0 })
    const second = new TransformEngine(millimeterUnit, { zoom: 2, offsetX: 800, offsetY: -300 })
    expect(first.viewportDeltaToWorld({ x: 96, y: 48 })).toEqual(second.viewportDeltaToWorld({ x: 96, y: 48 }))
  })

  it('fits and centers a world inside a viewport', () => {
    const engine = new TransformEngine(pixelUnit, { zoom: 1, offsetX: 0, offsetY: 0 })
    const result = engine.fit({ width: 1920, height: 1080 }, { width: 1000, height: 700 }, 50, 0.1, 4)
    expect(result.zoom).toBeCloseTo(900 / 1920, 10)
    expect(result.offsetX).toBeCloseTo(50, 10)
    expect(result.offsetY).toBeGreaterThan(50)
  })
})
