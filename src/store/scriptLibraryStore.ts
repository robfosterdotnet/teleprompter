import type { ScriptDraft } from '@/types/script'
import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

const STORAGE_KEY = 'teleprompter.script-library.v1'

const isBrowser = () => typeof window !== 'undefined'

interface ScriptLibraryState {
  drafts: Record<string, ScriptDraft>
  orderedIds: string[]
  activeDraftId: string | null
  saveDraft: (draft: ScriptDraft) => void
  deleteDraft: (draftId: string) => void
  duplicateDraft: (draftId: string) => string | null
  setActiveDraft: (draftId: string | null) => void
  renameDraft: (draftId: string, title: string) => void
  clearLibrary: () => void
}

const withTimestamps = (draft: ScriptDraft): ScriptDraft => {
  const now = new Date().toISOString()
  return {
    ...draft,
    createdAt: draft.createdAt || now,
    updatedAt: now,
  }
}

const ensureId = (draft: ScriptDraft): ScriptDraft => {
  if (draft.id) return draft
  const id = `draft-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`
  return { ...draft, id }
}

const createEmptyState = (): Omit<
  ScriptLibraryState,
  | 'saveDraft'
  | 'deleteDraft'
  | 'duplicateDraft'
  | 'setActiveDraft'
  | 'renameDraft'
  | 'clearLibrary'
> => ({
  drafts: {},
  orderedIds: [],
  activeDraftId: null,
})

export const useScriptLibraryStore = create<ScriptLibraryState>()(
  persist(
    (set, get) => ({
      ...createEmptyState(),
      saveDraft: (incomingDraft) =>
        set((state) => {
          const draft = withTimestamps(ensureId(incomingDraft))
          const drafts = { ...state.drafts, [draft.id]: draft }
          const filteredOrder = state.orderedIds.filter((id) => id !== draft.id)
          const orderedIds = [draft.id, ...filteredOrder]
          return { drafts, orderedIds, activeDraftId: draft.id }
        }),
      deleteDraft: (draftId) =>
        set((state) => {
          if (!state.drafts[draftId]) return state
          const drafts = { ...state.drafts }
          delete drafts[draftId]
          const orderedIds = state.orderedIds.filter((id) => id !== draftId)
          const activeDraftId =
            state.activeDraftId === draftId
              ? (orderedIds[0] ?? null)
              : state.activeDraftId
          return { drafts, orderedIds, activeDraftId }
        }),
      duplicateDraft: (draftId) => {
        const draft = get().drafts[draftId]
        if (!draft) return null
        const clone: ScriptDraft = {
          ...draft,
          id: `draft-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`,
          title: `${draft.title} (copy)`,
          createdAt: '',
          updatedAt: '',
        }
        get().saveDraft(clone)
        return clone.id
      },
      setActiveDraft: (draftId) =>
        set((state) => {
          if (draftId && !state.drafts[draftId]) {
            return state
          }
          return { activeDraftId: draftId }
        }),
      renameDraft: (draftId, title) =>
        set((state) => {
          const draft = state.drafts[draftId]
          if (!draft) return state
          const updated = withTimestamps({ ...draft, title })
          return {
            drafts: {
              ...state.drafts,
              [draftId]: updated,
            },
          }
        }),
      clearLibrary: () => set(() => createEmptyState()),
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() =>
        isBrowser()
          ? window.localStorage
          : {
              getItem: () => null,
              setItem: () => undefined,
              removeItem: () => undefined,
            },
      ),
      version: 1,
    },
  ),
)

export const selectDraftList = (state: ScriptLibraryState) =>
  state.orderedIds.map((id) => state.drafts[id]).filter(Boolean)

export const selectActiveDraft = (state: ScriptLibraryState) =>
  state.activeDraftId ? (state.drafts[state.activeDraftId] ?? null) : null
