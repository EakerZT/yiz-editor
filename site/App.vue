<template>
  <div class="docs-shell">
    <header class="docs-header">
      <RouterLink class="docs-brand" to="/">
        <span class="docs-brand-mark">Y</span>
        <span>
          <strong>Yiz Editor</strong>
          <small>编辑器组件库</small>
        </span>
      </RouterLink>

      <nav class="docs-nav" aria-label="站点导航">
        <RouterLink v-slot="{ isActive, navigate }" custom to="/">
          <Button :type="isActive ? 'primary' : 'text'" @click="navigate">首页</Button>
        </RouterLink>
        <RouterLink v-slot="{ isActive, navigate }" custom to="/components/designer-canvas">
          <Button :type="isActive ? 'primary' : 'text'" @click="navigate">组件 API</Button>
        </RouterLink>
        <RouterLink v-slot="{ isActive, navigate }" custom to="/demos/designer-canvas">
          <Button :type="isActive ? 'primary' : 'text'" @click="navigate">Demo 演示</Button>
        </RouterLink>
      </nav>
    </header>

    <RouterView class="docs-content" />
  </div>
</template>

<script lang="ts" setup>
import { Button } from '@eakerzt/yiz-ui'
import { RouterLink, RouterView } from 'vue-router'
</script>
