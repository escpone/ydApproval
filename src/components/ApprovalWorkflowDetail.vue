<script setup>
// 审批工作流详情：按岗位和申请类型动态生成分段表单，并统一提交审批结论。
import { computed, ref, watch } from 'vue'
import { showToast } from 'vant'
import { loginUsers } from '../data/loginUsers'
import { getApplicationTypeLabel } from '../data/approvals'
import CreditNoticeDocument from './CreditNoticeDocument.vue'

// show/item/mode/currentRole 分别控制弹窗、单据、只读状态和岗位权限。
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
  currentRole: {
    type: String,
    default: '',
  },
})

// 对外提供关闭、审批提交和分段保存三类事件。
const emit = defineEmits(['update:show', 'decide', 'save'])

// 普通授信基础页需要展示的总额、敞口、低风险和合作方金额字段。
const amountFields = [
  { key: 'creditTotal', label: '授信总额(元)' },
  { key: 'lowRiskTotal', label: '低风险总额(元)' },
  { key: 'approvedCreditTotal', label: '批复授信总额(元)' },
  { key: 'approvedLowRiskTotal', label: '批复低风险授信金额(元)' },
  { key: 'exposureTotal', label: '授信敞口总额(元)' },
  { key: 'partnerTotal', label: '合作方总额(元)' },
  { key: 'approvedExposureTotal', label: '批复敞口授信金额(元)' },
  { key: 'approvedPartnerTotal', label: '批复合作方授信金额(元)' },
]

// 非委员会岗位使用的审批结论选项。
const conclusionOptions = ['同意', '打回', '否决']
const voteOptions = ['同意', '有条件同意', '再议', '否决']
const voteResultOptions = ['同意', '有条件同意', '再议', '否决']
// 可被选择为有权审批人的岗位白名单。
const authorizedApproverRoles = [
  '总行有权审批人',
  '风险管理部总经理',
  '董事会风险管理办公室主任',
]
const authorizedApprovers = loginUsers.filter((user) => authorizedApproverRoles.includes(user.role))

// 当前详情页签；切换单据或岗位时会重置为 basic。
const activeSection = ref('basic')
// 工作流编辑副本，所有输入先写入 draft，提交时再整体回传。
const draft = ref(createDraft())

// 岗位在登录清单中的顺序用于控制汇总意见等后续页签。
const roleIndex = computed(() => loginUsers.findIndex((user) => user.role === props.currentRole))
const isCommitteeMember = computed(() => props.currentRole === '总行统一授信审批委员会委员')
// 识别集团申请并切换集团专属额度/成员页签。
const isGroupApplication = computed(() => props.item?.applicationType?.startsWith('集团'))
const isPartnerApplication = computed(() => props.item?.applicationType?.startsWith('合作方'))
const isInterbankApplication = computed(() => props.item?.applicationType?.startsWith('同业授信'))
// 合作方和同业申请共用合作额度展示路径。
const isPartnerLikeApplication = computed(() => isPartnerApplication.value || isInterbankApplication.value)
// 将集团分配方式转换为数字，供 showGroupQuota 判断。
const groupCreditApplicationType = computed(() => Number(props.item?.groupCreditApplicationType || 0))
// 仅“先批后分”类型显示集团额度分项页。
const showGroupQuota = computed(() => isGroupApplication.value && groupCreditApplicationType.value === 2)
const applicationTypeLabel = computed(() => getApplicationTypeLabel(props.item))
const partnerAmountFields = [
  { key: 'partnerTotal', label: '合作方授信总额(元)' },
  { key: 'approvedPartnerTotal', label: '批复合作方授信金额(元)' },
]

const summaryFields = [
  { key: 'creditOpinion', label: '授信意见' },
  { key: 'preLoanRequirements', label: '放款前要求' },
  { key: 'managementRequirements', label: '管理要求' },
]

const groupMemberFields = [
  { key: 'customer', label: '客户名称' },
  { key: 'creditTotal', label: '授信总额（元）', format: 'amount' },
  { key: 'exposureTotal', label: '授信敞口总额（元）', format: 'amount' },
  { key: 'lowRiskTotal', label: '低风险总额（元）', format: 'amount' },
  { key: 'partnerTotal', label: '合作方总额（元）', format: 'amount' },
  { key: 'approvedExposureTotal', label: '批复敞口授信金额（元）', format: 'amount' },
  { key: 'approvedLowRiskTotal', label: '批复低风险授信金额（元）', format: 'amount' },
  { key: 'approvedPartnerTotal', label: '批复合作方授信金额（元）', format: 'amount' },
  { key: 'manager', label: '主管客户经理' },
]
// 汇总岗位负责编辑汇总意见和额度分项。
const isSummaryRole = computed(() => props.currentRole === '统一授信委员会汇总')
const isReviewRole = computed(() => props.currentRole === '授信会意见复核')
// 通知书复核岗和秘书岗可查看通知书页签。
const isNoticeRole = computed(() => ['授信通知书复核岗', '秘书岗'].includes(props.currentRole))
const isSecretary = computed(() => props.currentRole === '秘书岗')
const showSummaryOpinion = computed(() => roleIndex.value >= 3)
const showNotice = computed(() => isNoticeRole.value)
// 已办模式完全只读；待办模式再叠加岗位级细粒度权限。
const canEdit = computed(() => props.mode === 'todo')
const canEditQuota = computed(() => canEdit.value && isSummaryRole.value)
const canEditSummary = computed(() => canEdit.value && isSummaryRole.value)
const canEditApprover = computed(() => canEdit.value && (isSummaryRole.value || isReviewRole.value))
const canEditNotice = computed(() => canEdit.value && isSecretary.value)
const canEditDates = computed(() => canEdit.value && isNoticeRole.value)
// 根据页签和岗位决定保存操作模式，供底部按钮与页签提示共用。
function getSectionFooterMode(sectionKey) {
  if (!canEdit.value) return ''
  if (sectionKey === 'quota' && canEditQuota.value) return 'quota'
  if (sectionKey === 'memberQuota' && isGroupApplication.value && isSummaryRole.value) return 'member-quota'
  if (sectionKey === 'summary' && canEditSummary.value) return 'summary'
  if (sectionKey === 'notice' && canEditNotice.value) return 'notice'
  if (sectionKey === 'approval') return 'approval'
  return ''
}

