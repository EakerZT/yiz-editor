// @vitest-environment happy-dom

import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { h } from 'vue'
import { mount, type VueWrapper } from '@vue/test-utils'
import DesignerCanvas from '../scripts/designer-canvas/DesignerCanvas.vue'
import { pixelUnit } from '../scripts/designer-canvas/units'
import type { DesignerElementBase } from '../scripts/designer-canvas/types'

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
})

const element: DesignerElementBase = {
  id: 'element-1',
  left: 100,
  top: 80,
  width: 200,
  height: 120
}

function mountCanvas(
  selectedIds: string[] = [],
  elements: DesignerElementBase[] = [element],
  extraProps: Record<string, unknown> = {}
): VueWrapper {
  return mount(DesignerCanvas, {
    attachTo: document.body,
    props: {
      elements,
      selectedIds,
      worldSize: { width: 1000, height: 800 },
      unit: pixelUnit,
      autoFit: false,
      transform: { zoom: 1, offsetX: 0, offsetY: 0 },
      hoverStyleMode: 'outline',
      ...extraProps
    }
  })
}

function dispatchPointer(type: string, init: PointerEventInit): void {
  window.dispatchEvent(new PointerEvent(type, { bubbles: true, ...init }))
}

describe('DesignerCanvas middle-button panning', () => {
  it('pans instead of selecting or moving when middle-drag starts on an element', async () => {
    wrapper = mountCanvas()
    await wrapper.get('[data-element-id="element-1"]').trigger('pointerdown', {
      button: 1,
      pointerId: 11,
      clientX: 100,
      clientY: 100
    })
    expect(wrapper.classes()).toContain('designer-canvas--panning')
    dispatchPointer('pointermove', { pointerId: 11, clientX: 145, clientY: 126 })
    dispatchPointer('pointerup', { pointerId: 11, clientX: 145, clientY: 126 })
    await wrapper.vm.$nextTick()

    const transforms = wrapper.emitted('update:transform') ?? []
    expect(transforms).toHaveLength(1)
    expect(transforms[0][0]).toEqual({ zoom: 1, offsetX: 45, offsetY: 26 })
    expect(wrapper.emitted('update:selectedIds')).toBeUndefined()
    expect(wrapper.emitted('update:elements')).toBeUndefined()
    expect(wrapper.emitted('transform-start')).toBeUndefined()
  })

  it('pans instead of resizing when middle-drag starts on a resize handle', async () => {
    wrapper = mountCanvas(['element-1'])
    await wrapper.get('[data-resize-handle="se"]').trigger('pointerdown', {
      button: 1,
      pointerId: 12,
      clientX: 300,
      clientY: 200
    })
    dispatchPointer('pointermove', { pointerId: 12, clientX: 270, clientY: 240 })
    dispatchPointer('pointerup', { pointerId: 12, clientX: 270, clientY: 240 })
    await wrapper.vm.$nextTick()

    const transforms = wrapper.emitted('update:transform') ?? []
    expect(transforms).toHaveLength(1)
    expect(transforms[0][0]).toEqual({ zoom: 1, offsetX: -30, offsetY: 40 })
    expect(wrapper.emitted('update:elements')).toBeUndefined()
    expect(wrapper.emitted('transform-start')).toBeUndefined()
  })
})

describe('DesignerCanvas space and left-button panning', () => {
  it.each([
    {
      target: 'an element',
      selectedIds: [] as string[],
      extraProps: {},
      selector: '[data-element-id="element-1"]'
    },
    {
      target: 'a resize handle',
      selectedIds: ['element-1'],
      extraProps: {},
      selector: '[data-resize-handle="se"]'
    },
    {
      target: 'a guide',
      selectedIds: [] as string[],
      extraProps: { guides: [{ id: 'guide-x', axis: 'x', position: 160 }] },
      selector: '[data-guide-id="guide-x"]'
    },
    {
      target: 'the ruler corner',
      selectedIds: [] as string[],
      extraProps: {},
      selector: '.designer-canvas__corner'
    }
  ])('pans instead of starting another operation from $target', async ({ selectedIds, extraProps, selector }) => {
    wrapper = mountCanvas(selectedIds, [element], extraProps)
    await wrapper.trigger('keydown', { code: 'Space' })
    expect(wrapper.classes()).toContain('designer-canvas--space')

    await wrapper.get(selector).trigger('pointerdown', {
      button: 0,
      pointerId: 15,
      clientX: 120,
      clientY: 100
    })
    expect(wrapper.classes()).toContain('designer-canvas--panning')

    dispatchPointer('pointermove', { pointerId: 15, clientX: 150, clientY: 125 })
    dispatchPointer('pointerup', { pointerId: 15, clientX: 150, clientY: 125 })
    await wrapper.trigger('keyup', { code: 'Space' })
    await wrapper.vm.$nextTick()

    const transforms = wrapper.emitted('update:transform') ?? []
    expect(transforms).toHaveLength(1)
    expect(transforms[0][0]).toEqual({ zoom: 1, offsetX: 30, offsetY: 25 })
    expect(wrapper.emitted('update:selectedIds')).toBeUndefined()
    expect(wrapper.emitted('update:elements')).toBeUndefined()
    expect(wrapper.emitted('transform-start')).toBeUndefined()
    expect(wrapper.emitted('guide-create')).toBeUndefined()
    expect(wrapper.emitted('guide-change')).toBeUndefined()
    expect(wrapper.classes()).not.toContain('designer-canvas--space')
  })
})

