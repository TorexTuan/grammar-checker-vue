import apiClient from './index'

export const practiceApi = {
  overview() {
    return apiClient.get('/practice/overview/')
  },
  progress() {
    return apiClient.get('/practice/progress/')
  },
  createSession(mode = 'personalized') {
    return apiClient.post('/practice/sessions/', { mode }, { timeout: 12000 })
  },
  getSession(id) {
    return apiClient.get(`/practice/sessions/${id}/`)
  },
  answer(id, exerciseId, answer) {
    return apiClient.post(`/practice/sessions/${id}/answer/`, {
      exercise_id: exerciseId,
      answer
    })
  }
}