const footerMode = computed(() => getSectionFooterMode(activeSection.value))


// 构建页签列表：集团、合作方/同业和后续岗位拥有不同组合。
const sections = computed(() => {
  const result = isGroupApplication.value
    ? [
        { key: 'basic', label: '基本信息' },
        ...(showGroupQuota.value ? [{ key: 'groupQuota', label: '集团授信分项信息' }] : []),
        { key: 'memberList', label: '成员授信列表信息' },
        { key: 'memberQuota', label: '成员授信分项信息' },
        { key: 'deliberation', label: '审议事项' },
      ]
    : [
        { key: 'basic', label: '基本信息' },
        ...(!isPartnerLikeApplication.value ? [{ key: 'quota', label: '额度分项信息' }] : []),
        { key: 'deliberation', label: '审议事项' },
      ]
  if (showSummaryOpinion.value) result.push({ key: 'summary', label: '授信会汇总意见' })
  if (showNotice.value) result.push({ key: 'notice', label: '授信通知书' })
  result.push({ key: 'approval', label: '审批信息' })
  return result
})

// 当单据、岗位或模式变化时重建独立草稿并回到基础信息页。
watch(
  [
    () => props.item?.id,
    () => props.currentRole,
    () => props.mode,
  ],
  () => {
    draft.value = createDraft(props.item)
    activeSection.value = 'basic'
  },
  { immediate: true },
)

// 深拷贝可编辑数组和嵌套对象，并为缺失字段补充表单默认值。
function createDraft(item = null) {
  const source = item || {}
  return {
    ...source,
    quotaItems: (source.quotaItems || []).map((entry) => ({ ...entry })),
    groupQuotaItems: (source.groupQuotaItems || []).map((entry) => ({ ...entry })),
    groupMembers: (source.groupMembers || []).map((entry) => ({ ...entry })),
    memberQuotaItems: (source.memberQuotaItems || []).map((entry) => ({ ...entry })),
    partnerQuotaItems: (source.partnerQuotaItems || []).map((entry) => ({ ...entry })),
    deliberation: {
      matter: '',
      preLoanRequirements: '',
      managementRequirements: '',
      ...(source.deliberation || {}),
    },
    summaryOpinion: {
      creditOpinion: '',
      preLoanRequirements: '',
      managementRequirements: '',
      ...(source.summaryOpinion || {}),
    },
    notice: {
      formCode: 'ZZB-3-7.5.5/2　F-04',
      noticeNo: '郑银审2026A00141',
      deliveryOrg: '滨河分行营业部',
      creditType: '综合授信额度',
      creditRating: 'BBB+',
      creditAmountUppercase: '贰亿零壹佰玖拾捌万元',
      creditAmountWan: '20,199.00',
      exposureAmountUppercase: '贰亿零壹佰玖拾捌万元',
      exposureAmountWan: '20,199.00',
      creditConditions: '1',
      preLoanRequirements: '2',
      managementRequirements: '3',
      finalOpinion: '同意',
      effectiveDate: '2026-03-05',
      expiryDate: '2027-03-04',
      ...(source.notice || {}),
    },
    approvalInfo: {
      systemVote: '',
      manualVote: '',
      authorizedApprover: '',
      conclusion: '',
      opinion: '',
      voteConclusion: '',
      voteOpinion: '',
      ...(source.approvalInfo || {}),
    },
  }
}

// 关闭详情弹窗，不修改父组件中的选中单据。
function close() {
  emit('update:show', false)
}

