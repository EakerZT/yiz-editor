import { describe, expect, it } from 'vitest'
import { snapMoveRect, snapResizeRect } from '../scripts/designer-canvas/snap-engine'
import type { DesignerRect, DesignerSnapCandidate } from '../scripts/designer-canvas/types'

const rect = (left: number, top: number, width: number, height: number): DesignerRect => ({
  x: left,
  y: top,
  left,
  top,
  width,
  height
})

describe('snapMoveRect', () => {
  it('snaps different rect anchors to the nearest candidates', () => {
    const candidates: DesignerSnapCandidate[] = [
      { axis: 'x', position: 100, source: 'guide', sourceId: 'x-guide' },
      { axis: 'y', position: 80, source: 'element', sourceId: 'other' }
    ]
    const result = snapMoveRect(rect(47, 27, 50, 50), candidates, 4)
    expect(result.rect.left).toBe(50)
    expect(result.rect.top).toBe(30)
    expect(result.lines.map((line) => line.position)).toEqual([100, 80])
  })

  it('does not snap outside the world threshold', () => {
    const result = snapMoveRect(rect(10, 20, 30, 40), [{ axis: 'x', position: 100, source: 'world' }], 5)
    expect(result.rect).toEqual(rect(10, 20, 30, 40))
    expect(result.lines).toHaveLength(0)
  })

  it('supports an optional world grid', () => {
    const result = snapMoveRect(rect(13, 27, 20, 20), [], 4, 10)
    expect(result.rect.left).toBe(10)
    expect(result.rect.top).toBe(30)
    expect(result.lines.every((line) => line.source === 'grid')).toBe(true)
  })

  it('prefers semantic candidates over an already-aligned grid anchor', () => {
    const result = snapMoveRect(
      rect(10, 15, 20, 20),
      [{ axis: 'y', position: 38, source: 'element', sourceId: 'other' }],
      4,
      10
    )
    expect(result.rect.top).toBe(18)
    expect(result.rect.top + result.rect.height).toBe(38)
    expect(result.lines.find((line) => line.axis === 'y')?.source).toBe('element')
  })
})

describe('snapResizeRect', () => {
  it('snaps the active resize edges without moving opposite edges', () => {
    const result = snapResizeRect(
      rect(10, 10, 87, 68),
      'se',
      [
        { axis: 'x', position: 100, source: 'guide' },
        { axis: 'y', position: 80, source: 'guide' }
      ],
      4
    )
    expect(result.rect).toEqual(rect(10, 10, 90, 70))
    expect(result.lines).toHaveLength(2)
  })

  it('snaps west and north handles while preserving opposite edges', () => {
    const result = snapResizeRect(
      rect(13, 13, 87, 67),
      'nw',
      [
        { axis: 'x', position: 10, source: 'element' },
        { axis: 'y', position: 10, source: 'element' }
      ],
      4
    )
    expect(result.rect).toEqual(rect(10, 10, 90, 70))
  })
})
