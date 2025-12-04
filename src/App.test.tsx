import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('App', () => {
  it('renders the teleprompter headline and segments', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: /webcast rehearsal sandbox/i }),
    ).toBeInTheDocument()
    expect(screen.getAllByText(/segment/i).length).toBeGreaterThan(0)
    expect(screen.getByLabelText(/notes lane/i)).toBeInTheDocument()
  })

  it('toggles playback visual state via the start button', async () => {
    const user = userEvent.setup()
    render(<App />)

    const startButton = screen.getByRole('button', { name: /start scroll/i })
    await user.click(startButton)
    expect(screen.getByRole('button', { name: /pause scroll/i })).toBeInTheDocument()
  })

  it('allows segment jumping via the navigator buttons', async () => {
    const user = userEvent.setup()
    render(<App />)

    const featureButton = screen.getByRole('button', { name: /feature hits/i })
    await user.click(featureButton)

    const segmentSelect = screen.getByRole('combobox', { name: /jump to segment/i })
    expect(segmentSelect).toHaveValue('feature-hits')
  })

  it('switches theme classes via the theme buttons', async () => {
    const user = userEvent.setup()
    render(<App />)

    expect(document.body.classList.contains('theme-default')).toBe(true)
    const darkButton = screen.getByRole('button', { name: /dark/i })
    await user.click(darkButton)
    expect(document.body.classList.contains('theme-dark')).toBe(true)
  })

  it('toggles mirror attributes on the script pane', async () => {
    const user = userEvent.setup()
    render(<App />)

    const horizontalButton = screen.getByRole('button', { name: /horizontal/i })
    await user.click(horizontalButton)
    const scriptPane = screen.getByLabelText('Script preview')
    expect(scriptPane).toHaveAttribute('data-mirror-x', 'true')
  })

  it('renders script import/export controls', () => {
    render(<App />)
    expect(
      screen.getByRole('button', { name: /import markdown\/json/i }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /export markdown/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /export json/i })).toBeInTheDocument()
  })
})
