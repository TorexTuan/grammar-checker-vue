<template>
  <div class="editor-container" ref="containerRef">
    <!-- Header Action Bar for Grammar Checker -->
    <div class="editor-action-bar">
      <div class="doc-status">
        <div class="document-heading">
          <button type="button" class="documents-button" :aria-expanded="drawerOpen" aria-label="Documents" title="Documents" @click="openDrawer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 5h16M4 12h16M4 19h16" /></svg>
          </button>
        </div>
        <div class="grammar-status">
          <span class="status-indicator" :class="`status-${statusKind}`"></span>
          <span class="status-label">{{ statusMessage }}</span>
        </div>
      </div>
      <div ref="toolbarRef" class="format-toolbar" role="toolbar" aria-label="Text formatting" @keydown.esc="closeToolbarMenus">
          <FormatDropdown
            id="paragraph-style"
            label="Paragraph style"
            :model-value="toolbarState.block"
            :options="BLOCK_STYLES"
            :open="openToolbarMenu === 'block'"
            width="108px"
            @toggle="toggleToolbarMenu('block')"
            @select="setBlockStyle"
            @close="closeToolbarMenus"
          />
          <FormatDropdown
            id="font-size"
            label="Font size"
            :model-value="toolbarState.fontSize"
            :options="FONT_SIZE_OPTIONS"
            :open="openToolbarMenu === 'size'"
            placeholder="Size"
            width="80px"
            @toggle="toggleToolbarMenu('size')"
            @select="setFontSize"
            @close="closeToolbarMenus"
          />
          <FormatDropdown
            id="font-family"
            label="Font family"
            :model-value="toolbarState.fontFamily"
            :options="FONT_FAMILY_OPTIONS"
            :open="openToolbarMenu === 'font'"
            placeholder="Font"
            width="112px"
            preview-font
            @toggle="toggleToolbarMenu('font')"
            @select="setFontFamily"
            @close="closeToolbarMenus"
          />
          <span class="toolbar-divider" aria-hidden="true"></span>
          <button type="button" class="format-button format-button--bold" :class="{ 'is-active': toolbarState.bold }" :aria-pressed="toolbarState.bold" aria-label="Bold" title="Bold" @mousedown.prevent @click="editor?.chain().focus().toggleBold().run()">B</button>
          <button type="button" class="format-button format-button--italic" :class="{ 'is-active': toolbarState.italic }" :aria-pressed="toolbarState.italic" aria-label="Italic" title="Italic" @mousedown.prevent @click="editor?.chain().focus().toggleItalic().run()">I</button>
          <button type="button" class="format-button format-button--underline" :class="{ 'is-active': toolbarState.underline }" :aria-pressed="toolbarState.underline" aria-label="Underline" title="Underline" @mousedown.prevent @click="editor?.chain().focus().toggleUnderline().run()">U</button>
          <div class="toolbar-extras" :class="{ 'is-open': moreOpen }">
            <button ref="moreButtonRef" type="button" class="format-button more-button" :aria-expanded="moreOpen" aria-controls="toolbar-extra-controls" title="More formatting" @mousedown.prevent @click="toggleMore">More <span aria-hidden="true">···</span></button>
            <div id="toolbar-extra-controls" class="toolbar-extra-controls" @keydown.esc.stop.prevent="closeMoreMenu">
              <span class="toolbar-divider" aria-hidden="true"></span>
              <div class="toolbar-menu-wrap">
                <button ref="alignmentTriggerRef" type="button" class="format-button icon-button" :aria-label="`Align ${toolbarState.align}`" :title="`Align ${toolbarState.align}`" :aria-expanded="openToolbarMenu === 'align'" aria-controls="alignment-menu" aria-haspopup="menu" @mousedown.prevent @click="toggleToolbarMenu('align')" @keydown="handleAlignmentTriggerKeydown">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path v-for="(line, index) in ALIGNMENT_LINES[toolbarState.align]" :key="index" :d="`M${line[0]} ${5 + index * 5}h${line[1]}`" /></svg>
                </button>
                <Transition name="toolbar-menu">
                  <div v-if="openToolbarMenu === 'align'" id="alignment-menu" class="toolbar-popover alignment-popover" role="menu" aria-label="Paragraph alignment">
                    <button v-for="(alignment, index) in ALIGNMENTS" :key="alignment.value" type="button" class="format-button icon-button alignment-option" :class="{ 'is-active': toolbarState.align === alignment.value }" role="menuitemradio" :aria-checked="toolbarState.align === alignment.value" :aria-label="alignment.label" :title="alignment.label" @mousedown.prevent @click="selectAlignment(alignment.value)" @keydown="handleAlignmentOptionKeydown($event, index)">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path v-for="(line, index) in ALIGNMENT_LINES[alignment.value]" :key="index" :d="`M${line[0]} ${5 + index * 5}h${line[1]}`" /></svg>
                    </button>
                  </div>
                </Transition>
              </div>
              <div class="toolbar-color-group">
                <label class="format-button icon-button color-trigger" title="Text color">
                  A<span class="color-swatch" :style="{ backgroundColor: toolbarState.color || DEFAULT_TEXT_COLOR }"></span>
                  <input class="direct-color-input" type="color" aria-label="Text color" :value="toolbarState.color || DEFAULT_TEXT_COLOR" @change="setTextColor($event.target.value)" />
                </label>
              </div>
              <div class="toolbar-color-group">
                <label class="format-button icon-button color-trigger" title="Text highlight color">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m4 17 9-9 3 3-9 9H4zM13 8l2-2 3 3-2 2" /></svg><span class="color-swatch" :style="{ backgroundColor: toolbarState.backgroundColor || DEFAULT_HIGHLIGHT_COLOR }"></span>
                  <input class="direct-color-input" type="color" aria-label="Text highlight color" :value="toolbarState.backgroundColor || DEFAULT_HIGHLIGHT_COLOR" @change="setTextBackground($event.target.value)" />
                </label>
              </div>
            </div>
          </div>
          <span class="toolbar-divider" aria-hidden="true"></span>
          <button type="button" class="format-button copy-button" :class="{ 'copy-button--success': copyState === 'copied', 'copy-button--error': copyState === 'error' }" :aria-label="copyLabel" :title="copyLabel" @click="copyAllText">
            <svg v-if="copyState === 'copied'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2" /><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" /></svg>
          </button>
          <span class="visually-hidden" role="status" aria-live="polite">{{ copyState === 'idle' ? '' : copyLabel }}</span>
      </div>
      <div class="editor-actions">
        <span class="visually-hidden" role="status" aria-live="polite">{{ saveStatusLabel }}</span>
        <button type="button" class="save-button" :disabled="saveStatus === 'saving' || !hasDocumentContent" @click="requestSave">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" /><path d="M17 21v-8H7v8M7 3v5h8" /></svg>
          {{ saveStatus === 'saving' ? 'Saving…' : saveStatus === 'error' ? 'Retry' : 'Save' }}
        </button>
        <button type="button" class="check-again-button" :disabled="statusKind === 'checking' || !hasCheckableText" @click="checkAgain">Check again</button>
      </div>
    </div>

    <Transition name="documents-drawer">
      <div v-if="drawerOpen" class="documents-overlay" @mousedown.self="drawerOpen = false">
        <aside class="documents-drawer" role="dialog" aria-modal="true" aria-labelledby="documents-title" @keydown.esc="drawerOpen = false">
        <div class="documents-drawer-header">
          <div><p>Your workspace</p><h2 id="documents-title">Documents</h2></div>
          <button type="button" class="drawer-close" aria-label="Close documents" @click="drawerOpen = false">&times;</button>
        </div>
        <button type="button" class="new-document-button" @click="requestNewDocument">+ New document</button>
        <div v-if="!appStore.user" class="documents-empty">
          <p>Sign in to access documents saved to your account.</p>
          <button type="button" @click="appStore.openAuth('login')">Sign in</button>
        </div>
        <p v-else-if="appStore.documentsLoading" class="documents-loading">Loading documents…</p>
        <div v-else-if="appStore.documents.length" class="document-list">
          <article v-for="document in appStore.documents" :key="document.id" class="document-list-item" :class="{ 'is-active': document.id === activeDocumentId }">
            <button type="button" class="document-open-button" @click="requestOpenDocument(document.id)">
              <strong>{{ document.title }}</strong><span>{{ formatDocumentDate(document.updated_at) }}</span>
            </button>
            <button type="button" class="document-delete-button" :aria-label="`Delete ${document.title}`" @click="requestDeleteDocument(document)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M8 6V4h8v2m-9 0 1 14h8l1-14M10 10v6m4-6v6" /></svg>
            </button>
          </article>
        </div>
        <p v-else class="documents-empty">No saved documents yet.</p>
        </aside>
      </div>
    </Transition>

    <div class="editor-workspace">
      <!-- Main Paper Document Area -->
      <div class="editor-paper" ref="paperRef" :style="{ '--comment-rail-height': `${commentRailHeight + 24}px` }" @pointerover="handleEditorPointerOver" @pointerout="handleEditorPointerOut" @focusin="handleEditorFocusIn" @focusout="schedulePopoverClose">
        <editor-content :editor="editor" class="tiptap-content" />
        <bubble-menu v-if="editor" :editor="editor" :should-show="shouldShowCommentMenu" :options="{ placement: 'top' }" class="comment-bubble">
          <button type="button" @mousedown.prevent @click="openCommentComposer">Add comment</button>
        </bubble-menu>
        <div v-if="composer.visible" class="comment-composer" :style="composerStyle">
          <label for="comment-note">{{ composer.editingId ? 'Edit comment' : 'New comment' }}</label>
          <textarea id="comment-note" ref="commentInputRef" v-model="composer.note" rows="3" maxlength="2000" placeholder="Write a note…" @keydown.esc="closeCommentComposer"></textarea>
          <div class="comment-composer-actions">
            <button type="button" @click="closeCommentComposer">Cancel</button>
            <button type="button" :disabled="!composer.note.trim()" @click="saveComment">Save</button>
          </div>
        </div>
        <div v-if="linkedComments.length" class="comment-rail" :style="{ height: `${commentRailHeight}px` }" aria-label="Comments">
          <article v-for="comment in linkedComments" :key="comment.id" :ref="el => setCommentCardRef(comment.id, el)" class="comment-card" :style="{ top: `${cardTops[comment.id] ?? 0}px` }">
            <blockquote>{{ comment.quote }}</blockquote>
            <p>{{ comment.note }}</p>
            <time :datetime="comment.createdAt">{{ formatCommentTime(comment.createdAt) }}</time>
            <div class="comment-card-actions">
              <button type="button" @click="editComment(comment)">Edit</button>
              <button type="button" @click="deleteComment(comment.id)">Delete</button>
            </div>
          </article>
        </div>
        <div v-if="unlinkedComments.length" class="unlinked-comments">
          <h3>Unlinked comments</h3>
          <article v-for="comment in unlinkedComments" :key="comment.id" class="comment-card comment-card--unlinked">
            <blockquote>{{ comment.quote }}</blockquote>
            <p>{{ comment.note }}</p>
            <time :datetime="comment.createdAt">{{ formatCommentTime(comment.createdAt) }}</time>
            <div class="comment-card-actions">
              <button type="button" @click="editComment(comment)">Edit</button>
              <button type="button" @click="deleteComment(comment.id)">Delete</button>
            </div>
          </article>
        </div>
      </div>

      <aside id="issues-sidebar" class="issues-sidebar" aria-label="Grammar issues">
        <div class="sidebar-header">
          <div>
            <h2>Grammar issues</h2>
            <p>{{ issueList.length }} current issue(s)</p>
          </div>
        </div>
        <button type="button" class="fix-all-button" :disabled="issueList.length === 0" @click="handleFixAll">Fix all</button>
        <p v-if="fixAllNotice" class="fix-all-notice" role="status">{{ fixAllNotice }}</p>
        <p v-if="issueList.length === 0" class="empty-issues">No issues to display.</p>
        <div v-else class="issue-cards">
          <article v-for="issue in issueList" :key="issue.id" class="issue-card">
            <div class="issue-card-top">
              <span class="issue-card-category">{{ issue.category }}</span>
              <h3>{{ issue.length === 0 ? 'Missing text' : issue.original }}</h3>
            </div>
            <p class="issue-card-replacement">Suggestion: <strong>{{ issue.replacement === '' ? 'Delete' : issue.replacement }}</strong></p>
            <p class="issue-card-explanation">{{ issue.explanation }}</p>
            <div class="issue-card-actions">
              <button type="button" class="card-accept" @click="handleAccept(issue)">Accept</button>
              <button type="button" class="card-ignore" @click="handleIgnore(issue)">Ignore</button>
            </div>
          </article>
        </div>
      </aside>
    </div>

    <Teleport to="body">
      <div v-if="decision.visible" class="decision-overlay">
        <section class="decision-dialog" role="dialog" aria-modal="true" aria-labelledby="document-decision-title">
          <p class="dialog-eyebrow">{{ decision.mode === 'replace' ? 'Open document' : 'Unsaved changes' }}</p>
          <h2 id="document-decision-title">{{ decision.mode === 'replace' ? 'Replace current content?' : 'Save before continuing?' }}</h2>
          <p>{{ decision.mode === 'replace' ? 'The saved document will replace the text currently in the editor.' : 'Your latest edits are only stored as a local draft.' }}</p>
          <div class="decision-actions">
            <button type="button" class="dialog-button dialog-button--quiet" @click="resolveDecision('cancel')">Cancel</button>
            <button v-if="decision.mode === 'replace'" type="button" class="dialog-button dialog-button--primary" @click="resolveDecision('replace')">Open document</button>
            <template v-else>
              <button type="button" class="dialog-button dialog-button--danger" @click="resolveDecision('discard')">Discard</button>
              <button type="button" class="dialog-button dialog-button--primary" :disabled="saveStatus === 'saving' || !hasDocumentContent" @click="resolveDecision('save')">Save</button>
            </template>
          </div>
        </section>
      </div>
      <div v-if="titleDialog.visible" class="decision-overlay decision-overlay--title">
        <section class="decision-dialog" role="dialog" aria-modal="true" aria-labelledby="save-title-heading">
          <p class="dialog-eyebrow">Save document</p>
          <h2 id="save-title-heading">Name this document</h2>
          <p>Enter a title before saving it to your account.</p>
          <form class="title-form" @submit.prevent="confirmTitleSave">
            <label for="save-document-title">Title</label>
            <input id="save-document-title" v-model="titleDialog.title" class="title-input" type="text" maxlength="120" autocomplete="off" autofocus required />
            <div class="decision-actions">
              <button type="button" class="dialog-button dialog-button--quiet" @click="closeTitleDialog">Cancel</button>
              <button type="submit" class="dialog-button dialog-button--primary" :disabled="!titleDialog.title.trim() || saveStatus === 'saving'">Save</button>
            </div>
          </form>
        </section>
      </div>
      <div v-if="conflictDocument" class="decision-overlay">
        <section class="decision-dialog" role="dialog" aria-modal="true" aria-labelledby="conflict-title">
          <p class="dialog-eyebrow">Version conflict</p>
          <h2 id="conflict-title">This document changed elsewhere</h2>
          <p>Load the server version, or keep your edits by saving them as a new copy.</p>
          <div class="decision-actions decision-actions--stacked">
            <button type="button" class="dialog-button dialog-button--quiet" @click="conflictDocument = null">Keep editing</button>
            <button type="button" class="dialog-button" @click="loadConflictVersion">Load server version</button>
            <button type="button" class="dialog-button dialog-button--primary" @click="saveConflictAsCopy">Save as a copy</button>
          </div>
        </section>
      </div>
    </Teleport>

    <!-- Floating Suggestion Popover -->
    <suggestion-popover
      :visible="popoverState.visible"
      :issue="popoverState.issue"
      :position="popoverState.position"
      @accept="handleAccept"
      @ignore="handleIgnore"
      @pointer-enter="cancelPopoverClose"
      @pointer-leave="schedulePopoverClose"
    />
  </div>
