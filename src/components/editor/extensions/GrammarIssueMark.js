import { Mark, mergeAttributes } from '@tiptap/core'

/**
 * GrammarIssueMark
 * Custom inline mark for highlighted grammar, clarity, and style issues.
 */
export const GrammarIssueMark = Mark.create({
  name: 'grammarIssue',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      issueId: {
        default: null,
        parseHTML: element => element.getAttribute('data-issue-id'),
        renderHTML: attributes => {
          if (!attributes.issueId) {
            return {}
          }
          return {
            'data-issue-id': attributes.issueId,
          }
        },
      },
      issueType: {
        default: 'grammar', // 'grammar' | 'clarity' | 'engagement'
        parseHTML: element => element.getAttribute('data-issue-type'),
        renderHTML: attributes => {
          return {
            'data-issue-type': attributes.issueType || 'grammar',
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-issue-id]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const issueType = HTMLAttributes['data-issue-type'] || 'grammar'
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: `grammar-highlight grammar-highlight--${issueType}`,
        tabindex: '0',
        role: 'button',
        'aria-label': 'Show grammar suggestion',
      }),
      0,
    ]
  },
})
