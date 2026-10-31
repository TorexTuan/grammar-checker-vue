<template>
  <div
    class="format-dropdown"
    :class="{ 'is-open': open }"
    :style="{ '--dropdown-width': width }"
  >
    <button
      ref="triggerRef"
      type="button"
      class="format-dropdown__trigger"
      :aria-label="label"
      :aria-expanded="open"
      :aria-controls="menuId"
      aria-haspopup="listbox"
      @click="$emit('toggle')"
      @keydown="handleTriggerKeydown"
    >
      <span class="format-dropdown__value" :class="{ 'is-placeholder': modelValue === '' }">
        {{ displayLabel }}
      </span>
      <svg class="format-dropdown__chevron" viewBox="0 0 20 20" fill="none" aria-hidden="true">
        <path d="m6 8 4 4 4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" />
      </svg>
    </button>

    <Transition name="format-dropdown-menu">
      <div
        v-if="open"
        :id="menuId"
        class="format-dropdown__menu"
        role="listbox"
        :aria-label="label"
      >
        <button
          v-for="(option, index) in options"
          :key="String(option.value)"
          :ref="element => setOptionRef(element, index)"
          type="button"
          class="format-dropdown__option"
          :class="{ 'is-selected': option.value === modelValue }"
          role="option"
          :aria-selected="option.value === modelValue"
          :tabindex="index === activeIndex ? 0 : -1"
          @mouseenter="activeIndex = index"
          @focus="activeIndex = index"
          @click="selectOption(option.value)"
          @keydown="handleOptionKeydown($event, index)"
        >
          <span
            class="format-dropdown__option-label"
            :style="previewFont && option.value ? { fontFamily: option.value } : undefined"
          >
            {{ option.label }}
          </span>
          <svg v-if="option.value === modelValue" class="format-dropdown__check" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="m5 10 3.1 3.1L15 6.8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'

const props = defineProps({
  id: { type: String, required: true },
  label: { type: String, required: true },
  modelValue: { type: String, default: '' },
  options: { type: Array, required: true },
  placeholder: { type: String, default: 'Select' },
  width: { type: String, default: '108px' },
  open: { type: Boolean, default: false },
  previewFont: { type: Boolean, default: false }
})

const emit = defineEmits(['toggle', 'select', 'close'])
const triggerRef = ref(null)
const optionRefs = ref([])
const activeIndex = ref(0)
const menuId = computed(() => `${props.id}-listbox`)
const selectedIndex = computed(() => props.options.findIndex(option => option.value === props.modelValue))
const displayLabel = computed(() => {
  if (props.modelValue === '') return props.placeholder
  return props.options.find(option => option.value === props.modelValue)?.label || props.placeholder
})

watch(() => props.open, isOpen => {
  if (isOpen) {
    optionRefs.value = []
    activeIndex.value = selectedIndex.value >= 0 ? selectedIndex.value : 0
  }
})

function setOptionRef(element, index) {
  if (element) optionRefs.value[index] = element
}

function focusOption(index) {
  if (!props.options.length) return
  activeIndex.value = (index + props.options.length) % props.options.length
  nextTick(() => optionRefs.value[activeIndex.value]?.focus())
}

function openAndFocus(direction) {
  if (!props.open) emit('toggle')
  const fallback = direction > 0 ? 0 : props.options.length - 1
  focusOption(selectedIndex.value >= 0 ? selectedIndex.value : fallback)
}

function handleTriggerKeydown(event) {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    openAndFocus(event.key === 'ArrowDown' ? 1 : -1)
  } else if (event.key === 'Escape' && props.open) {
    event.preventDefault()
    emit('close')
  }
}

function handleOptionKeydown(event, index) {
  if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
    event.preventDefault()
    focusOption(index + (event.key === 'ArrowDown' ? 1 : -1))
  } else if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault()
    focusOption(event.key === 'Home' ? 0 : props.options.length - 1)
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    selectOption(props.options[index].value)
  } else if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
    nextTick(() => triggerRef.value?.focus())
  } else if (event.key === 'Tab') {
    emit('close')
  }
}

function selectOption(value) {
  emit('select', value)
  emit('close')
  nextTick(() => triggerRef.value?.focus())
}
</script>

<style scoped>
.format-dropdown {
  position: relative;
  flex: 0 0 auto;
  width: var(--dropdown-width);
}

