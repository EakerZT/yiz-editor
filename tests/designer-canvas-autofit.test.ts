// @vitest-environment happy-dom

import { mount, type VueWrapper } from '@vue/test-utils'
import { defineComponent, h, nextTick, ref } from 'vue'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import DesignerCanvas from '../scripts/designer-canvas/DesignerCanvas.vue'
import { DEFAULT_TRANSFORM } from '../scripts/designer-canvas/transform-engine'
import type { DesignerTransform } from '../scripts/designer-canvas/types'
import { pixelUnit } from '../scripts/designer-canvas/units'

class ActiveResizeObserverMock {
  constructor(private readonly callback: ResizeObserverCallback) {}

  observe(): void {
    this.callback(
      [
        {
          contentRect: { width: 800, height: 600 }
        } as ResizeObserverEntry
      ],
      this as unknown as ResizeObserver
    )
  }

  disconnect(): void {}
}

beforeAll(() => {
  globalThis.ResizeObserver = ActiveResizeObserverMock as unknown as typeof ResizeObserver
})

let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
})

describe('DesignerCanvas automatic fit', () => {
  it('does not refit forever when worldSize is an inline object and transform is controlled', async () => {
    let transformUpdates = 0
    const Host = defineComponent({
      setup() {
        const transform = ref<DesignerTransform>({ ...DEFAULT_TRANSFORM })
        return () =>
          h(DesignerCanvas, {
            elements: [],
            selectedIds: [],
            worldSize: { width: 1200, height: 720 },
            unit: pixelUnit,
            transform: transform.value,
            'onUpdate:transform': (value: DesignerTransform) => {
              transformUpdates += 1
              transform.value = value
            }
          })
      }
    })

    wrapper = mount(Host, { attachTo: document.body })
    await nextTick()
    await nextTick()
    await nextTick()

    expect(transformUpdates).toBe(1)
  })
})
