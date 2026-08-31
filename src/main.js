// 应用入口：集中完成 Vue、Vant 组件库和宿主 APP 适配层的初始化。
import { createApp } from 'vue'
// Vant 提供移动端常用组件；样式和触摸模拟器需要在挂载前加载。
import Vant from 'vant'
import 'vant/lib/index.css'
import '@vant/touch-emulator'
// 根组件负责登录态、底部导航和审批详情弹窗的组合。
import App from './App.vue'
// 全局样式定义布局变量、主题色以及安全区域适配规则。
import './styles/base.css'
// 在 Vue 启动前读取宿主 APP 注入的上下文并同步到 CSS/HTML 属性。
import { applyAppContext } from './services/appBridge'

// 先应用宿主环境参数，确保首屏渲染时已经拥有正确的头部偏移量。
applyAppContext()

// 创建并挂载唯一的 Vue 应用实例，同时注册 Vant 全局组件。
createApp(App).use(Vant).mount('#app')
