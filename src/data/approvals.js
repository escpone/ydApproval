// 集团授信申请类型到展示后缀的映射；Object.freeze 防止运行时被业务组件改写。
export const groupCreditApplicationTypeMap = Object.freeze({
  1: '先分后批',
  2: '先批后分式',
  3: '额度划分',
})

// 统一生成列表卡片和详情页使用的申请类型文案。集团申请会追加分配方式。
export function getApplicationTypeLabel(item) {
  const applicationType = item?.applicationType || ''
  if (!applicationType.startsWith('集团')) return applicationType

  const suffix = groupCreditApplicationTypeMap[Number(item?.groupCreditApplicationType)]
  return suffix ? `${applicationType}-${suffix}` : applicationType
}

// 普通对公授信的额度分项模板；创建每条演示数据时都会复制，避免对象之间相互污染。
const defaultQuotaItems = [
  {
    id: 1, quotaType: '一般额度分项', productName: '流动资金贷款',
    appliedAmount: 80000000, term: '12个月', allowShared: '否',
    approvedAmount: 76000000, approvedTerm: '12个月', approvedShared: '否',
  },
  {
    id: 2, quotaType: '一般额度分项', productName: '固定资产贷款',
    appliedAmount: 120000000, term: '36个月', allowShared: '否',
    approvedAmount: 110000000, approvedTerm: '36个月', approvedShared: '否',
  },
  {
    id: 3, quotaType: '专项额度分项', productName: '项目融资',
    appliedAmount: 200000000, term: '60个月', allowShared: '否',
    approvedAmount: 190000000, approvedTerm: '60个月', approvedShared: '否',
  },
  {
    id: 4, quotaType: '专项额度分项', productName: '并购贷款',
    appliedAmount: 150000000, term: '48个月', allowShared: '否',
    approvedAmount: 140000000, approvedTerm: '48个月', approvedShared: '否',
  },
  {
    id: 5, quotaType: '低风险额度分项', productName: '银行承兑汇票',
    appliedAmount: 30000000, term: '12个月', allowShared: '是',
    approvedAmount: 30000000, approvedTerm: '12个月', approvedShared: '是',
  },
  {
    id: 6, quotaType: '低风险额度分项', productName: '国内信用证',
    appliedAmount: 25000000, term: '12个月', allowShared: '是',
    approvedAmount: 25000000, approvedTerm: '12个月', approvedShared: '是',
  },
  {
    id: 7, quotaType: '合作方额度分项', productName: '供应链融资',
    appliedAmount: 50000000, term: '12个月', allowShared: '是',
    approvedAmount: 48000000, approvedTerm: '12个月', approvedShared: '是',
  },
  {
    id: 8, quotaType: '合作方额度分项', productName: '国内保理融资',
    appliedAmount: 40000000, term: '12个月', allowShared: '是',
    approvedAmount: 38000000, approvedTerm: '12个月', approvedShared: '是',
  },
  {
    id: 9, quotaType: '贷后延伸额度分项', productName: '借新还旧',
    appliedAmount: 20000000, term: '12个月', allowShared: '否',
    approvedAmount: 18000000, approvedTerm: '12个月', approvedShared: '否',
  },
  {
    id: 10, quotaType: '贷后延伸额度分项', productName: '贷款展期',
    appliedAmount: 15000000, term: '6个月', allowShared: '否',
    approvedAmount: 12000000, approvedTerm: '6个月', approvedShared: '否',
  },
  {
    id: 11, quotaType: '登记类/信用卡额度分项', productName: '公务卡额度',
    appliedAmount: 5000000, term: '36个月', allowShared: '是',
    approvedAmount: 5000000, approvedTerm: '36个月', approvedShared: '是',
  },
  {
    id: 12, quotaType: '登记类/信用卡额度分项', productName: '信用卡专项额度',
    appliedAmount: 3000000, term: '24个月', allowShared: '是',
    approvedAmount: 3000000, approvedTerm: '24个月', approvedShared: '是',
  },
]

