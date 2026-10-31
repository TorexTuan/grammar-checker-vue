import { defineStore } from 'pinia'
import { authApi } from '../api/auth'
import { documentsApi } from '../api/documents'

export const useAppStore = defineStore('app', {
  state: () => ({
    user: null,
    loading: false,
    authReady: false,
    authOpen: false,
    authMode: 'login',
    authError: '',
    authFieldErrors: {},
    documents: [],
    documentsLoading: false,
    pendingAuthAction: null,
    logoutGuard: null
  }),
  actions: {
    setLoading(status) {
      this.loading = status
    },
    async initializeAuth() {
      try {
        await authApi.csrf()
        const response = await authApi.me()
        this.user = response.user
        if (this.user) await this.fetchDocuments()
      } catch {
        this.user = null
      } finally {
        this.authReady = true
      }
    },
    openAuth(mode = 'login', afterAuth = null) {
      this.authMode = mode
      this.authError = ''
      this.authFieldErrors = {}
      this.pendingAuthAction = afterAuth
      this.authOpen = true
    },
    closeAuth() {
      this.authOpen = false
      this.authError = ''
      this.authFieldErrors = {}
      this.pendingAuthAction = null
    },
    async authenticate(mode, email, password) {
      this.loading = true
      this.authError = ''
      this.authFieldErrors = {}
      try {
        await authApi.csrf()
        const response = mode === 'register'
          ? await authApi.register(email, password)
          : await authApi.login(email, password)
        // Django rotates the CSRF secret after a successful login.
        await authApi.csrf()
        this.user = response.user
        this.authOpen = false
        await this.fetchDocuments()
        const pending = this.pendingAuthAction
        this.pendingAuthAction = null
        if (pending) await pending()
        return true
      } catch (error) {
        this.authError = error.data?.error || 'Unable to authenticate. Please try again.'
        this.authFieldErrors = error.data?.errors || {}
        return false
      } finally {
        this.loading = false
      }
    },
    setLogoutGuard(guard) {
      this.logoutGuard = guard
    },
    async requestLogout() {
      if (this.logoutGuard && !(await this.logoutGuard())) return false
      this.loading = true
      try {
        await authApi.csrf()
        await authApi.logout()
        this.user = null
        this.documents = []
        return true
      } finally {
        this.loading = false
      }
    },
    async fetchDocuments() {
      if (!this.user) {
        this.documents = []
        return
      }
      this.documentsLoading = true
      try {
        this.documents = await documentsApi.list()
      } finally {
        this.documentsLoading = false
      }
    },
    upsertDocumentSummary(document) {
      const summary = {
        id: document.id,
        title: document.title,
        version: document.version,
        created_at: document.created_at,
        updated_at: document.updated_at
      }
      this.documents = [summary, ...this.documents.filter(item => item.id !== document.id)]
    },
    async getDocument(id) {
      return documentsApi.get(id)
    },
    async createDocument(payload) {
      const document = await documentsApi.create(payload)
      this.upsertDocumentSummary(document)
      return document
    },
    async updateDocument(id, payload) {
      const document = await documentsApi.update(id, payload)
      this.upsertDocumentSummary(document)
      return document
    },
    async deleteDocument(id) {
      await documentsApi.remove(id)
      this.documents = this.documents.filter(item => item.id !== id)
    }
  }
})
