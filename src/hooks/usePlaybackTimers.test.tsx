import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'
import { usePlaybackTimers } from './usePlaybackTimers'
import { useTeleprompterStore } from '@/store/teleprompterStore'
import { resetTeleprompterStore } from '@/test/testUtils'

const buildScript = () => ({
  id: 'timer-test',
  metadata: {
    title: 'Timer Test',
    presenter: 'QA',
    lastEditedIso: new Date('2025-01-01T00:00:00Z').toISOString(),
  },
  segments: [
    { id: 'seg-a', title: 'Intro', body: 'one two three four five' },
    { id: 'seg-b', title: 'Next', body: 'six seven eight nine ten' },
  ],
})

const seedStore = () => {
  const script = buildScript()
  useTeleprompterStore.setState((state) => ({
    ...state,
    script,
    playback: {
      ...state.playback,
      activeSegmentId: script.segments[0].id,
      isPlaying: state.playback.isPlaying,
      speedMultiplier: 1,
    },
  }))
}

describe('usePlaybackTimers', () => {
  beforeEach(() => {
    resetTeleprompterStore()
    seedStore()
  })

  it('derives total and ETA labels from script word counts', () => {
    const { result } = renderHook(() => usePlaybackTimers())

    expect(result.current.totalLabel).toBe('00:00:04')
    expect(result.current.etaLabel).toBe('00:00:04')
  })

  it('increments elapsed time when playback is running and resets on demand', () => {
    const callbacks: FrameRequestCallback[] = []
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      callbacks.push(cb)
      return callbacks.length
    })
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined)

    useTeleprompterStore.setState((state) => ({
      ...state,
      playback: { ...state.playback, isPlaying: true },
    }))

    const { result, unmount } = renderHook(() => usePlaybackTimers())

    act(() => {
      callbacks[0](0)
    })

    act(() => {
      callbacks[1](1000)
    })

    expect(result.current.elapsedLabel).toBe('00:00:01')

    act(() => {
      result.current.resetElapsed()
    })

    expect(result.current.elapsedLabel).toBe('00:00:00')

    unmount()
    vi.restoreAllMocks()
  })
})
