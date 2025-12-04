import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ScriptBuilderView } from './ScriptBuilderView'
import { useScriptLibraryStore } from '@/store/scriptLibraryStore'
import { useTeleprompterStore } from '@/store/teleprompterStore'
import { resetScriptLibraryStore, resetTeleprompterStore } from '@/test/testUtils'
import type { ScriptDraft } from '@/types/script'
import { useScriptBuilder } from '@/hooks/useScriptBuilder'

vi.mock('@/hooks/useScriptBuilder', () => ({
  useScriptBuilder: vi.fn(),
}))

const draftToScriptMock = vi.hoisted(() =>
  vi.fn(() => ({
    id: 'script-mapped',
    metadata: {
      title: 'Mapped Draft',
      presenter: 'AI Script Builder',
      lastEditedIso: new Date('2024-01-01T00:00:00Z').toISOString(),
    },
    segments: [],
  })),
)

vi.mock('@/utils/scriptBuilder', () => ({
  draftToScript: draftToScriptMock,
}))

interface MockSource {
  id: string
  filename: string
  charCount: number
  mimeType: string
  preview: string
  content: string
  status: 'pending' | 'ready' | 'error'
  errorMessage?: string
}

interface MockBuilderState {
  sources: MockSource[]
  readySources: MockSource[]
  prompt: {
    topic: string
    guidance: string
    tone: 'neutral' | 'conversational' | 'energetic' | 'formal'
    style: 'news' | 'story' | 'interview' | 'countdown'
    outlinePreference: 'tight' | 'loose'
  }
  status: 'idle' | 'extracting' | 'ready' | 'streaming' | 'error'
  progress: number
  lastError?: string
  statusMessage: string | null
  partialContent: string
  activeDraft: ScriptDraft | null
  estimatedTokens: number
  maxSources: number
  ingestFiles: ReturnType<typeof vi.fn>
  removeSource: ReturnType<typeof vi.fn>
  setPrompt: ReturnType<typeof vi.fn>
  buildScript: ReturnType<typeof vi.fn>
  cancelBuild: ReturnType<typeof vi.fn>
  resetBuilder: ReturnType<typeof vi.fn>
  selectDraft: ReturnType<typeof vi.fn>
}

const createBuilderState = (
  overrides: Partial<MockBuilderState> = {},
): MockBuilderState => ({
  sources: [],
  readySources: [],
  prompt: {
    topic: '',
    guidance: '',
    tone: 'neutral' as const,
    style: 'news' as const,
    outlinePreference: 'tight' as const,
  },
  status: 'idle' as const,
  progress: 0,
  lastError: undefined as string | undefined,
  statusMessage: null as string | null,
  partialContent: '',
  activeDraft: null as ScriptDraft | null,
  estimatedTokens: 0,
  maxSources: 5,
  ingestFiles: vi.fn(),
  removeSource: vi.fn(),
  setPrompt: vi.fn(),
  buildScript: vi.fn(),
  cancelBuild: vi.fn(),
  resetBuilder: vi.fn(),
  selectDraft: vi.fn(),
  ...overrides,
})

const mockUseScriptBuilder = vi.mocked(useScriptBuilder)

