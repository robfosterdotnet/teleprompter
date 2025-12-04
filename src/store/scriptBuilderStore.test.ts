import { describe, expect, it, beforeEach } from 'vitest'
import { useScriptBuilderStore } from './scriptBuilderStore'

const createSource = (overrides: Partial<ReturnType<typeof buildBaseSource>> = {}) => ({
  ...buildBaseSource(),
  ...overrides,
})

function buildBaseSource() {
  return {
    id: 'source-1',
    filename: 'alpha.txt',
    mimeType: 'text/plain',
    charCount: 0,
    preview: '',
    content: '',
    status: 'pending' as const,
  }
}

describe('useScriptBuilderStore', () => {
  beforeEach(() => {
    useScriptBuilderStore.getState().reset()
  })

  it('updates prompt fields via partial patching', () => {
    useScriptBuilderStore.getState().setPrompt({ topic: 'Launch' })
    useScriptBuilderStore.getState().setPrompt({ tone: 'energetic' })

    const prompt = useScriptBuilderStore.getState().prompt
    expect(prompt.topic).toBe('Launch')
    expect(prompt.tone).toBe('energetic')
    expect(prompt.style).toBe('news')
  })

  it('adds, updates, removes, and resets sources', () => {
    const first = createSource()
    const second = createSource({ id: 'source-2', filename: 'beta.txt' })

    useScriptBuilderStore.getState().addSource(first)
    useScriptBuilderStore.getState().addSource(second)
    useScriptBuilderStore.getState().addSource({ ...first, filename: 'duplicate.txt' })

    let sources = useScriptBuilderStore.getState().sources
    expect(sources).toHaveLength(2)
    expect(sources.find((item) => item.id === 'source-1')?.filename).toBe('duplicate.txt')

    useScriptBuilderStore.getState().updateSource('source-2', {
      status: 'ready',
      charCount: 42,
    })

    sources = useScriptBuilderStore.getState().sources
    expect(sources.find((item) => item.id === 'source-2')?.charCount).toBe(42)

    useScriptBuilderStore.getState().removeSource('source-1')
    expect(useScriptBuilderStore.getState().sources).toEqual([
      expect.objectContaining({ id: 'source-2' }),
    ])

    useScriptBuilderStore.getState().resetSources()
    expect(useScriptBuilderStore.getState().sources).toHaveLength(0)
  })

  it('tracks status, progress, and content buffers', () => {
    useScriptBuilderStore.getState().setStatus('streaming', 0.5)
    expect(useScriptBuilderStore.getState().status).toBe('streaming')
    expect(useScriptBuilderStore.getState().progress).toBe(0.5)

    useScriptBuilderStore.getState().appendContent('Hello ')
    useScriptBuilderStore.getState().appendContent('world')
    expect(useScriptBuilderStore.getState().partialContent).toBe('Hello world')

    useScriptBuilderStore.getState().clearContent()
    expect(useScriptBuilderStore.getState().partialContent).toBe('')
  })

  it('captures errors and clears them when resetting or changing status', () => {
    useScriptBuilderStore.getState().setError('Something went wrong')
    expect(useScriptBuilderStore.getState().status).toBe('error')
    expect(useScriptBuilderStore.getState().lastError).toBe('Something went wrong')

    useScriptBuilderStore.getState().setStatus('ready')
    expect(useScriptBuilderStore.getState().lastError).toBeUndefined()

    useScriptBuilderStore.getState().setError('Another issue')
    useScriptBuilderStore.getState().reset()
    expect(useScriptBuilderStore.getState().status).toBe('idle')
    expect(useScriptBuilderStore.getState().prompt.topic).toBe('')
    expect(useScriptBuilderStore.getState().sources).toHaveLength(0)
  })
})
