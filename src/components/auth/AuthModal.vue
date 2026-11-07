<template>
  <Teleport to="body">
    <div v-if="store.authOpen" class="auth-overlay" @mousedown.self="store.closeAuth()">
      <section class="auth-modal" role="dialog" aria-modal="true" :aria-labelledby="titleId" @keydown.esc="store.closeAuth()">
        <button type="button" class="auth-close" aria-label="Close" :disabled="store.loading" @click="store.closeAuth()">&times;</button>
        <p class="auth-eyebrow">Grammar Checker</p>
        <h2 :id="titleId">{{ isRegister ? 'Create your account' : 'Welcome back' }}</h2>
        <p class="auth-intro">
          {{ isRegister ? 'Save and access your formatted documents from your account.' : 'Sign in to save this document to your account.' }}
        </p>

        <form @submit.prevent="submit">
          <div class="auth-field">
            <label for="auth-email">Email</label>
            <input id="auth-email" v-model.trim="email" type="email" autocomplete="email" required autofocus placeholder="you@example.com" />
            <small v-if="store.authFieldErrors.email">{{ store.authFieldErrors.email[0] }}</small>
          </div>
          <div class="auth-field">
            <label for="auth-password">Password</label>
            <div class="password-input-wrap">
              <input id="auth-password" v-model="password" :type="showPassword ? 'text' : 'password'" :autocomplete="isRegister ? 'new-password' : 'current-password'" required placeholder="Your password" />
              <button
                type="button"
                class="password-toggle"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                :aria-pressed="showPassword"
                :disabled="store.loading"
                @click="showPassword = !showPassword"
              >
                <svg v-if="!showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="m3 3 18 18" />
                  <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" />
                  <path d="M9.9 4.2A10.5 10.5 0 0 1 12 4c5.5 0 9 8 9 8a16.7 16.7 0 0 1-2 3.2" />
                  <path d="M6.6 6.6C4.3 8.1 3 12 3 12s3.5 8 9 8a9.8 9.8 0 0 0 4.1-.9" />
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
            <small v-if="store.authFieldErrors.password">{{ store.authFieldErrors.password[0] }}</small>
          </div>
          <div v-if="isRegister" class="auth-field">
            <label for="auth-confirm-password">Confirm password</label>
            <div class="password-input-wrap">
              <input id="auth-confirm-password" v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" autocomplete="new-password" required placeholder="Enter your password again" />
              <button
                type="button"
                class="password-toggle"
                :aria-label="showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'"
                :aria-pressed="showConfirmPassword"
                :disabled="store.loading"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <svg v-if="!showConfirmPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="m3 3 18 18" />
                  <path d="M10.6 10.7a2 2 0 0 0 2.7 2.7" />
                  <path d="M9.9 4.2A10.5 10.5 0 0 1 12 4c5.5 0 9 8 9 8a16.7 16.7 0 0 1-2 3.2" />
                  <path d="M6.6 6.6C4.3 8.1 3 12 3 12s3.5 8 9 8a9.8 9.8 0 0 0 4.1-.9" />
                </svg>
                <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                  <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </button>
            </div>
            <small v-if="confirmPasswordError" role="alert">{{ confirmPasswordError }}</small>
          </div>
          <p v-if="store.authError" class="auth-error" role="alert">{{ store.authError }}</p>
          <button class="auth-submit" type="submit" :disabled="store.loading">
            {{ store.loading ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in' }}
          </button>
        </form>

        <div class="auth-switch-row">
          <span>{{ isRegister ? 'Already have an account?' : 'New here?' }}</span>
          <button type="button" class="auth-switch" :disabled="store.loading" @click="switchMode">
            {{ isRegister ? 'Sign in' : 'Create an account' }}
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useAppStore } from '../../stores/app'

const store = useAppStore()
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const confirmPasswordError = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isRegister = computed(() => store.authMode === 'register')
const titleId = 'account-dialog-title'

watch(() => store.authOpen, isOpen => {
  if (!isOpen) {
    email.value = ''
    password.value = ''
    confirmPassword.value = ''
    confirmPasswordError.value = ''
    showPassword.value = false
    showConfirmPassword.value = false
  }
})

watch([password, confirmPassword], () => {
  if (confirmPasswordError.value && password.value === confirmPassword.value) {
    confirmPasswordError.value = ''
  }
})

function switchMode() {
  store.authMode = isRegister.value ? 'login' : 'register'
  store.authError = ''
  store.authFieldErrors = {}
  password.value = ''
  confirmPassword.value = ''
  confirmPasswordError.value = ''
  showPassword.value = false
  showConfirmPassword.value = false
}

async function submit() {
  if (isRegister.value && password.value !== confirmPassword.value) {
    confirmPasswordError.value = 'Passwords do not match.'
    return
  }
  confirmPasswordError.value = ''
  if (await store.authenticate(store.authMode, email.value, password.value)) {
    password.value = ''
    confirmPassword.value = ''
    showPassword.value = false
    showConfirmPassword.value = false
  }
}
</script>

<style scoped>
.auth-overlay {
  position: fixed;
  inset: 0;
  z-index: 300;
  display: grid;
  place-items: center;
  box-sizing: border-box;
  padding: 20px;
  background: rgba(15, 11, 24, 0.58);
  backdrop-filter: blur(5px);
}

.auth-modal {
  position: relative;
  width: min(420px, 100%);
  box-sizing: border-box;
  padding: 30px;
  border: 1px solid #e5def2;
  border-radius: 20px;
  background: var(--surface);
  color: var(--text-h);
  box-shadow: 0 28px 70px rgba(35, 22, 62, 0.3);
}

.auth-close {
  position: absolute;
  top: 12px;
  right: 14px;
  width: 34px;
  height: 34px;
  border: 0;
  border-radius: 10px;
  background: transparent;
  color: var(--text);
  font-size: 25px;
  cursor: pointer;
}

.auth-close:hover { background: var(--accent-bg); color: var(--brand-color); }
.auth-eyebrow { margin: 0 0 6px; color: var(--brand-color); font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.auth-modal h2 { margin: 0; font-size: 26px; }
.auth-intro { margin: 8px 0 22px; color: var(--text); font-size: 14px; line-height: 1.5; }
.auth-modal form { display: grid; gap: 15px; }
.auth-field { display: grid; gap: 6px; }
.auth-field > label { color: var(--text-h); font-size: 13px; font-weight: 700; }
.auth-modal input {
  width: 100%;
  height: 44px;
  box-sizing: border-box;
  padding: 0 13px;
  border: 1px solid var(--border);
  border-radius: 11px;
  background: var(--bg);
  color: var(--text-h);
  font: inherit;
}
.auth-modal input:focus { border-color: #8b5cf6; outline: 2px solid rgba(139, 92, 246, .2); }
.auth-modal input::placeholder { font-size: 14px; }
.password-input-wrap { position: relative; }
.password-input-wrap input { padding-right: 46px; }
.password-toggle {
  position: absolute;
  top: 50%;
  right: 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: var(--text);
  cursor: pointer;
  transform: translateY(-50%);
}
.password-toggle svg { width: 19px; height: 19px; }
.password-toggle:hover:not(:disabled) { background: var(--accent-bg); color: var(--brand-color); }
.password-toggle:focus-visible { outline: 2px solid #8b5cf6; outline-offset: 1px; }
.password-toggle:disabled { opacity: .55; cursor: wait; }
.auth-modal small, .auth-error { color: #dc2626; font-size: 12px; font-weight: 500; }
.auth-error { margin: 0; }
.auth-submit {
  height: 44px;
  border: 0;
  border-radius: 11px;
  background: #6d28d9;
  color: white;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}
.auth-submit:hover:not(:disabled) { background: #5b21b6; }
.auth-submit:disabled, .auth-switch:disabled, .auth-close:disabled { opacity: .55; cursor: wait; }
.auth-switch-row { display: flex; align-items: center; justify-content: center; gap: 5px; margin-top: 18px; color: var(--text); font-size: 13px; }
.auth-switch {
  padding: 2px 4px;
  border: 0;
  border-radius: 5px;
  background: transparent;
  color: var(--brand-color);
  font-family: inherit;
  font-size: inherit;
  font-weight: 800;
  text-decoration: underline;
  text-underline-offset: 3px;
  cursor: pointer;
}
.auth-switch:hover:not(:disabled) { background: var(--accent-bg); }
.auth-switch:focus-visible { outline: 2px solid #8b5cf6; outline-offset: 2px; }
:global(:root[data-theme='dark'] .auth-modal) { border-color: #4a4d61; }
:global(:root[data-theme='dark'] .auth-modal input) { background: #1d1f29; }
</style>
