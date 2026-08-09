import { createApp, defineComponent } from 'vue'
import { describe, expect, it } from 'vitest'
import YizEditor, { DesignerCanvas, pixelUnit, TransformEngine } from '../scripts'

describe('yiz-editor package entry', () => {
  it('exports editor utilities while only installing actual Vue components', () => {
    const app = createApp(defineComponent({ template: '<div />' }))
    app.use(YizEditor)

    expect(app.component('YDesignerCanvas')).toBe(DesignerCanvas)
    expect(app.component('YPixelUnit')).toBeUndefined()
    expect(pixelUnit.symbol).toBe('px')
    expect(TransformEngine).toBeTypeOf('function')
  })
})