.format-dropdown__trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 34px;
  box-sizing: border-box;
  gap: 6px;
  padding: 0 9px 0 11px;
  border: 1px solid #e4e0ee;
  border-radius: 11px;
  background: linear-gradient(180deg, #ffffff 0%, #fbfaff 100%);
  box-shadow: 0 1px 2px rgba(54, 38, 86, 0.04);
  color: #334155;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.2;
  cursor: pointer;
  transition: border-color 160ms ease, background 160ms ease, box-shadow 160ms ease, color 160ms ease;
}

.format-dropdown__trigger:hover,
.format-dropdown.is-open .format-dropdown__trigger {
  border-color: #c4b5fd;
  background: #faf8ff;
  box-shadow: 0 4px 12px rgba(109, 40, 217, 0.09);
  color: #5b21b6;
}

.format-dropdown__trigger:focus-visible {
  outline: 2px solid #8b5cf6;
  outline-offset: 2px;
}

.format-dropdown__value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.format-dropdown__value.is-placeholder {
  color: #64748b;
}

.format-dropdown__chevron {
  flex: 0 0 16px;
  width: 16px;
  height: 16px;
  transition: transform 180ms ease;
}

.format-dropdown.is-open .format-dropdown__chevron {
  transform: rotate(180deg);
}

.format-dropdown__menu {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  z-index: 60;
  width: max-content;
  min-width: 100%;
  max-width: calc(100vw - 24px);
  max-height: min(320px, calc(100vh - 96px));
  box-sizing: border-box;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 6px;
  border: 1px solid #ded5f1;
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 16px 38px rgba(48, 31, 82, 0.18), 0 3px 10px rgba(48, 31, 82, 0.08);
  color: #334155;
}

.format-dropdown__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  min-width: 122px;
  min-height: 34px;
  gap: 18px;
  padding: 7px 9px 7px 10px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: inherit;
  font-family: inherit;
  font-size: 12.5px;
  font-weight: 500;
  line-height: 1.3;
  text-align: left;
  cursor: pointer;
  transition: background-color 140ms ease, color 140ms ease;
}

.format-dropdown__option:hover,
.format-dropdown__option:focus-visible {
  outline: none;
  background: #f4f0ff;
  color: #5b21b6;
}

.format-dropdown__option.is-selected {
  background: #ede9fe;
  color: #5b21b6;
  font-weight: 700;
}

.format-dropdown__option-label {
  white-space: nowrap;
}

.format-dropdown__check {
  flex: 0 0 16px;
  width: 16px;
  height: 16px;
}

.format-dropdown-menu-enter-active,
.format-dropdown-menu-leave-active {
  transition: opacity 140ms ease, transform 140ms ease;
  transform-origin: top left;
}

.format-dropdown-menu-enter-from,
.format-dropdown-menu-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}

:global(:root[data-theme='dark'] .format-dropdown__trigger) {
  border-color: #4a4d61;
  background: var(--surface);
  color: #eef0f8;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.18);
}

:global(:root[data-theme='dark'] .format-dropdown__trigger:hover),
:global(:root[data-theme='dark'] .format-dropdown.is-open .format-dropdown__trigger) {
  border-color: #6d5e91;
  background: #38305a;
  color: #ddd6fe;
  box-shadow: 0 5px 16px rgba(0, 0, 0, 0.24);
}

:global(:root[data-theme='dark'] .format-dropdown__value.is-placeholder) {
  color: #bac0d0;
}

:global(:root[data-theme='dark'] .format-dropdown__menu) {
  border-color: #4a4d61;
  background: var(--surface);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.36), 0 3px 10px rgba(0, 0, 0, 0.2);
  color: #eef0f8;
}

:global(:root[data-theme='dark'] .format-dropdown__option:hover),
:global(:root[data-theme='dark'] .format-dropdown__option:focus-visible) {
  background: #303344;
  color: #ddd6fe;
}

:global(:root[data-theme='dark'] .format-dropdown__option.is-selected) {
  background: #38305a;
  color: #ede9fe;
}

@media (max-width: 420px) {
  .format-dropdown__menu {
    position: fixed;
    top: auto;
    right: 12px;
    bottom: 12px;
    left: 12px;
    width: auto;
    max-width: none;
    transform-origin: bottom center;
  }
}
</style>
