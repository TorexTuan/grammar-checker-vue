import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export const COMMENT_REFRESH_META = 'refreshComments'

function createCommentMarker(commentId) {
  const button = document.createElement('button')
  button.type = 'button'
  button.className = 'comment-marker'
  button.setAttribute('data-comment-id', commentId)
  button.setAttribute('aria-label', 'Open comment')
  button.setAttribute('title', 'Open comment')
  button.setAttribute('contenteditable', 'false')

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
  svg.setAttribute('viewBox', '0 0 24 24')
  svg.setAttribute('fill', 'none')
  svg.setAttribute('stroke', 'currentColor')
  svg.setAttribute('stroke-width', '2')
  svg.setAttribute('stroke-linecap', 'round')
  svg.setAttribute('stroke-linejoin', 'round')
  svg.setAttribute('aria-hidden', 'true')

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  path.setAttribute('d', 'M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z')
  svg.appendChild(path)
  button.appendChild(svg)
  return button
}

export function createCommentDecorations(getComments) {
  return Extension.create({
    name: 'commentDecorations',
    addProseMirrorPlugins() {
      return [new Plugin({
        key: new PluginKey('commentDecorations'),
        props: {
          decorations(state) {
            const decorations = []
            for (const comment of getComments()) {
              if (comment.unlinked || comment.from < 0 || comment.from >= comment.to ||
                  comment.to > state.doc.content.size) continue
              state.doc.nodesBetween(comment.from, comment.to, (node, pos) => {
                if (!node.isText) return
                const from = Math.max(pos, comment.from)
                const to = Math.min(pos + node.nodeSize, comment.to)
                if (from < to) {
                  decorations.push(Decoration.inline(from, to, {
                    class: 'comment-highlight',
                    'data-comment-id': comment.id
                  }))
                }
              })
              decorations.push(Decoration.widget(comment.to, () => createCommentMarker(comment.id), {
                side: 1,
                key: `comment-marker-${comment.id}`
              }))
            }
            return DecorationSet.create(state.doc, decorations)
          }
        }
      })]
    }
  })
}