</template>

<script setup>
import { ref, reactive, computed, nextTick, onMounted, onBeforeUnmount, watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { BubbleMenu } from '@tiptap/vue-3/menus'
import { Fragment } from '@tiptap/pm/model'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle, FontSize, FontFamily, Color, BackgroundColor } from '@tiptap/extension-text-style'
import TextAlign from '@tiptap/extension-text-align'
import { GrammarIssueMark } from './extensions/GrammarIssueMark'
import { createCommentDecorations, COMMENT_REFRESH_META } from './extensions/CommentDecorations'
import FormatDropdown from './FormatDropdown.vue'
import SuggestionPopover from './SuggestionPopover.vue'
import { INITIAL_DOC_CONTENT } from './mockData'
import { grammarApi } from '../../api/grammar'
import { useAppStore } from '../../stores/app'

const containerRef = ref(null)
const appStore = useAppStore()
const toolbarRef = ref(null)
const moreButtonRef = ref(null)
const alignmentTriggerRef = ref(null)
const moreOpen = ref(false)
const openToolbarMenu = ref(null)
const paperRef = ref(null)
const commentInputRef = ref(null)
const commentCards = new Map()
const comments = ref([])
const cardTops = ref({})
const commentRailHeight = ref(0)
const linkedComments = computed(() => comments.value.filter(comment => !comment.unlinked).sort((a, b) => a.from - b.from))
const unlinkedComments = computed(() => comments.value.filter(comment => comment.unlinked))
const composer = reactive({ visible: false, editingId: null, from: 0, to: 0, quote: '', note: '', x: 12, y: 12 })
const composerStyle = computed(() => ({ left: `${composer.x}px`, top: `${composer.y}px` }))
const LEGACY_STORAGE_KEY = 'grammar-checker-document-v1'
const GUEST_DRAFT_KEY = 'grammar-checker-draft:guest'
const savedSession = loadSavedSession(GUEST_DRAFT_KEY, true)
const documentTitle = ref(savedSession?.title || 'Untitled document')
const activeDocumentId = ref(null)
const activeVersion = ref(null)
const saveStatus = ref('unsaved')
const drawerOpen = ref(false)
const conflictDocument = ref(null)
const decision = reactive({ visible: false, resolve: null, mode: 'unsaved' })
const titleDialog = reactive({ visible: false, title: '', continueDecision: false })
const saveStatusLabel = computed(() => ({
  saved: 'Saved', unsaved: 'Unsaved', saving: 'Saving…', error: 'Save failed'
})[saveStatus.value] || 'Unsaved')
const issuesMap = reactive({})
const statusMessage = ref('Grammar Engine Ready')
const statusKind = ref('ready')
const hasCheckableText = ref(false)
const hasDocumentContent = ref(false)
const fixAllNotice = ref('')
const issueList = computed(() => Object.values(issuesMap).sort((a, b) => a._range.from - b._range.from))
const FONT_SIZES = [12, 14, 16, 18, 20, 24, 32]
const FONT_FAMILIES = [
  { label: 'Arial', value: 'Arial' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Verdana', value: 'Verdana' },
  { label: 'Courier New', value: 'Courier New' }
]
const BLOCK_STYLES = [
  { label: 'Paragraph', value: 'paragraph' },
  { label: 'Heading 1', value: 'heading1' },
  { label: 'Heading 2', value: 'heading2' },
  { label: 'Heading 3', value: 'heading3' }
]
const FONT_SIZE_OPTIONS = [
  { label: 'Default size', value: '' },
  ...FONT_SIZES.map(size => ({ label: `${size} px`, value: `${size}px` }))
]
const FONT_FAMILY_OPTIONS = [
  { label: 'Default font', value: '' },
  ...FONT_FAMILIES
]
const DEFAULT_TEXT_COLOR = '#334155'
const DEFAULT_HIGHLIGHT_COLOR = '#fff2a8'
const ALIGNMENTS = [
  { value: 'left', label: 'Align left' },
  { value: 'center', label: 'Align center' },
  { value: 'right', label: 'Align right' },
  { value: 'justify', label: 'Justify' }
]
const ALIGNMENT_LINES = {
  left: [[3, 18], [3, 12], [3, 18], [3, 12]],
  center: [[3, 18], [6, 12], [3, 18], [6, 12]],
  right: [[3, 18], [9, 12], [3, 18], [9, 12]],
  justify: [[3, 18], [3, 18], [3, 18], [3, 18]]
}
const toolbarState = reactive({ block: 'paragraph', fontSize: '', fontFamily: '', color: '', backgroundColor: '', align: 'left', bold: false, italic: false, underline: false })
const copyState = ref('idle')
const copyLabel = computed(() => copyState.value === 'copied' ? 'Copied' : copyState.value === 'error' ? 'Copy failed' : 'Copy')

const DEBOUNCE_MS = 1000
const BLOCK_SEPARATOR = '\n\n'
const ACCEPT_TRANSACTION_META = 'grammarAccept'
const GRAMMAR_DECORATION_META = 'grammarDecorations'
let debounceTimer = null
let activeController = null
let requestSequence = 0
let lastObservedText = null
let popoverCloseTimer = null
let copyResetTimer = null
let saveTimer = null
let layoutFrame = null
let resizeObserver = null
let loadingSession = false
let draftOriginKey = GUEST_DRAFT_KEY
let userHasEdited = !!savedSession

comments.value = savedSession?.comments || []

const popoverState = reactive({
  visible: false,
  issue: null,
  position: { x: 0, y: 0 },
  targetElement: null
})

// Initialize Tiptap editor
const editor = useEditor({
  content: savedSession?.doc || INITIAL_DOC_CONTENT,
  extensions: [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3]
      }
    }),
    TextStyle,
    FontSize,
    FontFamily,
    Color,
    BackgroundColor,
    TextAlign.configure({ types: ['heading', 'paragraph'], defaultAlignment: 'left' }),
    GrammarIssueMark,
    createCommentDecorations(() => comments.value)
  ],
  onCreate: ({ editor: editorInstance }) => {
    lastObservedText = buildDocumentSnapshot(editorInstance).text
    hasCheckableText.value = lastObservedText.trim().length >= 3
    hasDocumentContent.value = lastObservedText.trim().length > 0
    validateComments(editorInstance.state.doc)
    syncToolbarState(editorInstance)
    scheduleCommentLayout()
  },
  onTransaction: ({ editor: editorInstance, transaction }) => {
    syncToolbarState(editorInstance)
    if (transaction.docChanged) {
      hasDocumentContent.value = buildDocumentSnapshot(editorInstance).text.trim().length > 0
    }
    if (transaction.docChanged && !transaction.getMeta(GRAMMAR_DECORATION_META)) {
      mapComments(transaction)
      scheduleSave(editorInstance)
      scheduleCommentLayout()
    }
  },
  onUpdate: ({ editor: editorInstance, transaction }) => {
    if (transaction.getMeta(ACCEPT_TRANSACTION_META)) {
      lastObservedText = buildDocumentSnapshot(editorInstance).text
      hasCheckableText.value = lastObservedText.trim().length >= 3
      hasDocumentContent.value = lastObservedText.trim().length > 0
      return
    }
    scheduleGrammarCheck(editorInstance)
  },
  editorProps: {
    attributes: {
      class: 'prose-editor focus:outline-none'
    },
    handleClick(view, pos, event) {
      const target = event.target.closest('.grammar-highlight')
      if (target) {
        const issueId = target.getAttribute('data-issue-id')
        const issue = issuesMap[issueId]

        if (issue) {
          openPopover(target, issue)
          return true
        }
      }
      closePopover()
      return false
    },
    handleKeyDown(view, event) {
      if ((event.key === 'Enter' || event.key === ' ') && event.target?.classList?.contains('grammar-highlight')) {
        const issue = issuesMap[event.target.getAttribute('data-issue-id')]
        if (issue) {
          event.preventDefault()
          openPopover(event.target, issue)
          return true
        }
      }
      return false
    }
  }
})