// 构造普通授信申请的完整数据模型。overrides 仅覆盖当前案例需要变化的字段。
function createApproval(overrides) {
  return {
    applicationType: '对公授信申请',
    initiatedAt: '2026年08月21日 09:42:16',
    organization: '郑州银行高新支行',
    applicantName: '张晨',
    creditTotal: 128000000,
    lowRiskTotal: 30000000,
    approvedCreditTotal: 118000000,
    approvedLowRiskTotal: 30000000,
    exposureTotal: 98000000,
    partnerTotal: 20000000,
    approvedExposureTotal: 88000000,
    approvedPartnerTotal: 20000000,
    quotaItems: defaultQuotaItems.map((item) => ({ ...item })),
    deliberation: {
      matter: '申请新增综合授信额度，授信用于企业日常经营周转及供应链结算。',
      preLoanRequirements: '落实有效担保手续，核验贸易背景及资金用途后方可提款。',
      managementRequirements: '按季跟踪企业经营、回款及负债变化，关注核心订单履约情况。',
    },
    summaryOpinion: {
      creditOpinion: '同意按审议方案给予综合授信额度，具体品种按额度分项执行。',
      preLoanRequirements: '授信启用前落实批复要求的抵押登记及保证合同。',
      managementRequirements: '加强贷后资金流向监测，重大经营变化及时报告。',
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
      maker: '杨霖',
      reviewer: '魏哲洗',
      approvalOrganization: '授信审批部',
      issueDate: '2026年03月05日',
      effectiveDate: '2026-03-05',
      expiryDate: '2027-03-04',
    },
    approvalInfo: {
      systemVote: '同意',
      manualVote: '同意',
      authorizedApprover: '刘志强',
      conclusion: '同意',
      opinion: '同意申报方案，请按授信批复条件落实相关要求。',
      voteConclusion: '同意',
      voteOpinion: '同意本次授信申请。',
    },
    ...overrides,
  }
}

// 集团授信总额度分项，供集团申请的集团授信分项信息页签展示。
const defaultGroupQuotaItems = [
  {
    id: 'GQ-01', quotaType: '敞口额度分项', appliedAmount: 420000000,
    approvedAmount: 400000000, term: '36个月', allowShared: '否',
    approvedTerm: '36个月', approvedShared: '否',
  },
  {
    id: 'GQ-02', quotaType: '低风险额度分项', appliedAmount: 90000000,
    approvedAmount: 90000000, term: '12个月', allowShared: '是',
    approvedTerm: '12个月', approvedShared: '是',
  },
  {
    id: 'GQ-03', quotaType: '合作方额度分项', appliedAmount: 60000000,
    approvedAmount: 55000000, term: '24个月', allowShared: '是',
    approvedTerm: '24个月', approvedShared: '是',
  },
  {
    id: 'GQ-04', quotaType: '贷后延伸额度分项', appliedAmount: 30000000,
    approvedAmount: 25000000, term: '12个月', allowShared: '否',
    approvedTerm: '12个月', approvedShared: '否',
  },
  {
    id: 'GQ-05', quotaType: '登记类/信用卡额度分项', appliedAmount: 10000000,
    approvedAmount: 10000000, term: '36个月', allowShared: '是',
    approvedTerm: '36个月', approvedShared: '是',
  },
]