describe('ScriptBuilderView', () => {
  beforeEach(() => {
    resetScriptLibraryStore()
    resetTeleprompterStore()
    draftToScriptMock.mockClear()
    mockUseScriptBuilder.mockReset()
  })

  it('renders the empty state and forwards prompt edits to the hook', () => {
    const builderState = createBuilderState()
    mockUseScriptBuilder.mockReturnValue(builderState)
    render(<ScriptBuilderView />)

    const topicField = screen.getByLabelText('Topic')
    fireEvent.change(topicField, { target: { value: 'Launch' } })
    expect(builderState.setPrompt).toHaveBeenLastCalledWith({ topic: 'Launch' })

    const guidanceField = screen.getByLabelText('Guidance')
    fireEvent.change(guidanceField, { target: { value: 'Keep it short' } })
    expect(builderState.setPrompt).toHaveBeenLastCalledWith({
      guidance: 'Keep it short',
    })
  })

  it('uploads files via the file input and surfaces source actions', async () => {
    const sources = [
      {
        id: 'source-1',
        filename: 'brief.txt',
        charCount: 120,
        mimeType: 'text/plain',
        preview: '',
        content: '',
        status: 'ready' as const,
      },
    ]
    const builderState = createBuilderState({
      sources,
      readySources: sources,
      estimatedTokens: 30,
      ingestFiles: vi.fn().mockResolvedValue(undefined),
      removeSource: vi.fn(),
    })
    mockUseScriptBuilder.mockReturnValue(builderState)
    const user = userEvent.setup()
    const { container } = render(<ScriptBuilderView />)

    const fileInput = container.querySelector<HTMLInputElement>('input[type="file"]')!
    const file = new File(['hello'], 'brief.txt', { type: 'text/plain' })
    await user.upload(fileInput, file)
    expect(builderState.ingestFiles).toHaveBeenCalled()

    const removeButton = screen.getByRole('button', { name: 'Remove' })
    await user.click(removeButton)
    expect(builderState.removeSource).toHaveBeenCalledWith('source-1')
  })

  it('toggles build, cancel, and reset actions based on status', async () => {
    const basePrompt = createBuilderState().prompt
    const buildState = createBuilderState({
      prompt: { ...basePrompt, topic: 'Launch' },
      status: 'idle',
      buildScript: vi.fn().mockResolvedValue(undefined),
      resetBuilder: vi.fn(),
    })
    mockUseScriptBuilder.mockReturnValue(buildState)
    const user = userEvent.setup()
    const { rerender } = render(<ScriptBuilderView />)

    const buildButton = screen.getByRole('button', { name: 'Build script' })
    await user.click(buildButton)
    expect(buildState.buildScript).toHaveBeenCalled()

    const resetButton = screen.getByRole('button', { name: 'Reset' })
    await user.click(resetButton)
    expect(buildState.resetBuilder).toHaveBeenCalled()

    const streamingState = createBuilderState({
      status: 'streaming',
      statusMessage: 'Streaming',
      partialContent: 'First chunk',
      cancelBuild: vi.fn(),
    })
    mockUseScriptBuilder.mockReturnValue(streamingState)
    rerender(<ScriptBuilderView />)

    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    await user.click(cancelButton)
    expect(streamingState.cancelBuild).toHaveBeenCalled()
    expect(screen.getByText('First chunk')).toBeInTheDocument()
  })

  it('renders active drafts, library entries, and teleprompter actions', async () => {
    const draft: ScriptDraft = {
      id: 'draft-123',
      title: 'Town hall',
      outline: ['Intro'],
      summary: 'Summary',
      content: 'Body',
      createdAt: new Date('2024-01-01T00:00:00Z').toISOString(),
      updatedAt: new Date('2024-01-01T00:00:00Z').toISOString(),
      sources: [],
      modelConfig: { model: 'gpt' },
    }
    useScriptLibraryStore.getState().saveDraft(draft)
    const deleteSpy = vi.fn()
    const duplicateSpy = vi.fn()
    useScriptLibraryStore.setState((state) => ({
      ...state,
      deleteDraft: deleteSpy,
      duplicateDraft: duplicateSpy,
    }))
    const builderState = createBuilderState({
      activeDraft: draft,
      selectDraft: vi.fn(),
    })
    mockUseScriptBuilder.mockReturnValue(builderState)
    const user = userEvent.setup()
    const teleprompterState = useTeleprompterStore.getState()
    const setScriptSpy = vi.spyOn(teleprompterState, 'setScript')

    render(<ScriptBuilderView />)

    const openButton = screen.getByRole('button', { name: 'Open' })
    await user.click(openButton)
    expect(builderState.selectDraft).toHaveBeenCalledWith(
      expect.objectContaining({ id: draft.id }),
    )

    await user.click(screen.getByRole('button', { name: 'Duplicate' }))
    expect(duplicateSpy).toHaveBeenCalledWith(draft.id)

    const deleteButtons = screen.getAllByRole('button', { name: 'Delete' })
    await user.click(deleteButtons[0])
    expect(deleteSpy).toHaveBeenCalledWith(draft.id)

    await user.click(screen.getByRole('button', { name: 'Send to teleprompter' }))
    expect(draftToScriptMock).toHaveBeenCalledWith(draft)
    expect(setScriptSpy).toHaveBeenCalledWith(draftToScriptMock.mock.results[0].value)
  })
})
