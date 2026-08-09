import type { App } from 'vue'

import './style.less'
import './global-components'

import { DesignerCanvas } from './components'

export * from './components'

const install = (app: App): void => {
  app.component('YDesignerCanvas', DesignerCanvas)
}

export default { install }
