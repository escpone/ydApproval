// Vite 配置：声明部署子路径、Vue 插件和兼容的浏览器编译目标。
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  // 与 Nginx/宿主发布目录保持一致，生成资源使用该前缀。
  base: '/creditApproval/',
  // 将 .vue 单文件组件编译为浏览器可执行的 JavaScript/CSS。
  plugins: [vue()],
  // 开发服务器监听所有网卡，便于移动设备或容器访问。
  server: {
    host: '0.0.0.0',
  },
  // 产物兼容 ES2018 和 Safari 13，覆盖项目目标移动端环境。
  build: {
    target: ['es2018', 'safari13'],
  },
})