// 工作流金额统一保留两位小数，适合输入前后的对照显示。
function formatAmount(value) {
  return Number(value || 0).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

// 将分段按钮选择写入 approvalInfo 对应字段。
function chooseValue(field, value) {
  draft.value.approvalInfo[field] = value
}

// 保存当前草稿快照，并按页签给出用户反馈。
function saveSection(section) {
  const messages = {
    quota: '额度分项信息已保存',
    memberQuota: '成员授信分项信息已保存',
    summary: '授信会汇总意见已保存',
    notice: '终审意见已保存',
    approval: '审批信息已保存',
  }
  emit('save', { section, form: draft.value })
  showToast(messages[section])
}

// 按岗位选择结论来源，校验意见/日期后转换为统一结果码提交。
function submit() {
  const info = draft.value.approvalInfo
  const conclusion = isCommitteeMember.value ? info.voteConclusion : info.conclusion
  const opinion = isCommitteeMember.value ? info.voteOpinion : info.opinion

  if (!conclusion) {
    showToast(isCommitteeMember.value ? '请选择投票结论' : '请选择审批结论')
    activeSection.value = 'approval'
    return
  }
  if (!opinion?.trim()) {
    showToast(isCommitteeMember.value ? '请填写投票意见' : '请填写审批意见')
    activeSection.value = 'approval'
    return
  }
  if (isNoticeRole.value && (!draft.value.notice.effectiveDate || !draft.value.notice.expiryDate)) {
    showToast('请选择授信起始日期和到期日期')
    activeSection.value = 'approval'
    return
  }

  const result = conclusion === '否决'
    ? 'rejected'
    : ['打回', '再议'].includes(conclusion) ? 'returned' : 'passed'
  emit('decide', {
    result,
    resultText: conclusion,
    opinion: opinion.trim(),
    form: draft.value,
  })
}
</script>

<template>
  <!-- 右侧抽屉承载完整工作流，内部滚动以保留标题和操作区。 -->
  <van-popup
    :show="show"
    position="right"
    class="workflow-popup"
    :close-on-popstate="true"
    :safe-area-inset-bottom="true"
    @update:show="$emit('update:show', $event)"
  >
    <article v-if="item" class="workflow-shell">
      <!-- 标题栏提供返回、申请类型和当前岗位标识。 -->
      <header class="workflow-header">
        <button type="button" aria-label="返回待办列表" @click="close">
          <van-icon name="arrow-left" />
        </button>
        <div>
          <h2>授信审批详情</h2>
          <span>{{ item.id }}</span>
        </div>
        <span class="role-chip">{{ currentRole }}</span>
      </header>

      <div class="case-strip">
        <div>
          <span>{{ applicationTypeLabel }}</span>
          <strong>{{ item.customer }}</strong>
        </div>
        <div>
          <small>流程发起时间</small>
          <span>{{ item.initiatedAt }}</span>
        </div>
      </div>

      <!-- 页签区根据 computed sections 动态渲染不同业务阶段。 -->
      <nav class="detail-tabs" aria-label="详情内容">
        <button
          v-for="section in sections"
          :key="section.key"
          type="button"
          :class="{ active: activeSection === section.key }"
          @click="activeSection = section.key"
        >
          <van-badge
            :dot="Boolean(getSectionFooterMode(section.key))"
            position="top-right"
            tag="span"
            color="var(--van-danger-color)"
          >
            <span class="detail-tab-label">{{ section.label }}</span>
          </van-badge>
        </button>
      </nav>

      <div class="workflow-scroll">
        <!-- 内容区按当前页签分支渲染；每个分支都复用统一 section-heading。 -->
        <div class="content-wrap">
          <section v-if="activeSection === 'basic'" class="content-panel">
            <header class="section-heading">
              <div>
                <span>申请主体</span>
                <!-- 基础信息分支：确认客户主体和核心额度概览。 -->
                <h3>基本信息</h3>
              </div>
              <van-icon name="records-o" />
            </header>

                        <dl v-if="isPartnerLikeApplication" class="identity-grid partner-identity-grid">
              <div>
                <dt>客户名称</dt>
                <dd>{{ item.customer }}</dd>
              </div>
              <div>
                <dt>申请金额</dt>
                <dd>{{ formatAmount(item.creditTotal || item.partnerTotal) }}</dd>
              </div>
              <div>
                <dt>管理机构</dt>
                <dd>{{ item.organization }}</dd>
              </div>
              <div>
                <dt>客户经理</dt>
                <dd>{{ item.customerManager || item.applicantName }}</dd>
              </div>
              <div>
                <dt>支行审查岗</dt>
                <dd>{{ item.branchReviewer || '—' }}</dd>
              </div>
              <div>
                <dt>支行行长</dt>
                <dd>{{ item.branchPresident || '—' }}</dd>
              </div>
            </dl>
            <template v-else>
              <dl class="identity-grid">
                <div>
                  <dt>{{ isGroupApplication ? '集团名称' : '客户名称' }}</dt>
                  <dd>{{ isGroupApplication ? (item.groupName || item.customer) : item.customer }}</dd>
                </div>
                <div>
                  <dt>所属机构</dt>
                  <dd>{{ item.organization }}</dd>
                </div>
              </dl>

              <h4 class="subheading">{{ isGroupApplication ? '集团授信金额' : '授信金额' }}</h4>
              <dl class="amount-grid">
                <div v-for="field in amountFields" :key="field.key">
                  <dt>{{ field.label }}</dt>
                  <dd>{{ formatAmount(item[field.key]) }}</dd>
                </div>
              </dl>
            </template></section>

          <section v-else-if="activeSection === 'quota' && !isGroupApplication" class="content-panel">
            <header class="section-heading">
              <div>
                <span>额度结构</span>
                <!-- 普通额度分支：逐项对照申请金额、期限和批复金额。 -->
                <h3>额度分项信息</h3>
              </div>
              <span class="record-count">共 {{ isPartnerApplication ? draft.partnerQuotaItems.length : draft.quotaItems.length }} 项</span>
            </header>

            <div v-if="isPartnerLikeApplication" class="quota-list partner-quota-list">
              <article v-for="(quota, index) in draft.partnerQuotaItems" :key="quota.id" class="quota-item partner-quota-item">
                <header>
                  <span>{{ String(index + 1).padStart(2, '0') }}</span>
                  <div>
                    <strong>{{ quota.partnerType }}</strong>
                    <small>{{ quota.partnerCategory }}</small>
                  </div>
                </header>
                <dl class="group-field-grid partner-quota-grid">
                  <div><dt>合作方类型</dt><dd>{{ quota.partnerType }}</dd></div>
                  <div><dt>合作方细类</dt><dd>{{ quota.partnerCategory }}</dd></div>
                  <div><dt>授信金额（元）</dt><dd>{{ formatAmount(quota.appliedAmount) }}</dd></div>
                  <div>
                    <dt>批复授信金额（元）</dt>
                    <dd>
                      <input v-if="canEditQuota" v-model.number="quota.approvedAmount" type="number" inputmode="decimal">
                      <span v-else>{{ formatAmount(quota.approvedAmount) }}</span>
                    </dd>
                  </div>
                </dl>
              </article>
            </div>

            <div v-else class="quota-list">
              <article v-for="(quota, index) in draft.quotaItems" :key="quota.id" class="quota-item">
                <header>
                  <span>{{ String(index + 1).padStart(2, '0') }}</span>
                  <div>
                    <strong>{{ quota.quotaType }}</strong>
                    <small>{{ quota.productName }}</small>
                  </div>
                </header>
                <dl class="quota-grid">
                  <div><dt>授信金额(元)</dt><dd>{{ formatAmount(quota.appliedAmount) }}</dd></div>
                  <div><dt>期限</dt><dd>{{ quota.term }}</dd></div>
                  <div><dt>是否允许被串用</dt><dd>{{ quota.allowShared }}</dd></div>
                </dl>
                <div class="approved-fields">
                  <label>
                    <span>批复授信金额(元)</span>
                    <input
                      v-if="canEditQuota"
                      v-model.number="quota.approvedAmount"
                      type="number"
                      inputmode="decimal"
                    >
                    <strong v-else>{{ formatAmount(quota.approvedAmount) }}</strong>
                  </label>
                  <label>
                    <span>批复期限</span>
                    <input v-if="canEditQuota" v-model="quota.approvedTerm" type="text">
                    <strong v-else>{{ quota.approvedTerm }}</strong>
                  </label>
                  <label>
                    <span>批复是否允许被串用</span>
                    <select v-if="canEditQuota" v-model="quota.approvedShared">
                      <option value="是">是</option>
                      <option value="否">否</option>
                    </select>
                    <strong v-else>{{ quota.approvedShared }}</strong>
                  </label>
                </div>
              </article>
            </div>
          </section>

          <section v-else-if="activeSection === 'groupQuota' && showGroupQuota" class="content-panel">
            <header class="section-heading">
              <div>
                <span>集团额度结构</span>
                <!-- 集团总额分支：展示集团层面的额度拆分。 -->
                <h3>集团授信分项信息</h3>
              </div>
              <span class="record-count">共 {{ draft.groupQuotaItems.length }} 项</span>
            </header>
            <div class="group-record-list">
              <article v-for="(quota, index) in draft.groupQuotaItems" :key="quota.id" class="group-record">
                <header class="group-record-header">
                  <span>{{ String(index + 1).padStart(2, '0') }}</span>
                  <strong>{{ quota.quotaType }}</strong>
                </header>
                <dl class="group-field-grid three-columns">
                  <div><dt>额度分类类型</dt><dd>{{ quota.quotaType }}</dd></div>
                  <div><dt>授信金额（元）</dt><dd>{{ formatAmount(quota.appliedAmount) }}</dd></div>

                </dl>
              </article>
            </div>
          </section>

          <section v-else-if="activeSection === 'memberList'" class="content-panel">
            <header class="section-heading">
              <div>
                <span>集团成员</span>
                <!-- 成员列表分支：核对集团成员及其授信汇总。 -->
                <h3>成员授信列表信息</h3>
              </div>
              <span class="record-count">共 {{ draft.groupMembers.length }} 户</span>
            </header>
            <div class="group-record-list">
              <article v-for="(member, index) in draft.groupMembers" :key="member.id" class="group-record member-record">
                <header class="group-record-header">
                  <span>{{ String(index + 1).padStart(2, '0') }}</span>
                  <strong>{{ member.customer }}</strong>
                </header>
                <dl class="group-field-grid member-field-grid">
                  <div v-for="field in groupMemberFields" :key="field.key">
                    <dt>{{ field.label }}</dt>
                    <dd>{{ field.format === 'amount' ? formatAmount(member[field.key]) : member[field.key] }}</dd>
                  </div>
                </dl>
              </article>
            </div>
          </section>

          <section v-else-if="activeSection === 'memberQuota'" class="content-panel">
            <header class="section-heading">
              <div>
                <span>成员额度结构</span>
                <!-- 成员额度分支：核对成员产品级额度和可串用属性。 -->
                <h3>成员授信分项信息</h3>
              </div>
              <span v-if="canEdit && isGroupApplication && isSummaryRole" class="edit-badge">可编辑</span>
              <span v-else class="record-count">共 {{ draft.memberQuotaItems.length }} 项</span>
            </header>
            <div class="group-record-list">
              <article v-for="(quota, index) in draft.memberQuotaItems" :key="quota.id" class="group-record member-quota-record">
                <header class="group-record-header">
                  <span>{{ String(index + 1).padStart(2, '0') }}</span>
                  <div>
                    <strong>{{ quota.memberName }}</strong>
                    <small>{{ quota.productName }}</small>
                  </div>
                </header>
                <dl class="group-field-grid member-quota-grid">
                  <div><dt>额度分类类型</dt><dd>{{ quota.quotaType }}</dd></div>
                  <div><dt>授信产品名称</dt><dd>{{ quota.productName }}</dd></div>
                  <div><dt>授信金额（元）</dt><dd>{{ formatAmount(quota.appliedAmount) }}</dd></div>
                  <div><dt>期限（月）</dt><dd>{{ quota.term }}</dd></div>
                  <div><dt>是否允许被串用</dt><dd>{{ quota.allowShared }}</dd></div>
                  <div>
                    <dt>批复授信金额（元）</dt>
                    <dd>
                      <input v-if="canEdit && isGroupApplication && isSummaryRole" v-model.number="quota.approvedAmount" type="number" inputmode="decimal">
                      <span v-else>{{ formatAmount(quota.approvedAmount) }}</span>
                    </dd>
                  </div>
                  <div>
                    <dt>批复期限（月）</dt>
                    <dd>
                      <input v-if="canEdit && isGroupApplication && isSummaryRole" v-model="quota.approvedTerm" type="text">
                      <span v-else>{{ quota.approvedTerm }}</span>
                    </dd>
                  </div>
                  <div>
                    <dt>批复是否允许被串用</dt>
                    <dd>
                      <select v-if="canEdit && isGroupApplication && isSummaryRole" v-model="quota.approvedShared">
                        <option value="是">是</option>
                        <option value="否">否</option>
                      </select>
                      <span v-else>{{ quota.approvedShared }}</span>
                    </dd>
                  </div>

                </dl>
              </article>
            </div>
          </section>
          <section v-else-if="activeSection === 'deliberation'" class="content-panel">
            <header class="section-heading">
              <div>
                <span>申报方案</span>
                <!-- 审议事项分支：维护授信条件和贷后管理文字。 -->
                <h3>审议事项</h3>
              </div>
              <van-icon name="description-o" />
            </header>
            <dl class="long-copy-list">
              <div>
                <dt>审议事项</dt>
                <dd>{{ draft.deliberation.matter }}</dd>
              </div>
              <div>
                <dt>放款前要求</dt>
                <dd>{{ draft.deliberation.preLoanRequirements }}</dd>
              </div>
              <div>
                <dt>管理要求</dt>
                <dd>{{ draft.deliberation.managementRequirements }}</dd>
              </div>
            </dl>
          </section>

          <section v-else-if="activeSection === 'summary'" class="content-panel">
            <header class="section-heading">
              <div>
                <span>会议结论</span>
                <!-- 汇总意见分支：承接后续岗位的统一授信意见。 -->
                <h3>授信会汇总意见</h3>
              </div>
              <span v-if="canEditSummary" class="edit-badge">可编辑</span>
            </header>
            <div class="textarea-list">
              <label v-for="field in summaryFields" :key="field.key">
                <span>{{ field.label }}</span>
                <textarea
                  v-if="canEditSummary"
                  v-model="draft.summaryOpinion[field.key]"
                  rows="4"
                  maxlength="500"
                />
                <p v-else>{{ draft.summaryOpinion[field.key] }}</p>
              </label>
            </div>
          </section>

          <section v-else-if="activeSection === 'notice'" class="notice-section">
            <CreditNoticeDocument
              :item="item"
              :notice="draft.notice"
              :editable="canEditNotice"
              :group="isGroupApplication"
              :partner="isPartnerLikeApplication"
              :group-credit-type="groupCreditApplicationType"
              :final-opinion="draft.notice.finalOpinion"
              @update:final-opinion="draft.notice.finalOpinion = $event"
            />
            <!-- 保留旧版通知书结构作为迁移参考，当前由 CreditNoticeDocument 渲染。 -->
            <div v-if="false" class="notice-paper legacy-notice">
              <header>
                <span>郑州银行股份有限公司</span>
                <!-- 通知书分支：将草稿字段映射到可编辑纸质文档。 -->
                <h3>授信通知书</h3>
                <small>{{ draft.notice.noticeNo }}</small>
              </header>
              <p class="notice-recipient">{{ item.organization }}：</p>
              <p>
                经郑州银行统一授信审批程序审议，同意给予
                <strong>{{ item.customer }}</strong>
                对公授信。请严格按照本通知书载明的批复额度、期限及管理要求办理相关业务。
              </p>
              <dl>
                <div><dt>客户名称</dt><dd>{{ item.customer }}</dd></div>
                <div><dt>批复授信总额</dt><dd>{{ formatAmount(item.approvedCreditTotal) }} 元</dd></div>
                <div><dt>批复低风险授信金额</dt><dd>{{ formatAmount(item.approvedLowRiskTotal) }} 元</dd></div>
                <div><dt>批复敞口授信金额</dt><dd>{{ formatAmount(item.approvedExposureTotal) }} 元</dd></div>
                <div><dt>批复合作方授信金额</dt><dd>{{ formatAmount(item.approvedPartnerTotal) }} 元</dd></div>
              </dl>
              <div class="notice-opinion">
                <span>终审意见</span>
                <textarea
                  v-if="canEditNotice"
                  v-model="draft.notice.finalOpinion"
                  rows="4"
                  maxlength="500"
                />
                <p v-else>{{ draft.notice.finalOpinion }}</p>
              </div>
              <footer>
                <span>郑州银行股份有限公司</span>
                <span>2026年08月24日</span>
              </footer>
            </div>
          </section>

          <section v-else class="content-panel approval-panel">
            <header class="section-heading">
              <div>
                <span>当前审批节点</span>
                <h3>{{ currentRole }}</h3>
              </div>
              <span v-if="mode === 'done'" class="read-badge">已办理</span>
              <span v-else class="edit-badge">待办理</span>
            </header>

            <!-- 委员会委员使用投票结论和投票意见字段。 -->
            <div v-if="isCommitteeMember" class="approval-form">
              <label class="form-group">
                <span>投票结论</span>
                <div class="segment-options">
                  <button
                    v-for="option in voteOptions"
                    :key="option"
                    type="button"
                    :disabled="!canEdit"
                    :class="{ active: draft.approvalInfo.voteConclusion === option }"
                    @click="chooseValue('voteConclusion', option)"
                  >
                    {{ option }}
                  </button>
                </div>
              </label>
              <label class="form-group">
                <span>投票意见</span>
                <textarea
                  v-model="draft.approvalInfo.voteOpinion"
                  :readonly="!canEdit"
                  rows="5"
                  maxlength="500"
                  placeholder="请输入投票意见"
                />
              </label>
            </div>

            <!-- 其他岗位使用常规审批结论、意见及有权审批人字段。 -->
            <div v-else class="approval-form">
              <template v-if="isSummaryRole || isReviewRole">
                <label class="form-group">
                  <span>系统投票结论</span>
                  <strong class="readonly-control">{{ draft.approvalInfo.systemVote }}</strong>
                </label>
                <label class="form-group">
                  <span>人工投票结论</span>
                  <select
                    v-if="isSummaryRole && canEdit"
                    v-model="draft.approvalInfo.manualVote"
                  >
                    <option v-for="option in voteResultOptions" :key="option" :value="option">
                      {{ option }}
                    </option>
                  </select>
                  <strong v-else class="readonly-control">{{ draft.approvalInfo.manualVote }}</strong>
                </label>
                <label class="form-group">
                  <span>有权审批人</span>
                  <select v-if="canEditApprover" v-model="draft.approvalInfo.authorizedApprover">
                    <option
                      v-for="person in authorizedApprovers"
                      :key="person.userName"
                      :value="person.userName"
                    >
                      {{ person.userName }}-{{ person.role }}
                    </option>
                  </select>
                  <strong v-else class="readonly-control">
                    {{ draft.approvalInfo.authorizedApprover }}
                  </strong>
                </label>
              </template>

              <div v-if="isNoticeRole" class="date-grid">
                <label class="form-group">
                  <span>授信起始日期</span>
                  <input
                    v-model="draft.notice.effectiveDate"
                    type="date"
                    :readonly="!canEditDates"
                  >
                </label>
                <label class="form-group">
                  <span>授信到期日期</span>
                  <input
                    v-model="draft.notice.expiryDate"
                    type="date"
                    :readonly="!canEditDates"
                  >
                </label>
              </div>

              <label class="form-group">
                <span>审批结论</span>
                <div class="segment-options three">
                  <button
                    v-for="option in conclusionOptions"
                    :key="option"
                    type="button"
                    :disabled="!canEdit"
                    :class="{ active: draft.approvalInfo.conclusion === option }"
                    @click="chooseValue('conclusion', option)"
                  >
                    {{ option }}
                  </button>
                </div>
              </label>
              <label class="form-group">
                <span>审批意见</span>
                <textarea
                  v-model="draft.approvalInfo.opinion"
                  :readonly="!canEdit"
                  rows="5"
                  maxlength="500"
                  placeholder="请输入审批意见"
                />
              </label>
            </div>
          </section>
        </div>
      </div>

      <!-- 当前页签有编辑权限时显示保存/提交操作栏。 -->
      <footer v-if="footerMode" class="workflow-actions" :class="'mode-' + footerMode">
        <van-button
          v-if="footerMode === 'quota'"
          type="primary"
          @click="saveSection('quota')"
        >
          保存额度分项信息
        </van-button>
        <van-button
          v-else-if="footerMode === 'member-quota'"
          type="primary"
          @click="saveSection('memberQuota')"
        >
          保存成员授信分项信息
        </van-button>
        <van-button
          v-else-if="footerMode === 'summary'"
          type="primary"
          @click="saveSection('summary')"
        >
          保存授信会汇总意见
        </van-button>
        <van-button
          v-else-if="footerMode === 'notice'"
          type="primary"
          @click="saveSection('notice')"
        >
          保存终审意见
        </van-button>
        <template v-else>
          <van-button plain @click="close">取消</van-button>
          <van-button plain type="primary" @click="saveSection('approval')">保存</van-button>
          <van-button type="primary" @click="submit">提交审批</van-button>
        </template>
      </footer>
      <footer v-if="false" class="workflow-actions">
        <van-button plain @click="close">取消</van-button>
        <van-button type="primary" @click="submit">提交审批</van-button>
      </footer>
    </article>
  </van-popup>
</template>

<style scoped>
/* 工作流样式覆盖抽屉、页签、额度表格、通知书和底部动作区。 */
.workflow-popup {
  width: 100%;
  height: 100%;
  overflow: hidden;
  background: #f5f6f8;
}

.workflow-shell {
  display: flex;
  height: 100%;
  flex-direction: column;
}

.workflow-header {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr) auto;
  align-items: center;
  flex: none;
  min-height: calc(58px + env(safe-area-inset-top));
  padding: env(safe-area-inset-top) 12px 0 6px;
  color: #fff;
  background: var(--brand-primary);
}

