<template>
  <DesignerDemoWorkbench
    v-model:elements="elements"
    v-model:guides="guides"
    scene="print"
    :world-size="worldSize"
    :unit="millimeterUnit"
    :min-zoom="0.25"
    :snap-grid-size="1"
  >
    <template #toolbar-leading>
      <slot name="toolbar-leading" />
    </template>
  </DesignerDemoWorkbench>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import DesignerDemoWorkbench from '../../components/DesignerDemoWorkbench.vue'
import { millimeterUnit, type DesignerElementBase, type DesignerGuide, type DesignerSize } from 'yiz-editor'

const worldSize: DesignerSize = { width: 210, height: 297 }

const elements = ref<DesignerElementBase[]>([
  {
    id: 'print-title',
    kind: 'print-title',
    title: '销售订单',
    text: '销 售 订 单',
    left: 55,
    top: 10,
    width: 100,
    height: 14
  },
  { id: 'print-meta', kind: 'print-meta', title: '单据信息', left: 16, top: 36, width: 178, height: 10 },
  { id: 'print-line-top', kind: 'print-line', title: '分隔线', left: 16, top: 48, width: 178, height: 1, locked: true },
  { id: 'print-table', kind: 'print-table', title: '订单明细', left: 16, top: 56, width: 178, height: 66 },
  {
    id: 'print-total',
    kind: 'print-text',
    title: '合计',
    text: '合计金额：伍仟捌佰元整（¥ 5,800.00）',
    left: 16,
    top: 128,
    width: 178,
    height: 12
  },
  {
    id: 'print-remark',
    kind: 'print-text',
    title: '备注',
    text: '备注：本单据由系统自动生成，请妥善保管。',
    left: 16,
    top: 148,
    width: 125,
    height: 16
  },
  { id: 'print-qr', kind: 'print-qr', title: '二维码', left: 164, top: 144, width: 26, height: 26 },
  {
    id: 'print-footer',
    kind: 'print-text',
    title: '页脚文字',
    text: '制单人：管理员          审核人：__________',
    left: 16,
    top: 276,
    width: 120,
    height: 8
  }
])

const guides = ref<DesignerGuide[]>([{ id: 'print-guide-x', axis: 'x', position: 105 }])
</script>