function syncToolbarState(editorInstance) {
  toolbarState.bold = editorInstance.isActive('bold')
  toolbarState.italic = editorInstance.isActive('italic')
  toolbarState.underline = editorInstance.isActive('underline')
  toolbarState.block = [1, 2, 3].find(level => editorInstance.isActive('heading', { level }))
    ? `heading${[1, 2, 3].find(level => editorInstance.isActive('heading', { level }))}`
    : 'paragraph'
  const size = editorInstance.getAttributes('textStyle').fontSize || ''
  toolbarState.fontSize = FONT_SIZES.some(value => `${value}px` === size) ? size : ''
  const textStyle = editorInstance.getAttributes('textStyle')
  toolbarState.fontFamily = textStyle.fontFamily || ''
  toolbarState.color = textStyle.color || ''
  toolbarState.backgroundColor = textStyle.backgroundColor || ''
  const blockType = editorInstance.isActive('heading') ? 'heading' : 'paragraph'
  toolbarState.align = editorInstance.getAttributes(blockType).textAlign || 'left'
}

function loadSavedSession(key, allowLegacy = false) {
  try {
    const raw = localStorage.getItem(key) || (allowLegacy ? localStorage.getItem(LEGACY_STORAGE_KEY) : null)
    const saved = JSON.parse(raw)
    if (![1, 2].includes(saved?.version) || !saved.doc || !Array.isArray(saved.comments)) return null
    return {
      title: typeof saved.title === 'string' ? saved.title : 'Untitled document',
      documentId: saved.documentId || null,
      baseVersion: Number.isInteger(saved.baseVersion) ? saved.baseVersion : null,
      doc: saved.doc,
      comments: saved.comments.filter(comment =>
        typeof comment.id === 'string' && typeof comment.note === 'string' &&
        typeof comment.quote === 'string' && Number.isInteger(comment.from) &&
        Number.isInteger(comment.to) && typeof comment.createdAt === 'string'
      )
    }
  } catch {
    return null
  }
}

function cleanGrammarMarks(node) {
  if (Array.isArray(node)) return node.map(cleanGrammarMarks)
  if (!node || typeof node !== 'object') return node
  const clean = { ...node }
  if (clean.marks) {
    clean.marks = clean.marks.filter(mark => mark.type !== 'grammarIssue')
    if (!clean.marks.length) delete clean.marks
  }
  if (clean.content) clean.content = cleanGrammarMarks(clean.content)
  return clean
}

function currentDraftKey(documentId = activeDocumentId.value) {
  if (!appStore.user) return GUEST_DRAFT_KEY
  return `grammar-checker-draft:user:${appStore.user.id}:document:${documentId || 'new'}`
}

function activePointerKey(userId = appStore.user?.id) {
  return userId ? `grammar-checker-active-document:user:${userId}` : null
}

function saveSession(editorInstance = editor.value) {
  if (!editorInstance || loadingSession) return
  try {
    localStorage.setItem(currentDraftKey(), JSON.stringify({
      version: 2,
      title: documentTitle.value,
      documentId: activeDocumentId.value,
      baseVersion: activeVersion.value,
      doc: cleanGrammarMarks(editorInstance.getJSON()),
      comments: comments.value,
      updatedAt: new Date().toISOString()
    }))
    const pointerKey = activePointerKey()
    if (pointerKey) localStorage.setItem(pointerKey, activeDocumentId.value || 'new')
  } catch {
    // Editing remains available if browser storage is disabled or full.
  }
}

function scheduleSave(editorInstance) {
  if (loadingSession) return
  userHasEdited = true
  saveStatus.value = 'unsaved'
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => saveSession(editorInstance), 250)
}

function removeDraft(key = currentDraftKey()) {
  try {
    localStorage.removeItem(key)
    if (key === GUEST_DRAFT_KEY) localStorage.removeItem(LEGACY_STORAGE_KEY)
  } catch {
    // A successful server save remains valid if local storage is unavailable.
  }
}

function deriveTitle() {
  const entered = documentTitle.value.trim()
  if (entered && entered !== 'Untitled document') return entered.slice(0, 120)
  const firstLine = buildDocumentSnapshot(editor.value).text.split(/\r?\n/).find(line => line.trim())?.trim()
  return (firstLine || 'Untitled document').slice(0, 120)
}

function currentPayload() {
  return {
    title: deriveTitle(),
    content: cleanGrammarMarks(editor.value.getJSON()),
    comments: comments.value
  }
}

async function saveDocument() {
  if (!editor.value || !hasDocumentContent.value || saveStatus.value === 'saving') return false
  if (saveTimer) clearTimeout(saveTimer)
  saveSession(editor.value)
  if (!appStore.user) {
    appStore.openAuth('login', async () => {
      const saved = await saveDocument()
      if (saved && decision.visible) finishDecision(true)
    })
    return false
  }

  const previousDraftKey = currentDraftKey()
  saveStatus.value = 'saving'
  try {
    const payload = currentPayload()
    const saved = activeDocumentId.value
      ? await appStore.updateDocument(activeDocumentId.value, { ...payload, version: activeVersion.value })
      : await appStore.createDocument(payload)
    activeDocumentId.value = saved.id
    activeVersion.value = saved.version
    documentTitle.value = saved.title
    saveStatus.value = 'saved'
    removeDraft(previousDraftKey)
    removeDraft(draftOriginKey)
    removeDraft(currentDraftKey(saved.id))
    draftOriginKey = currentDraftKey(saved.id)
    const pointerKey = activePointerKey()
    if (pointerKey) localStorage.setItem(pointerKey, saved.id)
    return true
  } catch (error) {
    saveStatus.value = 'error'
    if (error.status === 409 && error.data?.document) conflictDocument.value = error.data.document
    if (error.status === 401 || error.status === 403) {
      appStore.openAuth('login', saveDocument)
    }
    return false
  }
}

function requestSave({ continueDecision = false } = {}) {
  if (!editor.value || !hasDocumentContent.value || saveStatus.value === 'saving') return
  titleDialog.title = deriveTitle()
  titleDialog.continueDecision = continueDecision
  titleDialog.visible = true
}

function closeTitleDialog() {
  titleDialog.visible = false
  titleDialog.continueDecision = false
}

async function confirmTitleSave() {
  const title = titleDialog.title.trim().slice(0, 120)
  if (!title || !hasDocumentContent.value) return
  const continueDecision = titleDialog.continueDecision
  documentTitle.value = title
  titleDialog.visible = false
  titleDialog.continueDecision = false
  const saved = await saveDocument()
  if (saved && continueDecision && decision.visible) finishDecision(true)
}

function applyDocumentSession(session, { dirty = false } = {}) {
  if (!editor.value) return
  loadingSession = true
  Object.keys(issuesMap).forEach(id => delete issuesMap[id])
  closePopover()
  comments.value = Array.isArray(session.comments) ? session.comments : []
  documentTitle.value = session.title || 'Untitled document'
  activeDocumentId.value = session.id || session.documentId || null
  activeVersion.value = session.version || session.baseVersion || null
  draftOriginKey = currentDraftKey(activeDocumentId.value)
  userHasEdited = dirty
  const pointerKey = activePointerKey()
  if (pointerKey) localStorage.setItem(pointerKey, activeDocumentId.value || 'new')
  editor.value.commands.setContent(session.content || session.doc || { type: 'doc', content: [{ type: 'paragraph' }] })
  lastObservedText = buildDocumentSnapshot(editor.value).text
  hasCheckableText.value = lastObservedText.trim().length >= 3
  hasDocumentContent.value = lastObservedText.trim().length > 0
  saveStatus.value = dirty ? 'unsaved' : 'saved'
  nextTick(() => {
    loadingSession = false
    refreshCommentDecorations(false)
    scheduleCommentLayout()
  })
}

