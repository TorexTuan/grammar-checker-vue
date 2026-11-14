<template>
  <div class="practice-page">
    <section v-if="!store.authReady" class="practice-state-card" aria-live="polite">
      <div class="practice-spinner"></div>
      <p>Preparing your practice space…</p>
    </section>

    <section v-else-if="store.authInitializationError" class="practice-state-card practice-auth-error" role="alert">
      <span class="practice-kicker">Connection problem</span>
      <h1>Authentication service unavailable</h1>
      <p>{{ store.authInitializationError }}</p>
      <button type="button" @click="store.initializeAuth()">Try again</button>
    </section>

    <section v-else-if="!store.user" class="practice-auth-card">
      <span class="practice-kicker">Personal practice</span>
      <h1>Turn your writing mistakes into progress.</h1>
      <p>Sign in to generate private exercises, save your score, and focus on the grammar topics that need the most attention.</p>
      <button type="button" @click="store.openAuth('login', initialize)">Sign in to practice</button>
    </section>

    <template v-else>
      <div ref="scoreControlRef" class="practice-score-control" @keydown.esc="scorePopoverOpen = false">
        <div class="practice-score-card">
          <strong>{{ progress?.accuracy ?? '—' }}<small v-if="progress?.accuracy !== null">%</small></strong>
          <span>overall accuracy</span>
          <small>{{ progress?.answered || 0 }} answers · {{ progress?.completed_sessions || 0 }} sessions</small>
        </div>
        <button
          type="button"
          class="practice-score-trigger"
          aria-label="Show practice progress"
          aria-controls="practice-score-popover"
          :aria-expanded="scorePopoverOpen"
          @click="scorePopoverOpen = !scorePopoverOpen"
        >
          <strong>{{ progress?.accuracy ?? '—' }}<small v-if="progress?.accuracy !== null">%</small></strong>
        </button>
        <Transition name="score-popover">
          <div v-if="scorePopoverOpen" id="practice-score-popover" class="practice-score-popover" role="status">
            <strong>{{ progress?.accuracy ?? '—' }}<small v-if="progress?.accuracy !== null">%</small></strong>
            <span>overall accuracy</span>
            <small>{{ progress?.answered || 0 }} answers · {{ progress?.completed_sessions || 0 }} sessions</small>
          </div>
        </Transition>
      </div>

      <p v-if="pageError" class="practice-alert" role="alert">{{ pageError }}</p>

      <section v-if="loading && !session" class="practice-state-card" aria-live="polite">
        <div class="practice-spinner"></div>
        <p>Loading your progress…</p>
      </section>

      <section v-else-if="!session" class="practice-dashboard">
        <div class="practice-section-heading">
          <div><span>Choose a focus</span><h2>What would you like to practice?</h2></div>
          <p>Practice your own grammar patterns or build broad skills from easy to hard.</p>
        </div>
        <div class="topic-grid">
          <button type="button" class="topic-card topic-card--recommended" :class="{ 'is-selected': selectedMode === 'personalized' }" :disabled="!overview?.personalized?.available" @click="selectedMode = 'personalized'">
            <span class="topic-icon">✦</span>
            <strong>Practice your mistakes</strong>
            <small v-if="overview?.personalized?.available">{{ overview.personalized.mistake_count }} saved mistake(s) across {{ overview.personalized.concept_count }} grammar pattern(s)</small>
            <small v-else>Write in the Editor first so we can build exercises from your grammar mistakes.</small>
          </button>
          <button type="button" class="topic-card" :class="{ 'is-selected': selectedMode === 'general' }" @click="selectedMode = 'general'">
            <span class="topic-icon">A+</span>
            <strong>General grammar practice</strong>
            <small>Current level: {{ capitalize(overview?.general?.level || 'easy') }} · Mixed grammar from simple to complex</small>
          </button>
        </div>
        <button type="button" class="start-practice-button" :disabled="creating || !canStart" @click="startSession">
          <span>{{ creating ? 'Preparing exercises…' : 'Start 10-question session' }}</span>
          <span aria-hidden="true">→</span>
        </button>
      </section>

      <section v-else-if="showSummary || session.completed && currentIndex >= session.items.length" class="practice-summary">
        <span class="summary-icon">{{ session.correct / session.total >= 0.8 ? '★' : '✓' }}</span>
        <span class="practice-kicker">Session complete</span>
        <h2>{{ session.correct }} out of {{ session.total }} correct</h2>
        <p>{{ summaryMessage }}</p>
        <div class="summary-score"><span :style="{ '--score': `${session.correct / session.total * 100}%` }"></span></div>
        <div class="summary-actions">
          <button type="button" class="secondary-button" @click="reviewSession">Review answers</button>
          <button type="button" class="primary-button" @click="finishSession">Practice again</button>
        </div>
      </section>

      <section v-else class="practice-session">
        <div class="session-topline">
          <button type="button" class="session-exit" @click="leaveSession">← Topics</button>
          <span>{{ session.topic_label }}</span>
          <strong>{{ currentIndex + 1 }} / {{ session.total }}</strong>
        </div>
        <div class="session-progress" aria-label="Session progress"><span :style="{ width: `${(currentIndex + 1) / session.total * 100}%` }"></span></div>

        <article v-if="currentItem" class="question-card">
          <div class="question-meta">
            <span>{{ currentItem.exercise_type === 'multiple_choice' ? 'Multiple choice' : 'Fill in the blank' }}</span>
            <span>{{ currentItem.category_label }}</span>
            <span class="difficulty-badge" :class="`difficulty-badge--${currentItem.difficulty || 'medium'}`">{{ capitalize(currentItem.difficulty || 'medium') }}</span>
          </div>
          <h2>{{ currentItem.prompt }}</h2>
          <p v-if="showAnswerHint" class="answer-hint">
            <span>{{ hintLabel }}</span><strong>{{ currentItem.hint }}</strong>
          </p>

          <div v-if="currentItem.exercise_type === 'multiple_choice'" class="answer-options">
            <button v-for="(option, index) in currentItem.options" :key="option" type="button" :disabled="currentItem.answered" :class="optionClass(option)" @click="answer = option">
              <span>{{ String.fromCharCode(65 + index) }}</span><strong>{{ option }}</strong>
            </button>
          </div>
          <label v-else class="fill-answer">
            <span>Your answer</span>
            <input v-model="answer" type="text" autocomplete="off" :disabled="currentItem.answered" placeholder="Enter only the missing word or phrase" @keydown.enter.prevent="submitAnswer" />
          </label>

          <div v-if="currentItem.answered" class="answer-feedback" :class="currentItem.is_correct ? 'is-correct' : 'is-wrong'" role="status">
            <div><strong>{{ currentItem.is_correct ? 'Correct!' : 'Not quite yet' }}</strong><span>Correct answer: {{ currentItem.correct_answer }}</span></div>
            <p>{{ currentItem.explanation }}</p>
          </div>

          <p v-if="answerError" class="question-error" role="alert">{{ answerError }}</p>
          <div class="question-actions">
            <button v-if="!currentItem.answered" type="button" class="primary-button" :disabled="!answer.trim() || submitting" @click="submitAnswer">{{ submitting ? 'Checking…' : 'Check answer' }}</button>
            <button v-else type="button" class="primary-button" @click="nextQuestion">{{ currentIndex === session.items.length - 1 ? 'See results' : 'Next question' }} →</button>
          </div>
        </article>
        <p v-if="session.source_summary?.template" class="fallback-note">Some exercises were prepared from the trusted fallback library.</p>
      </section>
    </template>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { practiceApi } from '../api/practice'
