import type { DesignerCanvas } from './components'

declare module 'vue' {
  export interface GlobalComponents {
    YDesignerCanvas: typeof DesignerCanvas
    'y-designer-canvas': typeof DesignerCanvas
  }
}

export {}