.workflow-header button {
  display: grid;
  width: 40px;
  height: 40px;
  padding: 0;
  color: #fff;
  font-size: 22px;
  background: transparent;
  border: 0;
  place-items: center;
}

.workflow-header div {
  min-width: 0;
}

.workflow-header h2 {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
}

.workflow-header div span {
  display: block;
  margin-top: 2px;
  font-size: 10px;
  opacity: .82;
}

.role-chip {
  max-width: 154px;
  overflow: hidden;
  padding: 5px 8px;
  font-size: 10px;
  line-height: 15px;
  white-space: nowrap;
  text-overflow: ellipsis;
  background: rgb(255 255 255 / 18%);
  border: 1px solid rgb(255 255 255 / 28%);
  border-radius: 4px;
}

.case-strip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex: none;
  gap: 18px;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #e8eaed;
}

.case-strip > div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.case-strip > div:first-child span {
  color: var(--brand-primary);
  font-size: 10px;
}

.case-strip strong {
  overflow: hidden;
  margin-top: 3px;
  color: #272c33;
  font-size: 14px;
  line-height: 20px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.case-strip > div:last-child {
  flex: none;
  text-align: right;
}

.case-strip small {
  color: #999fa8;
  font-size: 9px;
}

.case-strip > div:last-child span {
  margin-top: 3px;
  color: #6d747e;
  font-size: 10px;
}

.detail-tabs {
  display: flex;
  flex: none;
  padding: 0 8px;
  overflow-x: auto;
  background: #fff;
  border-bottom: 1px solid #e4e7ea;
  scrollbar-width: none;
}

.detail-tabs::-webkit-scrollbar {
  display: none;
}

.detail-tabs button {
  position: relative;
  flex: none;
  height: 43px;
  padding: 0 11px;
  color: #747b85;
  font-size: 12px;
  white-space: nowrap;
  background: transparent;
  border: 0;
}

.detail-tabs button.active {
  color: #262b32;
  font-weight: 600;
}

.detail-tabs button.active::after {
  position: absolute;
  right: 11px;
  bottom: 0;
  left: 11px;
  height: 2px;
  background: var(--brand-primary);
  content: '';
}

.detail-tab-label {
  display: inline-block;
}

.workflow-scroll {
  flex: 1;
  overflow-y: auto;
  overscroll-behavior: contain;
}

.content-wrap {
  width: min(100%, 920px);
  margin: 0 auto;
  padding: 12px 0 28px;
}

.content-panel {
  padding: 17px 16px 24px;
  background: #fff;
  border-top: 1px solid #e7e9ec;
  border-bottom: 1px solid #e7e9ec;
}

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}

