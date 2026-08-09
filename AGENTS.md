# Project Instructions

- 默认使用中文沟通，所有文本文件保持 UTF-8 without BOM。
- 本项目采用 Yarn Classic，不使用 npm 或 pnpm 管理依赖。
- 库源码位于 `scripts/`，演示站点位于 `site/`，构建输出位于 `dist/`。
- 每个组件位于 `scripts/<component-name>/` 并通过 `scripts/components.ts` 导出。
- `scripts/index.ts` 同时提供命名导出和 Vue 插件安装能力，全局组件使用 `Y` 前缀。
- Vue SFC 使用 `<script lang="ts" setup>` 和 `<style lang="less">`。
- TypeScript 开启严格检查，避免 `any`，不要编辑生成的 `dist/` 文件。
- 样式主题变量使用 `--yiz-editor-` 前缀。
- 提交前运行 `yarn typecheck`、`yarn test` 和 `yarn build`。
