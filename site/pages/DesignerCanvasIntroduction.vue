<template>
  <main class="introduction-page">
    <section class="intro-hero">
      <div>
        <div class="intro-tags">
          <Tag color="primary" mode="filled">Vue 3</Tag>
          <Tag color="success" mode="filled">TypeScript</Tag>
          <Tag color="warning" mode="filled">px / mm</Tag>
        </div>
        <h1>DesignerCanvas</h1>
        <p>统一设计器的坐标、视口、标尺、辅助线和元素几何交互，业务层只负责元素内容渲染。</p>
        <div class="intro-actions">
          <Button type="primary" @click="router.push('/demos/designer-canvas')">打开交互 Demo</Button>
          <Button @click="router.push('/components/designer-canvas')">查看组件 API</Button>
          <Button @click="openDesignDocument">查看完整设计文档</Button>
          <Button @click="openHistoryPlan">查看历史记录计划</Button>
        </div>
      </div>
      <div class="coordinate-card">
        <span>Client</span>
        <strong>→ Viewport → Stage → World</strong>
        <small>大屏保存 px，打印模板保存 mm</small>
      </div>
    </section>

    <section class="intro-grid">
      <Card v-for="feature in features" :key="feature.title" :title="feature.title" shadow="hover">
        <p>{{ feature.description }}</p>
      </Card>
    </section>

    <Card title="最小使用方式" class="usage-card">
      <pre><code>{{ usageCode }}</code></pre>
    </Card>

    <Card title="公共层与业务层边界" class="boundary-card">
      <div class="boundary-columns">
        <section>
          <h2>DesignerCanvas 负责</h2>
          <ul>
            <li>坐标换算、缩放、平移、适应窗口</li>
            <li>世界坐标背景层与业务结构覆盖层</li>
            <li>标尺、辅助线、吸附与对齐提示</li>
            <li>选择、框选、移动、缩放和键盘微调</li>
            <li>外部拖放接收与落点世界坐标换算</li>
            <li>Hover 状态与操作生命周期事件</li>
          </ul>
        </section>
        <section>
          <h2>业务项目负责</h2>
          <ul>
            <li>元素类型、字段和 element 插槽渲染</li>
            <li>打印分页、页眉页脚和 PDF 输出</li>
            <li>大屏图表、数据加载和预览行为</li>
            <li>保存、撤销重做及业务校验</li>
          </ul>
        </section>
      </div>
    </Card>
  </main>
</template>

<script lang="ts" setup>
import { Button, Card, Tag } from '@eakerzt/yiz-ui'
import { useRouter } from 'vue-router'

const router = useRouter()

const features = [
  { title: '双单位模型', description: '同一组件支持大屏 px 与打印 mm，编辑缩放不会污染业务数据。' },
  { title: '完整几何交互', description: '提供单选、多选、CAD 框选、移动、八方向缩放与 Shift 等比缩放。' },
  { title: '标尺与辅助线', description: '高 DPI 标尺、单线创建、左上角双线创建、移动删除与坐标标签。' },
  { title: '吸附系统', description: '支持画布、网格、辅助线及其他元素的边缘与中心吸附。' },
  { title: '外部拖入', description: '统一接收 HTML5 拖放，并返回缩放、平移及 px/mm 单位换算后的世界坐标。' },
  { title: '插槽渲染', description: '外部通过 element 插槽渲染任意业务组件，并获得 selected、isHover 与 zoom。' },
  { title: '受控状态', description: 'elements、selectedIds、hoveredId、transform 与 guides 均支持 v-model。' }
]

const usageCode = `<DesignerCanvas
  v-model:elements="elements"
  v-model:selected-ids="selectedIds"
  v-model:transform="transform"
  v-model:guides="guides"
  :world-size="{ width: 210, height: 297 }"
  :unit="millimeterUnit"
  :background-style="{ backgroundColor: '#fff' }"
>
  <template #background>
    <MyPageBackground />
  </template>
  <template #element="{ element, isHover }">
    <MyElement :element="element" :is-hover="isHover" />
  </template>
  <template #overlay>
    <MyBusinessGuides />
  </template>
</DesignerCanvas>`

function openDesignDocument(): void {
  window.open(new URL('../../plans/DESIGN.md', import.meta.url).href, '_blank', 'noopener,noreferrer')
}

function openHistoryPlan(): void {
  window.open(new URL('../../plans/HISTORY.md', import.meta.url).href, '_blank', 'noopener,noreferrer')
}
</script>

<style lang="less" scoped>
.introduction-page {
  min-width: 0;
  min-height: 0;
  padding: 36px clamp(24px, 5vw, 72px) 64px;
  overflow: auto;
  background: #f5f7fa;
}

.intro-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(300px, 420px);
  gap: 40px;
  align-items: center;
  max-width: 1180px;
  margin: 0 auto 28px;
}

.intro-tags,
.intro-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.intro-hero h1 {
  margin: 16px 0 10px;
  font-size: clamp(36px, 5vw, 58px);
  line-height: 1;
}

.intro-hero p {
  max-width: 700px;
  margin: 0 0 24px;
  color: #64748b;
  font-size: 16px;
  line-height: 1.8;
}

.coordinate-card {
  display: grid;
  gap: 12px;
  padding: 28px;
  color: #dbeafe;
  background: linear-gradient(145deg, #1d4ed8, #0f172a);
  border-radius: 16px;
  box-shadow: 0 20px 45px rgb(30 64 175 / 22%);
}

.coordinate-card span,
.coordinate-card small {
  color: #93c5fd;
}

.coordinate-card strong {
  font: 18px var(--yiz-editor-site-font-family);
}

.intro-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  max-width: 1180px;
  margin: 0 auto 16px;
}

.intro-grid p {
  margin: 0;
  color: #64748b;
  line-height: 1.7;
}

.usage-card,
.boundary-card {
  max-width: 1180px;
  margin: 0 auto 16px;
}

pre {
  margin: 0;
  padding: 20px;
  overflow: auto;
  color: #dbeafe;
  background: #0f172a;
  border-radius: 8px;
}

.boundary-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 32px;
}

.boundary-columns h2 {
  margin: 0 0 12px;
  font-size: 16px;
}

.boundary-columns ul {
  margin: 0;
  padding-left: 20px;
  color: #475569;
  line-height: 2;
}

@media (max-width: 900px) {
  .intro-hero,
  .boundary-columns {
    grid-template-columns: 1fr;
  }

  .intro-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 620px) {
  .intro-grid {
    grid-template-columns: 1fr;
  }
}
</style>