async function openDrawer() {
  drawerOpen.value = true
  if (appStore.user) await appStore.fetchDocuments()
}

async function requestOpenDocument(id) {
  if (!(await confirmBeforeOpen())) return
  try {
    const document = await appStore.getDocument(id)
    applyDocumentSession(document)
    drawerOpen.value = false
    nextTick(() => editor.value?.commands.focus('start'))
  } catch {
    saveStatus.value = 'error'
  }
}

async function requestNewDocument() {
  if (!(await confirmUnsaved())) return
  applyDocumentSession({
    id: null,
    version: null,
    title: 'Untitled document',
    content: { type: 'doc', content: [{ type: 'paragraph' }] },
    comments: []
  }, { dirty: true })
  drawerOpen.value = false
  nextTick(() => editor.value?.commands.focus('start'))
}

async function requestDeleteDocument(document) {
  if (!window.confirm(`Delete "${document.title}"? This cannot be undone.`)) return
  if (document.id === activeDocumentId.value && !(await confirmUnsaved())) return
  try {
    await appStore.deleteDocument(document.id)
    removeDraft(currentDraftKey(document.id))
    if (document.id === activeDocumentId.value) await requestNewDocument()
  } catch {
    saveStatus.value = 'error'
  }
}

function formatDocumentDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function confirmUnsaved() {
  if (!['unsaved', 'error'].includes(saveStatus.value)) return Promise.resolve(true)
  decision.mode = 'unsaved'
  decision.visible = true
  return new Promise(resolve => {
    decision.resolve = resolve
  })
}

function confirmBeforeOpen() {
  if (!hasDocumentContent.value) return Promise.resolve(true)
  decision.mode = ['unsaved', 'error'].includes(saveStatus.value) ? 'unsaved' : 'replace'
  decision.visible = true
  return new Promise(resolve => {
    decision.resolve = resolve
  })
}

function finishDecision(result) {
  const resolve = decision.resolve
  decision.visible = false
  decision.resolve = null
  resolve?.(result)
}

async function resolveDecision(action) {
  if (action === 'cancel') {
    finishDecision(false)
    return
  }
  if (action === 'discard') {
    removeDraft()
    saveStatus.value = 'saved'
    finishDecision(true)
    return
  }
  if (action === 'replace') {
    finishDecision(true)
    return
  }
  if (action === 'save') requestSave({ continueDecision: true })
}

function loadConflictVersion() {
  if (!conflictDocument.value) return
  removeDraft()
  applyDocumentSession(conflictDocument.value)
  conflictDocument.value = null
}

async function saveConflictAsCopy() {
  if (!appStore.user || !editor.value) return
  saveStatus.value = 'saving'
  try {
    const payload = currentPayload()
    const saved = await appStore.createDocument({
      ...payload,
      title: `${payload.title} (copy)`.slice(0, 120)
    })
    removeDraft()
    removeDraft(draftOriginKey)
    activeDocumentId.value = saved.id
    activeVersion.value = saved.version
    draftOriginKey = currentDraftKey(saved.id)
    documentTitle.value = saved.title
    conflictDocument.value = null
    saveStatus.value = 'saved'
  } catch {
    saveStatus.value = 'error'
  }
}

function handleBeforeUnload(event) {
  if (!['unsaved', 'error'].includes(saveStatus.value)) return
  saveSession(editor.value)
  event.preventDefault()
  event.returnValue = ''
}

function selectedQuote(doc, from, to) {
  return doc.textBetween(from, to, BLOCK_SEPARATOR)
}

function validateComments(doc) {
  let changed = false
  comments.value = comments.value.map(comment => {
    if (comment.unlinked) return comment
    const valid = comment.from >= 0 && comment.from < comment.to &&
      comment.to <= doc.content.size && selectedQuote(doc, comment.from, comment.to) === comment.quote
    if (valid) return comment
    changed = true
    return { ...comment, unlinked: true }
  })
  if (changed) scheduleSave()
}

function mapComments(transaction) {
  if (!comments.value.length) return
  let changed = false
  comments.value = comments.value.map(comment => {
    if (comment.unlinked) return comment
    const from = transaction.mapping.map(comment.from, 1)
    const to = transaction.mapping.map(comment.to, -1)
    const valid = from < to && to <= transaction.doc.content.size &&
      selectedQuote(transaction.doc, from, to) === comment.quote
    if (from !== comment.from || to !== comment.to || !valid) changed = true
    return valid ? { ...comment, from, to } : { ...comment, unlinked: true }
  })
  if (changed) queueMicrotask(refreshCommentDecorations)
}

function refreshCommentDecorations(persist = true) {
  if (!editor.value) return
  editor.value.view.dispatch(editor.value.state.tr.setMeta(COMMENT_REFRESH_META, true))
  scheduleCommentLayout()
  if (persist) scheduleSave(editor.value)
}

function shouldShowCommentMenu({ editor: editorInstance, state }) {
  const { from, to, empty } = state.selection
  return editorInstance.isEditable && !empty && !!selectedQuote(state.doc, from, to).trim() && !composer.visible
}

function openCommentComposer() {
  if (!editor.value) return
  const { from, to, empty } = editor.value.state.selection
  if (empty) return
  const quote = selectedQuote(editor.value.state.doc, from, to)
  if (!quote.trim()) return
  const coords = editor.value.view.coordsAtPos(from)
  const paper = paperRef.value?.getBoundingClientRect()
  Object.assign(composer, {
    visible: true, editingId: null, from, to, quote, note: '',
    x: paper ? Math.max(12, Math.min(coords.left - paper.left, paper.width - 300)) : 12,
    y: paper ? coords.bottom - paper.top + 8 : 12
  })
  nextTick(() => commentInputRef.value?.focus())
}

function closeCommentComposer() {
  composer.visible = false
  composer.editingId = null
  composer.note = ''
}

function saveComment() {
  if (!editor.value || !composer.note.trim()) return
  if (composer.editingId) {
    comments.value = comments.value.map(comment => comment.id === composer.editingId
      ? { ...comment, note: composer.note.trim() }
      : comment)
  } else {
    const doc = editor.value.state.doc
    if (composer.from >= composer.to || composer.to > doc.content.size ||
        selectedQuote(doc, composer.from, composer.to) !== composer.quote) {
      closeCommentComposer()
      return
    }
    comments.value = [...comments.value, {
      id: crypto.randomUUID(), from: composer.from, to: composer.to,
      quote: composer.quote, note: composer.note.trim(), createdAt: new Date().toISOString(),
      unlinked: false
    }]
  }
  closeCommentComposer()
  refreshCommentDecorations()
}

function editComment(comment) {
  const paper = paperRef.value?.getBoundingClientRect()
  const card = commentCards.get(comment.id)?.getBoundingClientRect()
  Object.assign(composer, {
    visible: true, editingId: comment.id, from: comment.from, to: comment.to,
    quote: comment.quote, note: comment.note,
    x: paper ? Math.max(12, Math.min((card?.left ?? paper.left + 12) - paper.left, paper.width - 300)) : 12,
    y: paper ? (card?.top ?? paper.top + 12) - paper.top : 12
  })
  nextTick(() => commentInputRef.value?.focus())
}

function deleteComment(id) {
  comments.value = comments.value.filter(comment => comment.id !== id)
  commentCards.delete(id)
  if (composer.editingId === id) closeCommentComposer()
  refreshCommentDecorations()
}

function formatCommentTime(value) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
}

function setCommentCardRef(id, element) {
  if (element) commentCards.set(id, element)
  else commentCards.delete(id)
}

function scheduleCommentLayout() {
  if (layoutFrame) cancelAnimationFrame(layoutFrame)
  layoutFrame = requestAnimationFrame(async () => {
    await nextTick()
    if (!editor.value || !paperRef.value) return
    const paper = paperRef.value.getBoundingClientRect()
    let bottom = 0
    const tops = {}
    for (const comment of linkedComments.value) {
      const desired = editor.value.view.coordsAtPos(comment.from).top - paper.top
      const top = Math.max(16, desired, bottom + 12)
      tops[comment.id] = top
      bottom = top + (commentCards.get(comment.id)?.offsetHeight || 140)
    }
    cardTops.value = tops
    commentRailHeight.value = bottom
  })
}

function setBlockStyle(value) {
  if (!editor.value) return
  if (value === 'paragraph') editor.value.chain().focus().setParagraph().run()
  else {
    const level = Number(value.replace('heading', ''))
    if ([1, 2, 3].includes(level)) editor.value.chain().focus().setHeading({ level }).run()
  }
}

function setFontSize(value) {
  if (!editor.value) return
  if (value === '') editor.value.chain().focus().unsetFontSize().run()
  else if (FONT_SIZES.some(size => `${size}px` === value)) editor.value.chain().focus().setFontSize(value).run()
}

function setFontFamily(value) {
  if (!editor.value) return
  if (value === '') editor.value.chain().focus().unsetFontFamily().run()
  else if (FONT_FAMILIES.some(font => font.value === value)) editor.value.chain().focus().setFontFamily(value).run()
}

function setAlignment(value) {
  if (editor.value && ['left', 'center', 'right', 'justify'].includes(value)) {
    editor.value.chain().focus().setTextAlign(value).run()
  }
}

function selectAlignment(value) {
  const openedFromMore = moreOpen.value
  setAlignment(value)
  closeToolbarMenus()
  nextTick(() => (openedFromMore ? moreButtonRef.value : alignmentTriggerRef.value)?.focus())
}

function toggleMore() {
  moreOpen.value = !moreOpen.value
  openToolbarMenu.value = null
}

function toggleToolbarMenu(name) {
  openToolbarMenu.value = openToolbarMenu.value === name ? null : name
}

function closeToolbarMenus() {
  openToolbarMenu.value = null
  moreOpen.value = false
}

function closeMoreMenu() {
  closeToolbarMenus()
  nextTick(() => moreButtonRef.value?.focus())
}

