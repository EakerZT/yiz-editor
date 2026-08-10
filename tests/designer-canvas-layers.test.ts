// @vitest-environment happy-dom

import { mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it } from 'vitest'
import { h } from 'vue'
import DesignerCanvas from '../scripts/designer-canvas/DesignerCanvas.vue'
import { pixelUnit } from '../scripts/designer-canvas/units'
import type { DesignerCoordinateApi, DesignerTransform } from '../scripts/designer-canvas/types'

class ResizeObserverMock {
  observe(): void {}
  disconnect(): void {}
}

beforeAll(() => {
  globalThis.ResizeObserver = ResizeObserverMock as unknown as typeof ResizeObserver
})

interface LayerSlotProps {
  transform: DesignerTransform
  coordinate: DesignerCoordinateApi
}

describe('DesignerCanvas world layers', () => {
  it('renders background below elements and overlay above them with shared world context', async () => {
    const wrapper = mount(DesignerCanvas, {
      props: {
        elements: [{ id: 'element-1', left: 10, top: 20, width: 100, height: 60 }],
        worldSize: { width: 800, height: 600 },
        unit: pixelUnit,
        autoFit: false,
        transform: { zoom: 2, offsetX: 30, offsetY: 40 },
        backgroundClass: 'consumer-background',
        backgroundStyle: { backgroundColor: '#123456' },
        overlayClass: 'consumer-overlay',
        overlayStyle: { opacity: 0.5 }
      },
      slots: {
        background: ({ transform, coordinate }: LayerSlotProps) =>
          h('span', {
            'data-background-zoom': transform.zoom,
            'data-background-world-x': coordinate.viewportToWorld({ x: 50, y: 40 }).x
          }),
        element: () => h('span', { 'data-element-content': true }),
        overlay: ({ transform, coordinate }: LayerSlotProps) =>
          h('span', {
            'data-overlay-zoom': transform.zoom,
            'data-overlay-stage-x': coordinate.worldToStage({ x: 10, y: 0 }).x
          })
      }
    })

    const stageChildren = Array.from(wrapper.get('.designer-canvas__stage').element.children)
    const background = wrapper.get('[data-designer-background]')
    const element = wrapper.get('[data-element-id="element-1"]')
    const overlay = wrapper.get('[data-designer-overlay]')

    expect(stageChildren.indexOf(background.element)).toBeLessThan(stageChildren.indexOf(element.element))
    expect(stageChildren.indexOf(element.element)).toBeLessThan(stageChildren.indexOf(overlay.element))
    expect(background.classes()).toContain('consumer-background')
    expect(background.attributes('style')).toContain('background-color: #123456')
    expect(overlay.classes()).toContain('consumer-overlay')
    expect(overlay.attributes('style')).toContain('opacity: 0.5')
    expect(wrapper.get('[data-background-zoom="2"]').attributes('data-background-world-x')).toBe('10')
    expect(wrapper.get('[data-overlay-zoom="2"]').attributes('data-overlay-stage-x')).toBe('10')

    await wrapper.setProps({ transform: { zoom: 1, offsetX: 0, offsetY: 0 } })
    expect(wrapper.find('[data-background-zoom="1"]').exists()).toBe(true)
    expect(wrapper.find('[data-overlay-zoom="1"]').exists()).toBe(true)

    wrapper.unmount()
  })
})
