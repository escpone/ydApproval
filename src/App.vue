<script setup>
// 根容器：协调登录状态、导航页签、审批数据以及详情工作流。
import { computed, ref } from 'vue'
import { showDialog, showToast } from 'vant'
import TodoView from './views/TodoView.vue'
import DoneView from './views/DoneView.vue'
import ProfileView from './views/ProfileView.vue'
import LoginView from './views/LoginView.vue'
import ApprovalWorkflowDetail from './components/ApprovalWorkflowDetail.vue'
import { completedApprovals, todoApprovals } from './data/approvals'
import { getAppContext } from './services/appBridge'

// 当前底部导航页签，登录成功后默认进入待办。
const activeTab = ref('todo')
// 使用浅拷贝建立页面级待办状态，避免直接修改静态演示数据。
const todoItems = ref([...todoApprovals])
// 已办数据同样独立保存，审批完成后将新结果插入数组头部。
const doneItems = ref([...completedApprovals])
// 当前打开的审批单；关闭详情时置空由工作流组件通过事件完成。
const selectedItem = ref(null)
// 控制右侧详情工作流弹窗的显示状态。
const detailVisible = ref(false)
// todo 表示可处理流程，done 表示只读历史流程。
const detailMode = ref('todo')
// 演示登录态只保存在内存中，刷新页面会回到登录页。
const isAuthenticated = ref(false)
// 当前岗位同时用于个人中心展示和详情页权限计算。
const currentUser = ref(null)
// 读取宿主 APP 上下文，用于固定头部和授权提示。
const appContext = getAppContext()

// 风险管理岗位仅显示其权限范围内的待办类型。
const todoRestrictedRoles = new Set([
  '风险管理部限额管理岗',
  '风险管理部总经理',
])
// 被限制的申请类型集合；使用 Set 可进行 O(1) 成员判断。
const restrictedTodoApplicationTypes = new Set([
  '合作方授信申请',
  '合作方授信变更申请',
  '同业授信申请',
])

const pageTitle = '统一授信移动审批'
// 根据当前岗位派生可见待办，原始 todoItems 保持完整以便切换岗位或退出登录。
const visibleTodoItems = computed(() => {
  if (!todoRestrictedRoles.has(currentUser.value?.role)) return todoItems.value
  return todoItems.value.filter((item) => !restrictedTodoApplicationTypes.has(item.applicationType))
})
// 底部导航徽标只统计当前用户实际可见的待办数量。
const todoCount = computed(() => visibleTodoItems.value.length)

// 处理页面返回：已登录时先退出演示登录态，否则交给浏览器历史记录。
function onBack() {
  if (isAuthenticated.value) {
    isAuthenticated.value = false
    currentUser.value = null
    activeTab.value = 'todo'
    selectedItem.value = null
    detailVisible.value = false
    return
  }
  if (window.history.length > 1) window.history.back()
}

// 接收登录页选中的岗位，清理上一次详情状态后进入待办首页。
function handleLogin(user) {
  currentUser.value = { ...user }
  activeTab.value = 'todo'
  selectedItem.value = null
  detailVisible.value = false
  isAuthenticated.value = true
}

// 打开审批工作流并记录来源模式，确保已办单据保持只读语义。
function openDetail(item, mode = 'todo') {
  selectedItem.value = item
  detailMode.value = mode
  detailVisible.value = true
}
// 保存工作流中的局部编辑：以 id 定位待办并替换为最新草稿。
function handleSave({ form }) {
  if (!selectedItem.value) return
  const updatedItem = { ...selectedItem.value, ...form }
  selectedItem.value = updatedItem
  todoItems.value = todoItems.value.map((entry) => (
    entry.id === updatedItem.id ? updatedItem : entry
  ))
}