function getAlignmentOptions() {
  return [...(toolbarRef.value?.querySelectorAll('.alignment-option') || [])]
}

function focusAlignmentOption(index) {
  const options = getAlignmentOptions()
  if (!options.length) return
  options[(index + options.length) % options.length]?.focus()
}

function handleAlignmentTriggerKeydown(event) {
  if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
  event.preventDefault()
  if (openToolbarMenu.value !== 'align') toggleToolbarMenu('align')
  const selectedIndex = ALIGNMENTS.findIndex(alignment => alignment.value === toolbarState.align)
  nextTick(() => focusAlignmentOption(selectedIndex >= 0 ? selectedIndex : event.key === 'ArrowDown' ? 0 : ALIGNMENTS.length - 1))
}

function handleAlignmentOptionKeydown(event, index) {
  if (event.key === 'ArrowDown' || event.key === 'ArrowRight' || event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
    event.preventDefault()
    const step = event.key === 'ArrowDown' || event.key === 'ArrowRight' ? 1 : -1
    focusAlignmentOption(index + step)
  } else if (event.key === 'Home' || event.key === 'End') {
    event.preventDefault()
    focusAlignmentOption(event.key === 'Home' ? 0 : ALIGNMENTS.length - 1)
  } else if (event.key === 'Escape') {
    event.preventDefault()
    openToolbarMenu.value = null
    nextTick(() => alignmentTriggerRef.value?.focus())
  }
}

function setTextColor(value) {
  if (editor.value && /^#[0-9a-f]{6}$/i.test(value)) editor.value.chain().focus().setColor(value).run()
}

function setTextBackground(value) {
  if (editor.value && /^#[0-9a-f]{6}$/i.test(value)) editor.value.chain().focus().setBackgroundColor(value).run()
}

async function copyAllText() {
  if (!editor.value) return
  if (copyResetTimer) clearTimeout(copyResetTimer)
  try {
    await navigator.clipboard.writeText(editor.value.getText({ blockSeparator: BLOCK_SEPARATOR }))
    copyState.value = 'copied'
  } catch {
    copyState.value = 'error'
  }
  copyResetTimer = setTimeout(() => { copyState.value = 'idle' }, 2000)
}

function buildDocumentSnapshot(editorInstance) {
  const text = editorInstance.getText({ blockSeparator: BLOCK_SEPARATOR })
  const segments = []
  let rawCursor = 0

  editorInstance.state.doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return
    const rawFrom = text.indexOf(node.text, rawCursor)
    if (rawFrom === -1) return
    const rawTo = rawFrom + node.text.length
    segments.push({ rawFrom, rawTo, pmFrom: pos, pmTo: pos + node.nodeSize })
    rawCursor = rawTo
  })
  return { text, segments }
}

function codePointToCodeUnit(text, offset) {
  return Array.from(text).slice(0, Math.max(0, Number(offset) || 0)).join('').length
}

function mapRawPosition(segments, rawPosition) {
  const containing = segments.find(
    segment => segment.rawFrom <= rawPosition && rawPosition <= segment.rawTo
  )
  if (containing) {
    return containing.pmFrom + Math.min(
      rawPosition - containing.rawFrom,
      containing.pmTo - containing.pmFrom
    )
  }
  const next = segments.find(segment => segment.rawFrom > rawPosition)
  if (next) return next.pmFrom
  return segments.length ? segments[segments.length - 1].pmTo : null
}

function insertionHighlightRange(segments, rawPosition) {
  const next = segments.find(
    segment => segment.rawFrom <= rawPosition && rawPosition < segment.rawTo
  ) || segments.find(segment => segment.rawFrom >= rawPosition)
  if (next) {
    const from = next.pmFrom + Math.max(0, rawPosition - next.rawFrom)
    return { from, to: Math.min(from + 1, next.pmTo) }
  }
  const previous = segments[segments.length - 1]
  return previous
    ? { from: Math.max(previous.pmFrom, previous.pmTo - 1), to: previous.pmTo }
    : null
}

function clearIssues(editorInstance = editor.value) {
  Object.keys(issuesMap).forEach(key => delete issuesMap[key])
  fixAllNotice.value = ''
  closePopover()
  if (!editorInstance) return
  const { state, view } = editorInstance
  const markType = state.schema.marks.grammarIssue
  const tr = state.tr.removeMark(0, state.doc.content.size, markType).setMeta(GRAMMAR_DECORATION_META, true)
  if (tr.docChanged) view.dispatch(tr)
}

function applyIssuesToDocument(issues, snapshot) {
  if (!editor.value) return 0
  Object.keys(issuesMap).forEach(key => delete issuesMap[key])

  const { state, view } = editor.value
  const markType = state.schema.marks.grammarIssue
  const tr = state.tr.removeMark(0, state.doc.content.size, markType)
  let lastRangeEnd = -1
  let appliedCount = 0

  ;[...issues]
    .sort((a, b) => Number(a.offset) - Number(b.offset))
    .forEach(issue => {
      const codePointStart = Number(issue.offset)
      const codePointLength = Number(issue.length)
      if (!Number.isFinite(codePointStart) || !Number.isFinite(codePointLength) || codePointLength < 0) return

      const rawFrom = codePointToCodeUnit(snapshot.text, codePointStart)
      const rawTo = codePointToCodeUnit(snapshot.text, codePointStart + codePointLength)
      if (rawFrom < lastRangeEnd) return
      if (snapshot.text.slice(rawFrom, rawTo) !== (issue.original || '')) return

      const from = mapRawPosition(snapshot.segments, rawFrom)
      const to = mapRawPosition(snapshot.segments, rawTo)
      if (from === null || to === null || to < from) return

      const targetRange = { from, to }
      const highlightRange = from === to
        ? insertionHighlightRange(snapshot.segments, rawFrom)
        : targetRange
      if (!highlightRange || highlightRange.to <= highlightRange.from) return

      issuesMap[issue.id] = {
        ...issue,
        _range: targetRange,
        _highlightRange: highlightRange
      }
      tr.addMark(
        highlightRange.from,
        highlightRange.to,
        markType.create({ issueId: issue.id, issueType: issue.type })
      )
      lastRangeEnd = rawTo
      appliedCount += 1
    })

  tr.setMeta(GRAMMAR_DECORATION_META, true)
  view.dispatch(tr)
  return appliedCount
}

function scheduleGrammarCheck(editorInstance) {
  const snapshot = buildDocumentSnapshot(editorInstance)
  if (snapshot.text === lastObservedText) return
  lastObservedText = snapshot.text
  hasCheckableText.value = snapshot.text.trim().length >= 3

  if (debounceTimer) clearTimeout(debounceTimer)
  if (activeController) activeController.abort()
  requestSequence += 1
  const sequence = requestSequence
  clearIssues(editorInstance)

  if (snapshot.text.trim().length < 3) {
    statusKind.value = 'ready'
    statusMessage.value = 'Grammar Engine Ready'
    return
  }

  statusKind.value = 'waiting'
  statusMessage.value = 'Waiting to check…'
  debounceTimer = setTimeout(() => runGrammarCheck(sequence), DEBOUNCE_MS)
}

function checkAgain() {
  if (!editor.value || statusKind.value === 'checking') return
  const snapshot = buildDocumentSnapshot(editor.value)
  if (snapshot.text.trim().length < 3) return

  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = null
  if (activeController) activeController.abort()
  requestSequence += 1
  lastObservedText = snapshot.text
  clearIssues(editor.value)
  runGrammarCheck(requestSequence)
}

async function runGrammarCheck(sequence) {
  if (!editor.value || sequence !== requestSequence) return
  const snapshot = buildDocumentSnapshot(editor.value)
  const controller = new AbortController()
  activeController = controller
  statusKind.value = 'checking'
  statusMessage.value = 'Checking grammar…'

  try {
    const response = await grammarApi.checkGrammar(snapshot.text, 'en-US', controller.signal)
    if (
      sequence !== requestSequence ||
      !editor.value ||
      buildDocumentSnapshot(editor.value).text !== snapshot.text
    ) return

    if (!response?.success) throw new Error(response?.error || 'Failed to inspect grammar.')
    const appliedCount = applyIssuesToDocument(
      Array.isArray(response.issues) ? response.issues : [],
      snapshot
    )
    statusKind.value = 'success'
    statusMessage.value = appliedCount === 0 ? 'No issues found' : `Found ${appliedCount} issue(s)`
  } catch (error) {
    if (error.isCanceled || error.name === 'CanceledError' || sequence !== requestSequence) return
    console.error('Failed to run grammar check:', error)
    statusKind.value = 'error'
    statusMessage.value = error.status
      ? error.message
      : 'Failed to connect to Django BE. Check if server is running.'
  } finally {
    if (activeController === controller) activeController = null
  }
}

// Compute popover position relative to container
const openPopover = (element, issue) => {
  if (!containerRef.value) return
  cancelPopoverClose()

  const containerRect = containerRef.value.getBoundingClientRect()
  const targetRect = element.getBoundingClientRect()

  // Calculate coordinates aligned below the highlighted word
  let left = targetRect.left - containerRect.left
  let top = targetRect.bottom - containerRect.top + 6

  // Keep within bounds
  if (left + 320 > containerRect.width) {
    left = Math.max(16, containerRect.width - 340)
  }

  popoverState.targetElement = element
  popoverState.issue = issue
  popoverState.position = { x: left, y: top }
  popoverState.visible = true
}

function closePopover() {
  cancelPopoverClose()
  popoverState.visible = false
  popoverState.issue = null
  popoverState.targetElement = null
}

function cancelPopoverClose() {
  if (popoverCloseTimer) clearTimeout(popoverCloseTimer)
  popoverCloseTimer = null
}

function schedulePopoverClose() {
  cancelPopoverClose()
  popoverCloseTimer = setTimeout(() => {
    const active = document.activeElement
    if (active?.closest?.('.suggestion-popover, .grammar-highlight')) return
    closePopover()
  }, 180)
}

function handleEditorPointerOver(event) {
  const target = event.target.closest?.('.grammar-highlight')
  if (!target || !containerRef.value?.contains(target)) return
  const issue = issuesMap[target.getAttribute('data-issue-id')]
  if (issue && popoverState.targetElement !== target) openPopover(target, issue)
  else if (issue) cancelPopoverClose()
}

function handleEditorPointerOut(event) {
  const target = event.target.closest?.('.grammar-highlight')
  if (!target || !popoverState.visible) return
  if (event.relatedTarget && (target.contains(event.relatedTarget) || event.relatedTarget.closest?.('.suggestion-popover'))) return
  schedulePopoverClose()
}