describe('DesignerCanvas element locking', () => {
  it('keeps locked authoritative when custom capabilities try to enable transforms', async () => {
    wrapper = mountCanvas([], [{ ...element, locked: true }], {
      getCapabilities: () => ({ movable: true, resizeX: true, resizeY: true })
    })

    const elementWrapper = wrapper.get('[data-element-id="element-1"]')
    expect(elementWrapper.classes()).toContain('designer-canvas__element--locked')
    await elementWrapper.trigger('pointerdown', {
      button: 0,
      pointerId: 18,
      clientX: 120,
      clientY: 100
    })
    dispatchPointer('pointermove', { pointerId: 18, clientX: 180, clientY: 150 })
    dispatchPointer('pointerup', { pointerId: 18, clientX: 180, clientY: 150 })
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:selectedIds')?.at(-1)?.[0]).toEqual(['element-1'])
    expect(wrapper.emitted('transform-start')).toBeUndefined()
    expect(wrapper.emitted('update:elements')).toBeUndefined()
  })
})

describe('DesignerCanvas corner guide creation', () => {
  it('creates one vertical and one horizontal guide from a corner drag', async () => {
    wrapper = mountCanvas()
    await wrapper.get('.designer-canvas__corner').trigger('pointerdown', {
      button: 0,
      pointerId: 16,
      clientX: 4,
      clientY: 4
    })
    expect(wrapper.classes()).toContain('designer-canvas--creating-guide-pair')

    dispatchPointer('pointermove', { pointerId: 16, clientX: 140, clientY: 180 })
    dispatchPointer('pointerup', { pointerId: 16, clientX: 140, clientY: 180 })
    await wrapper.vm.$nextTick()

    const guideCreates = wrapper.emitted('guide-create') ?? []
    expect(guideCreates).toHaveLength(2)
    expect(guideCreates.map(([guide]) => guide)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ axis: 'x', position: 140 }),
        expect.objectContaining({ axis: 'y', position: 180 })
      ])
    )
    const guideUpdates = wrapper.emitted('update:guides') ?? []
    expect(guideUpdates.at(-1)?.[0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ axis: 'x', position: 140 }),
        expect.objectContaining({ axis: 'y', position: 180 })
      ])
    )
  })

  it('cancels both corner guides when the drop point is outside the world', async () => {
    wrapper = mountCanvas()
    await wrapper.get('.designer-canvas__corner').trigger('pointerdown', {
      button: 0,
      pointerId: 17,
      clientX: 4,
      clientY: 4
    })
    dispatchPointer('pointermove', { pointerId: 17, clientX: 140, clientY: -20 })
    dispatchPointer('pointerup', { pointerId: 17, clientX: 140, clientY: -20 })
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('guide-create')).toBeUndefined()
    const guideUpdates = wrapper.emitted('update:guides') ?? []
    expect(guideUpdates.at(-1)?.[0]).toEqual([])
  })
})