import { useAppStore } from '../stores/app'

const store = useAppStore()
const overview = ref(null)
const progress = ref(null)
const session = ref(null)
const selectedMode = ref('personalized')
const currentIndex = ref(0)
const answer = ref('')
const loading = ref(false)
const creating = ref(false)
const submitting = ref(false)
const showSummary = ref(false)
const pageError = ref('')
const answerError = ref('')
const scoreControlRef = ref(null)
const scorePopoverOpen = ref(false)

const currentItem = computed(() => session.value?.items?.[currentIndex.value] || null)
const verbHintCategories = new Set(['verb_tense', 'subject_verb_agreement', 'other_grammar'])
const showAnswerHint = computed(() => (
  currentItem.value?.exercise_type === 'fill_blank' &&
  !!currentItem.value?.hint &&
  (verbHintCategories.has(currentItem.value.category) || currentItem.value.category === 'word_form')
))
const hintLabel = computed(() => currentItem.value?.category === 'word_form' ? 'Base word' : 'Suggested verb (infinitive)')
const canStart = computed(() => selectedMode.value === 'general' || !!overview.value?.personalized?.available)
const summaryMessage = computed(() => {
  const score = session.value?.correct || 0
  const total = session.value?.total || 10
  if (score === total) return 'Excellent work — you completed a perfect session.'
  if (score / total >= 0.6) return 'Good progress. Review the explanations and keep the momentum going.'
  return 'Every mistake is useful data. Try another round to reinforce these patterns.'
})

