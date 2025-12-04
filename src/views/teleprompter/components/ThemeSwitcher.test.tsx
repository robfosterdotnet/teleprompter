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

    const darkButton = screen.getByRole('button', { name: /dark/i })
    const lightButton = screen.getByRole('button', { name: /light/i })

    expect(darkButton).toHaveAttribute('aria-pressed', 'true')
    expect(lightButton).toHaveAttribute('aria-pressed', 'false')

    await user.click(lightButton)
    expect(useTeleprompterStore.getState().preferences.theme).toBe('light')
    expect(lightButton).toHaveAttribute('aria-pressed', 'true')
  })
})
