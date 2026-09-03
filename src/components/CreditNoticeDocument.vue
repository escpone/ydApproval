<script setup>
import { computed } from 'vue'

// 授信通知书文档：按普通、集团和合作方/同业三种数据形态渲染纸质版式。
// item 提供客户和额度数据，notice 提供通知书字段；其余属性控制分支和编辑权限。
const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
  notice: {
    type: Object,
    required: true,
  },
  editable: Boolean,
  group: Boolean,
  partner: Boolean,
  groupCreditType: {
    type: Number,
    default: 0,
  },
  finalOpinion: {
    type: String,
    default: '',
  },
})

// 可编辑模式下把最终意见输入同步回工作流草稿。
defineEmits(['update:finalOpinion'])

// 文档金额统一使用千分位，保持表格列对齐。
function formatAmount(value) {
  return Number(value || 0).toLocaleString('zh-CN')
}

// 当通知书未提供万元字段时，将元金额换算为万元。
function formatWan(value) {
  return (Number(value || 0) / 10000).toLocaleString('zh-CN', { maximumFractionDigits: 2 })
}

// 先分后批通知书需要把成员汇总和成员级额度分项合并到同一张表中。
// 同时保留字段别名，方便接入接口返回的不同命名方式。
const groupAllocationRows = computed(() => {
  const source = props.item || {}
  const members = Array.isArray(source.groupMembers) ? source.groupMembers : []
  const quotas = Array.isArray(source.memberQuotaItems) ? source.memberQuotaItems : []
  const memberEntries = members.length
    ? members
    : [...new Map(quotas.map((quota, index) => [
        quota.memberId || quota.memberName || quota.customer || `member-${index}`,
        { id: quota.memberId || quota.memberName || quota.customer || index, customer: quota.memberName || quota.customer },
      ])).values()]

  return memberEntries.flatMap((member, memberIndex) => {
    const memberName = member.customer || member.memberName || member.name || ''
    const memberQuotas = quotas.filter((quota) => (
      (quota.memberId != null && member.id != null && quota.memberId === member.id)
      || quota.memberName === memberName
      || quota.customer === memberName
    ))
    const entries = memberQuotas.length ? memberQuotas : [null]

    return entries.map((quota, quotaIndex) => ({
      id: quota?.id || `${member.id || memberIndex}-${quotaIndex}`,
      memberName,
      memberRating: quota?.creditRating || member.creditRating || props.notice?.creditRating || '',
      memberCreditTotal: member.approvedCreditTotal
        ?? member.approvedCredit
        ?? member.creditTotal
        ?? quota?.memberCreditTotal
        ?? quota?.creditTotal,
      quotaType: quota?.quotaType || quota?.amountType || '',
      usageMethod: quota?.usageMethod || quota?.useMethod || quota?.productName || quota?.businessType || '',
      creditPurpose: quota?.creditPurpose
        || quota?.usagePurpose
        || quota?.purpose
        || quota?.creditUse
        || quota?.usageDesc
        || member.creditPurpose
        || member.usagePurpose
        || source.creditPurpose
        || props.notice?.creditPurpose
        || '',
      amount: quota?.approvedAmount ?? quota?.amount ?? quota?.appliedAmount,
      term: quota?.approvedTerm ?? quota?.termMonths ?? quota?.term ?? '',
      revolving: quota?.isRevolving ?? quota?.isLoop ?? quota?.approvedShared ?? quota?.allowShared ?? '',
      interestRate: quota?.interestRate ?? quota?.rateFloat ?? quota?.rateFloating ?? quota?.interestRateFloor ?? '',
      marginRate: quota?.marginRate ?? quota?.guaranteeRatio ?? quota?.depositRatio ?? '',
      showMember: quotaIndex === 0,
      memberRowSpan: entries.length,
    }))
  })
})
</script>

