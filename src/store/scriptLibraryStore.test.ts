import { beforeEach, describe, expect, it } from 'vitest'
import type { ScriptDraft } from '@/types/script'
import { selectDraftList, useScriptLibraryStore } from './scriptLibraryStore'

const createDraft = (overrides: Partial<ScriptDraft> = {}): ScriptDraft => ({
  id: overrides.id ?? `draft-${Math.random().toString(36).slice(2)}`,
  title: overrides.title ?? 'Sample draft',
  outline: overrides.outline ?? ['Intro', 'Body'],
  content: overrides.content ?? 'Intro\nHello world\n\nBody\nDetails',
  createdAt: overrides.createdAt ?? new Date().toISOString(),
  updatedAt: overrides.updatedAt ?? new Date().toISOString(),
  sources: overrides.sources ?? [],
  modelConfig: overrides.modelConfig ?? {
    model: 'gpt-5-nano',
    temperature: 0.4,
    maxTokens: 1800,
  },
})

describe('scriptLibraryStore', () => {
  beforeEach(() => {
    useScriptLibraryStore.getState().clearLibrary()
    useScriptLibraryStore.persist?.clearStorage?.()
  })

  it('saves drafts and exposes an ordered list', () => {
    const first = createDraft({ id: 'first', title: 'First draft' })
    const second = createDraft({ id: 'second', title: 'Second draft' })

    useScriptLibraryStore.getState().saveDraft(first)
    useScriptLibraryStore.getState().saveDraft(second)

    const drafts = selectDraftList(useScriptLibraryStore.getState())
    expect(drafts[0]?.id).toBe('second')
    expect(drafts[1]?.id).toBe('first')
  })

  it('duplicates a draft with a new id', () => {
    const draft = createDraft({ id: 'original', title: 'Original' })
    useScriptLibraryStore.getState().saveDraft(draft)
    const duplicateId = useScriptLibraryStore.getState().duplicateDraft('original')

    expect(duplicateId).toBeTruthy()
    const drafts = selectDraftList(useScriptLibraryStore.getState())
    expect(drafts).toHaveLength(2)
  })

  it('deletes drafts and updates active selection', () => {
    const draft = createDraft({ id: 'to-delete' })
    useScriptLibraryStore.getState().saveDraft(draft)
    useScriptLibraryStore.getState().deleteDraft('to-delete')
    expect(selectDraftList(useScriptLibraryStore.getState())).toHaveLength(0)
  })
})
