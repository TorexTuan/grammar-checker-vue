import apiClient, { setCsrfToken } from './index'

export const authApi = {
  async csrf() {
    const response = await apiClient.get('/auth/csrf/')
    setCsrfToken(response.csrfToken)
    return response
  },
  me() {
    return apiClient.get('/auth/me/')
  },
  register(email, password) {
    return apiClient.post('/auth/register/', { email, password })
  },
  login(email, password) {
    return apiClient.post('/auth/login/', { email, password })
  },
  logout() {
    return apiClient.post('/auth/logout/', {})
  }
}