<template>
  <!-- 文档区域使用真实表格结构，便于移动端横向滚动和打印预览。 -->
  <div class="notice-document-viewport">
    <article class="credit-notice-document" :class="{ 'group-document': group }">
      <header class="document-header">
        <div class="form-code">{{ notice.formCode }}</div>
        <div class="form-number">No.</div>
        <h3>{{ partner ? '同业客户授信通知书' : group ? '集团客户授信通知书' : '单一客户授信通知书' }}</h3>
        <p>编号：{{ notice.noticeNo }}</p>
      </header>

      <p class="delivery-line">
        <strong>支行（部）</strong>：{{ notice.deliveryOrg }}
      </p>

      <!-- 合作方/同业通知书：展示合作方类型、项目额度和期限备注。 -->
      <table v-if="partner" class="notice-table partner-notice-table">
        <colgroup>
          <col class="partner-product-column">
          <col class="partner-type-column">
          <col class="partner-amount-column">
          <col class="partner-currency-column">
          <col class="partner-term-column">
          <col class="partner-remark-column">
        </colgroup>
        <tbody>
          <tr>
            <th>客户名称</th>
            <td colspan="2">{{ item.customer }}</td>
            <th>授信申请类型</th>
            <td colspan="2">{{ item.applicationType }}</td>
          </tr>
          <tr>
            <th>综合授信总额（元）</th>
            <td colspan="5">
              <span>大写：{{ notice.creditAmountUppercase || '—' }}</span>
              <span>小写：{{ notice.creditAmountWan || formatWan(item.approvedCreditTotal || item.creditTotal) }}元</span>
            </td>
          </tr>
          <tr>
            <th>授信有效期</th>
            <td colspan="5">自{{ notice.effectiveDate }}至{{ notice.expiryDate }}</td>
          </tr>
          <tr>
            <th>授信用途</th>
            <td colspan="5">{{ notice.creditPurpose || '合作方供应链融资、助贷及增信业务' }}</td>
          </tr>
          <tr class="partner-section-row">
            <th colspan="6">分项额度使用方式及金额</th>
          </tr>
          <tr class="partner-header-row">
            <th>产品名称</th>
            <th>额度类型</th>
            <th>分项金额（元）</th>
            <th>币种</th>
            <th>期限（月）</th>
            <th>备注</th>
          </tr>
          <tr v-for="quota in item.partnerQuotaItems || []" :key="quota.id">
            <td>{{ quota.productName || quota.projectName }}</td>
            <td>{{ quota.quotaType || quota.partnerCategory }}</td>
            <td>{{ formatAmount(quota.approvedAmount || quota.appliedAmount) }}</td>
            <td>{{ quota.currency || '人民币' }}</td>
            <td>{{ quota.termMonths || '' }}</td>
            <td>{{ quota.remark || quota.accessNumber || '' }}</td>
          </tr>
          <tr class="large-row partner-copy-row">
            <th>授信意见及条件</th>
            <td colspan="5">{{ notice.auditOpinion || notice.creditConditions }}</td>
          </tr>
          <tr class="large-row partner-copy-row">
            <th>放款前要求</th>
            <td colspan="5">{{ notice.preLoanRequirements || notice.creditConditions }}</td>
          </tr>
          <tr class="large-row partner-copy-row">
            <th>管理要求</th>
            <td colspan="5">{{ notice.managementRequirements }}</td>
          </tr>
          <tr class="final-row">
            <th>终审意见</th>
            <td colspan="5">
              <textarea
                v-if="editable"
                :value="finalOpinion"
                rows="2"
                maxlength="500"
                aria-label="终审意见"
                @input="$emit('update:finalOpinion', $event.target.value)"
              />
              <span v-else>{{ finalOpinion }}</span>
            </td>
          </tr>
        </tbody>
      </table>
      <!-- 集团单一客户通知书：展示集团整体授信与敞口金额。 -->
      <table v-if="group && groupCreditType === 1" class="notice-table group-single-notice-table">
        <colgroup>
          <col class="label-column">
          <col>
          <col class="label-column">
          <col>
        </colgroup>
        <tbody>
          <tr>
            <th>集团名称</th>
            <td colspan="3">{{ item.groupName || item.customer }}</td>
          </tr>
          <tr>
            <th>信用等级</th>
            <td colspan="3">{{ notice.creditRating }}</td>
          </tr>
          <tr>
            <th>授信总额</th>
            <td colspan="3">
              <span>大写：{{ notice.creditAmountUppercase }}</span>
              <span>小写：{{ notice.creditAmountWan }}万元</span>
            </td>
          </tr>
          <tr>
            <th>敞口额度</th>
            <td colspan="3">
              <span>大写：{{ notice.exposureAmountUppercase }}</span>
              <span>小写：{{ notice.exposureAmountWan }}万元</span>
            </td>
          </tr>
          <tr>
            <th>授信有效期</th>
            <td colspan="3">自{{ notice.effectiveDate }}至{{ notice.expiryDate }}</td>
          </tr>
          <tr class="group-allocation-title-row">
            <th colspan="4">集团成员授信分配情况</th>
          </tr>
          <tr class="group-allocation-content-row">
            <td colspan="4">
              <table class="group-member-allocation-table">
                <colgroup>
                  <col class="allocation-member-column">
                  <col class="allocation-rating-column">
                  <col class="allocation-total-column">
                  <col class="allocation-type-column">
                  <col class="allocation-use-column">
                  <col class="allocation-amount-column">
                  <col class="allocation-term-column">
                  <col class="allocation-revolving-column">
                  <col class="allocation-rate-column">
                  <col class="allocation-margin-column">
                </colgroup>
                <thead>
                  <tr>
                    <th rowspan="2">集团成员名称</th>
                    <th rowspan="2">信用等级</th>
                    <th rowspan="2">授信总额</th>
                    <th colspan="7">分项额度使用方式及金额</th>
                  </tr>
                  <tr>
                    <th>额度类型</th>
                    <th>使用方式</th>
                    <th>金额</th>
                    <th>期限（月）</th>
                    <th>是否循环</th>
                    <th>利率浮动比（不低于）</th>
                    <th>保证金比例</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in groupAllocationRows" :key="row.id">
                    <template v-if="row.showMember">
                      <td :rowspan="row.memberRowSpan" class="allocation-member-name">{{ row.memberName || '—' }}</td>
                      <td :rowspan="row.memberRowSpan">{{ row.memberRating || '—' }}</td>
                      <td :rowspan="row.memberRowSpan">
                        {{ row.memberCreditTotal == null ? '—' : formatWan(row.memberCreditTotal) + '万元' }}
                      </td>
                    </template>
                    <td>{{ row.quotaType || '—' }}</td>
                    <td class="allocation-usage-cell">
                      <span>{{ row.usageMethod || '—' }}</span>
                      <span class="allocation-purpose">{{ row.creditPurpose || '—' }}</span>
                    </td>
                    <td>{{ row.amount == null ? '—' : formatWan(row.amount) + '万元' }}</td>
                    <td>{{ row.term || '—' }}</td>
                    <td>{{ row.revolving || '—' }}</td>
                    <td>{{ row.interestRate || '—' }}</td>
                    <td>{{ row.marginRate || '' }}</td>
                  </tr>
                  <tr v-if="!groupAllocationRows.length">
                    <td colspan="10" class="allocation-empty-cell">暂无成员授信分配信息</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr class="large-row">
            <th>授信意见及条件</th>
            <td colspan="3">{{ notice.creditConditions }}</td>
          </tr>
          <tr class="large-row">
            <th>放款前要求</th>
            <td colspan="3">{{ notice.preLoanRequirements }}</td>
          </tr>
          <tr class="large-row">
            <th>管理要求</th>
            <td colspan="3">{{ notice.managementRequirements }}</td>
          </tr>
          <tr class="final-row">
            <th>终审意见</th>
            <td colspan="3">
              <textarea
                v-if="editable"
                :value="finalOpinion"
                rows="2"
                maxlength="500"
                aria-label="终审意见"
                @input="$emit('update:finalOpinion', $event.target.value)"
              />
              <span v-else>{{ finalOpinion }}</span>
            </td>
          </tr>
        </tbody>
      </table>
      <!-- 集团成员通知书：按成员逐行列出授信额度和分配情况。 -->
      <table v-if="group && groupCreditType !== 1" class="notice-table group-notice-table">
        <colgroup>
          <col class="group-member-column">
          <col class="group-amount-column">
          <col class="group-amount-column">
          <col class="group-amount-column">
          <col class="group-amount-column">
        </colgroup>
        <tbody>
          <tr>
            <th>集团名称</th>
            <td colspan="4">{{ item.groupName || item.customer }}</td>
          </tr>
          <tr class="group-header-row">
            <th>成员名称</th>
            <th>授信总额</th>
            <th>敞口额度</th>
            <th>低风险额度</th>
            <th>合作方额度</th>
          </tr>
          <tr v-for="member in item.groupMembers || []" :key="member.id">
            <td class="group-member-name">{{ member.customer }}</td>
            <td>{{ formatWan(member.creditTotal) }}万元</td>
            <td>{{ formatWan(member.exposureTotal) }}万元</td>
            <td>{{ formatWan(member.lowRiskTotal) }}万元</td>
            <td>{{ formatWan(member.partnerTotal) }}万元</td>
          </tr>
          <tr v-if="groupCreditType === 2" class="group-total-row unallocated-row">
            <th>未切分金额</th>
            <td>{{ formatWan(item.unallocatedCreditTotal) }}万元</td>
            <td>{{ formatWan(item.unallocatedExposureTotal) }}万元</td>
            <td>{{ formatWan(item.unallocatedLowRiskTotal) }}万元</td>
            <td>{{ formatWan(item.unallocatedPartnerTotal) }}万元</td>
          </tr>
          <tr class="group-total-row">
            <th>集团核定额度</th>
            <td>{{ formatWan(item.approvedCreditTotal) }}万元</td>
            <td>{{ formatWan(item.approvedExposureTotal) }}万元</td>
            <td>{{ formatWan(item.approvedLowRiskTotal) }}万元</td>
            <td>{{ formatWan(item.approvedPartnerTotal) }}万元</td>
          </tr>
          <tr>
            <th>授信有效期</th>
            <td colspan="4">自{{ notice.effectiveDate }}至{{ notice.expiryDate }}</td>
          </tr>
          <tr class="large-row">
            <th>授信意见及条件</th>
            <td colspan="4">{{ notice.creditConditions }}</td>
          </tr>
          <tr class="large-row">
            <th>放款前要求</th>
            <td colspan="4">{{ notice.preLoanRequirements }}</td>
          </tr>
          <tr class="large-row">
            <th>管理要求</th>
            <td colspan="4">{{ notice.managementRequirements }}</td>
          </tr>
          <tr class="final-row">
            <th>终审意见</th>
            <td colspan="4">
              <textarea
                v-if="editable"
                :value="finalOpinion"
                rows="2"
                maxlength="500"
                aria-label="终审意见"
                @input="$emit('update:finalOpinion', $event.target.value)"
              />
              <span v-else>{{ finalOpinion }}</span>
            </td>
          </tr>
        </tbody>
      </table>
      <!-- 普通客户通知书：使用标准四列表格展示单一客户授信。 -->
      <table v-if="!group && !partner" class="notice-table">
        <colgroup>
          <col class="label-column">
          <col>
          <col class="label-column">
          <col>
        </colgroup>
        <tbody>
          <tr>
            <th>客户名称</th>
            <td colspan="3">{{ item.customer }}</td>
          </tr>
          <tr>
            <th>授信类型</th>
            <td>{{ notice.creditType }}</td>
            <th>信用等级</th>
            <td>{{ notice.creditRating }}</td>
          </tr>
          <tr>
            <th>综合授信总额</th>
            <td colspan="3">
              <span>大写：{{ notice.creditAmountUppercase }}</span>
              <span>小写：{{ notice.creditAmountWan }}万</span>
            </td>
          </tr>
          <tr>
            <th>授信敞口额度</th>
            <td colspan="3">
              <span>大写：{{ notice.exposureAmountUppercase }}</span>
              <span>小写：{{ notice.exposureAmountWan }}万</span>
            </td>
          </tr>
          <tr>
            <th>授信有效期</th>
            <td colspan="3">自{{ notice.effectiveDate }}至{{ notice.expiryDate }}</td>
          </tr>
          <tr class="large-row">
            <th>授信意见及条件</th>
            <td colspan="3">{{ notice.creditConditions }}</td>
          </tr>
          <tr class="large-row">
            <th>放款前要求</th>
            <td colspan="3">{{ notice.preLoanRequirements }}</td>
          </tr>
          <tr class="large-row">
            <th>管理要求</th>
            <td colspan="3">{{ notice.managementRequirements }}</td>
          </tr>
          <tr class="final-row">
            <th>终审意见</th>
            <td colspan="3">
              <textarea
                v-if="editable"
                :value="finalOpinion"
                rows="2"
                maxlength="500"
                aria-label="终审意见"
                @input="$emit('update:finalOpinion', $event.target.value)"
              />
              <span v-else>{{ finalOpinion }}</span>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- 签章区统一展示审批机构、经办人和签发日期。 -->
      <div class="signature-area">
        <div class="signature-row">
          <span>制表人：{{ notice.maker }}</span>
          <span>审核人：{{ notice.reviewer }}</span>
        </div>
        <div class="approval-organization">
          审批机构：{{ notice.approvalOrganization }}
        </div>
        <div class="issue-date">{{ notice.issueDate }}</div>
      </div>

      <p class="document-note">
        注：本通知一式叁份，授信审批部、授信管理部、经办行各一份。
      </p>
    </article>
  </div>
