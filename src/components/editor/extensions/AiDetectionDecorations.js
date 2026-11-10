import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'


export const aiDetectionDecorationsKey = new PluginKey('aiDetectionDecorations')

export const AiDetectionDecorations = Extension.create({
  name: 'aiDetectionDecorations',

  addCommands() {
    return {
      setAiDetectionHighlights: ranges => ({ tr, dispatch }) => {
        if (dispatch) tr.setMeta(aiDetectionDecorationsKey, { action: 'set', ranges })
        return true
      },
      clearAiDetectionHighlights: () => ({ tr, dispatch }) => {
        if (dispatch) tr.setMeta(aiDetectionDecorationsKey, { action: 'clear' })
        return true
      }
    }
  },

  addProseMirrorPlugins() {
    return [new Plugin({
      key: aiDetectionDecorationsKey,
      state: {
        init: () => DecorationSet.empty,
        apply(tr, current) {
          const meta = tr.getMeta(aiDetectionDecorationsKey)
          if (!meta) return current.map(tr.mapping, tr.doc)
          if (meta.action === 'clear') return DecorationSet.empty
          const decorations = (Array.isArray(meta.ranges) ? meta.ranges : [])
            .filter(range => (
              Number.isInteger(range.from) && Number.isInteger(range.to) &&
              range.from >= 0 && range.from < range.to && range.to <= tr.doc.content.size
            ))
            .map((range, index) => Decoration.inline(range.from, range.to, {
              class: 'ai-detected-passage',
              'data-ai-segment': String(index)
            }))
          return DecorationSet.create(tr.doc, decorations)
        }
      },
      props: {
        decorations(state) {
          return aiDetectionDecorationsKey.getState(state)
        }
      }
    })]
  }
})
