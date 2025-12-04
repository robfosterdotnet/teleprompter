import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useTeleprompterStore } from '@/store/teleprompterStore'
import { resetTeleprompterStore } from '@/test/testUtils'
import { ThemeSwitcher } from './ThemeSwitcher'

describe('ThemeSwitcher', () => {
  beforeEach(() => {
    resetTeleprompterStore()
  })

  it('marks the active theme and updates store preferences', async () => {
    const user = userEvent.setup()
    render(<ThemeSwitcher />)

    const defaultButton = screen.getByRole('button', { name: /default/i })
    const darkButton = screen.getByRole('button', { name: /dark/i })

    expect(defaultButton).toHaveAttribute('aria-pressed', 'true')
    expect(darkButton).toHaveAttribute('aria-pressed', 'false')

    await user.click(darkButton)
    expect(useTeleprompterStore.getState().preferences.theme).toBe('dark')
    expect(darkButton).toHaveAttribute('aria-pressed', 'true')
  })
})
