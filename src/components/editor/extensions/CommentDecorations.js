import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export const COMMENT_REFRESH_META = 'refreshComments'

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
            }
            return DecorationSet.create(state.doc, decorations)
          }
        }
      })]
    }
  })
}
