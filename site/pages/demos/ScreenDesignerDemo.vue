<template>
  <DesignerDemoWorkbench
    v-model:elements="elements"
    v-model:guides="guides"
    scene="screen"
    :world-size="worldSize"
    :unit="pixelUnit"
    :min-zoom="0.1"
    :snap-grid-size="10"
  >
    <template #toolbar-leading>
      <slot name="toolbar-leading" />
    </template>
  </DesignerDemoWorkbench>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import DesignerDemoWorkbench from '../../components/DesignerDemoWorkbench.vue'
import { pixelUnit, type DesignerElementBase, type DesignerGuide, type DesignerSize } from 'yiz-editor'

const worldSize: DesignerSize = { width: 1920, height: 1080 }

const elements = ref<DesignerElementBase[]>([
  {
    id: 'screen-title',
    kind: 'text',
    title: '页面标题',
    text: '城市运行数字驾驶舱',
    color: '#22d3ee',
    left: 510,
    top: 44,
    width: 900,
    height: 90,
    locked: true
  },
  {
    id: 'screen-metric',
    kind: 'metric',
    title: '今日业务量',
    text: '28,690',
    color: '#38bdf8',
    left: 90,
    top: 178,
    width: 420,
    height: 230
  },
  {
    id: 'screen-bars',
    kind: 'bars',
    title: '近七日趋势',
    color: '#8b5cf6',
    left: 550,
    top: 178,
    width: 650,
    height: 390
  },
  {
    id: 'screen-map',
    kind: 'map',
    title: '实时区域分布',
    color: '#06b6d4',
    left: 1240,
    top: 178,
    width: 590,
    height: 650
  },
  {
    id: 'screen-metric-2',
    kind: 'metric',
    title: '在线设备',
    text: '9,382',
    color: '#10b981',
    left: 90,
    top: 448,
    width: 420,
    height: 230
  },
  {
    id: 'screen-bars-2',
    kind: 'bars',
    title: '业务结构',
    color: '#f59e0b',
    left: 550,
    top: 610,
    width: 650,
    height: 300
  }
])

const guides = ref<DesignerGuide[]>([
  { id: 'screen-guide-x', axis: 'x', position: 960 },
  { id: 'screen-guide-y', axis: 'y', position: 540 }
])
</script>
