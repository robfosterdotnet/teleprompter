import { act, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useScriptBuilder } from './useScriptBuilder'
import { useScriptBuilderStore } from '@/store/scriptBuilderStore'
import { useScriptLibraryStore } from '@/store/scriptLibraryStore'
import { resetScriptBuilderStore, resetScriptLibraryStore } from '@/test/testUtils'
import type { ScriptDraft } from '@/types/script'
import type { ScriptBuilderRequest } from '@/types/scriptBuilder'
import { extractPlainText } from '@/services/fileExtractors'
import { generateScript } from '@/services/aiScriptBuilderClient'

type GenerateScriptOptions = Parameters<typeof generateScript>[1]

vi.mock('@/services/fileExtractors', () => ({
  extractPlainText: vi.fn(),
}))

vi.mock('@/services/aiScriptBuilderClient', () => ({
  generateScript: vi.fn(),
}))

const readySource = {
  filename: 'notes.txt',
  mimeType: 'text/plain',
  charCount: 120,
  preview: 'notes...',
  content: 'notes full content',
  status: 'ready' as const,
  id: 'source-ready',
  errorMessage: undefined,
}

const buildDraft = (overrides: Partial<ScriptDraft> = {}): ScriptDraft => ({
  id: 'draft-1',
  title: 'All Hands',
  outline: ['Intro', 'Pitch'],
  content: 'Intro\n\nPitch',
  createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
  updatedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
  summary: 'Summary',
  sources: [],
  modelConfig: { model: 'gpt' },
  ...overrides,
})

describe('useScriptBuilder', () => {
  beforeEach(() => {
    resetScriptBuilderStore()
    resetScriptLibraryStore()
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('ingests files and updates placeholder sources', async () => {
    vi.mocked(extractPlainText).mockResolvedValue(readySource)
    const file = new File(['hello'], 'notes.txt', { type: 'text/plain' })
    const { result } = renderHook(() => useScriptBuilder())

    await act(async () => {
      await result.current.ingestFiles([file])
    })

    const sources = useScriptBuilderStore.getState().sources
    expect(sources).toHaveLength(1)
    expect(sources[0]).toMatchObject({
      filename: 'notes.txt',
      status: 'ready',
      charCount: readySource.charCount,
    })
    expect(extractPlainText).toHaveBeenCalledWith(file)
  })

  it('marks sources as errored when extraction fails', async () => {
    vi.mocked(extractPlainText).mockRejectedValue(new Error('Parse failed'))
    const file = new File(['bad'], 'broken.txt', { type: 'text/plain' })
    const { result } = renderHook(() => useScriptBuilder())

    await act(async () => {
      await result.current.ingestFiles([file])
    })

    const source = useScriptBuilderStore.getState().sources[0]
    expect(source.status).toBe('error')
    expect(source.errorMessage).toBe('Parse failed')
  })

  it('enforces the maximum number of allowed sources', async () => {
    useScriptBuilderStore.setState((state) => ({
      ...state,
      sources: Array.from({ length: 5 }).map((_, index) => ({
        ...readySource,
        id: `seed-${index}`,
      })),
    }))
    const { result } = renderHook(() => useScriptBuilder())

    await act(async () => {
      await result.current.ingestFiles([new File(['x'], 'extra.txt')])
    })

    expect(useScriptBuilderStore.getState().lastError).toBe(
      'You can attach up to 5 files. Remove one to continue.',
    )
    expect(extractPlainText).not.toHaveBeenCalled()
  })

  it('builds scripts, streams chunks, and saves drafts to the library', async () => {
    vi.mocked(generateScript).mockImplementation(
      (_payload: ScriptBuilderRequest, options?: GenerateScriptOptions) => {
        options?.onEvent?.({ type: 'progress', progress: 0.4, message: 'working' })
        options?.onEvent?.({ type: 'chunk', content: 'Partial draft' })
        return Promise.resolve({
          draft: buildDraft(),
          usage: { inputTokens: 10 },
          requestId: 'req-42',
        })
      },
    )
    useScriptBuilderStore.setState((state) => ({
      ...state,
      prompt: { ...state.prompt, topic: 'Town hall' },
      sources: [readySource],
    }))
    const { result } = renderHook(() => useScriptBuilder())

    await act(async () => {
      const generated = await result.current.buildScript()
      expect(generated?.id).toBe('draft-1')
    })

    expect(generateScript).toHaveBeenCalledWith(
      expect.objectContaining({
        topic: 'Town hall',
        sources: [
          expect.objectContaining({
            id: readySource.id,
            filename: readySource.filename,
          }),
        ],
      }),
      expect.objectContaining<NonNullable<GenerateScriptOptions>>({
        onEvent: expect.any(Function) as NonNullable<GenerateScriptOptions>['onEvent'],
        signal: expect.any(AbortSignal) as NonNullable<GenerateScriptOptions>['signal'],
      }),
    )

    expect(useScriptLibraryStore.getState().orderedIds[0]).toBe('draft-1')
    expect(useScriptBuilderStore.getState().status).toBe('ready')
    expect(useScriptBuilderStore.getState().partialContent.trim()).toBe('Partial draft')
  })

  it('records validation errors when the prompt is incomplete', async () => {
    const { result } = renderHook(() => useScriptBuilder())

    await act(async () => {
      const output = await result.current.buildScript()
      expect(output).toBeNull()
    })

    expect(useScriptBuilderStore.getState().lastError).toBe(
      'Add a topic before generating a script',
    )
    expect(useScriptBuilderStore.getState().status).toBe('error')
  })

  it('cancels in-flight requests via AbortController', async () => {
    let rejectPromise: ((reason?: unknown) => void) | null = null
    let receivedSignal: AbortSignal | null = null
    useScriptBuilderStore.setState((state) => ({
      ...state,
      prompt: { ...state.prompt, topic: 'Town hall' },
      sources: [readySource],
    }))
    vi.mocked(generateScript).mockImplementation((_payload, options) => {
      receivedSignal = options?.signal ?? null
      return new Promise((_resolve, reject) => {
        rejectPromise = reject
      })
    })
    const { result } = renderHook(() => useScriptBuilder())

    let buildPromise: Promise<ScriptDraft | null> | null = null
    await act(async () => {
      buildPromise = result.current.buildScript()
      await Promise.resolve()
    })

    expect(receivedSignal).toBeInstanceOf(AbortSignal)

    act(() => {
      result.current.cancelBuild()
    })

    expect(receivedSignal?.aborted).toBe(true)

    await act(async () => {
      rejectPromise?.(Object.assign(new Error('aborted'), { name: 'AbortError' }))
      await Promise.resolve()
    })

    await expect(buildPromise!).resolves.toBeNull()
    expect(result.current.statusMessage).toBe('Generation cancelled')
  })

  it('resets builder state and clears active drafts', () => {
    const { result } = renderHook(() => useScriptBuilder())
    const draft = buildDraft({ id: 'draft-reset' })

    act(() => {
      result.current.selectDraft(draft)
    })
    expect(result.current.activeDraft).toEqual(draft)

    act(() => {
      result.current.resetBuilder()
    })

    expect(result.current.activeDraft).toBeNull()
    expect(useScriptBuilderStore.getState().sources).toHaveLength(0)
    expect(result.current.statusMessage).toBeNull()
  })
})
