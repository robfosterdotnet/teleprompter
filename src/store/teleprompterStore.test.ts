import { describe, expect, it, beforeEach } from 'vitest'
import { SAMPLE_SCRIPT } from '@/data/sampleScript'
import { TELEPROMPTER_STORAGE_KEY, useTeleprompterStore } from './teleprompterStore'

describe('teleprompter store', () => {
  beforeEach(() => {
    useTeleprompterStore.getState().reset()
    useTeleprompterStore.persist?.clearStorage?.()
    window.localStorage.clear()
  })

  it('activates the first segment of a newly loaded script', () => {
    const script = {
      ...SAMPLE_SCRIPT,
      id: 'fresh',
      segments: [
        { id: 'seg-a', title: 'A', body: 'hello' },
        { id: 'seg-b', title: 'B', body: 'world' },
      ],
    }

    useTeleprompterStore.getState().setScript(script)

    expect(useTeleprompterStore.getState().playback.activeSegmentId).toBe('seg-a')
  })

  it('clamps the playback speed to supported bounds', () => {
    useTeleprompterStore.getState().setSpeed(99)
    expect(useTeleprompterStore.getState().playback.speedMultiplier).toBe(3)

    useTeleprompterStore.getState().setSpeed(0.01)
    expect(useTeleprompterStore.getState().playback.speedMultiplier).toBe(0.25)
  })

  it('nudges speed relative to the existing value and respects clamps', () => {
    useTeleprompterStore.getState().setSpeed(1)
    useTeleprompterStore.getState().nudgeSpeed(0.2)
    expect(useTeleprompterStore.getState().playback.speedMultiplier).toBe(1.2)

    useTeleprompterStore.getState().nudgeSpeed(10)
    expect(useTeleprompterStore.getState().playback.speedMultiplier).toBe(3)
  })

  it('moves active segment forward and backward', () => {
    useTeleprompterStore.getState().setScript(SAMPLE_SCRIPT)
    useTeleprompterStore.getState().jumpToSegment(SAMPLE_SCRIPT.segments[1].id)
    useTeleprompterStore.getState().jumpToNextSegment()
    expect(useTeleprompterStore.getState().playback.activeSegmentId).toBe(
      SAMPLE_SCRIPT.segments[2].id,
    )

    useTeleprompterStore.getState().jumpToPreviousSegment()
    expect(useTeleprompterStore.getState().playback.activeSegmentId).toBe(
      SAMPLE_SCRIPT.segments[1].id,
    )
  })

  it('persists updates to localStorage', () => {
    useTeleprompterStore.getState().setPreferences({ theme: 'light' })
    const storedValue = window.localStorage.getItem(TELEPROMPTER_STORAGE_KEY)

    interface PersistedPayload {
      state: {
        preferences: {
          theme: string
        }
      }
    }

    const parsed: PersistedPayload | null = storedValue
      ? (JSON.parse(storedValue) as PersistedPayload)
      : null

    expect(parsed?.state.preferences.theme).toBe('light')
  })

  it('updates notes for a given segment', () => {
    const [target] = SAMPLE_SCRIPT.segments
    useTeleprompterStore.getState().updateSegmentNotes(target.id, 'Remember sponsor plug')
    const refreshed = useTeleprompterStore
      .getState()
      .script.segments.find((segment) => segment.id === target.id)

    expect(refreshed?.notes).toBe('Remember sponsor plug')
  })

  it('clamps typography preferences to supported ranges', () => {
    useTeleprompterStore.getState().setPreferences({
      fontSizeScale: 9,
      lineHeightScale: 0.25,
    })

    expect(useTeleprompterStore.getState().preferences).toMatchObject({
      fontSizeScale: 2,
      lineHeightScale: 1,
    })
  })

  it('ignores jump requests for unknown segment ids', () => {
    const initialId = useTeleprompterStore.getState().playback.activeSegmentId
    useTeleprompterStore.getState().jumpToSegment('nope')
    expect(useTeleprompterStore.getState().playback.activeSegmentId).toBe(initialId)
  })
})
