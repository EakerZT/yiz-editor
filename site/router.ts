import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import DesignerCanvasDemo from './pages/DesignerCanvasDemo.vue'
import DesignerCanvasApi from './pages/DesignerCanvasApi.vue'
import DesignerCanvasIntroduction from './pages/DesignerCanvasIntroduction.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: DesignerCanvasIntroduction
  },
  {
    path: '/components/designer-canvas',
    name: 'designer-canvas-api',
    component: DesignerCanvasApi
  },
  {
    path: '/demos/designer-canvas',
    name: 'designer-canvas-demo',
    component: DesignerCanvasDemo
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

export default router
