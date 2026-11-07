import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export const autocompleteGhostKey = new PluginKey('autocompleteGhost')

export const AutocompleteGhost = Extension.create({
  name: 'autocompleteGhost',

  addCommands() {
    return {
      showAutocompleteGhost: ({ position, text }) => ({ tr, dispatch }) => {
        if (dispatch) tr.setMeta(autocompleteGhostKey, { type: 'show', position, text })
        return true
      },
      clearAutocompleteGhost: () => ({ tr, dispatch }) => {
        if (dispatch) tr.setMeta(autocompleteGhostKey, { type: 'clear' })
        return true
      }
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: autocompleteGhostKey,
        state: {
          init: () => null,
          apply(tr, value) {
            const action = tr.getMeta(autocompleteGhostKey)
            if (action?.type === 'show') {
              return { position: action.position, text: action.text }
            }
            if (action?.type === 'clear' || tr.selectionSet) return null
            if (tr.getMeta('grammarDecorations') && value) {
              return { ...value, position: tr.mapping.map(value.position) }
            }
            if (tr.docChanged) return null
            return value
          }
        },
        props: {
          decorations(state) {
            const suggestion = autocompleteGhostKey.getState(state)
            if (!suggestion?.text || suggestion.position > state.doc.content.size) return null
            const widget = Decoration.widget(suggestion.position, () => {
              const container = document.createElement('span')
              container.className = 'autocomplete-ghost'
              container.setAttribute('aria-hidden', 'true')
              container.contentEditable = 'false'

              const text = document.createElement('span')
              text.className = 'autocomplete-ghost__text'
              text.textContent = suggestion.text
              container.appendChild(text)

              const hint = document.createElement('span')
              hint.className = 'autocomplete-ghost__hint'
              hint.textContent = 'Tab'
              container.appendChild(hint)
              return container
            }, { side: 1, key: 'autocomplete-ghost' })
            return DecorationSet.create(state.doc, [widget])
          }
        }
      })
    ]
  }
})
