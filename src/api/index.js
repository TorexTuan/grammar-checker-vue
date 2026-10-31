import axios from 'axios'

function resolveApiBaseUrl() {
  const configured = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'
  try {
    const url = new URL(configured)
    const browserHost = window.location.hostname
    const loopbackHosts = new Set(['localhost', '127.0.0.1', '::1'])
    if (loopbackHosts.has(url.hostname) && loopbackHosts.has(browserHost)) url.hostname = browserHost
    return url.toString().replace(/\/$/, '')
  } catch {
    return configured
  }
}

let csrfToken = ''

export function setCsrfToken(token) {
  csrfToken = typeof token === 'string' ? token : ''
}

const apiClient = axios.create({
  baseURL: resolveApiBaseUrl(),
  timeout: 60000,
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    if (csrfToken && !['get', 'head', 'options'].includes(config.method?.toLowerCase())) {
      if (typeof config.headers?.set === 'function') config.headers.set('X-CSRFToken', csrfToken)
      else config.headers['X-CSRFToken'] = csrfToken
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (axios.isCancel(error)) {
      error.isCanceled = true
      return Promise.reject(error)
    }

    console.error('API Error:', error.response || error.message)
    const apiError = new Error(
      error.response?.data?.error || error.message || 'Unable to connect to the backend.'
    )
    apiError.status = error.response?.status
    apiError.data = error.response?.data
    apiError.cause = error
    return Promise.reject(apiError)
  }
)

export default apiClient
