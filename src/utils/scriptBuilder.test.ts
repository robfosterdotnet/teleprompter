import { describe, expect, it } from 'vitest'
import type { ScriptDraft } from '@/types/script'
import { draftToScript } from './scriptBuilder'

const baseDraft: ScriptDraft = {
  id: 'draft-123',
  title: 'Launch rundown',
  outline: ['Hook', 'Body'],
  content: 'Hook\nOpen the show\n\nBody\nShare details',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  sources: [],
  modelConfig: {
    model: 'gpt-5-nano',
    temperature: 0.4,
    maxTokens: 1800,
  },
}

describe('draftToScript', () => {
  it('converts draft content into teleprompter segments', () => {
    const script = draftToScript(baseDraft)
    expect(script.metadata.title).toBe('Launch rundown')
    expect(script.segments).toHaveLength(2)
    expect(script.segments[0]?.title).toBe('Hook')
    expect(script.segments[0]?.body).toContain('Open the show')
  })

  it('falls back gracefully when outline is missing', () => {
    const script = draftToScript({ ...baseDraft, outline: [] })
    expect(script.segments[0]?.title).toBe('Hook')
  })
})
