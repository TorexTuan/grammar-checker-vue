<template>
  <div id="layout">
    <header class="app-header">
      <div class="logo">
        <img class="logo-icon" src="/favicon.svg" alt="" aria-hidden="true" />
        <h1>Ý Grammar Checker</h1>
      </div>
      <nav>
        <button v-if="!store.user" type="button" class="account-button" @click="store.openAuth('login')">Sign in</button>
        <div v-else class="account-menu">
          <span class="account-email" :title="store.user.email">{{ store.user.email }}</span>
          <button type="button" class="account-button account-button--quiet" :disabled="store.loading" @click="handleLogout">Log out</button>
        </div>
        <button type="button" class="theme-toggle" :aria-pressed="theme === 'dark'" :aria-label="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'" @click="toggleTheme">
          <svg v-if="theme === 'dark'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20.9 13.2A9 9 0 0 1 10.8 3.1 9 9 0 1 0 20.9 13.2Z" /></svg>
          <span>{{ theme === 'dark' ? 'Light mode' : 'Dark mode' }}</span>
        </button>
      </nav>
    </header>
    <main class="main-content">
      <router-view />
    </main>
    <AuthModal />
    <Transition name="snackbar">
      <div v-if="snackbarVisible" class="app-snackbar" role="status" aria-live="polite">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
        <span>{{ snackbarMessage }}</span>
        <button type="button" aria-label="Close notification" @click="hideSnackbar">&times;</button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import AuthModal from './components/auth/AuthModal.vue'
import { useAppStore } from './stores/app'

const store = useAppStore()
const theme = ref(document.documentElement.dataset.theme || 'light')
const snackbarVisible = ref(false)
const snackbarMessage = ref('')
let snackbarTimer = null
store.initializeAuth()

async function handleLogout() {
  const loggedOut = await store.requestLogout()
  if (!loggedOut) return
  showSnackbar('You have successfully logged out.')
}

function showSnackbar(message) {
  snackbarMessage.value = message
  snackbarVisible.value = true
  window.clearTimeout(snackbarTimer)
  snackbarTimer = window.setTimeout(hideSnackbar, 3500)
}

function hideSnackbar() {
  snackbarVisible.value = false
  window.clearTimeout(snackbarTimer)
  snackbarTimer = null
}

watch(() => store.user, (user, previousUser) => {
  if (store.authReady && user && !previousUser) {
    showSnackbar('You have successfully logged in.')
  }
})

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  document.documentElement.dataset.theme = theme.value
  try {
    localStorage.setItem('grammar-theme', theme.value)
  } catch {
    // The switch remains usable when browser storage is unavailable.
  }
}

onBeforeUnmount(() => window.clearTimeout(snackbarTimer))
</script>

<style scoped>
#layout {
  --app-header-height: 75px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 110;
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: var(--app-header-height);
  box-sizing: border-box;
  padding: 1rem 2rem;
  border-bottom: 0;
  background: var(--page-bg-gradient);
  box-shadow: 0 3px 14px rgba(35, 22, 62, .08);
}

:global(:root[data-theme='dark'] .app-header) {
  border-bottom: 1px solid var(--border);
  background: var(--header-bg);
}

.logo {
  display: inline-flex;
  align-items: center;
  min-width: 0;
  gap: 10px;
}

.logo-icon {
  flex: 0 0 38px;
  width: 38px;
  height: 38px;
  object-fit: contain;
}

.logo h1 {
  font-size: 1.4rem;
  margin: 0;
  color: var(--brand-color);
  white-space: nowrap;
}

nav {
  display: flex;
  align-items: center;
  gap: 20px;
}

nav a {
  color: var(--text);
  text-decoration: none;
  font-weight: 500;
  transition: color 0.2s;
}

nav a.router-link-exact-active {
  color: var(--brand-color);
}

.account-menu {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.account-email {
  max-width: 180px;
  overflow: hidden;
  color: var(--text-h);
  font-size: 12px;
  font-weight: 700;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.account-button {
  height: 34px;
  padding: 0 12px;
  border: 1px solid #c4b5fd;
  border-radius: 9px;
  background: #ede9fe;
  color: #5b21b6;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.account-button--quiet {
  border-color: var(--border);
  background: var(--surface);
  color: var(--text);
}

:global(:root[data-theme='dark'] .account-button) {
  border-color: #66558c;
  background: #38305a;
  color: #ede9fe;
}

:global(:root[data-theme='dark'] .account-button--quiet) {
  border-color: #4a4d61;
  background: var(--surface);
  color: #bac0d0;
}

.theme-toggle {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 7px 10px;
  background: var(--surface);
  color: var(--text-h);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.theme-toggle svg {
  width: 17px;
  height: 17px;
  transition: transform 260ms ease;
}

.theme-toggle:hover svg {
  transform: rotate(25deg);
}

.main-content {
  flex: 1;
  padding: 0;
}

.app-snackbar {
  position: fixed;
  right: 20px;
  bottom: calc(20px + env(safe-area-inset-bottom));
  z-index: 300;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 48px;
  max-width: min(380px, calc(100vw - 24px));
  box-sizing: border-box;
  padding: 10px 10px 10px 14px;
  border: 1px solid #bbf7d0;
  border-radius: 12px;
  background: #f0fdf4;
  box-shadow: 0 14px 36px rgba(15, 23, 42, .2);
  color: #166534;
  font-size: 13px;
  font-weight: 700;
}

.app-snackbar svg {
  flex: 0 0 20px;
  width: 20px;
  height: 20px;
}

.app-snackbar button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  margin-left: 4px;
  padding: 0;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: inherit;
  font-size: 22px;
  cursor: pointer;
}

.app-snackbar button:hover { background: rgba(22, 101, 52, .1); }

.snackbar-enter-active,
.snackbar-leave-active { transition: opacity 180ms ease, transform 220ms cubic-bezier(.22, 1, .36, 1); }
.snackbar-enter-from,
.snackbar-leave-to { opacity: 0; transform: translateY(12px); }

:global(:root[data-theme='dark'] .app-snackbar) {
  border-color: #276749;
  background: #18352a;
  color: #bbf7d0;
}

@media (max-width: 700px) {
  #layout { --app-header-height: 54px; }
  .app-header { gap: 8px; padding: .65rem .75rem; }
  .logo { gap: 7px; }
  .logo-icon { flex-basis: 28px; width: 28px; height: 28px; }
  .logo h1 { font-size: .95rem; }
  nav { flex: 0 0 auto; gap: 6px; }
  .account-email { display: none; }
  .account-button { height: 32px; padding: 0 8px; font-size: 11px; }
  .theme-toggle { justify-content: center; width: 32px; height: 32px; box-sizing: border-box; padding: 0; }
  .theme-toggle span { display: none; }
  .app-snackbar {
    right: 12px;
    bottom: calc(12px + env(safe-area-inset-bottom));
    left: 12px;
    max-width: none;
  }
}

@media (prefers-reduced-motion: reduce) {
  .snackbar-enter-active,
  .snackbar-leave-active { transition-duration: 1ms; }
}
</style>
