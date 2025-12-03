import { render, screen } from '@testing-library/react'
import App from './App'

describe('App', () => {
  it('renders the teleprompter headline and segments', () => {
    render(<App />)

    expect(
      screen.getByRole('heading', { name: /webcast rehearsal sandbox/i }),
    ).toBeInTheDocument()
    expect(screen.getAllByText(/segment/i).length).toBeGreaterThan(0)
  })
})