</template>

<style scoped>
/* 文档样式模拟纸张边界、表格网格、签章区和窄屏横向滚动。 */
.notice-document-viewport {
  width: 100%;
  overflow-x: auto;
  color: #000;
  background: #fff;
}

.credit-notice-document {
  width: min(500px, 100%);
  min-height: 650px;
  margin: 0 auto;
  padding: 4px 0 0;
  color: #000;
  font-family: SimSun, "Songti SC", serif;
  font-size: 11px;
  line-height: 1.35;
  background: #fff;
}

.document-header {
  position: relative;
  height: 116px;
  text-align: center;
}

.form-code {
  height: 20px;
  font-family: "Times New Roman", SimSun, serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0;
}

.form-number {
  height: 38px;
  font-family: "Times New Roman", serif;
  font-size: 11px;
  font-weight: 700;
}

.document-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 32px;
  letter-spacing: 0;
}

.document-header p {
  position: absolute;
  right: 2px;
  bottom: 0;
  margin: 0;
  font-size: 10px;
}

.delivery-line {
  margin: 0 0 3px 30px;
  font-size: 11px;
}

.delivery-line strong {
  font-weight: 700;
}

.notice-table {
  width: 100%;
  table-layout: fixed;
  border-spacing: 0;
  border-collapse: collapse;
  border: 1px solid #000;
}

