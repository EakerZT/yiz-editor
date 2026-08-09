<template>
  <main class="api-page">
    <section class="api-hero">
      <div>
        <Tag color="primary" mode="filled">DesignerCanvas</Tag>
        <h1>组件 API</h1>
        <p>DesignerCanvas 的完整公开接口，包括属性、双向绑定、事件、插槽与实例方法。</p>
      </div>
      <Button type="primary" @click="router.push('/demos/designer-canvas')">打开 Demo</Button>
    </section>

    <nav class="api-section-nav" aria-label="组件 API 目录">
      <Button size="small" type="outlined" @click="scrollToSection('props')">Props {{ propRows.length }}</Button>
      <Button size="small" type="outlined" @click="scrollToSection('models')">v-model {{ modelRows.length }}</Button>
      <Button size="small" type="outlined" @click="scrollToSection('events')">Events {{ eventRows.length }}</Button>
      <Button size="small" type="outlined" @click="scrollToSection('slots')">Slots {{ slotRows.length }}</Button>
      <Button size="small" type="outlined" @click="scrollToSection('methods')">Methods {{ methodRows.length }}</Button>
    </nav>

    <Card id="props" class="api-card" :title="`Props（${propRows.length}）`">
      <ComponentApiTable :rows="propRows" />
    </Card>

    <Card id="models" class="api-card" :title="`v-model（${modelRows.length}）`">
      <ComponentApiTable :rows="modelRows" />
    </Card>

    <Card id="events" class="api-card" :title="`Events（${eventRows.length}）`">
      <ComponentApiTable :rows="eventRows" />
    </Card>

    <Card id="slots" class="api-card" :title="`Slots（${slotRows.length}）`">
      <ComponentApiTable :rows="slotRows" />
    </Card>

    <Card id="methods" class="api-card" :title="`Exposed Methods（${methodRows.length}）`">
      <ComponentApiTable :rows="methodRows" />
    </Card>
  </main>
</template>

<script lang="ts" setup>
import { Button, Card, Tag } from '@eakerzt/yiz-ui'
import { useRouter } from 'vue-router'
import ComponentApiTable from '../components/ComponentApiTable.vue'

interface ApiRow {
  name: string
  type: string
  defaultValue: string
  description: string
}

const router = useRouter()

