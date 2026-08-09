import { describe, expect, it } from 'vitest'
import { calculateRulerSteps } from '../scripts/designer-canvas/ruler-scale'

describe('calculateRulerSteps', () => {
  it('uses readable px ticks at a reduced zoom', () => {
    const result = calculateRulerSteps({
      zoom: 0.5,
      pixelsPerUnit: 1,
      minimumMinorTickPx: 7,
      minimumMajorTickPx: 42
    })
    expect(result.major).toBe(100)
    expect(result.minor).toBe(20)
  })

  it('selects millimeter-friendly steps at 100%', () => {
    const result = calculateRulerSteps({
      zoom: 1,
      pixelsPerUnit: 96 / 25.4,
      minimumMinorTickPx: 7,
      minimumMajorTickPx: 42
    })
    expect(result.major).toBe(20)
    expect(result.minor).toBe(4)
  })

  it('increases detail as zoom increases', () => {
    const far = calculateRulerSteps({ zoom: 0.25, pixelsPerUnit: 1, minimumMinorTickPx: 7, minimumMajorTickPx: 42 })
    const near = calculateRulerSteps({ zoom: 2, pixelsPerUnit: 1, minimumMinorTickPx: 7, minimumMajorTickPx: 42 })
    expect(near.major).toBeLessThan(far.major)
  })
})