.group-notice-table .group-member-column {
  width: 31%;
}

.group-notice-table .group-amount-column {
  width: 17.25%;
}

.group-notice-table .group-header-row th,
.group-notice-table .group-total-row th,
.group-notice-table .group-total-row td {
  height: 25px;
  text-align: center;
}

.group-notice-table .group-member-name {
  text-align: left;
}

.group-allocation-title-row th {
  height: 26px;
  background: #d9d9d9;
}

.group-allocation-content-row > td {
  padding: 0;
}

.group-member-allocation-table {
  width: 100%;
  table-layout: fixed;
  border-spacing: 0;
  border-collapse: collapse;
}

.group-member-allocation-table th,
.group-member-allocation-table td {
  min-width: 0;
  height: 31px;
  padding: 2px 3px;
  overflow-wrap: anywhere;
  font-size: 10px;
  line-height: 14px;
  text-align: center;
  vertical-align: middle;
  border: 1px solid #000;
}

.group-member-allocation-table th {
  font-weight: 700;
}

.group-member-allocation-table .allocation-member-name {
  text-align: left;
}

.group-member-allocation-table .allocation-usage-cell {
  padding-top: 0;
  padding-bottom: 0;
}

.group-member-allocation-table .allocation-usage-cell > span {
  display: block;
  min-height: 17px;
}