.section-heading > div {
  min-width: 0;
}

.section-heading span {
  color: #a0a5ad;
  font-size: 9px;
}

.section-heading h3 {
  margin: 2px 0 0;
  color: #252a31;
  font-size: 17px;
  font-weight: 600;
  line-height: 24px;
}

.section-heading > .van-icon {
  color: #c2c7ce;
  font-size: 24px;
}

.record-count,
.edit-badge,
.read-badge {
  flex: none;
  padding: 3px 7px;
  border-radius: 3px;
}

.edit-badge {
  color: var(--brand-primary) !important;
  background: var(--brand-primary-soft);
}

.read-badge {
  color: #6e7680 !important;
  background: #f0f2f4;
}

.identity-grid,
.amount-grid,
.quota-grid,
.long-copy-list,
.notice-paper dl {
  margin: 0;
}

.identity-grid {
  display: grid;
  gap: 12px;
}

.identity-grid div,
.amount-grid div {
  min-width: 0;
  padding: 11px 12px;
  background: #f8f9fa;
  border-left: 2px solid #e1e4e8;
}

.identity-grid dt,
.amount-grid dt,
.quota-grid dt,
.long-copy-list dt,
.notice-paper dt {
  color: #8b919a;
  font-size: 10px;
}

.identity-grid dd,
.amount-grid dd,
.quota-grid dd,
.long-copy-list dd,
.notice-paper dd {
  margin: 4px 0 0;
  color: #343a43;
  font-size: 13px;
  line-height: 20px;
}