// 集团成员汇总数据，用于成员清单和集团额度汇总计算的演示。
const defaultGroupMembers = [
  {
    id: 'GM-01', customer: '河南中原智造有限公司', creditTotal: 220000000,
    exposureTotal: 170000000, lowRiskTotal: 30000000, partnerTotal: 20000000,
    approvedExposureTotal: 155000000, approvedLowRiskTotal: 28000000,
    approvedPartnerTotal: 18000000, manager: '张晨',
  },
  {
    id: 'GM-02', customer: '郑州智联供应链有限公司', creditTotal: 160000000,
    exposureTotal: 125000000, lowRiskTotal: 40000000, partnerTotal: 10000000,
    approvedExposureTotal: 118000000, approvedLowRiskTotal: 40000000,
    approvedPartnerTotal: 9000000, manager: '李青',
  },
  {
    id: 'GM-03', customer: '河南新材料科技有限公司', creditTotal: 130000000,
    exposureTotal: 95000000, lowRiskTotal: 20000000, partnerTotal: 30000000,
    approvedExposureTotal: 90000000, approvedLowRiskTotal: 18000000,
    approvedPartnerTotal: 28000000, manager: '陈璐',
  },
  {
    id: 'GM-04', customer: '中原智能装备股份有限公司', creditTotal: 100000000,
    exposureTotal: 80000000, lowRiskTotal: 15000000, partnerTotal: 10000000,
    approvedExposureTotal: 76000000, approvedLowRiskTotal: 15000000,
    approvedPartnerTotal: 9000000, manager: '周航',
  },
]

// 集团成员级额度分项，记录每个成员的产品、期限及审批后额度。
const defaultMemberQuotaItems = [
  {
    id: 'MQ-01', memberName: '河南中原智造有限公司', quotaType: '敞口额度分项',
    productName: '流动资金贷款', appliedAmount: 150000000, term: '36个月', allowShared: '否',
    approvedAmount: 140000000, approvedTerm: '36个月', approvedShared: '否', interestRate: '0%',
  },
  {
    id: 'MQ-02', memberName: '郑州智联供应链有限公司', quotaType: '合作方额度分项',
    productName: '供应链融资', appliedAmount: 60000000, term: '24个月', allowShared: '是',
    approvedAmount: 55000000, approvedTerm: '24个月', approvedShared: '是', interestRate: '0%',
  },
  {
    id: 'MQ-03', memberName: '河南新材料科技有限公司', quotaType: '低风险额度分项',
    productName: '银行承兑汇票', appliedAmount: 40000000, term: '12个月', allowShared: '是',
    approvedAmount: 38000000, approvedTerm: '12个月', approvedShared: '是', interestRate: '0%',
  },
  {
    id: 'MQ-04', memberName: '中原智能装备股份有限公司', quotaType: '贷后延伸额度分项',
    productName: '借新还旧', appliedAmount: 30000000, term: '12个月', allowShared: '否',
    approvedAmount: 25000000, approvedTerm: '12个月', approvedShared: '否', interestRate: '0%',
  },
]