.group-member-allocation-table .allocation-usage-cell .allocation-purpose {
  border-top: 1px solid #000;
}

.group-member-allocation-table .allocation-empty-cell {
  height: 28px;
  text-align: center;
}

.group-member-allocation-table .allocation-member-column { width: 12%; }
.group-member-allocation-table .allocation-rating-column { width: 8%; }
.group-member-allocation-table .allocation-total-column { width: 12%; }
.group-member-allocation-table .allocation-type-column { width: 12%; }
.group-member-allocation-table .allocation-use-column { width: 15%; }
.group-member-allocation-table .allocation-amount-column { width: 12%; }
.group-member-allocation-table .allocation-term-column { width: 8%; }
.group-member-allocation-table .allocation-revolving-column { width: 8%; }
.group-member-allocation-table .allocation-rate-column { width: 7%; }
.group-member-allocation-table .allocation-margin-column { width: 6%; }

.partner-notice-table .partner-product-column { width: 22%; }
.partner-notice-table .partner-type-column { width: 16%; }
.partner-notice-table .partner-amount-column { width: 18%; }
.partner-notice-table .partner-currency-column { width: 12%; }
.partner-notice-table .partner-term-column { width: 12%; }
.partner-notice-table .partner-remark-column { width: 20%; }

.partner-notice-table th,
.partner-notice-table td {
  text-align: center;
  overflow-wrap: anywhere;
}

