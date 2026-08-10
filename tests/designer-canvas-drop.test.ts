// @vitest-environment happy-dom

import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { mount, type VueWrapper } from '@vue/test-utils'
import DesignerCanvas from '../scripts/designer-canvas/DesignerCanvas.vue'
import { millimeterUnit, pixelUnit } from '../scripts/designer-canvas/units'
import type { DesignerCanvasDropEvent } from '../scripts/designer-canvas/types'

class ResizeObserverMock {
  observe(): void {}
  disconnect(): void {}
}

beforeAll(() => {
  globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
})

let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  vi.restoreAllMocks()
})

function dragEvent(type: 'dragover' | 'dragleave' | 'drop', clientX: number, clientY: number): DragEvent {
  const event = new Event(type, { bubbles: true, cancelable: true }) as DragEvent
  Object.defineProperties(event, {
    clientX: { value: clientX },
    clientY: { value: clientY },
    dataTransfer: { value: { dropEffect: 'none' } }
  })
  return event
}

function mountCanvas(extraProps: Record<string, unknown> = {}): VueWrapper {
  return mount(DesignerCanvas, {
    attachTo: document.body,
    props: {
      elements: [],
      worldSize: { width: 500, height: 400 },
      unit: pixelUnit,
      autoFit: false,
      transform: { zoom: 2, offsetX: 20, offsetY: 30 },
      ...extraProps
    }
  })
}

describe('DesignerCanvas external drop', () => {
  it('emits viewport and world coordinates under the current pan and zoom', async () => {
    wrapper = mountCanvas()
    const surface = wrapper.get('.designer-canvas__surface')
    vi.spyOn(surface.element, 'getBoundingClientRect').mockReturnValue({
      left: 100,
      top: 50,
      right: 900,
      bottom: 650,
      width: 800,
      height: 600,
      x: 100,
      y: 50,
      toJSON: () => ({})
    })

    const over = dragEvent('dragover', 320, 200)
    surface.element.dispatchEvent(over)
    await wrapper.vm.$nextTick()

    expect(over.defaultPrevented).toBe(true)
    expect(wrapper.classes()).toContain('designer-canvas--external-drag-inside')
    const dragover = wrapper.emitted('external-dragover')?.[0]?.[0] as DesignerCanvasDropEvent
    expect(dragover.viewportPoint).toEqual({ x: 220, y: 150 })
    expect(dragover.worldPoint).toEqual({ x: 100, y: 60 })
    expect(dragover.insideWorld).toBe(true)

    const drop = dragEvent('drop', 320, 200)
    surface.element.dispatchEvent(drop)
    await wrapper.vm.$nextTick()

    const payload = wrapper.emitted('external-drop')?.[0]?.[0] as DesignerCanvasDropEvent
    expect(payload.originalEvent).toBe(drop)
    expect(payload.worldPoint).toEqual({ x: 100, y: 60 })
    expect(payload.insideWorld).toBe(true)
    expect(wrapper.classes()).not.toContain('designer-canvas--external-drag')
  })

  it('reports points outside the world without clamping them', async () => {
    wrapper = mountCanvas()
    const surface = wrapper.get('.designer-canvas__surface')
    const drop = dragEvent('drop', 1120, 900)
    surface.element.dispatchEvent(drop)
    await wrapper.vm.$nextTick()

    const payload = wrapper.emitted('external-drop')?.[0]?.[0] as DesignerCanvasDropEvent
    expect(payload.worldPoint).toEqual({ x: 550, y: 435 })
    expect(payload.insideWorld).toBe(false)
  })

  it('returns millimeter world coordinates with the unit conversion applied', async () => {
    wrapper = mountCanvas({
      unit: millimeterUnit,
      worldSize: { width: 210, height: 297 },
      transform: { zoom: 1.5, offsetX: 12, offsetY: 18 }
    })
    const surface = wrapper.get('.designer-canvas__surface')
    const clientX = 12 + 42 * millimeterUnit.pixelsPerUnit * 1.5
    const clientY = 18 + 86 * millimeterUnit.pixelsPerUnit * 1.5
    surface.element.dispatchEvent(dragEvent('drop', clientX, clientY))
    await wrapper.vm.$nextTick()

    const payload = wrapper.emitted('external-drop')?.[0]?.[0] as DesignerCanvasDropEvent
    expect(payload.worldPoint.x).toBeCloseTo(42, 8)
    expect(payload.worldPoint.y).toBeCloseTo(86, 8)
    expect(payload.insideWorld).toBe(true)
  })

  it('does not intercept native dragging when drop is disabled', async () => {
    wrapper = mountCanvas({ dropEnabled: false })
    const over = dragEvent('dragover', 100, 100)
    wrapper.get('.designer-canvas__surface').element.dispatchEvent(over)
    await wrapper.vm.$nextTick()

    expect(over.defaultPrevented).toBe(false)
    expect(wrapper.emitted('external-dragover')).toBeUndefined()
    expect(wrapper.classes()).not.toContain('designer-canvas--external-drag')
  })
})