function handleEditorFocusIn(event) {
  const target = event.target.closest?.('.grammar-highlight')
  if (!target) return
  const issue = issuesMap[target.getAttribute('data-issue-id')]
  if (issue) openPopover(target, issue)
}

function rangesAffectedByAccept(range, acceptedRange) {
  if (acceptedRange.from === acceptedRange.to) {
    return range.from <= acceptedRange.from && range.to >= acceptedRange.from
  }
  if (range.from === range.to) {
    return range.from >= acceptedRange.from && range.from <= acceptedRange.to
  }
  return range.from < acceptedRange.to && range.to > acceptedRange.from
}

function hasIssueMark(doc, markType, issueId) {
  let found = false
  doc.descendants(node => {
    if (node.isText && node.marks.some(mark => mark.type === markType && mark.attrs.issueId === issueId)) {
      found = true
    }
  })
  return found
}

function updateRemainingStatus() {
  const count = Object.keys(issuesMap).length
  statusKind.value = 'success'
  statusMessage.value = count === 0 ? 'No issues remaining' : `${count} issue(s) remaining`
}

// Accept only the selected issue and preserve still-valid suggestions.
const handleAccept = (issue) => {
  if (!editor.value || !issue?._range || !issuesMap[issue.id]) return

  if (debounceTimer) clearTimeout(debounceTimer)
  if (activeController) activeController.abort()
  requestSequence += 1

  const { state, view } = editor.value
  const markType = state.schema.marks.grammarIssue
  const acceptedRange = issue._range
  const acceptedHighlight = issue._highlightRange || acceptedRange
  const acceptedMark = markType.create({ issueId: issue.id, issueType: issue.type })
  const replacement = issue.replacement ?? ''
  const tr = state.tr

  tr.removeMark(acceptedHighlight.from, acceptedHighlight.to, acceptedMark)
  tr.replaceWith(
    acceptedRange.from,
    acceptedRange.to,
    replacement ? state.schema.text(replacement) : Fragment.empty
  )

  const remaining = {}
  for (const [id, currentIssue] of Object.entries(issuesMap)) {
    if (id === issue.id) continue

    const range = currentIssue._range
    const highlight = currentIssue._highlightRange || range
    const mappedRange = {
      from: tr.mapping.map(range.from, 1),
      to: tr.mapping.map(range.to, range.from === range.to ? 1 : -1)
    }
    const mappedHighlight = {
      from: tr.mapping.map(highlight.from, 1),
      to: tr.mapping.map(highlight.to, -1)
    }
    const affected = rangesAffectedByAccept(range, acceptedRange)
    const validRange = mappedRange.from <= mappedRange.to &&
      mappedHighlight.from < mappedHighlight.to &&
      mappedHighlight.to <= tr.doc.content.size
    const matchingText = range.from === range.to || (
      validRange &&
      tr.doc.textBetween(mappedRange.from, mappedRange.to, BLOCK_SEPARATOR) === currentIssue.original
    )
    const marked = validRange && hasIssueMark(tr.doc, markType, id)

    if (affected || !validRange || !matchingText || !marked) {
      if (marked) {
        tr.removeMark(
          mappedHighlight.from,
          mappedHighlight.to,
          markType.create({ issueId: id, issueType: currentIssue.type })
        )
      }
      continue
    }

    remaining[id] = {
      ...currentIssue,
      _range: mappedRange,
      _highlightRange: mappedHighlight
    }
  }

  tr.setMeta(ACCEPT_TRANSACTION_META, true)
  view.dispatch(tr)
  Object.keys(issuesMap).forEach(id => delete issuesMap[id])
  Object.assign(issuesMap, remaining)
  lastObservedText = buildDocumentSnapshot(editor.value).text
  updateRemainingStatus()
  fixAllNotice.value = ''
  closePopover()
  editor.value.commands.focus()
}

// Ignore suggestion: retain text and remove highlight mark
const handleIgnore = (issue) => {
  if (!editor.value || !issue) return
  const { state, view } = editor.value
  const markType = state.schema.marks.grammarIssue
  const tr = state.tr
  state.doc.descendants((node, pos) => {
    if (
      node.isText &&
      node.marks.some(mark => mark.type === markType && mark.attrs.issueId === issue.id)
    ) tr.removeMark(pos, pos + node.nodeSize, markType)
  })
  tr.setMeta(GRAMMAR_DECORATION_META, true)
  if (tr.docChanged) view.dispatch(tr)
  delete issuesMap[issue.id]
  updateRemainingStatus()
  fixAllNotice.value = ''
  closePopover()
}

function issueMatchesDocument(issue, doc) {
  const range = issue._range
  return range && range.from >= 0 && range.to <= doc.content.size && range.from <= range.to &&
    doc.textBetween(range.from, range.to, BLOCK_SEPARATOR) === (issue.original || '')
}

function handleFixAll() {
  if (!editor.value || issueList.value.length === 0) return
  if (debounceTimer) clearTimeout(debounceTimer)
  if (activeController) activeController.abort()
  requestSequence += 1

  const { state, view } = editor.value
  const markType = state.schema.marks.grammarIssue
  const candidates = issueList.value
  const selected = []
  let skipped = 0
  for (const issue of candidates) {
    const replacement = issue.replacement
    const previous = selected[selected.length - 1]
    const overlaps = previous && rangesAffectedByAccept(issue._range, previous._range)
    if (typeof replacement !== 'string' || !issueMatchesDocument(issue, state.doc) || overlaps) {
      skipped += 1
      continue
    }
    selected.push(issue)
  }

  if (selected.length === 0) {
    updateRemainingStatus()
    fixAllNotice.value = `Fixed 0 issues; skipped ${skipped} outdated or conflicting suggestion(s).`
    return
  }

  const tr = state.tr
  for (const issue of [...selected].reverse()) {
    const highlight = issue._highlightRange || issue._range
    tr.removeMark(highlight.from, highlight.to, markType.create({ issueId: issue.id, issueType: issue.type }))
    tr.replaceWith(
      issue._range.from,
      issue._range.to,
      issue.replacement ? state.schema.text(issue.replacement) : Fragment.empty
    )
  }

  const selectedIds = new Set(selected.map(issue => issue.id))
  const remaining = {}
  for (const issue of candidates) {
    if (selectedIds.has(issue.id)) continue
    const range = issue._range
    const highlight = issue._highlightRange || range
    const mappedRange = {
      from: tr.mapping.map(range.from, 1),
      to: tr.mapping.map(range.to, range.from === range.to ? 1 : -1)
    }
    const mappedHighlight = {
      from: tr.mapping.map(highlight.from, 1),
      to: tr.mapping.map(highlight.to, -1)
    }
    const valid = mappedRange.from <= mappedRange.to && mappedHighlight.from < mappedHighlight.to &&
      mappedHighlight.to <= tr.doc.content.size &&
      tr.doc.textBetween(mappedRange.from, mappedRange.to, BLOCK_SEPARATOR) === (issue.original || '') &&
      hasIssueMark(tr.doc, markType, issue.id) &&
      !selected.some(accepted => rangesAffectedByAccept(range, accepted._range))
    if (valid) remaining[issue.id] = { ...issue, _range: mappedRange, _highlightRange: mappedHighlight }
    else {
      skipped += 1
      if (mappedHighlight.from < mappedHighlight.to && mappedHighlight.to <= tr.doc.content.size) {
        tr.removeMark(mappedHighlight.from, mappedHighlight.to, markType.create({ issueId: issue.id, issueType: issue.type }))
      }
    }
  }

  tr.setMeta(ACCEPT_TRANSACTION_META, true)
  view.dispatch(tr)
  Object.keys(issuesMap).forEach(id => delete issuesMap[id])
  Object.assign(issuesMap, remaining)
  lastObservedText = buildDocumentSnapshot(editor.value).text
  updateRemainingStatus()
  closePopover()
  fixAllNotice.value = `Fixed ${selected.length} issue(s)${skipped ? `; skipped ${skipped} outdated or conflicting suggestion(s)` : ''}.`
}

// Global click outside listener
const handleDocumentClick = (e) => {
  if (toolbarRef.value && !toolbarRef.value.contains(e.target)) closeToolbarMenus()
  if (
    popoverState.visible &&
    containerRef.value &&
    !e.target.closest('.suggestion-popover') &&
    !e.target.closest('.grammar-highlight')
  ) {
    closePopover()
  }
}

watch(() => appStore.user, async (user, previousUser) => {
  if (user && !previousUser && !appStore.pendingAuthAction && !userHasEdited) {
    try {
      const pointer = localStorage.getItem(activePointerKey(user.id))
      if (pointer) {
        const local = loadSavedSession(currentDraftKey(pointer === 'new' ? null : pointer))
        if (local) applyDocumentSession(local, { dirty: true })
        else if (pointer !== 'new') applyDocumentSession(await appStore.getDocument(pointer))
      }
    } catch {
      // The editor remains on the guest draft if restoration is unavailable.
    }
  }
  if (!user && previousUser) {
    const guestDraft = loadSavedSession(GUEST_DRAFT_KEY, true)
    applyDocumentSession(guestDraft || {
      title: 'Untitled document',
      doc: INITIAL_DOC_CONTENT,
      comments: []
    }, { dirty: true })
  }
})

onMounted(() => {
  window.addEventListener('click', handleDocumentClick)
  window.addEventListener('resize', scheduleCommentLayout)
  window.addEventListener('beforeunload', handleBeforeUnload)
  appStore.setLogoutGuard(confirmUnsaved)
  resizeObserver = new ResizeObserver(scheduleCommentLayout)
  if (paperRef.value) resizeObserver.observe(paperRef.value)
  scheduleCommentLayout()
})

onBeforeUnmount(() => {
  window.removeEventListener('click', handleDocumentClick)
  window.removeEventListener('resize', scheduleCommentLayout)
  window.removeEventListener('beforeunload', handleBeforeUnload)
  appStore.setLogoutGuard(null)
  resizeObserver?.disconnect()
  if (layoutFrame) cancelAnimationFrame(layoutFrame)
  if (saveTimer) clearTimeout(saveTimer)
  if (['unsaved', 'error'].includes(saveStatus.value)) saveSession(editor.value)
  cancelPopoverClose()
  if (copyResetTimer) clearTimeout(copyResetTimer)
  if (debounceTimer) clearTimeout(debounceTimer)
  if (activeController) activeController.abort()
  if (decision.resolve) finishDecision(false)
  if (editor.value) {
    editor.value.destroy()
  }
})
</script>

