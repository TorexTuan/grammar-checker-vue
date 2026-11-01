<template>
  <div
    v-if="visible && issue"
    ref="popoverRef"
    class="suggestion-popover"
    :style="floatingStyles"
    @pointerenter="emit('pointer-enter')"
    @pointerleave="emit('pointer-leave')"
    @focusin="emit('pointer-enter')"
    @focusout="emit('pointer-leave')"
  >
    <div class="popover-header">
      <div class="category-badge" :class="`badge--${issue.type}`">
        <span class="dot"></span>
        <span class="category-text">{{ issue.category }}</span>
      </div>
    </div>

    <!-- Original vs Candidate Suggestions -->
    <div class="options-container">
      <div class="options-label">
        <span class="diff-original">{{ issue.length === 0 ? 'Missing text' : issue.original }}</span>
        <span class="diff-arrow">&rarr;</span>
        <span class="hint-text">Choose replacement:</span>
      </div>

      <!-- Multiple Replacement Pills -->
      <div class="options-list">
        <button
          v-for="(candidate, index) in candidateReplacements"
          :key="index"
          type="button"
          class="candidate-pill"
          :class="{ 'candidate-pill--selected': selectedReplacement === candidate }"
          @click.stop="selectReplacement(candidate)"
        >
          <span class="candidate-text">{{ candidate === '' ? 'Delete' : candidate }}</span>
          <span v-if="selectedReplacement === candidate" class="selected-check">&check;</span>
        </button>
      </div>
    </div>

    <p class="explanation-text">
      {{ issue.explanation }}
    </p>

    <div class="popover-actions">
      <button 
        type="button" 
        class="btn-accept" 
        :disabled="!hasSelection"
        @click.stop="confirmAccept"
      >
        <svg class="check-icon" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
        </svg>
        <span>Accept</span>
      </button>
      <button type="button" class="btn-ignore" @click.stop="emit('ignore', issue)">
        Ignore
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  issue: {
    type: Object,
    default: null
  },
  position: {
    type: Object,
    default: () => ({ x: 0, y: 0 })
  }
})

const emit = defineEmits(['accept', 'ignore', 'pointer-enter', 'pointer-leave'])
const popoverRef = ref(null)
const selectedReplacement = ref('')
const hasSelection = ref(false)

// Compute available replacements list
const candidateReplacements = computed(() => {
  if (!props.issue) return []

  const list = []
  if (Array.isArray(props.issue.replacements) && props.issue.replacements.length > 0) {
    props.issue.replacements.forEach(item => {
      const val = typeof item === 'string' ? item : item?.value
      if (val !== undefined && val !== null && !list.includes(val)) {
        list.push(val)
      }
    })
  }

  // Ensure default replacement is present
  if (
    props.issue.replacement !== undefined &&
    props.issue.replacement !== null &&
    !list.includes(props.issue.replacement)
  ) {
    list.unshift(props.issue.replacement)
  }

  return list.slice(0, 6) // Display up to 6 options
})

// Auto select the first replacement when issue changes
watch(
  () => props.issue,
  (newIssue) => {
    if (newIssue) {
      const candidates = candidateReplacements.value
      if (newIssue.replacement !== undefined && newIssue.replacement !== null) {
        selectedReplacement.value = newIssue.replacement
        hasSelection.value = true
      } else if (candidates.length > 0) {
        selectedReplacement.value = candidates[0]
        hasSelection.value = true
      } else {
        selectedReplacement.value = ''
        hasSelection.value = false
      }
    } else {
      hasSelection.value = false
    }
  },
  { immediate: true }
)

const selectReplacement = (candidate) => {
  selectedReplacement.value = candidate
  hasSelection.value = true
}

const confirmAccept = () => {
  if (!hasSelection.value) return
  emit('accept', {
    ...props.issue,
    replacement: selectedReplacement.value
  })
}

const floatingStyles = computed(() => {
  return {
    top: `${props.position.y}px`,
    left: `${props.position.x}px`
  }
})
</script>

<style scoped>
.suggestion-popover {
  position: absolute;
  z-index: 100;
  width: min(360px, calc(100vw - 24px));
  box-sizing: border-box;
  background: var(--surface);
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.05);
  font-family: inherit;
  color: #1f2937;
  transition: opacity 0.15s ease, transform 0.15s ease;
  transform: translateY(8px);
}

.popover-header {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.category-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.category-badge .dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.badge--grammar {
  color: #ef4444;
}
.badge--grammar .dot {
  background-color: #ef4444;
}

.badge--clarity {
  color: #f59e0b;
}
.badge--clarity .dot {
  background-color: #f59e0b;
}

.badge--engagement {
  color: #8b5cf6;
}
.badge--engagement .dot {
  background-color: #8b5cf6;
}

.options-container {
  margin-bottom: 12px;
}

.options-label {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 13.5px;
}

.diff-original {
  color: #9ca3af;
  text-decoration: line-through;
  font-weight: 500;
}

.diff-arrow {
  color: #9ca3af;
  font-size: 12px;
}

.hint-text {
  font-size: 12px;
  color: #6b7280;
  font-weight: 500;
}

.options-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.candidate-pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  background-color: #f3f4f6;
  color: #374151;
  border: 1px solid #e5e7eb;
  transition: all 0.15s ease;
}

.candidate-pill:hover {
  background-color: #e5e7eb;
  color: #111827;
}

.candidate-pill--selected {
  background-color: #d1fae5 !important;
  color: #065f46 !important;
  border-color: #a7f3d0 !important;
  box-shadow: 0 1px 2px rgba(6, 95, 70, 0.1);
}

.selected-check {
  font-size: 12px;
  font-weight: bold;
}

.explanation-text {
  font-size: 12.5px;
  line-height: 1.45;
  color: #4b5563;
  margin: 0 0 14px 0;
}

.popover-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-accept {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background-color: #4338ca;
  color: #ffffff;
  border: none;
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.15s ease;
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn-accept:hover:not(:disabled) {
  background-color: #3730a3;
}

.btn-accept:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.check-icon {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.btn-ignore {
  background: transparent;
  border: none;
  color: #6b7280;
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 6px;
  transition: all 0.15s ease;
}

.btn-ignore:hover {
  background-color: #f3f4f6;
  color: #111827;
}

</style>
