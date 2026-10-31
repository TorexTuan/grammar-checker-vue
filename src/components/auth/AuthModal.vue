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
          <label>
            <span>Email</span>
            <input v-model.trim="email" type="email" autocomplete="email" required autofocus placeholder="you@example.com" />
            <small v-if="store.authFieldErrors.email">{{ store.authFieldErrors.email[0] }}</small>
          </label>
          <label>
            <span>Password</span>
            <input v-model="password" type="password" :autocomplete="isRegister ? 'new-password' : 'current-password'" required placeholder="Your password" />
            <small v-if="store.authFieldErrors.password">{{ store.authFieldErrors.password[0] }}</small>
          </label>
          <p v-if="store.authError" class="auth-error" role="alert">{{ store.authError }}</p>
          <button class="auth-submit" type="submit" :disabled="store.loading">
            {{ store.loading ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in' }}
          </button>
        </form>

        <button type="button" class="auth-switch" :disabled="store.loading" @click="switchMode">
          {{ isRegister ? 'Already have an account? Sign in' : 'New here? Create an account' }}
        </button>
      </section>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useAppStore } from '../../stores/app'

const store = useAppStore()
const email = ref('')
const password = ref('')
const isRegister = computed(() => store.authMode === 'register')
const titleId = 'account-dialog-title'

function switchMode() {
  store.authMode = isRegister.value ? 'login' : 'register'
  store.authError = ''
  store.authFieldErrors = {}
  password.value = ''
}

async function submit() {
  if (await store.authenticate(store.authMode, email.value, password.value)) {
    password.value = ''
  }
}
</script>

<style scoped>
.auth-overlay {
  position: fixed;
  inset: 0;
  z-index: 200;
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
.auth-modal label { display: grid; gap: 6px; color: var(--text-h); font-size: 13px; font-weight: 700; }
.auth-modal input {
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
.auth-switch { width: 100%; margin-top: 18px; border: 0; background: transparent; color: var(--brand-color); font-family: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
:global(:root[data-theme='dark'] .auth-modal) { border-color: #4a4d61; }
:global(:root[data-theme='dark'] .auth-modal input) { background: #1d1f29; }
</style>
