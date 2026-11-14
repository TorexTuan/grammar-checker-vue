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
          <button type="button" class="format-button grammar-issues-button" :class="{ 'has-issues': issueList.length > 0 }" :aria-expanded="issuesDrawerOpen" aria-controls="issues-sidebar" aria-label="Open grammar issues" title="Grammar issues" @click="openIssuesDrawer">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6h11M9 12h11M9 18h11" /><path d="m3.5 6 1.3 1.3L7 5M3.5 12l1.3 1.3L7 11M3.5 18l1.3 1.3L7 17" /></svg>
            <span v-if="issueList.length" class="grammar-issues-count" aria-hidden="true">{{ issueList.length > 99 ? '99+' : issueList.length }}</span>
          </button>
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
          <div class="toolbar-extras" :class="{ 'is-open': moreOpen }">
            <button ref="moreButtonRef" type="button" class="format-button more-button" :aria-expanded="moreOpen" aria-controls="toolbar-extra-controls" aria-label="More formatting" title="More formatting" @mousedown.prevent @click="toggleMore">
              <span class="more-button__label" aria-hidden="true">More ···</span>
              <svg class="more-button__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" /></svg>
            </button>
            <Teleport to="body" :disabled="!mobileMorePortal">
            <div id="toolbar-extra-controls" class="toolbar-extra-controls" :class="{ 'is-mobile-open': mobileMorePortal && moreOpen }" @keydown.esc.stop.prevent="closeMoreMenu">
              <button type="button" class="format-button format-button--bold" :class="{ 'is-active': toolbarState.bold }" :aria-pressed="toolbarState.bold" aria-label="Bold" title="Bold" @mousedown.prevent @click="editor?.chain().focus().toggleBold().run()">B</button>
              <button type="button" class="format-button format-button--italic" :class="{ 'is-active': toolbarState.italic }" :aria-pressed="toolbarState.italic" aria-label="Italic" title="Italic" @mousedown.prevent @click="editor?.chain().focus().toggleItalic().run()">I</button>
              <button type="button" class="format-button format-button--underline" :class="{ 'is-active': toolbarState.underline }" :aria-pressed="toolbarState.underline" aria-label="Underline" title="Underline" @mousedown.prevent @click="editor?.chain().focus().toggleUnderline().run()">U</button>
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
            </Teleport>
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
        <button type="button" class="save-button" :aria-label="saveStatus === 'saving' ? 'Saving document' : saveStatus === 'error' ? 'Retry saving document' : 'Save document'" :title="saveStatus === 'saving' ? 'Saving document' : saveStatus === 'error' ? 'Retry saving document' : 'Save document'" :disabled="saveStatus === 'saving' || !hasDocumentContent" @click="requestSave">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" /><path d="M17 21v-8H7v8M7 3v5h8" /></svg>
          <span class="save-button__label">{{ saveStatus === 'saving' ? 'Saving…' : saveStatus === 'error' ? 'Retry' : 'Save' }}</span>
        </button>
        <button type="button" class="check-again-button" aria-label="Check grammar again" title="Check grammar again" :disabled="statusKind === 'checking' || !hasCheckableText" @click="checkAgain">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 11a8 8 0 1 0-2.34 5.66" /><path d="M20 4v7h-7" /></svg>
          <span class="check-again-button__label">Check again</span>
        </button>
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
          <span class="comment-bubble-divider" aria-hidden="true"></span>
          <button type="button" @mousedown.prevent @click="openProfessionalRewrite">Professional rewrite</button>
        </bubble-menu>
        <div v-if="composer.visible" class="comment-composer" :style="composerStyle">
          <label for="comment-note">{{ composer.editingId ? 'Edit comment' : 'New comment' }}</label>
          <textarea id="comment-note" ref="commentInputRef" v-model="composer.note" rows="3" maxlength="2000" placeholder="Write a note…" @keydown.esc="closeCommentComposer"></textarea>
          <div class="comment-composer-actions">
            <button type="button" @click="closeCommentComposer">Cancel</button>
            <button type="button" :disabled="!composer.note.trim()" @click="saveComment">Save</button>
          </div>
        </div>
        <section
          v-if="rewrite.visible"
          class="rewrite-popover"
          :style="rewriteStyle"
          role="dialog"
          aria-labelledby="rewrite-title"
          :aria-busy="rewrite.status === 'loading'"
          @keydown.esc.stop.prevent="closeProfessionalRewrite"
        >
          <div class="rewrite-header">
            <div>
              <span>AI rewrite</span>
              <h3 id="rewrite-title">Professional tone</h3>
            </div>
            <button type="button" class="rewrite-close" aria-label="Close professional rewrite" @click="closeProfessionalRewrite">&times;</button>
          </div>
          <div v-if="rewrite.status === 'loading'" class="rewrite-message" role="status">
            <span class="rewrite-spinner" aria-hidden="true"></span>
            Creating professional alternatives…
          </div>
          <div v-else-if="rewrite.status === 'error' || rewrite.status === 'stale'" class="rewrite-message rewrite-message--error" role="alert">
            <p>{{ rewrite.error }}</p>
            <button v-if="rewrite.status === 'error'" type="button" @click="requestProfessionalRewrite">Retry</button>
          </div>
          <p v-else-if="rewrite.status === 'empty'" class="rewrite-message" role="status">No alternative was returned for this selection.</p>
          <div v-else class="rewrite-results" role="radiogroup" aria-label="Professional rewrite options">
            <button
              v-for="result in rewrite.results"
              :key="result.id"
              type="button"
              class="rewrite-result"
              :class="{ 'is-selected': rewrite.selectedId === result.id }"
              role="radio"
              :aria-checked="rewrite.selectedId === result.id"
              @click="rewrite.selectedId = result.id"
            >
              <span class="rewrite-radio" aria-hidden="true"></span>
              <span>{{ result.text }}</span>
            </button>
          </div>
          <div class="rewrite-actions">
            <button type="button" class="rewrite-cancel" @click="closeProfessionalRewrite">Cancel</button>
            <button
              type="button"
              class="rewrite-replace"
              :disabled="rewrite.status !== 'success' || !rewrite.selectedId"
              @click="applyProfessionalRewrite"
            >Replace</button>
          </div>
        </section>
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
      </div>

      <Transition name="issues-overlay">
        <div v-if="issuesDrawerOpen" class="issues-overlay" aria-hidden="true" @mousedown.self="closeIssuesDrawer"></div>
      </Transition>
      <aside id="issues-sidebar" class="issues-sidebar" :class="{ 'is-open': issuesDrawerOpen }" aria-label="Writing analysis" @keydown.esc="closeIssuesDrawer">
        <div class="issues-drawer-topbar">
          <strong>Writing analysis</strong>
          <button type="button" class="issues-drawer-close" aria-label="Close writing analysis" @click="closeIssuesDrawer">&times;</button>
        </div>
        <div class="analysis-tabs" role="tablist" aria-label="Writing analysis sections">
          <button id="analysis-tab-grammar" type="button" role="tab" aria-controls="analysis-panel-grammar" :aria-selected="activeAnalysisTab === 'grammar'" :tabindex="activeAnalysisTab === 'grammar' ? 0 : -1" @click="selectAnalysisTab('grammar')" @keydown="handleAnalysisTabKeydown">
            Grammar
            <span v-if="issueList.length" class="analysis-tab-count" aria-hidden="true">{{ issueList.length > 99 ? '99+' : issueList.length }}</span>
          </button>
          <button id="analysis-tab-quality" type="button" role="tab" aria-controls="analysis-panel-quality" :aria-selected="activeAnalysisTab === 'quality'" :tabindex="activeAnalysisTab === 'quality' ? 0 : -1" @click="selectAnalysisTab('quality')" @keydown="handleAnalysisTabKeydown">
            Writing Quality
          </button>
          <button id="analysis-tab-ai" type="button" role="tab" aria-controls="analysis-panel-ai" :aria-selected="activeAnalysisTab === 'ai'" :tabindex="activeAnalysisTab === 'ai' ? 0 : -1" @click="selectAnalysisTab('ai')" @keydown="handleAnalysisTabKeydown">
            AI Detector
          </button>
        </div>
        <section id="analysis-panel-quality" class="quality-panel analysis-tab-panel" :class="{ 'is-collapsed': qualityCollapsed, 'is-active': activeAnalysisTab === 'quality' }" role="tabpanel" aria-labelledby="analysis-tab-quality">
          <div class="quality-panel-header">
            <div>
              <h2 id="quality-panel-title">Writing quality</h2>
              <span v-if="qualityAssessment">{{ qualityAssessment.overall_score }}/100</span>
            </div>
            <button type="button" class="quality-panel-toggle" :aria-expanded="!qualityCollapsed" aria-controls="quality-panel-content" :aria-label="qualityCollapsed ? 'Expand writing quality' : 'Collapse writing quality'" @click="qualityCollapsed = !qualityCollapsed">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 8 5 5 5-5" /></svg>
            </button>
          </div>
          <div id="quality-panel-content" class="quality-card" :aria-busy="qualityStatus === 'loading'">
            <template v-if="qualityStatus === 'success' && qualityAssessment">
              <div class="quality-chart" :style="{ '--quality-score': qualityAssessment.overall_score || 0 }">
                <div class="quality-chart__center">
                  <strong>{{ qualityAssessment.overall_score }}</strong><span>/100</span>
                </div>
              </div>
              <div class="quality-bars">
                <div v-for="criterion in qualityCriteria" :key="criterion.key" class="quality-bar-row" :class="`quality-bar-row--${criterion.key}`">
                  <div><span>{{ criterion.label }}</span><strong>{{ criterion.score ?? '–' }}</strong></div>
                  <div class="quality-meter" aria-hidden="true"><span :style="{ width: `${criterion.score || 0}%` }"></span></div>
                </div>
              </div>
            </template>
            <div v-else class="quality-state" :class="{ 'quality-state--error': qualityStatus === 'error' }">
              <span v-if="qualityStatus === 'loading'" class="rewrite-spinner" aria-hidden="true"></span>
              <p v-if="documentWordCount < QUALITY_MIN_WORDS">Add {{ QUALITY_MIN_WORDS - documentWordCount }} more word(s) to calculate writing quality.</p>
              <p v-else-if="documentCharacterCount > QUALITY_MAX_CHARACTERS">Writing Quality supports up to {{ QUALITY_MAX_CHARACTERS.toLocaleString() }} characters.</p>
              <p v-else-if="qualityStatus === 'scheduled'">Writing Quality will update after you stop typing.</p>
              <p v-else-if="qualityStatus === 'loading'">Analyzing writing quality…</p>
              <template v-else-if="qualityStatus === 'error'">
                <p>{{ qualityError }}</p>
                <button type="button" @click="retryQualityAssessment">Try again</button>
              </template>
              <p v-else>Writing Quality is ready to analyze this text.</p>
            </div>
          </div>
        </section>
        <section id="analysis-panel-ai" class="ai-detector-panel analysis-tab-panel" :class="{ 'is-collapsed': aiDetectorCollapsed, 'is-active': activeAnalysisTab === 'ai' }" role="tabpanel" aria-labelledby="analysis-tab-ai">
          <div class="ai-detector-header">
            <div>
              <h2 id="ai-detector-title">AI Detector</h2>
              <span v-if="aiDetection.status === 'success'">{{ aiScorePercent }}%</span>
            </div>
            <button type="button" class="ai-detector-toggle" :aria-expanded="!aiDetectorCollapsed" aria-controls="ai-detector-content" :aria-label="aiDetectorCollapsed ? 'Expand AI detector' : 'Collapse AI detector'" @click="aiDetectorCollapsed = !aiDetectorCollapsed">
              <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 8 5 5 5-5" /></svg>
            </button>
          </div>
          <div id="ai-detector-content" class="ai-detector-content" :aria-busy="aiDetection.status === 'loading'">
            <template v-if="!appStore.user">
              <p>Sign in to analyze whether this text shows patterns associated with AI writing.</p>
              <button type="button" class="ai-analyze-button" @click="requestAiDetection">Sign in to analyze</button>
            </template>
            <template v-else>
              <p class="ai-detector-scope-hint">
                {{ aiSelection.active ? `Selected passage: ${aiSelection.characters.toLocaleString()} characters` : 'No text selected — the full document will be analyzed.' }}
              </p>
              <p v-if="aiTargetCharacterCount < AI_DETECT_MIN_CHARACTERS" class="ai-detector-hint">
                Add {{ AI_DETECT_MIN_CHARACTERS - aiTargetCharacterCount }} more character(s) to {{ aiSelection.active ? 'the selection' : 'the document' }}.
              </p>
              <p v-else-if="aiTargetCharacterCount > AI_DETECT_MAX_CHARACTERS" class="ai-detector-hint ai-detector-hint--error">
                AI Detector supports up to {{ AI_DETECT_MAX_CHARACTERS.toLocaleString() }} characters.
              </p>
              <button type="button" class="ai-analyze-button" :disabled="!canRunAiDetection || aiDetection.status === 'loading'" @click="requestAiDetection">
                {{ aiDetection.status === 'loading' ? 'Analyzing…' : aiDetection.status === 'success' ? 'Analyze again' : aiSelection.active ? 'Analyze selection' : 'Analyze document' }}
              </button>

              <div v-if="aiDetection.status === 'loading'" class="ai-detector-message" role="status">
                <span class="rewrite-spinner" aria-hidden="true"></span>
                Analyzing writing patterns…
              </div>
              <p v-else-if="aiDetection.status === 'error'" class="ai-detector-message ai-detector-message--error" role="alert">{{ aiDetection.error }}</p>
              <p v-else-if="aiDetection.status === 'stale'" class="ai-detector-message" role="status">Text changed — analyze again.</p>

              <div v-else-if="aiDetection.status === 'success' && aiDetection.result" class="ai-detector-result">
                <p class="ai-detector-scope-result">Analyzed {{ aiDetection.scope === 'selection' ? 'the selected passage' : 'the full document' }}.</p>
                <p v-if="aiDetection.result.low_confidence" class="ai-confidence-warning" role="status">
                  Confidence is low for this result. Add more continuous prose and review it carefully.
                </p>
                <div class="ai-verdict">
                  <div class="ai-score-ring" :style="{ '--ai-score': aiScorePercent }"><strong>{{ aiScorePercent }}%</strong></div>
                  <div>
                    <strong>{{ aiVerdictLabel }}</strong>
                    <span>{{ aiFractionPercent }}% of the text shows AI-like patterns</span>
                  </div>
                </div>
                <div v-if="topAiSegments.length" class="ai-segment-list">
                  <h3>Passages to review</h3>
                  <button v-for="segment in topAiSegments" :key="`${segment.start}-${segment.end}`" type="button" @click="focusAiSegment(segment)">
                    <span>{{ Math.round(segment.score * 100) }}%</span>
                    <q>{{ segment.text }}</q>
                  </button>
                </div>
                <p v-else class="ai-detector-hint">No individual passages were flagged for review.</p>
                <p class="ai-detector-disclaimer">This result is an estimate and should not be treated as proof.</p>
              </div>
            </template>
          </div>
        </section>
        <section id="analysis-panel-grammar" class="grammar-panel analysis-tab-panel" :class="{ 'is-active': activeAnalysisTab === 'grammar' }" role="tabpanel" aria-labelledby="analysis-tab-grammar">
          <div class="sidebar-header">
            <div>
              <h2>Grammar issues</h2>
              <p>{{ issueList.length }} current issue(s)</p>
            </div>
            <button type="button" class="accept-all-button" :disabled="issueList.length === 0" @click="handleAcceptAll">Accept All</button>
          </div>
          <p v-if="acceptAllNotice" class="accept-all-notice" role="status">{{ acceptAllNotice }}</p>
          <p v-if="issueList.length === 0" class="empty-issues">No issues to display.</p>
          <div v-else class="issue-cards">
            <article
              v-for="issue in issueList"
              :key="issue.id"
              class="issue-card"
              :class="{ 'is-active': activeIssueId === issue.id, 'is-locatable': !mobileIssuesMode }"
              :tabindex="mobileIssuesMode ? -1 : 0"
              :aria-label="mobileIssuesMode ? undefined : `Locate issue: ${issue.original || 'missing text'}`"
              @click="focusIssueFromCard(issue)"
              @keydown.enter.prevent="focusIssueFromCard(issue)"
              @keydown.space.prevent="focusIssueFromCard(issue)"
            >
              <div class="issue-card-top">
                <span class="issue-card-category">{{ issue.category }}</span>
              </div>
              <div class="issue-card-correction" aria-label="Text and suggested correction">
                <span class="issue-card-context">
                  <span>{{ issue._excerpt.before }}</span><span class="issue-card-error">{{ issue._excerpt.error || 'Missing text' }}</span><span>{{ issue._excerpt.after }}</span>
                </span>
                <span class="issue-card-arrow" aria-hidden="true">→</span>
                <strong class="issue-card-suggestion">{{ issue.replacement === '' ? 'Delete' : issue.replacement }}</strong>
              </div>
              <p class="issue-card-explanation">{{ issue.explanation }}</p>
              <div class="issue-card-actions">
                <button type="button" class="card-accept" @click.stop="handleAccept(issue)" @keydown.stop>Accept</button>
                <button type="button" class="card-ignore" @click.stop="handleIgnore(issue)" @keydown.stop>Ignore</button>
              </div>
            </article>
          </div>
        </section>
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
      <div v-if="deleteDialog.visible" class="decision-overlay" @mousedown.self="closeDeleteDialog">
        <section class="decision-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-document-title" aria-describedby="delete-document-description" @keydown.esc="closeDeleteDialog">
          <p class="dialog-eyebrow">Delete document</p>
          <h2 id="delete-document-title">Delete “{{ deleteDialog.document?.title }}”?</h2>
          <p id="delete-document-description">This document will be permanently removed from your account. This action cannot be undone.</p>
          <p v-if="deleteDialog.error" class="dialog-error" role="alert">{{ deleteDialog.error }}</p>
          <div class="decision-actions">
            <button type="button" class="dialog-button dialog-button--quiet" :disabled="deleteDialog.deleting" @click="closeDeleteDialog">Cancel</button>
            <button type="button" class="dialog-button dialog-button--danger-solid" :disabled="deleteDialog.deleting" @click="confirmDeleteDocument">
              {{ deleteDialog.deleting ? 'Deleting…' : 'Delete document' }}
            </button>
          </div>
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
      <Transition name="comment-reader">
        <div v-if="activeComment" class="comment-reader-overlay" @mousedown.self="closeCommentReader">
          <section class="comment-reader-dialog" role="dialog" aria-modal="true" aria-labelledby="comment-reader-title" @keydown.esc="closeCommentReader">
            <div class="comment-reader-header">
              <div>
                <p class="dialog-eyebrow">Comment</p>
                <h2 id="comment-reader-title">Comment on this text</h2>
              </div>
              <button type="button" class="comment-reader-close" aria-label="Close comment" @click="closeCommentReader">&times;</button>
            </div>
            <blockquote>{{ activeComment.quote }}</blockquote>
            <p class="comment-reader-note">{{ activeComment.note }}</p>
            <time :datetime="activeComment.createdAt">{{ formatCommentTime(activeComment.createdAt) }}</time>
            <div class="comment-reader-actions">
              <button type="button" class="dialog-button dialog-button--danger" @click="deleteActiveComment">Delete</button>
              <button type="button" class="dialog-button" @click="editActiveComment">Edit</button>
              <button type="button" class="dialog-button dialog-button--primary" @click="closeCommentReader">Close</button>
            </div>
          </section>
        </div>
      </Transition>
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
import { ref, reactive, computed, nextTick, onMounted, onBeforeUnmount, onActivated, onDeactivated, watch } from 'vue'
import { useEditor, EditorContent } from '@tiptap/vue-3'
import { BubbleMenu } from '@tiptap/vue-3/menus'
import { Fragment } from '@tiptap/pm/model'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { TextStyle, FontSize, FontFamily, Color, BackgroundColor } from '@tiptap/extension-text-style'
import TextAlign from '@tiptap/extension-text-align'
import { GrammarIssueMark } from './extensions/GrammarIssueMark'
import { AutocompleteGhost } from './extensions/AutocompleteGhost'
import { AiDetectionDecorations } from './extensions/AiDetectionDecorations'
import { createCommentDecorations, COMMENT_REFRESH_META } from './extensions/CommentDecorations'
import FormatDropdown from './FormatDropdown.vue'
import SuggestionPopover from './SuggestionPopover.vue'
import { grammarApi } from '../../api/grammar'
import { useAppStore } from '../../stores/app'

