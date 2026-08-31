// 将当前 URL 查询参数转换成普通对象，便于与 APP 注入对象统一读取。
function readQuery() {
  return Object.fromEntries(new URLSearchParams(window.location.search))
}

// 获取宿主 APP 与 H5 页面之间约定的运行时上下文。
// 注入对象优先于 URL 参数，URL 参数用于独立浏览器调试或演示环境。
export function getAppContext() {
  const injected = window.__ZZBANK_APP_CONTEXT__ || {}
  const query = readQuery()
// fixedHeader 支持布尔值和字符串形式，兼容原生 APP/调试链接两种来源。
  const fixedHeader = injected.fixedHeader === true
    || ['true', '1'].includes(String(query.fixedHeader || '').toLowerCase())

  return {
// ticket 代表宿主完成的授权凭据；页面只展示状态，不在此处解析凭据。
    ticket: injected.ticket || query.ticket || '',
// channel 用于标识当前承载渠道，默认按 APP 内嵌场景处理。
    channel: injected.channel || query.channel || 'app',
// headerHeight 由宿主提供，用于避让原生固定头部；最终会在 applyAppContext 中校正。
    headerHeight: Number(injected.headerHeight || query.headerHeight || 0),
// userName 预留给宿主自动登录扩展，目前登录页仍使用本地演示用户。
    userName: injected.userName || '',
    fixedHeader,
  }
}

// 将上下文中的布局和渠道信息写入 HTML 根节点，供全局 CSS 与调试逻辑消费。
export function applyAppContext() {
  const context = getAppContext()
// 非法或负数的头部高度按 0 处理，避免把内容推到可视区域之外。
  const headerHeight = Number.isFinite(context.headerHeight)
    ? Math.max(0, context.headerHeight)
    : 0

// CSS 变量让登录页、主内容区等多个模块共享同一套宿主头部偏移量。
  document.documentElement.style.setProperty(
    '--app-header-offset',
    context.fixedHeader ? `${headerHeight}px` : '0px',
  )
// data-* 属性方便样式选择器和宿主联调时快速确认当前运行模式。
  document.documentElement.dataset.fixedHeader = context.fixedHeader ? 'true' : 'false'
  document.documentElement.dataset.hostChannel = context.channel
}
