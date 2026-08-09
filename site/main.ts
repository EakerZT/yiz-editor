import { createApp } from 'vue'
import YizUI from '@eakerzt/yiz-ui'
import '@eakerzt/yiz-ui/dist/yiz-ui.css'
import App from './App.vue'
import router from './router'
import './style.less'

createApp(App).use(YizUI).use(router).mount('#app')