const containerRef = ref(null)
const appStore = useAppStore()
const toolbarRef = ref(null)
const moreButtonRef = ref(null)
const alignmentTriggerRef = ref(null)
const moreOpen = ref(false)
const mobileMorePortal = ref(false)
const openToolbarMenu = ref(null)
const paperRef = ref(null)
const commentInputRef = ref(null)
const commentCards = new Map()
const comments = ref([])
const activeCommentId = ref(null)
const activeComment = computed(() => comments.value.find(comment => comment.id === activeCommentId.value) || null)
const cardTops = ref({})
const commentRailHeight = ref(0)
const linkedComments = computed(() => [...comments.value].sort((a, b) => a.from - b.from))
const composer = reactive({ visible: false, editingId: null, from: 0, to: 0, quote: '', note: '', x: 12, y: 12 })
const composerStyle = computed(() => ({ left: `${composer.x}px`, top: `${composer.y}px` }))
const rewrite = reactive({
  visible: false,
  status: 'idle',
  from: 0,
  to: 0,
  original: '',
  results: [],
  selectedId: null,
  error: '',
  x: 12,
  y: 12
})
const rewriteStyle = computed(() => ({ left: `${rewrite.x}px`, top: `${rewrite.y}px` }))
const LEGACY_STORAGE_KEY = 'grammar-checker-document-v1'
const GUEST_DRAFT_KEY = 'grammar-checker-draft:guest'
const LEGACY_SAMPLE_HEADING = 'The Societal and Economic Implications of Autonomous AI Systems'

function createEmptyDocument() {
  return { type: 'doc', content: [{ type: 'paragraph' }] }
}

function documentContainsText(node, expectedText) {
  if (!node || typeof node !== 'object') return false
  if (typeof node.text === 'string' && node.text.includes(expectedText)) return true
  return Array.isArray(node.content) && node.content.some(child => documentContainsText(child, expectedText))
}

// A signed-in editor restores its account-scoped draft below. Loading the guest
// draft here would prevent that restoration and could expose a guest draft in
// the wrong account session.
const savedSession = appStore.user ? null : loadSavedSession(GUEST_DRAFT_KEY, true)
const documentTitle = ref(savedSession?.title || 'Untitled document')
const activeDocumentId = ref(null)
const activeVersion = ref(null)
const saveStatus = ref(savedSession ? 'unsaved' : 'saved')
const drawerOpen = ref(false)
const issuesDrawerOpen = ref(false)
const mobileIssuesMode = ref(window.innerWidth <= 700)
const activeAnalysisTab = ref('grammar')
const qualityCollapsed = ref(false)
const aiDetectorCollapsed = ref(false)
const qualityStatus = ref('idle')
const qualityAssessment = ref(null)
const qualityError = ref('')
const documentWordCount = ref(0)
const documentCharacterCount = ref(0)
const aiDetection = reactive({ status: 'idle', result: null, error: '', snapshotText: '', scope: 'document' })
const aiSelection = reactive({ active: false, characters: 0 })
const conflictDocument = ref(null)
const decision = reactive({ visible: false, resolve: null, mode: 'unsaved' })
const titleDialog = reactive({ visible: false, title: '', continueDecision: false })
const deleteDialog = reactive({ visible: false, document: null, deleting: false, error: '' })
const saveStatusLabel = computed(() => ({
  saved: 'Saved', unsaved: 'Unsaved', saving: 'Saving…', error: 'Save failed'
})[saveStatus.value] || 'Unsaved')
const issuesMap = reactive({})
const statusMessage = ref('Grammar Engine Ready')
const statusKind = ref('ready')
const hasCheckableText = ref(false)
const hasDocumentContent = ref(false)
const acceptAllNotice = ref('')
const activeIssueId = ref(null)
const issueList = computed(() => Object.values(issuesMap).sort((a, b) => a._range.from - b._range.from))
const QUALITY_MIN_WORDS = 20
const QUALITY_MAX_CHARACTERS = 10000
const AI_DETECT_MIN_CHARACTERS = 300
const AI_DETECT_MAX_CHARACTERS = 10000
const canAssessQuality = computed(() => (
  documentWordCount.value >= QUALITY_MIN_WORDS &&
  documentCharacterCount.value <= QUALITY_MAX_CHARACTERS
))
const canRunAiDetection = computed(() => (
  !!appStore.user &&
  aiTargetCharacterCount.value >= AI_DETECT_MIN_CHARACTERS &&
  aiTargetCharacterCount.value <= AI_DETECT_MAX_CHARACTERS
))
const aiTargetCharacterCount = computed(() => (
  aiSelection.active ? aiSelection.characters : documentCharacterCount.value
))
const aiScorePercent = computed(() => Math.round((aiDetection.result?.score || 0) * 100))
const aiFractionPercent = computed(() => Math.round((aiDetection.result?.ai_fraction || 0) * 100))
const aiVerdictLabel = computed(() => {
  if (aiDetection.result?.low_confidence) return 'Low-confidence result'
  return ({ human: 'Likely human', mixed: 'Mixed content', ai: 'Likely AI-generated' })[aiDetection.result?.verdict] || 'Analysis complete'
})
const topAiSegments = computed(() => [...(aiDetection.result?.segments || [])]
  .sort((a, b) => b.score - a.score)
  .slice(0, 5))
