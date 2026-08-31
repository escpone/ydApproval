<script setup>
// 登录页面：让用户选择审批岗位，并用演示密码完成本地登录。
import { computed, ref } from 'vue'
import { showToast } from 'vant'
import { DEFAULT_PASSWORD, loginUsers } from '../data/loginUsers'

// 登录成功后将用户对象交给根组件建立会话。
const emit = defineEmits(['login'])

// 控制底部岗位选择器的显示状态。
const rolePickerVisible = ref(false)
// 当前选中的岗位名称，也是登录校验的主键。
const selectedRole = ref('')
// 选择岗位后自动填充的演示用户名。
const userName = ref('')
// 登录密码输入值；默认由岗位选择动作填入。
const password = ref('')
// 控制密码明文/掩码显示。
const passwordVisible = ref(false)

// Vant Picker 需要 text/value 结构，直接由岗位清单转换。
const roleOptions = loginUsers.map((user) => ({
  text: user.role,
  value: user.role,
}))

// 三个必填值齐备时才启用登录按钮。
const canSubmit = computed(() => Boolean(selectedRole.value && userName.value && password.value))

// 根据岗位值回填用户信息并关闭选择器。
function selectRole(role) {
  const user = loginUsers.find((entry) => entry.role === role)
  if (!user) return

  selectedRole.value = user.role
  userName.value = user.userName
  password.value = DEFAULT_PASSWORD
  rolePickerVisible.value = false
}

// 将 Picker 的确认事件适配为岗位选择函数。
function confirmRole({ selectedOptions }) {
  selectRole(selectedOptions[0]?.value)
}

// 校验岗位和固定演示密码，通过事件通知父组件。
function login() {
  const user = loginUsers.find((entry) => entry.role === selectedRole.value)
  if (!user) {
    showToast('请选择岗位')
    return
  }
  if (password.value !== DEFAULT_PASSWORD) {
    showToast('密码错误，请输入 123456')
    return
  }

  emit('login', user)
}
</script>

<template>
  <!-- 品牌头部、账号表单和岗位选择器构成登录首屏。 -->
  <section class="login-view">
    <div class="login-brand">
      <div class="login-brand-inner">
        <span class="bank-mark" aria-hidden="true"><van-icon name="shield-o" /></span>
        <h1>统一授信移动审批</h1>
      </div>
    </div>

    <div class="login-form-wrap">
      <form class="login-panel" autocomplete="on" @submit.prevent="login">
        <header class="login-heading">
          <h2>账号登录</h2>
          <span>内部业务系统</span>
        </header>

        <div class="login-fields">
          <button
            class="role-select"
            type="button"
            aria-haspopup="listbox"
            :aria-expanded="rolePickerVisible"
            @click="rolePickerVisible = true"
          >
            <span>岗位</span>
            <strong :class="{ placeholder: !selectedRole }">
              {{ selectedRole || '请选择岗位' }}
            </strong>
            <van-icon name="arrow" />
          </button>

          <van-field
            v-model="userName"
            label="用户名"
            name="username"
            readonly
            autocomplete="username"
            placeholder="选择岗位后自动填入"
          />
          <van-field
            v-model="password"
            label="密码"
            name="password"
            :type="passwordVisible ? 'text' : 'password'"
            :readonly="!selectedRole"
            :right-icon="passwordVisible ? 'eye-o' : 'closed-eye'"
            autocomplete="current-password"
            placeholder="选择岗位后自动填入"
            @click-right-icon="passwordVisible = !passwordVisible"
          />
        </div>

        <van-button
          class="login-button"
          block
          type="primary"
          native-type="submit"
          :disabled="!canSubmit"
        >
          登录
        </van-button>
      </form>
    </div>

    <p class="login-footer">统一授信管理</p>

    <van-popup
      v-model:show="rolePickerVisible"
      class="role-picker-popup"
      position="bottom"
      round
      :safe-area-inset-bottom="true"
    >
      <van-picker
        title="选择岗位"
        :columns="roleOptions"
        @confirm="confirmRole"
        @cancel="rolePickerVisible = false"
      />
    </van-popup>
  </section>
</template>

<style scoped>
/* 登录样式同时适配移动端安全区域、桌面宽度和横屏矮视口。 */
.login-view {
  min-height: calc(100vh - var(--app-header-offset));
  min-height: calc(100dvh - var(--app-header-offset));
  padding-bottom: calc(20px + env(safe-area-inset-bottom));
  overflow-x: hidden;
  background: #f6f7f9;
}