describe('DesignerCanvas marquee selection and hover', () => {
  it('selects multiple intersecting elements and renders a group selection box', async () => {
    const second: DesignerElementBase = {
      id: 'element-2',
      left: 420,
      top: 100,
      width: 160,
      height: 100
    }
    wrapper = mountCanvas([], [element, second])
    await wrapper.get('.designer-canvas__surface').trigger('pointerdown', {
      button: 0,
      pointerId: 21,
      clientX: 50,
      clientY: 40
    })
    dispatchPointer('pointermove', { pointerId: 21, clientX: 620, clientY: 250 })
    dispatchPointer('pointerup', { pointerId: 21, clientX: 620, clientY: 250 })
    await wrapper.vm.$nextTick()

    const selections = wrapper.emitted('update:selectedIds') ?? []
    expect(selections.at(-1)?.[0]).toEqual(['element-1', 'element-2'])

    await wrapper.setProps({ selectedIds: ['element-1', 'element-2'] })
    expect(wrapper.find('[data-multi-selection-box]').exists()).toBe(true)
    expect(wrapper.get('[data-multi-selection-box]').text()).toContain('2 个元素')
  })

  it('requires full containment when marquee moves from left to right regardless of vertical direction', async () => {
    wrapper = mountCanvas()
    await wrapper.get('.designer-canvas__surface').trigger('pointerdown', {
      button: 0,
      pointerId: 22,
      clientX: 50,
      clientY: 250
    })
    dispatchPointer('pointermove', { pointerId: 22, clientX: 250, clientY: 50 })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-marquee-mode="contain"]').exists()).toBe(true)
    dispatchPointer('pointerup', { pointerId: 22, clientX: 250, clientY: 50 })
    await wrapper.vm.$nextTick()

    const selections = wrapper.emitted('update:selectedIds') ?? []
    expect(selections.at(-1)?.[0]).toEqual([])
  })

  it('selects partial intersections when marquee moves from right to left regardless of vertical direction', async () => {
    wrapper = mountCanvas()
    await wrapper.get('.designer-canvas__surface').trigger('pointerdown', {
      button: 0,
      pointerId: 23,
      clientX: 250,
      clientY: 50
    })
    dispatchPointer('pointermove', { pointerId: 23, clientX: 50, clientY: 250 })
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-marquee-mode="intersect"]').exists()).toBe(true)
    dispatchPointer('pointerup', { pointerId: 23, clientX: 50, clientY: 250 })
    await wrapper.vm.$nextTick()

    const selections = wrapper.emitted('update:selectedIds') ?? []
    expect(selections.at(-1)?.[0]).toEqual(['element-1'])
  })

  it('emits hover state and displays an unscaled hover box', async () => {
    wrapper = mountCanvas()
    const elementWrapper = wrapper.get('[data-element-id="element-1"]')
    await elementWrapper.trigger('pointerenter', { pointerId: 31 })

    expect(wrapper.emitted('update:hoveredId')?.[0]?.[0]).toBe('element-1')
    expect((wrapper.emitted('element-hover')?.[0]?.[0] as { hovered: boolean }).hovered).toBe(true)
    expect(wrapper.find('[data-hover-id="element-1"]').exists()).toBe(true)

    await elementWrapper.trigger('pointerleave', { pointerId: 31 })
    const hoverEvents = wrapper.emitted('element-hover') ?? []
    expect((hoverEvents.at(-1)?.[0] as { hovered: boolean }).hovered).toBe(false)
    expect(wrapper.find('[data-hover-id]').exists()).toBe(false)
  })

  it('supports user hover classes, preset modes and the isHover slot property', async () => {
    wrapper = mount(DesignerCanvas, {
      attachTo: document.body,
      props: {
        elements: [element],
        selectedIds: [],
        worldSize: { width: 1000, height: 800 },
        unit: pixelUnit,
        autoFit: false,
        transform: { zoom: 1, offsetX: 0, offsetY: 0 },
        hoverClass: 'consumer-hover-class',
        hoverStyleMode: 'none'
      },
      slots: {
        element: (slotProps: { isHover: boolean }) =>
          h('span', {
            'data-slot-hover': String(slotProps.isHover)
          })
      }
    })
    const elementWrapper = wrapper.get('[data-element-id="element-1"]')
    expect(wrapper.find('[data-slot-hover="false"]').exists()).toBe(true)

    await elementWrapper.trigger('pointerenter', { pointerId: 32 })
    expect(elementWrapper.classes()).toContain('consumer-hover-class')
    expect(wrapper.find('[data-slot-hover="true"]').exists()).toBe(true)
    expect(wrapper.find('[data-hover-id]').exists()).toBe(false)

    await wrapper.setProps({ hoverStyleMode: 'background' })
    expect(wrapper.find('.designer-canvas__hover-box--background').exists()).toBe(true)
    await wrapper.setProps({ hoverStyleMode: 'mask' })
    expect(wrapper.find('.designer-canvas__hover-box--mask').exists()).toBe(true)
    await wrapper.setProps({ hoverStyleMode: 'outline' })
    expect(wrapper.find('.designer-canvas__hover-box--outline').exists()).toBe(true)
  })
})