.partner-notice-table td[colspan="5"] {
  text-align: left;
}

.partner-notice-table td[colspan="5"] > span {
  display: inline-block;
  margin-right: 22px;
}

.partner-notice-table .partner-section-row th {
  height: 26px;
  background: #d9d9d9;
}

.partner-notice-table .partner-header-row th {
  height: 30px;
  line-height: 14px;
}

.partner-notice-table .partner-copy-row th,
.partner-notice-table .partner-copy-row td {
  height: 68px;
}
.notice-table .label-column {
  width: 20%;
}

.notice-table th,
.notice-table td {
  height: 23px;
  padding: 2px 4px;
  color: #000;
  font-size: 11px;
  font-weight: 400;
  line-height: 17px;
  vertical-align: middle;
  border: 1px solid #000;
}

.notice-table th {
  font-weight: 700;
  text-align: center;
}

.notice-table td[colspan="3"] {
  position: relative;
}

.notice-table td[colspan="3"] > span + span {
  position: absolute;
  left: 58%;
}

.notice-table .large-row th,
.notice-table .large-row td {
  height: 74px;
}

.notice-table .final-row th,
.notice-table .final-row td {
  height: 60px;
}

.notice-table textarea {
  width: 100%;
  height: 54px;
  padding: 3px 0;
  color: #000;
  font-family: SimSun, "Songti SC", serif;
  font-size: 11px;
  line-height: 17px;
  resize: none;
  background: #fff;
  border: 0;
  border-radius: 0;
  outline: 1px dashed #aaa;
  outline-offset: -2px;
}

.signature-area {
  min-height: 81px;
  padding: 5px 58px 0 66px;
}

.signature-row {
  display: flex;
  justify-content: space-between;
}

.approval-organization,
.issue-date {
  width: 47%;
  margin-top: 9px;
  margin-left: auto;
  text-align: center;
}

.issue-date {
  margin-top: 12px;
}

.document-note {
  margin: 0;
  font-size: 10px;
}

@media (max-width: 560px) {
  .credit-notice-document {
    min-height: 620px;
    font-size: 9px;
  }

  .document-header {
    height: 108px;
  }

  .form-code,
  .form-number,
  .notice-table th,
  .notice-table td,
  .delivery-line,
  .notice-table textarea {
    font-size: 9px;
  }

  .form-number {
    height: 29px;
  }

  .document-header h3 {
    font-size: 15px;
    line-height: 28px;
  }

  .document-header p {
    font-size: 8px;
  }

  .delivery-line {
    margin-left: 12px;
  }

  .notice-table th,
  .notice-table td {
    padding-right: 2px;
    padding-left: 2px;
    line-height: 14px;
  }

  .group-notice-table .group-header-row th,
  .group-notice-table .group-total-row th,
  .group-notice-table .group-total-row td {
    height: 23px;
  }
  .notice-table .large-row th,
  .notice-table .large-row td {
    height: 62px;
  }

  .signature-area {
    min-height: 72px;
    padding-right: 24px;
    padding-left: 26px;
  }

  .approval-organization,
  .issue-date {
    margin-top: 7px;
  }

  .document-note {
    font-size: 8px;
  }
}
</style>
