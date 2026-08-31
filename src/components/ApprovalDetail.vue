<script setup>
// 简化审批详情弹窗：用于兼容旧数据或轻量审批场景。
import { computed, ref, watch } from 'vue'
import { showToast } from 'vant'

// 父组件控制弹窗显示、当前审批记录以及只读/待办模式。
const props = defineProps({
  show: Boolean,
  item: {
    type: Object,
    default: null,
  },
  mode: {
    type: String,
    default: 'todo',
  },
})

// 通过 update:show 关闭弹窗，通过 decide 提交结论和意见。
const emit = defineEmits(['update:show', 'decide'])

// 当前选择的同意或退回动作；为空时显示操作按钮。
const decision = ref('')
// 审批意见文本，提交前必须经过非空校验。
const opinion = ref('')

// 将金额和币种拼接为详情摘要中的可读文案。
const amountText = computed(() => props.item
  ? `${props.item.amount.toLocaleString('zh-CN')} ${props.item.currency}`
  : '')

// 切换审批单时清空上一次残留的结论和意见。
watch(() => props.item?.id, () => {
  decision.value = ''
  opinion.value = ''
})

// 统一通过 v-model 事件通知父组件关闭弹窗。
function close() {
  emit('update:show', false)
}

// 选择动作后预填同意意见，退回则要求用户补充原因。
function chooseDecision(value) {
  decision.value = value
  opinion.value = value === 'passed' ? '同意申报方案，按批复条件落实。' : ''
}

// 校验意见后提交标准化 result/opinion 载荷。
function submit() {
  if (!opinion.value.trim()) {
    showToast(decision.value === 'passed' ? '请填写审批意见' : '请填写退回原因')
    return
  }
  emit('decide', { result: decision.value, opinion: opinion.value.trim() })
}
</script>

<template>
  <!-- 弹窗由标题栏、业务摘要、进度/结果区和底部操作区组成。 -->
  <van-popup
    :show="show"
    position="bottom"
    class="detail-popup"
    :close-on-popstate="true"
    :safe-area-inset-bottom="true"
    @update:show="$emit('update:show', $event)"
  >
    <article v-if="item" class="detail-shell">
      <header class="detail-header">
        <button type="button" aria-label="关闭详情" @click="close">
          <van-icon name="cross" />
        </button>
        <div>
          <h2>审批详情</h2>
          <span>{{ item.id }}</span>
        </div>
        <button type="button" aria-label="更多操作">
          <van-icon name="ellipsis" />
        </button>
      </header>

      <div class="detail-scroll">
        <section class="customer-summary">
          <div class="summary-title">
            <span>{{ item.product }}</span>
            <span v-if="mode === 'done'" class="done-result" :class="item.result">{{ item.resultText }}</span>
            <span v-else class="risk-label">{{ item.risk }}</span>
          </div>
          <h3>{{ item.customer }}</h3>
          <p>申请金额</p>
          <strong>{{ amountText }}</strong>
        </section>

        <section class="detail-section">
          <h3>业务信息</h3>
          <dl>
            <div><dt>业务品种</dt><dd>{{ item.product }}</dd></div>
            <div><dt>当前环节</dt><dd>{{ item.stage }}</dd></div>
            <div v-if="item.applicant"><dt>申报机构</dt><dd>{{ item.applicant }}</dd></div>
            <div v-if="item.submittedAt"><dt>提交时间</dt><dd>{{ item.submittedAt }}</dd></div>
            <div v-if="item.deadline"><dt>办理时限</dt><dd :class="item.urgency">{{ item.deadline }}</dd></div>
          </dl>
        </section>

        <section v-if="item.summary" class="detail-section">
          <h3>授信摘要</h3>
          <p class="summary-copy">{{ item.summary }}</p>
          <button class="document-link" type="button" @click="showToast('材料预览由后端接口提供')">
            <span><van-icon name="description-o" /> 申报材料与调查报告</span>
            <van-icon name="arrow" />
          </button>
        </section>

        <section class="detail-section">
          <h3>{{ mode === 'done' ? '审批结果' : '审批进度' }}</h3>
          <div v-if="mode === 'done'" class="opinion-block">
            <span :class="item.result">{{ item.resultText }}</span>
            <p>{{ item.opinion }}</p>
            <small>处理时间：{{ item.completedAt }}</small>
          </div>
          <div v-else class="timeline">
            <div class="timeline-item finished">
              <i><van-icon name="success" /></i>
              <div><strong>客户经理申报</strong><span>资料已提交并完成完整性检查</span></div>
            </div>
            <div class="timeline-item current">
              <i />
              <div><strong>{{ item.stage }}</strong><span>等待您处理</span></div>
            </div>
            <div class="timeline-item">
              <i />
              <div><strong>批复出具</strong><span>待当前环节通过后流转</span></div>
            </div>
          </div>
        </section>

        <section v-if="decision" class="decision-panel">
          <h3>{{ decision === 'passed' ? '填写审批意见' : '填写退回原因' }}</h3>
          <van-field
            v-model="opinion"
            type="textarea"
            rows="3"
            maxlength="200"
            show-word-limit
            autosize
            :placeholder="decision === 'passed' ? '请输入审批意见' : '请明确需要补充的材料或信息'"
          />
        </section>
      </div>

      <footer v-if="mode === 'todo'" class="decision-actions">
        <template v-if="!decision">
          <van-button block plain @click="chooseDecision('returned')">退回补充</van-button>
          <van-button block type="primary" @click="chooseDecision('passed')">同意</van-button>
        </template>
        <template v-else>
          <van-button block plain @click="decision = ''">取消</van-button>
          <van-button block type="primary" @click="submit">确认提交</van-button>
        </template>
      </footer>
    </article>
  </van-popup>