const qualityCriteria = computed(() => {
  const criteria = qualityAssessment.value?.criteria || {}
  return [
    ['grammar', 'Grammar'],
    ['clarity', 'Clarity'],
    ['coherence', 'Coherence'],
    ['vocabulary', 'Vocabulary']
  ].map(([key, label]) => ({ key, label, ...(criteria[key] || {}) }))
})
const FONT_SIZES = [12, 14, 16, 18, 20, 24, 32]
const FONT_FAMILIES = [
  { label: 'Inter', value: 'Inter' },
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
  ...FONT_SIZES.map(size => ({ label: `${size} px`, value: `${size}px` }))
]
const FONT_FAMILY_OPTIONS = [
  ...FONT_FAMILIES
]
const DESKTOP_DEFAULT_FONT_SIZE = '18px'
const COMPACT_DEFAULT_FONT_SIZE = '16px'
const DEFAULT_FONT_FAMILY = 'Inter'
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
const compactEditor = ref(window.innerWidth <= 1024)
const toolbarState = reactive({ block: 'paragraph', fontSize: compactEditor.value ? COMPACT_DEFAULT_FONT_SIZE : DESKTOP_DEFAULT_FONT_SIZE, fontFamily: DEFAULT_FONT_FAMILY, color: '', backgroundColor: '', align: 'left', bold: false, italic: false, underline: false })
const copyState = ref('idle')
const copyLabel = computed(() => copyState.value === 'copied' ? 'Copied' : copyState.value === 'error' ? 'Copy failed' : 'Copy')

const DEBOUNCE_MS = 3000
const QUALITY_DEBOUNCE_MS = 5000
const AUTOCOMPLETE_DEBOUNCE_MS = 450
const AUTOCOMPLETE_MAX_CONTEXT = 200
const REPHRASE_MAX_LENGTH = 4000
const BLOCK_SEPARATOR = '\n\n'
const ACCEPT_TRANSACTION_META = 'grammarAccept'
const AUTOCOMPLETE_ACCEPT_META = 'autocompleteAccept'
const REWRITE_ACCEPT_META = 'professionalRewriteAccept'
const GRAMMAR_DECORATION_META = 'grammarDecorations'
let debounceTimer = null
let activeController = null
let activeQualityController = null
let activeAiDetectionController = null
let aiDetectionSequence = 0
let autocompleteTimer = null
let activeAutocompleteController = null
let autocompleteSequence = 0
let autocompleteSuggestion = null
let activeRewriteController = null
let rewriteRequestSequence = 0
const draftAutocompleteSessionId = 'draft-' + (crypto.randomUUID?.() || Date.now())
let qualityDebounceTimer = null
let qualityRequestSequence = 0
let lastQualityObservedText = null
let requestSequence = 0
let lastObservedText = null
let popoverCloseTimer = null
let copyResetTimer = null
let saveTimer = null
let layoutFrame = null
let resizeObserver = null
let loadingSession = false
let practiceBaselinePending = false
let practiceBaselineFingerprints = new Set()
let draftOriginKey = GUEST_DRAFT_KEY
let userHasEdited = !!savedSession

comments.value = savedSession?.comments || []

const popoverState = reactive({
  visible: false,
  issue: null,
  position: { x: 0, y: 0 },
  targetElement: null
})

function countWords(text) {
  return (text.trim().match(/\S+/g) || []).length
}

function updateQualityEligibility(text) {
  documentWordCount.value = countWords(text)
  documentCharacterCount.value = text.length
}

function updateAiSelection(editorInstance) {
  if (!editorInstance) return
  const { from, to, empty } = editorInstance.state.selection
  const selectedText = empty ? '' : editorInstance.state.doc.textBetween(from, to, BLOCK_SEPARATOR)
  aiSelection.active = !empty && selectedText.length > 0
  aiSelection.characters = aiSelection.active ? selectedText.length : 0
}

function resetAiDetection(status = 'idle') {
  aiDetectionSequence += 1
  if (activeAiDetectionController) activeAiDetectionController.abort()
  activeAiDetectionController = null
  aiDetection.status = status
  aiDetection.result = null
  aiDetection.error = ''
  aiDetection.snapshotText = ''
  aiDetection.scope = 'document'
  editor.value?.commands.clearAiDetectionHighlights()
}

function invalidateAiDetectionForEdit() {
  const wasActive = aiDetection.status === 'loading' || aiDetection.status === 'success'
  resetAiDetection(wasActive ? 'stale' : 'idle')
}

function autocompleteSessionId() {
  return activeDocumentId.value ? `document-${activeDocumentId.value}` : draftAutocompleteSessionId
}