// 合作方授信专用额度明细，字段比普通额度分项更贴近合作项目台账。
const defaultPartnerQuotaItems = [
  {
    id: 'PQ-01', partnerType: '平台类合作方', partnerCategory: '供应链金融平台', quotaType: '循环额度',
    appliedAmount: 20000000, approvedAmount: 18000000,
    projectName: '核心企业供应链融资', accessNumber: 'HZ2026-001', currency: '人民币', termMonths: 12, remark: '保证金10%',
    expiryDate: '2027年02月25日', singleCustomerAmount: 2000000, marginRate: '10%',
  },
  {
    id: 'PQ-02', partnerType: '机构类合作方', partnerCategory: '融资担保机构', quotaType: '专项额度',
    appliedAmount: 12000000, approvedAmount: 10000000,
    projectName: '小微企业批量担保', accessNumber: 'DB2026-008', currency: '人民币', termMonths: 12, remark: '保证金20%',
    expiryDate: '2027年03月15日', singleCustomerAmount: 1500000, marginRate: '20%',
  },
  {
    id: 'PQ-03', partnerType: '平台类合作方', partnerCategory: '消费金融平台', quotaType: '循环额度',
    appliedAmount: 8000000, approvedAmount: 7000000,
    projectName: '个人经营贷助贷', accessNumber: 'XF2026-012', currency: '人民币', termMonths: 12, remark: '保证金15%',
    expiryDate: '2027年04月30日', singleCustomerAmount: 1000000, marginRate: '15%',
  },
]
// 同业授信专用额度明细，供同业申请复用合作方表格渲染路径。
const defaultInterbankQuotaItems = [
  {
    id: 'IBQ-01', productName: '综合类', quotaType: '循环额度',
    appliedAmount: 50000000, approvedAmount: 48000000,
    currency: '人民币', termMonths: 12, remark: '同业资金业务',
  },
  {
    id: 'IBQ-02', productName: '债券投资类', quotaType: '专项额度',
    appliedAmount: 30000000, approvedAmount: 28000000,
    currency: '人民币', termMonths: 12, remark: '债券投资业务',
  },
]
// 创建集团授信案例，并同时准备集团、成员和汇总意见等扩展数据。
function createGroupApproval(overrides = {}) {
  const applicationType = overrides.applicationType || '集团授信申请'
  const defaultGroupCreditApplicationType = applicationType === '集团客户额度划分' ? 3 : 1

  return createApproval({
    applicationType,
    groupCreditApplicationType: defaultGroupCreditApplicationType,
    customer: '中原智造集团有限公司',
    groupName: '中原智造集团有限公司',
    organization: '郑州银行总行营业部',
    applicantName: '张晨',
    creditTotal: 520000000,
    lowRiskTotal: 105000000,
    approvedCreditTotal: 490000000,
    approvedLowRiskTotal: 101000000,
    exposureTotal: 390000000,
    partnerTotal: 70000000,
    approvedExposureTotal: 367000000,
    approvedPartnerTotal: 64000000,
    unallocatedCreditTotal: 0,
    unallocatedExposureTotal: 0,
    unallocatedLowRiskTotal: 0,
    unallocatedPartnerTotal: 0,
    groupQuotaItems: defaultGroupQuotaItems.map((entry) => ({ ...entry })),
    groupMembers: defaultGroupMembers.map((entry) => ({ ...entry })),
    memberQuotaItems: defaultMemberQuotaItems.map((entry) => ({ ...entry })),
    deliberation: {
      matter: '审议中原智造集团及成员单位统一授信方案，统筹集团成员用信与额度分配。',
      preLoanRequirements: '落实集团成员担保及额度占用关系，核验成员企业贸易背景后方可提款。',
      managementRequirements: '按季跟踪集团整体经营、成员企业回款及关联交易变化，关注集团授信集中度。',
    },
    summaryOpinion: {
      creditOpinion: '同意集团统一授信方案，成员企业额度按授信分项及成员分配结果执行。',
      preLoanRequirements: '授信启用前完成成员企业额度划分、担保手续及授信条件确认。',
      managementRequirements: '加强集团整体及成员企业贷后监测，重大风险变化及时报告。',
    },
    notice: {
      creditType: '集团综合授信额度',
      creditAmountWan: '49,000.00',
      exposureAmountWan: '36,700.00',
      creditConditions: '同意集团统一授信，成员企业按核定额度办理相关业务。',
      preLoanRequirements: '落实成员企业担保手续及额度划分后方可提款。',
      managementRequirements: '加强集团整体及成员企业经营情况跟踪管理。',
    },
    ...overrides,
  })
}
// 创建合作方授信案例；合作方申请不展示普通额度分项页签。
function createPartnerApproval(overrides = {}) {
  const applicationType = overrides.applicationType || '合作方授信申请'

  return createApproval({
    applicationType,
    customer: '河南豫商数字科技有限公司',
    organization: '郑州银行高新支行',
    applicantName: '张晨',
    customerManager: '张晨',
    branchReviewer: '王磊',
    branchPresident: '李建国',
    creditTotal: 40000000,
    lowRiskTotal: 0,
    approvedCreditTotal: 36000000,
    approvedLowRiskTotal: 0,
    exposureTotal: 40000000,
    partnerTotal: 40000000,
    approvedExposureTotal: 36000000,
    approvedPartnerTotal: 36000000,
    partnerQuotaItems: defaultPartnerQuotaItems.map((entry) => ({ ...entry })),
    deliberation: {
      matter: '审议合作方授信合作方案，支持合作方为其服务客户提供融资及增信服务。',
      preLoanRequirements: '核验合作方准入资质、合作项目及风险缓释措施后方可提款。',
      managementRequirements: '持续跟踪合作方经营情况、项目运行及客户还款，定期开展风险评估。',
    },
    summaryOpinion: {
      creditOpinion: '同意合作方授信方案，授信额度按合作方额度分项及批复条件执行。',
      preLoanRequirements: '落实合作方准入及担保手续，确认合作项目符合管理要求。',
      managementRequirements: '加强合作方及合作项目贷后管理，定期报送业务运行情况。',
    },
    notice: {
      creditType: '合作方授信额度',
      partnerLedgerNo: 'CTJX20260200095323',
      partnerCreditAmountWan: '4,000.00',
      creditAmountUppercase: '肆仟万元整',
      creditAmountWan: '4,000.00',
      creditPurpose: '合作方供应链融资、助贷及增信业务',
      preLoanRequirements: '落实合作方准入及合作项目备案，确认风险缓释措施后方可提款。',
      auditOpinion: '同意按合作方授信方案办理。',
      riskTips: '关注合作方经营及合作项目风险变化。',
      creditConditions: '落实合作方准入、项目备案及风险缓释措施。',
      managementRequirements: '持续跟踪合作方及合作项目运行情况，按要求报送贷后管理信息。',
    },
    ...overrides,
  })
}
// 创建同业授信案例，沿用合作方额度明细结构并填充同业业务文案。
function createInterbankApproval(overrides = {}) {
  const applicationType = overrides.applicationType || '同业授信申请'

  return createApproval({
    applicationType,
    customer: '河南中原同业资金有限公司',
    organization: '郑州银行总行营业部',
    applicantName: '王磊',
    customerManager: '王磊',
    branchReviewer: '赵楠',
    branchPresident: '李建国',
    creditTotal: 80000000,
    lowRiskTotal: 0,
    approvedCreditTotal: 76000000,
    approvedLowRiskTotal: 0,
    exposureTotal: 80000000,
    partnerTotal: 0,
    approvedExposureTotal: 76000000,
    approvedPartnerTotal: 0,
    partnerQuotaItems: defaultInterbankQuotaItems.map((entry) => ({ ...entry })),
    deliberation: {
      matter: '审议同业客户授信合作方案，支持同业资金拆借、债券投资及同业存款等业务。',
      preLoanRequirements: '核验同业客户准入资质、监管评级及合作协议后方可提款。',
      managementRequirements: '持续跟踪同业客户经营、监管及授信使用情况，定期开展风险评估。',
    },
    summaryOpinion: {
      creditOpinion: '同意同业客户授信方案，授信额度按批复条件及分项额度执行。',
      preLoanRequirements: '落实同业客户准入、授信合同及风险缓释措施。',
      managementRequirements: '加强同业客户授信及资金用途贷后管理，及时报告重大变化。',
    },
    notice: {
      creditType: '同业客户授信额度',
      partnerLedgerNo: 'TYJX20260200095325',
      creditAmountUppercase: '捌仟万元整',
      creditAmountWan: '8,000.00',
      creditPurpose: '同业资金拆借、债券投资及同业存款业务',
      preLoanRequirements: '落实同业客户准入及合作协议，确认风险缓释措施后方可提款。',
      auditOpinion: '同意按同业客户授信方案办理。',
      riskTips: '关注同业客户监管评级、流动性及市场风险变化。',
      creditConditions: '落实同业客户准入、授信合同及风险缓释措施。',
      managementRequirements: '持续跟踪同业客户及同业业务运行情况，按要求报送贷后管理信息。',
    },
    ...overrides,
  })
}
// 待办列表数据。页面启动时会复制该数组，用户操作只影响 App 组件内的响应式状态。
export const todoApprovals = [
  createApproval({
    id: 'ZY202608210031',
    customer: '河南新程智能科技有限公司',
    applicationType: '对公授信申请',
    initiatedAt: '2026年08月21日 09:42:16',
    organization: '郑州银行高新支行',
    applicantName: '张晨',
  }),
  createApproval({
    id: 'ZY202608210027',
    customer: '郑州华茂供应链管理有限公司',
    applicationType: '对公授信变更申请',
    initiatedAt: '2026年08月21日 08:56:39',
    organization: '郑州银行自贸区支行',
    applicantName: '李青',
    creditTotal: 80000000, lowRiskTotal: 20000000,
    approvedCreditTotal: 75000000, approvedLowRiskTotal: 18000000,
    exposureTotal: 60000000, partnerTotal: 15000000,
    approvedExposureTotal: 57000000, approvedPartnerTotal: 12000000,
  }),
  createApproval({
    id: 'ZY202608200086',
    customer: '河南汇丰农产品加工有限公司',
    applicationType: '对公授信申请',
    initiatedAt: '2026年08月20日 16:21:08',
    organization: '郑州银行金水支行',
    applicantName: '陈璐',
    creditTotal: 32000000, lowRiskTotal: 8000000,
    approvedCreditTotal: 30000000, approvedLowRiskTotal: 8000000,
    exposureTotal: 24000000, partnerTotal: 0,
    approvedExposureTotal: 22000000, approvedPartnerTotal: 0,
  }),
  createApproval({
    id: 'ZY202608200071',
    customer: '中原城市更新建设有限公司',
    applicationType: '对公授信变更申请',
    initiatedAt: '2026年08月20日 14:08:52',
    organization: '郑州银行建设路支行',
    applicantName: '周航',
    creditTotal: 560000000, lowRiskTotal: 100000000,
    approvedCreditTotal: 530000000, approvedLowRiskTotal: 100000000,
    exposureTotal: 460000000, partnerTotal: 80000000,
    approvedExposureTotal: 430000000, approvedPartnerTotal: 75000000,
  }),
  createApproval({
    id: 'ZY202608190052',
    customer: '河南远达装备制造股份有限公司',
    applicationType: '对公授信申请',
    initiatedAt: '2026年08月19日 11:26:43',
    organization: '郑州银行经开支行',
    applicantName: '赵雪',
    creditTotal: 45000000, lowRiskTotal: 15000000,
    approvedCreditTotal: 45000000, approvedLowRiskTotal: 15000000,
    exposureTotal: 30000000, partnerTotal: 5000000,
    approvedExposureTotal: 30000000, approvedPartnerTotal: 5000000,
  }),
  createInterbankApproval({
    id: 'TY202608220031', customer: '河南中原同业资金有限公司',
    applicationType: '同业授信申请', initiatedAt: '2026年08月22日 10:06:24',
    organization: '郑州银行总行营业部', applicantName: '王磊',
    customerManager: '王磊', branchReviewer: '赵楠', branchPresident: '李建国',
  }),
  createInterbankApproval({
    id: 'TYB202608210032', customer: '中原金融同业服务有限公司',
    applicationType: '同业授信变更申请', initiatedAt: '2026年08月21日 15:42:18',
    organization: '郑州银行金水支行', applicantName: '赵楠',
    customerManager: '赵楠', branchReviewer: '王磊', branchPresident: '孙立新',
    creditTotal: 60000000, approvedCreditTotal: 56000000,
    exposureTotal: 60000000, approvedExposureTotal: 56000000,
    partnerQuotaItems: defaultInterbankQuotaItems.map((entry, index) => ({
      ...entry,
      appliedAmount: index === 0 ? 36000000 : 24000000,
      approvedAmount: index === 0 ? 34000000 : 22000000,
    })),
    notice: {
      creditType: '同业客户授信额度',
      partnerLedgerNo: 'TYJX20260200095326',
      creditAmountUppercase: '陆仟万元整',
      creditAmountWan: '6,000.00',
      creditPurpose: '同业资金拆借、债券投资及同业存款业务',
      preLoanRequirements: '落实同业客户准入及合作协议，确认风险缓释措施后方可提款。',
      auditOpinion: '同意按同业客户授信变更方案办理。',
      riskTips: '关注同业客户监管评级、流动性及市场风险变化。',
      creditConditions: '落实同业客户准入、授信合同及风险缓释措施。',
      managementRequirements: '持续跟踪同业客户及同业业务运行情况，按要求报送贷后管理信息。',
    },
  }),  createGroupApproval({
    id: 'JT202608210018', customer: '中原智造集团有限公司', applicationType: '集团授信申请', groupCreditApplicationType: 1,
    initiatedAt: '2026年08月21日 10:18:26', organization: '郑州银行总行营业部', applicantName: '张晨',
  }),
  createGroupApproval({
    id: 'JT202608200099', customer: '河南豫新产业集团有限公司', groupName: '河南豫新产业集团有限公司',
    applicationType: '集团授信申请', groupCreditApplicationType: 2, initiatedAt: '2026年08月20日 15:36:08',
    organization: '郑州银行经开支行', applicantName: '赵雪', creditTotal: 360000000,
    lowRiskTotal: 70000000, approvedCreditTotal: 340000000, approvedLowRiskTotal: 68000000,
    exposureTotal: 260000000, partnerTotal: 30000000, approvedExposureTotal: 248000000,
    approvedPartnerTotal: 28000000,
  }),
  createGroupApproval({
    id: 'JBG202608210006', customer: '河南豫能控股集团有限公司', groupName: '河南豫能控股集团有限公司',
    applicationType: '集团授信变更申请', groupCreditApplicationType: 2, initiatedAt: '2026年08月21日 08:26:44',
    organization: '郑州银行金水支行', applicantName: '陈璐', creditTotal: 680000000,
    lowRiskTotal: 140000000, approvedCreditTotal: 650000000, approvedLowRiskTotal: 136000000,
    exposureTotal: 490000000, partnerTotal: 90000000, approvedExposureTotal: 472000000,
    approvedPartnerTotal: 85000000,
  }),
  createGroupApproval({
    id: 'JBG202608190077', customer: '中原交通建设集团有限公司', groupName: '中原交通建设集团有限公司',
    applicationType: '集团授信变更申请', groupCreditApplicationType: 1, initiatedAt: '2026年08月19日 13:12:18',
    organization: '郑州银行建设路支行', applicantName: '周航', creditTotal: 430000000,
    lowRiskTotal: 80000000, approvedCreditTotal: 410000000, approvedLowRiskTotal: 78000000,
    exposureTotal: 330000000, partnerTotal: 50000000, approvedExposureTotal: 318000000,
    approvedPartnerTotal: 48000000,
  }),
  createGroupApproval({
    id: 'JHF202608210011', customer: '河南航空港投资集团有限公司', groupName: '河南航空港投资集团有限公司',
    applicationType: '集团客户额度划分', groupCreditApplicationType: 3, initiatedAt: '2026年08月21日 07:56:31',
    organization: '郑州银行航空港支行', applicantName: '郭鹏', creditTotal: 310000000,
    lowRiskTotal: 60000000, approvedCreditTotal: 300000000, approvedLowRiskTotal: 58000000,
    exposureTotal: 230000000, partnerTotal: 40000000, approvedExposureTotal: 222000000,
    approvedPartnerTotal: 38000000,
  }),
  createPartnerApproval({
    id: 'HZ202608220015', customer: '河南豫商数字科技有限公司',
    applicationType: '合作方授信申请', initiatedAt: '2026年08月22日 09:18:36',
    organization: '郑州银行高新支行', applicantName: '张晨',
    customerManager: '张晨',
    branchReviewer: '王磊',
    branchPresident: '李建国',
    creditTotal: 40000000, partnerTotal: 40000000,
    approvedCreditTotal: 36000000, approvedPartnerTotal: 36000000,
    approvedExposureTotal: 36000000, exposureTotal: 40000000,
  }),
  createPartnerApproval({
    id: 'HZB202608210024', customer: '郑州普惠供应链有限公司',
    applicationType: '合作方授信变更申请', initiatedAt: '2026年08月21日 14:27:09',
    organization: '郑州银行自贸区支行', applicantName: '李青',
    customerManager: '李青',
    branchReviewer: '赵楠',
    branchPresident: '孙立新',
    creditTotal: 28000000, partnerTotal: 28000000,
    approvedCreditTotal: 25000000, approvedPartnerTotal: 25000000,
    approvedExposureTotal: 25000000, exposureTotal: 28000000,
    notice: {
      creditType: '合作方授信额度',
      partnerLedgerNo: 'CTJX20260200095324',
      creditAmountUppercase: '贰仟捌佰万元整',
      creditAmountWan: '2,800.00',
      partnerCreditAmountWan: '2,800.00',
      creditPurpose: '合作方供应链融资、助贷及增信业务',
      preLoanRequirements: '落实合作方准入及合作项目备案，确认风险缓释措施后方可提款。',
      auditOpinion: '同意按合作方授信变更方案办理。',
      riskTips: '关注合作方经营及合作项目风险变化。',
      creditConditions: '落实合作方准入、项目备案及风险缓释措施。',
      managementRequirements: '持续跟踪合作方及合作项目运行情况，按要求报送贷后管理信息。',
    },
  }),
  createGroupApproval({
    id: 'JHF202608180042', customer: '郑州新城建设集团有限公司', groupName: '郑州新城建设集团有限公司',
    applicationType: '集团客户额度划分', groupCreditApplicationType: 3, initiatedAt: '2026年08月18日 16:44:52',
    organization: '郑州银行中原路支行', applicantName: '刘云博', creditTotal: 270000000,
    lowRiskTotal: 50000000, approvedCreditTotal: 260000000, approvedLowRiskTotal: 49000000,
    exposureTotal: 200000000, partnerTotal: 30000000, approvedExposureTotal: 194000000,
    approvedPartnerTotal: 29000000,
  }),
]