<style>
/* Document & Typography Styling */
.editor-container {
  position: relative;
  width: 100%;
  max-width: 1320px;
  margin: 0 auto;
}

.editor-action-bar {
  position: relative;
  z-index: 30;
  display: grid;
  grid-template-columns: minmax(250px, 1fr) minmax(0, auto) minmax(220px, 1fr);
  align-items: center;
  margin-bottom: 16px;
  padding: 10px 18px;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  gap: 12px;
}

.format-toolbar {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex-wrap: nowrap;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  overflow: visible;
  white-space: nowrap;
  background: transparent;
}

.format-toolbar > * {
  flex: 0 0 auto;
}

.editor-actions {
  display: flex;
  align-items: center;
  justify-self: end;
  gap: 8px;
  flex-wrap: wrap;
}

.save-button, .documents-button, .new-document-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 34px;
  box-sizing: border-box;
  border: 1px solid #c4b5fd;
  border-radius: 9px;
  background: #6d28d9;
  color: #fff;
  padding: 0 12px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.save-button svg, .documents-button svg {
  width: 15px;
  height: 15px;
}

.save-button:hover:not(:disabled) { background: #5b21b6; }
.save-button:disabled { opacity: .55; cursor: not-allowed; }

.check-again-button {
  height: 34px;
  box-sizing: border-box;
  border: 1px solid #c7d2fe;
  border-radius: 8px;
  background: #eef2ff;
  color: #3730a3;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.check-again-button:hover:not(:disabled) {
  background: #e0e7ff;
}

.check-again-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar-extras, .toolbar-menu-wrap {
  position: relative;
  flex: 0 0 auto;
}

.toolbar-extra-controls {
  display: flex;
  align-items: center;
  gap: 4px;
}

.more-button {
  display: none !important;
  width: auto;
  padding: 4px 8px;
  font-size: 12px;
  font-weight: 600;
}

.toolbar-popover {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 60;
  padding: 6px;
  border: 1px solid #ded5f1;
  border-radius: 13px;
  background: rgba(255, 255, 255, 0.98);
  box-shadow: 0 16px 38px rgba(48, 31, 82, 0.18), 0 3px 10px rgba(48, 31, 82, 0.08);
  color: var(--text-h);
}

.alignment-popover {
  display: grid;
  grid-template-columns: repeat(4, 34px);
  gap: 4px;
}

.alignment-option {
  border-color: transparent;
  border-radius: 9px;
  background: transparent;
}

.toolbar-menu-enter-active,
.toolbar-menu-leave-active {
  transition: opacity 140ms ease, transform 140ms ease;
  transform-origin: top right;
}

.toolbar-menu-enter-from,
.toolbar-menu-leave-to {
  opacity: 0;
  transform: translateY(-4px) scale(0.98);
}

.toolbar-color-group {
  display: inline-flex;
  align-items: center;
}

.direct-color-input {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  opacity: 0;
  cursor: pointer;
}

.color-trigger:focus-within {
  outline: 2px solid #8b5cf6;
  outline-offset: 2px;
}

.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.icon-button svg {
  width: 18px;
  height: 18px;
}

.color-trigger {
  font-size: 15px;
  font-weight: 700;
}

.color-swatch {
  position: absolute;
  bottom: 2px;
  left: 7px;
  width: 18px;
  height: 3px;
  border-radius: 2px;
}

.toolbar-divider {
  height: 22px;
  border-left: 1px solid #e2e8f0;
  margin: 0 3px;
}

.format-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  box-sizing: border-box;
  padding: 4px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: var(--surface);
  color: #334155;
  font-size: 15px;
  cursor: pointer;
}

.format-button:hover, .format-button.is-active {
  border-color: #ddd6fe;
  background: #f5f3ff;
  color: #5b21b6;
}

:root[data-theme='dark'] .format-button {
  border-color: #4a4d61;
}

.format-button:focus-visible {
  outline: 2px solid #8b5cf6;
  outline-offset: 2px;
}

:root[data-theme='dark'] .toolbar-popover,
:root[data-theme='dark'] .toolbar-extra-controls {
  border-color: #4a4d61;
  background: var(--surface);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.36), 0 3px 10px rgba(0, 0, 0, 0.2);
}

.format-button--bold { font-weight: 800; }
.format-button--italic { font-style: italic; }
.format-button--underline { text-decoration: underline; }

.copy-button {
  flex: 0 0 34px;
}

.copy-button svg {
  width: 16px;
  height: 16px;
}

