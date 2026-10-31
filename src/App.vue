<template>
  <div id="layout">
    <header class="app-header">
      <div class="logo">
        <h1>Grammar Checker</h1>
      </div>
      <nav>
        <router-link to="/">Home</router-link>
        <button v-if="!store.user" type="button" class="account-button" @click="store.openAuth('login')">Sign in</button>
        <div v-else class="account-menu">
          <span class="account-email" :title="store.user.email">{{ store.user.email }}</span>
          <button type="button" class="account-button account-button--quiet" :disabled="store.loading" @click="store.requestLogout()">Log out</button>
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
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AuthModal from './components/auth/AuthModal.vue'
import { useAppStore } from './stores/app'

const store = useAppStore()
const theme = ref(document.documentElement.dataset.theme || 'light')
store.initializeAuth()

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark'
  document.documentElement.dataset.theme = theme.value
  try {
    localStorage.setItem('grammar-theme', theme.value)
  } catch {
    // The switch remains usable when browser storage is unavailable.
  }
}
</script>

<style scoped>
#layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  border-bottom: 1px solid var(--border);
  background-color: var(--header-bg);
}

.logo h1 {
  font-size: 1.4rem;
  margin: 0;
  color: var(--brand-color);
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

@media (max-width: 700px) {
  .app-header { padding: .8rem 1rem; }
  nav { gap: 8px; }
  nav > a, .account-email { display: none; }
  .theme-toggle span { display: none; }
}
</style>
