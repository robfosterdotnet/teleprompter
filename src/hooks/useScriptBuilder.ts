import { useCallback, useMemo, useRef, useState } from 'react'
import { extractPlainText } from '@/services/fileExtractors'
import { generateScript } from '@/services/aiScriptBuilderClient'
import { useScriptBuilderStore } from '@/store/scriptBuilderStore'
import { useScriptLibraryStore } from '@/store/scriptLibraryStore'
import type { ScriptDraft, ScriptSource } from '@/types/script'
import type { ScriptBuilderRequest } from '@/types/scriptBuilder'

const MAX_SOURCES = 5

const createPlaceholderSource = (file: File): ScriptSource => ({
  id: `source-${crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)}`,
  filename: file.name,
  mimeType: file.type || 'application/octet-stream',
  charCount: 0,
  preview: '',
  content: '',
  status: 'parsing',
})

export function useScriptBuilder() {
  const sources = useScriptBuilderStore((state) => state.sources)
  const prompt = useScriptBuilderStore((state) => state.prompt)
  const status = useScriptBuilderStore((state) => state.status)
  const progress = useScriptBuilderStore((state) => state.progress)
  const lastError = useScriptBuilderStore((state) => state.lastError)
  const partialContent = useScriptBuilderStore((state) => state.partialContent)
  const setPrompt = useScriptBuilderStore((state) => state.setPrompt)
  const addSource = useScriptBuilderStore((state) => state.addSource)
  const updateSource = useScriptBuilderStore((state) => state.updateSource)
  const removeSource = useScriptBuilderStore((state) => state.removeSource)
  const setStatus = useScriptBuilderStore((state) => state.setStatus)
  const appendContent = useScriptBuilderStore((state) => state.appendContent)
  const clearContent = useScriptBuilderStore((state) => state.clearContent)
  const resetBuilderStore = useScriptBuilderStore((state) => state.reset)
  const setError = useScriptBuilderStore((state) => state.setError)
  const saveDraftToLibrary = useScriptLibraryStore((state) => state.saveDraft)

  const [activeDraft, setActiveDraft] = useState<ScriptDraft | null>(null)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const sourceCount = sources.length

  const readySources = useMemo(
    () => sources.filter((source) => source.status === 'ready'),
    [sources],
  )

  const estimatedTokens = useMemo(() => {
    const charSum = readySources.reduce((total, source) => total + source.charCount, 0)
    return Math.round(charSum / 4)
  }, [readySources])

  const ingestFiles = useCallback(
    async (incoming: FileList | File[]) => {
      const availableSlots = Math.max(0, MAX_SOURCES - sourceCount)
      if (!availableSlots) {
        setError('You can attach up to 5 files. Remove one to continue.')
        return
      }
      const files = Array.from(incoming).slice(0, availableSlots)
      await Promise.all(
        files.map(async (file) => {
          const placeholder = createPlaceholderSource(file)
          addSource(placeholder)
          try {
            const extracted = await extractPlainText(file)
            updateSource(placeholder.id, {
              filename: extracted.filename,
              mimeType: extracted.mimeType,
              charCount: extracted.charCount,
              preview: extracted.preview,
              content: extracted.content,
              status: 'ready',
              errorMessage: undefined,
            })
          } catch (error) {
            updateSource(placeholder.id, {
              status: 'error',
              errorMessage: (error as Error).message ?? 'Failed to extract file',
            })
          }
        }),
      )
    },
    [addSource, setError, sourceCount, updateSource],
  )

  const buildPayload = useCallback((): ScriptBuilderRequest => {
    if (!prompt.topic.trim()) {
      throw new Error('Add a topic before generating a script')
    }
    return {
      ...prompt,
      sources: readySources.map((source) => ({
        id: source.id,
        filename: source.filename,
        mimeType: source.mimeType,
        charCount: source.charCount,
        text: source.content,
      })),
    }
  }, [prompt, readySources])

  const buildScript = useCallback(async () => {
    try {
      const payload = buildPayload()
      const controller = new AbortController()
      abortRef.current = controller
      clearContent()
      setStatus('streaming', 0.15)
      setStatusMessage('Sending context to Azure OpenAI…')
      const response = await generateScript(payload, {
        signal: controller.signal,
        onEvent: (event) => {
          if (event.type === 'progress') {
            setStatus('streaming', event.progress)
            setStatusMessage(event.message ?? null)
          }
          if (event.type === 'chunk' && event.content) {
            appendContent(`${event.content}\n`)
          }
        },
      })
      setActiveDraft(response.draft)
      saveDraftToLibrary(response.draft)
      setStatus('ready', 1)
      setStatusMessage('Draft ready')
      return response.draft
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') {
        setStatusMessage('Generation cancelled')
      } else {
        setStatusMessage(null)
        setError((error as Error).message ?? 'Failed to generate script')
      }
      return null
    } finally {
      abortRef.current = null
    }
  }, [appendContent, buildPayload, clearContent, saveDraftToLibrary, setError, setStatus])

  const cancelBuild = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setStatus('idle', 0)
    setStatusMessage('Generation cancelled')
  }, [setStatus])

  const resetBuilder = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    resetBuilderStore()
    setActiveDraft(null)
    setStatusMessage(null)
  }, [resetBuilderStore])

  const selectDraft = useCallback(
    (draft: ScriptDraft) => {
      setActiveDraft(draft)
      setStatus('ready', 1)
      setStatusMessage('Draft loaded from library')
    },
    [setStatus],
  )

  return {
    sources,
    readySources,
    prompt,
    status,
    progress,
    lastError,
    statusMessage,
    partialContent,
    activeDraft,
    estimatedTokens,
    maxSources: MAX_SOURCES,
    ingestFiles,
    removeSource,
    setPrompt,
    buildScript,
    cancelBuild,
    resetBuilder,
    selectDraft,
  }
}