function storageKey() {
  return store.user ? `grammar-practice-active:${store.user.id}` : null
}

function readActiveSession(key) {
  try { return key ? localStorage.getItem(key) : null } catch { return null }
}

function writeActiveSession(key, id) {
  try {
    if (key && id) localStorage.setItem(key, id)
    else if (key) localStorage.removeItem(key)
  } catch {
    // Server-side session state remains available when browser storage is disabled.
  }
}

function capitalize(value) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1) : ''
}

function closeScorePopoverOnOutsideClick(event) {
  if (scorePopoverOpen.value && !scoreControlRef.value?.contains(event.target)) {
    scorePopoverOpen.value = false
  }
}

async function initialize() {
  if (!store.user || loading.value) return
  loading.value = true
  pageError.value = ''
  try {
    const [overviewData, progressData] = await Promise.all([practiceApi.overview(), practiceApi.progress()])
    overview.value = overviewData
    progress.value = progressData
    if (!overviewData.personalized?.available) selectedMode.value = 'general'
    const key = storageKey()
    const activeId = readActiveSession(key)
    if (activeId) {
      try {
        session.value = await practiceApi.getSession(activeId)
        const firstUnanswered = session.value.items.findIndex(item => !item.answered)
        currentIndex.value = firstUnanswered >= 0 ? firstUnanswered : session.value.items.length
        showSummary.value = session.value.completed
      } catch {
        writeActiveSession(key, null)
      }
    }
  } catch (error) {
    pageError.value = error.message || 'Unable to load Practice right now.'
  } finally {
    loading.value = false
  }
}

async function startSession() {
  if (creating.value) return
  creating.value = true
  pageError.value = ''
  try {
    session.value = await practiceApi.createSession(selectedMode.value)
    currentIndex.value = 0
    answer.value = ''
    showSummary.value = false
    writeActiveSession(storageKey(), session.value.id)
  } catch (error) {
    pageError.value = error.message || 'Unable to prepare a practice session.'
  } finally {
    creating.value = false
  }
}

function optionClass(option) {
  const item = currentItem.value
  return {
    'is-selected': answer.value === option && !item.answered,
    'is-correct': item.answered && option === item.correct_answer,
    'is-wrong': item.answered && option === item.user_answer && !item.is_correct
  }
}

async function submitAnswer() {
  const item = currentItem.value
  if (!item || item.answered || !answer.value.trim() || submitting.value) return
  submitting.value = true
  answerError.value = ''
  try {
    const result = await practiceApi.answer(session.value.id, item.exercise_id, answer.value)
    session.value = result.session
    answer.value = result.user_answer
  } catch (error) {
    answerError.value = error.message || 'Unable to check this answer. Please try again.'
  } finally {
    submitting.value = false
  }
}

function nextQuestion() {
  if (currentIndex.value >= session.value.items.length - 1) {
    currentIndex.value = session.value.items.length
    showSummary.value = true
    const key = storageKey()
    writeActiveSession(key, null)
    refreshProgress()
    return
  }
  currentIndex.value += 1
  const item = currentItem.value
  answer.value = item?.answered ? item.user_answer : ''
  answerError.value = ''
}

function reviewSession() {
  currentIndex.value = 0
  answer.value = session.value.items[0]?.user_answer || ''
  showSummary.value = false
}

async function finishSession() {
  session.value = null
  currentIndex.value = 0
  answer.value = ''
  showSummary.value = false
  await initialize()
}

function leaveSession() {
  writeActiveSession(storageKey(), null)
  session.value = null
  currentIndex.value = 0
  answer.value = ''
  showSummary.value = false
}

async function refreshProgress() {
  try {
    progress.value = await practiceApi.progress()
    overview.value = await practiceApi.overview()
  } catch {
    // Session results remain visible when refreshing aggregate progress fails.
  }
}

watch(() => store.user, (user, previous) => {
  if (user && !previous) initialize()
  if (!user) {
    session.value = null
    overview.value = null
    progress.value = null
  }
})

onMounted(() => {
  document.addEventListener('pointerdown', closeScorePopoverOnOutsideClick)
  if (store.authReady && store.user) initialize()
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', closeScorePopoverOnOutsideClick)
})
</script>

