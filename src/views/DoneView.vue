<script setup>
// 已办页面：支持按结论和关键字检索历史审批，并以只读模式打开详情。
import { computed, ref } from 'vue'
import ApprovalCard from '../components/ApprovalCard.vue'

// 父组件传入已经完成的审批记录。
const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
})

// 选中历史记录后通知根组件打开 done 模式详情。
defineEmits(['select'])

// 历史记录搜索关键字。
const query = ref('')
// 当前结果筛选：all、passed、returned 或 rejected。
const activeResult = ref('all')

// 为筛选标签计算各结论的数量。
const resultCounts = computed(() => ({
  all: props.items.length,
  passed: props.items.filter((item) => item.result === 'passed').length,
  returned: props.items.filter((item) => item.result === 'returned').length,
  rejected: props.items.filter((item) => item.result === 'rejected').length,
}))

// 对结果状态和客户/编号/类型关键字执行组合过滤。
const filteredItems = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  return props.items.filter((item) => {
    const matchesResult = activeResult.value === 'all' || item.result === activeResult.value
    const matchesKeyword = !keyword || [item.customer, item.id, item.applicationType]
      .some((value) => value.toLowerCase().includes(keyword))
    return matchesResult && matchesKeyword
  })
})
</script>

<template>
  <!-- 搜索框、结果标签和已办卡片列表构成历史视图。 -->
  <section class="page-view done-view">
    <van-search
      v-model="query"
      shape="square"
      placeholder="搜索客户名称、业务编号"
      aria-label="搜索已办事项"
      class="done-search"
    />

    <div class="result-tabs" role="tablist" aria-label="审批结果筛选">
      <button
        v-for="tab in [
          { value: 'all', label: '全部' },
          { value: 'passed', label: '同意' },
          { value: 'returned', label: '退回' },
          { value: 'rejected', label: '否决' },
        ]"
        :key="tab.value"
        type="button"
        role="tab"
        :aria-selected="activeResult === tab.value"
        :class="{ active: activeResult === tab.value }"
        @click="activeResult = tab.value"
      >
        {{ tab.label }}<span>{{ resultCounts[tab.value] }}</span>
      </button>
    </div>

    <div class="section-title">
      <h2>最近处理</h2>
      <span>共 {{ filteredItems.length }} 笔</span>
    </div>

    <div v-if="filteredItems.length" class="approval-grid">
      <ApprovalCard
        v-for="item in filteredItems"
        :key="item.id"
        :item="item"
        mode="done"
        @select="$emit('select', $event)"
      />
    </div>
    <van-empty v-else image="search" description="没有符合条件的审批记录" />
  </section>
</template>

<style scoped>
/* 历史页样式重点处理搜索框、结果标签和响应式宽度。 */
.history-mark {
  color: var(--brand-primary);
  font-size: 26px;
}

.done-search {
  padding: 0;
  margin-top: 5px;
  background: transparent;
}

.done-search :deep(.van-search__content) {
  height: 42px;
  padding-left: 13px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}
.done-search :deep(.van-search__field) {
  align-items: center;
  height: 100%;
  padding-top: 0;
  padding-bottom: 0;
}

.done-search :deep(.van-field__left-icon) {
  display: flex;
  align-items: center;
  align-self: stretch;
  line-height: normal;
}

.done-search :deep(.van-field__value),
.done-search :deep(.van-field__body),
.done-search :deep(.van-field__control) {
  height: 100%;
}

.done-search :deep(.van-field__control) {
  line-height: normal;
}

.result-tabs {
  display: flex;
  gap: 22px;
  margin: 18px 0 20px;
  overflow-x: auto;
  border-bottom: 1px solid #e2e5e9;
  scrollbar-width: none;
}

.result-tabs button {
  position: relative;
  flex: none;
  padding: 0 1px 10px;
  color: #727984;
  font-size: 14px;
  background: transparent;
  border: 0;
}

.result-tabs button.active {
  color: #24282f;
  font-weight: 600;
}

.result-tabs button.active::after {
  position: absolute;
  right: 0;
  bottom: -1px;
  left: 0;
  height: 2px;
  background: var(--brand-primary);
  content: '';
}

.result-tabs span {
  margin-left: 4px;
  color: #a0a5ae;
  font-size: 11px;
}

@media (min-width: 720px) {
  .done-search {
    width: 100%;
    max-width: none;
  }
}
</style>