function autocompleteContext(editorInstance) {
  if (!editorInstance?.isEditable || !editorInstance.isFocused) return null
  const { selection } = editorInstance.state
  const { $from, empty } = selection
  if (!empty || !$from.parent.isTextblock || $from.parentOffset !== $from.parent.content.size) return null

  const start = Math.max(0, $from.parentOffset - AUTOCOMPLETE_MAX_CONTEXT)
  const query = $from.parent.textBetween(start, $from.parentOffset, '', '\ufffc')
  if (query.trim().length < 3 || !/[\p{L}\p{N}][\p{L}\p{N}'’,-]*\s?$/u.test(query)) return null
  return { position: selection.from, query }
}

function resetAutocomplete(clearDecoration = true) {
  autocompleteSequence += 1
  if (autocompleteTimer) clearTimeout(autocompleteTimer)
  autocompleteTimer = null
  if (activeAutocompleteController) activeAutocompleteController.abort()
  activeAutocompleteController = null
  autocompleteSuggestion = null
  if (clearDecoration) editor.value?.commands.clearAutocompleteGhost()
}

function scheduleAutocomplete(editorInstance) {
  resetAutocomplete(false)
  const context = autocompleteContext(editorInstance)
  if (!context) return
  const sequence = autocompleteSequence
  const sessionId = autocompleteSessionId()
  autocompleteTimer = setTimeout(() => {
    autocompleteTimer = null
    runAutocomplete(sequence, context, sessionId)
  }, AUTOCOMPLETE_DEBOUNCE_MS)
}

async function runAutocomplete(sequence, expectedContext, sessionId) {
  if (!editor.value || sequence !== autocompleteSequence) return
  const currentContext = autocompleteContext(editor.value)
  if (
    !currentContext ||
    currentContext.position !== expectedContext.position ||
    currentContext.query !== expectedContext.query
  ) return

  const controller = new AbortController()
  activeAutocompleteController = controller
  try {
    const response = await grammarApi.autocomplete(
      expectedContext.query,
      sessionId,
      controller.signal
    )
    const latestContext = autocompleteContext(editor.value)
    if (
      sequence !== autocompleteSequence ||
      !latestContext ||
      latestContext.position !== expectedContext.position ||
      latestContext.query !== expectedContext.query ||
      !response?.success ||
      typeof response.output !== 'string' ||
      !response.output.trim()
    ) return

    autocompleteSuggestion = {
      position: expectedContext.position,
      output: response.output,
      query: typeof response.query === 'string' ? response.query : expectedContext.query,
      hash: response.hash,
      sessionId
    }
    editor.value.commands.showAutocompleteGhost({
      position: autocompleteSuggestion.position,
      text: autocompleteSuggestion.output
    })
  } catch (error) {
    if (!error.isCanceled && error.name !== 'CanceledError' && sequence === autocompleteSequence) {
      console.debug('Autocomplete unavailable:', error.message)
    }
  } finally {
    if (activeAutocompleteController === controller) activeAutocompleteController = null
  }
}

function acceptAutocompleteSuggestion() {
  if (!editor.value || !autocompleteSuggestion) return false
  const { selection } = editor.value.state
  if (!selection.empty || selection.from !== autocompleteSuggestion.position) {
    resetAutocomplete()
    return false
  }

  const accepted = autocompleteSuggestion
  resetAutocomplete(false)
  const tr = editor.value.state.tr
    .insertText(accepted.output, accepted.position)
    .setMeta(AUTOCOMPLETE_ACCEPT_META, true)
  editor.value.view.dispatch(tr)
  grammarApi.acceptAutocomplete(
    accepted.hash,
    accepted.query,
    accepted.output,
    accepted.sessionId
  ).catch(() => {})
  return true
}

// Initialize Tiptap editor
const editor = useEditor({
  content: savedSession?.doc || createEmptyDocument(),
  editorProps: {
    attributes: {
      'aria-label': 'Document editor'
    }
  },
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
    Placeholder.configure({
      placeholder: 'Start writing or paste your text here…'
    }),
    TextAlign.configure({ types: ['heading', 'paragraph'], defaultAlignment: 'left' }),
    GrammarIssueMark,
    AutocompleteGhost,
    AiDetectionDecorations,
    createCommentDecorations(() => comments.value)
  ],
  onCreate: ({ editor: editorInstance }) => {
    lastObservedText = buildDocumentSnapshot(editorInstance).text
    lastQualityObservedText = null
    updateQualityEligibility(lastObservedText)
    hasCheckableText.value = lastObservedText.trim().length >= 3
    hasDocumentContent.value = lastObservedText.trim().length > 0
    validateComments(editorInstance.state.doc)
    syncToolbarState(editorInstance)
    scheduleCommentLayout()
    scheduleQualityAssessment(editorInstance)
  },
  onTransaction: ({ editor: editorInstance, transaction }) => {
    syncToolbarState(editorInstance)
    if (transaction.docChanged) {
      const currentText = buildDocumentSnapshot(editorInstance).text
      hasDocumentContent.value = currentText.trim().length > 0
      updateQualityEligibility(currentText)
    }
    if (transaction.docChanged && !transaction.getMeta(GRAMMAR_DECORATION_META) && !loadingSession) {
      mapComments(transaction)
      scheduleSave(editorInstance)
      scheduleCommentLayout()
    }
  },
  onUpdate: ({ editor: editorInstance, transaction }) => {
    const shouldScheduleAutocomplete = (
      transaction.docChanged &&
      !transaction.getMeta(GRAMMAR_DECORATION_META) &&
      !transaction.getMeta(AUTOCOMPLETE_ACCEPT_META) &&
      !transaction.getMeta(ACCEPT_TRANSACTION_META) &&
      !transaction.getMeta(REWRITE_ACCEPT_META) &&
      !loadingSession
    )
    if (
      transaction.docChanged &&
      !transaction.getMeta(GRAMMAR_DECORATION_META) &&
      !loadingSession
    ) {
      if (
        transaction.getMeta(AUTOCOMPLETE_ACCEPT_META) ||
        transaction.getMeta(ACCEPT_TRANSACTION_META) ||
        transaction.getMeta(REWRITE_ACCEPT_META)
      ) resetAutocomplete(false)
    }
    if (transaction.docChanged && !transaction.getMeta(GRAMMAR_DECORATION_META) && !loadingSession) {
      invalidateAiDetectionForEdit()
      scheduleQualityAssessment(editorInstance)
    }
    if (transaction.getMeta(ACCEPT_TRANSACTION_META)) {
      lastObservedText = buildDocumentSnapshot(editorInstance).text
      hasCheckableText.value = lastObservedText.trim().length >= 3
      hasDocumentContent.value = lastObservedText.trim().length > 0
      return
    }
    scheduleGrammarCheck(editorInstance)
    if (shouldScheduleAutocomplete) scheduleAutocomplete(editorInstance)
  },
  onSelectionUpdate: ({ editor: editorInstance }) => {
    resetAutocomplete()
    updateAiSelection(editorInstance)
  },
  onBlur: () => resetAutocomplete(),
  editorProps: {
    attributes: {
      class: 'prose-editor focus:outline-none'
    },
    handleClick(view, pos, event) {
      const commentMarker = event.target.closest?.('.comment-marker')
      if (commentMarker) {
        openCommentReader(commentMarker.getAttribute('data-comment-id'))
        return true
      }
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
      if (event.key === 'Escape' && rewrite.visible) {
        event.preventDefault()
        closeProfessionalRewrite()
        return true
      }
      if (event.key === 'Tab' && autocompleteSuggestion) {
        event.preventDefault()
        return acceptAutocompleteSuggestion()
      }
      if (event.key === 'Escape' && autocompleteSuggestion) {
        event.preventDefault()
        resetAutocomplete()
        return true
      }
      if ((event.key === 'Enter' || event.key === ' ') && event.target?.classList?.contains('comment-marker')) {
        event.preventDefault()
        openCommentReader(event.target.getAttribute('data-comment-id'))
        return true
      }
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
  const responsiveDefaultSize = compactEditor.value ? COMPACT_DEFAULT_FONT_SIZE : DESKTOP_DEFAULT_FONT_SIZE
  toolbarState.fontSize = FONT_SIZES.some(value => `${value}px` === size) ? size : responsiveDefaultSize
  const textStyle = editorInstance.getAttributes('textStyle')
  toolbarState.fontFamily = textStyle.fontFamily || DEFAULT_FONT_FAMILY
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
    if (documentContainsText(saved.doc, LEGACY_SAMPLE_HEADING)) {
      localStorage.removeItem(key)
      if (allowLegacy) localStorage.removeItem(LEGACY_STORAGE_KEY)
      return null
    }
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

async function restoreAccountSession(user = appStore.user) {
  if (!user || userHasEdited || !editor.value) return
  try {
    const pointer = localStorage.getItem(activePointerKey(user.id))
    if (!pointer) return
    const documentId = pointer === 'new' ? null : pointer
    const local = loadSavedSession(`grammar-checker-draft:user:${user.id}:document:${documentId || 'new'}`)
    if (local) applyDocumentSession(local, { dirty: true })
    else if (documentId) applyDocumentSession(await appStore.getDocument(documentId))
  } catch {
    // Keep the current editor content if account restoration is unavailable.
  }
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
  titleDialog.title = activeDocumentId.value ? documentTitle.value.trim().slice(0, 120) : ''
  titleDialog.continueDecision = continueDecision
  titleDialog.visible = true
}

function closeTitleDialog() {
  const shouldCancelDecision = titleDialog.continueDecision && decision.visible
  titleDialog.visible = false
  titleDialog.continueDecision = false
  if (shouldCancelDecision) finishDecision(false)
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
  resetAutocomplete()
  resetAiDetection()
  closeProfessionalRewrite()
  loadingSession = true
  Object.keys(issuesMap).forEach(id => delete issuesMap[id])
  closePopover()
  comments.value = Array.isArray(session.comments) ? session.comments : []
  documentTitle.value = session.title || 'Untitled document'
  activeDocumentId.value = session.id || session.documentId || null
  practiceBaselineFingerprints = new Set()
  practiceBaselinePending = !!activeDocumentId.value
  activeVersion.value = session.version || session.baseVersion || null
  draftOriginKey = currentDraftKey(activeDocumentId.value)
  userHasEdited = dirty
  const pointerKey = activePointerKey()
  if (pointerKey) localStorage.setItem(pointerKey, activeDocumentId.value || 'new')
  editor.value.commands.setContent(session.content || session.doc || createEmptyDocument())
  lastObservedText = buildDocumentSnapshot(editor.value).text
  lastQualityObservedText = null
  invalidateQualityAssessment()
  updateQualityEligibility(lastObservedText)
  hasCheckableText.value = lastObservedText.trim().length >= 3
  hasDocumentContent.value = lastObservedText.trim().length > 0
  saveStatus.value = dirty ? 'unsaved' : 'saved'
  scheduleQualityAssessment(editor.value)
  nextTick(() => {
    loadingSession = false
    validateComments(editor.value.state.doc)
    refreshCommentDecorations(false)
    scheduleCommentLayout()
    if (practiceBaselinePending && hasCheckableText.value) checkAgain()
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
  if (!appStore.user) {
    appStore.openAuth('login', requestNewDocument)
    return
  }
  if (!(await confirmUnsaved())) return
  applyDocumentSession({
    id: null,
    version: null,
    title: 'Untitled document',
    content: createEmptyDocument(),
    comments: []
  }, { dirty: true })
  drawerOpen.value = false
  nextTick(() => editor.value?.commands.focus('start'))
}

function requestDeleteDocument(document) {
  deleteDialog.document = document
  deleteDialog.error = ''
  deleteDialog.visible = true
}

function closeDeleteDialog() {
  if (deleteDialog.deleting) return
  deleteDialog.visible = false
  deleteDialog.document = null
  deleteDialog.error = ''
}

async function confirmDeleteDocument() {
  const document = deleteDialog.document
  if (!document || deleteDialog.deleting) return

  if (document.id === activeDocumentId.value && ['unsaved', 'error'].includes(saveStatus.value)) {
    deleteDialog.visible = false
    if (!(await confirmUnsaved())) {
      deleteDialog.document = null
      return
    }
    deleteDialog.visible = true
  }

  deleteDialog.deleting = true
  deleteDialog.error = ''
  try {
    await appStore.deleteDocument(document.id)
    removeDraft(currentDraftKey(document.id))
    if (document.id === activeDocumentId.value) await requestNewDocument()
    deleteDialog.deleting = false
    closeDeleteDialog()
  } catch {
    saveStatus.value = 'error'
    deleteDialog.error = 'Unable to delete this document. Please try again.'
    deleteDialog.deleting = false
  }
}

function formatDocumentDate(value) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value))
}

function confirmUnsaved() {
  if (!hasDocumentContent.value) return Promise.resolve(true)
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

function handlePageHide() {
  if (!['unsaved', 'error'].includes(saveStatus.value)) return
  saveSession(editor.value)
}

function selectedQuote(doc, from, to) {
  return doc.textBetween(from, to, BLOCK_SEPARATOR)
}

function cleanUpDetachedCommentState(validComments) {
  const validIds = new Set(validComments.map(comment => comment.id))
  for (const id of commentCards.keys()) {
    if (!validIds.has(id)) commentCards.delete(id)
  }
  if (composer.editingId && !validIds.has(composer.editingId)) closeCommentComposer()
  if (activeCommentId.value && !validIds.has(activeCommentId.value)) closeCommentReader()
}

function validateComments(doc) {
  const validComments = comments.value.filter(comment =>
    !comment.unlinked && comment.from >= 0 && comment.from < comment.to &&
    comment.to <= doc.content.size && selectedQuote(doc, comment.from, comment.to) === comment.quote
  )
  if (validComments.length === comments.value.length) return
  comments.value = validComments
  cleanUpDetachedCommentState(validComments)
  scheduleSave()
}

function mapComments(transaction) {
  if (!comments.value.length) return
  let changed = false
  const validComments = []
  for (const comment of comments.value) {
    const from = transaction.mapping.map(comment.from, 1)
    const to = transaction.mapping.map(comment.to, -1)
    const valid = from < to && to <= transaction.doc.content.size &&
      selectedQuote(transaction.doc, from, to) === comment.quote
    if (from !== comment.from || to !== comment.to || !valid) changed = true
    if (valid) validComments.push({ ...comment, from, to })
  }
  comments.value = validComments
  if (changed) {
    cleanUpDetachedCommentState(validComments)
    queueMicrotask(refreshCommentDecorations)
  }
}

function refreshCommentDecorations(persist = true) {
  if (!editor.value) return
  editor.value.view.dispatch(editor.value.state.tr.setMeta(COMMENT_REFRESH_META, true))
  scheduleCommentLayout()
  if (persist) scheduleSave(editor.value)
}

function shouldShowCommentMenu({ editor: editorInstance, state }) {
  const { from, to, empty } = state.selection
  return editorInstance.isEditable && !empty && !!selectedQuote(state.doc, from, to).trim() &&
    !composer.visible && !rewrite.visible
}

function openCommentComposer() {
  if (!editor.value) return
  closeProfessionalRewrite()
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

function closeProfessionalRewrite() {
  rewriteRequestSequence += 1
  if (activeRewriteController) activeRewriteController.abort()
  activeRewriteController = null
  Object.assign(rewrite, {
    visible: false,
    status: 'idle',
    from: 0,
    to: 0,
    original: '',
    results: [],
    selectedId: null,
    error: ''
  })
}

function openProfessionalRewrite() {
  if (!editor.value) return
  const { from, to, empty } = editor.value.state.selection
  if (empty) return
  const original = selectedQuote(editor.value.state.doc, from, to)
  if (!original.trim()) return

  closeCommentComposer()
  closeProfessionalRewrite()
  resetAutocomplete()
  const coords = editor.value.view.coordsAtPos(to)
  const paper = paperRef.value?.getBoundingClientRect()
  Object.assign(rewrite, {
    visible: true,
    status: original.length > REPHRASE_MAX_LENGTH ? 'stale' : 'loading',
    from,
    to,
    original,
    results: [],
    selectedId: null,
    error: original.length > REPHRASE_MAX_LENGTH
      ? `Select no more than ${REPHRASE_MAX_LENGTH.toLocaleString()} characters.`
      : '',
    x: paper ? Math.max(12, Math.min(coords.left - paper.left, paper.width - 404)) : 12,
    y: paper ? coords.bottom - paper.top + 8 : 12
  })
  if (original.length <= REPHRASE_MAX_LENGTH) requestProfessionalRewrite()
}

async function requestProfessionalRewrite() {
  if (!rewrite.visible || !rewrite.original || rewrite.status === 'loading' && activeRewriteController) return
  if (activeRewriteController) activeRewriteController.abort()
  const controller = new AbortController()
  activeRewriteController = controller
  const sequence = ++rewriteRequestSequence
  rewrite.status = 'loading'
  rewrite.results = []
  rewrite.selectedId = null
  rewrite.error = ''

  try {
    const response = await grammarApi.rephraseProfessional(rewrite.original, controller.signal)
    if (sequence !== rewriteRequestSequence || !rewrite.visible) return
    if (!response?.success || !Array.isArray(response.results)) {
      throw new Error(response?.error || 'Professional rewrite returned an invalid response.')
    }
    const seenText = new Set()
    const seenId = new Set()
    const results = []
    for (const [index, result] of response.results.entries()) {
      if (typeof result?.id !== 'string' || typeof result?.text !== 'string' || !result.text.trim()) continue
      const text = result.text.trim()
      const textKey = text.toLocaleLowerCase()
      if (seenText.has(textKey)) continue
      seenText.add(textKey)
      let id = result.id || `rewrite-${index}`
      if (seenId.has(id)) id = `${id}-${index}`
      seenId.add(id)
      results.push({ id, text })
      if (results.length === 3) break
    }
    rewrite.results = results
    rewrite.selectedId = results[0]?.id || null
    rewrite.status = results.length ? 'success' : 'empty'
  } catch (error) {
    if (error.isCanceled || error.name === 'CanceledError' || sequence !== rewriteRequestSequence) return
    rewrite.status = 'error'
    rewrite.error = error.message || 'Professional rewrite is temporarily unavailable.'
  } finally {
    if (activeRewriteController === controller) activeRewriteController = null
  }
}

function applyProfessionalRewrite() {
  if (!editor.value || rewrite.status !== 'success') return
  const result = rewrite.results.find(candidate => candidate.id === rewrite.selectedId)
  if (!result) return
  const { state, view } = editor.value
  const rangeIsCurrent = rewrite.from >= 0 && rewrite.from < rewrite.to &&
    rewrite.to <= state.doc.content.size &&
    selectedQuote(state.doc, rewrite.from, rewrite.to) === rewrite.original
  if (!rangeIsCurrent) {
    rewrite.status = 'stale'
    rewrite.error = 'The document changed while this rewrite was loading. Select the text again.'
    rewrite.results = []
    rewrite.selectedId = null
    return
  }

  resetAutocomplete(false)
  const cursor = rewrite.from + result.text.length
  const tr = state.tr
    .insertText(result.text, rewrite.from, rewrite.to)
    .setMeta(REWRITE_ACCEPT_META, true)
  view.dispatch(tr)
  closeProfessionalRewrite()
  editor.value.commands.focus(Math.min(cursor, editor.value.state.doc.content.size))
}

function openCommentReader(commentId) {
  if (comments.value.some(comment => comment.id === commentId && !comment.unlinked)) {
    activeCommentId.value = commentId
  }
}

function closeCommentReader() {
  activeCommentId.value = null
}

function editActiveComment() {
  const comment = activeComment.value
  if (!comment) return
  closeCommentReader()
  editComment(comment)
}

function deleteActiveComment() {
  const commentId = activeCommentId.value
  if (!commentId) return
  closeCommentReader()
  deleteComment(commentId)
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
  if (activeCommentId.value === id) closeCommentReader()
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

function mapAiDetectionSegments(segments, snapshot) {
  const mapped = []
  for (const segment of Array.isArray(segments) ? segments : []) {
    const codePointStart = Number(segment.start)
    const codePointEnd = Number(segment.end)
    if (!Number.isInteger(codePointStart) || !Number.isInteger(codePointEnd) || codePointEnd <= codePointStart) continue
    const rawFrom = codePointToCodeUnit(snapshot.text, codePointStart)
    const rawTo = codePointToCodeUnit(snapshot.text, codePointEnd)
    if (snapshot.text.slice(rawFrom, rawTo) !== segment.text) continue
    const from = mapRawPosition(snapshot.segments, rawFrom)
    const to = mapRawPosition(snapshot.segments, rawTo)
    if (from === null || to === null || from >= to) continue
    mapped.push({ ...segment, _range: { from, to } })
  }
  return mapped
}

function buildAiDetectionSnapshot(editorInstance) {
  const documentSnapshot = buildDocumentSnapshot(editorInstance)
  const { from, to, empty } = editorInstance.state.selection
  if (empty) {
    return { ...documentSnapshot, documentText: documentSnapshot.text, scope: 'document' }
  }

  const rawFrom = rawPositionFromDocument(documentSnapshot, from)
  const rawTo = rawPositionFromDocument(documentSnapshot, to)
  if (rawTo <= rawFrom) {
    return { ...documentSnapshot, documentText: documentSnapshot.text, scope: 'document' }
  }

  const segments = documentSnapshot.segments.flatMap(segment => {
    const clippedFrom = Math.max(segment.rawFrom, rawFrom)
    const clippedTo = Math.min(segment.rawTo, rawTo)
    if (clippedTo <= clippedFrom) return []
    return [{
      rawFrom: clippedFrom - rawFrom,
      rawTo: clippedTo - rawFrom,
      pmFrom: segment.pmFrom + (clippedFrom - segment.rawFrom),
      pmTo: segment.pmFrom + (clippedTo - segment.rawFrom),
    }]
  })
  return {
    text: documentSnapshot.text.slice(rawFrom, rawTo),
    segments,
    documentText: documentSnapshot.text,
    scope: 'selection',
  }
}

async function requestAiDetection() {
  if (!editor.value) return
  if (!appStore.user) {
    appStore.openAuth('login', requestAiDetection)
    return
  }
  const snapshot = buildAiDetectionSnapshot(editor.value)
  if (snapshot.text.length < AI_DETECT_MIN_CHARACTERS || snapshot.text.length > AI_DETECT_MAX_CHARACTERS) return

  resetAiDetection()
  const sequence = aiDetectionSequence
  const controller = new AbortController()
  activeAiDetectionController = controller
  aiDetection.status = 'loading'
  aiDetection.snapshotText = snapshot.text
  aiDetection.scope = snapshot.scope

  try {
    const response = await grammarApi.detectAi(snapshot.text, controller.signal)
    if (
      sequence !== aiDetectionSequence ||
      !editor.value ||
      buildDocumentSnapshot(editor.value).text !== snapshot.documentText
    ) return
    if (!response?.success || !Array.isArray(response.segments)) {
      throw new Error(response?.error || 'AI Detector returned an invalid response.')
    }
    const segments = mapAiDetectionSegments(response.segments, snapshot)
    aiDetection.result = { ...response, segments }
    aiDetection.status = 'success'
    editor.value.commands.setAiDetectionHighlights(segments.map(segment => segment._range))
  } catch (error) {
    if (error.isCanceled || error.name === 'CanceledError' || sequence !== aiDetectionSequence) return
    aiDetection.status = 'error'
    aiDetection.error = error.status === 429
      ? 'AI Detector usage limit reached. Please try again later.'
      : error.message || 'AI Detector is temporarily unavailable.'
  } finally {
    if (activeAiDetectionController === controller) activeAiDetectionController = null
  }
}

function focusAiSegment(segment) {
  if (!editor.value || !segment?._range) return
  const position = Math.min(segment._range.from, editor.value.state.doc.content.size)
  const dom = editor.value.view.domAtPos(position).node
  const element = dom.nodeType === Node.TEXT_NODE ? dom.parentElement : dom
  element?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
  editor.value.commands.setTextSelection(segment._range)
  editor.value.commands.focus()
}

function clearIssues(editorInstance = editor.value) {
  Object.keys(issuesMap).forEach(key => delete issuesMap[key])
  acceptAllNotice.value = ''
  activeIssueId.value = null
  closePopover()
  if (!editorInstance) return
  const { state, view } = editorInstance
  const markType = state.schema.marks.grammarIssue
  const tr = state.tr.removeMark(0, state.doc.content.size, markType).setMeta(GRAMMAR_DECORATION_META, true)
  if (tr.docChanged) view.dispatch(tr)
}

function buildIssueExcerpt(text, rawFrom, rawTo) {
  const error = text.slice(rawFrom, rawTo).replace(/\s+/g, ' ')
  const sideBudget = Math.max(18, Math.floor((80 - Math.min(error.length, 32)) / 2))
  let start = Math.max(0, rawFrom - sideBudget)
  let end = Math.min(text.length, rawTo + sideBudget)

  if (start > 0) {
    const firstBoundary = text.slice(start, rawFrom).search(/\s/)
    if (firstBoundary >= 0) start += firstBoundary + 1
  }
  if (end < text.length) {
    const after = text.slice(rawTo, end)
    const lastBoundary = Math.max(after.lastIndexOf(' '), after.lastIndexOf('\n'))
    if (lastBoundary > 0) end = rawTo + lastBoundary
  }

  const beforeValue = text.slice(start, rawFrom).replace(/\s+/g, ' ').trim()
  const afterValue = text.slice(rawTo, end).replace(/\s+/g, ' ').trim()
  const hasSpaceBeforeError = rawFrom > 0 && /\s/.test(text[rawFrom - 1])
  const hasSpaceAfterError = rawTo < text.length && /\s/.test(text[rawTo])

  return {
    before: `${start > 0 ? '…' : ''}${beforeValue}${beforeValue && hasSpaceBeforeError ? ' ' : ''}`,
    error,
    after: `${afterValue && hasSpaceAfterError ? ' ' : ''}${afterValue}${end < text.length ? '…' : ''}`,
  }
}

function rawPositionFromDocument(snapshot, position) {
  const containing = snapshot.segments.find(
    segment => segment.pmFrom <= position && position <= segment.pmTo
  )
  if (containing) {
    return containing.rawFrom + Math.min(
      position - containing.pmFrom,
      containing.rawTo - containing.rawFrom
    )
  }
  const next = snapshot.segments.find(segment => segment.pmFrom > position)
  return next?.rawFrom ?? snapshot.text.length
}

function refreshIssueExcerpts(issues) {
  if (!editor.value) return
  const snapshot = buildDocumentSnapshot(editor.value)
  Object.values(issues).forEach(issue => {
    const rawFrom = rawPositionFromDocument(snapshot, issue._range.from)
    const rawTo = rawPositionFromDocument(snapshot, issue._range.to)
    issue._excerpt = buildIssueExcerpt(snapshot.text, rawFrom, rawTo)
  })
}

function applyIssuesToDocument(issues, snapshot) {
  if (!editor.value) return 0
  Object.keys(issuesMap).forEach(key => delete issuesMap[key])
  activeIssueId.value = null

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
        _highlightRange: highlightRange,
        _excerpt: buildIssueExcerpt(snapshot.text, rawFrom, rawTo)
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

function openIssuesDrawer() {
  activeAnalysisTab.value = 'grammar'
  issuesDrawerOpen.value = true
}

function closeIssuesDrawer() {
  issuesDrawerOpen.value = false
}

function focusIssueFromCard(issue) {
  if (mobileIssuesMode.value || !editor.value || !issue?._highlightRange) return
  const range = issue._highlightRange
  const docSize = editor.value.state.doc.content.size
  if (range.from < 0 || range.to > docSize || range.from >= range.to) return

  activeIssueId.value = issue.id
  closePopover()
  editor.value.commands.setTextSelection(range)
  editor.value.commands.focus()

  requestAnimationFrame(() => {
    const target = [...editor.value.view.dom.querySelectorAll('.grammar-highlight')]
      .find(element => element.dataset.issueId === issue.id)
    target?.scrollIntoView?.({ behavior: 'smooth', block: 'center', inline: 'nearest' })
  })
}

const ANALYSIS_TAB_ORDER = ['grammar', 'quality', 'ai']

function selectAnalysisTab(tab) {
  if (ANALYSIS_TAB_ORDER.includes(tab)) activeAnalysisTab.value = tab
}

function handleAnalysisTabKeydown(event) {
  const currentIndex = ANALYSIS_TAB_ORDER.indexOf(activeAnalysisTab.value)
  let nextIndex = currentIndex

  if (event.key === 'ArrowRight') nextIndex = (currentIndex + 1) % ANALYSIS_TAB_ORDER.length
  else if (event.key === 'ArrowLeft') nextIndex = (currentIndex - 1 + ANALYSIS_TAB_ORDER.length) % ANALYSIS_TAB_ORDER.length
  else if (event.key === 'Home') nextIndex = 0
  else if (event.key === 'End') nextIndex = ANALYSIS_TAB_ORDER.length - 1
  else return

  event.preventDefault()
  activeAnalysisTab.value = ANALYSIS_TAB_ORDER[nextIndex]
  nextTick(() => document.getElementById(`analysis-tab-${activeAnalysisTab.value}`)?.focus())
}

function invalidateQualityAssessment() {
  qualityRequestSequence += 1
  if (qualityDebounceTimer) clearTimeout(qualityDebounceTimer)
  qualityDebounceTimer = null
  if (activeQualityController) activeQualityController.abort()
  activeQualityController = null
  qualityAssessment.value = null
  qualityStatus.value = 'idle'
  qualityError.value = ''
}

function scheduleQualityAssessment(editorInstance) {
  const snapshot = buildDocumentSnapshot(editorInstance)
  if (snapshot.text === lastQualityObservedText) return
  lastQualityObservedText = snapshot.text
  invalidateQualityAssessment()
  if (!canAssessQuality.value) return

  const sequence = qualityRequestSequence
  qualityStatus.value = 'scheduled'
  qualityDebounceTimer = setTimeout(() => {
    qualityDebounceTimer = null
    runQualityAssessment(sequence, snapshot.text)
  }, QUALITY_DEBOUNCE_MS)
}

async function runQualityAssessment(sequence, expectedText) {
  if (!editor.value || sequence !== qualityRequestSequence || !canAssessQuality.value) return
  const snapshot = buildDocumentSnapshot(editor.value)
  if (snapshot.text !== expectedText) return
  const controller = new AbortController()
  activeQualityController = controller
  qualityStatus.value = 'loading'
  qualityAssessment.value = null

  try {
    const response = await grammarApi.assessQuality(snapshot.text, 'en-US', controller.signal)
    if (
      sequence !== qualityRequestSequence ||
      !editor.value ||
      buildDocumentSnapshot(editor.value).text !== snapshot.text
    ) return
    if (!response?.success) throw new Error(response?.error || 'Quality assessment failed.')
    qualityAssessment.value = response
    qualityStatus.value = 'success'
  } catch (error) {
    if (error.isCanceled || error.name === 'CanceledError' || sequence !== qualityRequestSequence) return
    console.error('Failed to assess writing quality:', error)
    qualityStatus.value = 'error'
    qualityError.value = error.message || 'Writing Quality is temporarily unavailable.'
  } finally {
    if (activeQualityController === controller) activeQualityController = null
  }
}

function retryQualityAssessment() {
  if (!editor.value || !canAssessQuality.value) return
  const snapshot = buildDocumentSnapshot(editor.value)
  lastQualityObservedText = snapshot.text
  invalidateQualityAssessment()
  const sequence = qualityRequestSequence
  runQualityAssessment(sequence, snapshot.text)
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
    const response = await grammarApi.checkGrammar(snapshot.text, 'en-US', controller.signal, {
      capture: !!appStore.user && !practiceBaselinePending,
      excludedFingerprints: [...practiceBaselineFingerprints]
    })
    if (
      sequence !== requestSequence ||
      !editor.value ||
      buildDocumentSnapshot(editor.value).text !== snapshot.text
    ) return

    if (!response?.success) throw new Error(response?.error || 'Failed to inspect grammar.')
    const responseIssues = Array.isArray(response.issues) ? response.issues : []
    if (practiceBaselinePending) {
      practiceBaselineFingerprints = new Set(responseIssues.map(issue => issue.practice_fingerprint).filter(Boolean))
      practiceBaselinePending = false
    } else {
      responseIssues.forEach(issue => {
        if (issue.practice_fingerprint) practiceBaselineFingerprints.add(issue.practice_fingerprint)
      })
    }
    const appliedCount = applyIssuesToDocument(
      responseIssues,
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
  refreshIssueExcerpts(issuesMap)
  lastObservedText = buildDocumentSnapshot(editor.value).text
  updateRemainingStatus()
  acceptAllNotice.value = ''
  if (activeIssueId.value === issue.id) activeIssueId.value = null
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
  acceptAllNotice.value = ''
  if (activeIssueId.value === issue.id) activeIssueId.value = null
  closePopover()
}

function issueMatchesDocument(issue, doc) {
  const range = issue._range
  return range && range.from >= 0 && range.to <= doc.content.size && range.from <= range.to &&
    doc.textBetween(range.from, range.to, BLOCK_SEPARATOR) === (issue.original || '')
}

function handleAcceptAll() {
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
    acceptAllNotice.value = `Accepted 0 issues; skipped ${skipped} outdated or conflicting suggestion(s).`
    return
  }

  selected.forEach(issue => recordIssueForPractice(issue))

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
  refreshIssueExcerpts(issuesMap)
  lastObservedText = buildDocumentSnapshot(editor.value).text
  updateRemainingStatus()
  closePopover()
  activeIssueId.value = null
  acceptAllNotice.value = `Accepted ${selected.length} issue(s)${skipped ? `; skipped ${skipped} outdated or conflicting suggestion(s)` : ''}.`
}

// Global click outside listener
const handleDocumentClick = (e) => {
  if (
    toolbarRef.value &&
    !toolbarRef.value.contains(e.target) &&
    !e.target.closest?.('.toolbar-extra-controls')
  ) closeToolbarMenus()
  if (
    popoverState.visible &&
    containerRef.value &&
    !e.target.closest('.suggestion-popover') &&
    !e.target.closest('.grammar-highlight')
  ) {
    closePopover()
  }
}

function handleWindowResize() {
  mobileMorePortal.value = window.innerWidth <= 600
  mobileIssuesMode.value = window.innerWidth <= 700
  if (mobileIssuesMode.value) activeIssueId.value = null
  compactEditor.value = window.innerWidth <= 1024
  if (editor.value) syncToolbarState(editor.value)
  scheduleCommentLayout()
}

watch(() => appStore.user, async (user, previousUser) => {
  if (user && !previousUser && !appStore.pendingAuthAction && !userHasEdited) {
    await restoreAccountSession(user)
  }
  if (!user && previousUser) {
    const guestDraft = loadSavedSession(GUEST_DRAFT_KEY, true)
    applyDocumentSession(guestDraft || {
      title: 'Untitled document',
      doc: createEmptyDocument(),
      comments: []
    }, { dirty: !!guestDraft })
  }
})

onMounted(() => {
  window.addEventListener('click', handleDocumentClick)
  window.addEventListener('resize', handleWindowResize)
  window.addEventListener('pagehide', handlePageHide)
  appStore.setLogoutGuard(confirmUnsaved)
  resizeObserver = new ResizeObserver(scheduleCommentLayout)
  if (paperRef.value) resizeObserver.observe(paperRef.value)
  handleWindowResize()
})

onActivated(() => {
  appStore.setLogoutGuard(confirmUnsaved)
  void restoreAccountSession()
  scheduleCommentLayout()
})

onDeactivated(() => {
  if (saveTimer) clearTimeout(saveTimer)
  if (['unsaved', 'error'].includes(saveStatus.value)) saveSession(editor.value)
  // The confirmation dialog lives inside this cached view, so do not leave an
  // invisible guard active while the user is on Practice.
  appStore.setLogoutGuard(null)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', handleDocumentClick)
  window.removeEventListener('resize', handleWindowResize)
  window.removeEventListener('pagehide', handlePageHide)
  appStore.setLogoutGuard(null)
  resizeObserver?.disconnect()
  if (layoutFrame) cancelAnimationFrame(layoutFrame)
  if (saveTimer) clearTimeout(saveTimer)
  if (['unsaved', 'error'].includes(saveStatus.value)) saveSession(editor.value)
  cancelPopoverClose()
  if (copyResetTimer) clearTimeout(copyResetTimer)
  if (debounceTimer) clearTimeout(debounceTimer)
  if (qualityDebounceTimer) clearTimeout(qualityDebounceTimer)
  if (autocompleteTimer) clearTimeout(autocompleteTimer)
  if (activeController) activeController.abort()
  if (activeQualityController) activeQualityController.abort()
  if (activeAiDetectionController) activeAiDetectionController.abort()
  if (activeAutocompleteController) activeAutocompleteController.abort()
  if (activeRewriteController) activeRewriteController.abort()
  if (decision.resolve) finishDecision(false)
  if (editor.value) {
    editor.value.destroy()
  }
})
</script>

<style>
/* Document & Typography Styling */
.editor-container {
  --editor-sticky-bar-space: 70px;
  position: relative;
  width: 100%;
  max-width: 1320px;
  margin: 0 auto;
}

.editor-action-bar {
  position: sticky;
  top: calc(var(--app-header-height, 75px) + 10px);
  z-index: 90;
  display: grid;
  grid-template-columns: minmax(250px, 1fr) minmax(0, auto) minmax(220px, 1fr);
  align-items: center;
  margin-bottom: 16px;
  padding: 10px 18px;
  background: var(--surface);
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
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
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

.check-again-button svg {
  width: 16px;
  height: 16px;
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

.more-button__icon { display: none; width: 18px; height: 18px; }

.toolbar-popover {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 60;
  padding: 6px;
  border: 1px solid #ded5f1;
  border-radius: 13px;
  background: var(--surface);
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

.grammar-issues-button {
  position: relative;
  display: none;
  flex: 0 0 34px;
}

.grammar-issues-button svg {
  width: 17px;
  height: 17px;
}

.grammar-issues-button.has-issues { color: #6d28d9; }

.grammar-issues-count {
  position: absolute;
  top: -6px;
  right: -6px;
  min-width: 16px;
  height: 16px;
  box-sizing: border-box;
  padding: 0 4px;
  border: 2px solid var(--surface);
  border-radius: 999px;
  background: #dc2626;
  color: #fff;
  font-size: 9px;
  font-weight: 800;
  line-height: 12px;
}

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

.status-label {
  line-height: 1;
  transform: translateY(1px);
}

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
.dialog-button--danger-solid { border-color: #b91c1c; background: #b91c1c; color: #fff; }
.dialog-button--danger-solid:hover:not(:disabled) { border-color: #991b1b; background: #991b1b; }
.dialog-button:disabled { opacity: .58; cursor: wait; }
.dialog-button--quiet { color: var(--text); }
.dialog-error { margin: -10px 0 18px !important; color: #b91c1c !important; font-size: 13px !important; }

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
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  background: var(--surface);
  border-radius: 16px;
  box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.03);
  padding: 0;
  min-height: max(80vh, var(--comment-rail-height));
  box-sizing: border-box;
  text-align: left;
}

.editor-paper:has(.comment-rail) .ProseMirror {
  padding-right: 260px;
}

.comment-highlight {
  background: rgba(250, 204, 21, 0.25);
  box-shadow: inset 0 -2px #eab308;
  border-radius: 2px;
}

.comment-marker {
  display: none;
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

.comment-bubble button:hover,
.comment-bubble button:focus-visible {
  background: rgba(255, 255, 255, 0.12);
  border-radius: 6px;
  outline: none;
}

.comment-bubble-divider {
  width: 1px;
  margin: 4px 2px;
  background: rgba(255, 255, 255, 0.22);
}

.rewrite-popover {
  position: absolute;
  z-index: 75;
  width: 380px;
  max-width: calc(100% - 24px);
  box-sizing: border-box;
  padding: 15px;
  border: 1px solid #ded7e9;
  border-radius: 14px;
  background: var(--surface);
  box-shadow: 0 18px 45px rgba(42, 25, 65, 0.22);
  color: var(--text-h);
  text-align: left;
}

.rewrite-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.rewrite-header span {
  color: #7c3aed;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.rewrite-header h3 {
  margin: 2px 0 0;
  color: var(--text-h);
  font-size: 16px;
}

.rewrite-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: 0;
  border-radius: 7px;
  background: transparent;
  color: var(--text-muted);
  font-size: 22px;
  cursor: pointer;
}

.rewrite-close:hover { background: rgba(124, 58, 237, .08); }

.rewrite-results {
  display: grid;
  gap: 8px;
  margin-top: 12px;
  max-height: 290px;
  overflow-y: auto;
}

.rewrite-result {
  display: grid;
  grid-template-columns: 16px minmax(0, 1fr);
  align-items: start;
  gap: 9px;
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd6e8;
  border-radius: 9px;
  background: var(--surface);
  color: var(--text-h);
  font: inherit;
  font-size: 13px;
  line-height: 1.45;
  text-align: left;
  cursor: pointer;
}

.rewrite-result:hover { border-color: #a78bfa; }
.rewrite-result.is-selected { border-color: #7c3aed; background: #f5f3ff; box-shadow: 0 0 0 1px #7c3aed; }

.rewrite-radio {
  width: 14px;
  height: 14px;
  margin-top: 2px;
  box-sizing: border-box;
  border: 2px solid #b6acc7;
  border-radius: 50%;
}

.rewrite-result.is-selected .rewrite-radio {
  border: 4px solid #7c3aed;
  background: #fff;
}

.rewrite-message {
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 72px;
  margin: 0;
  color: var(--text-muted);
  font-size: 13px;
}

.rewrite-message--error {
  display: block;
  min-height: 0;
  padding: 10px;
  border-radius: 8px;
  background: #fef2f2;
  color: #b91c1c;
}

.rewrite-message--error p { margin: 0 0 8px; }
.rewrite-message--error button {
  border: 0;
  background: transparent;
  color: #7c3aed;
  padding: 0;
  font-weight: 700;
  cursor: pointer;
}

.rewrite-spinner {
  width: 17px;
  height: 17px;
  border: 2px solid #ddd6fe;
  border-top-color: #7c3aed;
  border-radius: 50%;
  animation: rewrite-spin .8s linear infinite;
}

@keyframes rewrite-spin { to { transform: rotate(360deg); } }

.rewrite-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 13px;
  padding-top: 12px;
  border-top: 1px solid #eee9f4;
}

.rewrite-actions button {
  padding: 7px 12px;
  border: 1px solid #d7cee6;
  border-radius: 7px;
  background: var(--surface);
  color: #5b21b6;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.rewrite-actions .rewrite-replace { border-color: #6d28d9; background: #6d28d9; color: #fff; }
.rewrite-actions button:disabled { opacity: .5; cursor: not-allowed; }

.comment-composer {
  position: absolute;
  z-index: 70;
  width: 280px;
  box-sizing: border-box;
  padding: 12px;
  border: 1px solid #ded7e9;
  border-radius: 12px;
  background: var(--surface);
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
  border: 0;
  border-radius: 7px;
  outline: 0;
  padding: 8px;
  font: inherit;
  font-size: 13px;
  color: #1f2937;
  background: var(--bg);
}

.comment-composer textarea:focus {
  background: #fffaf2;
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
  background: var(--surface);
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
  background: var(--surface);
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

.comment-reader-overlay {
  position: fixed;
  inset: 0;
  z-index: 240;
  display: grid;
  place-items: center;
  box-sizing: border-box;
  padding: 18px;
  background: rgba(15, 11, 24, .58);
  backdrop-filter: blur(5px);
}

.comment-reader-dialog {
  width: min(420px, 100%);
  max-height: min(78dvh, 620px);
  box-sizing: border-box;
  overflow-y: auto;
  padding: 22px;
  border: 1px solid var(--border);
  border-radius: 18px;
  background: var(--surface);
  color: var(--text-h);
  box-shadow: 0 24px 60px rgba(25, 18, 42, .32);
}

.comment-reader-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}

.comment-reader-header h2 {
  margin: 0;
  font-size: 20px;
}

.comment-reader-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 34px;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: var(--text);
  font-size: 25px;
  cursor: pointer;
}

.comment-reader-close:hover { background: var(--accent-bg); color: var(--brand-color); }

.comment-reader-dialog blockquote {
  margin: 18px 0 14px;
  padding: 10px 12px;
  border-left: 3px solid #8b5cf6;
  border-radius: 0 9px 9px 0;
  background: var(--accent-bg);
  color: var(--text);
  font-size: 13px;
  line-height: 1.5;
}

.comment-reader-note {
  margin: 0 0 12px;
  color: var(--text-h);
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.comment-reader-dialog time { color: var(--text); font-size: 11px; }

.comment-reader-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 20px;
}

.comment-reader-enter-active,
.comment-reader-leave-active { transition: opacity 180ms ease; }
.comment-reader-enter-active .comment-reader-dialog,
.comment-reader-leave-active .comment-reader-dialog { transition: transform 220ms cubic-bezier(.22, 1, .36, 1), opacity 180ms ease; }
.comment-reader-enter-from,
.comment-reader-leave-to { opacity: 0; }
.comment-reader-enter-from .comment-reader-dialog,
.comment-reader-leave-to .comment-reader-dialog { opacity: 0; transform: translateY(12px) scale(.98); }

:root[data-theme='dark'] .comment-card,
:root[data-theme='dark'] .comment-composer,
:root[data-theme='dark'] .rewrite-popover {
  background: #302b3b;
  border-color: #574b68;
}

:root[data-theme='dark'] .rewrite-result {
  border-color: #574b68;
  background: #302b3b;
  color: #f3eff8;
}

:root[data-theme='dark'] .rewrite-result.is-selected {
  border-color: #a78bfa;
  background: #3b3152;
}

:root[data-theme='dark'] .rewrite-message--error { background: #482a34; color: #fecaca; }
:root[data-theme='dark'] .rewrite-actions { border-top-color: #574b68; }
:root[data-theme='dark'] .rewrite-actions .rewrite-cancel {
  border-color: #8b7aa3;
  background: #41384f;
  color: #f3eff8;
}
:root[data-theme='dark'] .rewrite-actions .rewrite-cancel:hover,
:root[data-theme='dark'] .rewrite-actions .rewrite-cancel:focus-visible {
  border-color: #c4b5fd;
  background: #514462;
  color: #fff;
  outline: 2px solid rgba(196, 181, 253, .45);
  outline-offset: 2px;
}

:root[data-theme='dark'] .comment-card p,
:root[data-theme='dark'] .comment-composer label {
  color: #f3eff8;
}

:root[data-theme='dark'] .comment-composer textarea {
  border: 0;
  outline: 0;
  background: #3b3548;
  color: #f3eff8;
  caret-color: #f3eff8;
}

:root[data-theme='dark'] .comment-composer textarea::placeholder {
  color: #b8afc5;
  opacity: 1;
}

:root[data-theme='dark'] .comment-composer textarea:focus {
  background: #463e54;
}

:root[data-theme='dark'] .comment-composer-actions button:first-child {
  border-color: transparent;
  background: #41384f;
  color: #f3eff8;
}

:root[data-theme='dark'] .comment-composer-actions button:first-child:hover {
  background: #4d435e;
  color: #fff;
}

:root[data-theme='dark'] .comment-card-actions button {
  border-color: #8b5cf6;
  background: #302b3b;
  color: #ddd6fe;
}

:root[data-theme='dark'] .comment-card-actions button:hover,
:root[data-theme='dark'] .comment-card-actions button:focus-visible {
  background: #44385c;
  color: #fff;
}

:root[data-theme='dark'] .comment-card blockquote,
:root[data-theme='dark'] .comment-card time {
  color: #d5b8e9;
}

:root[data-theme='dark'] .comment-highlight {
  background: rgba(250, 204, 21, 0.18);
}

:root[data-theme='dark'] .comment-marker {
  border-color: #6d5e91;
  background: #38305a;
  box-shadow: 0 2px 8px rgba(0, 0, 0, .28);
  color: #ddd6fe;
}

:root[data-theme='dark'] .comment-marker:hover,
:root[data-theme='dark'] .comment-marker:focus-visible {
  border-color: #8b7ab8;
  background: #493d70;
  color: #f5f3ff;
}

.issues-sidebar {
  display: flex;
  flex-direction: column;
  width: 360px;
  flex: 0 0 360px;
  max-height: calc(100vh - 130px);
  overflow: hidden;
  box-sizing: border-box;
  padding: 20px 18px;
  border-radius: 16px;
  background: var(--surface);
  box-shadow: 0 4px 20px rgba(56, 34, 77, 0.09);
  text-align: left;
  position: sticky;
  top: calc(var(--app-header-height, 75px) + var(--editor-sticky-bar-space));
}

.issues-overlay,
.issues-drawer-close {
  display: none;
}

.issues-drawer-topbar {
  display: none;
}

.analysis-tabs {
  display: none;
}

.analysis-tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  border-radius: 999px;
  background: #dc2626;
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  line-height: 1;
}

:root[data-theme='dark'] .analysis-tab-count {
  background: #ede9fe;
  color: #6d28d9;
}

.grammar-panel {
  width: 100%;
  box-sizing: border-box;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
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

.accept-all-button {
  flex: 0 0 auto;
  min-height: 34px;
  margin: 0;
  padding: 7px 11px;
  border: 0;
  border-radius: 8px;
  background: #5b21b6;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.accept-all-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.accept-all-notice, .empty-issues {
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

@media (min-width: 901px) {
  .analysis-tabs {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    flex: 0 0 auto;
    gap: 4px;
    margin: -4px -4px 14px;
    padding: 4px;
    border: 1px solid var(--border);
    border-radius: 11px;
    background: var(--accent-bg);
  }

  .analysis-tabs button {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    min-width: 0;
    min-height: 38px;
    padding: 7px 5px;
    border: 0;
    border-radius: 8px;
    background: transparent;
    color: var(--text-muted);
    font: inherit;
    font-size: 11px;
    font-weight: 800;
    line-height: 1.15;
    cursor: pointer;
  }

  .analysis-tabs button:hover {
    background: var(--accent-bg);
    color: var(--text-h);
  }

  .analysis-tabs button[aria-selected='true'] {
    background: var(--surface);
    box-shadow: 0 1px 5px rgba(56, 34, 77, .12);
    color: var(--brand-color);
  }

  .analysis-tabs button:focus-visible {
    outline: 2px solid #8b5cf6;
    outline-offset: 1px;
  }

  .analysis-tab-panel {
    display: none;
  }

  .analysis-tab-panel.is-active {
    display: block;
    flex: 1 1 auto;
    min-height: 0;
    margin-bottom: 0;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-width: thin;
  }

  .grammar-panel {
    padding-right: 4px;
  }

  .grammar-panel.is-active {
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .grammar-panel .sidebar-header,
  .grammar-panel .accept-all-button,
  .grammar-panel .accept-all-notice,
  .grammar-panel .empty-issues {
    flex: 0 0 auto;
  }

  .grammar-panel .issue-cards {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    padding-right: 4px;
  }

  :root[data-theme='dark'] .analysis-tabs button[aria-selected='true'] {
    box-shadow: 0 1px 6px rgba(0, 0, 0, .28);
  }
}

.issue-card {
  border: 1px solid #e9e5ef;
  border-radius: 10px;
  padding: 14px;
  background: var(--surface);
  transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}

.issue-card.is-locatable {
  cursor: pointer;
}

.issue-card.is-locatable:hover {
  border-color: #c4b5fd;
  box-shadow: 0 7px 18px rgba(91, 33, 182, .09);
}

.issue-card.is-locatable:focus-visible,
.issue-card.is-active {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, .16);
  outline: none;
}

.issue-card-category {
  color: #7c3aed;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.issue-card-top {
  margin-bottom: 9px;
}

.issue-card-correction {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 7px;
  margin-bottom: 10px;
  color: #475569;
  font-size: 12px;
  line-height: 1.5;
}

.issue-card-context {
  min-width: 0;
  overflow-wrap: anywhere;
}

.issue-card-error {
  border-radius: 4px;
  padding: 1px 3px;
  background: #fee2e2;
  color: #b91c1c;
  font-weight: 800;
  text-decoration: underline solid #ef4444 1.5px;
  text-underline-offset: 2px;
}

.issue-card-arrow {
  color: #7c3aed;
  font-size: 15px;
  font-weight: 800;
}

.issue-card-suggestion {
  max-width: 110px;
  overflow: hidden;
  padding: 3px 7px;
  border-radius: 6px;
  background: #dcfce7;
  color: #047857;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.issue-card-explanation {
  color: #475569;
  font-size: 13px;
  line-height: 1.5;
  margin: 0 0 9px;
  overflow-wrap: anywhere;
}

.issue-card-actions {
  display: flex;
  flex-wrap: wrap;
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
  background: var(--surface);
  color: #475569;
}

.ai-detector-panel {
  flex: 0 0 auto;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 16px;
  overflow: hidden;
  border: 1px solid #d8d7f2;
  border-radius: 14px;
  background: var(--surface);
}
.ai-detector-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 13px 14px; border-bottom: 1px solid #e7e5f4; }
.ai-detector-header > div { display: flex; align-items: baseline; gap: 8px; }
.ai-detector-header h2 { margin: 0; color: var(--text-h); font-size: 15px; }
.ai-detector-header span { color: #7c3aed; font-size: 12px; font-weight: 800; }
.ai-detector-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 30px;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
}
.ai-detector-toggle svg { width: 16px; height: 16px; transition: transform 180ms ease; }
.ai-detector-panel:not(.is-collapsed) .ai-detector-toggle svg { transform: rotate(180deg); }
.ai-detector-panel.is-collapsed .ai-detector-header { border-bottom-color: transparent; }
.ai-detector-content { display: grid; gap: 11px; padding: 14px; }
.ai-detector-content > p { margin: 0; color: var(--text); font-size: 12px; line-height: 1.5; }
.ai-analyze-button { width: 100%; min-height: 38px; border: 0; border-radius: 9px; background: #6d28d9; color: #fff; font-weight: 800; cursor: pointer; }
.ai-analyze-button:hover:not(:disabled) { background: #5b21b6; }
.ai-analyze-button:disabled { opacity: .5; cursor: not-allowed; }
.ai-detector-scope-hint,
.ai-detector-scope-result { margin: 0; color: var(--brand-color); font-size: 12px; font-weight: 700; line-height: 1.45; }
.ai-detector-hint { margin: 0; color: var(--text-muted); font-size: 12px; line-height: 1.45; }
.ai-detector-hint--error { color: #b91c1c; }
.ai-detector-message { display: flex; align-items: center; gap: 9px; margin: 0; padding: 9px; border-radius: 8px; background: var(--accent-bg); color: var(--text); font-size: 12px; }
.ai-detector-message--error { background: #fef2f2; color: #b91c1c; }
.ai-detector-result { display: grid; gap: 12px; }
.ai-confidence-warning { margin: 0; padding: 9px 10px; border-radius: 8px; background: #fff7ed; color: #9a3412; font-size: 11px; line-height: 1.45; }
.ai-verdict { display: flex; align-items: center; gap: 12px; }
.ai-score-ring {
  --ai-score: 0;
  display: grid;
  place-items: center;
  flex: 0 0 64px;
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: radial-gradient(circle at center, var(--surface) 53%, transparent 55%), conic-gradient(#7c3aed calc(var(--ai-score) * 1%), #e7e5f4 0);
}
.ai-score-ring strong { color: #6d28d9; font-size: 16px; }
.ai-verdict > div:last-child { display: grid; gap: 4px; min-width: 0; }
.ai-verdict > div:last-child > strong { color: var(--text-h); font-size: 13px; }
.ai-verdict > div:last-child > span { color: var(--text); font-size: 11px; line-height: 1.35; }
.ai-segment-list { display: grid; gap: 7px; }
.ai-segment-list h3 { margin: 0 0 2px; color: var(--text-h); font-size: 12px; }
.ai-segment-list button {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  align-items: start;
  gap: 7px;
  width: 100%;
  padding: 8px;
  border: 1px solid #e0dcf0;
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.ai-segment-list button:hover { border-color: #a78bfa; background: var(--accent-bg); }
.ai-segment-list button > span { color: #7c3aed; font-size: 10px; font-weight: 800; }
.ai-segment-list q { display: -webkit-box; overflow: hidden; font-size: 11px; line-height: 1.4; -webkit-box-orient: vertical; -webkit-line-clamp: 2; }
.ai-detector-disclaimer { margin: 0; color: var(--text-muted); font-size: 10px; line-height: 1.4; }

.quality-panel {
  flex: 0 0 auto;
  width: 100%;
  box-sizing: border-box;
  margin-bottom: 16px;
  overflow: hidden;
  border: 1px solid #dfd2ef;
  border-radius: 14px;
  background: var(--surface);
}

.quality-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 13px;
  border-bottom: 1px solid #e7dff0;
}

.quality-panel-header > div {
  display: flex;
  align-items: baseline;
  min-width: 0;
  gap: 8px;
}

.quality-panel-header h2 {
  margin: 0;
  color: var(--text-h);
  font-size: 14px;
  font-weight: 800;
}

.quality-panel-header span {
  color: var(--brand-color);
  font-size: 11px;
  font-weight: 800;
}

.quality-panel-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 30px;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
}

.quality-panel-toggle svg {
  width: 16px;
  height: 16px;
  transition: transform 180ms ease;
}

.quality-panel:not(.is-collapsed) .quality-panel-toggle svg { transform: rotate(180deg); }
.quality-panel.is-collapsed .quality-panel-header { border-bottom-color: transparent; }

.quality-card {
  --quality-ring: #7c3aed;
  --quality-ring-track: #e7dcf5;
  --quality-inner: #fffaf2;
  --quality-label: #5f5669;
  --quality-track: #ded7e7;
  --quality-grammar: #8b5cf6;
  --quality-clarity: #5278b8;
  --quality-coherence: #d97745;
  --quality-vocabulary: #bd5f8d;
  position: relative;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 14px;
  flex: 0 0 auto;
  width: 100%;
  aspect-ratio: 1;
  box-sizing: border-box;
  padding: 18px;
  overflow: hidden;
  border: 0;
  border-radius: 0;
  background: linear-gradient(145deg, #fcf8ff, #f3ebfa);
}

.quality-state {
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: stretch;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  color: var(--quality-label);
  text-align: center;
}

.quality-state p {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
}

.quality-state--error {
  color: #b91c1c;
}

.quality-state button {
  min-height: 36px;
  padding: 8px 16px;
  border: 0;
  border-radius: 8px;
  background: #6d28d9;
  color: #fff;
  font: inherit;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
}

.quality-state button:hover {
  background: #5b21b6;
}

.quality-chart {
  --quality-score: 0;
  position: relative;
  align-self: center;
  justify-self: center;
  width: 112px;
  height: 112px;
  border-radius: 50%;
  background: conic-gradient(var(--quality-ring) calc(var(--quality-score) * 1%), var(--quality-ring-track) 0);
}

.quality-chart::after {
  content: '';
  position: absolute;
  inset: 12px;
  border-radius: 50%;
  background: var(--quality-inner);
}

.quality-chart__center {
  position: absolute;
  inset: 0;
  z-index: 1;
  display: flex;
  align-items: baseline;
  justify-content: center;
  align-content: center;
  flex-wrap: wrap;
  color: var(--quality-ring);
}

.quality-chart__center strong { font-size: 36px; line-height: 1; }
.quality-chart__center span { font-size: 12px; font-weight: 700; }
.quality-bars { display: grid; gap: 9px; }
.quality-bar-row > div:first-child { display: flex; justify-content: space-between; color: var(--quality-label); font-size: 11px; font-weight: 700; }
.quality-bar-row--grammar { --quality-bar-color: var(--quality-grammar); }
.quality-bar-row--clarity { --quality-bar-color: var(--quality-clarity); }
.quality-bar-row--coherence { --quality-bar-color: var(--quality-coherence); }
.quality-bar-row--vocabulary { --quality-bar-color: var(--quality-vocabulary); }
.quality-bar-row strong { color: var(--quality-bar-color); }
.quality-meter { height: 5px; margin-top: 7px; overflow: hidden; border-radius: 999px; background: var(--quality-track); }
.quality-meter span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--quality-bar-color);
  transition: width 720ms cubic-bezier(.22, 1, .36, 1);
}

:root[data-theme='dark'] .quality-card {
  --quality-ring: #c4b5fd;
  --quality-ring-track: #4a405b;
  --quality-inner: #292733;
  --quality-label: #c9c3d2;
  --quality-track: #454151;
  --quality-grammar: #c4b5fd;
  --quality-clarity: #82b8e8;
  --quality-coherence: #f0a06f;
  --quality-vocabulary: #e694bb;
  background: linear-gradient(145deg, #302a3c, #292631);
}

:root[data-theme='dark'] .quality-state--error { color: #fecaca; }

:root[data-theme='dark'] .quality-panel {
  border-color: #4b425c;
  background: var(--surface);
}

:root[data-theme='dark'] .quality-panel-header { border-bottom-color: #4b425c; }
:root[data-theme='dark'] .ai-detector-panel { border-color: #4b425c; }
:root[data-theme='dark'] .ai-detector-header { border-bottom-color: #4b425c; }
:root[data-theme='dark'] .ai-detector-message--error { background: #482a34; color: #fecaca; }
:root[data-theme='dark'] .ai-confidence-warning { background: #4a3427; color: #fed7aa; }
:root[data-theme='dark'] .ai-score-ring {
  background: radial-gradient(circle at center, var(--surface) 53%, transparent 55%), conic-gradient(#c4b5fd calc(var(--ai-score) * 1%), #4a405b 0);
}
:root[data-theme='dark'] .ai-score-ring strong,
:root[data-theme='dark'] .ai-detector-header span,
:root[data-theme='dark'] .ai-segment-list button > span { color: #c4b5fd; }
:root[data-theme='dark'] .ai-segment-list button { border-color: #574b68; }

@media (min-width: 901px) {
  .quality-panel-toggle,
  .ai-detector-toggle {
    display: none;
  }

  .quality-panel.is-collapsed .quality-panel-header {
    border-bottom-color: #e7dff0;
  }

  .ai-detector-panel.is-collapsed .ai-detector-header {
    border-bottom-color: #e7e5f4;
  }

  :root[data-theme='dark'] .quality-panel.is-collapsed .quality-panel-header,
  :root[data-theme='dark'] .ai-detector-panel.is-collapsed .ai-detector-header {
    border-bottom-color: #4b425c;
  }
}

@media (max-width: 700px) {
  .quality-card { gap: 10px; padding: 18px 16px; }
  .quality-chart { width: 96px; height: 96px; }
  .quality-chart::after { inset: 10px; }
  .quality-chart__center strong { font-size: 32px; }
  .quality-bars { gap: 6px; }
  .quality-meter { margin-top: 4px; }
}

@media (prefers-reduced-motion: reduce) {
  .quality-meter span { transition: none; }
}

@media (max-width: 900px) {
  .editor-workspace {
    flex-direction: column;
    gap: 14px;
  }
  .editor-paper, .issues-sidebar {
    width: 100%;
    flex: 0 0 auto;
  }
  .issues-sidebar {
    position: static;
    max-height: calc(100vh - 32px);
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
  .quality-panel.is-collapsed .quality-card,
  .ai-detector-panel.is-collapsed .ai-detector-content { display: none; }
  .issue-cards { overflow: visible; padding-right: 0; }
}

@media (max-width: 1200px) {
  .editor-container { --editor-sticky-bar-space: 112px; }
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
  .toolbar-extras.is-open .toolbar-extra-controls,
  .toolbar-extra-controls.is-mobile-open {
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
    background: var(--surface);
    box-shadow: 0 16px 38px rgba(48, 31, 82, 0.18), 0 3px 10px rgba(48, 31, 82, 0.08);
  }
  .toolbar-extra-controls > .toolbar-divider {
    display: none;
  }
}

@media (max-width: 600px) {
  .editor-action-bar {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 9px;
    margin-bottom: 10px;
    padding: 10px;
  }
  .doc-status {
    grid-column: 1;
    grid-row: 1;
    min-width: 0;
    width: 100%;
  }
  .grammar-status { flex: 1; overflow: hidden; }
  .status-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .editor-actions {
    grid-column: 2;
    grid-row: 1;
    display: flex;
    justify-self: end;
    gap: 6px;
    width: auto;
  }
  .save-button, .check-again-button { flex: 0 0 32px; justify-content: center; width: 32px; height: 32px; padding: 0; }
  .save-button__label, .check-again-button__label, .more-button__label { display: none; }
  .more-button { justify-content: center; width: 34px; padding: 0; }
  .more-button__icon { display: block; }
  .format-toolbar > .toolbar-divider { display: none; }
  .copy-button { order: 10; }
  .toolbar-extras { order: 11; }
  .format-toolbar {
    grid-column: 1 / -1;
    grid-row: 2;
    justify-content: flex-start;
    width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
    flex-wrap: nowrap;
    box-sizing: border-box;
    padding: 2px 0 6px;
    scrollbar-width: thin;
    overscroll-behavior-x: contain;
    -webkit-overflow-scrolling: touch;
  }
  .toolbar-extras.is-open .toolbar-extra-controls,
  .toolbar-extra-controls.is-mobile-open {
    position: fixed;
    top: auto;
    right: 12px;
    bottom: calc(12px + env(safe-area-inset-bottom));
    left: 12px;
    z-index: 260;
    max-width: none;
    flex-wrap: wrap;
    justify-content: center;
  }
  .toolbar-extra-controls.is-mobile-open .toolbar-popover {
    top: auto;
    right: 0;
    bottom: calc(100% + 8px);
  }
  .document-heading { flex-wrap: wrap; }
  .decision-actions { align-items: stretch; flex-direction: column-reverse; }
  .dialog-button { width: 100%; }
  .editor-paper .tiptap-content .ProseMirror {
    padding: 16px 14px 28px;
  }
}

@media (max-width: 700px) {
  .documents-drawer {
    top: var(--app-header-height, 54px);
    height: calc(100% - var(--app-header-height, 54px));
  }
  .grammar-issues-button {
    display: inline-flex;
  }
  .issues-overlay {
    position: fixed;
    inset: 0;
    z-index: 140;
    display: block;
    background: rgba(15, 11, 24, .48);
    backdrop-filter: blur(3px);
  }
  .issues-overlay-enter-active,
  .issues-overlay-leave-active {
    transition: background-color 220ms ease, backdrop-filter 220ms ease;
  }
  .issues-overlay-enter-from,
  .issues-overlay-leave-to {
    background-color: rgba(15, 11, 24, 0);
    backdrop-filter: blur(0);
  }
  .issues-sidebar {
    position: fixed;
    top: var(--app-header-height, 54px);
    left: 0;
    z-index: 141;
    width: min(360px, 88vw);
    height: calc(100dvh - var(--app-header-height, 54px));
    max-height: none;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior: contain;
    padding: 18px;
    border-radius: 0;
    box-shadow: 18px 0 50px rgba(25, 18, 42, .24);
    pointer-events: none;
    opacity: .92;
    transform: translateX(-100%);
    transition: transform 280ms cubic-bezier(.22, 1, .36, 1), opacity 220ms ease;
    will-change: transform, opacity;
  }
  .issues-sidebar.is-open {
    pointer-events: auto;
    opacity: 1;
    transform: translateX(0);
  }
  .issues-drawer-topbar {
    position: sticky;
    top: -14px;
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex: 0 0 auto;
    margin: -14px -14px 14px;
    padding: 12px 14px;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-h);
  }
  .issues-drawer-topbar strong {
    font-size: 14px;
    font-weight: 800;
  }
  .issues-drawer-close {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    border: 1px solid var(--border);
    border-radius: 9px;
    background: var(--surface);
    color: var(--text-h);
    font-size: 22px;
    line-height: 1;
    cursor: pointer;
  }
  .editor-paper {
    min-height: 100dvh;
  }
  .editor-paper .tiptap-content { min-height: 100dvh; }
  .issues-sidebar { max-height: none; padding: 14px; }
  .issues-sidebar .quality-card {
    display: grid;
    flex: 0 0 auto;
    width: 100%;
  }
  .issue-cards { overflow: visible; padding-right: 0; }
  .editor-paper:has(.comment-rail) .ProseMirror {
    padding-right: 14px;
  }
  .comment-rail {
    display: none;
  }
  .comment-marker {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 25px;
    height: 25px;
    margin: 0 3px;
    padding: 0;
    border: 1px solid #c4b5fd;
    border-radius: 999px;
    background: #ede9fe;
    color: #6d28d9;
    vertical-align: middle;
    transform: translateY(-10px);
    cursor: pointer;
  }
  .comment-marker svg {
    width: 14px;
    height: 14px;
  }
  .comment-composer {
    position: fixed;
    top: 50% !important;
    left: 50% !important;
    z-index: 241;
    width: min(320px, calc(100vw - 24px));
    max-width: none;
    transform: translate(-50%, -50%);
  }
  .rewrite-popover {
    position: fixed;
    top: 50% !important;
    left: 50% !important;
    z-index: 241;
    width: min(380px, calc(100vw - 24px));
    max-width: none;
    transform: translate(-50%, -50%);
  }
}

@media (max-width: 700px) and (prefers-reduced-motion: reduce) {
  .issues-sidebar,
  .issues-overlay-enter-active,
  .issues-overlay-leave-active,
  .comment-reader-enter-active,
  .comment-reader-leave-active,
  .comment-reader-enter-active .comment-reader-dialog,
  .comment-reader-leave-active .comment-reader-dialog { transition-duration: 1ms; }
}

.tiptap-content {
  display: flex;
  flex: 1;
  min-height: max(80vh, var(--comment-rail-height));
  box-sizing: border-box;
  color: #1f2937;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 18px;
  line-height: 1.75;
}

.tiptap-content .ProseMirror {
  flex: 1;
  min-width: 0;
  box-sizing: border-box;
  padding: 24px;
  cursor: text;
}

.tiptap-content .ProseMirror p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  float: left;
  height: 0;
  color: #94a3b8;
  pointer-events: none;
}

.autocomplete-ghost {
  color: #94a3b8;
  pointer-events: none;
  user-select: none;
  white-space: pre-wrap;
}

.autocomplete-ghost__hint {
  display: inline-flex;
  margin-left: 8px;
  padding: 1px 5px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
  background: #f8fafc;
  color: #64748b;
  font: 600 10px/1.4 Arial, sans-serif;
  vertical-align: middle;
}

:root[data-theme='dark'] .autocomplete-ghost {
  color: #7f8799;
}

:root[data-theme='dark'] .autocomplete-ghost__hint {
  border-color: #475569;
  background: #1e293b;
  color: #94a3b8;
}

:root[data-theme='dark'] .tiptap-content .ProseMirror p.is-editor-empty:first-child::before {
  color: #7f8799;
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
  font-size: inherit;
  margin-bottom: 1.5rem;
  color: #334155;
}

@media (max-width: 1024px) {
  .tiptap-content { font-size: 16px; }
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
.ai-detected-passage {
  border-radius: 3px;
  background: rgba(139, 92, 246, .18);
  box-shadow: inset 0 -2px rgba(124, 58, 237, .45);
}

:root[data-theme='dark'] .ai-detected-passage {
  background: rgba(196, 181, 253, .2);
  box-shadow: inset 0 -2px rgba(196, 181, 253, .6);
}

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