.subheading {
  margin: 22px 0 10px;
  color: #555c66;
  font-size: 12px;
  font-weight: 500;
}

.amount-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.amount-grid dd {
  overflow: hidden;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.quota-list {
  display: grid;
  gap: 12px;
}
.group-record-list {
  display: grid;
  gap: 12px;
}

.group-record {
  overflow: hidden;
  background: #fff;
  border: 1px solid #e3e6ea;
  border-radius: 6px;
}

.group-record-header {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 10px;
  padding: 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e8eaed;
}

.group-record-header > span {
  display: grid;
  width: 28px;
  height: 28px;
  flex: none;
  color: var(--brand-primary);
  font-size: 11px;
  font-weight: 600;
  background: var(--brand-primary-soft);
  border-radius: 4px;
  place-items: center;
}

.group-record-header > strong,
.group-record-header > div {
  min-width: 0;
}

.group-record-header > strong,
.group-record-header > div > strong {
  display: block;
  overflow: hidden;
  color: #30363e;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.group-record-header > div > small {
  display: block;
  margin-top: 2px;
  overflow: hidden;
  color: #858b95;
  font-size: 10px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.group-field-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0;
  background: #fff;
}

.group-field-grid > div {
  min-width: 0;
  padding: 10px;
  background: #fff;
  border-right: 1px solid #e8eaed;
  border-bottom: 1px solid #e8eaed;
}

.group-field-grid dt {
  overflow: hidden;
  color: #8b919a;
  font-size: 10px;
  line-height: 16px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.group-field-grid dd {
  min-width: 0;
  margin: 4px 0 0;
  overflow: hidden;
  color: #343a43;
  font-size: 12px;
  line-height: 19px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.member-field-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.member-quota-grid input,
.member-quota-grid select {
  height: 32px;
  padding: 0 7px;
  font-size: 12px;
}

.partner-quota-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.partner-quota-grid input,
.partner-quota-grid select {
  height: 32px;
  padding: 0 7px;
  font-size: 12px;
}


.quota-item {
  overflow: hidden;
  background: #fff;
  border: 1px solid #e3e6ea;
  border-radius: 6px;
}

.quota-item > header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: #f8f9fa;
  border-bottom: 1px solid #e8eaed;
}

.quota-item > header > span {
  display: grid;
  width: 28px;
  height: 28px;
  flex: none;
  color: var(--brand-primary);
  font-size: 11px;
  font-weight: 600;
  background: var(--brand-primary-soft);
  border-radius: 4px;
  place-items: center;
}

.quota-item header div {
  display: flex;
  min-width: 0;
  flex-direction: column;
}

.quota-item header strong {
  color: #30363e;
  font-size: 13px;
  font-weight: 600;
}

.quota-item header small {
  margin-top: 2px;
  color: #858b95;
  font-size: 10px;
}

.quota-grid {
  display: grid;
  grid-template-columns: 1.3fr .8fr 1fr;
  gap: 10px;
  padding: 12px;
}

.approved-fields {
  display: grid;
  gap: 1px;
  padding: 1px 0 0;
  background: #ebeef1;
  border-top: 1px solid #e6e9ec;
}

.approved-fields label {
  display: grid;
  grid-template-columns: 130px minmax(0, 1fr);
  align-items: center;
  min-height: 46px;
  gap: 10px;
  padding: 7px 12px;
  background: #fff;
}

.approved-fields label > span,
.form-group > span,
.textarea-list label > span,
.notice-opinion > span {
  color: #747b85;
  font-size: 11px;
}

input,
select,
textarea {
  width: 100%;
  min-width: 0;
  color: #30363e;
  background: #fff;
  border: 1px solid #dfe3e7;
  border-radius: 4px;
}

input,
select {
  height: 36px;
  padding: 0 9px;
  font-size: 12px;
}

textarea {
  padding: 10px;
  font-size: 12px;
  line-height: 19px;
  resize: vertical;
}

.approved-fields strong {
  color: #333941;
  font-size: 12px;
  font-weight: 500;
  text-align: right;
}

.long-copy-list {
  display: grid;
  gap: 0;
}

.long-copy-list div {
  padding: 15px 0;
  border-top: 1px solid #eceef1;
}

.long-copy-list div:last-child {
  border-bottom: 1px solid #eceef1;
}

.long-copy-list dd {
  margin-top: 7px;
  color: #555c66;
  line-height: 22px;
}

.textarea-list,
.approval-form {
  display: grid;
  gap: 16px;
}

.textarea-list label,
.form-group {
  display: grid;
  gap: 7px;
}

.textarea-list p {
  margin: 0;
  padding: 12px;
  color: #505762;
  font-size: 12px;
  line-height: 21px;
  background: #f8f9fa;
  border-left: 2px solid #dfe3e7;
}

.notice-section {
  padding: 0 12px;
}

.notice-paper {
  padding: 24px 18px;
  color: #414750;
  background: #fff;
  border: 1px solid #dfe2e6;
  box-shadow: 0 5px 16px rgb(25 31 38 / 6%);
}

.notice-paper > header {
  padding-bottom: 15px;
  text-align: center;
  border-bottom: 2px solid #e3a064;
}

.notice-paper > header span {
  color: #8d5b31;
  font-size: 11px;
}

.notice-paper h3 {
  margin: 4px 0;
  color: #2d3239;
  font-family: "Songti SC", SimSun, serif;
  font-size: 24px;
  font-weight: 600;
}

.notice-paper > header small {
  color: #858b94;
  font-size: 10px;
}

.notice-paper > p {
  margin: 14px 0 0;
  font-size: 12px;
  line-height: 23px;
  text-indent: 2em;
}

.notice-paper .notice-recipient {
  text-indent: 0;
}

.notice-paper dl {
  margin-top: 16px;
  border-top: 1px solid #e4e6e9;
}

.notice-paper dl div {
  display: grid;
  grid-template-columns: 125px minmax(0, 1fr);
  gap: 10px;
  padding: 10px 0;
  border-bottom: 1px solid #eceef0;
}

.notice-paper dd {
  margin-top: 0;
  text-align: right;
}

.notice-opinion {
  margin-top: 18px;
}

.notice-opinion p {
  margin: 7px 0 0;
  padding: 11px;
  font-size: 12px;
  line-height: 21px;
  background: #f8f9fa;
}

.notice-opinion textarea {
  margin-top: 7px;
}

.notice-paper > footer {
  display: flex;
  align-items: flex-end;
  margin-top: 24px;
  font-family: "Songti SC", SimSun, serif;
  font-size: 11px;
  flex-direction: column;
}

.readonly-control {
  min-height: 38px;
  padding: 9px 10px;
  color: #444b54;
  font-size: 12px;
  font-weight: 500;
  background: #f7f8fa;
  border: 1px solid #e5e7ea;
  border-radius: 4px;
}

.segment-options {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 7px;
}

.segment-options.three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.segment-options button {
  min-width: 0;
  min-height: 38px;
  padding: 5px 3px;
  color: #626a74;
  font-size: 11px;
  background: #fff;
  border: 1px solid #dfe2e6;
  border-radius: 4px;
}

.segment-options button.active {
  color: var(--brand-primary);
  font-weight: 600;
  background: var(--brand-primary-soft);
  border-color: var(--brand-primary-border);
}

.segment-options button:disabled {
  cursor: default;
  opacity: .8;
}

.date-grid {
  display: grid;
  gap: 12px;
}

input:read-only,
textarea:read-only {
  color: #555c66;
  background: #f7f8fa;
}

.workflow-actions {
  display: grid;
  grid-template-columns: 1fr 1.7fr;
  flex: none;
  gap: 10px;
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
  background: #fff;
  border-top: 1px solid #dfe2e6;
}

@media (min-width: 720px) {
  .partner-basic-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .partner-quota-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
  .workflow-popup {
    width: min(880px, 100%);
    box-shadow: -12px 0 34px rgb(24 31 39 / 13%);
  }

  .workflow-header {
    padding-right: 22px;
    padding-left: 14px;
  }

  .case-strip {
    padding-right: 28px;
    padding-left: 28px;
  }

  .detail-tabs {
    padding-right: 18px;
    padding-left: 18px;
  }

  .detail-tabs button {
    padding-right: 15px;
    padding-left: 15px;
  }

  .content-wrap {
    padding: 18px 24px 36px;
  }

  .content-panel {
    padding: 22px 24px 28px;
    border: 1px solid #e4e7ea;
  }

  .identity-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .amount-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .approved-fields {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .approved-fields label {
    grid-template-columns: 1fr;
    align-content: center;
  }

  .approved-fields strong {
    text-align: left;
  }

  .date-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .notice-section {
    padding: 0 36px;
  }

  .notice-paper {
    padding: 34px 44px;
  }
}

@media (max-width: 420px) {
  .role-chip {
    max-width: 108px;
  }

  .case-strip {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .case-strip > div:last-child {
    align-items: flex-start;
    text-align: left;
  }

  .amount-grid {
    grid-template-columns: 1fr;
  }

  .quota-grid {
    grid-template-columns: 1.2fr .8fr;
  }

  .quota-grid div:last-child {
    grid-column: 1 / -1;
  }

  .approved-fields label {
    grid-template-columns: 1fr;
  }

  .approved-fields strong {
    text-align: left;
  }

  .segment-options {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .group-field-grid,
  .member-field-grid,
  .member-quota-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (orientation: landscape) and (max-height: 520px) {
  .workflow-header {
    min-height: 50px;
  }

  .case-strip {
    padding-top: 8px;
    padding-bottom: 8px;
  }

  .detail-tabs button {
    height: 38px;
  }
}
.legacy-notice {
  display: none;
}

.quota-grid,
.approved-fields {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.quota-grid > div:last-child {
  grid-column: auto;
}

.approved-fields {
  gap: 10px;
  padding: 8px 12px 12px;
  background: #fff;
}

.approved-fields label {
  grid-template-columns: minmax(0, 1fr);
  align-content: center;
  min-width: 0;
  padding: 0;
  border-left: 0;
  gap: 4px;
}

.approved-fields label:first-child {
  border-left: 0;
}

.approved-fields label > span {
  min-height: 0;
  line-height: normal;
}

.approved-fields strong {
  overflow-wrap: anywhere;
  text-align: left;
}

.workflow-actions.mode-quota,
.workflow-actions.mode-summary,
.workflow-actions.mode-notice {
  grid-template-columns: minmax(0, 1fr);
}

.workflow-actions.mode-approval {
  grid-template-columns: .8fr .8fr 1.35fr;
}

@media (max-width: 420px) {
  .quota-grid,
  .approved-fields {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .quota-grid > div {
    min-width: 0;
  }

  .quota-grid dd {
    overflow-wrap: anywhere;
  }

  .approved-fields label {
    grid-template-columns: minmax(0, 1fr);
    padding-right: 0;
    padding-left: 0;
  }

  .approved-fields label > span {
    font-size: 9px;
  }
}
</style>
