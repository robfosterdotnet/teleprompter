import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useTeleprompterStore } from '@/store/teleprompterStore'
import { resetTeleprompterStore } from '@/test/testUtils'
import { MirrorControls } from './MirrorControls'

describe('MirrorControls', () => {
  beforeEach(() => {
    resetTeleprompterStore()
  })

  it('toggles each axis and exposes a reset affordance', async () => {
    const user = userEvent.setup()
    render(<MirrorControls />)

    const horizontalButton = screen.getByRole('button', { name: /horizontal/i })
    const verticalButton = screen.getByRole('button', { name: /vertical/i })

    expect(horizontalButton).toHaveAttribute('aria-pressed', 'false')
    expect(verticalButton).toHaveAttribute('aria-pressed', 'false')

    await user.click(horizontalButton)
    await user.click(verticalButton)

    expect(horizontalButton).toHaveAttribute('aria-pressed', 'true')
    expect(verticalButton).toHaveAttribute('aria-pressed', 'true')
    expect(useTeleprompterStore.getState().preferences).toMatchObject({
      mirroredX: true,
      mirroredY: true,
    })

    const resetButton = screen.getByRole('button', { name: /reset/i })
    await user.click(resetButton)

    expect(horizontalButton).toHaveAttribute('aria-pressed', 'false')
    expect(verticalButton).toHaveAttribute('aria-pressed', 'false')
    expect(useTeleprompterStore.getState().preferences).toMatchObject({
      mirroredX: false,
      mirroredY: false,
    })
  })
})
