<script setup>
// 审批卡片：将不同申请类型的金额指标统一压缩成可扫描的列表项。
import { computed } from 'vue'
import { getApplicationTypeLabel } from '../data/approvals'

// 卡片接收单条审批记录及 todo/done 展示模式。
const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  mode: {
    type: String,
    default: 'todo',
  },
})

// 用户点击卡片时向父层传递原始审批记录。
defineEmits(['select'])

// 集团申请类型由数据层统一补充分项方式后缀。
const applicationTypeLabel = computed(() => getApplicationTypeLabel(props.item))

// 根据申请类型选择三项最有代表性的额度指标，避免卡片信息过载。
const metrics = computed(() => {
  if (props.item.applicationType === '同业授信变更申请') {
    return [
      { label: '批复授信总额(元)', value: props.item.approvedCreditTotal },
      { label: '授信总额(元)', value: props.item.creditTotal },
      { label: '批复敞口授信金额(元)', value: props.item.approvedExposureTotal },
    ]
  }
  if (props.item.applicationType === '同业授信申请') {
    return [
      { label: '授信总额(元)', value: props.item.creditTotal },
      { label: '授信敞口总额(元)', value: props.item.exposureTotal },
      { label: '批复授信总额(元)', value: props.item.approvedCreditTotal },
    ]
  }
  if (props.item.applicationType === '合作方授信变更申请') {
    return [
      { label: '批复合作方授信金额(元)', value: props.item.approvedPartnerTotal },
      { label: '合作方授信总额(元)', value: props.item.partnerTotal },
      { label: '批复授信总额(元)', value: props.item.approvedCreditTotal },
    ]
  }
  if (props.item.applicationType === '合作方授信申请') {
    return [
      { label: '合作方授信总额(元)', value: props.item.partnerTotal },
      { label: '授信总额(元)', value: props.item.creditTotal },
      { label: '批复合作方授信金额(元)', value: props.item.approvedPartnerTotal },
    ]
  }
  if (['对公授信变更申请', '集团授信变更申请'].includes(props.item.applicationType)) {
    return [
      { label: '批复授信总额(元)', value: props.item.approvedCreditTotal },
      { label: '批复敞口授信金额(元)', value: props.item.approvedExposureTotal },
      { label: '批复低风险金额(元)', value: props.item.approvedLowRiskTotal },
    ]
  }
  return [
    { label: '授信总额(元)', value: props.item.creditTotal },
    { label: '授信敞口总额(元)', value: props.item.exposureTotal },
    { label: '低风险总额(元)', value: props.item.lowRiskTotal },
  ]
})

// 金额以中文千分位格式展示；空值按 0 处理。
function formatAmount(value) {
  return Number(value || 0).toLocaleString('zh-CN')
}
</script>

<template>
  <!-- 卡片模板按顶部状态、客户主体、金额指标和底部编号分区。 -->
  <button :class="['approval-card', mode === 'todo' ? 'todo-card' : 'done-card']" type="button" @click="$emit('select', item)">
    <span class="card-main">
      <span class="card-topline">
        <span class="application-type">{{ applicationTypeLabel }}</span>
        <span
          v-if="mode === 'done'"
          class="result-label"
          :class="item.result"
        >
          <van-icon :name="item.result === 'passed' ? 'passed' : item.result === 'returned' ? 'replay' : 'close'" />
          {{ item.resultText }}
        </span>
        <span v-else class="initiated-at">
          <van-icon name="clock-o" />
          {{ item.initiatedAt }}
        </span>
      </span>

      <span class="customer-line">
        <span>
          <small>客户名称</small>
          <strong>{{ item.customer }}</strong>
        </span>
        <van-icon name="arrow" />
      </span>

      <span class="finance-grid">
        <span v-for="metric in metrics" :key="metric.label" class="finance-item">
          <small>{{ metric.label }}</small>
          <strong>{{ formatAmount(metric.value) }}</strong>
        </span>
      </span>

      <span v-if="mode === 'done'" class="card-note">{{ item.opinion }}</span>

      <span class="card-footer">
        <span>{{ item.id }}</span>
        <span>{{ item.organization }} · {{ item.applicantName }}</span>
      </span>
    </span>
  </button>
</template>

<style scoped>
/* 卡片样式包含状态色、金额网格以及移动端/桌面端布局微调。 */
.approval-card {
  position: relative;
  display: flex;
  width: 100%;
  min-width: 0;
  padding: 0;
  overflow: hidden;
  color: inherit;
  text-align: left;
  background: #fff;
  border: 1px solid #e7eaee;
  border-radius: 8px;
  box-shadow: 0 5px 18px rgb(24 31 43 / 5%);
  transition: border-color .2s ease, box-shadow .2s ease, transform .2s ease;
}

.approval-card:hover {
  border-color: var(--brand-primary-border);
  box-shadow: 0 8px 22px rgb(24 31 43 / 8%);
  transform: translateY(-1px);
}

