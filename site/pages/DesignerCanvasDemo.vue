<template>
  <KeepAlive>
    <component :is="activeDemoComponent">
      <template #toolbar-leading>
        <div class="demo-selector">
          <span class="toolbar-label">Demo</span>
          <Select
            v-model:value="activeDemoKey"
            class="demo-selector-select"
            aria-label="Demo 选择"
            size="small"
            :options="demoOptions"
          />
        </div>
      </template>
    </component>
  </KeepAlive>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { Select } from '@eakerzt/yiz-ui'
import PrintTemplateDesignerDemo from './demos/PrintTemplateDesignerDemo.vue'
import ScreenDesignerDemo from './demos/ScreenDesignerDemo.vue'

const demoRegistry = {
  'screen-designer': ScreenDesignerDemo,
  'print-template-designer': PrintTemplateDesignerDemo
} as const

type DemoKey = keyof typeof demoRegistry

const activeDemoKey = ref<DemoKey>('screen-designer')
const activeDemoComponent = computed(() => demoRegistry[activeDemoKey.value])
const demoOptions: Array<{ label: string; value: DemoKey }> = [
  { label: '大屏设计器', value: 'screen-designer' },
  { label: '打印模板设计器', value: 'print-template-designer' }
]
</script>
