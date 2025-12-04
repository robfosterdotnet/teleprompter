import { render } from '@testing-library/react'
import { act } from 'react'
import { usePrompterHotkeys } from './usePrompterHotkeys'
import { resetTeleprompterStore } from '@/test/testUtils'
import { useTeleprompterStore } from '@/store/teleprompterStore'

const HotkeyHarness = () => {
  usePrompterHotkeys()
  return null
}

describe('usePrompterHotkeys', () => {
  beforeEach(() => {
    resetTeleprompterStore()
  })

  it('toggles playback and nudges speed via keyboard shortcuts', () => {
    render(<HotkeyHarness />)

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }))
      window.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowUp', bubbles: true }),
      )
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'j', bubbles: true }))
    })

    const state = useTeleprompterStore.getState()
    expect(state.playback.isPlaying).toBe(true)
    expect(state.playback.speedMultiplier).toBeGreaterThan(1)
    expect(state.playback.activeSegmentId).not.toBe(
      state.script.segments[0]?.id ?? 'opening-hook',
    )
  })

  it('ignores hotkeys when typing inside form fields', () => {
    render(<HotkeyHarness />)

    const input = document.createElement('input')
    document.body.appendChild(input)

    act(() => {
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }),
      )
    })

    expect(useTeleprompterStore.getState().playback.speedMultiplier).toBe(1)
    document.body.removeChild(input)
  })
})