function scrollToSection(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const propRows: ApiRow[] = [
  {
    name: 'elements',
    type: 'DesignerElementBase[]',
    defaultValue: '必填',
    description: '画布元素数据；几何坐标使用当前 unit 的世界单位。'
  },
  { name: 'selectedIds', type: 'string[]', defaultValue: '[]', description: '当前选中的元素 ID，支持多选。' },
  { name: 'hoveredId', type: 'string | undefined', defaultValue: 'undefined', description: '当前悬浮元素 ID。' },
  { name: 'hoverClass', type: 'string', defaultValue: "''", description: '悬浮时附加到元素几何包装层的 class。' },
  {
    name: 'hoverStyleMode',
    type: "'none' | 'background' | 'mask' | 'outline'",
    defaultValue: "'none'",
    description: '内置 Hover 视觉模式。'
  },
  {
    name: 'worldSize',
    type: 'DesignerSize',
    defaultValue: '必填',
    description: '业务画布的世界宽高，例如 1920×1080 px 或 210×297 mm。'
  },
  { name: 'unit', type: 'DesignerUnit', defaultValue: '必填', description: '单位、精度、步进和标尺刻度策略。' },
  {
    name: 'transform',
    type: 'DesignerTransform',
    defaultValue: '{ zoom: 1, offsetX: 0, offsetY: 0 }',
    description: '视口缩放和平移状态。'
  },
  { name: 'guides', type: 'DesignerGuide[]', defaultValue: '[]', description: '辅助线数据。' },
  { name: 'minZoom', type: 'number', defaultValue: '0.1', description: '最小缩放倍数。' },
  { name: 'maxZoom', type: 'number', defaultValue: '4', description: '最大缩放倍数。' },
  { name: 'zoomStep', type: 'number', defaultValue: '0.1', description: '按钮和快捷缩放使用的步长。' },
  { name: 'ruler', type: 'boolean', defaultValue: 'true', description: '是否显示水平和垂直标尺。' },
  { name: 'rulerSize', type: 'number', defaultValue: '28', description: '标尺区域厚度，单位为 CSS px。' },
  {
    name: 'guidesVisible',
    type: 'boolean',
    defaultValue: 'true',
    description: '是否显示辅助线；隐藏不会删除辅助线数据。'
  },
  { name: 'guidesLocked', type: 'boolean', defaultValue: 'false', description: '是否统一锁定辅助线，禁止移动和删除。' },
  {
    name: 'wheelZoom',
    type: "'ctrl' | 'always' | 'disabled'",
    defaultValue: "'ctrl'",
    description: '滚轮缩放触发方式。'
  },
  {
    name: 'panWithSpace',
    type: 'boolean',
    defaultValue: 'true',
    description: '是否允许空格 + 左键从空白、元素、辅助线或控制点开始平移画布。'
  },
  { name: 'autoFit', type: 'boolean', defaultValue: 'true', description: '初次获得有效容器尺寸时是否自动适应画布。' },
  {
    name: 'constrainToWorld',
    type: 'boolean',
    defaultValue: 'true',
    description: '是否限制元素变换结果位于世界画布范围内。'
  },
  { name: 'disabled', type: 'boolean', defaultValue: 'false', description: '是否禁用设计器几何交互。' },
  { name: 'snap', type: 'boolean', defaultValue: 'true', description: '是否启用吸附。' },
  { name: 'snapThreshold', type: 'number', defaultValue: '6', description: '吸附触发距离，单位为视口 CSS px。' },
  { name: 'snapGridSize', type: 'number', defaultValue: '0', description: '网格吸附步长；0 表示不启用网格候选。' },
  { name: 'snapToWorld', type: 'boolean', defaultValue: 'true', description: '是否吸附到画布边缘和中心。' },
  { name: 'snapToGuides', type: 'boolean', defaultValue: 'true', description: '是否吸附到辅助线。' },
  { name: 'snapToElements', type: 'boolean', defaultValue: 'true', description: '是否吸附到其他元素的边缘和中心。' },
  {
    name: 'getCapabilities',
    type: '(element) => DesignerElementCapabilities',
    defaultValue: 'undefined',
    description: '按元素返回可选择、可移动、可缩放及最小尺寸能力；不能覆盖 element.locked。'
  },
  {
    name: 'constrainTransform',
    type: '(context) => DesignerRect',
    defaultValue: 'undefined',
    description: '业务自定义移动、缩放和键盘微调的最终几何约束。'
  }
]

const modelRows: ApiRow[] = [
  {
    name: 'v-model:elements',
    type: 'DesignerElementBase[]',
    defaultValue: '—',
    description: '同步移动、缩放、键盘微调后的元素数组。'
  },
  { name: 'v-model:selected-ids', type: 'string[]', defaultValue: '[]', description: '同步单选、多选和框选结果。' },
  {
    name: 'v-model:hovered-id',
    type: 'string | undefined',
    defaultValue: 'undefined',
    description: '同步当前 Hover 元素。'
  },
  {
    name: 'v-model:transform',
    type: 'DesignerTransform',
    defaultValue: '默认视口',
    description: '同步 zoom、offsetX 和 offsetY。'
  },
  {
    name: 'v-model:guides',
    type: 'DesignerGuide[]',
    defaultValue: '[]',
    description: '同步辅助线创建、移动和删除结果。'
  }
]

const eventRows: ApiRow[] = [
  {
    name: 'transform-start',
    type: 'ElementTransformEvent',
    defaultValue: '—',
    description: '元素移动或缩放操作开始。'
  },
  {
    name: 'transform-change',
    type: 'ElementTransformEvent',
    defaultValue: '—',
    description: '元素几何在交互过程中发生变化。'
  },
  {
    name: 'transform-end',
    type: 'ElementTransformEvent',
    defaultValue: '—',
    description: '元素移动、缩放或键盘微调结束。'
  },
  { name: 'guide-create', type: 'DesignerGuide', defaultValue: '—', description: '创建辅助线后触发。' },
  { name: 'guide-change', type: 'DesignerGuide', defaultValue: '—', description: '移动辅助线后触发。' },
  { name: 'guide-remove', type: 'DesignerGuide', defaultValue: '—', description: '删除辅助线后触发。' },
  {
    name: 'delete-request',
    type: 'string[]',
    defaultValue: '—',
    description: '用户按 Delete 或 Backspace 时请求删除所选元素。'
  },
  {
    name: 'element-hover',
    type: 'DesignerElementHoverEvent',
    defaultValue: '—',
    description: '元素进入或离开 Hover 状态。'
  }
]

const slotRows: ApiRow[] = [
  {
    name: 'element',
    type: '{ element, selected, hovered, isHover, zoom }',
    defaultValue: '—',
    description: '渲染业务元素内容；设计器负责外部几何包装。'
  },
  { name: 'corner', type: '{}', defaultValue: 'unit.symbol', description: '替换水平、垂直标尺交汇区域。' },
  {
    name: 'overlay',
    type: '{ transform, coordinate }',
    defaultValue: '—',
    description: '世界坐标覆盖层，随画布缩放和平移。'
  },
  {
    name: 'viewport-overlay',
    type: '{ transform, coordinate }',
    defaultValue: '—',
    description: '视口坐标覆盖层，不随业务画布缩放。'
  }
]

const methodRows: ApiRow[] = [
  { name: 'zoomIn()', type: '() => void', defaultValue: '—', description: '按 zoomStep 放大。' },
  { name: 'zoomOut()', type: '() => void', defaultValue: '—', description: '按 zoomStep 缩小。' },
  {
    name: 'zoomTo(zoom, anchor?)',
    type: '(number, DesignerPoint?) => void',
    defaultValue: '—',
    description: '缩放到指定倍数，可提供视口锚点。'
  },
  { name: 'center()', type: '() => void', defaultValue: '—', description: '保持缩放倍数并将画布居中。' },
  { name: 'fit(padding?)', type: '(number?) => void', defaultValue: '24', description: '按容器和留白自动适应画布。' },
  { name: 'reset()', type: '() => void', defaultValue: '—', description: '恢复默认视口变换。' },
  {
    name: 'viewportToWorld(point)',
    type: '(DesignerPoint) => DesignerPoint',
    defaultValue: '—',
    description: '视口坐标转换为世界坐标。'
  },
  {
    name: 'worldToViewport(point)',
    type: '(DesignerPoint) => DesignerPoint',
    defaultValue: '—',
    description: '世界坐标转换为视口坐标。'
  },
  {
    name: 'viewportDeltaToWorld(delta)',
    type: '(DesignerPoint) => DesignerPoint',
    defaultValue: '—',
    description: '视口位移转换为世界位移。'
  },
  {
    name: 'worldToStage(point)',
    type: '(DesignerPoint) => DesignerPoint',
    defaultValue: '—',
    description: '世界坐标转换为 Stage 坐标。'
  },
  {
    name: 'stageToWorld(point)',
    type: '(DesignerPoint) => DesignerPoint',
    defaultValue: '—',
    description: 'Stage 坐标转换为世界坐标。'
  },
  {
    name: 'worldLengthToStage(value)',
    type: '(number) => number',
    defaultValue: '—',
    description: '世界长度转换为 Stage 长度。'
  },
  {
    name: 'stageLengthToWorld(value)',
    type: '(number) => number',
    defaultValue: '—',
    description: 'Stage 长度转换为世界长度。'
  }
]
</script>

<style lang="less" scoped>
.api-page {
  min-width: 0;
  min-height: 0;
  padding: 32px clamp(24px, 5vw, 72px) 64px;
  overflow: auto;
  background: #f5f7fa;
  scroll-behavior: smooth;
}

.api-hero,
.api-section-nav,
.api-card {
  max-width: 1280px;
  margin-right: auto;
  margin-left: auto;
}

.api-hero {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 20px;
}

.api-hero h1 {
  margin: 12px 0 8px;
  font-size: 36px;
}

.api-hero p {
  margin: 0;
  color: #64748b;
  font-size: 16px;
  line-height: 1.7;
}

.api-section-nav {
  position: sticky;
  z-index: 5;
  top: -1px;
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
  padding: 10px;
  background: rgb(245 247 250 / 94%);
  border: 1px solid #dbe3ed;
  border-radius: 8px;
  backdrop-filter: blur(10px);
}

.api-section-nav :deep(.yiz-button) {
  flex: 0 0 auto;
}

.api-card {
  margin-bottom: 16px;
  scroll-margin-top: 68px;
}

@media (max-width: 700px) {
  .api-hero {
    align-items: flex-start;
    flex-direction: column;
  }

  .api-section-nav {
    overflow-x: auto;
  }
}
</style>
