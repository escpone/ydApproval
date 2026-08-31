// 演示环境统一使用固定密码；真实生产环境应由后端认证服务校验。
export const DEFAULT_PASSWORD = '123456'

// 可切换的审批岗位清单。每个岗位同时作为登录选择项和权限判断依据。
export const loginUsers = [
  { role: '信审部组长', userName: '张明远' },
  { role: '授信审批部会签复核', userName: '李静怡' },
  { role: '总行统一授信审批委员会委员', userName: '王建国' },
  { role: '统一授信委员会汇总', userName: '陈思齐' },
  { role: '授信会意见复核', userName: '赵文博' },
  { role: '总行有权审批人', userName: '刘志强' },
  { role: '风险管理部限额管理岗', userName: '周若涵' },
  { role: '风险管理部总经理', userName: '孙立新' },
  { role: '董事会风险管理办公室', userName: '郑雅宁' },
  { role: '董事会风险管理办公室主任', userName: '何宏达' },
  { role: '授信通知书复核岗', userName: '郭晓云' },
  { role: '秘书岗', userName: '冯雨桐' },
]