// 已办列表数据，用于验证结果筛选、历史详情和重新打开只读流程。
export const completedApprovals = [
  createApproval({
    id: 'ZY202608200064', customer: '河南恒信医药有限公司',
    applicationType: '对公授信申请',
    initiatedAt: '2026年08月20日 10:18:05',
    organization: '郑州银行农业路支行', applicantName: '王宁',
    result: 'passed', resultText: '同意',
    opinion: '同意申报方案，按批复条件落实担保手续。',
    completedAt: '2026年08月20日 10:38:22',
  }),
  createApproval({
    id: 'ZY202608200048', customer: '河南海纳商贸有限公司',
    applicationType: '对公授信变更申请',
    initiatedAt: '2026年08月19日 17:42:13',
    organization: '郑州银行中原路支行', applicantName: '刘云博',
    result: 'returned', resultText: '打回',
    opinion: '请补充近六个月主要结算账户流水及用途证明。',
    completedAt: '2026年08月20日 09:05:11',
  }),
  createApproval({
    id: 'ZY202608190029', customer: '郑州启明物流有限公司',
    applicationType: '对公授信申请',
    initiatedAt: '2026年08月19日 15:06:47',
    organization: '郑州银行航空港支行', applicantName: '郭鹏',
    creditTotal: 60000000, approvedCreditTotal: 60000000,
    result: 'passed', resultText: '同意',
    opinion: '同意授信6000万元，期限一年。',
    completedAt: '2026年08月19日 16:12:09',
  }),
  createApproval({
    id: 'ZY202608180015', customer: '河南臻品食品产业有限公司',
    applicationType: '对公授信变更申请',
    initiatedAt: '2026年08月18日 11:33:20',
    organization: '郑州银行二七支行', applicantName: '宋婧',
    result: 'rejected', resultText: '否决',
    opinion: '现阶段项目现金流覆盖不足，暂不具备授信条件。',
    completedAt: '2026年08月18日 13:26:34',
  }),
]
