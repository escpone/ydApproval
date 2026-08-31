<script setup>
// 待办页面：负责关键词搜索、申请类型筛选以及审批卡片列表展示。
import { computed, ref } from 'vue'
import ApprovalCard from '../components/ApprovalCard.vue'

// 父组件传入经过岗位权限过滤后的待办数组。
const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
})

// 卡片点击事件向上抛出，由根组件打开对应的审批工作流。
defineEmits(['select'])

// 搜索框的响应式关键字，trim 后参与多字段匹配。
const query = ref('')
// 当前申请类型筛选值，all 表示不限制类型。
const applicationFilter = ref('all')
// 根据待办数据实时生成筛选项及各类型数量。
const applicationFilters = computed(() => [
  { value: 'all', label: '全部', count: props.items.length },
  { value: '对公授信申请', label: '对公授信申请',
    count: props.items.filter((item) => item.applicationType === '对公授信申请').length },
  { value: '对公授信变更申请', label: '对公授信变更申请',
    count: props.items.filter((item) => item.applicationType === '对公授信变更申请').length },
  { value: '集团授信申请', label: '集团授信申请',
    count: props.items.filter((item) => item.applicationType === '集团授信申请').length },
  { value: '集团授信变更申请', label: '集团授信变更申请',
    count: props.items.filter((item) => item.applicationType === '集团授信变更申请').length },
  { value: '集团客户额度划分', label: '集团客户额度划分',
    count: props.items.filter((item) => item.applicationType === '集团客户额度划分').length },
  { value: '合作方授信申请', label: '合作方授信申请',
    count: props.items.filter((item) => item.applicationType === '合作方授信申请').length },
  { value: '合作方授信变更申请', label: '合作方授信变更申请',
    count: props.items.filter((item) => item.applicationType === '合作方授信变更申请').length },

  { value: '同业授信申请', label: '同业授信申请',
    count: props.items.filter((item) => item.applicationType === '同业授信申请').length },
  { value: '同业授信变更申请', label: '同业授信变更申请',
    count: props.items.filter((item) => item.applicationType === '同业授信变更申请').length },
])

// 同时应用关键字和申请类型条件，结果直接驱动卡片渲染。
const filteredItems = computed(() => {
  const keyword = query.value.trim().toLowerCase()
  return props.items.filter((item) => {
    const matchesKeyword = !keyword
      || [item.customer, item.id, item.applicationType, item.organization, item.applicantName]
        .some((value) => value.toLowerCase().includes(keyword))
    const matchesType = applicationFilter.value === 'all'
      || item.applicationType === applicationFilter.value
    return matchesKeyword && matchesType
  })
})
</script>

<template>
  <!-- 查询区、快捷筛选区和结果列表组成待办主视图。 -->
  <section class="page-view todo-view">
    <div class="search-row">
      <van-search
        v-model="query"
        shape="square"
        placeholder="搜索客户名称、流程申请编号"
        aria-label="搜索待办审批"
      />
    </div>

    <div class="quick-filters" role="tablist" aria-label="申请类型筛选">
      <button
        v-for="filter in applicationFilters"
        :key="filter.value"
        type="button"
        role="tab"
        :aria-selected="applicationFilter === filter.value"
        :class="{ active: applicationFilter === filter.value }"
        @click="applicationFilter = filter.value"
      >
        {{ filter.label }} <span>{{ filter.count }}</span>
      </button>
    </div>

    <div class="section-title">
      <h2>审批事项</h2>
      <span>共 {{ filteredItems.length }} 笔</span>
    </div>

    <div v-if="filteredItems.length" class="approval-grid">
      <ApprovalCard
        v-for="item in filteredItems"
        :key="item.id"
        :item="item"
        @select="$emit('select', $event)"
      />
    </div>
    <van-empty v-else image="search" description="没有符合条件的待办事项" />

    <template v-if="false">
      <div class="sheet-handle" />
      <div class="sheet-header">
        <h2>筛选条件</h2>
        <button type="button" aria-label="关闭筛选" @click="filterVisible = false">
          <van-icon name="cross" />
        </button>
      </div>
      <div class="filter-section">
        <h3>业务品种</h3>
        <div class="product-options">
          <button
            v-for="option in productOptions"
            :key="option"
            type="button"
            :class="{ active: draftProduct === option }"
            @click="draftProduct = option"
          >
            {{ option === 'all' ? '全部业务' : option }}
          </button>
        </div>
      </div>
      <div class="sheet-actions">
        <van-button block plain @click="resetFilter">重置</van-button>
        <van-button block type="primary" @click="applyFilter">查看结果</van-button>
      </div>
    </template>
  </section>