<style scoped>
.practice-page { position: relative; width: min(1360px, calc(100% - 32px)); min-height: calc(100vh - 75px); margin: 0 auto; padding: 24px 0 70px; color: var(--text-h); }
.practice-kicker, .practice-section-heading span { color: var(--brand-color); font-size: 11px; font-weight: 900; letter-spacing: .12em; text-transform: uppercase; }
.practice-auth-card h1 {
  max-width: 620px;
  margin: 7px auto 12px;
  font-size: clamp(30px, 4vw, 48px);
  line-height: 1.12;
  letter-spacing: -.035em;
  text-wrap: balance;
}
.practice-auth-card p { margin: 0; color: var(--text); line-height: 1.6; }
.practice-score-control { position: absolute; top: 24px; right: 0; z-index: 5; }
.practice-score-card { display: grid; width: 240px; box-sizing: border-box; padding: 22px; border: 1px solid var(--border); border-radius: 18px; background: var(--surface); box-shadow: 0 18px 50px rgba(49, 35, 80, .1); }
.practice-score-card strong { color: var(--brand-color); font-size: 38px; line-height: 1; }.practice-score-card strong small { font-size: 18px; }
.practice-score-card span { margin: 7px 0; font-weight: 800; }.practice-score-card > small { color: var(--text); }
.practice-score-trigger, .practice-score-popover { display: none; }
.practice-dashboard, .practice-session, .practice-summary, .practice-auth-card, .practice-state-card { box-sizing: border-box; border: 1px solid var(--border); border-radius: 22px; background: var(--surface); box-shadow: 0 24px 70px rgba(49, 35, 80, .1); }
.practice-dashboard { max-width: 860px; margin: 0 auto; padding: 28px; }.practice-section-heading { display: flex; justify-content: space-between; gap: 24px; margin-bottom: 22px; }.practice-section-heading h2 { margin: 4px 0 0; font-size: 24px; }.practice-section-heading p { max-width: 360px; margin: 0; color: var(--text); font-size: 13px; line-height: 1.5; }
.topic-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.topic-card { display: grid; min-height: 118px; padding: 16px; border: 1px solid var(--border); border-radius: 14px; background: var(--surface); color: var(--text-h); text-align: left; cursor: pointer; transition: transform 160ms ease, border-color 160ms ease, background 160ms ease; }
.topic-card:hover { transform: translateY(-2px); border-color: #a78bfa; }.topic-card.is-selected { border-color: #7c3aed; background: var(--accent-bg); box-shadow: inset 0 0 0 1px #7c3aed; }.topic-card--recommended { background: linear-gradient(135deg, var(--accent-bg), var(--surface)); }
.topic-icon { display: grid; place-items: center; width: 30px; height: 30px; margin-bottom: 10px; border-radius: 9px; background: #ede9fe; color: #6d28d9; font-weight: 900; }.topic-card strong { font-size: 14px; }.topic-card small { margin-top: 4px; color: var(--text); }
.topic-card:disabled { cursor: not-allowed; opacity: .62; transform: none; }
.start-practice-button { display: flex; align-items: center; justify-content: space-between; width: 100%; min-height: 50px; margin-top: 20px; padding: 0 18px; border: 0; border-radius: 12px; background: #6d28d9; color: #fff; font: inherit; font-weight: 900; cursor: pointer; }.start-practice-button:hover:not(:disabled), .primary-button:hover:not(:disabled) { background: #5b21b6; }.start-practice-button:disabled, .primary-button:disabled { opacity: .55; cursor: wait; }
.practice-session { max-width: 860px; margin: 0 auto; padding: 24px; }.session-topline { display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; gap: 12px; color: var(--text); font-size: 12px; font-weight: 800; }.session-topline strong { justify-self: end; color: var(--text-h); }.session-exit { justify-self: start; padding: 0; border: 0; background: transparent; color: var(--brand-color); font: inherit; font-weight: 800; cursor: pointer; }
.session-progress { height: 7px; margin: 16px 0 28px; overflow: hidden; border-radius: 999px; background: var(--accent-bg); }.session-progress span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, #8b5cf6, #6d28d9); transition: width 250ms ease; }
.question-card { padding: 4px 10px 8px; }.question-meta { display: flex; flex-wrap: wrap; gap: 8px; }.question-meta span { padding: 5px 8px; border-radius: 999px; background: var(--accent-bg); color: var(--brand-color); font-size: 10px; font-weight: 900; text-transform: uppercase; }.question-meta .difficulty-badge--easy { background: rgba(34, 197, 94, .13); color: #15803d; }.question-meta .difficulty-badge--medium { background: rgba(245, 158, 11, .14); color: #b45309; }.question-meta .difficulty-badge--hard { background: rgba(239, 68, 68, .12); color: #b91c1c; }.question-card h2 { margin: 20px 0 24px; font-size: clamp(22px, 4vw, 30px); line-height: 1.35; }
:global(:root[data-theme='dark']) .question-meta .difficulty-badge--easy { color: #86efac; }
:global(:root[data-theme='dark']) .question-meta .difficulty-badge--medium { color: #fcd34d; }
:global(:root[data-theme='dark']) .question-meta .difficulty-badge--hard { color: #fca5a5; }
.answer-hint { display: inline-flex; align-items: center; gap: 8px; margin: -10px 0 18px; padding: 7px 10px; border: 1px solid #ddd6fe; border-radius: 9px; background: var(--accent-bg); color: var(--text); font-size: 12px; }.answer-hint span { color: var(--brand-color); font-size: 10px; font-weight: 900; letter-spacing: .06em; text-transform: uppercase; }.answer-hint strong { color: var(--text-h); font-size: 13px; }
.answer-options { display: grid; gap: 10px; }.answer-options button { display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 9px 13px; border: 1px solid var(--border); border-radius: 12px; background: var(--surface); color: var(--text-h); text-align: left; cursor: pointer; }.answer-options button > span { display: grid; place-items: center; flex: 0 0 30px; height: 30px; border-radius: 8px; background: var(--accent-bg); color: var(--brand-color); }.answer-options button.is-selected { border-color: #7c3aed; background: var(--accent-bg); }.answer-options button.is-correct { border-color: #22c55e; background: rgba(34,197,94,.09); }.answer-options button.is-wrong { border-color: #ef4444; background: rgba(239,68,68,.08); }
.fill-answer { display: grid; gap: 8px; }.fill-answer span { font-size: 12px; font-weight: 900; }.fill-answer input { height: 50px; box-sizing: border-box; padding: 0 14px; border: 1px solid var(--border); border-radius: 12px; outline: none; background: var(--surface); color: var(--text-h); font: inherit; }.fill-answer input:focus { border-color: #8b5cf6; box-shadow: 0 0 0 3px rgba(139,92,246,.15); }
.answer-feedback { margin-top: 18px; padding: 16px; border: 1px solid; border-radius: 13px; }.answer-feedback > div { display: flex; justify-content: space-between; gap: 12px; }.answer-feedback > div strong, .answer-feedback > div span { color: inherit; }.answer-feedback p { margin: 10px 0 0; color: inherit; font-size: 13px; line-height: 1.55; }.answer-feedback.is-correct { border-color: #86efac; background: rgba(34,197,94,.08); color: #166534; }.answer-feedback.is-wrong { border-color: #fca5a5; background: rgba(239,68,68,.07); color: #991b1b; }
:global(:root[data-theme='dark']) .answer-feedback.is-correct { color: #bbf7d0; }
:global(:root[data-theme='dark']) .answer-feedback.is-wrong { color: #fecdd3; }
:global(:root[data-theme='dark']) .answer-feedback.is-correct strong,
:global(:root[data-theme='dark']) .answer-feedback.is-correct span,
:global(:root[data-theme='dark']) .answer-feedback.is-correct p,
:global(:root[data-theme='dark']) .answer-feedback.is-wrong strong,
:global(:root[data-theme='dark']) .answer-feedback.is-wrong span,
:global(:root[data-theme='dark']) .answer-feedback.is-wrong p { color: inherit; }
.question-actions { display: flex; justify-content: flex-end; margin-top: 22px; }.primary-button, .secondary-button { min-height: 42px; padding: 0 17px; border-radius: 10px; font: inherit; font-weight: 900; cursor: pointer; }.primary-button { border: 0; background: #6d28d9; color: #fff; }.secondary-button { border: 1px solid var(--border); background: var(--surface); color: var(--text-h); }.fallback-note { margin: 18px 0 0; color: var(--text); font-size: 11px; text-align: center; }
.practice-summary { max-width: 680px; margin: 0 auto; padding: 48px; text-align: center; }.summary-icon { display: grid; place-items: center; width: 62px; height: 62px; margin: 0 auto 18px; border-radius: 20px; background: #ede9fe; color: #6d28d9; font-size: 28px; }.practice-summary h2 { margin: 8px 0; font-size: 34px; }.practice-summary > p { color: var(--text); }.summary-score { height: 10px; margin: 26px 0; overflow: hidden; border-radius: 999px; background: var(--accent-bg); }.summary-score span { display: block; width: var(--score); height: 100%; background: linear-gradient(90deg,#8b5cf6,#22c55e); }.summary-actions { display: flex; justify-content: center; gap: 10px; }
.practice-auth-card, .practice-state-card { max-width: 720px; margin: 55px auto; padding: 48px; text-align: center; }.practice-auth-card button { margin-top: 24px; min-height: 44px; padding: 0 18px; border: 0; border-radius: 10px; background: #6d28d9; color: #fff; font-weight: 900; cursor: pointer; }.practice-state-card { display: grid; justify-items: center; gap: 12px; color: var(--text); }.practice-spinner { width: 28px; height: 28px; border: 3px solid var(--border); border-top-color: #7c3aed; border-radius: 50%; animation: spin .8s linear infinite; }.practice-alert, .question-error { padding: 11px 13px; border: 1px solid #fecaca; border-radius: 10px; background: #fef2f2; color: #b91c1c; font-size: 13px; }.question-error { margin: 14px 0 0; }
.practice-auth-error h1 { margin: 4px 0; font-size: clamp(24px, 4vw, 34px); line-height: 1.2; }.practice-auth-error p { max-width: 520px; margin: 0; line-height: 1.5; }.practice-auth-error button { min-height: 42px; padding: 0 18px; border: 0; border-radius: 10px; background: #6d28d9; color: #fff; font-weight: 900; cursor: pointer; }
@keyframes spin { to { transform: rotate(360deg); } }
@media (max-width: 1391px) and (min-width: 761px) { .practice-score-control { position: relative; top: auto; right: auto; display: flex; justify-content: flex-end; margin-bottom: 16px; } }
@media (max-width: 760px) { .practice-page { width: min(100% - 16px, 1120px); padding: 12px 0 40px; }.practice-score-control { position: relative; top: auto; right: auto; display: flex; justify-content: flex-end; min-height: 50px; margin-bottom: 8px; }.practice-score-card { display: none; }.practice-score-trigger { display: grid; place-items: center; width: 50px; height: 50px; padding: 0; border: 2px solid #8b5cf6; border-radius: 50%; background: var(--surface); color: var(--brand-color); box-shadow: 0 8px 24px rgba(91, 33, 182, .16); cursor: pointer; }.practice-score-trigger strong { font-size: 15px; line-height: 1; }.practice-score-trigger small { font-size: 10px; }.practice-score-trigger:focus-visible { outline: 3px solid rgba(139, 92, 246, .28); outline-offset: 2px; }.practice-score-popover { position: absolute; top: calc(100% + 8px); right: 0; z-index: 8; display: grid; width: 190px; box-sizing: border-box; padding: 16px; border: 1px solid var(--border); border-radius: 14px; background: var(--surface); box-shadow: 0 18px 45px rgba(31, 20, 52, .2); }.practice-score-popover strong { color: var(--brand-color); font-size: 28px; line-height: 1; }.practice-score-popover strong small { font-size: 14px; }.practice-score-popover span { margin: 6px 0; color: var(--text-h); font-size: 13px; font-weight: 800; }.practice-score-popover > small { color: var(--text); font-size: 11px; }.score-popover-enter-active, .score-popover-leave-active { transition: opacity 160ms ease, transform 160ms ease; }.score-popover-enter-from, .score-popover-leave-to { opacity: 0; transform: translateY(-5px) scale(.98); }.practice-section-heading { flex-direction: column; }.topic-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }.practice-dashboard, .practice-session { padding: 16px; }.practice-summary, .practice-auth-card { padding: 30px 20px; }.practice-auth-card h1 { font-size: clamp(28px, 9vw, 38px); line-height: 1.16; }.session-topline { grid-template-columns: 1fr auto; }.session-topline > span { display: none; }.answer-feedback > div { align-items: flex-start; flex-direction: column; }.question-actions, .question-actions .primary-button { width: 100%; }.summary-actions { flex-direction: column; }.summary-actions button { width: 100%; } }
@media (max-width: 430px) { .topic-grid { grid-template-columns: 1fr; }.question-card { padding-inline: 0; } }
@media (prefers-reduced-motion: reduce) { .topic-card, .session-progress span, .score-popover-enter-active, .score-popover-leave-active { transition: none; }.practice-spinner { animation-duration: 2s; } }
</style>
