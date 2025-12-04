import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { generateScript } from './aiScriptBuilderClient'
import type { ScriptBuilderRequest } from '@/types/scriptBuilder'
import type { ScriptDraft } from '@/types/script'

const basePayload: ScriptBuilderRequest = {
  topic: 'Launch',
  guidance: 'Keep it short',
  tone: 'neutral',
  style: 'news',
  outlinePreference: 'tight',
  sources: [
    {
      id: 'source-1',
      filename: 'brief.txt',
      mimeType: 'text/plain',
      charCount: 42,
      text: 'hello world',
    },
  ],
}

const draft: ScriptDraft = {
  id: 'draft-1',
  title: 'Launch Draft',
  outline: ['Intro'],
  content: 'Intro\n\nDetails',
  summary: 'Summary',
  createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
  updatedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
  sources: [],
  modelConfig: { model: 'gpt' },
}

const encodeEvent = (event: Record<string, unknown>) => {
  const encoder = new TextEncoder()
  return encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
}

const buildStreamResponse = (events: Record<string, unknown>[], init?: ResponseInit) =>
  new Response(
    new ReadableStream({
      start(controller) {
        for (const event of events) {
          controller.enqueue(encodeEvent(event))
        }
        controller.close()
      },
    }),
    { status: 200, headers: { 'Content-Type': 'text/event-stream' }, ...init },
  )

describe('generateScript', () => {
  const fetchMock = vi.fn()

  beforeEach(() => {
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('streams events and resolves with the completed draft', async () => {
    const events = [
      { type: 'progress', progress: 0.5, message: 'Halfway' },
      { type: 'chunk', content: 'Hello' },
      { type: 'complete', draft, usage: { inputTokens: 10 }, requestId: 'req-1' },
    ]
    fetchMock.mockResolvedValue(buildStreamResponse(events))

    const handler = vi.fn()
    const controller = new AbortController()
    const result = await generateScript(basePayload, {
      onEvent: handler,
      signal: controller.signal,
    })

    expect(fetchMock).toHaveBeenCalledWith('/.netlify/functions/ai-script-builder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(basePayload),
      signal: controller.signal,
    })
    expect(handler).toHaveBeenCalledTimes(3)
    expect(handler).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: 'complete', draft }),
    )
    expect(result).toEqual({
      draft,
      usage: { inputTokens: 10 },
      requestId: 'req-1',
    })
  })

  it('surfaces API error payloads when the response is not ok', async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 429,
      json: vi.fn().mockResolvedValue({ error: { message: 'Quota exceeded' } }),
    } as unknown as Response)

    await expect(generateScript(basePayload)).rejects.toThrow('Quota exceeded')
  })

  it('throws when the stream ends without a completion payload', async () => {
    const events = [{ type: 'chunk', content: 'Still going' }]
    fetchMock.mockResolvedValue(buildStreamResponse(events))

    await expect(generateScript(basePayload)).rejects.toThrow(
      'Generation stream ended without a payload',
    )
  })

  it('throws when the stream yields an explicit error event', async () => {
    const events = [{ type: 'error', message: 'Provider failure' }]
    fetchMock.mockResolvedValue(buildStreamResponse(events))

    await expect(generateScript(basePayload)).rejects.toThrow('Provider failure')
  })
})
