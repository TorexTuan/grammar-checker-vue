import apiClient from './index'

/**
 * Grammar checking API calls
 */
export const grammarApi = {
  /**
   * Check text grammar using the Django backend, Sapling, and Gemini explanations
   * @param {string} text - Raw text to check
   * @param {string} language - Target language (e.g., 'en-US')
   * @param {AbortSignal} [signal] - Cancels an obsolete request
   * @returns {Promise<{success: boolean, total_issues: number, sources: Object, issues: Array}>}
   */
  checkGrammar(text, language = 'en-US', signal) {
    return apiClient.post('/check/', {
      text,
      language
    }, {
      signal
    })
  },

  /**
   * Assess the overall quality of a general English text.
   * @param {string} text - Raw text to assess
   * @param {string} language - Target language
   * @param {AbortSignal} [signal] - Cancels an obsolete request
   */
  assessQuality(text, language = 'en-US', signal) {
    return apiClient.post('/assess/', {
      text,
      language
    }, {
      signal
    })
  },

  autocomplete(query, sessionId, signal) {
    return apiClient.post('/autocomplete/', {
      query,
      session_id: sessionId
    }, {
      signal,
      timeout: 7000
    })
  },

  acceptAutocomplete(hash, query, completion, sessionId) {
    return apiClient.post('/autocomplete/accept/', {
      hash,
      query,
      completion,
      session_id: sessionId
    }, {
      timeout: 7000
    })
  },

  rephraseProfessional(text, signal) {
    return apiClient.post('/rephrase/', {
      text,
      style: 'professional',
      num_results: 3
    }, {
      signal,
      timeout: 15000
    })
  },

  /**
   * Health check
   */
  checkHealth() {
    return apiClient.get('/health/')
  }
}
