import apiClient from './index'

export const documentsApi = {
  list() {
    return apiClient.get('/documents/')
  },
  get(id) {
    return apiClient.get(`/documents/${id}/`)
  },
  create(payload) {
    return apiClient.post('/documents/', payload)
  },
  update(id, payload) {
    return apiClient.patch(`/documents/${id}/`, payload)
  },
  remove(id) {
    return apiClient.delete(`/documents/${id}/`)
  }
}