</template>

<style scoped>
/* 详情弹窗样式负责滚动容器、时间线、意见面板和响应式宽度。 */
.detail-popup {
  height: min(92vh, 920px);
  height: min(92dvh, 920px);
  overflow: hidden;
  background: #f6f7f9;
  border-radius: 10px 10px 0 0;
}

.detail-shell {
  display: flex;
  height: 100%;
  flex-direction: column;
}

.detail-header {
  display: grid;
  grid-template-columns: 40px 1fr 40px;
  align-items: center;
  flex: none;
  min-height: 58px;
  padding: 5px 8px;
  background: #fff;
  border-bottom: 1px solid #e9ebee;
}

.detail-header button {
  display: grid;
  width: 40px;
  height: 40px;
  padding: 0;
  color: #555c66;
  font-size: 20px;
  background: transparent;
  border: 0;
  place-items: center;
}

.detail-header div {
  min-width: 0;
  text-align: center;
}

.detail-header h2 {
  margin: 0;
  color: #22262d;
  font-size: 16px;
  font-weight: 600;
}

.detail-header span {
  display: block;
  margin-top: 2px;
  color: #999fa8;
  font-size: 9px;
}

.detail-scroll {
  flex: 1;
  padding: 12px 12px 24px;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.customer-summary {
  padding: 16px;
  background: #fff;
  border: 1px solid #e8eaee;
  border-radius: 8px;
}

.summary-title {
  display: flex;
  justify-content: space-between;
  color: #737a85;
  font-size: 11px;
}

.risk-label,
.done-result {
  padding: 2px 6px;
  color: #9b6419;
  background: #fff6e5;
  border-radius: 3px;
}

.done-result.passed { color: #18784e; background: #edf8f3; }
.done-result.returned { color: #a95c18; background: #fff5e8; }
.done-result.rejected { color: #c5262e; background: #fff0f1; }

.customer-summary h3 {
  margin: 10px 0 18px;
  color: #252930;
  font-size: 18px;
  line-height: 26px;
}

.customer-summary p {
  margin: 0 0 2px;
  color: #8a909a;
  font-size: 10px;
}

.customer-summary > strong {
  color: #252930;
  font-size: 26px;
  font-weight: 650;
}

.detail-section {
  margin-top: 12px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e8eaee;
  border-radius: 8px;
}

.detail-section > h3,
.decision-panel h3 {
  margin: 0 0 14px;
  color: #292e35;
  font-size: 14px;
  font-weight: 600;
}

.detail-section dl {
  margin: 0;
}

.detail-section dl div {
  display: grid;
  grid-template-columns: 88px 1fr;
  gap: 10px;
  padding: 8px 0;
  font-size: 12px;
}

.detail-section dt {
  color: #8b919b;
}

.detail-section dd {
  margin: 0;
  color: #393f47;
  text-align: right;
}

.detail-section dd.overdue {
  color: #c5262e;
}

.summary-copy {
  margin: 0;
  color: #636a75;
  font-size: 12px;
  line-height: 20px;
}

.document-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-top: 14px;
  padding: 12px 0 0;
  color: #4d5560;
  font-size: 12px;
  background: transparent;
  border: 0;
  border-top: 1px solid #eceef1;
}

.document-link span .van-icon {
  margin-right: 6px;
  color: var(--brand-primary);
  font-size: 16px;
  vertical-align: -2px;
}

.opinion-block > span {
  color: #c5262e;
  font-size: 12px;
  font-weight: 600;
}

.opinion-block > span.passed { color: #18784e; }
.opinion-block > span.returned { color: #a95c18; }

.opinion-block p {
  margin: 9px 0;
  color: #535a65;
  font-size: 12px;
  line-height: 19px;
}

.opinion-block small {
  color: #999fa8;
  font-size: 10px;
}

.timeline-item {
  position: relative;
  display: grid;
  grid-template-columns: 20px 1fr;
  gap: 9px;
  min-height: 58px;
}

.timeline-item:not(:last-child)::before {
  position: absolute;
  top: 18px;
  bottom: -1px;
  left: 7px;
  width: 1px;
  background: #dfe2e6;
  content: '';
}

.timeline-item i {
  position: relative;
  z-index: 1;
  display: grid;
  width: 15px;
  height: 15px;
  color: #fff;
  font-size: 9px;
  background: #c5cad1;
  border: 3px solid #fff;
  border-radius: 50%;
  box-shadow: 0 0 0 1px #c5cad1;
  place-items: center;
}

.timeline-item.finished i { background: #23815a; box-shadow: 0 0 0 1px #23815a; }
.timeline-item.current i { background: var(--brand-primary); box-shadow: 0 0 0 1px var(--brand-primary); }

.timeline-item div {
  display: flex;
  flex-direction: column;
}

.timeline-item strong {
  color: #3b4149;
  font-size: 12px;
  font-weight: 500;
}

.timeline-item span {
  margin-top: 3px;
  color: #9ba0a9;
  font-size: 10px;
}

.decision-panel {
  margin-top: 12px;
  padding: 16px;
  background: #fff;
  border: 1px solid #e8eaee;
  border-radius: 8px;
}

.decision-panel :deep(.van-cell) {
  padding: 10px;
  background: #f7f8f9;
  border: 1px solid #e5e7ea;
  border-radius: 5px;
}

.decision-actions {
  display: grid;
  grid-template-columns: 1fr 1.6fr;
  flex: none;
  gap: 10px;
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1px solid #e4e6e9;
}

@media (min-width: 720px) {
  .detail-popup {
    right: auto;
    left: 50%;
    width: min(720px, calc(100% - 48px));
    height: min(86vh, 860px);
    height: min(86dvh, 860px);
    transform: translateX(-50%);
  }

  .detail-scroll {
    padding-right: 20px;
    padding-left: 20px;
  }
}
</style>
