import { SAMPLE_SCRIPT } from '@/data/sampleScript'
import type { Script, SegmentId } from '@/types/script'
import {
  type PlaybackState,
  type TeleprompterPreferences,
  type TeleprompterState,
} from '@/types/teleprompter'
import { loadScriptDraft, saveScriptDraft } from '@/utils/storage'
import { create } from 'zustand'
import {
  createJSONStorage,
  persist,
  type PersistOptions,
  type StateStorage,
} from 'zustand/middleware'

const TELEPROMPTER_STORAGE_KEY = 'teleprompter-state-v2'
export const MIN_SPEED = 0.25
export const MAX_SPEED = 3
const DEFAULT_FONT_SIZE = 1
const DEFAULT_LINE_HEIGHT = 1.35

const isBrowserEnvironment = () => typeof window !== 'undefined'

const storage: StateStorage = {
  getItem: (name) => (isBrowserEnvironment() ? window.localStorage.getItem(name) : null),
  setItem: (name, value) => {
    if (isBrowserEnvironment()) {
      window.localStorage.setItem(name, value)
    }
  },
  removeItem: (name) => {
    if (isBrowserEnvironment()) {
      window.localStorage.removeItem(name)
    }
  },
}

const getDefaultState = (): TeleprompterState => {
  const storedScript = loadScriptDraft()
  const script = storedScript ?? SAMPLE_SCRIPT
  const fallbackSegmentId = script.segments[0]?.id ?? 'segment-0'

  return {
    script,
    playback: {
      isPlaying: false,
      speedMultiplier: 1,
      activeSegmentId: fallbackSegmentId,
    },
    preferences: {
      theme: 'dark',
      fontSizeScale: DEFAULT_FONT_SIZE,
      lineHeightScale: DEFAULT_LINE_HEIGHT,
      dyslexicFontEnabled: false,
      mirroredX: false,
      mirroredY: false,
    },
  }
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value))

const stampScriptMetadata = (script: Script): Script => ({
  ...script,
  metadata: {
    ...script.metadata,
    lastEditedIso: new Date().toISOString(),
  },
})

interface TeleprompterStore extends TeleprompterState {
  setScript: (script: Script) => void
  setPlayback: (partial: Partial<PlaybackState>) => void
  setPreferences: (partial: Partial<TeleprompterPreferences>) => void
  setSpeed: (speedMultiplier: number) => void
  nudgeSpeed: (delta: number) => void
  togglePlay: (forceState?: boolean) => void
  jumpToSegment: (segmentId: SegmentId) => void
  jumpToNextSegment: () => void
  jumpToPreviousSegment: () => void
  updateSegmentNotes: (segmentId: SegmentId, notes: string) => void
  reset: () => void
}

const persistOptions: PersistOptions<TeleprompterStore> = {
  name: TELEPROMPTER_STORAGE_KEY,
  version: 1,
  storage: createJSONStorage(() => storage),
}

export const useTeleprompterStore = create<TeleprompterStore>()(
  persist(
    (set) => ({
      ...getDefaultState(),
      setScript: (script) =>
        set((state) => {
          const nextScript = stampScriptMetadata(script)
          saveScriptDraft(nextScript)
          return {
            script: nextScript,
            playback: {
              ...state.playback,
              activeSegmentId:
                nextScript.segments[0]?.id ?? state.playback.activeSegmentId,
            },
          }
        }),
      setPlayback: (partial) =>
        set((state) => ({
          playback: {
            ...state.playback,
            ...partial,
          },
        })),
      setPreferences: (partial) =>
        set((state) => ({
          preferences: {
            ...state.preferences,
            ...partial,
            fontSizeScale:
              typeof partial.fontSizeScale === 'number'
                ? clamp(partial.fontSizeScale, 0.5, 2)
                : state.preferences.fontSizeScale,
            lineHeightScale:
              typeof partial.lineHeightScale === 'number'
                ? clamp(partial.lineHeightScale, 1, 2)
                : state.preferences.lineHeightScale,
          },
        })),
      setSpeed: (speedMultiplier) =>
        set((state) => ({
          playback: {
            ...state.playback,
            speedMultiplier: clamp(speedMultiplier, MIN_SPEED, MAX_SPEED),
          },
        })),
      nudgeSpeed: (delta) =>
        set((state) => ({
          playback: {
            ...state.playback,
            speedMultiplier: clamp(
              state.playback.speedMultiplier + delta,
              MIN_SPEED,
              MAX_SPEED,
            ),
          },
        })),
      togglePlay: (forceState) =>
        set((state) => ({
          playback: {
            ...state.playback,
            isPlaying:
              typeof forceState === 'boolean' ? forceState : !state.playback.isPlaying,
          },
        })),
      jumpToSegment: (segmentId) =>
        set((state) => {
          const exists = state.script.segments.some((segment) => segment.id === segmentId)
          if (!exists) {
            return state
          }
          return {
            playback: {
              ...state.playback,
              activeSegmentId: segmentId,
            },
          }
        }),
      jumpToNextSegment: () =>
        set((state) => {
          const currentIndex = state.script.segments.findIndex(
            (segment) => segment.id === state.playback.activeSegmentId,
          )
          const nextSegment = state.script.segments[currentIndex + 1]
          return nextSegment
            ? {
                playback: {
                  ...state.playback,
                  activeSegmentId: nextSegment.id,
                },
              }
            : state
        }),
      jumpToPreviousSegment: () =>
        set((state) => {
          const currentIndex = state.script.segments.findIndex(
            (segment) => segment.id === state.playback.activeSegmentId,
          )
          const prevSegment = state.script.segments[currentIndex - 1]
          return prevSegment
            ? {
                playback: {
                  ...state.playback,
                  activeSegmentId: prevSegment.id,
                },
              }
            : state
        }),
      updateSegmentNotes: (segmentId, notes) =>
        set((state) => {
          const updatedScript = stampScriptMetadata({
            ...state.script,
            segments: state.script.segments.map((segment) =>
              segment.id === segmentId ? { ...segment, notes } : segment,
            ),
          })
          saveScriptDraft(updatedScript)
          return {
            script: updatedScript,
          }
        }),
      reset: () => set(() => getDefaultState()),
    }),
    persistOptions,
  ),
)

export const selectScript = (state: TeleprompterStore) => state.script
export const selectSegments = (state: TeleprompterStore) => state.script.segments
export const selectPlayback = (state: TeleprompterStore) => state.playback
export const selectPreferences = (state: TeleprompterStore) => state.preferences
export const selectActiveSegment = (state: TeleprompterStore) =>
  state.script.segments.find((segment) => segment.id === state.playback.activeSegmentId)

export { TELEPROMPTER_STORAGE_KEY }
