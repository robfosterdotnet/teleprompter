import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { resetTeleprompterStore } from '@/test/testUtils'
import { SegmentNavigator } from './SegmentNavigator'

describe('SegmentNavigator', () => {
  beforeEach(() => {
    resetTeleprompterStore()
  })

  it('activates a segment when its button is pressed', async () => {
    const user = userEvent.setup()
    render(<SegmentNavigator />)

    const targetButton = screen.getByRole('button', { name: /call to action/i })
    expect(targetButton).toHaveAttribute('aria-current', 'false')

    await user.click(targetButton)

    expect(targetButton).toHaveAttribute('aria-current', 'true')
  })
})