.approval-card:active {
  background: #fafbfc;
  transform: translateY(1px);
}

.card-accent {
  flex: 0 0 3px;
  background: #bcc2cc;
}

.card-accent.today,
.card-accent.returned {
  background: #ed8b2d;
}

.card-accent.overdue,
.card-accent.rejected {
  background: #d52b32;
}

.card-accent.passed {
  background: #20865a;
}

.card-main {
  display: block;
  min-width: 0;
  width: 100%;
  padding: 15px 15px 12px 13px;
}

.card-topline,
.customer-line,
.amount-line,
.card-footer {
  display: flex;
  align-items: center;
}

.card-topline {
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 10px;
}

.product-tag {
  display: inline-block;
  max-width: 62%;
  overflow: hidden;
  padding: 0 7px;
  color: var(--brand-primary);
  font-size: 11px;
  font-weight: 600;
  line-height: 20px;
  white-space: nowrap;
  text-overflow: ellipsis;
  background: var(--brand-primary-soft);
  border-radius: 4px;
}

.deadline,
.result-label {
  flex: none;
  color: #767d88;
  font-size: 12px;
  line-height: 20px;
}

.deadline.today,
.result-label.returned {
  color: #bd6618;
}

.deadline.overdue,
.result-label.rejected {
  color: #c5262e;
}

.result-label.passed {
  color: #18784e;
}

.customer-line {
  justify-content: space-between;
  gap: 10px;
}

.customer-line strong {
  overflow: hidden;
  color: #20242b;
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.customer-line .van-icon {
  flex: none;
  color: #b4bac3;
  font-size: 14px;
}

.amount-line {
  min-width: 0;
  margin-top: 6px;
}

.amount {
  color: #20242b;
  font-size: 21px;
  font-weight: 650;
  line-height: 28px;
}

.amount-unit {
  margin: 4px 0 0 3px;
  color: #535a65;
  font-size: 12px;
}

.stage {
  margin-left: auto;
  padding-left: 12px;
  overflow: hidden;
  color: #535a65;
  font-size: 12px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.card-note {
  display: -webkit-box;
  margin-top: 11px;
  overflow: hidden;
  color: #767d88;
  font-size: 12px;
  line-height: 18px;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

.card-footer {
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
  padding-top: 10px;
  color: #9a9fa8;
  font-size: 11px;
  border-top: 1px solid #f0f1f3;
}

.card-footer span:last-child {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.card-accent {
  flex-basis: 4px;
  background: #cbd1d9;
}

.card-accent.today {
  background: var(--brand-primary);
}

.card-accent.returned {
  background: #ed8b2d;
}

.deadline.today {
  color: var(--brand-primary);
}

.approval-card {
  display: block;
}

.card-main {
  padding: 14px 15px 12px;
}

.card-topline {
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 13px;
}

.application-type {
  display: inline-block;
  flex: none;
  max-width: 46%;
  overflow: hidden;
  padding: 0 7px;
  color: var(--brand-primary);
  font-size: 11px;
  font-weight: 600;
  line-height: 20px;
  white-space: nowrap;
  text-overflow: ellipsis;
  background: var(--brand-primary-soft);
  border: 1px solid #ffe2c5;
  border-radius: 4px;
}

.initiated-at {
  min-width: 0;
  overflow: hidden;
  color: #767d88;
  font-size: 11px;
  line-height: 18px;
  text-align: right;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.customer-line {
  min-width: 0;
}

.customer-line > span {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.customer-line small,
.finance-item small {
  display: block;
  min-width: 0;
  overflow: hidden;
  color: #8a9099;
  font-size: 10px;
  line-height: 16px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.finance-grid {
  display: grid;
  grid-template-columns: 1.25fr 1.25fr .9fr;
  margin-top: 13px;
  padding: 12px 0;
  background: #fafbfc;
  border-top: 1px solid #f0f1f3;
  border-bottom: 1px solid #f0f1f3;
}
.todo-card .card-main {
  display: flex;
  height: 100%;
  flex-direction: column;
}

.todo-card {
  height: 204px;
}

.finance-item {
  display: flex;
  min-width: 0;
  padding: 0 5px;
  flex-direction: column;
}

.finance-item + .finance-item {
  border-left: 1px solid #e8eaee;
}

.finance-item strong {
  display: block;
  min-width: 0;
  overflow: hidden;
  margin-top: 2px;
  color: #2e343c;
  font-size: 14px;
  font-weight: 600;
  line-height: 21px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.card-footer {
  margin-top: 11px;
  padding-top: 0;
  border-top: 0;
}

@media (max-width: 380px) {
  .initiated-at {
    max-width: 148px;
  }

  .finance-item {
    padding-right: 4px;
    padding-left: 4px;
  }

  .finance-item strong {
    font-size: 12px;
  }
}
@media (max-width: 719px) {
  .finance-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .finance-item:nth-child(3) {
    display: none;
  }

}

</style>