// 处理审批结论：从待办移除当前单据，并把完整表单快照写入已办列表。
function handleDecision({ result, resultText, opinion, form }) {
  if (!selectedItem.value) return
  const item = selectedItem.value
  todoItems.value = todoItems.value.filter((entry) => entry.id !== item.id)
  doneItems.value = [
    {
      ...item,
      ...form,
      result,
      resultText: resultText || (result === 'passed' ? '同意' : result === 'rejected' ? '否决' : '打回'),
      opinion,
      completedAt: '刚刚',
    },
    ...doneItems.value,
  ]
  detailVisible.value = false
  const actionText = result === 'passed' ? '已同意' : result === 'rejected' ? '已否决' : '已打回'
  showToast(actionText + '，事项处理完成')
}

// 底部导航只负责切换视图，数据筛选由各页面组件内部维护。
function switchTab(tab) {
  activeTab.value = tab
}

// 展示宿主授权状态；当前项目未连接真实 APP 接口，因此使用对话框说明。
function onAppAction() {
  showDialog({
    title: '安全会话',
    message: appContext.ticket ? '当前页面已通过 APP 鉴权，可安全处理审批事项。' : '当前为演示会话。接入 APP 后，将由 APP 注入鉴权凭据。',
    confirmButtonText: '知道了',
  })
}
</script>

<template>
  <!-- 登录页、业务主区、底部导航和详情工作流构成应用外壳。 -->
  <div class="app-shell">
    <!-- 未认证时只渲染登录页，避免业务数据在登录前暴露。 -->
    <LoginView v-if="!isAuthenticated" @login="handleLogin" />

    <template v-else>
    <!-- 登录后显示宿主头部；fixedHeader 模式下头部由原生 APP 管理。 -->
    <header v-if="!appContext.fixedHeader" class="host-header">
      <div class="host-header-inner">
        <button class="host-back" type="button" aria-label="返回" @click="onBack">
          <van-icon name="arrow-left" />
        </button>
        <h1 class="host-title">{{ pageTitle }}</h1>
        <button class="host-action" type="button" aria-label="安全会话" @click="onAppAction">
          <van-icon name="ellipsis" />
          <span class="host-action-divider" aria-hidden="true" />
          <span class="mini-program-mark" aria-hidden="true"><span /></span>
        </button>
      </div>
    </header>

    <!-- 主区域根据当前页签选择待办、已办或个人中心。 -->
    <main class="main-content" :class="{ 'host-managed': appContext.fixedHeader }">
      <TodoView v-if="activeTab === 'todo'" :items="visibleTodoItems" @select="openDetail" />
      <DoneView v-else-if="activeTab === 'done'" :items="doneItems" @select="(item) => openDetail(item, 'done')" />
      <ProfileView v-else :user="currentUser" />
    </main>

    <!-- 固定底部导航，待办页签附带可见数量徽标。 -->
    <nav class="bottom-nav" aria-label="主导航">
      <div class="bottom-nav-inner">
      <button
        type="button"
        :class="{ active: activeTab === 'todo' }"
        :aria-current="activeTab === 'todo' ? 'page' : undefined"
        @click="switchTab('todo')"
      >
        <span class="nav-icon-wrap">
          <van-icon :name="activeTab === 'todo' ? 'todo-list' : 'todo-list-o'" />
          <i v-if="todoCount" class="nav-badge">{{ todoCount > 99 ? '99+' : todoCount }}</i>
        </span>
        <span>待办</span>
      </button>
      <button
        type="button"
        :class="{ active: activeTab === 'done' }"
        :aria-current="activeTab === 'done' ? 'page' : undefined"
        @click="switchTab('done')"
      >
        <van-icon :name="activeTab === 'done' ? 'passed' : 'completed'" />
        <span>已办</span>
      </button>
      <button
        type="button"
        :class="{ active: activeTab === 'profile' }"
        :aria-current="activeTab === 'profile' ? 'page' : undefined"
        @click="switchTab('profile')"
      >
        <van-icon :name="activeTab === 'profile' ? 'contact' : 'contact-o'" />
        <span>我的</span>
      </button>
      </div>
    </nav>

    <!-- 详情工作流负责分段编辑、权限判断和审批提交。 -->
    <ApprovalWorkflowDetail
      v-model:show="detailVisible"
      :item="selectedItem"
      :mode="detailMode"
      :current-role="currentUser?.role"
      @decide="handleDecision"
      @save="handleSave"
    />
    </template>
  </div>
</template>
