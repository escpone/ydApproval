<script setup>
// 个人中心：展示当前岗位身份、业务统计和由 APP 提供的辅助设置。
import { ref } from 'vue'
import { showToast } from 'vant'

// 当前登录用户由根组件传入，岗位名称用于身份展示。
defineProps({
  user: {
    type: Object,
    required: true,
  },
})

// 待办消息提醒开关，仅在演示页面内维护。
const messageEnabled = ref(true)
// 生物识别开关；真实校验由宿主 APP 负责。
const biometricEnabled = ref(false)

// 尚未接入后端或 APP 的功能统一给出提示，避免产生虚假操作结果。
function unavailable() {
  showToast('该功能由 APP 统一提供')
}
</script>

<template>
  <!-- 身份横幅、统计摘要和设置分组组成个人中心。 -->
  <section class="page-view profile-view">
    <div class="identity-band">
      <div class="avatar">{{ user.userName.slice(0, 1) }}</div>
      <div class="identity-text">
        <div class="name-line">
          <strong>{{ user.userName }}</strong>
          <span><i /> 在岗</span>
        </div>
        <p>{{ user.role }}</p>
        <small>工号 008672</small>
      </div>
    </div>

    <div class="personal-stats" aria-label="本月审批统计">
      <div><strong>28</strong><span>本月已办</span></div>
      <div><strong>96%</strong><span>按时办结</span></div>
      <div><strong>1.6h</strong><span>平均用时</span></div>
    </div>

    <div class="profile-layout">
      <section class="settings-section">
        <h2>工作设置</h2>
        <div class="settings-list">
          <div class="setting-row">
            <span class="setting-icon red"><van-icon name="volume-o" /></span>
            <div><strong>待办消息提醒</strong><small>到期与新增事项及时通知</small></div>
            <van-switch v-model="messageEnabled" size="20px" aria-label="待办消息提醒" />
          </div>
          <div class="setting-row">
            <span class="setting-icon green"><van-icon name="shield-o" /></span>
            <div><strong>生物识别确认</strong><small>审批提交前调用 APP 验证</small></div>
            <van-switch v-model="biometricEnabled" size="20px" aria-label="生物识别确认" />
          </div>
        </div>
      </section>

      <section class="settings-section">
        <h2>更多服务</h2>
        <div class="settings-list">
          <button class="setting-row" type="button" @click="unavailable">
            <span class="setting-icon amber"><van-icon name="records-o" /></span>
            <div><strong>审批授权范围</strong><small>查看当前岗位权限与额度</small></div>
            <van-icon class="row-arrow" name="arrow" />
          </button>
          <button class="setting-row" type="button" @click="unavailable">
            <span class="setting-icon gray"><van-icon name="question-o" /></span>
            <div><strong>帮助与反馈</strong><small>常见问题及问题反馈</small></div>
            <van-icon class="row-arrow" name="arrow" />
          </button>
          <button class="setting-row" type="button" @click="unavailable">
            <span class="setting-icon gray"><van-icon name="info-o" /></span>
            <div><strong>关于系统</strong><small>统一授信移动审批 v1.0.0</small></div>
            <van-icon class="row-arrow" name="arrow" />
          </button>
        </div>
      </section>
    </div>
  </section>
</template>

<style scoped>
/* 个人中心样式按身份区、统计区和设置列表分组。 */
.icon-button {
  display: grid;
  width: 38px;
  height: 38px;
  padding: 0;
  color: #565d68;
  font-size: 21px;
  background: #fff;
  border: 1px solid #e4e6ea;
  border-radius: 6px;
  place-items: center;
}

.identity-band {
  display: flex;
  align-items: center;
  gap: 14px;
  margin: -1px calc(-1 * var(--page-gutter)) 0;
  padding: 22px 16px;
  color: #fff;
  background: var(--brand-primary);
}

.avatar {
  display: grid;
  flex: 0 0 52px;
  width: 52px;
  height: 52px;
  color: var(--brand-primary);
  font-size: 21px;
  font-weight: 650;
  background: #fff;
  border: 3px solid rgb(255 255 255 / 25%);
  border-radius: 50%;
  box-shadow: 0 0 0 1px rgb(255 255 255 / 35%);
  place-items: center;
}

.identity-text {
  min-width: 0;
}

.name-line {
  display: flex;
  align-items: center;
  gap: 9px;
}

.name-line strong {
  font-size: 20px;
  font-weight: 650;
}

.name-line span {
  padding: 3px 7px;
  font-size: 10px;
  background: rgb(255 255 255 / 13%);
  border-radius: 4px;
}

.name-line i {
  display: inline-block;
  width: 5px;
  height: 5px;
  margin-right: 3px;
  vertical-align: 1px;
  background: #5ee3a5;
  border-radius: 50%;
}

.identity-text p {
  margin: 5px 0 2px;
  overflow: hidden;
  font-size: 12px;
  white-space: nowrap;
  text-overflow: ellipsis;
  opacity: .86;
}

.identity-text small {
  font-size: 10px;
  opacity: .63;
}

.personal-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  margin: 0 calc(-1 * var(--page-gutter)) 22px;
  padding: 15px 16px;
  background: #fff;
  border-bottom: 1px solid #e8eaee;
}

.personal-stats div {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.personal-stats div + div::before {
  position: absolute;
  top: 3px;
  bottom: 3px;
  left: 0;
  width: 1px;
  background: #eceef1;
  content: '';
}

.personal-stats strong {
  color: #292d34;
  font-size: 18px;
  font-weight: 650;
}

.personal-stats span {
  margin-top: 3px;
  color: #838994;
  font-size: 10px;
}

.settings-section {
  margin-bottom: 20px;
}

.settings-section h2 {
  margin: 0 0 9px;
  color: #777e89;
  font-size: 12px;
  font-weight: 500;
}

.settings-list {
  overflow: hidden;
  background: #fff;
  border: 1px solid #e8eaee;
  border-radius: 8px;
}

.setting-row {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 66px;
  gap: 11px;
  padding: 10px 13px;
  color: inherit;
  text-align: left;
  background: #fff;
  border: 0;
}

.setting-row + .setting-row {
  border-top: 1px solid #eef0f2;
}

.setting-icon {
  display: grid;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  font-size: 18px;
  border-radius: 6px;
  place-items: center;
}

.setting-icon.red { color: var(--brand-primary); background: var(--brand-primary-soft); }
.setting-icon.green { color: #16724a; background: #edf8f3; }
.setting-icon.amber { color: #9b6419; background: #fff7e8; }
.setting-icon.gray { color: #626b78; background: #f0f2f4; }

.setting-row > div:not(.van-switch) {
  display: flex;
  flex: 1;
  min-width: 0;
  flex-direction: column;
}

.setting-row strong {
  color: #2d3239;
  font-size: 14px;
  font-weight: 500;
}

.setting-row small {
  margin-top: 3px;
  overflow: hidden;
  color: #949aa3;
  font-size: 10px;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.row-arrow {
  flex: none;
  color: #b2b7bf;
  font-size: 14px;
}

@media (min-width: 720px) {
  .profile-view {
    max-width: 1040px;
    margin: 0 auto;
  }

  .identity-band,
  .personal-stats {
    margin-right: 0;
    margin-left: 0;
  }

  .identity-band {
    border-radius: 8px 8px 0 0;
  }

  .personal-stats {
    border: 1px solid #e8eaee;
    border-top: 0;
    border-radius: 0 0 8px 8px;
  }

  .profile-layout {
    display: grid;
    align-items: start;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }
}
</style>
