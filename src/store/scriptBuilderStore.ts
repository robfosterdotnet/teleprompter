import type { ScriptSource } from '@/types/script'
import type { ScriptBuilderPrompt } from '@/types/scriptBuilder'
import { create } from 'zustand'

export type BuilderStatus = 'idle' | 'extracting' | 'ready' | 'streaming' | 'error'

interface ScriptBuilderState {
  sources: ScriptSource[]
  prompt: ScriptBuilderPrompt
  status: BuilderStatus
  progress: number
  lastError?: string
  partialContent: string
  setPrompt: (partial: Partial<ScriptBuilderPrompt>) => void
  addSource: (source: ScriptSource) => void
  updateSource: (id: string, partial: Partial<ScriptSource>) => void
  removeSource: (id: string) => void
  resetSources: () => void
  setStatus: (status: BuilderStatus, progress?: number) => void
  appendContent: (chunk: string) => void
  clearContent: () => void
  reset: () => void
  setError: (message: string) => void
}

const defaultPrompt: ScriptBuilderPrompt = {
  topic: '',
  guidance: '',
  tone: 'neutral',
  style: 'news',
  outlinePreference: 'tight',
}

const clonePrompt = () => ({ ...defaultPrompt })

export const useScriptBuilderStore = create<ScriptBuilderState>()((set) => ({
  sources: [],
  prompt: clonePrompt(),
  status: 'idle',
  progress: 0,
  partialContent: '',
  lastError: undefined,
  setPrompt: (partial) =>
    set((state) => ({
      prompt: {
        ...state.prompt,
        ...partial,
      },
    })),
  addSource: (source) =>
    set((state) => ({
      sources: [...state.sources.filter((s) => s.id !== source.id), source],
    })),
  updateSource: (id, partial) =>
    set((state) => ({
      sources: state.sources.map((source) =>
        source.id === id
          ? {
              ...source,
              ...partial,
            }
          : source,
      ),
    })),
  removeSource: (id) =>
    set((state) => ({
      sources: state.sources.filter((source) => source.id !== id),
    })),
  resetSources: () =>
    set(() => ({
      sources: [],
    })),
  setStatus: (status, progress = 0) =>
    set((state) => ({
      status,
      progress,
      lastError: status === 'error' ? state.lastError : undefined,
    })),
  appendContent: (chunk) =>
    set((state) => ({
      partialContent: state.partialContent + chunk,
    })),
  clearContent: () =>
    set(() => ({
      partialContent: '',
    })),
  reset: () =>
    set(() => ({
      sources: [],
      prompt: clonePrompt(),
      status: 'idle',
      progress: 0,
      partialContent: '',
      lastError: undefined,
    })),
  setError: (message) =>
    set(() => ({
      lastError: message,
      status: 'error',
    })),
}))
