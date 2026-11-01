<template>
  <div class="editor-view">
    <text-editor />
  </div>
</template>

<script setup>
import TextEditor from '../components/editor/TextEditor.vue'
</script>

<style scoped>
.editor-view {
  position: relative;
  display: flex;
  justify-content: center;
  padding: 24px 16px;
  background: var(--page-bg-gradient);
  min-height: calc(100vh - 80px);
}

.editor-view::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(120deg, #151923 0%, #1b2030 52%, #252038 100%);
  opacity: 0;
  pointer-events: none;
}

:global(:root[data-theme='dark'] .editor-view::before) {
  opacity: 1;
}

.editor-view > * {
  position: relative;
  z-index: 1;
}

@media (max-width: 700px) {
  .editor-view {
    min-height: calc(100svh - 54px);
    padding: 10px 8px 18px;
  }
}
</style>