.copy-button--success { color: #047857; }
.copy-button--error { color: #b91c1c; }

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.editor-workspace {
  display: flex;
  align-items: flex-start;
  gap: 20px;
}

.doc-status {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 8px;
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.document-heading, .grammar-status {
  display: flex;
  align-items: center;
  min-width: 0;
  gap: 7px;
}

.documents-button {
  flex: 0 0 auto;
  width: 30px;
  height: 30px;
  padding: 0;
  border-color: #ddd6fe;
  background: #f5f3ff;
  color: #5b21b6;
}

.grammar-status { padding-left: 0; white-space: nowrap; }

.documents-overlay {
  position: fixed;
  inset: 0;
  z-index: 120;
  background: rgba(15, 11, 24, .42);
  backdrop-filter: blur(3px);
}

.documents-drawer {
  position: absolute;
  top: 0;
  left: 0;
  width: min(340px, 88vw);
  height: 100%;
  box-sizing: border-box;
  overflow-y: auto;
  padding: 22px;
  border-right: 1px solid var(--border);
  background: var(--surface);
  color: var(--text-h);
  box-shadow: 18px 0 50px rgba(25, 18, 42, .22);
}

.documents-drawer-enter-active,
.documents-drawer-leave-active {
  transition: background-color 220ms ease, backdrop-filter 220ms ease;
}

.documents-drawer-enter-active .documents-drawer,
.documents-drawer-leave-active .documents-drawer {
  transition: transform 280ms cubic-bezier(.22, 1, .36, 1), opacity 220ms ease;
  will-change: transform, opacity;
}

.documents-drawer-enter-from,
.documents-drawer-leave-to {
  background-color: rgba(15, 11, 24, 0);
  backdrop-filter: blur(0);
}

.documents-drawer-enter-from .documents-drawer,
.documents-drawer-leave-to .documents-drawer {
  opacity: .92;
  transform: translateX(-100%);
}

@media (prefers-reduced-motion: reduce) {
  .documents-drawer-enter-active,
  .documents-drawer-leave-active,
  .documents-drawer-enter-active .documents-drawer,
  .documents-drawer-leave-active .documents-drawer {
    transition-duration: 1ms;
  }
}

.documents-drawer-header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 18px; }
.documents-drawer-header p, .dialog-eyebrow { margin: 0 0 3px; color: var(--brand-color); font-size: 11px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; }
.documents-drawer-header h2 { margin: 0; font-size: 24px; }
.drawer-close { width: 34px; height: 34px; border: 0; border-radius: 9px; background: transparent; color: var(--text); font-size: 25px; cursor: pointer; }
.drawer-close:hover { background: var(--accent-bg); color: var(--brand-color); }
.new-document-button { width: 100%; margin-bottom: 16px; }
.documents-loading, .documents-empty { padding: 22px 10px; color: var(--text); font-size: 13px; text-align: center; }
.documents-empty button { border: 0; background: transparent; color: var(--brand-color); font-weight: 800; cursor: pointer; }
.document-list { display: grid; gap: 7px; }
.document-list-item { display: flex; align-items: center; border: 1px solid transparent; border-radius: 12px; background: transparent; }
.document-list-item:hover, .document-list-item.is-active { border-color: #ddd6fe; background: #f5f3ff; }
.document-open-button { display: grid; flex: 1; min-width: 0; gap: 3px; padding: 11px; border: 0; background: transparent; color: var(--text-h); text-align: left; cursor: pointer; }
.document-open-button strong { overflow: hidden; font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.document-open-button span { color: var(--text); font-size: 10px; }
.document-delete-button { flex: 0 0 32px; width: 32px; height: 32px; margin-right: 5px; border: 0; border-radius: 8px; background: transparent; color: #94a3b8; cursor: pointer; }
.document-delete-button:hover { background: #fee2e2; color: #b91c1c; }
.document-delete-button svg { width: 15px; height: 15px; }

.decision-overlay {
  position: fixed;
  inset: 0;
  z-index: 220;
  display: grid;
  place-items: center;
  box-sizing: border-box;
  padding: 20px;
  background: rgba(15, 11, 24, .58);
  backdrop-filter: blur(5px);
}

.decision-overlay--title { z-index: 230; }

.decision-dialog { width: min(440px, 100%); box-sizing: border-box; padding: 28px; border: 1px solid var(--border); border-radius: 18px; background: var(--surface); color: var(--text-h); box-shadow: 0 24px 60px rgba(25, 18, 42, .3); }
.decision-dialog h2 { margin: 0; font-size: 23px; }
.decision-dialog > p:not(.dialog-eyebrow) { margin: 8px 0 22px; color: var(--text); font-size: 14px; }
.decision-actions { display: flex; justify-content: flex-end; gap: 8px; }
.decision-actions--stacked { flex-wrap: wrap; }
.dialog-button { min-height: 38px; padding: 0 13px; border: 1px solid var(--border); border-radius: 9px; background: var(--surface); color: var(--text-h); font-family: inherit; font-weight: 700; cursor: pointer; }
.dialog-button--primary { border-color: #6d28d9; background: #6d28d9; color: #fff; }
.dialog-button--danger { border-color: #fecaca; color: #b91c1c; }
.dialog-button--quiet { color: var(--text); }

.title-form { display: grid; gap: 10px; }
.title-form label { color: var(--text-h); font-size: 12px; font-weight: 800; }
.title-input {
  width: 100%;
  height: 42px;
  box-sizing: border-box;
  margin-bottom: 10px;
  padding: 0 12px;
  border: 1px solid var(--border);
  border-radius: 10px;
  outline: none;
  background: var(--surface);
  color: var(--text-h);
  font: inherit;
}
.title-input:focus { border-color: #8b5cf6; box-shadow: 0 0 0 3px rgba(139, 92, 246, .16); }

:root[data-theme='dark'] .documents-button,
:root[data-theme='dark'] .document-list-item:hover,
:root[data-theme='dark'] .document-list-item.is-active { border-color: #574b70; background: #38305a; color: #ede9fe; }
:root[data-theme='dark'] .document-delete-button:hover { background: #512d3a; color: #fecaca; }

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background-color: #10b981;
}

.status-indicator.status-checking {
  background-color: #3b82f6;
  animation: pulse 1.5s infinite;
}

.status-indicator.status-waiting {
  background-color: #f59e0b;
}

.status-indicator.status-success,
.status-indicator.status-ready {
  background-color: #10b981;
}

.status-indicator.status-error {
  background-color: #ef4444;
}

@keyframes pulse {
  0% { transform: scale(0.95); opacity: 0.7; }
  50% { transform: scale(1.3); opacity: 1; }
  100% { transform: scale(0.95); opacity: 0.7; }
}

.editor-paper {
  position: relative;
  flex: 1;
  min-width: 0;
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03);
  padding: 0;
  min-height: max(80vh, var(--comment-rail-height));
  box-sizing: border-box;
  text-align: left;
}

.editor-paper:has(.comment-rail) .tiptap-content {
  padding-right: 260px;
}

.comment-highlight {
  background: rgba(250, 204, 21, 0.25);
  box-shadow: inset 0 -2px #eab308;
  border-radius: 2px;
}

.comment-bubble {
  display: flex;
  padding: 5px;
  border-radius: 8px;
  background: #31284e;
  box-shadow: 0 8px 22px rgba(36, 25, 65, 0.22);
  z-index: 60;
}

.comment-bubble button {
  border: 0;
  background: transparent;
  color: #fff;
  padding: 7px 11px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.comment-composer {
  position: absolute;
  z-index: 70;
  width: 280px;
  box-sizing: border-box;
  padding: 12px;
  border: 1px solid #ded7e9;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 12px 30px rgba(42, 25, 65, 0.2);
  text-align: left;
}

.comment-composer label {
  display: block;
  margin-bottom: 7px;
  color: #31284e;
  font-size: 13px;
  font-weight: 700;
}

.comment-composer textarea {
  box-sizing: border-box;
  width: 100%;
  resize: vertical;
  border: 1px solid #cfc7db;
  border-radius: 7px;
  padding: 8px;
  font: inherit;
  font-size: 13px;
  color: #1f2937;
  background: #fff;
}

.comment-composer-actions, .comment-card-actions {
  display: flex;
  justify-content: flex-end;
  gap: 7px;
  margin-top: 9px;
}

.comment-composer-actions button, .comment-card-actions button {
  border: 1px solid #d7cee6;
  border-radius: 6px;
  padding: 5px 9px;
  color: #5b21b6;
  background: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.comment-composer-actions button:last-child {
  background: #5b21b6;
  color: #fff;
}

.comment-composer-actions button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.comment-rail {
  position: absolute;
  top: 0;
  right: 12px;
  width: 210px;
  pointer-events: none;
}

.comment-card {
  box-sizing: border-box;
  padding: 11px 12px;
  border: 1px solid #eadcf0;
  border-radius: 10px;
  background: #fffaf6;
  box-shadow: 0 5px 16px rgba(70, 43, 80, 0.12);
  text-align: left;
  overflow-wrap: anywhere;
  pointer-events: auto;
}

.comment-rail .comment-card {
  position: absolute;
  left: 0;
  width: 100%;
}

.comment-card blockquote {
  margin: 0 0 6px;
  padding-left: 7px;
  border-left: 2px solid #ab75da;
  color: #6b4187;
  font-size: 11px;
  max-height: 4em;
  overflow: hidden;
}

.comment-card p {
  margin: 0 0 7px;
  color: #2c2540;
  font-size: 12px;
  line-height: 1.4;
  white-space: pre-wrap;
}

.comment-card time {
  color: #746b80;
  font-size: 10px;
}

.unlinked-comments {
  padding: 20px 28px;
  border-top: 1px solid #eee5f0;
}

.unlinked-comments h3 {
  margin: 0 0 10px;
  color: #6b4187;
  font-size: 14px;
}

.comment-card--unlinked {
  display: inline-block;
  vertical-align: top;
  width: min(220px, 100%);
  margin: 0 10px 10px 0;
}

:root[data-theme='dark'] .comment-card,
:root[data-theme='dark'] .comment-composer {
  background: #302b3b;
  border-color: #574b68;
}

:root[data-theme='dark'] .comment-card p,
:root[data-theme='dark'] .comment-composer label {
  color: #f3eff8;
}

:root[data-theme='dark'] .comment-card blockquote,
:root[data-theme='dark'] .comment-card time,
:root[data-theme='dark'] .unlinked-comments h3 {
  color: #d5b8e9;
}

:root[data-theme='dark'] .comment-highlight {
  background: rgba(250, 204, 21, 0.18);
}

.issues-sidebar {
  display: flex;
  flex-direction: column;
  width: 360px;
  flex: 0 0 360px;
  max-height: calc(100vh - 130px);
  overflow: hidden;
  box-sizing: border-box;
  padding: 18px;
  border-radius: 16px;
  background: #fff;
  box-shadow: 0 4px 20px rgba(56, 34, 77, 0.09);
  text-align: left;
  position: sticky;
  top: 16px;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.sidebar-header h2 {
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 4px;
  color: #1f2937;
}

.sidebar-header p {
  font-size: 12px;
  color: #6b7280;
  margin: 0;
}

.fix-all-button {
  width: 100%;
  margin: 18px 0 12px;
  padding: 10px;
  border: 0;
  border-radius: 8px;
  background: #5b21b6;
  color: #fff;
  font-weight: 700;
  cursor: pointer;
}

.fix-all-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.fix-all-notice, .empty-issues {
  color: #64748b;
  font-size: 12px;
  line-height: 1.5;
  margin: 4px 0 12px;
}

.issue-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 4px;
}

.issue-cards > * {
  flex: 0 0 auto;
}

.issue-card {
  border: 1px solid #e9e5ef;
  border-radius: 10px;
  padding: 14px;
  background: #fff;
}

.issue-card-category {
  color: #7c3aed;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.issue-card h3 {
  color: #1f2937;
  font-size: 16px;
  margin: 4px 0 10px;
  overflow-wrap: anywhere;
}

.issue-card-replacement, .issue-card-explanation {
  color: #475569;
  font-size: 13px;
  line-height: 1.5;
  margin: 0 0 9px;
  overflow-wrap: anywhere;
}

.issue-card-replacement strong {
  color: #065f46;
}

.issue-card-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.issue-card-actions button {
  padding: 7px 11px;
  border-radius: 7px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
}

.card-accept {
  border: 0;
  background: #4338ca;
  color: #fff;
}

.card-ignore {
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #475569;
}

@media (max-width: 900px) {
  .editor-workspace {
    flex-direction: column;
  }
  .editor-paper, .issues-sidebar {
    width: 100%;
    flex: 0 0 auto;
  }
  .issues-sidebar {
    position: static;
    max-height: calc(100vh - 32px);
  }
}

@media (max-width: 1200px) {
  .editor-action-bar {
    grid-template-columns: minmax(0, 1fr) auto;
  }
  .format-toolbar {
    grid-column: 1 / -1;
    grid-row: 2;
    justify-content: flex-start;
  }
  .editor-actions {
    grid-column: 2;
    grid-row: 1;
  }
}

@media (max-width: 800px) {
  .more-button {
    display: inline-flex !important;
    align-items: center;
    gap: 4px;
  }
  .toolbar-extra-controls {
    display: none;
  }
  .toolbar-extras.is-open .toolbar-extra-controls {
    display: flex;
    position: absolute;
    top: calc(100% + 7px);
    right: 0;
    z-index: 40;
    max-width: calc(100vw - 24px);
    box-sizing: border-box;
    padding: 7px;
    border: 1px solid #ded5f1;
    border-radius: 13px;
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 16px 38px rgba(48, 31, 82, 0.18), 0 3px 10px rgba(48, 31, 82, 0.08);
  }
  .toolbar-extra-controls > .toolbar-divider {
    display: none;
  }
}

@media (max-width: 600px) {
  .editor-action-bar {
    grid-template-columns: minmax(0, 1fr);
  }
  .doc-status {
    grid-column: 1;
    grid-row: 1;
  }
  .editor-actions {
    grid-column: 1;
    grid-row: 2;
    justify-self: start;
  }
  .format-toolbar {
    grid-column: 1;
    grid-row: 3;
    justify-content: flex-start;
    flex-wrap: wrap;
  }
  .document-heading { flex-wrap: wrap; }
  .decision-actions { align-items: stretch; flex-direction: column-reverse; }
  .dialog-button { width: 100%; }
  .editor-paper .tiptap-content {
    padding: 28px 22px;
  }
}

@media (max-width: 700px) {
  .editor-paper {
    min-height: 80vh;
  }
  .editor-paper:has(.comment-rail) .tiptap-content {
    padding-right: 22px;
  }
  .comment-rail {
    position: static;
    width: auto;
    height: auto !important;
    padding: 0 18px 18px;
    display: grid;
    gap: 10px;
  }
  .comment-rail .comment-card {
    position: static;
  }
  .comment-composer {
    max-width: calc(100% - 24px);
  }
}

.tiptap-content {
  color: #1f2937;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.75;
  padding: 36px 56px 48px;
}

.tiptap-content h1 {
  font-size: 2.1rem;
  font-weight: 800;
  letter-spacing: -0.025em;
  color: #0f172a;
  line-height: 1.25;
  margin-bottom: 12px;
}

.tiptap-content p {
  font-size: 1.05rem;
  margin-bottom: 1.5rem;
  color: #334155;
}

.author-meta {
  font-size: 0.95rem !important;
  color: #64748b !important;
  margin-bottom: 2rem !important;
  line-height: 1.4 !important;
}

.author-meta strong {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #475569;
  font-size: 10px;
  margin-right: 6px;
}

.sub-meta {
  font-size: 0.85rem;
  color: #94a3b8;
}

/* Grammar Highlights & Underlines */
.grammar-highlight {
  cursor: pointer;
  position: relative;
  transition: background-color 0.15s ease;
  border-radius: 2px;
  text-decoration: underline solid #ef4444 2px;
  text-underline-offset: 4px;
}

.grammar-highlight:hover {
  background-color: rgba(239, 68, 68, 0.1);
}

/* Remove default focus outline */
.ProseMirror:focus {
  outline: none;
}
</style>
