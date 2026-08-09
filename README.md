# Yiz Editor

`@eakerzt/yiz-editor` 是面向 Vue 3 的通用设计器基础组件库。当前提供 `DesignerCanvas`，用于统一打印模板设计器和大屏设计器中的坐标、视口及元素几何交互。

## 安装

```bash
yarn add @eakerzt/yiz-editor
```

Vue 作为 peer dependency，需要由使用方提供：

```bash
yarn add vue
```

## 按需使用

```vue
<script lang="ts" setup>
import { ref } from 'vue'
import { DesignerCanvas, millimeterUnit, type DesignerElementBase, type DesignerGuide } from '@eakerzt/yiz-editor'
import '@eakerzt/yiz-editor/dist/yiz-editor.css'

const elements = ref<DesignerElementBase[]>([])
const selectedIds = ref<string[]>([])
const guides = ref<DesignerGuide[]>([])
</script>

<template>
  <DesignerCanvas
    v-model:elements="elements"
    v-model:selected-ids="selectedIds"
    v-model:guides="guides"
    :world-size="{ width: 210, height: 297 }"
    :unit="millimeterUnit"
  >
    <template #element="{ element, isHover }">
      <MyElement :element="element" :is-hover="isHover" />
    </template>
  </DesignerCanvas>
</template>
```

## 全局安装

```ts
import { createApp } from 'vue'
import YizEditor from '@eakerzt/yiz-editor'
import '@eakerzt/yiz-editor/dist/yiz-editor.css'

createApp(App).use(YizEditor).mount('#app')
```

全局组件名为 `YDesignerCanvas`，模板中也可写成 `y-designer-canvas`。

## 包结构

- `scripts/designer-canvas/`：组件、坐标引擎、吸附算法、单位模型和公开类型。
- `scripts/components.ts`：组件汇总入口。
- `scripts/index.ts`：包入口及 Vue 插件安装器。
- `site/`：基于 `vue-router` 和 `@eakerzt/yiz-ui` 的文档演示站点，首页、完整组件 API 与交互 Demo 使用独立路由；“大屏设计器”和“打印模板设计器”由独立组件实现，通过可扩展下拉入口切换。
- `tests/`：坐标、刻度、吸附和指针交互测试。
- `plans/DESIGN.md`：DesignerCanvas 已实现能力的设计边界与交互约定。
- `plans/HISTORY.md`：待实现的撤销、重做与历史记录设计计划。

演示站点路由：

- `#/`：组件定位、能力边界、最小用法和完整设计文档入口。
- `#/components/designer-canvas`：DesignerCanvas 的全部 Props、v-model、Events、Slots 和实例方法。
- `#/demos/designer-canvas`：大屏设计器与打印模板设计器交互 Demo，可通过左上角下拉框切换。

## 开发

```bash
yarn
yarn dev
yarn typecheck
yarn test
yarn build
```

构建产物包括 ESM、CJS、类型声明与样式文件，输出到 `dist/`。

## 自动发布与站点部署

- 推送 `v*` tag 或手动运行 `Publish npm` 工作流，会完成依赖安装、类型检查、测试、构建并将 `@eakerzt/yiz-editor` 公开发布到 npm。
- 推送到 `main` / `master` 或手动运行 `Deploy Site` 工作流，会构建并部署 GitHub Pages：<https://eakerzt.github.io/yiz-editor/>。
- npm 发布采用 GitHub Actions OIDC Trusted Publishing，需要在 npm 包设置中登记仓库 `EakerZT/yiz-editor` 和工作流文件 `publish-npm.yml`。
- GitHub 仓库的 Pages Source 需要设置为 `GitHub Actions`。
