// @vitest-environment happy-dom

import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import { Select, Slider, Switch } from '@eakerzt/yiz-ui'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'
import App from '../site/App.vue'
import { routes } from '../site/router'

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

describe('yiz-editor demo site', () => {
  it('separates the homepage, full component API and interactive demos', async () => {
    const router = createRouter({ history: createMemoryHistory(), routes })
    await router.push('/')
    await router.isReady()
    wrapper = mount(App, {
      attachTo: document.body,
      global: { plugins: [router] }
    })

    expect(wrapper.text()).toContain('DesignerCanvas')
    expect(wrapper.text()).toContain('统一设计器的坐标、视口、标尺、辅助线和元素几何交互')
    expect(wrapper.text()).toContain('首页')
    expect(wrapper.text()).toContain('组件 API')
    expect(wrapper.text()).toContain('Demo 演示')

    await router.push('/components/designer-canvas')
    await flushPromises()

    expect(wrapper.text()).toContain('DesignerCanvas 的完整公开接口')
    expect(wrapper.text()).toContain('Props（29）')
    expect(wrapper.text()).toContain('guidesVisible')
    expect(wrapper.text()).toContain('constrainTransform')
    expect(wrapper.text()).toContain('viewport-overlay')
    expect(wrapper.text()).toContain('stageLengthToWorld(value)')

    const apiNavButtons = wrapper.findAll('.api-section-nav button')
    expect(apiNavButtons).toHaveLength(5)
    await apiNavButtons[4]?.trigger('click')
    await flushPromises()
    expect(router.currentRoute.value.fullPath).toBe('/components/designer-canvas')
    expect(wrapper.text()).toContain('Exposed Methods（13）')

    await router.push('/demos/designer-canvas')
    await flushPromises()

    const demoSelector = wrapper
      .findAllComponents(Select)
      .find((component) =>
        (component.props('options') as Array<{ value?: string }> | undefined)?.some(
          (option) => option.value === 'screen-designer'
        )
      )

    expect(demoSelector).toBeDefined()
    expect(wrapper.find('[role="tablist"]').exists()).toBe(false)
    expect(demoSelector?.props('options')).toEqual([
      { label: '大屏设计器', value: 'screen-designer' },
      { label: '打印模板设计器', value: 'print-template-designer' }
    ])
    expect(wrapper.find('[data-element-id="screen-title"]').exists()).toBe(true)
    expect(wrapper.get('.canvas-status').text()).not.toContain('大屏设计器')
    expect(wrapper.get('.canvas-status').text()).not.toContain('1920 × 1080')

    const titleLayer = wrapper.findAll('.layer-item').find((item) => item.text().includes('页面标题'))
    expect(titleLayer?.text()).toContain('锁定')
    await titleLayer?.trigger('click')
    await wrapper.get('.lock-control input[type="checkbox"]').setValue(false)
    await flushPromises()
    const unlockedTitleLayer = wrapper.findAll('.layer-item').find((item) => item.text().includes('页面标题'))
    expect(unlockedTitleLayer?.text()).not.toContain('锁定')

    const zoomSlider = wrapper.getComponent(Slider)
    zoomSlider.vm.$emit('update:value', 80)
    await flushPromises()
    expect(wrapper.get('.zoom-value').text()).toBe('80%')

    const guidesSwitch = wrapper.getComponent(Switch)
    expect(wrapper.find('[data-guide-id="screen-guide-x"]').exists()).toBe(true)
    guidesSwitch.vm.$emit('update:value', false)
    await flushPromises()
    expect(wrapper.find('[data-guide-id]').exists()).toBe(false)
    expect(wrapper.get('.toolbar-switch-label').text()).toBe('隐藏')

    demoSelector?.vm.$emit('update:value', 'print-template-designer')
    await flushPromises()

    expect(wrapper.find('[data-element-id="print-title"]').exists()).toBe(true)
    expect(wrapper.find('[data-element-id="print-table"]').exists()).toBe(true)
    expect(wrapper.find('[data-element-id="screen-title"]').exists()).toBe(false)
    expect(wrapper.find('.print-header-boundary').exists()).toBe(true)
    expect(wrapper.find('.print-footer-boundary').exists()).toBe(true)
    expect(wrapper.get('.canvas-status').text()).not.toContain('打印模板设计器')
    expect(wrapper.get('.canvas-status').text()).not.toContain('210 × 297')

    const printDemoSelector = wrapper
      .findAllComponents(Select)
      .find((component) =>
        (component.props('options') as Array<{ value?: string }> | undefined)?.some(
          (option) => option.value === 'screen-designer'
        )
      )
    printDemoSelector?.vm.$emit('update:value', 'screen-designer')
    await flushPromises()

    expect(wrapper.find('[data-element-id="screen-title"]').exists()).toBe(true)
    expect(wrapper.find('[data-element-id="print-title"]').exists()).toBe(false)
  })
})