.login-brand {
  min-height: 230px;
  padding: calc(40px + env(safe-area-inset-top)) max(20px, env(safe-area-inset-right)) 68px max(20px, env(safe-area-inset-left));
  color: #fff;
  background: var(--brand-primary);
}

.login-brand-inner {
  width: min(100%, 440px);
  margin: 0 auto;
}

.bank-mark {
  display: grid;
  width: 44px;
  height: 44px;
  margin-bottom: 22px;
  color: var(--brand-primary);
  font-size: 25px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 6px 18px rgb(150 64 4 / 18%);
  place-items: center;
}

.login-brand p {
  margin: 0 0 7px;
  font-size: 14px;
  font-weight: 500;
  opacity: .82;
}

.login-brand h1 {
  margin: 0;
  font-size: 28px;
  font-weight: 650;
  line-height: 38px;
  letter-spacing: 0;
}

.login-form-wrap {
  width: min(100% - 32px, 440px);
  margin: -44px auto 0;
}

.login-panel {
  padding: 24px 22px 26px;
  background: #fff;
  border: 1px solid #e8eaee;
  border-radius: 8px;
  box-shadow: 0 12px 36px rgb(31 38 46 / 10%);
}

.login-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.login-heading h2 {
  margin: 0;
  color: #20242b;
  font-size: 21px;
  font-weight: 650;
}

.login-heading span {
  color: #9a9fa8;
  font-size: 11px;
}

.login-fields {
  border-top: 1px solid #eceef1;
  border-bottom: 1px solid #eceef1;
}

.role-select {
  display: grid;
  grid-template-columns: 72px minmax(0, 1fr) 18px;
  align-items: center;
  width: 100%;
  min-height: 54px;
  gap: 8px;
  padding: 12px 0;
  color: #323842;
  text-align: left;
  background: #fff;
  border: 0;
  border-bottom: 1px solid #f0f1f3;
}

.role-select > span {
  color: #646b75;
  font-size: 14px;
}

.role-select strong {
  min-width: 0;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  overflow-wrap: anywhere;
}

.role-select strong.placeholder {
  color: #c2c5cc;
}

.role-select .van-icon {
  color: #969ba4;
  font-size: 15px;
}

.login-fields :deep(.van-cell) {
  padding: 15px 0;
}

.login-fields :deep(.van-cell + .van-cell) {
  border-top: 1px solid #f0f1f3;
}

.login-fields :deep(.van-field__label) {
  width: 72px;
  color: #646b75;
}

.login-fields :deep(.van-field__control:read-only) {
  color: #323842;
}

.login-button {
  height: 44px;
  margin-top: 24px;
  font-weight: 600;
  border-radius: 6px;
}

.login-footer {
  margin: 22px 0 0;
  color: #a1a6ae;
  font-size: 10px;
  text-align: center;
}

.role-picker-popup {
  max-height: 76vh;
  max-height: 76dvh;
}

.role-picker-popup :deep(.van-picker-column__item) {
  padding: 0 20px;
  text-align: center;
}

@media (min-width: 720px) {
  .login-brand {
    min-height: 280px;
    padding-top: calc(54px + env(safe-area-inset-top));
    padding-bottom: 88px;
  }

  .login-brand-inner,
  .login-form-wrap {
    width: min(100% - 48px, 480px);
  }

  .login-form-wrap {
    margin-top: -58px;
  }

  .login-panel {
    padding: 30px 32px 32px;
  }

  .role-picker-popup {
    right: auto;
    left: 50%;
    width: min(600px, calc(100% - 48px));
    transform: translateX(-50%);
  }
}

@media (orientation: landscape) and (max-height: 520px) {
  .login-brand {
    min-height: 150px;
    padding-top: calc(22px + env(safe-area-inset-top));
    padding-bottom: 42px;
  }

  .bank-mark {
    width: 36px;
    height: 36px;
    margin-bottom: 10px;
    font-size: 21px;
  }

  .login-brand p {
    margin-bottom: 2px;
    font-size: 12px;
  }

  .login-brand h1 {
    font-size: 23px;
    line-height: 30px;
  }

  .login-form-wrap {
    margin-top: -30px;
  }

  .login-panel {
    padding: 18px 24px 20px;
  }

  .login-heading {
    margin-bottom: 10px;
  }

  .role-select {
    min-height: 44px;
    padding-top: 8px;
    padding-bottom: 8px;
  }

  .login-fields :deep(.van-cell) {
    padding-top: 10px;
    padding-bottom: 10px;
  }

  .login-button {
    height: 40px;
    margin-top: 14px;
  }

  .login-footer {
    margin-top: 12px;
  }
}
</style>