</template>

<style scoped>
/* 页面样式覆盖搜索框、横向筛选条及桌面端网格布局。 */

.search-row {
  margin-top: 5px;
}

.search-row :deep(.van-search) {
  width: 100%;
  padding: 0;
  background: transparent;
}

.search-row :deep(.van-search__content) {
  height: 42px;
  padding-left: 13px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.filter-button {
  position: relative;
  display: grid;
  flex: 0 0 40px;
  width: 40px;
  height: 40px;
  padding: 0;
  color: #454b54;
  font-size: 19px;
  background: #f7f8fa;
  border: 0;
  border-radius: 6px;
  place-items: center;
}

.filter-dot {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 6px;
  height: 6px;
  background: var(--brand-primary);
  border: 1px solid #fff;
  border-radius: 50%;
}

.quick-filters {
  display: flex;
  gap: 8px;
  margin: 12px 0 18px;
  padding: 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.quick-filters::-webkit-scrollbar {
  display: none;
}

.quick-filters button {
  flex: 0 0 auto;
  min-width: 68px;
  height: 34px;
  padding: 0 13px;
  color: #656c77;
  font-size: 13px;
  white-space: nowrap;
  background: #fff;
  border: 1px solid #e5e8ec;
  border-radius: 17px;
}

.quick-filters button.active {
  color: #fff;
  font-weight: 600;
  background: var(--brand-primary);
  border-color: var(--brand-primary);
  box-shadow: 0 4px 10px rgb(255 138 36 / 22%);
}

.quick-filters span {
  margin-left: 3px;
  color: #9298a2;
  font-size: 11px;
}

.quick-filters .active span {
  color: var(--brand-primary);
}

.filter-sheet {
  max-height: 76vh;
  max-height: 76dvh;
  padding: 8px 20px 0;
}

.sheet-handle {
  width: 34px;
  height: 4px;
  margin: 0 auto 12px;
  background: #d5d8dd;
  border-radius: 2px;
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sheet-header h2 {
  margin: 0;
  color: #20242b;
  font-size: 18px;
}

.sheet-header button {
  display: grid;
  width: 36px;
  height: 36px;
  padding: 0;
  color: #6d747e;
  font-size: 20px;
  background: transparent;
  border: 0;
  place-items: center;
}

.filter-section {
  padding: 20px 0 26px;
}

.filter-section h3 {
  margin: 0 0 12px;
  color: #4d545e;
  font-size: 13px;
  font-weight: 500;
}

.product-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 9px;
}

.product-options button {
  min-height: 40px;
  padding: 7px 8px;
  color: #555d67;
  font-size: 13px;
  background: #f4f5f7;
  border: 1px solid transparent;
  border-radius: 5px;
}

.product-options button.active {
  color: var(--brand-primary);
  background: var(--brand-primary-soft);
  border-color: var(--brand-primary-border);
}

.sheet-actions {
  display: grid;
  grid-template-columns: 1fr 1.5fr;
  gap: 10px;
  padding: 12px 0 calc(12px + env(safe-area-inset-bottom));
  border-top: 1px solid #eceef1;
}

@media (min-width: 720px) {
  .work-summary,
  .search-row,
  .quick-filters {
    width: 100%;
    max-width: none;
  }

  .filter-sheet {
    right: auto;
    left: 50%;
    width: min(600px, calc(100% - 48px));
    transform: translateX(-50%);
  }

  .product-options {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 380px) {
  .work-summary {
    grid-template-columns: 1.2fr repeat(3, 1fr);
  }
}

.search-row :deep(.van-search__field) {
  align-items: center;
  height: 100%;
  padding-top: 0;
  padding-bottom: 0;
}

.search-row :deep(.van-field__left-icon) {
  display: flex;
  align-items: center;
  align-self: stretch;
  line-height: normal;
}

.search-row :deep(.van-field__value),
.search-row :deep(.van-field__body),
.search-row :deep(.van-field__control) {
  height: 100%;
}

.search-row :deep(.van-field__control) {
  line-height: normal;
}

.quick-filters .active span {
  color: rgb(255 255 255 / 78%);
}

.approval-grid {
  gap: 12px;
  align-items: start;
}
</style>
